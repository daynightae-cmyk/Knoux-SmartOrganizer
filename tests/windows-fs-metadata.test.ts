import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdir, mkdtemp, rm, symlink, writeFile, link, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const fsMeta = require('../electron/windows-fs-metadata.cjs') as {
  REPARSE_TAGS: Record<string, string>;
  CLOUD_TAGS: Set<string>;
  volumeKey: (p: string) => string;
  isInside: (root: string, candidate: string) => boolean;
  sameVolume: (a: string, b: string) => boolean;
  createReparseTagReader: (options?: Record<string, unknown>) => (p: string) => Promise<{ tag: string | null; name: string; available: boolean; queried: boolean }>;
  createEntryClassifier: (options?: Record<string, unknown>) => (p: string, stats: unknown, options?: Record<string, unknown>) => Promise<Record<string, unknown>>;
  mayTraverseLink: (entry: Record<string, unknown>, options?: Record<string, unknown>) => boolean;
  physicalDuplicateGroups: (entries: Array<Record<string, unknown>>) => Array<{ fileIdentity: string; paths: string[] }>;
  reclaimableBytesForGroup: (files: Array<Record<string, unknown>>) => number;
  groupIsSinglePhysicalFile: (files: Array<Record<string, unknown>>) => boolean;
  identitySnapshot: (stats: unknown) => { fileIdentity: string | null; size: number; modifiedMs: number };
  identityChanged: (before: unknown, after: unknown) => boolean;
  longPathSafe: (p: string) => string;
};

let root = '';
beforeEach(async () => { root = await mkdtemp(join(tmpdir(), 'knoux-fs-')); });
afterEach(async () => { await rm(root, { recursive: true, force: true }); });

function fakeStats({ isFile = true, isDirectory = false, isLink = false, ino = 1, dev = 2, nlink = 1, size = 10, mtimeMs = 1000 } = {}) {
  return {
    isFile: () => isFile, isDirectory: () => isDirectory, isSymbolicLink: () => isLink,
    size, ino, dev, nlink, mtimeMs, birthtimeMs: 500
  };
}

describe('windows filesystem metadata adapter', () => {
  it('classifies a normal file without inventing a placeholder or allocated size', async () => {
    const classify = fsMeta.createEntryClassifier();
    const entry = await classify(join(root, 'a.txt'), fakeStats());
    expect(entry.entryKind).toBe('file');
    expect(entry.placeholderState).toBe('not-indicated');
    expect(entry.placeholderStateAvailable).toBe(false);
    expect(entry.allocatedBytes).toBeNull();
    expect(entry.allocatedSizeAvailable).toBe(false);
    expect(entry.hydrationRisk).toBe('none');
    expect(entry.reparseTag).toBeNull();
  });

  it('records Windows file identity and hardlink state from real stat data', async () => {
    const classify = fsMeta.createEntryClassifier();
    const single = await classify(join(root, 'single.txt'), fakeStats({ ino: 11, dev: 7, nlink: 1 }));
    const linked = await classify(join(root, 'linked.txt'), fakeStats({ ino: 11, dev: 7, nlink: 2 }));
    expect(single.fileIdentity).toBe('7:11');
    expect(single.hardlinked).toBe(false);
    expect(linked.hardlinked).toBe(true);
    expect(linked.fileIdentity).toBe(single.fileIdentity);
  });

  it('marks a reparse entry as a link, never as a plain file', async () => {
    const classify = fsMeta.createEntryClassifier({ readReparseTag: async () => ({ tag: '0xa0000003', name: 'mount-point', available: true, queried: true }) });
    const entry = await classify(join(root, 'junction'), fakeStats({ isFile: false, isDirectory: false, isLink: true }), { reparsePolicy: 'skip' });
    expect(entry.entryKind).toBe('reparse');
    expect(entry.reparseName).toBe('mount-point');
    expect(entry.placeholderState).toBe('reparse-mount-point');
    expect(entry.hydrationRisk).toBe('avoid');
    expect(entry.skippedReason).toBe('reparse-policy-skip');
  });

  it('classifies a cloud placeholder as avoid-hydration and never traverses it', async () => {
    const classify = fsMeta.createEntryClassifier({ readReparseTag: async () => ({ tag: '0x9000001a', name: 'cloud-files', available: true, queried: true }) });
    const entry = await classify(join(root, 'doc.docx'), fakeStats({ isLink: true }), { reparsePolicy: 'same-volume' });
    expect(fsMeta.CLOUD_TAGS.has(String(entry.reparseName))).toBe(true);
    expect(entry.placeholderState).toBe('cloud-placeholder');
    expect(entry.placeholderStateAvailable).toBe(true);
    expect(fsMeta.mayTraverseLink(entry, { reparsePolicy: 'same-volume' })).toBe(false);
  });

  it('never traverses a reparse point under the default skip policy', async () => {
    const classify = fsMeta.createEntryClassifier({ readReparseTag: async () => ({ tag: '0xa000000c', name: 'symbolic-link', available: true, queried: true }) });
    const entry = await classify(join(root, 'link'), fakeStats({ isLink: true, isFile: false }), { reparsePolicy: 'skip' });
    expect(fsMeta.mayTraverseLink(entry, { reparsePolicy: 'skip' })).toBe(false);
  });

  it('refuses to traverse an unknown reparse tag even when the policy allows traversal', async () => {
    const classify = fsMeta.createEntryClassifier({ readReparseTag: async () => ({ tag: '0x90000fff', name: 'unknown', available: true, queried: true }) });
    const entry = await classify(join(root, 'weird'), fakeStats({ isLink: true }), { reparsePolicy: 'same-volume' });
    expect(entry.reparseName).toBe('unknown');
    expect(fsMeta.mayTraverseLink(entry, { reparsePolicy: 'same-volume' })).toBe(false);
  });

  it('refuses to traverse a cross-volume reparse target', async () => {
    const classify = fsMeta.createEntryClassifier({ readReparseTag: async () => ({ tag: '0xa000000c', name: 'symbolic-link', available: true, queried: true }) });
    const entry = await classify('D:\\probe\\link', fakeStats({ isLink: true }), { reparsePolicy: 'same-volume' });
    expect(fsMeta.mayTraverseLink(entry, { reparsePolicy: 'same-volume' })).toBe(false);
  });

  it('never counts hard links to one physical file as reclaimable storage', () => {
    const files = [
      { path: 'C:/a.txt', size: 100, fileIdentity: '1:500' },
      { path: 'C:/b.txt', size: 100, fileIdentity: '1:500' }
    ];
    expect(fsMeta.reclaimableBytesForGroup(files)).toBe(0);
    expect(fsMeta.groupIsSinglePhysicalFile(files)).toBe(true);
  });

  it('counts genuinely distinct physical duplicates as reclaimable', () => {
    const files = [
      { path: 'C:/a.txt', size: 100, fileIdentity: '1:500' },
      { path: 'C:/b.txt', size: 100, fileIdentity: '1:900' }
    ];
    expect(fsMeta.reclaimableBytesForGroup(files)).toBe(100);
    expect(fsMeta.groupIsSinglePhysicalFile(files)).toBe(false);
  });

  it('groups multiple names that resolve to one file identity', () => {
    const groups = fsMeta.physicalDuplicateGroups([
      { path: 'C:/a.txt', fileIdentity: '1:500' },
      { path: 'C:/b.txt', fileIdentity: '1:500' },
      { path: 'C:/c.txt', fileIdentity: '1:900' }
    ]);
    expect(groups).toEqual([{ fileIdentity: '1:500', paths: ['C:/a.txt', 'C:/b.txt'] }]);
  });

  it('never treats identical file names as duplicates without identity evidence', () => {
    const files = [{ path: 'C:/x/report.pdf', size: 10 }, { path: 'C:/y/report.pdf', size: 10 }];
    expect(fsMeta.reclaimableBytesForGroup(files)).toBe(10);
    expect(fsMeta.groupIsSinglePhysicalFile(files)).toBe(false);
  });

  it('detects a file that changed while it was being read', () => {
    const before = { fileIdentity: '1:5', size: 10, modifiedMs: 100 };
    expect(fsMeta.identityChanged(before, { fileIdentity: '1:5', size: 10, modifiedMs: 100 })).toBe(false);
    expect(fsMeta.identityChanged(before, { fileIdentity: '1:5', size: 11, modifiedMs: 100 })).toBe(true);
    expect(fsMeta.identityChanged(before, { fileIdentity: '1:6', size: 10, modifiedMs: 100 })).toBe(true);
    expect(fsMeta.identitySnapshot(fakeStats({ ino: 5, dev: 1, size: 3, mtimeMs: 42 }))).toEqual({ fileIdentity: '1:5', size: 3, modifiedMs: 42 });
  });

  it('bounds the reparse tag query budget instead of spawning per file forever', async () => {
    const read = fsMeta.createReparseTagReader({ maxQueries: 2, platform: 'win32' });
    await read(join(root, 'a'));
    await read(join(root, 'b'));
    const third = await read(join(root, 'c'));
    expect(third.queried).toBe(false);
    expect(third.name).toBe('query-budget-exhausted');
  });

  it('reports unsupported platforms honestly instead of guessing', async () => {
    const read = fsMeta.createReparseTagReader({ platform: 'linux' });
    await expect(read(join(root, 'a'))).resolves.toEqual({ tag: null, name: 'unsupported-platform', available: false, queried: false });
  });

  it('names the documented reparse tags it knows and leaves others unknown', () => {
    expect(fsMeta.REPARSE_TAGS['0xa0000003']).toBe('mount-point');
    expect(fsMeta.REPARSE_TAGS['0xa000000c']).toBe('symbolic-link');
    expect(fsMeta.REPARSE_TAGS['0x9000001a']).toBe('cloud-files');
  });

  it('compares volumes and containment using resolved Windows paths', () => {
    expect(fsMeta.volumeKey('C:\\Users\\k7\\a')).toBe('c:\\');
    expect(fsMeta.sameVolume('C:\\a', 'C:\\b')).toBe(true);
    expect(fsMeta.sameVolume('C:\\a', 'D:\\b')).toBe(false);
    expect(fsMeta.isInside('C:\\probe', 'C:\\probe\\child')).toBe(true);
    expect(fsMeta.isInside('C:\\probe', 'C:\\other')).toBe(false);
  });

  it('produces a real long-path form only when the path exceeds the legacy limit', () => {
    const short = 'C:\\a\\b.txt';
    expect(fsMeta.longPathSafe(short)).toBe(short);
    const long = `C:\\${'x'.repeat(300)}`;
    expect(fsMeta.longPathSafe(long).startsWith('\\\\?\\')).toBe(true);
  });
});

describe('windows filesystem fixtures on a real filesystem', () => {
  it('classifies real hard links, symlinks and junctions without following them', async () => {
    const dir = join(root, 'scan');
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, 'a.txt'), 'hello world', 'utf8');
    await writeFile(join(dir, 'b.txt'), 'hello world', 'utf8');
    await link(join(dir, 'a.txt'), join(dir, 'hardlink.txt'));
    let junctionCreated = false;
    try { await symlink(dir, join(dir, 'junction'), 'junction'); junctionCreated = true; } catch { /* privilege-dependent */ }
    let symlinkCreated = false;
    try { await symlink(join(dir, 'a.txt'), join(dir, 'symlink.txt'), 'file'); symlinkCreated = true; } catch { /* privilege-dependent */ }

    const read = fsMeta.createReparseTagReader({ platform: process.platform, maxQueries: 20 });
    const classify = fsMeta.createEntryClassifier({ readReparseTag: read });
    const { lstat } = await import('node:fs/promises');

    const a = await classify(join(dir, 'a.txt'), await lstat(join(dir, 'a.txt')));
    const b = await classify(join(dir, 'b.txt'), await lstat(join(dir, 'b.txt')));
    const hard = await classify(join(dir, 'hardlink.txt'), await lstat(join(dir, 'hardlink.txt')));
    expect(a.hardlinked).toBe(true);
    expect(hard.hardlinked).toBe(true);
    expect(hard.fileIdentity).toBe(a.fileIdentity);
    expect(a.fileIdentity).not.toBe(b.fileIdentity);
    // Two hard links are one physical file.
    expect(fsMeta.reclaimableBytesForGroup([a, hard])).toBe(0);
    // Same size, different physical files: reclaimable.
    expect(fsMeta.reclaimableBytesForGroup([a, b])).toBe(a.size);

    if (symlinkCreated) {
      const link = await classify(join(dir, 'symlink.txt'), await lstat(join(dir, 'symlink.txt')));
      expect(link.entryKind).toBe('reparse');
      expect(fsMeta.mayTraverseLink(link, { reparsePolicy: 'skip' })).toBe(false);
    }
    if (junctionCreated) {
      const junction = await classify(join(dir, 'junction'), await lstat(join(dir, 'junction')));
      expect(junction.entryKind).toBe('reparse');
      expect(fsMeta.mayTraverseLink(junction, { reparsePolicy: 'skip' })).toBe(false);
    }
    }, 30000);

  it('handles a Unicode path and a locked-free read of its bytes', async () => {
    const dir = join(root, 'unicode');
    await mkdir(dir, { recursive: true });
    const unicodePath = join(dir, 'ملف-تجريبي-🔒.txt');
    await writeFile(unicodePath, 'محتوى', 'utf8');
    await expect(readFile(unicodePath, 'utf8')).resolves.toBe('محتوى');
    const { lstat } = await import('node:fs/promises');
    const classify = fsMeta.createEntryClassifier();
    const entry = await classify(unicodePath, await lstat(unicodePath));
    expect(entry.entryKind).toBe('file');
    expect(String(entry.path)).toContain('ملف-تجريبي');
  });
});
