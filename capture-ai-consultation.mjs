import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
import WebSocket from 'ws';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  console.log('1. Starting headless Chrome on port 9224...');
  mkdirSync('D:\\Rural health Care\\scratch\\chrome_ss', { recursive: true });
  mkdirSync('D:\\Rural health Care\\screenshots', { recursive: true });

  const chromeProc = spawn(
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    [
      '--headless=new',
      '--remote-debugging-port=9224',
      '--user-data-dir=D:\\Rural health Care\\scratch\\chrome_ss',
      '--window-size=1440,900',
      '--no-first-run',
      '--no-default-browser-check',
      'http://localhost:5173/login',
    ],
    { stdio: 'ignore' }
  );

  let wsUrl = null;
  for (let i = 0; i < 20; i++) {
    await sleep(500);
    try {
      const res = await fetch('http://127.0.0.1:9224/json/list');
      const data = await res.json();
      if (data.length > 0 && data[0].webSocketDebuggerUrl) {
        wsUrl = data[0].webSocketDebuggerUrl;
        break;
      }
    } catch {}
  }

  if (!wsUrl) {
    chromeProc.kill();
    throw new Error('Could not connect to Chrome DevTools endpoint');
  }

  console.log('2. Connected to Chrome CDP:', wsUrl);
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

  console.log('3. Waiting for login page to render...');
  await send('Page.enable');
  await sleep(3000);

  console.log('4. Clicking Patient 1-click evaluation login...');
  await evaluate(`
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Patient'));
    if (btn) btn.click();
    else console.warn('Patient button not found');
  `);
  await sleep(2500);

  const dashboardUrl = await evaluate('window.location.href');
  console.log('Current URL after login:', dashboardUrl);

  console.log('5. Clicking AI Virtual Assistant navigation link...');
  await evaluate(`
    const aiLink = Array.from(document.querySelectorAll('a')).find(a => a.href.includes('/patient/ai-consultation'));
    if (aiLink) {
      aiLink.click();
    } else {
      window.location.href = '/patient/ai-consultation';
    }
  `);
  await sleep(3500);

  const currentUrl = await evaluate('window.location.href');
  const bodyText = await evaluate('document.body.innerText');
  console.log('Current consultation URL:', currentUrl);
  console.log('Page contains Assistant name:', bodyText.includes('ரூரல்கேர் அசிஸ்ட்') ? 'YES' : 'NO');
  console.log('Page contains Gemini badge:', bodyText.includes('Gemini Live Voice') ? 'YES' : 'NO');
  console.log('Page contains Emergency banner:', bodyText.includes('அவசரம்: 112') ? 'YES' : 'NO');
  console.log('Page contains Start call button:', bodyText.includes('Start AI Call') || bodyText.includes('ஆலோசனையைத் தொடங்கு') ? 'YES' : 'NO');

  console.log('6. Taking screenshot...');
  const screenshotRes = await send('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: false,
  });

  const imgBuf = Buffer.from(screenshotRes.data, 'base64');
  const outPath = 'D:\\Rural health Care\\screenshots\\tamil_ai_avatar_consultation.png';
  writeFileSync(outPath, imgBuf);
  console.log('7. Screenshot saved:', outPath, `(${imgBuf.length} bytes)`);

  const artifactPath =
    'C:\\Users\\DELL\\.gemini\\antigravity\\brain\\89ad00a6-30a2-471f-a7e4-a210ac945812\\tamil_ai_avatar_consultation.png';
  copyFileSync(outPath, artifactPath);
  console.log('8. Copied to artifact dir:', artifactPath);

  ws.close();
  chromeProc.kill();
  console.log('DONE!');
}

main().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});

