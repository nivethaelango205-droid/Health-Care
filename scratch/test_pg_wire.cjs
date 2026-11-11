const fs = require('fs');
const path = require('path');
const net = require('net');
const tls = require('tls');
const dns = require('dns').promises;

// Safe utility: never log sensitive details
function sanitizeError(err) {
  if (!err) return 'Unknown';
  const msg = err.message || String(err);
  // Redact passwords, users, URLs, IPs if present
  return msg
    .replace(/postgres(ql)?:\/\/[^@]+@/gi, '[redacted database connection]')
    .replace(/:[0-9]{4,6}/g, ':[PORT]');
}

async function testConnection() {
  const envPath = path.resolve('D:/Rural health Care/server/.env');
  if (!fs.existsSync(envPath)) {
    return { success: false, reason: 'server/.env file not found' };
  }

  const content = fs.readFileSync(envPath, 'utf8');
  let dbUrl = '';
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('DATABASE_URL=')) {
      dbUrl = trimmed.slice('DATABASE_URL='.length).trim().replace(/^['"]|['"]$/g, '');
      break;
    }
  }

  if (!dbUrl) {
    return { success: false, reason: 'DATABASE_URL is missing or empty in server/.env' };
  }

  let parsed;
  try {
    parsed = new URL(dbUrl);
  } catch (e) {
    return { success: false, reason: 'DATABASE_URL is not a valid URI format' };
  }

  const host = parsed.hostname;
  const port = parseInt(parsed.port || '5432', 10);
  const username = decodeURIComponent(parsed.username || 'postgres');
  const password = decodeURIComponent(parsed.password || '');
  const database = decodeURIComponent(parsed.pathname.slice(1) || 'postgres');

  // Step 1: DNS Resolution
  let resolvedIps = [];
  try {
    const lookup = await dns.lookup(host, { all: true });
    resolvedIps = lookup.map(l => ({ family: l.family, isV6: l.family === 6 }));
  } catch (err) {
    return {
      success: false,
      reason: `DNS resolution failed for database host (${err.code || 'ENOTFOUND'})`,
      details: { hostType: host.includes('supabase') ? 'Supabase' : 'Custom' }
    };
  }

  // Step 2: TCP Connection
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let isTlsEstablished = false;
    let sslSupported = false;

    const timeout = setTimeout(() => {
      socket.destroy();
      resolve({
        success: false,
        reason: 'Connection timed out after 10000ms. If using direct connection (port 5432), Supabase often requires the IPv4 Session Pooler (port 6543 / 5432) or IPv6 support.',
        hasIpv6Only: resolvedIps.every(r => r.isV6)
      });
    }, 10000);

    socket.connect(port, host, () => {
      // Step 3: SSLRequest packet
      // Packet length: 8 bytes, Code: 80877103 (0x04D2162F)
      const sslReq = Buffer.alloc(8);
      sslReq.writeInt32BE(8, 0);
      sslReq.writeInt32BE(80877103, 4);
      socket.write(sslReq);
    });

    socket.once('data', (data) => {
      const response = String.fromCharCode(data[0]);
      if (response === 'S') {
        sslSupported = true;
        // Step 4: Upgrade socket to TLS
        const tlsSocket = tls.connect({
          socket,
          servername: host,
          rejectUnauthorized: false // Supabase self-signed/custom CA support
        }, () => {
          isTlsEstablished = true;

          // Step 5: Send StartupMessage
          // Protocol 3.0 (196608)
          const params = [
            Buffer.from('user\0'),
            Buffer.from(username + '\0'),
            Buffer.from('database\0'),
            Buffer.from(database + '\0'),
            Buffer.from('client_encoding\0'),
            Buffer.from('UTF8\0'),
            Buffer.from('\0')
          ];
          const payload = Buffer.concat(params);
          const startup = Buffer.alloc(8 + payload.length);
          startup.writeInt32BE(8 + payload.length, 0);
          startup.writeInt32BE(196608, 4); // Protocol 3.0
          payload.copy(startup, 8);

          tlsSocket.write(startup);
        });

        tlsSocket.on('data', (tlsData) => {
          clearTimeout(timeout);
          const msgType = String.fromCharCode(tlsData[0]);

          if (msgType === 'R') {
            // Authentication Request
            const authType = tlsData.readInt32BE(5);
            tlsSocket.end();
            resolve({
              success: true,
              reachable: true,
              ssl: true,
              tlsEstablished: true,
              authRequested: true,
              authType: authType === 0 ? 'AuthenticationOk' :
                        authType === 3 ? 'CleartextPassword' :
                        authType === 5 ? 'MD5Password' :
                        authType === 10 ? 'SASL/SCRAM-SHA-256' : `Type(${authType})`,
              message: 'Supabase PostgreSQL server responded to StartupMessage and requested authentication'
            });
          } else if (msgType === 'E') {
            // ErrorResponse
            const errorPayload = tlsData.toString('utf8', 5);
            tlsSocket.end();

            // Check if password authentication failed vs database not found vs connection ok
            let sanitizedReason = 'PostgreSQL returned ErrorResponse';
            if (errorPayload.includes('password authentication failed')) {
              sanitizedReason = 'Authentication failed: Incorrect database password in connection string';
            } else if (errorPayload.includes('Tenant or user not found')) {
              sanitizedReason = 'Supabase Pooler: Tenant or user project reference not found';
            } else if (errorPayload.includes('database') && errorPayload.includes('does not exist')) {
              sanitizedReason = 'Target database name does not exist on Supabase instance';
            } else if (errorPayload.includes('no pg_hba.conf entry')) {
              sanitizedReason = 'Connection rejected by pg_hba.conf rules';
            }

            resolve({
              success: false,
              reachable: true, // host and port responded!
              ssl: true,
              tlsEstablished: true,
              reason: sanitizedReason
            });
          } else {
            tlsSocket.end();
            resolve({
              success: true,
              reachable: true,
              ssl: true,
              tlsEstablished: true,
              message: `PostgreSQL server responded with message type: '${msgType}'`
            });
          }
        });

        tlsSocket.on('error', (err) => {
          clearTimeout(timeout);
          resolve({
            success: false,
            reachable: true,
            ssl: true,
            tlsEstablished: false,
            reason: `TLS negotiation error: ${sanitizeError(err)}`
          });
        });
      } else {
        clearTimeout(timeout);
        socket.destroy();
        resolve({
          success: false,
          reachable: true,
          ssl: false,
          reason: 'Server does not support SSL connections (Supabase requires SSL).'
        });
      }
    });

    socket.on('error', (err) => {
      clearTimeout(timeout);
      resolve({
        success: false,
        reachable: false,
        reason: `TCP socket connection error: ${err.code || sanitizeError(err)}`
      });
    });
  });
}

testConnection().then(res => {
  console.log(JSON.stringify(res, null, 2));
  process.exit(0);
}).catch(err => {
  console.log(JSON.stringify({ success: false, reason: sanitizeError(err) }, null, 2));
  process.exit(0);
});
