const fs = require('node:fs/promises');
const fsSync = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawn, execFile } = require('node:child_process');
const { promisify } = require('node:util');

const projectRoot = path.resolve(__dirname, '..');
const executable = process.env.KNOUX_SMOKE_EXECUTABLE ? path.resolve(process.env.KNOUX_SMOKE_EXECUTABLE) : path.join(projectRoot, 'release', 'win-unpacked', 'KNOuX SmartOrganizer.exe');
const evidencePath = process.env.KNOUX_SMOKE_EVIDENCE ? path.resolve(process.env.KNOUX_SMOKE_EVIDENCE) : path.join(projectRoot, 'docs', 'evidence', 'packaged-operations-smoke.json');
const execFileAsync = promisify(execFile);
const currentUserRunKey = 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run';
// The smoke drives roughly two dozen real Windows operations back to back.
// On a low-power host that sequence measures well over a minute, so a fixed
// 90-second wall clock produced false failures that proved nothing.
const SMOKE_TIMEOUT_MS = Number(process.env.KNOUX_SMOKE_TIMEOUT_MS || 600000);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function launch(exe, args, logPath) {
  return new Promise((resolve, reject) => {
    // The application's own output is kept. A packaged application that dies
    // without a word used to produce a bare exit code, which named no cause.
    const stream = fsSync.createWriteStream(logPath, { flags: 'a' });
    const child = spawn(exe, args, { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    child.stdout.pipe(stream);
    child.stderr.pipe(stream);
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error(`Packaged operations smoke timed out after ${Math.round(SMOKE_TIMEOUT_MS / 1000)} seconds.`));
    }, SMOKE_TIMEOUT_MS);
    child.once('error', error => { clearTimeout(timer); reject(error); });
    child.once('exit', code => { clearTimeout(timer); stream.end(); resolve(code); });
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
  const applicationLog = path.join(root, 'application.log');
  let completed = false;
  let failureMessage = null;
  try {
    await fs.mkdir(fixture, { recursive: true });
    await execFileAsync('reg.exe', ['add', currentUserRunKey, '/v', startupValue, '/t', 'REG_SZ', '/d', 'cmd.exe /c exit 0', '/f'], { windowsHide: true, timeout: 10000 });
    await fs.mkdir(cleanupFixture, { recursive: true });
    await fs.mkdir(cancelFixture, { recursive: true });
    // The cancellation fixture has to be big enough that the scan is still
    // running when the cancel request arrives. A tiny fixture finished before
    // the request could land, which produced a false failure.
    for (let index = 0; index < 900; index += 1) { const child = path.join(cancelFixture, `entry-${index}`); await fs.mkdir(child); await fs.writeFile(path.join(child, 'fixture.txt'), String(index), 'utf8'); }
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
      '--knoux-cancel-hold-ms=1000',
      `--knoux-startup-smoke-value=${startupValue}`
    ];
    if (process.env.KNOUX_SMOKE_OFFLINE === '1') appArgs.push('--host-rules=MAP * 0.0.0.0');
    // The smoke runs against a disposable user-data directory. It writes
    // settings, history and schedules, and it must not touch the settings the
    // owner actually uses.
    const userDataDirectory = process.env.KNOUX_SMOKE_USER_DATA_DIR ? path.resolve(process.env.KNOUX_SMOKE_USER_DATA_DIR) : path.join(root, 'user-data');
    await fs.mkdir(userDataDirectory, { recursive: true });
    appArgs.push(`--user-data-dir=${userDataDirectory}`);
    const code = await launch(executable, appArgs, applicationLog);
    if (code !== 0) {
      // The application's own words are the diagnosis. Without them a bare
      // exit code names no cause at all.
      const tail = await fs.readFile(applicationLog, 'utf8').catch(() => '');
      const detail = tail.trim().split(/\r?\n/).slice(-25).join('\n');
      throw new Error(`Packaged operations smoke exited with code ${code}. Application output:\n${detail || '(the application produced no output)'}`);
    }
    const report = JSON.parse(await fs.readFile(output, 'utf8'));
    const settingsReport = JSON.parse(await fs.readFile(settingsOutput, 'utf8'));
    const evidence = report.evidence || {}; const accessibility = settingsReport.evidence?.accessibility || {};
    const required = ['health', 'smartScan', 'servicesInventory', 'serviceDryRun', 'disks', 'processes', 'battery', 'startupItems', 'installedApps', 'networkDiagnostics', 'hardwareInventory', 'eventWarnings', 'emptyFolders', 'downloadsInventory', 'hash', 'large', 'duplicates', 'preview', 'apply', 'undo', 'cleanupPreview', 'cleanupApply', 'cleanupUndo', 'startupDisable', 'startupRestore', 'automationRun', 'adminDryRun'];
    assert(report.packaged === true && settingsReport.packaged === true, 'Smoke did not run in a packaged application.');
    assert(accessibility.applied === true, 'React did not apply the requested accessibility setting transition.');
    assert(accessibility.lang === 'ar' && accessibility.dir === 'rtl', 'Arabic locale did not apply RTL document metadata.');
    assert(accessibility.theme === 'high-contrast' && accessibility.motion === 'reduced' && accessibility.fontScale === '1.5', 'High contrast, reduced motion, or font scale did not apply.');
    assert(accessibility.keyboardFocusable === true, 'A visible button could not receive keyboard focus.');
    assert(settingsReport.evidence?.writeObserved === true, 'A settings change was not persisted and read back.');
    assert(settingsReport.evidence?.sectionResetObserved === true, 'Resetting a settings section did not restore its value.');
    assert(settingsReport.evidence?.handlersAvailable === true, 'Not every tool reported a usable availability probe.');
    assert(settingsReport.evidence?.toolCount >= 34, `The tool registry reported ${settingsReport.evidence?.toolCount} services instead of the expected surface.`);
    for (const key of required) {
      const detail = evidence[key]?.errors?.length ? ` Errors: ${JSON.stringify(evidence[key].errors)}` : '';
      assert(evidence[key]?.success === true, `Expected successful packaged operation: ${key}.${detail}`);
    }
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
    const vault = report.clipboard || {};
    assert(vault.captured === true, 'The Clipboard Vault did not capture a real Windows clipboard entry.');
    assert(vault.capturedType === 'text', 'The Clipboard Vault did not capture the clipboard entry as text.');
    assert(vault.capturedDuringPause === false, 'The Clipboard Vault captured content while capture was paused.');
    assert(vault.capturedAfterResume === true, 'The Clipboard Vault did not capture content after capture was resumed.');
    assert(vault.pinned === true, 'The Clipboard Vault did not pin a captured entry.');
    assert(vault.deleted === true, 'The Clipboard Vault did not delete a captured entry.');
    assert(vault.clearedItems >= 1 && vault.itemsAfterClear === 0, 'The Clipboard Vault did not clear its history.');
    assert(vault.storageMode === 'encrypted' || vault.persistenceAvailable === false, 'The Clipboard Vault reported an impossible storage mode.');
    if (vault.storageMode === 'encrypted') assert(vault.encryptionAvailable === true, 'The Clipboard Vault claimed encrypted storage without an available operating-system key.');
    const restoredStartup = await execFileAsync('reg.exe', ['query', currentUserRunKey, '/v', startupValue], { windowsHide: true, timeout: 10000 });
    assert(restoredStartup.stdout.includes(startupValue), 'Startup value is absent after restore.');
    await fs.access(agedFile);
    await fs.mkdir(path.dirname(evidencePath), { recursive: true });
    await fs.writeFile(evidencePath, JSON.stringify({ ...report, smokeAssertions: { cleanupFixtureIsolated: true, permanentDeletionObserved: false, cleanupFileRestored: true, startupFixtureIsolated: true, startupValueRestored: true, cancellationObserved: true, lifecyclePhases: evidence.lifecyclePhases, accessibilityVerified: true, accessibility, automationVerified: true, servicesDryRunVerified: true, repairsDryRunVerified: true, clipboardVaultVerified: true, clipboardVault: { captured: vault.captured, capturedDuringPause: vault.capturedDuringPause, capturedAfterResume: vault.capturedAfterResume, pinned: vault.pinned, deleted: vault.deleted, clearedItems: vault.clearedItems, storageMode: vault.storageMode, encryptionAvailable: vault.encryptionAvailable } } }, null, 2), 'utf8');
    console.log('Packaged operations smoke PASS: cleanup preview, quarantine, and undo were verified in a disposable temporary fixture.');
    completed = true;
  } catch (error) {
    failureMessage = error?.message || String(error);
    throw error;
  } finally {
    if (!completed) {
      const failureTarget = path.join(projectRoot, 'docs', 'evidence', 'packaged-operations-smoke-failure.json');
      const report = await fs.readFile(output, 'utf8').then(text => JSON.parse(text)).catch(error => ({ capturedAt: new Date().toISOString(), error: String(error?.message || error) }));
      const settingsReport = await fs.readFile(settingsOutput, 'utf8').then(text => JSON.parse(text)).catch(error => ({ error: String(error?.message || error) }));
      const applicationOutput = await fs.readFile(applicationLog, 'utf8').catch(() => '');
      const failure = JSON.stringify({ ...report, failure: failureMessage, startupValue, settingsReport, applicationOutput: applicationOutput.slice(-8000) }, null, 2);
      await fs.writeFile(failureTarget, failure, 'utf8').catch(() => {});
      if (path.resolve(evidencePath) !== path.resolve(failureTarget)) await fs.writeFile(evidencePath, failure, 'utf8').catch(() => {});
    }
    await execFileAsync('reg.exe', ['delete', currentUserRunKey, '/v', startupValue, '/f'], { windowsHide: true, timeout: 10000 }).catch(() => {});
    await fs.rm(root, { recursive: true, force: true });
  }
}

main().catch(error => {
  console.error(`Packaged operations smoke FAILED: ${error.message}`);
  process.exitCode = 1;
});