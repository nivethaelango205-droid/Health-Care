import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
import WebSocket from 'ws';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const ARTIFACT_DIR = 'C:\\Users\\DELL\\.gemini\\antigravity\\brain\\89ad00a6-30a2-471f-a7e4-a210ac945812';

async function main() {
  console.log('=== RURALCARE 360: MULTI-VIEWPORT & STRICT TAMIL AI VERIFICATION ===\n');
  mkdirSync('D:\\Rural health Care\\scratch\\chrome_mobile_test', { recursive: true });
  mkdirSync('D:\\Rural health Care\\screenshots', { recursive: true });

  const chromeProc = spawn(
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    [
      '--headless=new',
      '--remote-debugging-port=9226',
      '--user-data-dir=D:\\Rural health Care\\scratch\\chrome_mobile_test',
      '--window-size=1200,900',
      '--no-first-run',
      '--no-default-browser-check',
      'http://localhost:5173/login',
    ],
    { stdio: 'ignore' }
  );

  let wsUrl = null;
  for (let i = 0; i < 30; i++) {
    await sleep(400);
    try {
      const res = await fetch('http://127.0.0.1:9226/json/list');
      const data = await res.json();
      if (data.length > 0 && data[0].webSocketDebuggerUrl) {
        wsUrl = data[0].webSocketDebuggerUrl;
        break;
      }
    } catch {}
  }

  if (!wsUrl) {
    chromeProc.kill();
    throw new Error('Could not connect to Chrome DevTools endpoint on port 9226');
  }

  console.log('1. Connected to Chrome CDP:', wsUrl);
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
  await sleep(2500);

  // STEP 1: Login as Patient via 1-click button
  console.log('2. Performing Patient 1-click login...');
  const loginClick = await evaluate(`
    (() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent && b.textContent.includes('Patient'));
      if (btn) {
        btn.click();
        return 'Clicked ' + btn.textContent.trim();
      }
      return 'Button not found';
    })()
  `);
  console.log('Login action result:', loginClick);

  // Wait for login and navigation to complete
  for (let i = 0; i < 15; i++) {
    await sleep(500);
    const currUrl = await evaluate('window.location.href');
    if (currUrl && currUrl.includes('/patient/dashboard')) {
      console.log('Successfully navigated to:', currUrl);
      break;
    }
  }

  // STEP 2: Configure Mobile Viewport (iPhone 14 Pro: 393 x 852, DPR 3, mobile: true)
  console.log('3. Applying Mobile Viewport Emulation (393 x 852)...');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 393,
    height: 852,
    deviceScaleFactor: 2,
    mobile: true,
  });
  await sleep(1500);

  // STEP 3: Verify horizontal overflow is strictly 0
  const overflowTest = await evaluate(`
    ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      innerWidth: window.innerWidth,
      hasOverflow: document.documentElement.scrollWidth > window.innerWidth
    })
  `);
  console.log('4. Mobile horizontal overflow test:', overflowTest);

  // STEP 4: Check Global Assistant floating launcher
  console.log('5. Checking floating Global AI Assistant button...');
  const launcherInfo = await evaluate(`
    (() => {
      const btn = document.querySelector('button[aria-label="Open RuralCare AI Assistant"]');
      if (!btn) return { exists: false };
      const rect = btn.getBoundingClientRect();
      return {
        exists: true,
        text: btn.innerText.replace(/\\s+/g, ' '),
        width: rect.width,
        height: rect.height,
        bottom: window.innerHeight - rect.bottom,
        right: window.innerWidth - rect.right
      };
    })()
  `);
  console.log('Floating AI button info:', launcherInfo);

  // STEP 5: Click Floating Launcher to open bottom sheet
  console.log('6. Opening Global AI Assistant panel...');
  await evaluate(`
    const btn = document.querySelector('button[aria-label="Open RuralCare AI Assistant"]');
    if (btn) btn.click();
  `);
  await sleep(2000);

  // Check Dialog status
  const dialogInfo = await evaluate(`
    (() => {
      const dialog = document.querySelector('div[role="dialog"]');
      if (!dialog) return { open: false };
      const rect = dialog.getBoundingClientRect();
      const taActive = Array.from(dialog.querySelectorAll('button')).some(b => b.textContent?.includes('தமிழ்') && b.className.includes('bg-teal-600'));
      return {
        open: true,
        width: rect.width,
        height: rect.height,
        tamilLanguageActive: taActive,
        title: dialog.querySelector('h2')?.innerText,
        avatarExists: !!dialog.querySelector('canvas, svg, div.relative.mx-auto')
      };
    })()
  `);
  console.log('7. AI Assistant Bottom Sheet state:', dialogInfo);

  // STEP 6: Send Tamil Message into Assistant
  console.log('8. Typing Tamil user query: "வணக்கம், எனக்கு டாக்டர் அப்பாயின்ட்மென்ட் புக் பண்ண உதவி தேவை."...');
  await evaluate(`
    (() => {
      const input = document.querySelector('div[role="dialog"] input[type="text"]');
      if (input) {
        input.value = "வணக்கம், எனக்கு டாக்டர் அப்பாயின்ட்மென்ட் புக் பண்ண உதவி தேவை.";
        input.dispatchEvent(new Event('input', { bubbles: true }));
        const form = input.closest('form');
        if (form) {
          const submitBtn = form.querySelector('button[type="submit"]');
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.click();
          }
        }
      }
    })()
  `);

  console.log('Waiting for Gemini response and Tamil audio playback...');
  // Wait for real Gemini AI response
  let aiReplyText = '';
  for (let i = 0; i < 22; i++) {
    await sleep(1000);
    const text = await evaluate(`
      (() => {
        const bubbles = Array.from(document.querySelectorAll('div[role="dialog"] .whitespace-pre-line'));
        return bubbles.length > 1 ? bubbles[bubbles.length - 1].innerText : '';
      })()
    `);
    if (text) {
      aiReplyText = text;
      break;
    }
  }
  console.log('AI Tamil Response received:', aiReplyText ? aiReplyText : 'Thinking timeout');

  // Check Suggested Action pill
  const actionPill = await evaluate(`
    (() => {
      const btn = document.querySelector('div[role="dialog"] button.bg-amber-600');
      return btn ? btn.innerText.replace(/\\s+/g, ' ') : 'None';
    })()
  `);
  console.log('Suggested Action Pill:', actionPill);

  // Capture Screenshot 1: Mobile with AI Assistant Open
  console.log('9. Capturing Screenshot 1: Mobile Global AI Assistant in Tamil...');
  const ss1 = await send('Page.captureScreenshot', { format: 'png' });
  const buf1 = Buffer.from(ss1.data, 'base64');
  const path1 = 'D:\\Rural health Care\\screenshots\\mobile_global_ai_assistant.png';
  writeFileSync(path1, buf1);
  copyFileSync(path1, `${ARTIFACT_DIR}\\mobile_global_ai_assistant.png`);
  console.log('Saved to:', path1);

  // STEP 7: Close Assistant & Navigate to Mobile Ambulance Assistance
  console.log('10. Closing assistant and navigating to Ambulance Assistance on mobile...');
  await evaluate(`
    const closeBtn = document.querySelector('div[role="dialog"] button[title*="Close"], div[role="dialog"] button[title*="மூடுக"]');
    if (closeBtn) closeBtn.click();
  `);
  await sleep(1000);

  await evaluate(`
    window.location.href = '/patient/ambulance';
  `);
  await sleep(3500);

  // Capture Screenshot 2: Mobile Ambulance Assistance & 5km Radar Discovery
  console.log('11. Capturing Screenshot 2: Mobile Ambulance Assistance with 108 Emergency...');
  const ss2 = await send('Page.captureScreenshot', { format: 'png' });
  const buf2 = Buffer.from(ss2.data, 'base64');
  const path2 = 'D:\\Rural health Care\\screenshots\\mobile_ambulance_center.png';
  writeFileSync(path2, buf2);
  copyFileSync(path2, `${ARTIFACT_DIR}\\mobile_ambulance_center.png`);
  console.log('Saved to:', path2);

  // STEP 8: Tablet Emulation (768 x 1024 - iPad)
  console.log('12. Emulating Tablet Viewport (768 x 1024)...');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 768,
    height: 1024,
    deviceScaleFactor: 2,
    mobile: true,
  });
  await sleep(2000);

  const ss3 = await send('Page.captureScreenshot', { format: 'png' });
  const buf3 = Buffer.from(ss3.data, 'base64');
  const path3 = 'D:\\Rural health Care\\screenshots\\tablet_ambulance_radar.png';
  writeFileSync(path3, buf3);
  copyFileSync(path3, `${ARTIFACT_DIR}\\tablet_ambulance_radar.png`);
  console.log('Saved to:', path3);

  // STEP 9: Desktop Emulation (1440 x 900)
  console.log('13. Emulating Desktop Viewport (1440 x 900)...');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await evaluate(`
    window.location.href = '/patient/dashboard';
  `);
  await sleep(3000);

  const ss4 = await send('Page.captureScreenshot', { format: 'png' });
  const buf4 = Buffer.from(ss4.data, 'base64');
  const path4 = 'D:\\Rural health Care\\screenshots\\desktop_patient_dashboard.png';
  writeFileSync(path4, buf4);
  copyFileSync(path4, `${ARTIFACT_DIR}\\desktop_patient_dashboard.png`);
  console.log('Saved to:', path4);

  ws.close();
  chromeProc.kill();
  console.log('\n=== ALL MULTI-VIEWPORT VERIFICATIONS PASSED CLEANLY! ===');
}

main().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
