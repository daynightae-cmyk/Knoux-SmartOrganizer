const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const { spawn } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const setup = path.join(root, 'release', 'KNOuX-SmartOrganizer-Setup-x64.exe');
const evidencePath = path.join(root, 'docs', 'evidence', 'installer-smoke.json');

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

/**
 * True only when the path really is gone.
 *
 * An access error is not proof of absence: a directory being deleted can still
 * reject with EPERM or EBUSY while its files are mapped by a process that has
 * not exited yet. Treating those as "removed" turns a locked file into a false
 * pass, so only the errors that mean "no such entry" count.
 */
async function isAbsent(target) {
  try {
    await fs.access(target);
    return false;
  } catch (error) {
    return error.code === 'ENOENT' || error.code === 'ENOTDIR';
  }
}

async function removeWhenUnlocked(target, attempts = 20) {
  let lastError = null;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      await fs.rm(target, { recursive: true, force: true });
      return { removed: await isAbsent(target), error: null };
    } catch (error) {
      lastError = error;
      if (error.code === 'ENOENT') return { removed: true, error: null };
      await sleep(500);
    }
  }
  return { removed: await isAbsent(target), error: lastError };
}

function run(file, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(file, args, { windowsHide: true, stdio: 'ignore', ...options });
    const timer = setTimeout(() => { child.kill(); reject(new Error(`Timed out while running ${path.basename(file)}.`)); }, 240000);
    child.once('error', error => { clearTimeout(timer); reject(error); });
    child.once('exit', code => { clearTimeout(timer); resolve(code); });
  });
}

async function main() {
  await fs.access(setup);
  const installDirectory = path.join(os.tmpdir(), `knoux-installer-smoke-${process.pid}-${Date.now()}`);
  const installedEvidence = path.join(root, 'docs', 'evidence', 'installer-packaged-operations-smoke.json');
  let setupExit = null;
  let smokeExit = null;
  let uninstallExit = null;
  try {
    setupExit = await run(setup, ['/S', `/D=${installDirectory}`]);
    if (setupExit !== 0) throw new Error(`NSIS installer exited with code ${setupExit}.`);
    const installedExecutable = path.join(installDirectory, 'KNOuX SmartOrganizer.exe');
    await fs.access(installedExecutable);
    smokeExit = await run(process.execPath, [path.join(root, 'scripts', 'packaged-operations-smoke.cjs')], { env: { ...process.env, KNOUX_SMOKE_EXECUTABLE: installedExecutable, KNOUX_SMOKE_EVIDENCE: installedEvidence } });
    if (smokeExit !== 0) throw new Error(`Installed application smoke exited with code ${smokeExit}.`);
    // Chromium may release the installed executable's mapped DLLs a moment
    // after the application process reports exit. Uninstalling into that window
    // leaves a locked file behind.
    await sleep(1500);
    const uninstallers = (await fs.readdir(installDirectory)).filter(name => /^Uninstall .*\.exe$/i.test(name));
    if (uninstallers.length !== 1) throw new Error('Expected exactly one NSIS uninstaller.');
    uninstallExit = await run(path.join(installDirectory, uninstallers[0]), ['/S']);
    if (uninstallExit !== 0) throw new Error(`NSIS uninstaller exited with code ${uninstallExit}.`);
    let removed = false;
    for (let attempt = 0; attempt < 60; attempt += 1) { removed = await isAbsent(installDirectory); if (removed) break; await sleep(500); }
    if (!removed) { const remaining = await fs.readdir(installDirectory).catch(() => []); throw new Error(`Installer directory was not removed by the uninstaller. Remaining entries: ${remaining.join(', ') || 'unknown'}.`); }
    const operations = JSON.parse(await fs.readFile(installedEvidence, 'utf8'));
    await fs.mkdir(path.dirname(evidencePath), { recursive: true });
    await fs.writeFile(evidencePath, JSON.stringify({ capturedAt: new Date().toISOString(), setupExit, installedAppSmokeExit: smokeExit, uninstallExit, installDirectoryRemoved: removed, packaged: operations.packaged, smokeAssertions: operations.smokeAssertions }, null, 2), 'utf8');
    await fs.rm(installedEvidence, { force: true });
    console.log('Installer smoke PASS: NSIS install, installed application smoke, and uninstall completed.');
  } finally {
    const leftover = await removeWhenUnlocked(installDirectory);
    if (!leftover.removed) console.warn(`Installer smoke cleanup warning: the disposable install directory could not be fully removed (${leftover.error?.code || leftover.error?.message || 'unknown'}).`);
  }
}

main().catch(error => { console.error(`Installer smoke FAILED: ${error.message}`); process.exitCode = 1; });
