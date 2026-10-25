#!/usr/bin/env node
/**
 * KNOuX visual QA harness — read-only CDP driver.
 * Usage:
 *   node cdp-audit.mjs --url http://127.0.0.1:3000/#/home --width 1672 --height 941 \
 *     --out shot.png [--locale ar] [--theme light] [--json report.json] [--click "selector"]
 *     [--eval "JS expression returning a serialisable value"]
 *
 * Launches one headless Chrome with remote debugging, renders the real Vite app,
 * measures layout/occlusion, and captures a viewport screenshot.
 * No application code is modified and no native/OS action is performed.
 */
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync, rmSync, existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { tmpdir } from 'node:os';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? fallback : process.argv[i + 1];
}
const width = Number(arg('width', 1672));
const height = Number(arg('height', 941));
const url = arg('url', 'http://127.0.0.1:3000/#/home');
const out = resolve(arg('out', 'shot.png'));
const jsonOut = arg('json', '');
const locale = arg('locale', 'en');
const theme = arg('theme', 'dark');
const clickSelector = arg('click', '');
const delay = Number(arg('delay', 1600));
const port = Number(arg('port', 9333 + Math.floor(Math.random() * 300)));
const profile = resolve(tmpdir(), `knoux-cdp-${port}`);
const vertical = arg('vertical', ''); // e.g. scroll main container after load
const clipSelector = arg('clip', '');
const evalFile = arg('evalFile', '');
const evalCode = evalFile ? readFileSync(resolve(evalFile), 'utf8') : arg('eval', ''); // one-off diagnostic expression

const chrome = spawn(CHROME, [
  '--headless=new',
  '--disable-gpu',
  '--hide-scrollbars',
  '--force-device-scale-factor=1',
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-extensions',
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${profile}`,
  '--window-size=1600,1000',
  'about:blank',
], { stdio: 'ignore' });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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
  throw new Error('Chrome CDP endpoint did not become ready');
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
  return (method, params = {}) =>
    new Promise((res, reject) => {
      const msgId = ++id;
      pending.set(msgId, { resolve: res, reject });
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
}

const AUDIT_FN = `(() => {
  const vw = window.innerWidth, vh = window.innerHeight;
  const doc = document.documentElement;
  const body = document.body;
  const all = [...document.querySelectorAll('*')];
  // Intersection of an element with all ancestor clip boxes. Elements that are
  // scrolled outside their own table/list viewport are not visible controls and
  // must not be reported as occluded page controls.
  const clippedRect = (el) => {
    const r = el.getBoundingClientRect();
    let left = r.left, right = r.right, top = r.top, bottom = r.bottom;
    let cur = el.parentElement;
    while (cur && cur !== document.body) {
      const cs = getComputedStyle(cur);
      if (/(auto|scroll|hidden)/.test(cs.overflowX) || /(auto|scroll|hidden)/.test(cs.overflowY)) {
        const cr = cur.getBoundingClientRect();
        left = Math.max(left, cr.left); right = Math.min(right, cr.right);
        top = Math.max(top, cr.top); bottom = Math.min(bottom, cr.bottom);
      }
      cur = cur.parentElement;
    }
    return { left, right, top, bottom };
  };
  const interactive = [...document.querySelectorAll('button, a, input, select, textarea, [role="button"], [role="option"], [tabindex]')]
    .filter(el => {
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      if (cs.display === 'none' || cs.visibility === 'hidden' || r.width <= 0 || r.height <= 0 || el.disabled) return false;
      if (r.bottom <= 0 || r.top >= vh) return false;
      const c = clippedRect(el);
      return c.right > c.left + 2 && c.bottom > c.top + 2 && c.bottom > 0 && c.top < vh;
    });
  const covered = [];
  for (const el of interactive.slice(0, 600)) {
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;
    const c = clippedRect(el);
    const x = Math.min(Math.max((c.left + c.right) / 2, 0), vw - 1);
    const y = Math.min(Math.max((c.top + c.bottom) / 2, 0), vh - 1);
    if (y < 0 || y > vh || x < 0 || x > vw) continue;
    const top = document.elementFromPoint(x, y);
    if (!top) continue;
    if (top === el || el.contains(top) || top.contains(el)) continue;
    if (top.closest('[aria-hidden="true"], .pointer-events-none')) continue;
    covered.push({
      tag: el.tagName.toLowerCase(),
      text: (el.innerText || el.getAttribute('aria-label') || el.getAttribute('title') || '').trim().slice(0, 70),
      top: top.tagName.toLowerCase(),
      topText: (top.innerText || '').trim().slice(0, 48),
      rect: [Math.round(c.left), Math.round(c.top), Math.round(c.right - c.left), Math.round(c.bottom - c.top)],
    });
  }
  const escaping = all.filter(el => {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || cs.position === 'fixed') return false;
    if (r.width < 8 || r.height < 8) return false;
    return r.right > vw + 2 || r.left < -2;
  }).slice(0, 25).map(el => ({
    tag: el.tagName.toLowerCase(),
    cls: String(el.className || '').slice(0, 90),
    text: (el.innerText || '').trim().slice(0, 50),
    rect: [Math.round(el.getBoundingClientRect().x), Math.round(el.getBoundingClientRect().y), Math.round(el.getBoundingClientRect().width), Math.round(el.getBoundingClientRect().height)],
  }));
  const scrollers = all.filter(el => el.scrollHeight > el.clientHeight + 4 && ['auto','scroll'].includes(getComputedStyle(el).overflowY))
    .slice(0, 12).map(el => ({
      cls: String(el.className || '').slice(0, 70),
      clientH: el.clientHeight,
      scrollH: el.scrollHeight,
    }));
  const critical = {};
  for (const sel of ['header', 'aside', 'main', 'footer', '[class*="TitleBar"]', '[class*="titlebar"]']) {
    const el = document.querySelector(sel);
    if (el) {
      const r = el.getBoundingClientRect();
      critical[sel] = [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)];
    }
  }
  return {
    viewport: [vw, vh],
    lang: doc.lang, dir: doc.dir, theme: doc.getAttribute('data-theme') || '(none)',
    docScroll: [doc.scrollWidth, doc.scrollHeight],
    bodyScroll: [body.scrollWidth, body.scrollHeight],
    bodyOverflow: getComputedStyle(body).overflow,
    htmlOverflow: getComputedStyle(doc).overflow,
    documentScrolls: doc.scrollHeight > vh + 2 || body.scrollHeight > vh + 2,
    horizontalScrolls: doc.scrollWidth > vw + 2 || body.scrollWidth > vw + 2,
    interactiveCount: interactive.length,
    coveredCount: covered.length,
    covered: covered.slice(0, 12),
    escaping,
    scrollers,
    critical,
    title: document.title,
  };
})()`;

(async () => {
  let ws;
  try {
    const wsUrl = await getWs();
    ws = new WebSocket(wsUrl);
    await new Promise((res, rej) => {
      ws.addEventListener('open', res, { once: true });
      ws.addEventListener('error', rej, { once: true });
    });
    const send = cdp(ws);
    await send('Page.enable');
    await send('Runtime.enable');
    await send('Emulation.setDeviceMetricsOverride', {
      width, height, deviceScaleFactor: 1, mobile: false,
    });

    // Seed locale/theme before the application boots on every navigation.
    await send('Page.addScriptToEvaluateOnNewDocument', {
      source: `try { localStorage.setItem('knoux_locale', ${JSON.stringify(locale)}); localStorage.setItem('knoux_theme', ${JSON.stringify(theme)}); } catch (e) {}`,
    });

    const loaded = new Promise((res) => {
      const t = setTimeout(res, 12000);
      const onMsg = (ev) => {
        const m = JSON.parse(ev.data);
        if (m.method === 'Page.loadEventFired') {
          clearTimeout(t);
          ws.removeEventListener('message', onMsg);
          res();
        }
      };
      ws.addEventListener('message', onMsg);
    });
    await send('Page.navigate', { url });
    await loaded;
    await sleep(delay);

    if (clickSelector) {
      const clickRes = await send('Runtime.evaluate', {
        expression: `(() => {
          const el = document.querySelector(${JSON.stringify(clickSelector)});
          if (!el) return 'MISSING';
          el.scrollIntoView({ block: 'center' });
          el.click();
          return 'CLICKED:' + (el.innerText || '').trim().slice(0, 40);
        })()`,
        returnByValue: true,
      });
      console.log('interaction:', clickRes.result.value);
      await sleep(700);
    }

    if (vertical) {
      await send('Runtime.evaluate', {
        expression: `(() => { const m = document.querySelector('main'); if (m) { m.scrollTop = ${Number(vertical) || 800}; return m.scrollTop; } return 'no-main'; })()`,
        returnByValue: true,
      });
      await sleep(400);
    }

    if (evalCode) {
      const diag = await send('Runtime.evaluate', {
        expression: evalCode,
        returnByValue: true,
        awaitPromise: true,
      });
      console.log('EVAL:', JSON.stringify(diag.result.value, null, 2));
    }

    const audit = await send('Runtime.evaluate', {
      expression: AUDIT_FN, returnByValue: true,
    });
    const value = audit.result.value;
    console.log(JSON.stringify(value, null, 2));

    let clip;
    if (clipSelector) {
      const clipRes = await send('Runtime.evaluate', {
        expression: `(() => { const el = document.querySelector(${JSON.stringify(clipSelector)}); if (!el) return null; el.scrollIntoView({block:'center'}); const r = el.getBoundingClientRect(); return {x:r.x, y:r.y, width:r.width, height:r.height, scale:1}; })()`,
        returnByValue: true,
      });
      clip = clipRes.result.value || undefined;
      await sleep(200);
    }
    const shot = await send('Page.captureScreenshot', {
      format: 'png', fromSurface: true,
      ...(clip ? { clip } : {}),
    });
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, Buffer.from(shot.data, 'base64'));
    console.log(`screenshot: ${out}`);

    if (jsonOut) {
      const final = { url, width, height, locale, theme, audit: value };
      writeFileSync(resolve(jsonOut), JSON.stringify(final, null, 2));
    }
  } finally {
    try { ws?.close(); } catch {}
    chrome.kill();
    await sleep(400);
    try { if (existsSync(profile)) rmSync(profile, { recursive: true, force: true }); } catch {}
  }
})().catch((err) => {
  console.error('AUDIT FAILED:', err.message);
  chrome.kill();
  process.exit(1);
});
