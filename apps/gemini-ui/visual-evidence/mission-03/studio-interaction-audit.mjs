#!/usr/bin/env node
/**
 * Mission 03 — Studio runtime interaction audit (fixture preview).
 *
 * Drives the real Vite renderer in headless Chrome and verifies the nine-stage
 * navigation plus the core library controls. Native behavior is proven
 * separately by `npm run test:studio`, `npm run test:native` and the Electron
 * smoke receipts in `visual-evidence/platform-00`.
 */
import { spawn } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(HERE);
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 9800 + Math.floor(Math.random() * 100);
const PROFILE = resolve(tmpdir(), `knoux-studio-interact-${PORT}`);
const URL = 'http://127.0.0.1:3000/#/studio';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1',
  '--no-first-run', '--no-default-browser-check', '--disable-extensions',
  `--remote-debugging-port=${PORT}`, `--user-data-dir=${PROFILE}`,
  '--window-size=1800,1000', 'about:blank',
], { stdio: 'ignore' });

let ws;
const results = [];
const record = (name, pass, detail) => {
  results.push({ name, pass: Boolean(pass), detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + JSON.stringify(detail).slice(0, 240) : ''}`);
};

async function getWs() {
  for (let i = 0; i < 80; i += 1) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      const pages = await res.json();
      const page = pages.find((entry) => entry.type === 'page');
      if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
    } catch {}
    await sleep(150);
  }
  throw new Error('Chrome CDP endpoint did not become ready');
}

function cdp(socket) {
  let id = 0;
  const pending = new Map();
  socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    if (!message.id || !pending.has(message.id)) return;
    const { resolve: done, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(JSON.stringify(message.error)));
    else done(message.result);
  });
  return (method, params = {}) => new Promise((done, reject) => {
    const messageId = ++id;
    pending.set(messageId, { resolve: done, reject });
    socket.send(JSON.stringify({ id: messageId, method, params }));
  });
}

(async () => {
  try {
    mkdirSync(OUT, { recursive: true });
    ws = new WebSocket(await getWs());
    await new Promise((done, reject) => {
      ws.addEventListener('open', done, { once: true });
      ws.addEventListener('error', reject, { once: true });
    });
    const send = cdp(ws);
    await send('Page.enable');
    await send('Runtime.enable');
    await send('Emulation.setDeviceMetricsOverride', { width: 1672, height: 941, deviceScaleFactor: 1, mobile: false });
    await send('Page.addScriptToEvaluateOnNewDocument', {
      source: "try { localStorage.setItem('knoux_locale', 'en'); localStorage.setItem('knoux_theme', 'dark'); } catch (e) {}",
    });
    const loaded = new Promise((done) => {
      const timer = setTimeout(done, 12000);
      const listener = (event) => {
        const message = JSON.parse(event.data);
        if (message.method === 'Page.loadEventFired') {
          clearTimeout(timer);
          ws.removeEventListener('message', listener);
          done();
        }
      };
      ws.addEventListener('message', listener);
    });
    await send('Page.navigate', { url: URL });
    await loaded;
    await sleep(1800);

    const evaluate = async (expression) => {
      const result = await send('Runtime.evaluate', {
        expression,
        returnByValue: true,
        awaitPromise: true,
      });
      if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || 'Runtime evaluation failed');
      return result.result.value;
    };
    const clickText = async (selector, text) => evaluate(`(() => {
      const element = [...document.querySelectorAll(${JSON.stringify(selector)})]
        .find((node) => ((node.innerText || node.textContent || '').trim()).includes(${JSON.stringify(text)}));
      if (!element) return { clicked: false };
      element.scrollIntoView({ block: 'center' });
      element.click();
      return { clicked: true, text: (element.innerText || '').trim().slice(0, 60) };
    })()`);
    const activeStage = () => evaluate(`(() => {
      const active = document.querySelector('button[title^="Stage "][aria-current="step"]');
      return active ? active.getAttribute('title') : null;
    })()`);

    const stageButtons = await evaluate("document.querySelectorAll('button[title^=\"Stage \"]').length");
    record('nine stage controls are rendered', stageButtons === 9, { stageButtons });

    let stagesOk = true;
    const stageTrace = [];
    for (let stage = 1; stage <= 9; stage += 1) {
      const clicked = await evaluate(`(() => {
        const button = document.querySelector('button[title^="Stage ${stage}:"]');
        if (!button) return false;
        button.click();
        return true;
      })()`);
      await sleep(220);
      const active = await activeStage();
      const contentVisible = await evaluate("Boolean(document.querySelector('footer')) && (document.body.innerText || '').length > 300");
      stageTrace.push({ stage, clicked, active, contentVisible });
      if (!clicked || !String(active || '').startsWith(`Stage ${stage}:`) || !contentVisible) stagesOk = false;
    }
    record('all nine stages navigate and render content', stagesOk, stageTrace);

    await evaluate("document.querySelector('button[title^=\"Stage 2:\"]')?.click()");
    await sleep(300);
    const videoClick = await clickText('button', 'Video');
    await sleep(300);
    const videoLibrary = await evaluate("(document.body.innerText || '').includes('Video Files')");
    const emptyFixtureCategory = await evaluate("(document.body.innerText || '').includes('Fixture gallery is empty')");
    record('category selection filters the visual library', videoClick.clicked && videoLibrary && emptyFixtureCategory, { videoClick, videoLibrary, emptyFixtureCategory });

    await clickText('button', 'Image');
    await sleep(250);
    const selectAll = await clickText('button', 'Select All');
    await sleep(250);
    const selectedCount = await evaluate(`(() => {
      const match = (document.body.innerText || '').match(/([\\d,]+) files selected/);
      return match ? Number(match[1].replace(/,/g, '')) : 0;
    })()`);
    record('Select All changes the measured selection summary', selectAll.clicked && selectedCount > 0, { selectedCount });

    const deselect = await clickText('button', 'Deselect All');
    await sleep(250);
    const deselectedCount = await evaluate(`(() => {
      const match = (document.body.innerText || '').match(/([\\d,]+) files selected/);
      return match ? Number(match[1].replace(/,/g, '')) : -1;
    })()`);
    record('Deselect All clears the selection summary', deselect.clicked && deselectedCount === 0, { deselectedCount });

    const sortChanged = await evaluate(`(() => {
      const select = document.querySelector('select');
      if (!select) return false;
      select.value = 'size_desc';
      select.dispatchEvent(new Event('change', { bubbles: true }));
      return select.value === 'size_desc';
    })()`);
    await sleep(250);
    const sortValue = await evaluate("document.querySelector('select')?.value || null");
    record('sort control updates the library order state', sortChanged && sortValue === 'size_desc', { sortValue });

    const toArabic = await evaluate(`(() => {
      const button = document.querySelector('button[title="Toggle Arabic / English (RTL/LTR)"]');
      if (!button) return false;
      button.click();
      return true;
    })()`);
    await sleep(450);
    const rtl = await evaluate(`(() => {
      const root = document.querySelector('[dir="rtl"]');
      return { rtl: Boolean(root), arabicHeading: (document.body.innerText || '').includes('استوديو التنظيم الذكي'), toggle: Boolean(document.querySelector('button[title="Toggle Arabic / English (RTL/LTR)"]')) };
    })()`);
    record('Studio language toggle produces Arabic RTL', toArabic && rtl.rtl && rtl.arabicHeading, rtl);
    await evaluate(`(() => {
      const button = document.querySelector('button[title="Toggle Arabic / English (RTL/LTR)"]');
      if (button) button.click();
      return true;
    })()`);
    await sleep(350);

    const reviewClick = await clickText('button', 'Review Organization Plan');
    await sleep(500);
    const planVisible = await evaluate(`(document.body.innerText || '').includes('Organization Plan Review') || (document.body.innerText || '').includes('Organization Plan Review & Dry Run')`);
    const planStage = await activeStage();
    record('footer plan CTA opens stage 6', reviewClick.clicked && planVisible && planStage?.startsWith('Stage 6'), { planStage, planVisible });

    const blockedCopy = await evaluate("(document.body.innerText || '').includes('Execution is blocked') || (document.body.innerText || '').includes('explicit approval required')");
    record('plan review states execution is blocked', blockedCopy === true, { blockedCopy });

    const report = {
      ok: results.every((result) => result.pass),
      url: URL,
      viewport: [1672, 941],
      mode: 'fixture preview (native proven separately)',
      results,
    };
    writeFileSync(resolve(OUT, 'studio-interactions.json'), JSON.stringify(report, null, 2), 'utf8');
    console.log(JSON.stringify({ ok: report.ok, passed: results.filter((r) => r.pass).length, total: results.length }, null, 2));
    if (!report.ok) process.exitCode = 1;
  } finally {
    try { ws?.close(); } catch {}
    chrome.kill();
    await sleep(200);
    rmSync(PROFILE, { recursive: true, force: true });
  }
})().catch((error) => {
  console.error('[studio-interaction-audit] FAILED', error?.stack || error);
  process.exit(1);
});
