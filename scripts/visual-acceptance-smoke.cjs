#!/usr/bin/env node
'use strict';
/**
 * Visual acceptance harness.
 *
 * It launches the PACKAGED application, lets the application capture its own
 * window, and records the layout measurements read from the live document.
 * Every PNG is a real screenshot of the running product.
 */

const fs = require('node:fs/promises');
const fsSync = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawn } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const executable = process.env.KNOUX_SMOKE_EXECUTABLE
  ? path.resolve(process.env.KNOUX_SMOKE_EXECUTABLE)
  : path.join(root, 'release', 'win-unpacked', 'KNOuX SmartOrganizer.exe');
const evidenceDirectory = path.join(root, 'docs', 'evidence');
const evidencePath = path.join(evidenceDirectory, 'visual-acceptance.json');
const screenshotDirectory = path.join(evidenceDirectory, 'visual-acceptance');
// The harness reloads the packaged application once per scenario and captures the
// real window each time. Each reload boots the app, measures system health and, on
// the data-driven worlds, reads the system inventory before the capture is taken,
// so the budget has to cover real work rather than a fixed guess.
const SMOKE_TIMEOUT_MS = Number(process.env.KNOUX_SMOKE_TIMEOUT_MS || 1800000);

function run(exe, args, logPath) {
  return new Promise((resolve, reject) => {
    // The application's own output is kept, so a failure names its cause.
    const stream = fsSync.createWriteStream(logPath, { flags: 'a' });
    const env = { ...process.env };
    // A packaged Electron binary started with ELECTRON_RUN_AS_NODE parses its
    // command line as Node: it answers every application switch with
    // "bad option" and exits before a window exists. The variable is inherited
    // by any harness launched from inside an Electron host, so the launch
    // environment is cleaned here instead of being left to the caller's shell.
    delete env.ELECTRON_RUN_AS_NODE;
    delete env.ELECTRON_EXEC_PATH;
    const child = spawn(exe, args, { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'], env });
    child.stdout.pipe(stream);
    child.stderr.pipe(stream);    const timer = setTimeout(() => { child.kill(); reject(new Error(`Visual acceptance smoke timed out after ${Math.round(SMOKE_TIMEOUT_MS / 1000)} seconds.`)); }, SMOKE_TIMEOUT_MS);
    child.once('error', error => { clearTimeout(timer); reject(error); });
    child.once('exit', code => { clearTimeout(timer); stream.end(); resolve(code); });
  });
}

async function main() {
  await fs.access(executable);
  const workDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'knoux-visual-'));
  const output = path.join(workDirectory, 'visual.json');
  const applicationLog = path.join(workDirectory, 'application.log');
  const userDataDirectory = path.join(workDirectory, 'user-data');
  try {
    let code;
    try {
      code = await run(executable, [
        `--knoux-visual-smoke-output=${output}`,
        `--user-data-dir=${userDataDirectory}`,
        // KNOUX_SMOKE_ONLY narrows the run to one scenario name or one page,
        // which turns a twenty-second layout question into a twenty-second
        // answer instead of a six-minute full pass.
        ...(process.env.KNOUX_SMOKE_ONLY ? [`--knoux-visual-smoke-only=${process.env.KNOUX_SMOKE_ONLY}`] : [])
      ], applicationLog);
    } catch (error) {
      // The harness records its own progress, so a run that stops tells where
      // it stopped instead of only that it stopped.
      const progress = await fs.readFile(path.join(workDirectory, 'visual-progress.log'), 'utf8').catch(() => '');
      const tail = progress.trim().split(/\r?\n/).slice(-12).join('\n');
      throw new Error(`${error.message}\nHarness progress:\n${tail || '(no progress was recorded)'}`);
    }
    if (code !== 0) {
      const tail = await fs.readFile(applicationLog, 'utf8').catch(() => '');
      throw new Error(`Visual acceptance smoke exited with code ${code}. Application output:\n${tail.trim().split(/\r?\n/).slice(-25).join('\n') || '(the application produced no output)'}`);
    }
    const report = JSON.parse(await fs.readFile(output, 'utf8'));
    if (report.packaged !== true) throw new Error('Visual acceptance did not run in a packaged application.');
    const scenarios = Array.isArray(report.scenarios) ? report.scenarios : [];
    await fs.mkdir(screenshotDirectory, { recursive: true });
    const failures = [];
    const records = [];
    for (const scenario of scenarios) {
      if (scenario.error) { failures.push(`${scenario.name}: ${scenario.error}`); continue; }
      if (scenario.horizontalOverflow === true) failures.push(`${scenario.name}: the layout overflows horizontally (${scenario.clientWidth} visible, ${scenario.scrollWidth} needed).`);
      // The elements that escape their parent are recorded as evidence. They
      // are not a gate on their own, because a decoration or a hover movement
      // can also cross a boundary without anything being unreadable.
      if (!scenario.focusable || scenario.focusable < 3) failures.push(`${scenario.name}: only ${scenario.focusable} focusable elements were found.`);
      const expectedDir = scenario.locale === 'ar' ? 'rtl' : 'ltr';
      if (scenario.dir !== expectedDir) failures.push(`${scenario.name}: document direction is ${scenario.dir}, expected ${expectedDir}.`);
      if (scenario.lang !== scenario.locale) failures.push(`${scenario.name}: document language is ${scenario.lang}, expected ${scenario.locale}.`);
      if (scenario.theme !== undefined && scenario.expectedTheme && scenario.theme !== scenario.expectedTheme) failures.push(`${scenario.name}: theme is ${scenario.theme}, expected ${scenario.expectedTheme}.`);
      // The image has to show the size it claims. A capture taken at another
      // size proves nothing about the layout it is filed under.
      if (scenario.captureSizeMatches === false) failures.push(`${scenario.name}: the window was ${scenario.capturedWidth}x${scenario.capturedHeight} instead of the requested ${scenario.requestedWidth}x${scenario.requestedHeight}.`);
      if (!scenario.headings?.length) failures.push(`${scenario.name}: the page rendered no heading.`);
      // A capture of a data-driven world is only acceptance evidence when the
      // data actually arrived. An empty inventory screenshot passes every layout
      // measurement and proves nothing about the populated interface.
      if (scenario.page === 'applications') {
        if (!(scenario.rows >= 5)) failures.push(`${scenario.name}: the Applications inventory rendered ${scenario.rows ?? 0} rows; a populated capture needs at least 5.`);
        if (scenario.requiresDossier && !scenario.dossierOpen) failures.push(`${scenario.name}: the application dossier did not open (${scenario.rows ?? 0} rows were rendered).`);
        // The tick count separates the two ways this can fail: the clicks never
        // landed on a row, or they landed and the selection was dropped again.
        if (scenario.requiresDeck && !scenario.deckPresent) failures.push(`${scenario.name}: the staging deck did not appear after multi-selection (${scenario.stagedTicks ?? 0} of 4 rows were still ticked).`);
        // A tray that renders outside the captured viewport is not a tray the
        // screenshot can vouch for, so the gate asks for the box, not the node.
        if (scenario.requiresDeck && scenario.deckPresent && !scenario.deckOnScreen) {
          const box = scenario.deckBox;
          failures.push(`${scenario.name}: the staging deck is in the document but off the captured viewport (${box ? `top ${box.top}, bottom ${box.bottom} of a ${box.viewport}px viewport` : 'no box measured'}).`);
        }
      }
      const source = path.join(workDirectory, scenario.file);
      await fs.copyFile(source, path.join(screenshotDirectory, scenario.file));
      records.push(scenario);
    }
    // Every scenario the application was asked to capture has to be present.
    // A shortened run is a failure, not a smaller pass.
    if (records.length < scenarios.length) failures.push(`Expected ${scenarios.length} captured scenarios, got ${records.length}.`);
    const inventoryCaptures = records.filter(record => record.page === 'applications');
    if (inventoryCaptures.length && !inventoryCaptures.some(record => record.nativeIcons > 0)) {
      failures.push('No capture contained a Windows-extracted application icon; the Applications world is showing only typographic fallbacks.');
    }
    const evidence = {
      capturedAt: report.capturedAt,
      packaged: report.packaged,
      scope: 'Real screenshots of the packaged application window: window size, locale direction, theme and populated-inventory coverage. Windows display-scaling behaviour across a DPI matrix is not claimed.',
      scenarios: records,
      failures
    };
    await fs.writeFile(evidencePath, JSON.stringify(evidence, null, 2), 'utf8');
    if (failures.length) throw new Error(`Visual acceptance found ${failures.length} problem(s): ${failures.join(' | ')}`);
    console.log(`Visual acceptance PASS: ${records.length} scenarios captured from the packaged application with no horizontal overflow.`);
  } finally {
    await fs.rm(workDirectory, { recursive: true, force: true });
  }
}

main().catch(error => { console.error(`Visual acceptance FAILED: ${error.message}`); process.exitCode = 1; });
