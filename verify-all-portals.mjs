import { spawn } from 'node:child_process';
import WebSocket from 'ws';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  console.log('=== RURALCARE 360: FINAL PORTAL & SYSTEM VERIFICATION ===\n');

  // 1. Backend Health Check
  console.log('1. Checking Backend Health: http://127.0.0.1:4000/api/health...');
  const healthRes = await fetch('http://127.0.0.1:4000/api/health');
  const healthData = await healthRes.json();
  console.log('Backend Health Status:', healthRes.status, healthData);

  // 2. Launch headless Chrome to verify frontend portals
  console.log('\n2. Testing Frontend Routes with headless Chrome on http://localhost:5173...');
  const chromeProc = spawn(
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    [
      '--headless=new',
      '--remote-debugging-port=9227',
      '--user-data-dir=D:\\Rural health Care\\scratch\\chrome_portal_verify',
      '--window-size=1280,800',
      '--disable-extensions',
      '--no-first-run',
      '--no-default-browser-check',
      'http://localhost:5173/login',
    ],
    { stdio: 'ignore' }
  );

  let wsUrl = null;
  for (let i = 0; i < 25; i++) {
    await sleep(400);
    try {
      const res = await fetch('http://127.0.0.1:9227/json/list');
      const data = await res.json();
      const pageTarget = data.find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
      if (pageTarget) {
        wsUrl = pageTarget.webSocketDebuggerUrl;
        break;
      }
    } catch {}
  }

  if (!wsUrl) {
    chromeProc.kill();
    throw new Error('Failed to connect to Chrome on port 9227');
  }

  const ws = new WebSocket(wsUrl);
  await new Promise((resolve, reject) => {
    ws.on('open', resolve);
    ws.on('error', reject);
  });

  let idCounter = 1;
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = idCounter++;
      const handler = (data) => {
        const msg = JSON.parse(data.toString());
        if (msg.id === id) {
          ws.off('message', handler);
          if (msg.error) reject(new Error(msg.error.message));
          else resolve(msg.result);
        }
      };
      ws.on('message', handler);
      ws.send(JSON.stringify({ id, method, params }));
    });

  const evaluate = async (expr) => {
    const res = await send('Runtime.evaluate', {
      expression: expr,
      returnByValue: true,
      awaitPromise: true,
    });
    return res.result?.value;
  };

  await send('Page.enable');
  await sleep(2000);

  // Helper to test a portal login & route
  async function testPortal(roleName, buttonText, expectedPath, verifySelector) {
    console.log(`\n--- Testing ${roleName} Portal ---`);
    await evaluate(`window.location.href = '/login';`);
    await sleep(2000);

    const clickResult = await evaluate(`
      (() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('${buttonText}'));
        if (btn) {
          btn.click();
          return 'Clicked ' + btn.textContent.trim();
        }
        return 'Not found';
      })()
    `);
    console.log(`Quick login action:`, clickResult);

    for (let i = 0; i < 10; i++) {
      await sleep(500);
      const url = await evaluate('window.location.href');
      if (url && url.includes(expectedPath)) {
        break;
      }
    }

    const currentUrl = await evaluate('window.location.href');
    const hasTarget = await evaluate(`!!document.querySelector('${verifySelector}')`);
    const pageTitle = await evaluate('document.title');
    const isBlank = await evaluate('document.body.innerText.trim().length === 0');

    console.log(`URL: ${currentUrl}`);
    console.log(`Target Element (${verifySelector}): ${hasTarget ? 'FOUND' : 'MISSING'}`);
    console.log(`Is Blank Screen: ${isBlank ? 'YES (ERROR)' : 'NO (RENDERED OK)'}`);
    return !isBlank && hasTarget;
  }

  // 1. Patient Portal
  const patientOk = await testPortal('Patient', 'Patient', '/patient/dashboard', 'h2');
  console.log('Patient Portal Status:', patientOk ? 'PASS' : 'FAIL');

  // 2. Doctor Portal
  const doctorOk = await testPortal('Doctor', 'Doctor', '/doctor/dashboard', 'h2');
  console.log('Doctor Portal Status:', doctorOk ? 'PASS' : 'FAIL');

  // 3. Admin Portal
  const adminOk = await testPortal('Admin', 'Admin', '/admin/dashboard', 'h2');
  console.log('Admin Portal Status:', adminOk ? 'PASS' : 'FAIL');

  // 4. Ambulance Assistance Page (Patient)
  console.log('\n--- Testing Ambulance Assistance Page ---');
  await evaluate(`window.location.href = '/patient/ambulance';`);
  await sleep(3000);
  const ambUrl = await evaluate('window.location.href');
  const ambRendered = await evaluate(`
    ({
      hasTitle: document.body.innerText.includes('Ambulance Assistance') || document.body.innerText.includes('5 km'),
      hasEmergency112: !!document.querySelector('a[href="tel:112"]'),
      hasEmergency108: !!document.querySelector('a[href="tel:108"]'),
      isBlank: document.body.innerText.trim().length === 0
    })
  `);
  console.log('Ambulance Page URL:', ambUrl);
  console.log('Ambulance Verification:', ambRendered);

  // 5. AI Assistant Consultation Page
  console.log('\n--- Testing AI Assistant Consultation Page ---');
  await evaluate(`window.location.href = '/patient/ai-consultation';`);
  await sleep(3000);
  const aiUrl = await evaluate('window.location.href');
  const aiRendered = await evaluate(`
    ({
      hasTitle: document.body.innerText.includes('ரூரல்கேர்') || document.body.innerText.includes('Virtual Assistant'),
      hasCanvas: !!document.querySelector('canvas, svg, .relative.mx-auto'),
      isBlank: document.body.innerText.trim().length === 0
    })
  `);
  console.log('AI Page URL:', aiUrl);
  console.log('AI Page Verification:', aiRendered);

  // 6. Global AI Assistant Floating Button
  const globalLauncher = await evaluate(`
    !!document.querySelector('button[aria-label="Open RuralCare AI Assistant"]')
  `);
  console.log('Global AI Floating Launcher on Page:', globalLauncher ? 'PASS' : 'FAIL');

  ws.close();
  chromeProc.kill();
  console.log('\n=== ALL PORTAL VERIFICATIONS COMPLETED ===');
}

main().catch(e => {
  console.error('Portal verification error:', e);
  process.exit(1);
});
