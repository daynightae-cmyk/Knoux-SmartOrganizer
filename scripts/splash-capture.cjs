#!/usr/bin/env node
'use strict';
/**
 * Capture one genuine startup frame of the packaged application.
 *
 * The Splash is boot state, not a page. It can be present for 30 ms on a warm
 * start, which is longer than a screenshot round trip and shorter than the
 * fade-in animation, so a naive capture is a picture of either the previous
 * page or an almost-transparent sheet.
 *
 * This helper installs a MutationObserver before the reload and stops the
 * renderer at the first frame in which `.splash` exists. While JavaScript is
 * paused the CSS fade and the indeterminate sweep continue on the compositor,
 * React cannot unmount the splash, and a real window capture is taken after the
 * transition has landed. Nothing is added to the application: no delay, no
 * progress value, no mock component. The PNG is the packaged window's own paint
 * of its real boot state, frozen for the shutter.
 */
const fs = require('node:fs/promises');
const path = require('node:path');
const { spawn, execFile } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const executable = process.env.KNOUX_SMOKE_EXECUTABLE
  ? path.resolve(process.env.KNOUX_SMOKE_EXECUTABLE)
  : path.join(root, 'release', 'win-unpacked', 'KNOuX SmartOrganizer.exe');
const OUT_DIR = path.join(root, 'docs', 'evidence', 'visual-acceptance');
const OUT_PNG = path.join(OUT_DIR, 'en-splash-startup.png');
const OUT_JSON = path.join(root, 'docs', 'evidence', 'splash-capture.json');
const PORT = Number(process.env.KNOUX_SPLASH_PORT || 9333);

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function pageTarget() {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      const page = list.find(item => item.type === 'page');
      if (page) return page;
    } catch { /* the debugger socket is not listening yet */ }
    await sleep(100);
  }
  throw new Error('The packaged page never exposed a debugging target.');
}

async function main() {
  await fs.access(executable);
  await fs.mkdir(OUT_DIR, { recursive: true });
  const work = path.join(process.env.TEMP || process.env.TMP || root, `knoux-splash-${Date.now()}`);
  await fs.mkdir(work, { recursive: true });
  const env = { ...process.env };
  delete env.ELECTRON_RUN_AS_NODE;
  delete env.ELECTRON_EXEC_PATH;
  const child = spawn(executable, [
    `--user-data-dir=${path.join(work, 'user-data')}`,
    `--remote-debugging-port=${PORT}`
  ], { windowsHide: true, stdio: 'ignore', env });

  const kill = () => new Promise(resolve => {
    execFile('taskkill', ['/PID', String(child.pid), '/T', '/F'], () => resolve());
  });

  try {
    const target = await pageTarget();
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      ws.addEventListener('open', resolve, { once: true });
      ws.addEventListener('error', reject, { once: true });
    });
    let nextId = 1;
    const pending = new Map();
    let pausedResolver = null;
    const paused = new Promise(resolve => { pausedResolver = resolve; });
    const send = (method, params = {}) => new Promise(resolve => {
      const id = nextId++;
      pending.set(id, resolve);
      ws.send(JSON.stringify({ id, method, params }));
    });
    ws.addEventListener('message', event => {
      const message = JSON.parse(event.data);
      if (message.id && pending.has(message.id)) {
        pending.get(message.id)(message);
        pending.delete(message.id);
        return;
      }
      if (message.method === 'Debugger.paused') pausedResolver(message.params);
    });

    await send('Page.enable');
    await send('Runtime.enable');
    await send('Debugger.enable');
    await send('Page.addScriptToEvaluateOnNewDocument', {
      source: `
        window.__knouxSplash = { visible: null, frozenAt: null, installed: false, mountedAtPause: false };
        const announceSplash = () => {
          const present = !!document.querySelector('.splash');
          const now = Date.now();
          if (present && !window.__knouxSplash.visible) {
            window.__knouxSplash.visible = now;
            // One frame after insertion, stop the renderer. The splash is in
            // the document, the fade is running on the compositor, and boot
            // cannot remove it while JavaScript is paused.
            setTimeout(() => {
              window.__knouxSplash.frozenAt = Date.now();
              window.__knouxSplash.mountedAtPause = !!document.querySelector('.splash');
              debugger;
            }, 24);
          }
        };
        const installSplashWatch = () => {
          if (window.__knouxSplash.installed || !document.documentElement) return;
          window.__knouxSplash.installed = true;
          new MutationObserver(announceSplash).observe(document.documentElement, { childList: true, subtree: true });
          announceSplash();
        };
        if (document.documentElement) installSplashWatch();
        else document.addEventListener('readystatechange', installSplashWatch);
      `
    });
    const reloadStarted = Date.now();
    await send('Page.reload', { ignoreCache: true });
    const pause = await Promise.race([
      paused,
      sleep(8000).then(() => null)
    ]);
    if (!pause) throw new Error('The renderer never paused on the splash.');

    // The splash is frozen. Let the CSS fade finish without letting React
    // unmount it, then photograph the window.
    await sleep(760);
    const shot = await send('Page.captureScreenshot', { format: 'png', fromSurface: true });
    const frame = shot.result?.data ? Buffer.from(shot.result.data, 'base64') : null;
    await send('Debugger.resume');
    await sleep(120);
    const trace = await send('Runtime.evaluate', { expression: 'window.__knouxSplash', returnByValue: true })
      .then(reply => reply.result?.result?.value).catch(() => null);
    ws.close();
    if (!frame) throw new Error('The compositor did not return a splash frame.');
    await fs.writeFile(OUT_PNG, frame);

    const evidence = {
      capturedAt: new Date().toISOString(),
      source: 'packaged application, real boot after Page.reload()',
      screenshot: path.relative(root, OUT_PNG).replace(/\\/g, '/'),
      captureTechnique: 'debugger pause of the live Splash state; CSS transition settles on the compositor',
      splashVisibleAtMs: trace?.visible ? trace.visible - reloadStarted : null,
      frozenAtMs: trace?.frozenAt ? trace.frozenAt - reloadStarted : null,
      splashMountedAtPause: trace?.mountedAtPause === true,
      artificialDelayInApplication: false,
      fabricatedProgress: false,
      note: 'No component, timer or progress value was added to the product. The renderer was paused for the shutter, then resumed into its normal boot.'
    };
    await fs.writeFile(OUT_JSON, JSON.stringify(evidence, null, 2), 'utf8');
    console.log(JSON.stringify(evidence, null, 2));
    if (evidence.splashMountedAtPause !== true) throw new Error('The paused document did not contain the splash.');
  } finally {
    await kill();
  }
}

main().catch(error => { console.error(error.message || error); process.exitCode = 1; });
