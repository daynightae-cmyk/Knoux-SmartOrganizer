#!/usr/bin/env node
/**
 * Mission 06 — Files runtime interaction audit (fixture preview).
 * Native measured behavior is proven by scripts/files-native-test.cjs and the
 * Electron smoke receipt in visual-evidence/platform-00.
 */
import { spawn } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 9900 + Math.floor(Math.random() * 100);
const PROFILE = resolve(tmpdir(), `knoux-files-interact-${PORT}`);
const URL = 'http://127.0.0.1:3000/#/files';
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
      source: "try { localStorage.setItem('knoux_locale', 'en'); localStorage.setItem('knoux_theme', 'dark'); localStorage.removeItem('knoux_studio_draft_v1'); } catch (e) {}",
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
    await sleep(1600);

    const evaluate = async (expression) => {
      const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
      if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || 'Runtime evaluation failed');
      return result.result.value;
    };
    const setSearch = (value) => evaluate(`(() => {
      const input = document.querySelector('[data-testid="files-search"]');
      if (!input) return false;
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(input, ${JSON.stringify(value)});
      input.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    })()`);
    const setSelect = (testId, value) => evaluate(`(() => {
      const select = document.querySelector('[data-testid="${testId}"]');
      if (!select) return false;
      select.value = ${JSON.stringify(value)};
      select.dispatchEvent(new Event('change', { bubbles: true }));
      return select.value === ${JSON.stringify(value)};
    })()`);
    const clickTest = (testId) => evaluate(`(() => {
      const element = document.querySelector('[data-testid="${testId}"]');
      if (!element) return false;
      element.scrollIntoView({ block: 'center' });
      element.click();
      return true;
    })()`);
    const rowNames = () => evaluate(`[...document.querySelectorAll('[data-testid^="files-row-"]')].map((row) => row.innerText.split('\\n').map((part) => part.trim()).filter(Boolean)[0] || '')`);
    const bodyText = () => evaluate("document.body.innerText || ''");

    const initialRows = await rowNames();
    record('fixture ledger renders real design rows', initialRows.length >= 8, { rows: initialRows.length });

    await setSearch('Aurora');
    await sleep(300);
    const searchRows = await rowNames();
    record('search input filters the ledger', searchRows.length === 1 && searchRows[0].includes('Aurora'), { searchRows });

    await setSearch('');
    await clickTest('files-category-images');
    await sleep(300);
    const imageRows = await rowNames();
    record('category pills filter the ledger', imageRows.length >= 2 && imageRows.every((name) => /\.(jpg|jpeg|png|webp|gif)$/i.test(name)), { imageRows });

    await clickTest('files-category-all');
    await setSelect('files-extension', 'zip');
    await sleep(300);
    const zipRows = await rowNames();
    record('extension filter updates rows', zipRows.length === 1 && zipRows[0].endsWith('.zip'), { zipRows });

    await setSelect('files-extension', 'All');
    await setSelect('files-size', 'large');
    await sleep(300);
    const largeRows = await rowNames();
    const largeText = await bodyText();
    record('size filter updates rows', largeRows.length === 0 ? largeText.includes('No fixture files match') : largeRows.every((name) => name.includes('Demo_Video')), { largeRows });

    await setSelect('files-size', 'Any');
    await setSelect('files-date', 'today');
    await sleep(300);
    const todayText = await bodyText();
    record('date filter produces an honest empty state', todayText.includes('No fixture files match'), { empty: todayText.includes('No fixture files match') });
    await setSelect('files-date', 'any');

    await setSelect('files-sort', 'size_desc');
    await sleep(300);
    const sortedRows = await rowNames();
    record('size sort places the largest row first', sortedRows[0]?.includes('Demo_Video'), { first: sortedRows[0] });

    await clickTest('files-view-grid');
    await sleep(250);
    const gridCards = await evaluate("document.querySelectorAll('[data-testid^=\"files-row-\"]').length");
    const gridVisible = await evaluate("Boolean(document.querySelector('[data-testid=\"files-view-grid\"]')?.className.includes('bg-[#173866]'))");
    record('grid view renders the same rows', gridCards >= 8 && gridVisible, { gridCards, gridVisible });
    await clickTest('files-view-list');
    await sleep(400);

    await setSelect('files-sort', 'date_desc');
    await sleep(300);
    const headerCheckbox = await evaluate(`(() => {
      const checkbox = document.querySelector('[data-testid="files-select-all"]');
      if (!checkbox) return false;
      checkbox.click();
      return true;
    })()`);
    await sleep(600);
    const selectedText = await bodyText();
    const selectedMatch = selectedText.match(/([\d,]+) files? selected/);
    const selectedCount = selectedMatch ? Number(selectedMatch[1].replace(/,/g, '')) : 0;
    const selectState = await evaluate(`(() => {
      const box = document.querySelector('[data-testid="files-select-all"]');
      return {
        rows: document.querySelectorAll('[data-testid^="files-row-"]').length,
        footer: (document.body.innerText.match(/[0-9,]+ files? selected/g) || []),
        checkbox: box ? box.className.includes('bg-[#2476ff]') : null,
      };
    })()`);
    record('select-all updates the sticky footer', headerCheckbox && selectedCount > 0, { selectedCount, selectState });

    await clickTest('files-plan-cta');
    await sleep(500);
    const navigated = await evaluate("location.hash.includes('studio') || (document.body.innerText || '').includes('Smart Organization Studio')");
    record('plan CTA opens Organization Studio', navigated === true, { hash: await evaluate('location.hash') });

    await send('Page.navigate', { url: URL });
    await loaded;
    await sleep(1000);

    const localeToggle = await evaluate(`(() => {
      const button = document.querySelector('button[title="Toggle Arabic / English"]');
      if (!button) return false;
      button.click();
      return true;
    })()`);
    await sleep(400);
    const rtl = await evaluate(`({
      dir: document.querySelector('[dir="rtl"]')?.getAttribute('dir') || null,
      arabicTitle: (document.body.innerText || '').includes('البحث الفوري'),
      rtlRows: Boolean(document.querySelector('[data-testid="files-search"]'))
    })`);
    record('Files language toggle produces Arabic RTL', localeToggle && rtl.dir === 'rtl' && rtl.arabicTitle, rtl);

    const serviceClick = await evaluate(`(() => {
      const button = document.querySelector('[data-service-key="file-hash"]');
      if (!button) return false;
      button.scrollIntoView({ block: 'center' });
      button.click();
      return true;
    })()`);
    await sleep(300);
    const focusVisible = await evaluate(`(() => {
      const focus = document.querySelector('[data-testid="files-service-focus"]');
      return focus ? { text: (focus.innerText || '').slice(0, 120) } : null;
    })()`);
    record('service dock opens a domain focus panel', serviceClick && Boolean(focusVisible?.text), focusVisible);

    const report = {
      ok: results.every((result) => result.pass),
      url: URL,
      viewport: [1672, 941],
      mode: 'fixture preview (native proven separately)',
      results,
    };
    writeFileSync(resolve(HERE, 'files-interactions.json'), JSON.stringify(report, null, 2), 'utf8');
    console.log(JSON.stringify({ ok: report.ok, passed: results.filter((result) => result.pass).length, total: results.length }, null, 2));
    if (!report.ok) process.exitCode = 1;
  } finally {
    try { ws?.close(); } catch {}
    chrome.kill();
    await sleep(900);
    try {
      rmSync(PROFILE, { recursive: true, force: true, maxRetries: 10, retryDelay: 250 });
    } catch {
      // Chrome may still hold a profile handle after exit; it lives in temp.
    }
  }
})().catch((error) => {
  console.error('[files-interaction-audit] FAILED', error?.stack || error);
  process.exit(1);
});
