'use strict';

/**
 * Targeted read-only Storage test using a controlled temp folder and a stub
 * volume provider. No real user files or real disks are scanned or changed.
 */
const fsp = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { StudioBridge } = require('../electron/native/studio-bridge.cjs');
const { FilesBridge } = require('../electron/native/files-bridge.cjs');
const { StorageBridge } = require('../electron/native/storage-bridge.cjs');

const failures = [];
const assert = (condition, label) => {
  if (!condition) failures.push(label);
};

function volumeProvider(overrides = {}) {
  return {
    status: 'complete',
    source: 'test Win32 logical disks',
    observedAt: new Date().toISOString(),
    permission: 'read-only',
    warnings: [],
    provenance: { provider: 'test', mode: 'measured', observedAt: new Date().toISOString(), coverage: 'full', permissions: ['read-only'], warnings: [] },
    data: {
      volumes: [
        { deviceId: 'C:', label: 'System', fileSystem: 'NTFS', sizeBytes: 100 * 1024 ** 3, freeBytes: 40 * 1024 ** 3 },
        { deviceId: 'D:', label: 'Data', fileSystem: 'NTFS', sizeBytes: 200 * 1024 ** 3, freeBytes: 5 * 1024 ** 3 },
        ...(overrides.volumes || []),
      ],
    },
  };
}

async function statMap(root) {
  const map = new Map();
  async function walk(dir) {
    for (const entry of await fsp.readdir(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) await walk(full);
      else if (entry.isFile()) {
        const stat = await fsp.stat(full);
        map.set(path.relative(root, full), `${stat.size}:${stat.mtimeMs}`);
      }
    }
  }
  await walk(root);
  return map;
}

(async () => {
  const sandbox = await fsp.mkdtemp(path.join(os.tmpdir(), 'knoux-storage-native-test-'));
  const userData = path.join(sandbox, 'profile');
  const source = path.join(sandbox, 'source');
  await fsp.mkdir(path.join(source, 'alpha', 'nested'), { recursive: true });
  await fsp.mkdir(path.join(source, 'beta'), { recursive: true });
  const shared = crypto.randomBytes(2 * 1024 * 1024);
  const different = crypto.randomBytes(2 * 1024 * 1024);
  await fsp.writeFile(path.join(source, 'alpha', 'copy-a.bin'), shared);
  await fsp.writeFile(path.join(source, 'alpha', 'nested', 'copy-b.bin'), shared);
  await fsp.writeFile(path.join(source, 'beta', 'different.bin'), different);
  const smallBytes = Buffer.byteLength('small controlled file\n');
  await fsp.writeFile(path.join(source, 'small.txt'), 'small controlled file\n', 'utf8');
  const before = await statMap(source);

  const studio = new StudioBridge({
    userDataPath: userData,
    nativeImage: null,
    isPackaged: false,
    chooseFolder: async () => source,
    emit: () => {},
  });
  const files = new FilesBridge({
    studio,
    shell: { openPath: async () => '', showItemInFolder: () => {} },
  });
  const storage = new StorageBridge({
    studio,
    files,
    readSystemSummary: async () => volumeProvider(),
    userDataPath: userData,
  });

  await studio.init();
  await storage.init();
  const added = await studio.addSource(source);
  await studio.scanSource(added.id);

  const volumesResult = await storage.volumes();
  assert(volumesResult.volumes.length === 2, 'volumes are mapped from the measured provider');
  assert(volumesResult.volumes[0].letter === 'C:' && volumesResult.volumes[0].totalBytes === 100 * 1024 ** 3, 'volume bytes are not invented');
  assert(volumesResult.volumes[1].isLowSpace === true, 'low-space volume is derived from actual free ratio');
  assert(volumesResult.volumes.every((volume) => volume.physicalDeviceAvailable === false && volume.smartAvailable === false), 'unavailable physical/SMART identity is explicit');
  assert(volumesResult.history.length === 1, 'capacity snapshot is persisted');

  const analysis = await storage.analysis(added.id);
  assert(analysis.totals.files === 4, 'analysis counts the controlled files');
  assert(analysis.totals.bytes === shared.length * 2 + different.length + smallBytes, 'analysis totals equal the actual bytes');
  assert(analysis.coverage.coversWholeVolume === false && analysis.coverage.scopeKind === 'authorized-folder', 'analysis scope is an authorized folder, not a whole-volume claim');
  const treeSum = analysis.tree.children.reduce((sum, node) => sum + node.sizeBytes, 0);
  assert(treeSum === analysis.totals.bytes, 'treemap children sum to the measured bytes');
  assert(analysis.folders.some((folder) => folder.name === 'alpha' && folder.files === 2), 'folder ranking aggregates alpha');
  assert(analysis.largest[0]?.size === 2 * 1024 * 1024, 'largest ranking starts with the large controlled files');
  assert(analysis.extensions.some((extension) => extension.ext === 'bin' && extension.count === 3), 'extension distribution is measured');

  const candidate = analysis.duplicateCandidates.find((group) => group.sizeBytes === 2 * 1024 * 1024);
  assert(candidate?.count === 3 && candidate.wastedBytes === 4 * 1024 * 1024, 'size-collision candidates are reported as candidates');

  const verified = await storage.verifyDuplicates(added.id);
  assert(verified.summary.filesHashed === 3, 'three same-size candidates are hashed');
  assert(verified.groups.length === 1 && verified.groups[0].count === 2, 'only the byte-identical pair is verified');
  assert(verified.groups[0].wastedBytes === 2 * 1024 * 1024, 'verified reclaimable bytes count only the duplicate');
  assert(verified.permission === 'read-only' && verified.mutation === 'none', 'duplicate verification is read-only');

  const after = await statMap(source);
  assert(after.size === before.size, 'source file count is unchanged');
  assert([...before.entries()].every(([key, value]) => after.get(key) === value), 'source file metadata is unchanged');

  const volumesAgain = await storage.volumes();
  assert(volumesAgain.history.length === 2, 'subsequent volume reads append history');
  const restartedStorage = new StorageBridge({
    studio,
    files,
    readSystemSummary: async () => volumeProvider(),
    userDataPath: userData,
  });
  await restartedStorage.init();
  const restartedHistory = await restartedStorage.history();
  assert(restartedHistory.points.length === 2, 'capacity history survives restart');

  let failedProviderRejected = false;
  const failedStorage = new StorageBridge({
    studio,
    files,
    readSystemSummary: async () => ({ status: 'failed', error: { code: 'PROVIDER_MISSING', message: 'No volume provider.' } }),
    userDataPath: path.join(sandbox, 'profile-failed'),
  });
  await failedStorage.init();
  try { await failedStorage.volumes(); }
  catch (error) { failedProviderRejected = error?.code === 'PROVIDER_MISSING'; }
  assert(failedProviderRejected, 'volume provider failure is surfaced, not replaced by fixtures');

  await files.dispose();
  await studio.dispose();
  await fsp.rm(sandbox, { recursive: true, force: true }).catch(() => {});

  const result = {
    ok: failures.length === 0,
    volumes: volumesResult.volumes.length,
    files: analysis.totals.files,
    bytes: analysis.totals.bytes,
    folders: analysis.folders.map((folder) => `${folder.name}:${folder.sizeBytes}`),
    candidates: analysis.duplicateCandidates.length,
    verifiedGroups: verified.groups.length,
    reclaimableBytes: verified.summary.reclaimableVerifiedBytes,
    history: restartedHistory.points.length,
    failures,
  };
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exit(1);
  console.log('[storage-native-test] PASS');
})().catch((error) => {
  console.error('[storage-native-test] FAILED', error?.stack || error);
  process.exit(1);
});
