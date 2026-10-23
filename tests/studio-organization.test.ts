import { afterEach, describe, expect, it } from 'vitest';
import { mkdtemp, mkdir, writeFile, readFile, readdir, rm, rename, stat, utimes, realpath } from 'node:fs/promises';
import { existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { randomUUID, createHash } from 'node:crypto';

const require = createRequire(import.meta.url);
const { createOrganizationEngine } = require('../electron/studio/studio-organization.cjs');
const { scanFolder } = require('../electron/studio/folder-inventory.cjs');
const safety = require('../electron/studio/studio-safety.cjs');
const roots: string[] = [];
const engines: Array<{ dispose(): void }> = [];

afterEach(async () => {
  for (const engine of engines.splice(0)) engine.dispose();
  for (const root of roots.splice(0)) await rm(root, { recursive: true, force: true });
});

async function fixture(files: Record<string, string | Buffer> = {
  'report.pdf': 'Studio full-content verification fixture',
  'notes.txt': 'Local-only notes'
}) {
  const root = await mkdtemp(join(tmpdir(), 'knoux-studio-engine-'));
  roots.push(root);
  const source = join(root, 'source');
  const target = join(root, 'target');
  await mkdir(source); await mkdir(target);
  for (const [name, content] of Object.entries(files)) await writeFile(join(source, name), content);
  // The native picker always hands back a resolved folder, and a Windows temp
  // path can also exist with a short (8.3) spelling, so the fixture grants the
  // same canonical roots the application would.
  const sourceRoot = await realpath(source);
  const targetRoot = await realpath(target);
  const inventory = { ...await scanFolder(source), id: randomUUID(), owner: 31 };
  const grant = { id: randomUUID(), root: targetRoot, label: 'Target', identity: (await safety.inspectPath(targetRoot)).identity };
  const storagePath = join(root, 'journal.json');
  const engine = createOrganizationEngine({ storagePath });
  engines.push(engine);
  const getInventory = (id: string, owner: number) => id === inventory.id && owner === inventory.owner ? inventory : null;
  const resolveDestination = (id: string) => id === grant.id ? grant : null;
  const build = (operation = 'copy', extra = {}) => engine.buildPlan({ owner: 31, getInventory, resolveDestination, request: { selections: [{ inventoryId: inventory.id, all: true }], operation, destination: { destinationId: grant.id, relativePath: '' }, structure: 'flat', collisionPolicy: 'review', ...extra } });
  const approve = (plan: any) => ({ planId: plan.planId, planHash: plan.planHash, destinationSummary: plan.destinationSummary, operation: plan.operation, approved: true });
  const authorizeRoot = (path: string, kind: string) => kind === 'source' && path === sourceRoot ? { identity: inventory.rootIdentity } : kind === 'destination' && path === targetRoot ? grant : null;
  return { root, source, target, sourceRoot, targetRoot, inventory, grant, storagePath, engine, getInventory, resolveDestination, build, approve, authorizeRoot };
}

const digest = async (path: string) => createHash('sha256').update(await readFile(path)).digest('hex');

describe('Studio immutable planning and durable journal', () => {
  it('records a real virtual collection without changing either folder and retains history across owners', async () => {
    const f = await fixture();
    const before = await digest(join(f.source, 'report.pdf'));
    const plan = await f.build('virtual');
    const result = await f.engine.execute({ owner: 31, request: f.approve(plan) });
    expect(result.success).toBe(true);
    expect(result.summary.completedFiles).toBe(2);
    expect(await digest(join(f.source, 'report.pdf'))).toBe(before);
    expect(await readdir(f.target)).toEqual([]);
    const restarted = createOrganizationEngine({ storagePath: f.storagePath });
    engines.push(restarted);
    const history = await restarted.history(999);
    expect(history[0].entries.map((entry: any) => entry.state)).toEqual(['grouped', 'grouped']);
  }, 60000);

  it('rejects hash, operation and destination mismatches before any mutation', async () => {
    const f = await fixture();
    const plan = await f.build();
    for (const patch of [{ planHash: '0'.repeat(64) }, { operation: 'move' }, { destinationSummary: 'another destination' }, { approved: false }]) {
      await expect(f.engine.execute({ owner: 31, request: { ...f.approve(plan), ...patch } })).rejects.toThrow();
    }
    expect(await readdir(f.target)).toEqual([]);
    expect(await f.engine.history()).toEqual([]);
  }, 60000);

  it('rejects a replacement even when size and modified time match the index', async () => {
    const f = await fixture();
    const plan = await f.build();
    const original = join(f.source, 'report.pdf');
    const before = await stat(original);
    await rename(original, join(f.source, 'preserved-original.pdf'));
    await writeFile(original, Buffer.alloc(before.size, 65));
    await utimes(original, before.atime, before.mtime);
    await expect(f.engine.execute({ owner: 31, request: f.approve(plan) })).rejects.toThrow('replaced');
    expect(await readdir(f.target)).toEqual([]);
  }, 60000);

  it('rejects revoked inventory authority without creating the reviewed folders', async () => {
    const f = await fixture();
    let authorized = true;
    const plan = await f.engine.buildPlan({ owner: 31, getInventory: (id: string, owner: number) => authorized ? f.getInventory(id, owner) : null, resolveDestination: f.resolveDestination, request: { selections: [{ inventoryId: f.inventory.id, all: true }], operation: 'copy', destination: { destinationId: f.grant.id }, structure: 'categorized' } });
    authorized = false;
    await expect(f.engine.execute({ owner: 31, request: f.approve(plan) })).rejects.toThrow('revoked');
    expect(await readdir(f.target)).toEqual([]);
  }, 60000);

  it('rejects a category folder that appeared after review rather than silently accepting it', async () => {
    const f = await fixture();
    const plan = await f.build('copy', { structure: 'categorized' });
    await mkdir(plan.folderSteps[0].path);
    await expect(f.engine.execute({ owner: 31, request: f.approve(plan) })).rejects.toThrow('appeared');
    expect(await readdir(plan.folderSteps[0].path)).toEqual([]);
  }, 60000);

  it('deduplicates a pathname selected through overlapping source roots', async () => {
    const f = await fixture();
    const parentIndex = { ...await scanFolder(f.root), id: randomUUID(), owner: 31 };
    const overlappingFile = parentIndex.files.find((file: any) => file.relative === 'source/report.pdf');
    const plan = await f.engine.buildPlan({ owner: 31, getInventory: (id: string) => id === parentIndex.id ? parentIndex : f.inventory, resolveDestination: f.resolveDestination, request: { operation: 'virtual', selections: [{ inventoryId: f.inventory.id, fileIds: [f.inventory.files.find((file: any) => file.name === 'report.pdf').id] }, { inventoryId: parentIndex.id, fileIds: [overlappingFile.id] }] } });
    expect(plan.totals.files).toBe(1);
  }, 60000);
});

describe.skipIf(process.platform !== 'win32')('Studio real Windows transfer and undo', () => {
  it('copies with full SHA-256 verification and never replaces a newly occupied target', async () => {
    const f = await fixture();
    const plan = await f.build('copy');
    await writeFile(join(f.target, 'report.pdf'), 'User-created destination');
    await expect(f.engine.execute({ owner: 31, request: f.approve(plan) })).rejects.toThrow('appeared');
    expect(await readFile(join(f.target, 'report.pdf'), 'utf8')).toBe('User-created destination');
    await rm(join(f.target, 'report.pdf'));
    const fresh = await f.build('copy');
    const result = await f.engine.execute({ owner: 31, request: f.approve(fresh) });
    expect(result.success).toBe(true);
    expect(await digest(join(f.source, 'report.pdf'))).toBe(await digest(join(f.target, 'report.pdf')));
    expect((await f.engine.history())[0].entries.every((entry: any) => entry.verification === 'sha256')).toBe(true);
  }, 120000);

  it('requires new picker grants after restart, binds undo to a hash, and restores verified content', async () => {
    const f = await fixture();
    const before = await digest(join(f.source, 'report.pdf'));
    const plan = await f.build('move');
    const moved = await f.engine.execute({ owner: 31, request: f.approve(plan) });
    expect(moved.success).toBe(true);
    expect(await readdir(f.source)).toEqual([]);
    const restarted = createOrganizationEngine({ storagePath: f.storagePath });
    engines.push(restarted);
    const denied = await restarted.undoPreview({ owner: 52, journalId: moved.journalId });
    expect(denied.requiredRoots).toHaveLength(2);
    expect(denied.eligible).toBe(0);
    const preview = await restarted.undoPreview({ owner: 52, journalId: moved.journalId, authorizeRoot: f.authorizeRoot });
    expect(preview.eligible).toBe(2);
    // The engine signals refusal through `error.code`; the IPC layer turns that
    // into the "CODE: message" text the renderer maps to user copy.
    const wrongHash = await restarted.undoApply({ owner: 52, journalId: moved.journalId, previewId: preview.previewId, previewHash: '0'.repeat(64), resolution: 'skip', authorizeRoot: f.authorizeRoot }).then(() => null, (error: unknown) => error as { code?: string });
    expect(wrongHash?.code).toBe('STUDIO_UNDO_STALE');
    // A rejected approval must not consume the reviewed preview.
    const restored = await restarted.undoApply({ owner: 52, journalId: moved.journalId, previewId: preview.previewId, previewHash: preview.previewHash, resolution: 'skip', authorizeRoot: f.authorizeRoot });
    expect(restored.success).toBe(true);
    expect(restored.restored).toBe(2);
    expect(await digest(join(f.source, 'report.pdf'))).toBe(before);
    expect(await readdir(f.target)).toEqual([]);
  }, 120000);

  it('preserves occupied originals, allows skipped undo to be previewed again, and uses the exact reviewed rename', async () => {
    const f = await fixture();
    const plan = await f.build('move');
    const moved = await f.engine.execute({ owner: 31, request: f.approve(plan) });
    await writeFile(join(f.source, 'report.pdf'), 'New original must remain');
    const preview = await f.engine.undoPreview({ owner: 31, journalId: moved.journalId, authorizeRoot: f.authorizeRoot });
    const result = await f.engine.undoApply({ owner: 31, journalId: moved.journalId, previewId: preview.previewId, previewHash: preview.previewHash, resolution: 'skip', authorizeRoot: f.authorizeRoot });
    expect(result.skipped).toBe(1);
    expect(await readFile(join(f.source, 'report.pdf'), 'utf8')).toBe('New original must remain');
    const retry = await f.engine.undoPreview({ owner: 31, journalId: moved.journalId, authorizeRoot: f.authorizeRoot });
    expect(retry.eligible).toBe(1);
    const name = retry.entries.find((entry: any) => entry.eligible).restoreName;
    const restored = await f.engine.undoApply({ owner: 31, journalId: moved.journalId, previewId: retry.previewId, previewHash: retry.previewHash, resolution: 'rename', authorizeRoot: f.authorizeRoot });
    expect(restored.restored).toBe(1);
    expect(await readFile(join(f.source, 'report.pdf'), 'utf8')).toBe('New original must remain');
    expect(await readFile(join(f.source, name), 'utf8')).toBe('Studio full-content verification fixture');
  }, 120000);

  it('never deletes a foreign file that took over the original path mid-copy', async () => {
    const f = await fixture({ 'report.bin': Buffer.alloc(2 * 1024 * 1024, 65) });
    const original = join(f.source, 'report.bin');
    const plan = await f.build('move');
    let acted = false;
    const moved = await f.engine.execute({
      owner: 31,
      request: f.approve(plan),
      emit: (payload: { phase?: string; currentName?: string | null; bytes?: number }) => {
        // Only the chunk callback carries a non-zero byte count, so this lands
        // between the verified read and the deletion - the same window a real
        // competing process has.
        if (acted || payload.phase !== 'progress' || !payload.currentName || !payload.bytes) return;
        acted = true;
        renameSync(original, join(f.source, 'taken-over.bin'));
        writeFileSync(original, 'Written by another process after the rename');
      }
    });
    expect(acted).toBe(true);
    expect(moved.success).toBe(false);
    // The stranger is untouched, the real original still holds its bytes, and
    // the destination keeps the verified copy.
    expect(readFileSync(original, 'utf8')).toBe('Written by another process after the rename');
    expect(existsSync(join(f.source, 'taken-over.bin'))).toBe(true);
    expect(readFileSync(join(f.source, 'taken-over.bin')).subarray(0, 8).every((byte: number) => byte === 65)).toBe(true);
    const copied = readFileSync(join(f.target, 'report.bin'));
    expect(copied.length).toBe(2 * 1024 * 1024);
    expect(createHash('sha256').update(copied).digest('hex')).toBe(createHash('sha256').update(Buffer.alloc(2 * 1024 * 1024, 65)).digest('hex'));
    const entry = (await f.engine.history())[0].entries[0];
    expect(entry.state).toBe('copy-verified-source-remains');
    expect(entry.error).toContain('STUDIO_SOURCE_REPLACED');
  }, 120000);

  it('deletes nothing when another process vacates the original path during the copy', async () => {
    // A path that no longer holds a file is never treated as a completed
    // deletion: the copy is kept, reported, and recorded as already empty.
    const f = await fixture({ 'report.bin': Buffer.alloc(2 * 1024 * 1024, 66) });
    const original = join(f.source, 'report.bin');
    const plan = await f.build('move');
    let acted = false;
    const moved = await f.engine.execute({
      owner: 31,
      request: f.approve(plan),
      emit: (payload: { phase?: string; currentName?: string | null; bytes?: number }) => {
        if (acted || payload.phase !== 'progress' || !payload.currentName || !payload.bytes) return;
        acted = true;
        renameSync(original, join(f.source, 'elsewhere.bin'));
      }
    });
    expect(moved.success).toBe(true);
    expect(existsSync(original)).toBe(false);
    expect(readFileSync(join(f.source, 'elsewhere.bin')).length).toBe(2 * 1024 * 1024);
    // Nothing was deleted, so the journal must say the path was already empty
    // rather than implying this application removed the original.
    expect((await f.engine.history())[0].warnings.join(' ')).toContain('already empty');
    expect((await f.engine.history())[0].entries[0].state).toBe('moved');
  }, 120000);

  it('loses nothing while another writer races the original path throughout a move', async () => {
    const ours = Buffer.alloc(1024 * 1024, 77);
    const f = await fixture({ 'storm.bin': ours });
    const original = join(f.source, 'storm.bin');
    const plan = await f.build('move');
    const strangers: string[] = [];
    let stop = false;
    const race = async () => {
      for (let round = 0; !stop && round < 60; round += 1) {
        strangers.push(`stranger-${round}`);
        try { renameSync(original, join(f.source, `displaced-${round}.bin`)); } catch { /* the transfer or a previous swap won */ }
        try { writeFileSync(original, strangers[round]); } catch { /* the path was taken again */ }
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    };
    const racing = race();
    const moved = await f.engine.execute({ owner: 31, request: f.approve(plan) }).catch((error: unknown) => ({ thrown: error as Error }));
    stop = true;
    await racing;
    const names = await readdir(f.source);
    const contents = new Map(names.map(name => [name, readFileSync(join(f.source, name), 'utf8')]));
    // Every file another writer created is still on disk, including anything
    // the engine parked under its own review name: a swap may cost a rename, it
    // may never cost somebody else's data.
    for (const [round, text] of strangers.entries()) {
      expect([...contents.values()], `stranger ${round}`).toContain(text);
    }
    const ourDigest = createHash('sha256').update(ours).digest('hex');
    const holdsOurBytes = [...names].some(name => createHash('sha256').update(contents.get(name) || '').digest('hex') === ourDigest);
    const destination = join(f.target, 'storm.bin');
    if ('thrown' in moved) {
      // The swap landed before the copy: the operation must refuse, and its own
      // partial destination must be gone rather than left as a decoy file.
      //
      // Two guards can catch that moment, and which one wins is a timing detail
      // rather than a safety difference. The plain-entry check runs first, before
      // anything opens the file, and reports a path the racer has just renamed
      // away as STUDIO_PATH_UNSAFE because at that instant the path holds
      // nothing. The identity comparison behind it reports the same race as
      // STUDIO_PLAN_STALE once the racer has written its own file there. Both
      // refuse before a byte is copied, which is what this branch grades.
      expect(['STUDIO_PATH_UNSAFE', 'STUDIO_PLAN_STALE']).toContain(moved.thrown.code);
      expect(existsSync(destination)).toBe(false);
      expect(holdsOurBytes).toBe(true);
    } else {
      expect(existsSync(destination)).toBe(true);
      expect(createHash('sha256').update(readFileSync(destination)).digest('hex')).toBe(ourDigest);
      const entry = (await f.engine.history())[0].entries[0];
      if (entry.state === 'moved') {
        // A completed move means the engine unlinked the very object it copied
        // and verified, so those bytes now exist only at the destination.
        expect(holdsOurBytes).toBe(false);
      } else {
        expect(entry.state).toBe('copy-verified-source-remains');
        expect(holdsOurBytes).toBe(true);
      }
    }
  }, 180000);
});
