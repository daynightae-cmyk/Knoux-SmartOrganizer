'use strict';

/**
 * Targeted read-only Files test. It scans only a temporary controlled fixture,
 * reads metadata/hash, and proves no source file content or metadata is changed.
 * A synthetic 100K-row index is benchmarked in memory, never scanned on disk.
 */
const fsp = require('node:fs/promises');
const fssync = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { StudioBridge } = require('../electron/native/studio-bridge.cjs');
const { FilesBridge } = require('../electron/native/files-bridge.cjs');

const appRoot = path.resolve(__dirname, '..');
const failures = [];
const assert = (condition, label) => {
  if (!condition) failures.push(label);
};

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
  const sandbox = await fsp.mkdtemp(path.join(os.tmpdir(), 'knoux-files-native-test-'));
  const userData = path.join(sandbox, 'profile');
  const source = path.join(sandbox, 'source');
  await fsp.mkdir(path.join(source, 'nested'), { recursive: true });
  await fsp.mkdir(path.join(source, 'images'), { recursive: true });
  await fsp.mkdir(path.join(source, 'empty-dir'), { recursive: true });
  await fsp.mkdir(path.join(source, 'parent', 'empty-child'), { recursive: true });
  const notesContent = 'KNOuX files fixture\n';
  const notesPath = path.join(source, 'notes.txt');
  await fsp.writeFile(notesPath, notesContent, 'utf8');
  await fsp.writeFile(path.join(source, 'table.csv'), 'name,value\na,1\n', 'utf8');
  await fsp.writeFile(path.join(source, 'app.ts'), 'export const fixture = true;\n', 'utf8');
  await fsp.writeFile(path.join(source, 'nested', 'readme.md'), '# read-only fixture\n', 'utf8');
  const sampleImage = path.join(appRoot, 'public', 'assets', 'aistudio', 'image_091f4380.png');
  if (fssync.existsSync(sampleImage)) {
    await fsp.copyFile(sampleImage, path.join(source, 'images', 'sample-image.png'));
  }
  await fsp.writeFile(`${notesPath}:Zone.Identifier`, '[ZoneTransfer]\r\nZoneId=3\r\nHostUrl=https://example.invalid/file\r\n', 'utf8');
  const expectedHash = crypto.createHash('sha256').update(Buffer.from(notesContent)).digest('hex');
  const expectedNotesPath = await fsp.realpath(notesPath);
  const before = await statMap(source);

  const studio = new StudioBridge({
    userDataPath: userData,
    nativeImage: null,
    isPackaged: false,
    chooseFolder: async () => source,
    emit: () => {},
  });
  const opened = [];
  const revealed = [];
  const files = new FilesBridge({
    studio,
    shell: {
      openPath: async (target) => { opened.push(target); return ''; },
      showItemInFolder: (target) => { revealed.push(target); },
    },
  });

  await studio.init();
  const added = await studio.addSource(source);
  await studio.scanSource(added.id);

  const listed = await files.listSources();
  assert(listed.length === 1, 'Files source list uses the persisted grant');

  const query = await files.query(added.id, { limit: 50 });
  assert(query.total >= 5, 'Files query returns measured rows');
  const notesRow = query.rows.find((row) => row.name === 'notes.txt');
  assert(Boolean(notesRow), 'controlled text file is indexed');
  assert(notesRow?.uiCategory === 'document', 'text file is categorized as a document');

  const extQuery = await files.query(added.id, { extension: 'csv', limit: 10 });
  assert(extQuery.total === 1 && extQuery.rows[0]?.name === 'table.csv', 'extension filter is applied');

  const folderQuery = await files.query(added.id, { category: 'folders', limit: 10 });
  assert(folderQuery.total === 0 && folderQuery.unsupported === 'folders', 'folder rows are reported unsupported, not fabricated');

  const overview = await files.overview(added.id);
  assert(overview.totals.files === query.total, 'overview total matches the measured query');
  assert(overview.extensions.some((item) => item.ext === 'txt'), 'extension distribution includes txt');
  assert(overview.ages.reduce((sum, item) => sum + item.count, 0) === query.total, 'age buckets cover every indexed file');
  assert(overview.recent.length > 0 && overview.largest.length > 0, 'recent and largest rankings are measured');
  assert(overview.coverage === 'complete', 'overview reports complete coverage for the controlled fixture');

  const metadata = await files.metadata(added.id, notesRow.id);
  assert(metadata.fullPath === expectedNotesPath, 'metadata returns the exact indexed path');
  assert(metadata.size === Buffer.byteLength(notesContent), 'metadata size matches the real file');
  assert(metadata.zone.zoneAvailable && metadata.zone.zoneId === 3, 'Zone.Identifier is read without opening file content');
  assert(metadata.attributesAvailable === false, 'unavailable attributes are not invented');

  const digest = await files.hash(added.id, notesRow.id, 'sha256');
  assert(digest.digest === expectedHash, 'SHA-256 matches the controlled content');
  assert(digest.bytesRead === Buffer.byteLength(notesContent), 'hash reports the exact bytes read');
  assert(digest.changedDuringRead === false && digest.digestReliable === true, 'stable hash is marked reliable');

  const empty = await files.emptyFolders(added.id, 50);
  const relatives = empty.items.map((item) => item.relative).sort();
  assert(relatives.includes('empty-dir'), 'empty root folder is discovered');
  assert(relatives.includes('parent/empty-child'), 'nested empty folder is discovered');
  assert(empty.mutation === 'none' && empty.permission === 'read-only', 'empty-folder scan is read-only');

  const openedResult = await files.open(added.id, notesRow.id);
  assert(openedResult.opened === true && opened[0] === expectedNotesPath, 'open validates and targets the indexed file');
  const revealResult = await files.reveal(added.id, notesRow.id);
  assert(revealResult.requested === true && revealed[0] === expectedNotesPath, 'reveal validates and targets the indexed file');

  // Change a file after indexing: reads must refuse the stale identity.
  await fsp.appendFile(notesPath, 'changed after index\n', 'utf8');
  let changedRefused = false;
  try { await files.hash(added.id, notesRow.id, 'sha256'); }
  catch (error) { changedRefused = error?.code === 'FILES_FILE_CHANGED'; }
  assert(changedRefused, 'hash refuses a file that changed after indexing');

  const after = await statMap(source);
  assert(after.get('table.csv') === before.get('table.csv'), 'unread file metadata is unchanged');
  assert(after.get('app.ts') === before.get('app.ts'), 'source metadata is unchanged for hashed/open files');
  assert(after.size === before.size, 'source file count is unchanged');

  // Synthetic 100K index benchmark (in memory only, no disk traversal).
  const syntheticId = crypto.randomUUID();
  const now = Date.now();
  const syntheticRoot = path.join(sandbox, 'synthetic');
  const syntheticFiles = Array.from({ length: 100000 }, (_, index) => ({
    id: index,
    name: `synthetic-${index}.${index % 4 === 0 ? 'jpg' : index % 4 === 1 ? 'pdf' : index % 4 === 2 ? 'ts' : 'zip'}`,
    relative: `batch-${index % 100}/synthetic-${index}.${index % 4 === 0 ? 'jpg' : index % 4 === 1 ? 'pdf' : index % 4 === 2 ? 'ts' : 'zip'}`,
    category: index % 4 === 0 ? 'image' : index % 4 === 1 ? 'document' : index % 4 === 2 ? 'code' : 'archive',
    size: (index % 1000 + 1) * 1024,
    ext: index % 4 === 0 ? 'jpg' : index % 4 === 1 ? 'pdf' : index % 4 === 2 ? 'ts' : 'zip',
    modifiedAt: new Date(now - (index % 400) * 86_400_000).toISOString(),
    modifiedMs: now - (index % 400) * 86_400_000,
    readonly: false,
    hidden: false,
    identity: { modifiedMs: now - (index % 400) * 86_400_000 },
  }));
  studio.sources.push({ id: syntheticId, path: syntheticRoot, addedAt: new Date(now).toISOString(), lastScanned: new Date(now).toISOString() });
  studio.inventories.set(syntheticId, {
    version: 1,
    id: syntheticId,
    root: syntheticRoot,
    files: syntheticFiles,
    summary: {
      totalFiles: syntheticFiles.length,
      totalBytes: syntheticFiles.reduce((sum, file) => sum + file.size, 0),
      categories: [
        { key: 'image', count: 25000, bytes: 1 },
        { key: 'document', count: 25000, bytes: 1 },
        { key: 'code', count: 25000, bytes: 1 },
        { key: 'archive', count: 25000, bytes: 1 },
      ],
      counts: { folders: 100 },
      extensions: [
        { ext: 'jpg', count: 25000, bytes: 1 },
        { ext: 'pdf', count: 25000, bytes: 1 },
        { ext: 'ts', count: 25000, bytes: 1 },
        { ext: 'zip', count: 25000, bytes: 1 },
      ],
      partial: false,
      warnings: [],
    },
    scannedAt: new Date(now).toISOString(),
  });
  const queryStart = process.hrtime.bigint();
  const syntheticQuery = await files.query(syntheticId, { search: 'synthetic-9', limit: 200, sort: 'size', desc: true });
  const queryMs = Number(process.hrtime.bigint() - queryStart) / 1_000_000;
  const overviewStart = process.hrtime.bigint();
  await files.overview(syntheticId);
  const overviewMs = Number(process.hrtime.bigint() - overviewStart) / 1_000_000;
  assert(syntheticQuery.total > 0, 'synthetic 100K query returns matches');
  assert(queryMs < 1500, `synthetic 100K query is responsive (${queryMs.toFixed(1)}ms < 1500ms)`);
  assert(overviewMs < 1500, `synthetic 100K overview is responsive (${overviewMs.toFixed(1)}ms < 1500ms)`);

  await files.dispose();
  await studio.dispose();
  await fsp.rm(sandbox, { recursive: true, force: true }).catch(() => {});

  const result = {
    ok: failures.length === 0,
    files: query.total,
    hashPrefix: digest.digest.slice(0, 16),
    emptyFolders: relatives,
    synthetic: { rows: 100000, queryMs: Math.round(queryMs), overviewMs: Math.round(overviewMs) },
    failures,
  };
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exit(1);
  console.log('[files-native-test] PASS');
})().catch((error) => {
  console.error('[files-native-test] FAILED', error?.stack || error);
  process.exit(1);
});
