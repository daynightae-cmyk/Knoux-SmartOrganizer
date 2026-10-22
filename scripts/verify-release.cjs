const fs = require('node:fs');
const path = require('node:path');
const { createToolRegistry } = require('../electron/tool-registry.cjs');

const root = path.resolve(__dirname, '..');
const required = [
  'dist/index.html',
  'release/win-unpacked/KNOuX SmartOrganizer.exe',
  'release/KNOuX-SmartOrganizer-Setup-x64.exe',
  'docs/evidence/packaged-settings-smoke.json',
  'docs/evidence/packaged-operations-smoke.json',
  'docs/evidence/installer-smoke.json',
  'docs/evidence/offline-smoke.json',
  'docs/evidence/code-signing.json',
  'docs/evidence/FINAL_ARTIFACT_MANIFEST.json'
];
const forbidden = /\b(mock|fake|dummy|simulate|simulation|coming soon|not implemented|sample result|fake progress)\b/i;
const sourceRoots = ['electron', 'src', 'shared'];
const scanRoots = [...sourceRoots, 'scripts', '.github'];
// A signing key must never reach the repository, and the release workflow
// injects CSC_LINK/CSC_KEY_PASSWORD from CI secrets.
const prohibitedSecretFile = /\.(pfx|p12|pem|key)$/i;
const prohibitedSecretContent = /-----BEGIN (?:RSA |EC |)?PRIVATE KEY-----|(?:CSC_LINK|CSC_KEY_PASSWORD)\s*[:=]\s*["'][^$\s"']{12,}|(?:api[_-]?key|password|token|secret)\s*[:=]\s*["'][A-Za-z0-9+/_=-]{16,}/i;
const failures = [];
for (const relative of required) if (!fs.existsSync(path.join(root, relative))) failures.push(`Missing release evidence or artifact: ${relative}`);
const productionStatus = fs.readFileSync(path.join(root, 'docs/PRODUCTION_STATUS.md'), 'utf8');
const unresolvedStatus = productionStatus.split(/\r?\n/).filter(line => /^\|/.test(line) && /\|\s*(PARTIAL|NOT IMPLEMENTED)\s*\|/.test(line));
if (unresolvedStatus.length) failures.push(`Production status still has unresolved release rows: ${unresolvedStatus.length}`);
for (const folder of scanRoots) {
  const folderPath = path.join(root, folder);
  if (!fs.existsSync(folderPath)) continue;
  const stack = [folderPath];
  while (stack.length) {
    const item = stack.pop();
    for (const entry of fs.readdirSync(item, { withFileTypes: true })) {
      const target = path.join(item, entry.name);
      if (entry.isDirectory()) stack.push(target);
      else if (prohibitedSecretFile.test(entry.name)) failures.push(`Prohibited secret file committed: ${path.relative(root, target)}`);
      else if (/\.(cjs|js|mjs|ts|tsx|json|ya?ml|md|css)$/.test(entry.name)) {
        const text = fs.readFileSync(target, 'utf8');
        if (prohibitedSecretContent.test(text)) failures.push(`Possible secret material in ${path.relative(root, target)}`);
        if (sourceRoots.includes(folder) && forbidden.test(text)) failures.push(`Forbidden operational placeholder term in ${path.relative(root, target)}`);
      }
    }
  }
}
try {
  const registry = createToolRegistry(() => async () => ({ summary: {}, items: [] }));
  if (registry.length < 25) failures.push('Tool registry is below the minimum supported tool surface.');
  for (const tool of registry) {
    if (typeof tool.handler !== 'function' || typeof tool.inputSchema?.safeParse !== 'function' || typeof tool.outputSchema?.safeParse !== 'function') failures.push(`Incomplete registry entry: ${tool.id}`);
  }
} catch (error) { failures.push(`Tool registry validation failed: ${error.message}`); }
if (failures.length) { console.error('Release verification failed:\n' + failures.map(item => `- ${item}`).join('\n')); process.exit(1); }
console.log('Release verification passed.');
