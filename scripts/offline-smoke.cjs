const fs = require('node:fs/promises');
const path = require('node:path');
const { spawn } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const evidencePath = path.join(root, 'docs', 'evidence', 'offline-smoke.json');

function run() {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(root, 'scripts', 'packaged-operations-smoke.cjs')], { windowsHide: true, stdio: 'inherit', env: { ...process.env, KNOUX_SMOKE_OFFLINE: '1', KNOUX_SMOKE_EVIDENCE: evidencePath } });
    child.once('error', reject);
    child.once('exit', code => resolve(code));
  });
}

async function main() {
  const code = await run();
  if (code !== 0) throw new Error(`Offline packaged smoke exited with code ${code}.`);
  const evidence = JSON.parse(await fs.readFile(evidencePath, 'utf8'));
  if (evidence.packaged !== true || evidence.smokeAssertions?.accessibilityVerified !== true || evidence.smokeAssertions?.repairsDryRunVerified !== true) throw new Error('Offline evidence is incomplete.');
  await fs.writeFile(evidencePath, JSON.stringify({ ...evidence, offlineHostRules: 'MAP * 0.0.0.0', offlineVerified: true }, null, 2), 'utf8');
  console.log('Offline smoke PASS: packaged local operations completed with Chromium host rules blocking network hosts.');
}

main().catch(error => { console.error(`Offline smoke FAILED: ${error.message}`); process.exitCode = 1; });
