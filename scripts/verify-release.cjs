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
  'docs/evidence/reinstall-smoke.json',
  'docs/evidence/visual-acceptance.json',
  'docs/evidence/code-signing.json',
  'docs/evidence/FINAL_ARTIFACT_MANIFEST.json',
  'docs/evidence/dependency-audit.json',
  'docs/evidence/defender-scan.json'
];
const forbidden = /\b(mock|fake|dummy|simulate|simulation|coming soon|not implemented|sample result|fake progress)\b/i;
const sourceRoots = ['electron', 'src', 'shared', 'scripts', '.github'];
const prohibitedSecretFile = /\.(pfx|p12|pem|key)$/i;
const prohibitedSecretContent = /-----BEGIN (?:RSA |EC |)?PRIVATE KEY-----|(?:CSC_LINK|CSC_KEY_PASSWORD)\s*[:=]\s*["'][^$\s"']{12,}|(?:api[_-]?key|password|token|secret)\s*[:=]\s*["'][A-Za-z0-9+/_=-]{16,}/i;
const failures = [];
for (const relative of required) if (!fs.existsSync(path.join(root, relative))) failures.push(`Missing release evidence or artifact: ${relative}`);
const productionStatus = fs.readFileSync(path.join(root, 'docs/PRODUCTION_STATUS.md'), 'utf8');
const unresolvedStatus = productionStatus.split(/\r?\n/).filter(line => /^\|/.test(line) && /\|\s*(PARTIAL|NOT IMPLEMENTED)\s*\|/.test(line));
if (unresolvedStatus.length) failures.push(`Production status still has unresolved release rows: ${unresolvedStatus.length}`);
for (const folder of sourceRoots) {
  const stack = [path.join(root, folder)];
  while (stack.length) {
    const item = stack.pop();
    for (const entry of fs.readdirSync(item, { withFileTypes: true })) {
      const target = path.join(item, entry.name);
      if (entry.isDirectory()) stack.push(target);
      else {
        const relative = path.relative(root, target);
        if (prohibitedSecretFile.test(entry.name)) failures.push(`Prohibited certificate or private-key file in release source: ${relative}`);
        if (/\.(cjs|js|ts|tsx|json|ya?ml|md|css)$/.test(entry.name)) {
          const text = fs.readFileSync(target, 'utf8');
          if (['electron', 'src', 'shared'].includes(folder) && /\.(cjs|ts|tsx|css)$/.test(entry.name) && forbidden.test(text)) failures.push(`Forbidden operational placeholder term in ${relative}`);
          if (prohibitedSecretContent.test(text)) failures.push(`Possible committed signing credential or private secret in ${relative}`);
        }
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
