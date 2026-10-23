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
        // KNOUX_SMOKE_ONLY narrows the run to one or more scenario names or page
        // names, comma separated, which turns a twenty-second layout question
        // into a twenty-second answer instead of a six-minute full pass — and
        // lets a run span two worlds when the defect lives in the handover
        // between them.
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
      // size proves nothing about the layout it is filed under. The comparison is
      // against the size the harness could actually ask for on this display: the
      // window is anchored inside the work area, so a request larger than the
      // monitor is recorded as clamped rather than failed.
      if (scenario.captureSizeMatches === false) failures.push(`${scenario.name}: the window was ${scenario.capturedWidth}x${scenario.capturedHeight} with a ${scenario.viewportWidth}x${scenario.viewportHeight} page area and the PNG is ${scenario.frameWidth}x${scenario.frameHeight}, not the ${scenario.targetWidth}x${scenario.targetHeight} the scenario asked for.`);
      if (!scenario.headings?.length) failures.push(`${scenario.name}: the page rendered no heading.`);
      // When a scenario scrolls to a region so that the capture can show it, the
      // scroll has to have found something. Otherwise the screenshot is of the
      // top of the page and the region gate below is vouching for pixels that
      // were never on screen. And finding it is not enough: a region whose top
      // edge sits above the frame is a picture of its tail, which is how a
      // ladder panel photographed from its third row down passed for evidence.
      if (scenario.scrollTo && scenario.scrolledTo?.found !== true) {
        failures.push(`${scenario.name}: the capture asked to scroll to ${scenario.scrollTo} and that region was never reached.`);
      }
      if (scenario.scrollTo && scenario.scrolledTo?.found === true && scenario.scrolledTo?.topInView === false) {
        failures.push(`${scenario.name}: the capture of ${scenario.scrollTo} starts ${Math.abs(scenario.scrolledTo.offset)}px above the frame, so the picture shows the tail of that region rather than the region.`);
      }
      // The world in the picture has to be the world the scenario asked for.
      // Every gate below reads the surface it grades — bays, lanes, ledger rows,
      // rungs — and each of them reports zero when the window is showing a
      // different world. That turns one navigation failure into ten invented
      // design defects, which is exactly what this suite did once. So the
      // mismatch is named as itself, the world gates stand down, and the PNG is
      // still filed: the wrong document is evidence of a real race, it is just
      // not evidence about the atlas.
      const wrongWorld = scenario.pageReached === false;
      if (wrongWorld) {
        failures.push(`${scenario.name}: the capture shows the ${scenario.documentPage || 'unreported'} world, not the ${scenario.page} world the scenario asked for, so its layout was not graded.`);
      }
      // A capture of a data-driven world is only acceptance evidence when the
      // data actually arrived. An empty inventory screenshot passes every layout
      // measurement and proves nothing about the populated interface.
      if (!wrongWorld && scenario.page === 'applications') {
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
      // The Files bench is a directory read, so the same rule applies: a capture
      // of an empty ledger says nothing about the ledger. The plan scenarios go
      // further — they ask the real organisation engine to run and wait for its
      // answer to land in the DOM.
      if (!wrongWorld && scenario.page === 'files') {
        if (!(scenario.fileRows >= 5)) failures.push(`${scenario.name}: the Files ledger rendered ${scenario.fileRows ?? 0} rows; a populated capture needs at least 5.`);
        if (!(scenario.fileSegments >= 2)) failures.push(`${scenario.name}: the composition band drew ${scenario.fileSegments ?? 0} segments, so the proportional view was never exercised.`);
        if (scenario.requiresInspector && !scenario.fileInspectorOpen) failures.push(`${scenario.name}: the metadata inspector did not open (${scenario.fileRows ?? 0} rows were rendered).`);
        // The unselected inspector is a data panel: it carries the walk's own
        // folder and extension groupings, so a Files capture with nothing selected
        // still has to be showing measured rows instead of an empty column.
        const glanceMarks = (scenario.fileGlanceRows ?? 0) + (scenario.fileGlanceTiles ?? 0);
        if (!scenario.fileInspectorOpen && !(glanceMarks >= 3)) {
          failures.push(`${scenario.name}: the unselected inspector drew ${glanceMarks} grouping marks, so the column carries no data.`);
        }
        if (scenario.requiresPlan && !scenario.filePlanPresent) failures.push(`${scenario.name}: the organisation plan never arrived from the preview engine.`);
        // The one gate that is about safety rather than looks: the product must
        // never offer to move files until the user has ticked the confirmation.
        if (scenario.fileConfirmPresent && !scenario.fileConfirmChecked && scenario.fileApplyEnabled) {
          failures.push(`${scenario.name}: Apply is enabled while the confirmation checkbox is unticked.`);
        }
      }
      // The Volume Atlas is a read of the Windows volume table, so the rack is the
      // evidence: a world with no rails is a machine that did not answer, and that
      // is a failed capture rather than a passing empty state. The walked scenarios
      // go one further and demand that a real directory walk landed its ledger and
      // its composition ladders in the document.
      if (!wrongWorld && scenario.page === 'storage') {
        if (!(scenario.atlasBays >= 1)) failures.push(`${scenario.name}: the volume rack drew ${scenario.atlasBays ?? 0} bays, so no Windows volume was read.`);
        if (!(scenario.atlasRails >= 1)) failures.push(`${scenario.name}: ${scenario.atlasBays ?? 0} volumes were read but none drew a rail to scale.`);
        if (!(scenario.atlasMetrics >= 4)) failures.push(`${scenario.name}: the head metric rail shows ${scenario.atlasMetrics ?? 0} figures; the atlas promises at least four.`);
        if (!scenario.atlasLanes) failures.push(`${scenario.name}: the walk bench rendered ${scenario.atlasLanes ?? 0} of its three lanes.`);
        // The band that says which numbers may not be added together is part of the
        // measurement, not decoration: without it the bench invites the reader to
        // sum two walks that were never summed.
        if (!scenario.atlasCaveat) failures.push(`${scenario.name}: the honesty band over the three walks is missing.`);
        if (scenario.requiresLedger) {
          if (!(scenario.atlasRows >= 5)) failures.push(`${scenario.name}: the heavy walk filled ${scenario.atlasRows ?? 0} ledger rows; a populated capture needs at least 5.`);
          if (!(scenario.atlasRungs >= 6)) failures.push(`${scenario.name}: the composition ladders drew ${scenario.atlasRungs ?? 0} rungs, so the share-of-walked-bytes view was never exercised.`);
        }
        if (scenario.requiresInspector && !scenario.atlasInspectorOpen) failures.push(`${scenario.name}: the inspector did not open on a ledger row (${scenario.atlasRows ?? 0} rows were rendered).`);
        // The folder record is the one fed by the empties walk, and the only record
        // drawn from a read rather than a measurement. A picked folder row that
        // opens nothing but a heading is the defect, so the gate asks for the marked
        // record rather than for the inspector in general.
        if (scenario.requiresFolder && !scenario.atlasFolderRecord) {
          failures.push(`${scenario.name}: the empties walk filled ${scenario.atlasRows ?? 0} folder rows and picking one opened no folder record.`);
        }
        // The unselected inspector is the read board: the volume the reader is
        // standing on plus one line per walk. A storage capture with nothing
        // picked still has to be showing three reads, or the column is a stub.
        if (!scenario.atlasInspectorOpen) {
          if (!(scenario.atlasReadLanes === 3)) {
            failures.push(`${scenario.name}: the read board listed ${scenario.atlasReadLanes ?? 0} of the three walks, so the idle inspector carries no measurement.`);
          }
          if (!scenario.atlasReadVolume) {
            failures.push(`${scenario.name}: ${scenario.atlasBays ?? 0} volumes were read but the idle inspector shows none of them.`);
          }
        }
      }
      // Text that cannot be read is not a matter of taste. Anything below a
      // two-to-one ratio against every background it could be sitting on is
      // invisible, and the usual cause is a theme that repaints the surfaces
      // while the inherited text colour stays where it was.
      const invisible = (scenario.lowContrast || []).filter(entry => entry.level === 'invisible');
      if (invisible.length) failures.push(`${scenario.name}: ${invisible.length} text element(s) sit below 2:1 against their surface: ${invisible.map(entry => `${entry.tag}.${entry.className} "${entry.text}" at ${entry.ratio}`).join('; ')}`);
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
    // The lane composition only reads as designed when it holds lanes. On a
    // machine whose downloads genuinely organise into nothing, an empty plan is
    // the honest result and must not be reported as a layout defect — but it has
    // to be recorded, because that screenshot is not evidence of the lanes.
    const notes = [];
    const clamped = records.filter(record => record.clampedToWorkArea);
    if (clamped.length) {
      const area = clamped[0].workArea;
      notes.push(`${clamped.length} scenario(s) asked for a window larger than this machine's work area (${area.width}x${area.height} at scale ${clamped[0].displayScale}) and were captured at the largest size the display can show: ${clamped.map(record => `${record.name} ${record.requestedWidth}x${record.requestedHeight} -> ${record.targetWidth}x${record.targetHeight}`).join(', ')}.`);
    }
    const reclaimed = records.filter(record => record.maximizeRecoveries > 0);
    if (reclaimed.length) {
      notes.push(`${reclaimed.length} capture(s) had the window maximised by the shell while the page settled, and were re-placed before the frame was taken: ${reclaimed.map(record => `${record.name} (${record.maximizeRecoveries}x)`).join(', ')}. Each of those PNGs was measured at the scenario size after the correction.`);
    }
    const nudged = records.filter(record => record.surfaceNudges > 0);
    if (nudged.length) {
      notes.push(`${nudged.length} capture(s) had to wake the window surface with a geometry change before the compositor answered: ${nudged.map(record => `${record.name} (${record.surfaceNudges}x)`).join(', ')}. The frame filed for each is the one taken after the wake-up.`);
    }
    // Everything between readable and comfortable is recorded for review rather
    // than failed: a small bold label at 2.8:1 is a judgement call, an invisible
    // heading is not.
    const weak = new Map();
    for (const record of records) {
      for (const entry of (record.lowContrast || [])) {
        if (entry.level !== 'weak') continue;
        const key = `${entry.tag}.${entry.className}`;
        const seen = weak.get(key) || { ratio: entry.ratio, scenarios: [] };
        seen.scenarios.push(record.name);
        seen.ratio = Math.min(seen.ratio, entry.ratio);
        weak.set(key, seen);
      }
    }
    if (weak.size) notes.push(`${weak.size} element kind(s) measure between 2:1 and 3.2:1 against their surface — legible, but listed for review: ${[...weak.entries()].map(([key, value]) => `${key} at ${value.ratio} in ${value.scenarios.length} capture(s)`).join('; ')}.`);
    const planCaptures = records.filter(record => record.requiresPlan && record.filePlanPresent);
    if (planCaptures.length && !planCaptures.some(record => record.filePlanLanes > 0)) {
      notes.push('Every organisation plan came back with no category lanes; the lane composition was captured empty. This is the engine\'s real answer for this machine, not a layout failure.');
    }
    const evidence = {
      capturedAt: report.capturedAt,
      packaged: report.packaged,
      scope: 'Real screenshots of the packaged application window: window size, locale direction, theme and populated-inventory coverage. The window is anchored inside the primary display work area, so a request larger than the monitor is captured at the largest achievable size and recorded as clamped. Windows display-scaling behaviour across a DPI matrix is not claimed.',
      scenarios: records,
      notes,
      failures
    };
    await fs.writeFile(evidencePath, JSON.stringify(evidence, null, 2), 'utf8');
    if (failures.length) throw new Error(`Visual acceptance found ${failures.length} problem(s): ${failures.join(' | ')}`);
    console.log(`Visual acceptance PASS: ${records.length} scenarios captured from the packaged application with no horizontal overflow.`);
  } finally {
    // A capture that fails is usually a timing story told by the application's
    // own progress log, and that log lives in the temporary work directory.
    // KNOUX_VISUAL_KEEP_WORKDIR leaves it in place and names it, so the run can
    // be read instead of guessed at.
    if (process.env.KNOUX_VISUAL_KEEP_WORKDIR) {
      console.log(`Visual acceptance work directory kept: ${workDirectory}`);
    } else {
      await fs.rm(workDirectory, { recursive: true, force: true });
    }
  }
}

main().catch(error => { console.error(`Visual acceptance FAILED: ${error.message}`); process.exitCode = 1; });
