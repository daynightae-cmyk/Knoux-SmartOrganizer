const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');

const execFileAsync = promisify(execFile);
const root = path.resolve(__dirname, '..');
const pkg = require(path.join(root, 'package.json'));
const output = path.join(root, 'docs', 'evidence', 'FINAL_ARTIFACT_MANIFEST.json');
const signingPath = path.join(root, 'docs', 'evidence', 'code-signing.json');
const artifacts = [
  ['installer', path.join(root, 'release', 'KNOuX-SmartOrganizer-Setup-x64.exe')],
  ['mainExecutable', path.join(root, 'release', 'win-unpacked', 'KNOuX SmartOrganizer.exe')]
];
async function sha256(filePath) { const hash = crypto.createHash('sha256'); hash.update(await fs.readFile(filePath)); return hash.digest('hex'); }
async function gitSha() { const { stdout } = await execFileAsync('git', ['rev-parse', 'HEAD'], { cwd: root }); return stdout.trim(); }
async function main() {
  const signing = JSON.parse(await fs.readFile(signingPath, 'utf8'));
  const manifest = { generatedAt: new Date().toISOString(), gitSha: await gitSha(), version: pkg.version, node: process.version, npm: process.env.npm_config_user_agent || 'unknown', electron: pkg.devDependencies.electron, electronBuilder: pkg.devDependencies['electron-builder'], signingState: signing.signingState, artifacts: {} };
  for (const [name, filePath] of artifacts) { const stat = await fs.stat(filePath); manifest.artifacts[name] = { path: path.relative(root, filePath).replaceAll('\\', '/'), bytes: stat.size, sha256: await sha256(filePath), signature: signing.artifacts.find(item => item.artifact.replaceAll('\\', '/') === path.relative(root, filePath).replaceAll('\\', '/')) || null }; }
  await fs.mkdir(path.dirname(output), { recursive: true });
  await fs.writeFile(output, JSON.stringify(manifest, null, 2), 'utf8');
  console.log(`Final artifact manifest written: ${path.relative(root, output)}`);
}
main().catch(error => { console.error(`Artifact manifest generation failed: ${error.message}`); process.exitCode = 1; });
