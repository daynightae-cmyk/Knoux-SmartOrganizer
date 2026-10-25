'use strict';

/**
 * Runs the real Electron renderer in a temporary profile, calls one read-only
 * Windows provider through the preload IPC boundary, captures the visible
 * bridge panel and asserts the security envelope.
 *
 *   npm run desktop:smoke             # project Electron + built dist
 *   npm run desktop:packaged-smoke    # release/win-unpacked executable
 */

const path = require('node:path');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const os = require('node:os');
const { spawn } = require('node:child_process');

const appRoot = path.resolve(__dirname, '..');
const packaged = process.argv.includes('--packaged');
const packagedDirArg = process.argv.find((entry) => entry.startsWith('--packaged-dir='));
const packagedDir = packagedDirArg ? packagedDirArg.slice('--packaged-dir='.length) : process.env.KNOUX_PACKAGED_DIR;
const evidenceDir = path.join(appRoot, 'visual-evidence', 'platform-00');
const receiptPath = path.join(evidenceDir, packaged ? 'native-smoke-packaged.json' : 'native-smoke-dev.json');
const shotPath = path.join(evidenceDir, packaged ? 'native-bridge-packaged.png' : 'native-bridge-dev.png');
const summaryPath = path.join(evidenceDir, packaged ? 'native-smoke-summary-packaged.json' : 'native-smoke-summary-dev.json');
const profilePath = path.join(os.tmpdir(), `knoux-gemini-smoke-${process.pid}-${Date.now()}`);

function fail(message) {
  console.error(`[native-smoke] ${message}`);
  process.exit(1);
}

function resolvePackagedExe() {
  const candidates = [
    ...(packagedDir ? [path.resolve(packagedDir)] : []),
    path.join(appRoot, 'release-gemini', 'win-unpacked'),
    path.join(appRoot, 'release', 'win-unpacked'),
  ];
  const dir = candidates.find((candidate) => fs.existsSync(candidate));
  if (!dir) fail('release-gemini/win-unpacked is missing; run npm run desktop:pack first.');
  const exe = fs.readdirSync(dir).find((entry) => entry.toLowerCase().endsWith('.exe') && !/uninstall/i.test(entry));
  if (!exe) fail('No packaged executable found in the packaged output directory.');
  return path.join(dir, exe);
}

async function main() {
  await fsp.mkdir(evidenceDir, { recursive: true });
  await fsp.mkdir(profilePath, { recursive: true });
  const args = [
    `--knoux-native-smoke=${receiptPath}`,
    `--knoux-native-smoke-shot=${shotPath}`,
    `--knoux-user-data=${profilePath}`,
  ];
  let command;
  let commandArgs;
  if (packaged) {
    command = resolvePackagedExe();
    commandArgs = args;
  } else {
    command = require('electron');
    commandArgs = [path.join(appRoot, 'electron', 'main.cjs'), ...args];
  }

  const env = { ...process.env };
  delete env.ELECTRON_RUN_AS_NODE;
  delete env.KNOUX_GEMINI_DEV;
  delete env.KNOUX_NATIVE_FIXTURES;

  const startedAt = new Date().toISOString();
  const child = spawn(command, commandArgs, {
    cwd: packaged ? path.dirname(command) : appRoot,
    env,
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let stdout = '';
  let stderr = '';
  child.stdout.on('data', (chunk) => { stdout += chunk.toString().slice(0, 12000); });
  child.stderr.on('data', (chunk) => { stderr += chunk.toString().slice(0, 12000); });

  const timeout = setTimeout(() => {
    child.kill();
    fail('Electron smoke timed out after 180 seconds.');
  }, 180000);

  const exitCode = await new Promise((resolve, reject) => {
    child.on('error', reject);
    child.on('exit', (code) => resolve(code ?? 1));
  }).catch((error) => {
    clearTimeout(timeout);
    fail(`Electron launch failed: ${error.message}`);
  });
  clearTimeout(timeout);

  let receipt = null;
  try {
    receipt = JSON.parse(await fsp.readFile(receiptPath, 'utf8'));
  } catch (error) {
    fail(`Smoke receipt was not written (${error.message}).\nSTDOUT:\n${stdout}\nSTDERR:\n${stderr}`);
  }

  const shotExists = fs.existsSync(shotPath);
  const shotBytes = shotExists ? (await fsp.stat(shotPath)).size : 0;
  const summary = {
    startedAt,
    finishedAt: new Date().toISOString(),
    mode: packaged ? 'packaged' : 'development',
    command,
    args: commandArgs,
    exitCode,
    receiptPath,
    shotPath,
    shotBytes,
    lightShotPath: shotPath.replace(/\.png$/i, '-light.png'),
    arabicShotPath: shotPath.replace(/\.png$/i, '-ar-light.png'),
    lightShotBytes: receipt?.lightScreenshotBytes || 0,
    arabicShotBytes: receipt?.arabicScreenshotBytes || 0,
    receiptOk: receipt?.ok === true,
    checks: receipt?.checks || null,
    stdoutTail: stdout.slice(-2000),
    stderrTail: stderr.slice(-2000),
  };
  await fsp.writeFile(summaryPath, JSON.stringify(summary, null, 2), 'utf8');

  await fsp.rm(profilePath, { recursive: true, force: true }).catch(() => {});

  console.log(JSON.stringify({ ok: summary.receiptOk && exitCode === 0 && shotBytes > 20000 && summary.lightShotBytes > 20000 && summary.arabicShotBytes > 20000, ...summary }, null, 2));
  if (!summary.receiptOk || exitCode !== 0 || shotBytes <= 20000 || summary.lightShotBytes <= 20000 || summary.arabicShotBytes <= 20000) {
    console.error('[native-smoke] FAILED — inspect native-smoke-dev.json and native-bridge-dev.png');
    process.exit(1);
  }
  console.log('[native-smoke] PASS — secure renderer -> preload -> IPC -> Windows provider -> screenshot');
}

main().catch(async (error) => {
  await fsp.rm(profilePath, { recursive: true, force: true }).catch(() => {});
  fail(error.stack || error.message);
});
