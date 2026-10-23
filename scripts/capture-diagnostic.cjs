#!/usr/bin/env node
'use strict';
/**
 * Capture diagnostic — not part of the acceptance suite.
 *
 * The visual acceptance run died repeatedly with "the capture produced no frame
 * in time": the page was alive (its DOM answered every query), the window was
 * the size and place it claimed, and only the compositor had stopped talking.
 *
 * This script answers the question in about twenty seconds, without the packaged
 * app and without the acceptance suite:
 *
 *   npx electron scripts/capture-diagnostic.cjs
 *   npx electron scripts/capture-diagnostic.cjs --no-occlusion
 *   npx electron scripts/capture-diagnostic.cjs --cover=0
 *
 * (Run it with ELECTRON_RUN_AS_NODE cleared, or `require('electron').app` is
 * undefined and the probe never starts.)
 *
 * It opens a window, loads a page, and probes for a frame at each step that the
 * acceptance harness performs: a window that has only ever been shown, one that
 * has just been moved two pixels and back, one that has been minimised and
 * restored, and one that has been covered by another window.
 */

const { app, BrowserWindow, screen } = require('electron');

const has = name => process.argv.some(argument => argument === `--${name}`);
const value = (name, fallback) => {
  const prefix = `--${name}=`;
  const found = process.argv.find(argument => argument.startsWith(prefix));
  return found ? found.slice(prefix.length) : fallback;
};

if (has('no-occlusion')) {
  app.commandLine.appendSwitch('disable-features', 'CalculateNativeWinOcclusion');
  app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');
  app.commandLine.appendSwitch('disable-renderer-backgrounding');
}

const settle = ms => new Promise(resolve => setTimeout(resolve, ms));

async function probe(label, window) {
  const state = await window.webContents
    .executeJavaScript('({ visibility: document.visibilityState, hasFocus: document.hasFocus(), width: window.innerWidth, height: window.innerHeight })')
    .catch(error => ({ error: String(error && error.message) }));
  let frame = null;
  let failure = null;
  const started = Date.now();
  try {
    const image = await Promise.race([
      window.capturePage(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('no frame')), 8000))
    ]);
    frame = image.isEmpty() ? 'empty' : `${image.getSize().width}x${image.getSize().height}`;
  } catch (error) { failure = String(error && error.message); }
  console.log(`[probe] ${label}: ${JSON.stringify({ ...state, frame, failure, ms: Date.now() - started })}`);
  return frame !== null && frame !== undefined;
}

/** Move the window out by a few pixels and back — the smallest geometry change
 *  a compositor cannot ignore, and the one the acceptance harness can afford. */
async function jog(window, origin) {
  window.setBounds({ x: origin.x + 6, y: origin.y + 4, width: 1200, height: 800 });
  await settle(140);
  window.setBounds({ x: origin.x, y: origin.y, width: 1200, height: 800 });
  await settle(220);
}

app.whenReady().then(async () => {
  const area = screen.getPrimaryDisplay().workArea;
  const origin = { x: area.x + 24, y: area.y + 24 };
  const coverOther = value('cover', '1') !== '0';
  const onTop = has('ontop');

  const target = new BrowserWindow({
    width: 1200,
    height: 800,
    x: origin.x,
    y: origin.y,
    show: true,
    webPreferences: { sandbox: true, contextIsolation: true }
  });
  await target.loadURL('data:text/html;charset=utf-8,<html><body style="margin:0;background:%23111320"><h1 style="color:%23f7f5ff;font:700 40px system-ui">frame probe</h1></body></html>');
  if (onTop) target.setAlwaysOnTop(true);
  target.focus();
  await settle(600);

  console.log(`[setup] occlusionSwitch=${has('no-occlusion') ? 'disabled' : 'default'} cover=${coverOther ? 'yes' : 'no'} onTop=${onTop ? 'yes' : 'no'} workArea=${area.width}x${area.height}`);
  await probe('shown-only', target);

  // The fault under investigation: a window that has been shown but never moved
  // answers capturePage() with UnknownVizError — "no visual for this window" —
  // while the page reports itself visible and focused. Does a two-pixel round
  // trip produce the visual, and does the visual survive once it exists?
  await jog(target, origin);
  await probe('after-jog', target);
  await probe('jog-persists', target);

  // What the harness does when the shell takes the window away: minimise,
  // restore, and ask for a frame without moving it anywhere.
  target.minimize();
  await settle(500);
  target.restore();
  target.focus();
  await settle(600);
  await probe('after-minimise-restore', target);
  await jog(target, origin);
  await probe('jog-after-restore', target);

  // And the two facts the harness depends on: a programmatic bounds change is
  // accepted, and the frame survives it. (A window made non-resizable is *not*
  // programmatically resizable — measured, and the harness avoids that trick.)
  target.setBounds({ x: area.x + 60, y: area.y + 60, width: 1000, height: 700 });
  await settle(300);
  const after = target.getBounds();
  console.log(`[resize] bounds=${after.width}x${after.height}@${after.x},${after.y} accepted=${after.width === 1000 && after.height === 700}`);
  await probe('after-resize', target);

  if (coverOther) {
    const cover = new BrowserWindow({
      x: area.x + 40,
      y: area.y + 40,
      width: 1400,
      height: 900,
      show: true,
      frame: false,
      transparent: false,
      webPreferences: { sandbox: true }
    });
    await cover.loadURL('data:text/html;charset=utf-8,<html><body style="margin:0;background:%23ff0000"></body></html>');
    cover.setAlwaysOnTop(true, 'screen-saver');
    cover.moveTop();
    await settle(4000);
    console.log('[cover] cover window placed over the probe; waiting for occlusion to be noticed');
    await probe('behind-cover', target);
    cover.close();
    await settle(1500);
  }

  await probe('restored', target);

  console.log('[done]');
  app.exit(0);
});
