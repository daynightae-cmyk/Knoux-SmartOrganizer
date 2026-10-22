const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const { spawn } = require('node:child_process');
const { removeWhenUnlocked, uninstallApplication } = require('./smoke-process-helpers.cjs');

const root = path.resolve(__dirname, '..');
const setup = path.join(root, 'release', 'KNOuX-SmartOrganizer-Setup-x64.exe');
const evidencePath = path.join(root, 'docs', 'evidence', 'installer-smoke.json');

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
    const uninstall = await uninstallApplication(installDirectory, run);
    uninstallExit = uninstall.exit;
    const removed = uninstall.removed;
    const operations = JSON.parse(await fs.readFile(installedEvidence, 'utf8'));
    await fs.mkdir(path.dirname(evidencePath), { recursive: true });
    await fs.writeFile(evidencePath, JSON.stringify({ capturedAt: new Date().toISOString(), setupExit, installedAppSmokeExit: smokeExit, installedProcessesReaped: uninstall.reapedProcesses, uninstallExit, installDirectoryRemoved: removed, packaged: operations.packaged, smokeAssertions: operations.smokeAssertions }, null, 2), 'utf8');
    await fs.rm(installedEvidence, { force: true });
    console.log('Installer smoke PASS: NSIS install, installed application smoke, and uninstall completed.');
  } finally {
    const leftover = await removeWhenUnlocked(installDirectory);
    if (!leftover.removed) console.warn(`Installer smoke cleanup warning: the disposable install directory could not be fully removed (${leftover.error?.code || leftover.error?.message || 'unknown'}).`);
  }
}

main().catch(error => { console.error(`Installer smoke FAILED: ${error.message}`); process.exitCode = 1; });
