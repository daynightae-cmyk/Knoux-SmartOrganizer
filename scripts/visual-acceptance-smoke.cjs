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
// The harness reloads the packaged application six times and captures the real
// window each time. Each reload boots the app and measures system health, so
// the budget has to cover real work rather than a fixed guess.
const SMOKE_TIMEOUT_MS = Number(process.env.KNOUX_SMOKE_TIMEOUT_MS || 900000);

function run(exe, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(exe, args, { windowsHide: true, stdio: 'ignore' });
    const timer = setTimeout(() => { child.kill(); reject(new Error(`Visual acceptance smoke timed out after ${Math.round(SMOKE_TIMEOUT_MS / 1000)} seconds.`)); }, SMOKE_TIMEOUT_MS);
    child.once('error', error => { clearTimeout(timer); reject(error); });
    child.once('exit', code => { clearTimeout(timer); resolve(code); });
  });
}

async function main() {
  await fs.access(executable);
  const workDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'knoux-visual-'));
  const output = path.join(workDirectory, 'visual.json');
  try {
    const code = await run(executable, [`--knoux-visual-smoke-output=${output}`]);
    if (code !== 0) throw new Error(`Visual acceptance smoke exited with code ${code}.`);
    const report = JSON.parse(await fs.readFile(output, 'utf8'));
    if (report.packaged !== true) throw new Error('Visual acceptance did not run in a packaged application.');
    const scenarios = Array.isArray(report.scenarios) ? report.scenarios : [];
    if (scenarios.length < 6) throw new Error(`Expected six visual scenarios, got ${scenarios.length}.`);
    await fs.mkdir(screenshotDirectory, { recursive: true });
    const failures = [];
    const records = [];
    for (const scenario of scenarios) {
      if (scenario.error) { failures.push(`${scenario.name}: ${scenario.error}`); continue; }
      if (scenario.horizontalOverflow === true) failures.push(`${scenario.name}: the layout overflows horizontally.`);
      if (!scenario.focusable || scenario.focusable < 3) failures.push(`${scenario.name}: only ${scenario.focusable} focusable elements were found.`);
      const expectedDir = scenario.locale === 'ar' ? 'rtl' : 'ltr';
      if (scenario.dir !== expectedDir) failures.push(`${scenario.name}: document direction is ${scenario.dir}, expected ${expectedDir}.`);
      if (scenario.lang !== scenario.locale) failures.push(`${scenario.name}: document language is ${scenario.lang}, expected ${scenario.locale}.`);
      const source = path.join(workDirectory, scenario.file);
      await fs.copyFile(source, path.join(screenshotDirectory, scenario.file));
      records.push(scenario);
    }
    const evidence = {
      capturedAt: report.capturedAt,
      packaged: report.packaged,
      scope: 'Real screenshots of the packaged application window. Window-size coverage only; Windows display-scaling behaviour across a DPI matrix is not claimed.',
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
