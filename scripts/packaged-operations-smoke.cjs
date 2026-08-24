const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const { spawn, execFile } = require('node:child_process');
const { promisify } = require('node:util');

const projectRoot = path.resolve(__dirname, '..');
const executable = process.env.KNOUX_SMOKE_EXECUTABLE ? path.resolve(process.env.KNOUX_SMOKE_EXECUTABLE) : path.join(projectRoot, 'release', 'win-unpacked', 'KNOuX SmartOrganizer.exe');
const evidencePath = process.env.KNOUX_SMOKE_EVIDENCE ? path.resolve(process.env.KNOUX_SMOKE_EVIDENCE) : path.join(projectRoot, 'docs', 'evidence', 'packaged-operations-smoke.json');
const execFileAsync = promisify(execFile);
const currentUserRunKey = 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function launch(exe, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(exe, args, { windowsHide: true, stdio: 'ignore' });
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error('Packaged operations smoke timed out after 90 seconds.'));
    }, 90000);
    child.once('error', error => { clearTimeout(timer); reject(error); });
    child.once('exit', code => { clearTimeout(timer); resolve(code); });
  });
}

async function main() {
  await fs.access(executable);
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'knoux-packaged-operations-'));
  const startupValue = `KNOuXSmoke_${process.pid}_${Date.now()}`;
  const fixture = path.join(root, 'fixture');
  const cleanupFixture = path.join(root, 'cleanup-fixture');
  const cancelFixture = path.join(root, 'cancellation-fixture');
  const output = path.join(root, 'operations-evidence.json');
  const settingsOutput = path.join(root, 'settings-evidence.json');
  let completed = false;
  try {
    await fs.mkdir(fixture, { recursive: true });
    await execFileAsync('reg.exe', ['add', currentUserRunKey, '/v', startupValue, '/t', 'REG_SZ', '/d', 'cmd.exe /c exit 0', '/f'], { windowsHide: true, timeout: 10000 });
    await fs.mkdir(cleanupFixture, { recursive: true });
    await fs.mkdir(cancelFixture, { recursive: true });
    for (let index = 0; index < 130; index += 1) { const child = path.join(cancelFixture, `entry-${index}`); await fs.mkdir(child); await fs.writeFile(path.join(child, 'fixture.txt'), String(index), 'utf8'); }
    await fs.writeFile(path.join(fixture, 'hash-fixture.txt'), 'KNOuX packaged operation smoke\n', 'utf8');
    await fs.writeFile(path.join(fixture, 'duplicate-a.txt'), 'same-content\n', 'utf8');
    await fs.writeFile(path.join(fixture, 'duplicate-b.txt'), 'same-content\n', 'utf8');
    await fs.writeFile(path.join(fixture, 'photo.jpg'), 'fixture-image', 'utf8');
    const agedFile = path.join(cleanupFixture, 'recoverable-aged-temp-file.tmp');
    await fs.writeFile(agedFile, 'this file must be restored after quarantine', 'utf8');
    const oldDate = new Date(Date.now() - 31 * 86400000);
    await fs.utimes(agedFile, oldDate, oldDate);

    const appArgs = [
      `--knoux-settings-smoke-output=${settingsOutput}`,
      `--knoux-operation-smoke-output=${output}`,
      `--knoux-operation-smoke-fixture=${fixture}`,
      `--knoux-temp-cleanup-smoke-fixture=${cleanupFixture}`,
      `--knoux-cancel-smoke-fixture=${cancelFixture}`,
      `--knoux-startup-smoke-value=${startupValue}`
    ];
    if (process.env.KNOUX_SMOKE_OFFLINE === '1') appArgs.push('--host-rules=MAP * 0.0.0.0');
    const code = await launch(executable, appArgs);
    assert(code === 0, `Packaged operations smoke exited with code ${code}.`);
    const report = JSON.parse(await fs.readFile(output, 'utf8'));
    const settingsReport = JSON.parse(await fs.readFile(settingsOutput, 'utf8'));
    const evidence = report.evidence || {}; const accessibility = settingsReport.evidence?.accessibility || {};
    const required = ['health', 'smartScan', 'servicesInventory', 'serviceDryRun', 'disks', 'processes', 'battery', 'startupItems', 'installedApps', 'networkDiagnostics', 'hardwareInventory', 'eventWarnings', 'emptyFolders', 'downloadsInventory', 'hash', 'large', 'duplicates', 'preview', 'apply', 'undo', 'cleanupPreview', 'cleanupApply', 'cleanupUndo', 'startupDisable', 'startupRestore', 'automationRun', 'adminDryRun'];
    assert(report.packaged === true && settingsReport.packaged === true, 'Smoke did not run in a packaged application.');
    assert(accessibility.applied === true, 'React did not apply the requested accessibility setting transition.');
    assert(accessibility.lang === 'ar' && accessibility.dir === 'rtl', 'Arabic locale did not apply RTL document metadata.');
    assert(accessibility.theme === 'high-contrast' && accessibility.motion === 'reduced' && accessibility.fontScale === '1.5', 'High contrast, reduced motion, or font scale did not apply.');
    assert(accessibility.keyboardFocusable === true, 'A visible button could not receive keyboard focus.');
    for (const key of required) assert(evidence[key]?.success === true, `Expected successful packaged operation: ${key}.`);
    assert(evidence.cleanupPreview.summary.eligibleFiles === 1, 'Cleanup preview did not limit itself to the disposable aged fixture.');
    assert(evidence.cleanupApply.summary.quarantinedFiles === 1, 'Cleanup apply did not quarantine exactly one disposable file.');
    assert(evidence.cleanupUndo.summary.restoredFiles === 1, 'Cleanup undo did not restore the disposable file.');
    assert(Array.isArray(evidence.repairDryRuns) && evidence.repairDryRuns.length === 8 && evidence.repairDryRuns.every(result => result.success === true && result.summary?.dryRun === true && result.summary?.allowlisted === true), 'Not every allowlisted repair completed its packaged dry-run proof.');
    assert(evidence.serviceCandidate?.name && evidence.serviceDryRun?.summary?.dryRun === true && evidence.serviceDryRun?.summary?.allowlisted === true, 'Service dry run did not use a non-protected service with a fixed allowlisted action.');
    assert(evidence.startupDisable.summary.valueName === startupValue && evidence.startupDisable.summary.changed === true, 'Startup disable did not affect the unique smoke value.');
    assert(evidence.startupRestore.summary.valueName === startupValue && evidence.startupRestore.summary.changed === true, 'Startup restore did not restore the unique smoke value.');
    assert(evidence.automation?.toolId === 'system-health' && evidence.automation.enabled === true, 'Automation did not create the bounded health schedule.');
    assert(evidence.automationRun?.success === true && evidence.automationRemoved === true, 'Automation did not run successfully and remove its Task Scheduler entry.');
    assert(evidence.cancellation?.success === false && evidence.cancellation.errors?.some(error => String(error).includes('cancelled')), 'Cancellation request did not produce a cancelled operation.');
    for (const phase of ['queued', 'preflight', 'running', 'progress', 'cancelled']) assert(evidence.lifecyclePhases?.includes(phase), `Cancellation lifecycle is missing ${phase}.`);
    const restoredStartup = await execFileAsync('reg.exe', ['query', currentUserRunKey, '/v', startupValue], { windowsHide: true, timeout: 10000 });
    assert(restoredStartup.stdout.includes(startupValue), 'Startup value is absent after restore.');
    await fs.access(agedFile);
    await fs.mkdir(path.dirname(evidencePath), { recursive: true });
    await fs.writeFile(evidencePath, JSON.stringify({ ...report, smokeAssertions: { cleanupFixtureIsolated: true, permanentDeletionObserved: false, cleanupFileRestored: true, startupFixtureIsolated: true, startupValueRestored: true, cancellationObserved: true, lifecyclePhases: evidence.lifecyclePhases, accessibilityVerified: true, accessibility, automationVerified: true, servicesDryRunVerified: true, repairsDryRunVerified: true } }, null, 2), 'utf8');
    console.log('Packaged operations smoke PASS: cleanup preview, quarantine, and undo were verified in a disposable temporary fixture.');
    completed = true;
  } finally {
    if (!completed) await fs.copyFile(output, path.join(projectRoot, 'docs', 'evidence', 'packaged-operations-smoke-failure.json')).catch(() => {});
    await execFileAsync('reg.exe', ['delete', currentUserRunKey, '/v', startupValue, '/f'], { windowsHide: true, timeout: 10000 }).catch(() => {});
    await fs.rm(root, { recursive: true, force: true });
  }
}

main().catch(error => {
  console.error(`Packaged operations smoke FAILED: ${error.message}`);
  process.exitCode = 1;
});
