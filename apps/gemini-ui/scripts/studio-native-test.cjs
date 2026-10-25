'use strict';

/**
 * Targeted native Studio test. It uses only temporary controlled fixtures and
 * the read-only adapter; no user folder is scanned and no file is written by
 * the plan preview.
 */
const fs = require('node:fs/promises');
const fssync = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { StudioBridge } = require('../electron/native/studio-bridge.cjs');

const appRoot = path.resolve(__dirname, '..');
const failures = [];
const assert = (condition, label) => {
  if (!condition) failures.push(label);
};

async function statMap(root) {
  const map = new Map();
  async function walk(dir) {
    for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
      } else if (entry.isFile()) {
        const stat = await fs.stat(full);
        map.set(path.relative(root, full), `${stat.size}:${stat.mtimeMs}`);
      }
    }
  }
  await walk(root);
  return map;
}

(async () => {
  const sandbox = await fs.mkdtemp(path.join(os.tmpdir(), 'knoux-studio-native-test-'));
  const userData = path.join(sandbox, 'profile');
  const source = path.join(sandbox, 'source');
  await fs.mkdir(path.join(source, 'nested'), { recursive: true });
  await fs.mkdir(path.join(source, 'images'), { recursive: true });
  await fs.writeFile(path.join(source, 'notes.txt'), 'read-only fixture\n', 'utf8');
  await fs.writeFile(path.join(source, 'table.csv'), 'a,b\n1,2\n', 'utf8');
  await fs.writeFile(path.join(source, 'app.ts'), 'export const value = 1;\n', 'utf8');
  await fs.writeFile(path.join(source, 'nested', 'readme.md'), '# fixture\n', 'utf8');
  const sampleImage = path.join(appRoot, 'public', 'assets', 'aistudio', 'image_091f4380.png');
  if (fssync.existsSync(sampleImage)) {
    await fs.copyFile(sampleImage, path.join(source, 'images', 'sample-image.png'));
  }
  const before = await statMap(source);

  const bridge = new StudioBridge({
    userDataPath: userData,
    nativeImage: null,
    isPackaged: false,
    chooseFolder: async () => source,
    emit: () => {},
  });
  await bridge.init();
  const added = await bridge.addSource(source);
  assert(Boolean(added?.id), 'source grant returns a durable id');
  const scanned = await bridge.scanSource(added.id);
  assert(scanned.fileCount >= 4, 'read-only scan finds the controlled files');
  assert(scanned.folderCount >= 3, 'scan records folders without reading contents');
  assert(scanned.categories.some((category) => category.key === 'image' && category.count >= 1), 'image fixture is categorized');
  const query = bridge.query({ sourceId: added.id, category: 'all', limit: 50 });
  assert(query.total >= 4, 'query returns measured rows');
  assert(query.rows.every((row) => row.uiCategory && row.name), 'query rows expose UI category and name');

  const plan = await bridge.previewPlan({
    sourceId: added.id,
    all: true,
    operation: 'virtual',
    structure: 'categorized',
    collisionPolicy: 'review',
  });
  assert(plan.previewOnly === true, 'plan is labelled previewOnly');
  assert(plan.execution === 'blocked_explicit_approval_required', 'plan execution is blocked');
  assert(plan.totals.files >= 4, 'virtual plan counts the measured files');
  assert(Array.isArray(plan.files) && plan.files.length >= 4, 'virtual plan exposes pathless grouping rows');
  assert(plan.files.every((file) => file.targetPath === null), 'virtual plan creates no filesystem targets');

  const history = await bridge.previewHistory();
  assert(history.length === 1, 'preview receipt is persisted');
  assert(history[0].planHash === plan.planHash, 'history receipt matches the plan hash');

  // Regression: the thumbnail service must not shadow the public bridge
  // method. Without Electron's nativeImage the method still has to answer.
  const previewableIds = query.rows.filter((row) => row.hasThumbnail).slice(0, 3).map((row) => row.id);
  if (previewableIds.length) {
    const thumbs = await bridge.thumbnails(added.id, previewableIds);
    assert(previewableIds.every((id) => thumbs[String(id)]?.reason === 'THUMBNAILS_UNAVAILABLE'), 'thumbnail method answers without nativeImage');
  }

  const after = await statMap(source);
  assert(before.size === after.size, 'source file count is unchanged');
  assert([...before.entries()].every(([key, value]) => after.get(key) === value), 'source file metadata is unchanged');

  let protectedRefused = false;
  try {
    await bridge.addSource(process.env.SystemRoot || 'C:\\Windows');
  } catch (error) {
    protectedRefused = error?.code === 'STUDIO_PROTECTED_ROOT';
  }
  assert(protectedRefused, 'protected Windows root is refused');

  let copyNeedsDestination = false;
  try {
    await bridge.previewPlan({ sourceId: added.id, all: true, operation: 'copy' });
  } catch (error) {
    copyNeedsDestination = error?.code === 'STUDIO_DESTINATION_REQUIRED';
  }
  assert(copyNeedsDestination, 'copy/move plan requires an authorized destination');

  await bridge.dispose();

  const restarted = new StudioBridge({ userDataPath: userData, nativeImage: null, isPackaged: false, chooseFolder: null, emit: () => {} });
  await restarted.init();
  const sources = await restarted.listSources();
  assert(sources.length === 1, 'source grant survives restart');
  assert(sources[0].fileCount >= 4, 'cached inventory metadata survives restart');
  const restartedQuery = restarted.query({ sourceId: sources[0].id, limit: 10 });
  assert(restartedQuery.total >= 4, 'cached measured inventory is queryable after restart');
  const restartedHistory = await restarted.previewHistory();
  assert(restartedHistory.length === 1, 'preview receipt survives restart');
  await restarted.dispose();

  await fs.rm(sandbox, { recursive: true, force: true }).catch(() => {});
  const result = {
    ok: failures.length === 0,
    sourceIdPrefix: added.id.slice(0, 8),
    files: scanned.fileCount,
    categories: scanned.categories,
    planHash: plan.planHash.slice(0, 12),
    planFiles: plan.totals.files,
    previewHistory: history.length,
    failures,
  };
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exit(1);
  console.log('[studio-native-test] PASS');
})().catch((error) => {
  console.error('[studio-native-test] FAILED', error?.stack || error);
  process.exit(1);
});
