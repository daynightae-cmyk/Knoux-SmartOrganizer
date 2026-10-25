#!/usr/bin/env node
/** Mission 07 — Storage runtime interaction audit (fixture preview). */
import { spawn } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 9960 + Math.floor(Math.random() * 30);
const PROFILE = resolve(tmpdir(), `knoux-storage-interact-${PORT}`);
const URL = 'http://127.0.0.1:3000/#/storage';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1',
  '--no-first-run', '--no-default-browser-check', '--disable-extensions',
  `--remote-debugging-port=${PORT}`, `--user-data-dir=${PROFILE}`,
  '--window-size=1800,1000', 'about:blank',
], { stdio: 'ignore' });

const results = [];
const record = (name, pass, detail) => {
  results.push({ name, pass: Boolean(pass), detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + JSON.stringify(detail).slice(0, 240) : ''}`);
};

async function getWs() {
  for (let i = 0; i < 80; i += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      const pages = await response.json();
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
  let ws;
  try {
    mkdirSync(HERE, { recursive: true });
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
    await sleep(1500);

    const evaluate = async (expression) => {
      const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
      if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || 'Runtime evaluation failed');
      return result.result.value;
    };
    const clickTest = (testId) => evaluate(`(() => {
      const element = document.querySelector('[data-testid="${testId}"]');
      if (!element) return false;
      element.scrollIntoView({ block: 'center' });
      element.click();
      return true;
    })()`);
    const bodyText = () => evaluate("document.body.innerText || ''");

    const volumes = await evaluate("document.querySelectorAll('[data-testid^=\"storage-volume-\"]:not([data-testid=\"storage-volume-count\"])').length");
    record('volume bays render from the approved fixture', volumes >= 3, { volumes });

    const setSearch = (value) => evaluate(`(() => {
      const input = document.querySelector('input[placeholder*="Search folders, files, or volumes"]');
      if (!input) return false;
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(input, ${JSON.stringify(value)});
      input.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    })()`);
    await setSearch('Data');
    await sleep(300);
    const filteredVolumes = await evaluate("document.querySelectorAll('[data-testid^=\"storage-volume-\"]:not([data-testid=\"storage-volume-count\"])').length");
    record('search filters volume bays', filteredVolumes === 1, { filteredVolumes });
    await setSearch('');
    await sleep(300);

    const selectD = await clickTest('storage-volume-D');
    await sleep(300);
    const inspectorLetter = await evaluate("document.querySelector('[data-testid=\"storage-inspector-volume\"]')?.getAttribute('data-volume-letter') || null");
    record('selecting a volume syncs the inspector', selectD && inspectorLetter === 'D:', { inspectorLetter });

    const walk = await evaluate(`(() => {
      const card = document.querySelector('[data-testid="storage-volume-D"]');
      const button = [...(card?.querySelectorAll('button') || [])].find((entry) => (entry.innerText || '').includes('Walk This Volume'));
      if (!button) return false;
      button.click();
      return true;
    })()`);
    await sleep(350);
    const toast = (await bodyText()).includes('Design fixture');
    record('Walk This Volume explains fixture limits instead of claiming a scan', walk && toast, { toast });

    const tabLarge = await clickTest('storage-tab-large');
    await sleep(300);
    const fixtureTab = await bodyText();
    record('non-treemap fixture tab shows an honest measured-scope notice', tabLarge && fixtureTab.includes('requires a measured authorized scope'), { visible: fixtureTab.includes('requires a measured authorized scope') });

    const tabTypes = await clickTest('storage-tab-types');
    await sleep(250);
    const tabActive = await evaluate("document.querySelector('[data-testid=\"storage-tab-types\"]')?.className.includes('bg-blue-600')");
    record('file-type tab activates its own state', tabTypes && tabActive, { tabActive });

    await clickTest('storage-tab-treemap');
    await sleep(250);
    const windowsTile = await evaluate(`(() => {
      const tiles = [...document.querySelectorAll('.storage-treemap [role="button"], .storage-treemap div')];
      const tile = tiles.find((entry) => (entry.textContent || '').trim().startsWith('Windows'));
      if (!tile) return false;
      tile.click();
      return true;
    })()`);
    await sleep(250);
    const activeNode = await bodyText();
    record('fixture treemap tile updates the active node', windowsTile && activeNode.includes('Windows (93.6 GB)'), { windowsTile });

    const inspect = await clickTest('storage-inspect');
    await sleep(300);
    const focus = await evaluate("Boolean(document.querySelector('[data-testid=\"storage-service-focus\"]'))");
    record('Inspector action opens a domain service panel', inspect && focus, { focus });

    const closeFocus = await evaluate(`(() => {
      const button = document.querySelector('[data-testid="storage-service-focus"] button[aria-label="Close"]');
      if (!button) return false;
      button.click();
      return true;
    })()`);
    await sleep(200);

    const duplicateAction = await clickTest('storage-review-duplicates');
    await sleep(250);
    const duplicateFocus = await bodyText();
    record('duplicate action opens the duplicate service panel', duplicateAction && duplicateFocus.includes('Duplicate Hash Groups'), { ok: duplicateFocus.includes('Duplicate Hash Groups') });

    const localeToggle = await evaluate(`(() => {
      const button = document.querySelector('button[title="Toggle Arabic / English"]');
      if (!button) return false;
      button.click();
      return true;
    })()`);
    await sleep(400);
    const rtl = await evaluate(`({
      dir: document.querySelector('[dir="rtl"]')?.getAttribute('dir') || null,
      arabicHeading: (document.body.innerText || '').includes('أطلس التخزين والمساحة'),
      arabicTab: (document.body.innerText || '').includes('خريطة المساحة')
    })`);
    record('Storage language toggle produces Arabic RTL', localeToggle && rtl.dir === 'rtl' && rtl.arabicHeading && rtl.arabicTab, rtl);

    const report = {
      ok: results.every((result) => result.pass),
      url: URL,
      viewport: [1672, 941],
      mode: 'fixture preview (measured Storage proven by the adapter test and Electron smoke)',
      results,
    };
    writeFileSync(resolve(HERE, 'storage-interactions.json'), JSON.stringify(report, null, 2), 'utf8');
    console.log(JSON.stringify({ ok: report.ok, passed: results.filter((result) => result.pass).length, total: results.length }, null, 2));
    if (!report.ok) process.exitCode = 1;
  } finally {
    try { ws?.close(); } catch {}
    chrome.kill();
    await sleep(900);
    try { rmSync(PROFILE, { recursive: true, force: true, maxRetries: 10, retryDelay: 250 }); } catch {}
  }
})().catch((error) => {
  console.error('[storage-interaction-audit] FAILED', error?.stack || error);
  process.exit(1);
});
