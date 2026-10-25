'use strict';

/**
 * Static contract and security-boundary test for the native platform gate.
 * It does not start Electron or touch Windows; the runtime proof lives in
 * scripts/native-smoke.cjs.
 */
const fs = require('node:fs');
const path = require('node:path');

const appRoot = path.resolve(__dirname, '..');
const read = (relative) => fs.readFileSync(path.join(appRoot, relative), 'utf8');
const contract = JSON.parse(read('shared/native-contract.json'));
const preload = read('electron/preload.cjs');
const main = read('electron/main.cjs');
const security = read('electron/native/security.cjs');
const provider = require('../electron/native/provider-bridge.cjs');
const pkg = JSON.parse(read('package.json'));

const failures = [];
const assert = (condition, label) => {
  if (!condition) failures.push(label);
};

assert(contract.contractVersion === 1, 'contract version must be 1');
assert(contract.namespace === 'knouxShell', 'namespace must be knouxShell');
assert(contract.channels.windowControl === 'knoux:window:v1:control', 'window control channel is fixed');
for (const channel of Object.values(contract.channels)) {
  assert(preload.includes(channel), `preload must mirror channel ${channel}`);
}
assert(preload.includes("exposeInMainWorld(\n  'knouxShell'") || preload.includes("exposeInMainWorld"), 'preload exposes the bridge');
assert(!preload.includes('exposeInMainWorld(\'knouxNode\''), 'no second raw bridge');
assert(!preload.includes('ipcRenderer.send('), 'preload must not expose send');
assert(contract.channels.studioEvent === 'knoux:studio:v1:event', 'studio event channel is fixed');
const eventSubscriptions = preload.match(/ipcRenderer\.on\(/g) || [];
assert(eventSubscriptions.length === 1 && preload.includes('ipcRenderer.on(CHANNELS.studioEvent'), 'only the fixed Studio event channel is subscribed');
const shellBlock = preload.slice(preload.indexOf("'knouxShell'"), preload.indexOf("'knouxStudioV1'"));
assert(!shellBlock.includes('onEvent') && !shellBlock.includes('ipcRenderer.on'), 'platform v1 exposes no event stream');
assert(!preload.includes('ipcRenderer.invoke(CHANNELS.studioEvent'), 'studio events are receive-only');
assert(!/require\(['"](?:node:)?(fs|child_process|path|os)['"]\)/.test(preload), 'preload has no Node filesystem/process module');
assert(main.includes('contextIsolation: true'), 'main enables contextIsolation');
assert(main.includes('sandbox: true'), 'main enables sandbox');
assert(main.includes('nodeIntegration: false'), 'main disables nodeIntegration');
assert(main.includes('webviewTag: false'), 'main disables webviewTag');
assert(main.includes('assertTrustedSender'), 'every IPC handler uses the sender guard');
assert(main.includes("require('../shared/native-contract.json')"), 'main resolves the shared contract from the app root');
assert(!main.includes("require('../../shared/native-contract.json')"), 'main must not use the wrong shared path');
assert(main.includes('appPackage.version'), 'bridge reports the app package version, not the Electron runtime version');
assert(security.includes("frame-ancestors 'none'"), 'CSP forbids framing');
assert(provider.fixturesEnabled({ isPackaged: false, env: { KNOUX_NATIVE_FIXTURES: '1' } }) === true, 'development fixture flag is only dev');
assert(provider.fixturesEnabled({ isPackaged: true, env: { KNOUX_NATIVE_FIXTURES: '1' } }) === false, 'packaged build ignores fixture flag');
assert(provider.fixturesEnabled({ isPackaged: false, env: {} }) === false, 'fixtures are opt-in');
assert(fs.existsSync(provider.PROVIDER_RELATIVE), 'reused root Windows provider exists');
assert(Array.isArray(contract.windowActions) && contract.windowActions.length === 3, 'three fixed window actions');

const aiStorageHits = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(tsx?|jsx?)$/.test(entry.name)) {
      const text = fs.readFileSync(full, 'utf8');
      if (/knoux_ai_api_key|knoux_ai_provider/.test(text)) aiStorageHits.push(path.relative(appRoot, full));
    }
  }
}
walk(path.join(appRoot, 'src'));
assert(aiStorageHits.length === 0, `no renderer API-key persistence (${aiStorageHits.join(', ')})`);

const distIndex = path.join(appRoot, 'dist', 'index.html');
let cspPresent = null;
if (fs.existsSync(distIndex)) {
  cspPresent = /Content-Security-Policy/.test(fs.readFileSync(distIndex, 'utf8'));
  assert(cspPresent === true, 'built index carries the CSP meta tag');
}

assert(pkg.main === 'electron/main.cjs', 'package main points at the Gemini shell');
assert(typeof pkg.scripts['desktop:smoke'] === 'string', 'desktop smoke script exists');
assert(typeof pkg.scripts['desktop:pack'] === 'string', 'desktop pack script exists');

const result = {
  ok: failures.length === 0,
  contractVersion: contract.contractVersion,
  capabilities: Object.keys(contract.capabilities),
  channels: Object.keys(contract.channels),
  buildCspPresent: cspPresent,
  aiStorageHits,
  failures,
};
console.log(JSON.stringify(result, null, 2));
if (!result.ok) process.exit(1);
console.log('[native-contract] PASS');
