const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const { spawn } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const setup = path.join(root, 'release', 'KNOuX-SmartOrganizer-Setup-x64.exe');
const packagedSmoke = path.join(root, 'scripts', 'packaged-operations-smoke.cjs');
const evidencePath = path.join(root, 'docs', 'evidence', 'reinstall-smoke.json');

function run(file, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(file, args, { windowsHide: true, stdio: 'ignore', ...options });
    const timer = setTimeout(() => { child.kill(); reject(new Error(`Timed out while running ${path.basename(file)}.`)); }, 300000);
    child.once('error', error => { clearTimeout(timer); reject(error); });
    child.once('exit', code => { clearTimeout(timer); resolve(code); });
  });
}
async function hash(filePath) { return crypto.createHash('sha256').update(await fs.readFile(filePath)).digest('hex'); }
async function exists(filePath) { return fs.access(filePath).then(() => true).catch(() => false); }
async function waitForRemoval(target) { for (let attempt = 0; attempt < 60; attempt += 1) { if (!await exists(target)) return true; await new Promise(resolve => setTimeout(resolve, 500)); } return false; }

async function main() {
  await fs.access(setup);
  const rootTemp = await fs.mkdtemp(path.join(os.tmpdir(), 'knoux-reinstall-smoke-'));
  const installDirectory = path.join(rootTemp, 'installed');
  const userDataDirectory = path.join(rootTemp, 'user-data');
  const firstEvidence = path.join(rootTemp, 'first-smoke.json');
  const secondEvidence = path.join(rootTemp, 'second-smoke.json');
  let installExit = null; let uninstallExit = null; let reinstallExit = null; let firstSmokeExit = null; let secondSmokeExit = null;
  try {
    installExit = await run(setup, ['/S', `/D=${installDirectory}`]);
    if (installExit !== 0) throw new Error(`Initial silent install exited with code ${installExit}.`);
    const executable = path.join(installDirectory, 'KNOuX SmartOrganizer.exe');
    await fs.access(executable);
    firstSmokeExit = await run(process.execPath, [packagedSmoke], { env: { ...process.env, KNOUX_SMOKE_EXECUTABLE: executable, KNOUX_SMOKE_EVIDENCE: firstEvidence, KNOUX_SMOKE_USER_DATA_DIR: userDataDirectory } });
    if (firstSmokeExit !== 0) throw new Error(`Initial installed-app smoke exited with code ${firstSmokeExit}.`);
    const persisted = ['settings.json', 'history.json', 'automations.json'];
    const persistedPaths = Object.fromEntries(persisted.map(name => [name, path.join(userDataDirectory, name)]));
    for (const filePath of Object.values(persistedPaths)) await fs.access(filePath);
    const beforeHashes = Object.fromEntries(await Promise.all(Object.entries(persistedPaths).map(async ([name, filePath]) => [name, await hash(filePath)])));
    const uninstallers = (await fs.readdir(installDirectory)).filter(name => /^Uninstall .*\.exe$/i.test(name));
    if (uninstallers.length !== 1) throw new Error('Expected exactly one NSIS uninstaller before reinstall acceptance.');
    uninstallExit = await run(path.join(installDirectory, uninstallers[0]), ['/S']);
    if (uninstallExit !== 0) throw new Error(`Silent uninstall exited with code ${uninstallExit}.`);
    const installDirectoryRemoved = await waitForRemoval(installDirectory);
    if (!installDirectoryRemoved) throw new Error('Program directory remains after uninstall.');
    const preservationAfterUninstall = Object.fromEntries(await Promise.all(Object.entries(persistedPaths).map(async ([name, filePath]) => [name, { exists: await exists(filePath), hashMatches: await exists(filePath) && await hash(filePath) === beforeHashes[name] }])));
    if (!Object.values(preservationAfterUninstall).every(value => value.exists && value.hashMatches)) throw new Error('Uninstall did not preserve isolated user data exactly as documented.');
    reinstallExit = await run(setup, ['/S', `/D=${installDirectory}`]);
    if (reinstallExit !== 0) throw new Error(`Reinstall exited with code ${reinstallExit}.`);
    await fs.access(executable);
    secondSmokeExit = await run(process.execPath, [packagedSmoke], { env: { ...process.env, KNOUX_SMOKE_EXECUTABLE: executable, KNOUX_SMOKE_EVIDENCE: secondEvidence, KNOUX_SMOKE_USER_DATA_DIR: userDataDirectory } });
    if (secondSmokeExit !== 0) throw new Error(`Reinstalled-app smoke exited with code ${secondSmokeExit}.`);
    const afterSettings = JSON.parse(await fs.readFile(persistedPaths['settings.json'], 'utf8'));
    const afterHistory = JSON.parse(await fs.readFile(persistedPaths['history.json'], 'utf8'));
    const afterAutomation = JSON.parse(await fs.readFile(persistedPaths['automations.json'], 'utf8'));
    if (afterSettings.settingsVersion !== 2 || !Array.isArray(afterHistory) || afterAutomation.version !== 1 || !Array.isArray(afterAutomation.schedules)) throw new Error('Reinstalled application did not read persisted local data safely.');
    const finalUninstaller = (await fs.readdir(installDirectory)).find(name => /^Uninstall .*\.exe$/i.test(name));
    const finalUninstallExit = finalUninstaller ? await run(path.join(installDirectory, finalUninstaller), ['/S']) : null;
    const finalInstallDirectoryRemoved = finalUninstallExit === 0 ? await waitForRemoval(installDirectory) : false;
    await fs.mkdir(path.dirname(evidencePath), { recursive: true });
    await fs.writeFile(evidencePath, JSON.stringify({ capturedAt: new Date().toISOString(), scope: 'same-version uninstall and reinstall preservation acceptance', previousVersionUpgrade: 'NOT_AVAILABLE: no prior published release artifact exists in this repository.', installExit, firstSmokeExit, uninstallExit, installDirectoryRemoved, preservationAfterUninstall, reinstallExit, secondSmokeExit, finalUninstallExit, finalInstallDirectoryRemoved, persisted: { settingsVersion: afterSettings.settingsVersion, historyRecordCount: afterHistory.length, automationRecordCount: afterAutomation.schedules.length } }, null, 2), 'utf8');
    console.log('Reinstall smoke PASS: isolated user data survived uninstall and was read by the reinstalled packaged application.');
  } finally {
    await fs.rm(rootTemp, { recursive: true, force: true });
  }
}

main().catch(error => { console.error(`Reinstall smoke FAILED: ${error.message}`); process.exitCode = 1; });
