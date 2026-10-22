/**
 * Reinstall smoke — proves the installed product survives an uninstall and a
 * reinstall without losing the user's data.
 *
 * The clean-runner CI job installs, runs, uninstalls and reinstalls the
 * application, but it never checks what happened to the data the application
 * had written. This script closes that gap: it runs the packaged application
 * against a dedicated, isolated user-data directory, records the hashes of the
 * files the application persisted, removes the application completely, and
 * then proves that
 *
 *   - the persisted files are still there, byte for byte, and
 *   - the reinstalled application reads them back as valid data.
 *
 * The user-data directory lives under the system temporary directory and is
 * removed afterwards, so the owner's own settings are never touched.
 */

const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const { spawn } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const setup = path.join(root, 'release', 'KNOuX-SmartOrganizer-Setup-x64.exe');
const evidencePath = path.join(root, 'docs', 'evidence', 'reinstall-smoke.json');
const applicationName = 'KNOuX SmartOrganizer.exe';
const persistedFiles = ['settings.json', 'history.json', 'automations.json'];

function run(file, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(file, args, { windowsHide: true, stdio: 'ignore', ...options });
    const timer = setTimeout(() => { child.kill(); reject(new Error(`Timed out while running ${path.basename(file)}.`)); }, 240000);
    child.once('error', error => { clearTimeout(timer); reject(error); });
    child.once('exit', code => { clearTimeout(timer); resolve(code); });
  });
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function sha256(file) {
  const hash = crypto.createHash('sha256');
  hash.update(await fs.readFile(file));
  return hash.digest('hex');
}

/** The state of the files the application persisted into its user-data directory. */
async function snapshotUserData(userDataDirectory) {
  const files = {};
  for (const name of persistedFiles) {
    const target = path.join(userDataDirectory, name);
    const exists = await fs.access(target).then(() => true).catch(() => false);
    files[name] = { exists, sha256: exists ? await sha256(target) : null };
  }
  return files;
}

async function uninstall(installDirectory) {
  const uninstallers = (await fs.readdir(installDirectory)).filter(name => /^Uninstall .*\.exe$/i.test(name));
  if (uninstallers.length !== 1) throw new Error('Expected exactly one NSIS uninstaller.');
  const exit = await run(path.join(installDirectory, uninstallers[0]), ['/S']);
  if (exit !== 0) throw new Error(`NSIS uninstaller exited with code ${exit}.`);
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const removed = await fs.access(installDirectory).then(() => false).catch(() => true);
    if (removed) return true;
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  const remaining = await fs.readdir(installDirectory).catch(() => []);
  throw new Error(`Install directory was not removed by the uninstaller. Remaining entries: ${remaining.join(', ') || 'unknown'}.`);
}

async function install(installDirectory) {
  const exit = await run(setup, ['/S', `/D=${installDirectory}`]);
  if (exit !== 0) throw new Error(`NSIS installer exited with code ${exit}.`);
  await fs.access(path.join(installDirectory, applicationName));
}

async function runPackagedSmoke(executable, userDataDirectory, evidenceTarget) {
  const exit = await run(process.execPath, [path.join(root, 'scripts', 'packaged-operations-smoke.cjs')], {
    env: { ...process.env, KNOUX_SMOKE_EXECUTABLE: executable, KNOUX_SMOKE_EVIDENCE: evidenceTarget, KNOUX_SMOKE_USER_DATA_DIR: userDataDirectory }
  });
  if (exit !== 0) throw new Error(`Packaged operations smoke exited with code ${exit}.`);
  return JSON.parse(await fs.readFile(evidenceTarget, 'utf8'));
}

async function main() {
  await fs.access(setup);
  const installDirectory = path.join(os.tmpdir(), `knoux-reinstall-smoke-${process.pid}-${Date.now()}`);
  const userDataDirectory = path.join(os.tmpdir(), `knoux-reinstall-userdata-${process.pid}-${Date.now()}`);
  const firstEvidence = path.join(os.tmpdir(), `knoux-reinstall-first-${process.pid}.json`);
  const secondEvidence = path.join(os.tmpdir(), `knoux-reinstall-second-${process.pid}.json`);
  const result = {
    capturedAt: new Date().toISOString(),
    environment: 'Windows host; isolated temporary user-data directory',
    firstInstallExit: null, firstSmokeExit: null, uninstallExit: null, installDirectoryRemoved: null,
    userDataAfterUninstall: null, reinstallExit: null, secondSmokeExit: null, finalUninstallExit: null,
    finalInstallDirectoryRemoved: null, userDataAfterReinstall: null, reloadedDataValid: null
  };
  try {
    await fs.mkdir(userDataDirectory, { recursive: true });

    await install(installDirectory);
    result.firstInstallExit = 0;
    await runPackagedSmoke(path.join(installDirectory, applicationName), userDataDirectory, firstEvidence);
    result.firstSmokeExit = 0;
    const beforeUninstall = await snapshotUserData(userDataDirectory);

    result.uninstallExit = await uninstall(installDirectory);
    result.installDirectoryRemoved = true;

    // The application must leave the user's data alone when it is removed.
    const afterUninstall = await snapshotUserData(userDataDirectory);
    result.userDataAfterUninstall = afterUninstall;
    for (const name of persistedFiles) {
      assert(beforeUninstall[name].exists, `The application did not persist ${name}.`);
      assert(afterUninstall[name].exists, `${name} did not survive the uninstall.`);
      assert(afterUninstall[name].sha256 === beforeUninstall[name].sha256, `${name} was modified by the uninstall.`);
    }

    await install(installDirectory);
    result.reinstallExit = 0;
    await runPackagedSmoke(path.join(installDirectory, applicationName), userDataDirectory, secondEvidence);
    result.secondSmokeExit = 0;

    // The reinstalled application has to read its own earlier data back.
    const settings = JSON.parse(await fs.readFile(path.join(userDataDirectory, 'settings.json'), 'utf8'));
    const history = JSON.parse(await fs.readFile(path.join(userDataDirectory, 'history.json'), 'utf8'));
    const automations = JSON.parse(await fs.readFile(path.join(userDataDirectory, 'automations.json'), 'utf8'));
    assert(settings.settingsVersion === 2, 'The reinstalled application did not read a valid settings version.');
    assert(Array.isArray(history), 'The reinstalled application did not read a valid history.');
    assert(automations?.version === 1 && Array.isArray(automations.schedules), 'The reinstalled application did not read a valid automation store.');
    result.reloadedDataValid = { settingsVersion: settings.settingsVersion, historyRecords: history.length, automationStoreVersion: automations.version, automationSchedules: automations.schedules.length };
    result.userDataAfterReinstall = await snapshotUserData(userDataDirectory);

    result.finalUninstallExit = await uninstall(installDirectory);
    result.finalInstallDirectoryRemoved = true;

    await fs.mkdir(path.dirname(evidencePath), { recursive: true });
    await fs.writeFile(evidencePath, JSON.stringify(result, null, 2), 'utf8');
    console.log('Reinstall smoke PASS: install, run, uninstall, reinstall and run completed with the user data intact.');
  } finally {
    await fs.rm(installDirectory, { recursive: true, force: true });
    await fs.rm(userDataDirectory, { recursive: true, force: true });
    await fs.rm(firstEvidence, { force: true });
    await fs.rm(secondEvidence, { force: true });
  }
}

main().catch(error => { console.error(`Reinstall smoke FAILED: ${error.message}`); process.exitCode = 1; });
