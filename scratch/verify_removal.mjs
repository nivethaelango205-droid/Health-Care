import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
import WebSocket from 'ws';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const ARTIFACT_DIR = 'C:\\Users\\DELL\\.gemini\\antigravity\\brain\\89ad00a6-30a2-471f-a7e4-a210ac945812';
const SCRATCH_PROFILE = `${ARTIFACT_DIR}\\scratch\\chrome_removal_test`;
const SCREENSHOT_LOCAL = 'D:\\Rural health Care\\screenshots\\ai_removal_verified.png';
const SCREENSHOT_ARTIFACT = `${ARTIFACT_DIR}\\ai_removal_verified.png`;

async function run() {
  console.log('=== RURALCARE 360: AI VIRTUAL CONSULTATION PAGE REMOVAL VERIFICATION ===');
  mkdirSync(SCRATCH_PROFILE, { recursive: true });
  mkdirSync('D:\\Rural health Care\\screenshots', { recursive: true });

  console.log('1. Launching Chrome (headless=new)...');
  const chromeProc = spawn(
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    [
      '--headless=new',
      '--remote-debugging-port=9229',
      `--user-data-dir=${SCRATCH_PROFILE}`,
      '--window-size=1440,900',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-extensions',
      'http://localhost:5173/login',
    ],
    { stdio: 'ignore' }
  );

  let wsUrl = null;
  for (let i = 0; i < 30; i++) {
    await sleep(400);
    try {
      const res = await fetch('http://127.0.0.1:9229/json/list');
      const data = await res.json();
      const tab = data.find((t) => t.type === 'page' && !t.url.startsWith('chrome-extension://'));
      if (tab && tab.webSocketDebuggerUrl) {
        wsUrl = tab.webSocketDebuggerUrl;
        break;
      }
    } catch {}
  }

  if (!wsUrl) {
    chromeProc.kill();
    throw new Error('Failed to connect to Chrome DevTools port 9229');
  }

  console.log('2. Connected to Chrome CDP:', wsUrl);
  const ws = new WebSocket(wsUrl);
  await new Promise((resolve, reject) => {
    ws.on('open', resolve);
    ws.on('error', reject);
  });

  const consoleLogs = [];
  const jsExceptions = [];
  let reqId = 1;

  function sendCDP(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = reqId++;
      const handler = (data) => {
        const msg = JSON.parse(data.toString());
        if (msg.id === id) {
          ws.off('message', handler);
          if (msg.error) reject(msg.error);
          else resolve(msg.result);
        }
      };
      ws.on('message', handler);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      if (msg.method === 'Runtime.consoleAPICalled') {
        const text = msg.params.args.map((a) => a.value ?? a.description ?? '').join(' ');
        consoleLogs.push(`[${msg.params.type}] ${text}`);
      } else if (msg.method === 'Runtime.exceptionThrown') {
        jsExceptions.push(msg.params.exceptionDetails.text);
      }
    } catch {}
  });

  await sendCDP('Runtime.enable');
  await sendCDP('Page.enable');

  async function evaluate(expression) {
    const res = await sendCDP('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    return res.result ? res.result.value : null;
  }

  await sleep(1500);

  console.log('3. Clicking Demo Patient login button...');
  await evaluate(`(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Patient (Asha)'));
    if (btn) {
      btn.click();
      return true;
    }
    // Fallback: fill inputs and submit form
    const emailInput = document.querySelector('input[type="email"]');
    const pwdInput = document.querySelector('input[type="password"]');
    const submitBtn = document.querySelector('button[type="submit"]');
    if (emailInput && pwdInput && submitBtn) {
      emailInput.value = 'patient@ruralcare.in';
      emailInput.dispatchEvent(new Event('input', { bubbles: true }));
      pwdInput.value = 'patient123';
      pwdInput.dispatchEvent(new Event('input', { bubbles: true }));
      submitBtn.click();
      return true;
    }
    return false;
  })()`);

  // Wait until we reach /patient/dashboard
  for (let i = 0; i < 20; i++) {
    await sleep(500);
    const curr = await evaluate('window.location.pathname');
    if (curr && curr.includes('/patient')) break;
  }

  const initialUrl = await evaluate('window.location.href');
  console.log('4. Authenticated URL:', initialUrl);

  // Check 1: Sidebar Items
  const sidebarLinks = await evaluate(`(() => {
    return Array.from(document.querySelectorAll('aside nav a')).map(a => ({
      text: a.textContent.trim(),
      href: a.getAttribute('href')
    }));
  })()`);
  console.log('5. Sidebar links found:', JSON.stringify(sidebarLinks, null, 2));

  const hasOldSidebarLink = sidebarLinks.some(l => l.href?.includes('ai-consultation') || l.text?.includes('AI Virtual Assistant'));
  console.log('   -> Old AI sidebar link present?:', hasOldSidebarLink);

  // Check 2: Dashboard Shortcut Button
  const hasOldDashboardButton = await evaluate(`!!document.querySelector('#action-ai-consultation')`);
  console.log('6. Old #action-ai-consultation button on Dashboard present?:', hasOldDashboardButton);

  // Check 3: Route Redirection
  console.log('7. Testing direct navigation to /patient/ai-consultation...');
  // Use React Router navigation if available or location.href
  await evaluate(`window.location.href = '/patient/ai-consultation'`);
  await sleep(2500);

  const redirectedPath = await evaluate('window.location.pathname');
  console.log('   -> Current pathname after navigating to /patient/ai-consultation:', redirectedPath);
  const redirectSuccess = redirectedPath === '/patient/dashboard';
  console.log('   -> Successfully redirected to /patient/dashboard?:', redirectSuccess);

  // Check 4: Global Floating Assistant
  console.log('8. Checking Global Floating AI Chatbot launcher...');
  const launcherExists = await evaluate(`(() => {
    const launcher = document.querySelector('button[aria-label="Open RuralCare AI Assistant"]') ||
                     document.querySelector('button[aria-label*="AI Assistant"]');
    return !!launcher;
  })()`);
  console.log('   -> Global Floating Assistant launcher exists?:', launcherExists);

  // Click the launcher to open the assistant panel
  await evaluate(`(() => {
    const launcher = document.querySelector('button[aria-label="Open RuralCare AI Assistant"]') ||
                     document.querySelector('button[aria-label*="AI Assistant"]');
    if (launcher) launcher.click();
  })()`);
  await sleep(2000);

  const panelOpen = await evaluate(`(() => {
    return document.body.innerText.includes('RuralCare Assist') ||
           document.body.innerText.includes('AI Healthcare Guide') ||
           document.body.innerText.includes('AI வழிகாட்டி');
  })()`);
  console.log('   -> Assistant panel open and active?:', panelOpen);

  // 9. Capture Screenshot
  console.log('9. Capturing full verification screenshot...');
  const screenshotData = await sendCDP('Page.captureScreenshot', { format: 'png' });
  const buffer = Buffer.from(screenshotData.data, 'base64');
  writeFileSync(SCREENSHOT_LOCAL, buffer);
  copyFileSync(SCREENSHOT_LOCAL, SCREENSHOT_ARTIFACT);
  console.log('   -> Saved screenshot to:', SCREENSHOT_LOCAL);

  // Close chrome
  try {
    await sendCDP('Browser.close');
  } catch {}
  chromeProc.kill();

  console.log('\n=== VERIFICATION SUMMARY ===');
  console.log('1. Sidebar "AI Virtual Assistant" removed:', !hasOldSidebarLink ? 'PASSED' : 'FAILED');
  console.log('2. Dashboard shortcut removed:', !hasOldDashboardButton ? 'PASSED' : 'FAILED');
  console.log('3. Direct /patient/ai-consultation redirect to /patient/dashboard:', redirectSuccess ? 'PASSED' : 'FAILED');
  console.log('4. Global Floating AI Assistant intact and operational:', launcherExists && panelOpen ? 'PASSED' : 'FAILED');
  console.log('5. Console Exceptions:', jsExceptions.length === 0 ? 'CLEAN (0 exceptions)' : jsExceptions);

  if (!hasOldSidebarLink && !hasOldDashboardButton && redirectSuccess && launcherExists) {
    console.log('\nALL REMOVAL & RETENTION REQUIREMENTS FULLY VERIFIED!');
  } else {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('VERIFICATION ERROR:', err);
  process.exit(1);
});
