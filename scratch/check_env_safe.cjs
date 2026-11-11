const fs = require('fs');
const path = require('path');

const envPath = path.resolve('D:/Rural health Care/server/.env');
if (!fs.existsSync(envPath)) {
  console.log(JSON.stringify({ exists: false }));
  process.exit(0);
}

const content = fs.readFileSync(envPath, 'utf8');
const lines = content.split('\n');
let hasDbUrl = false;
let isNonEmpty = false;
let isPostgres = false;
let port = null;
let hasSslMode = false;
let hasPoolerIndicator = false;

for (const line of lines) {
  const trimmed = line.trim();
  if (trimmed.startsWith('DATABASE_URL=')) {
    hasDbUrl = true;
    const val = trimmed.slice('DATABASE_URL='.length).trim().replace(/^['"]|['"]$/g, '');
    if (val.length > 0) {
      isNonEmpty = true;
      if (val.startsWith('postgresql://') || val.startsWith('postgres://')) {
        isPostgres = true;
      }
      try {
        const u = new URL(val);
        port = u.port || '5432';
        hasSslMode = u.searchParams.has('sslmode');
        if (u.hostname.includes('pooler') || port === '6543') {
          hasPoolerIndicator = true;
        }
      } catch (e) {
        // invalid URL format
      }
    }
  }
}

console.log(JSON.stringify({
  exists: true,
  hasDbUrl,
  isNonEmpty,
  isPostgres,
  port,
  hasSslMode,
  hasPoolerIndicator
}));

