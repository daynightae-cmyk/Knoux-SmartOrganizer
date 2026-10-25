#!/usr/bin/env node
/**
 * KNOuX runtime interaction audit — read-only UI actions against the live Vite app.
 * Starts one headless Chrome, exercises navigation/theme/locale/palette/assistant/
 * tabs/cleanup scroller, captures screenshots and returns a JSON assertion log.
 */
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { tmpdir } from 'node:os';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const OUT = resolve('D:/KNOUX-Workspace/KNOuX-Gemini-UI/apps/gemini-ui/visual-evidence/closure-20261025/audit');
const port = 9700 + Math.floor(Math.random() * 100);
const profile = resolve(tmpdir(), `knoux-interact-${port}`);
const width = 1366;
const height = 768;

const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1',
  '--no-first-run', '--no-default-browser-check', '--disable-extensions',
  `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, '--window-size=1600,1000', 'about:blank',
], { stdio: 'ignore' });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];
const record = (name, pass, detail) => {
  results.push({ name, pass: Boolean(pass), detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + JSON.stringify(detail).slice(0, 300) : ''}`);
};

async function getWs() {
  for (let i = 0; i < 80; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/list`);
      const pages = await res.json();
      const page = pages.find((p) => p.type === 'page');
      if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
    } catch {}
    await sleep(150);
  }
  throw new Error('CDP not ready');
}
function cdp(ws) {
  let id = 0;
  const pending = new Map();
  ws.addEventListener('message', (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve: res, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(JSON.stringify(msg.error)));
      else res(msg.result);
    }
  });
  return (method, params = {}) => new Promise((res, reject) => {
    const msgId = ++id;
    pending.set(msgId, { resolve: res, reject });
    ws.send(JSON.stringify({ id: msgId, method, params }));
  });
}

(async () => {
  let ws;
  try {
    mkdirSync(OUT, { recursive: true });
    ws = new WebSocket(await getWs());
    await new Promise((res, rej) => {
      ws.addEventListener('open', res, { once: true });
      ws.addEventListener('error', rej, { once: true });
    });
    const send = cdp(ws);
    await send('Page.enable');
    await send('Runtime.enable');
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
    const seed = await send('Page.addScriptToEvaluateOnNewDocument', {
      source: `try { localStorage.setItem('knoux_locale','en'); localStorage.setItem('knoux_theme','dark'); } catch(e) {}`,
    });

    const evaluate = async (expression) => {
      const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
      if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + ' ' + (r.exceptionDetails.exception?.description || ''));
      return r.result.value;
    };
    const wait = (ms = 700) => sleep(ms);
    const navigate = async (hash) => {
      await send('Page.navigate', { url: `http://127.0.0.1:3000/#/${hash}` });
      await sleep(1400);
    };
    const key = async (k, code, vk, modifiers = 0) => {
      await send('Input.dispatchKeyEvent', { type: 'keyDown', key: k, code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk, modifiers });
      await send('Input.dispatchKeyEvent', { type: 'keyUp', key: k, code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk, modifiers });
      await wait(450);
    };
    const shot = async (name) => {
      const s = await send('Page.captureScreenshot', { format: 'png', fromSurface: true });
      writeFileSync(resolve(OUT, name), Buffer.from(s.data, 'base64'));
    };
    const clickText = async (text, selector = 'button,div') => {
      const ok = await evaluate(`(() => {
        const el = [...document.querySelectorAll(${JSON.stringify(selector)})].find(e => e.textContent.trim().includes(${JSON.stringify(text)}));
        if (!el) return false;
        el.click(); return true;
      })()`);
      await wait(700);
      return ok;
    };

    // ---------------------------------------------------------------- Startup tabs
    await navigate('startup');
    if (seed?.identifier) {
      await send('Page.removeScriptToEvaluateOnNewDocument', { identifier: seed.identifier });
    }
    await evaluate(`document.querySelector('#startup-tab-services')?.click()`);
    await wait(500);
    let state = await evaluate(`(() => {
      const tab = document.querySelector('#startup-tab-services');
      const cards = [...document.querySelectorAll('main .grid > div')].filter(e => e.textContent.includes('Open Workspace'));
      const tele = document.querySelector('button[title="Restore Live Process Console"]');
      return { selected: tab?.getAttribute('aria-selected'), cards: cards.length, telemetryChip: Boolean(tele) };
    })()`);
    record('startup.servicesTab exposes 12 domain services', state.selected === 'true' && state.cards === 12, state);
    await shot('interaction-startup-services-1366.png');

    const opened = await evaluate(`(() => {
      const card = [...document.querySelectorAll('main .grid > div')].find(e => e.textContent.includes('Open Workspace'));
      if (!card) return false;
      card.click();
      return true;
    })()`);
    await wait(700);
    state = await evaluate(`(() => {
      const overlay = document.querySelector('.fixed.inset-0');
      const back = overlay?.querySelector('button[title="Return to World Page"]');
      return { open: Boolean(overlay), hasSafety: overlay?.innerText.includes('NOT CONNECTED'), closable: Boolean(back) };
    })()`);
    record('startup.service card opens a closable domain workspace', opened && state.open && state.hasSafety && state.closable, state);
    await evaluate(`document.querySelector('.fixed.inset-0 button[title="Return to World Page"]')?.click()`);
    await wait(500);
    state = await evaluate(`Boolean(document.querySelector('.fixed.inset-0'))`);
    record('startup.service workspace closes back to the register', state === false, { stillOpen: state });

    await evaluate(`document.querySelector('#startup-tab-register')?.click()`);
    await wait(400);
    state = await evaluate(`(() => {
      const tab = document.querySelector('#startup-tab-register');
      return { selected: tab?.getAttribute('aria-selected'), rows: document.querySelectorAll('.startup-register-table tbody tr').length };
    })()`);
    record('startup.registerTab returns to bound register', state.selected === 'true' && state.rows > 0, state);

    // Telemetry expansion must not cover the footer decision bar or table.
    await evaluate(`document.querySelector('button[title="Restore Live Process Console"]')?.click()`);
    await wait(600);
    state = await evaluate(`(() => {
      const panel = [...document.querySelectorAll('footer div')].find(e => e.textContent.includes('Live Process & Telemetry Inspector'));
      const actions = document.querySelector('footer .h-14');
      const main = document.querySelector('main');
      const pr = panel?.getBoundingClientRect();
      const ar = actions?.getBoundingClientRect();
      const mr = main?.getBoundingClientRect();
      return { panel: pr && [Math.round(pr.top), Math.round(pr.bottom)], actions: ar && [Math.round(ar.top), Math.round(ar.bottom)], main: mr && [Math.round(mr.top), Math.round(mr.bottom)], overlapActions: pr && ar ? pr.bottom > ar.top + 1 : null, footerStartsAtMainBottom: pr && mr ? Math.abs(pr.top - mr.bottom) <= 1 : null };
    })()`);
    record('startup.expanded telemetry clears table and action bar', state.panel && state.actions && state.overlapActions === false && state.footerStartsAtMainBottom === true, state);
    await shot('interaction-startup-telemetry-expanded-1366.png');
    await evaluate(`document.querySelector('button[title="Minimize to status chip"]')?.click()`);
    await wait(400);

    // ---------------------------------------------------------------- Theme + locale
    await evaluate(`document.querySelector('button[aria-label="Switch to light theme"]')?.click()`);
    await wait(500);
    state = await evaluate(`({ theme: document.documentElement.getAttribute('data-theme'), stored: localStorage.getItem('knoux_theme') })`);
    record('theme.toggle switches entire shell to light', state.theme === 'light' && state.stored === 'light', state);
    await shot('interaction-startup-light-1366.png');

    await evaluate(`[...document.querySelectorAll('aside div')].find(e => e.textContent.trim() === 'System')?.click()`);
    await wait(1000);
    state = await evaluate(`({ hash: location.hash, theme: document.documentElement.getAttribute('data-theme'), title: document.querySelector('main h1')?.textContent?.trim() })`);
    record('theme.persists across route change', ['#system', '#/system'].includes(state.hash) && state.theme === 'light', state);

    await evaluate(`document.querySelector('button[title="Toggle Arabic / English"]')?.click()`);
    await wait(750);
    state = await evaluate(`({ dir: document.documentElement.dir, lang: document.documentElement.lang, stored: localStorage.getItem('knoux_locale'), theme: document.documentElement.getAttribute('data-theme') })`);
    record('locale.toggle sets RTL + lang=ar and keeps light theme', state.dir === 'rtl' && state.lang === 'ar' && state.stored === 'ar' && state.theme === 'light', state);
    await shot('interaction-system-arabic-light-1366.png');

    await send('Page.reload');
    await sleep(1600);
    state = await evaluate(`({ dir: document.documentElement.dir, lang: document.documentElement.lang, theme: document.documentElement.getAttribute('data-theme'), hash: location.hash })`);
    record('locale+theme survive reload', state.dir === 'rtl' && state.lang === 'ar' && state.theme === 'light' && ['#system', '#/system'].includes(state.hash), state);

    // Restore English/dark for the remaining checks.
    await evaluate(`[...document.querySelectorAll('aside div')].find(e => e.textContent.trim() === 'Settings')?.click()`);
    await wait(800);
    await evaluate(`document.querySelector('button[title="Toggle Arabic / English"]')?.click()`);
    await wait(600);
    await evaluate(`document.querySelector('button[aria-label="Switch to dark theme"]')?.click()`);
    await wait(500);
    state = await evaluate(`({ dir: document.documentElement.dir, theme: document.documentElement.getAttribute('data-theme') })`);
    record('locale+theme return to English/dark', state.dir === 'ltr' && state.theme === null, state);

    // ---------------------------------------------------------------- Ctrl+K palette
    await navigate('home');
    await key('k', 'KeyK', 75, 2);
    state = await evaluate(`(() => { const input = document.querySelector('.knx-modal-card input'); return { open: Boolean(document.querySelector('.knx-modal-backdrop')), focused: document.activeElement === input, placeholder: input?.getAttribute('placeholder') }; })()`);
    record('home Ctrl+K opens searchable command palette', state.open && state.focused, state);
    await shot('interaction-home-palette-1366.png');
    await key('Escape', 'Escape', 27);
    state = await evaluate(`Boolean(document.querySelector('.knx-modal-backdrop'))`);
    record('home Escape closes command palette', state === false, { paletteOpen: state });

    await navigate('system');
    await key('k', 'KeyK', 75, 2);
    await send('Input.insertText', { text: 'start' });
    await wait(500);
    state = await evaluate(`(() => { const list = document.querySelector('#knoux-command-results'); return { open: Boolean(list), options: list ? list.querySelectorAll('[role="option"]').length : 0, text: list?.innerText.slice(0, 90) }; })()`);
    record('shell section finder filters sections', state.open && state.options > 0, state);
    await key('Enter', 'Enter', 13);
    await sleep(900);
    state = await evaluate(`({ hash: location.hash })`);
    record('shell finder Enter navigates to selected section', ['#startup', '#/startup'].includes(state.hash), state);

    // ---------------------------------------------------------------- Assistant overlay
    await evaluate(`document.querySelector('button[aria-label="Open KNOuX AI Copilot"]')?.click()`);
    await wait(600);
    state = await evaluate(`(() => { const text = document.body.innerText; const panel = [...document.querySelectorAll('div')].find(e => e.className?.includes?.('fixed') && e.className.includes('bottom-[7.5rem]')); return { open: Boolean(panel), hasTitle: text.includes('KNOuX AI Copilot'), panelRect: panel ? [Math.round(panel.getBoundingClientRect().top), Math.round(panel.getBoundingClientRect().bottom)] : null }; })()`);
    record('assistant opens in a reserved overlay', state.open && state.hasTitle, state);
    await shot('interaction-assistant-open-1366.png');
    await key('Escape', 'Escape', 27);
    state = await evaluate(`(() => { const panel = [...document.querySelectorAll('div')].find(e => e.className?.includes?.('fixed') && e.className.includes('bottom-[7.5rem]')); return Boolean(panel); })()`);
    record('assistant Escape closes overlay', state === false, { open: state });

    // ---------------------------------------------------------------- Smart Scan service
    await navigate('smart_scan');
    const filterClicked = await clickText('Junk Files (482)', 'button');
    await wait(400);
    state = await evaluate(`(() => ({ active: [...document.querySelectorAll('button')].find(e => e.textContent.includes('Junk Files (482)'))?.className.includes('bg-blue-600'), rows: document.querySelectorAll('.scan-results-table tbody tr').length }))()`);
    record('smartScan category filter is interactive', filterClicked && state.active && state.rows > 0, state);
    const deepClicked = await evaluate(`(() => { const el = [...document.querySelectorAll('div')].find(e => e.textContent.includes('Deep Scan') && e.textContent.includes('Full system analysis') && e.className.includes('cursor-pointer')); if (!el) return false; el.scrollIntoView({block:'center'}); el.click(); return true; })()`);
    await wait(800);
    state = await evaluate(`(() => { const body = document.body.innerText; const close = [...document.querySelectorAll('button')].find(e => e.textContent.includes('Close Workspace')); return { clicked: ${deepClicked}, hasWorkspace: close ? true : false, close: Boolean(close) }; })()`);
    record('smartScan service opens domain workspace', deepClicked === true, state);
    await shot('interaction-smartscan-service-1366.png');
    await clickText('Close Workspace', 'button');
    state = await evaluate(`document.body.innerText.includes('Close Workspace')`);
    record('smartScan service workspace closes', state === false, { stillOpen: state });

    // ---------------------------------------------------------------- Cleanup horizontal scroller
    await navigate('cleanup');
    state = await evaluate(`(() => { const rail = [...document.querySelectorAll('div')].find(e => e.className.includes('overflow-x-auto') && e.querySelector('table')); if (!rail) return null; const before = rail.scrollLeft; rail.scrollLeft = 160; return { clientWidth: rail.clientWidth, scrollWidth: rail.scrollWidth, before, after: rail.scrollLeft, hasScroller: rail.scrollWidth > rail.clientWidth }; })()`);
    record('cleanup ledger keeps a working horizontal scroller', Boolean(state && state.after > 0), state);

    // ---------------------------------------------------------------- Repair watermark + layout
    await navigate('repair');
    state = await evaluate(`(() => {
      const mark = document.querySelector('.recovery-blueprint-watermark');
      const hero = mark?.closest('section,div');
      const mr = mark?.getBoundingClientRect();
      const hr = hero?.getBoundingClientRect();
      return {
        visible: Boolean(mark && getComputedStyle(mark).display !== 'none'),
        mark: mr && [Math.round(mr.left), Math.round(mr.top), Math.round(mr.right), Math.round(mr.bottom)],
        hero: hr && [Math.round(hr.left), Math.round(hr.top), Math.round(hr.right), Math.round(hr.bottom)],
        insideHero: mr && hr ? mr.left >= hr.left - 1 && mr.right <= hr.right + 1 && mr.top >= hr.top - 1 && mr.bottom <= hr.bottom + 1 : null,
      };
    })()`);
    record('repair watermark stays inside its hero band', state.visible && state.insideHero === true, state);
    await shot('interaction-repair-1366.png');

    // ---------------------------------------------------------------- Services service selection
    await navigate('services');
    const serviceClicked = await evaluate(`(() => { const row = [...document.querySelectorAll('tr')].find(e => e.textContent.includes('Windows Search')); if (!row) return false; row.click(); return true; })()`);
    await wait(600);
    state = await evaluate(`(() => ({ dossier: [...document.querySelectorAll('div')].find(e => e.textContent.includes('Service Dossier'))?.innerText.includes('Windows Search') }))()`);
    record('services row selection updates the dossier', serviceClicked && state.dossier, state);

    const summary = {
      at: new Date().toISOString(),
      viewport: [width, height],
      passed: results.filter((r) => r.pass).length,
      failed: results.filter((r) => !r.pass).length,
      results,
    };
    writeFileSync(resolve(OUT, 'interaction-audit.json'), JSON.stringify(summary, null, 2));
    console.log(`\nSUMMARY ${summary.passed} passed / ${summary.failed} failed`);
  } finally {
    try { ws?.close(); } catch {}
    chrome.kill();
    await sleep(400);
    try { if (existsSync(profile)) rmSync(profile, { recursive: true, force: true }); } catch {}
  }
})().catch((err) => {
  console.error('INTERACTION AUDIT FAILED:', err?.stack || err);
  chrome.kill();
  process.exit(1);
});
