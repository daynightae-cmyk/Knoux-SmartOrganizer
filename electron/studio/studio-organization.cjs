'use strict';
/**
 * Studio organization engine.
 *
 * The renderer never supplies a raw source or destination path to a mutation.
 * Plans are built from indexed file identities and Main-process destination
 * grants, frozen under a hash, and executed only after an exact approval.
 *
 * Moves are always copy -> verify -> unlink. There is no placeholder-and-rename
 * shortcut and no implicit overwrite anywhere in this module.
 */
const crypto = require('node:crypto');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const CAT = require('./folder-categories.cjs');
const safety = require('./studio-safety.cjs');
const winMeta = require('../windows-fs-metadata.cjs');

const MAX_PLAN_FILES = 10000;
const MAX_JOURNAL_OPERATIONS = 80;
const PLAN_TTL_MS = 30 * 60 * 1000;
const COPY_CHUNK = 1024 * 1024;
const HASH_VERIFY_LIMIT = 128 * 1024 * 1024;

function studioError(code, message, details = undefined) {
  const error = new Error(message);
  error.code = code;
  if (details !== undefined) error.details = details;
  return error;
}

function iso(ms) {
  return new Date(ms).toISOString();
}

function jsonClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) deepFreeze(child);
  return value;
}

function stableHash(value) {
  return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function extOf(name) {
  return path.extname(name).toLowerCase();
}

function relativeForDisplay(targetRoot, targetPath) {
  return path.relative(targetRoot, targetPath);
}

async function hashFile(target, signal) {
  const hash = crypto.createHash('sha256');
  const stream = fs.createReadStream(target);
  let bytes = 0;
  try {
    for await (const chunk of stream) {
      if (signal?.aborted) throw studioError('STUDIO_CANCELLED', 'The operation was cancelled.');
      hash.update(chunk);
      bytes += chunk.length;
    }
  } finally {
    stream.destroy();
  }
  return { hash: hash.digest('hex'), bytes };
}

/**
 * Hashes an already-open file object, from its start, without touching a path.
 * Used to read back the destination we created so that verification describes
 * the bytes that handle wrote rather than whatever the path points at later.
 */
async function hashHandle(handle, expectedBytes, signal) {
  const hash = crypto.createHash('sha256');
  const buffer = Buffer.allocUnsafe(COPY_CHUNK);
  let position = 0;
  while (position < expectedBytes) {
    if (signal?.aborted) throw studioError('STUDIO_CANCELLED', 'The operation was cancelled.');
    const wanted = Math.min(buffer.length, expectedBytes - position);
    const { bytesRead } = await handle.read(buffer, 0, wanted, position);
    if (!bytesRead) break;
    hash.update(buffer.subarray(0, bytesRead));
    position += bytesRead;
  }
  return { hash: hash.digest('hex'), bytes: position };
}

async function copyExclusive(source, destination, { expectedSize, expectedIdentity = null, verifyHash, signal, onChunk = () => {} }) {
  let sourceHandle;
  let destinationHandle;
  let created = false;
  let createdIdentity = null;
  try {
    sourceHandle = await fsp.open(source, 'r');
    const before = await sourceHandle.stat();
    const beforeIdentity = winMeta.identitySnapshot(before);
    if (!before.isFile()) throw studioError('STUDIO_SOURCE_NOT_FILE', 'The source is no longer a regular file.');
    if (Number.isFinite(expectedSize) && Number(before.size) !== expectedSize) {
      throw studioError('STUDIO_PLAN_STALE', 'The source file size changed after the plan was reviewed.');
    }
    if (expectedIdentity) {
      if (expectedIdentity.fileIdentity && beforeIdentity.fileIdentity && expectedIdentity.fileIdentity !== beforeIdentity.fileIdentity) {
        throw studioError('STUDIO_PLAN_STALE', 'The source file was replaced after the plan was reviewed.');
      }
      if (Number.isFinite(expectedIdentity.modifiedMs) && Number(before.mtimeMs) !== Number(expectedIdentity.modifiedMs)) {
        throw studioError('STUDIO_PLAN_STALE', 'The source file was modified after the plan was reviewed.');
      }
    }
    try {
      // 'wx+' is CREATE_NEW with read access: the file is still never
      // overwritten, and the read-back below describes this exact object.
      destinationHandle = await fsp.open(destination, 'wx+');
      created = true;
      createdIdentity = winMeta.identitySnapshot(await destinationHandle.stat());
    } catch (error) {
      if (error?.code === 'EEXIST') throw studioError('STUDIO_COLLISION', 'The destination appeared after the plan was reviewed.');
      throw error;
    }

    const buffer = Buffer.allocUnsafe(COPY_CHUNK);
    const hash = verifyHash ? crypto.createHash('sha256') : null;
    let position = 0;
    while (true) {
      if (signal?.aborted) throw studioError('STUDIO_CANCELLED', 'The operation was cancelled.');
      const { bytesRead } = await sourceHandle.read(buffer, 0, buffer.length, position);
      if (!bytesRead) break;
      if (hash) hash.update(buffer.subarray(0, bytesRead));
      let written = 0;
      while (written < bytesRead) {
        if (signal?.aborted) throw studioError('STUDIO_CANCELLED', 'The operation was cancelled.');
        const result = await destinationHandle.write(buffer, written, bytesRead - written, position + written);
        if (!result.bytesWritten) throw new Error('The destination stopped accepting data.');
        written += result.bytesWritten;
      }
      position += bytesRead;
      onChunk(bytesRead, position);
    }
    await destinationHandle.sync();
    const after = await sourceHandle.stat();
    const afterIdentity = winMeta.identitySnapshot(after);
    if (Number(after.size) !== Number(before.size) || Number(after.mtimeMs) !== Number(before.mtimeMs)) {
      throw studioError('STUDIO_SOURCE_CHANGED', 'The source changed while it was being copied.');
    }
    if (beforeIdentity.fileIdentity && afterIdentity.fileIdentity !== beforeIdentity.fileIdentity) {
      throw studioError('STUDIO_SOURCE_CHANGED', 'The source handle stopped describing the file that was opened.');
    }
    if (position !== Number(before.size)) {
      throw studioError('STUDIO_COPY_INCOMPLETE', 'The copied byte count does not match the source.');
    }

    // Verification reads the destination through the handle that created it.
    // Reopening by path would describe whatever the path points at now, which
    // is not the same promise: Windows lets another process rename or delete
    // this path while our handle stays open, because Node requests
    // FILE_SHARE_DELETE.
    const destStats = await destinationHandle.stat();
    if (!destStats.isFile() || Number(destStats.size) !== position) {
      throw studioError('STUDIO_COPY_VERIFY_FAILED', 'The destination could not be verified after copying.');
    }
    let verification = 'size';
    let copiedHash = null;
    if (verifyHash) {
      copiedHash = hash.digest('hex');
      const readBack = await hashHandle(destinationHandle, position, signal);
      if (readBack.hash !== copiedHash || readBack.bytes !== position) {
        throw studioError('STUDIO_COPY_VERIFY_FAILED', 'The copy read-back did not match the source data.');
      }
      verification = 'sha256';
    }
    await destinationHandle.utimes(before.atime, before.mtime).catch(() => {});
    // The identity recorded in the journal must describe the file as it now
    // exists, after its timestamps were copied. Recording the pre-utimes value
    // would make every later undo check report a file that was "modified".
    const finalDestStats = await destinationHandle.stat();
    if (!finalDestStats.isFile() || Number(finalDestStats.size) !== position) {
      throw studioError('STUDIO_COPY_VERIFY_FAILED', 'The destination changed while its timestamps were being copied.');
    }
    await destinationHandle.close();
    destinationHandle = null;
    await sourceHandle.close();
    sourceHandle = null;
    return {
      bytes: position,
      verification,
      copiedHash,
      destStats: finalDestStats,
      // Identity taken from the file objects themselves. The caller may only
      // delete the original when the path still describes this exact object.
      sourceIdentity: beforeIdentity,
      sourceLinkCount: Number.isFinite(Number(before.nlink)) ? Number(before.nlink) : null,
      destinationIdentity: winMeta.identitySnapshot(finalDestStats)
    };
  } catch (error) {
    try { if (destinationHandle) await destinationHandle.close(); } catch { /* already closed */ }
    try { if (sourceHandle) await sourceHandle.close(); } catch { /* already closed */ }
    // A partial file is removed only when its identity can be proven to be the
    // one this call created. An unknown identity is left exactly where it is:
    // a leftover partial file is recoverable, a wrongly deleted file is not.
    if (created) {
      const current = await fsp.lstat(destination).catch(() => null);
      const currentIdentity = current ? winMeta.identitySnapshot(current) : null;
      const provablyOurs = Boolean(current) && Boolean(currentIdentity?.fileIdentity) &&
        Boolean(createdIdentity?.fileIdentity) && currentIdentity.fileIdentity === createdIdentity.fileIdentity;
      if (provablyOurs) {
        await fsp.unlink(destination).catch(() => { error.destinationRemains = destination; });
      } else {
        error.destinationRemains = destination;
      }
    }
    throw error;
  }
}

class JournalStore {
  constructor(storagePath, { now = () => Date.now() } = {}) {
    this.storagePath = storagePath;
    this.now = now;
    this.data = { version: 1, operations: [] };
    this.loaded = null;
    this.writeChain = Promise.resolve();
  }

  ensureLoaded() {
    if (!this.loaded) this.loaded = this.load();
    return this.loaded;
  }

  async load() {
    try {
      const parsed = JSON.parse(await fsp.readFile(this.storagePath, 'utf8'));
      if (parsed && parsed.version === 1 && Array.isArray(parsed.operations)) {
        this.data = {
          version: 1,
          operations: parsed.operations
            .filter((operation) => operation && typeof operation.id === 'string' && Array.isArray(operation.entries))
            .map((operation) => this.prepareLoadedOperation(operation))
        };
      }
    } catch (error) {
      if (error?.code !== 'ENOENT') {
        const backup = `${this.storagePath}.unreadable-${this.now()}`;
        await fsp.rename(this.storagePath, backup).catch(() => {});
      }
    }
    return this.data;
  }

  prepareLoadedOperation(operation) {
    const interrupted = ['running', 'creating-folders', 'copying', 'undoing'].includes(operation.status);
    return {
      ...operation,
      status: interrupted ? 'interrupted' : operation.status,
      interruptedAt: interrupted || operation.undoStatus === 'running' ? iso(this.now()) : operation.interruptedAt || null,
      undoStatus: operation.undoStatus === 'running' ? 'interrupted' : operation.undoStatus,
      entries: operation.entries.map((entry) => {
        if (entry.undo?.state === 'undoing' || entry.undo?.state === 'delete-intent') {
          return { ...entry, undo: { ...entry.undo, state: 'interrupted', error: 'The application stopped during undo; both recorded paths must be inspected.' } };
        }
        if (entry.state === 'copying' || entry.state === 'undoing') {
          return { ...entry, state: 'interrupted', error: entry.error || 'The application stopped during this transfer.' };
        }
        return entry;
      })
    };
  }

  async persist(data = this.data) {
    await this.ensureLoaded();
    const payload = JSON.stringify(data, null, 2);
    await fsp.mkdir(path.dirname(this.storagePath), { recursive: true });
    const task = async () => {
      const temp = `${this.storagePath}.${process.pid}.${crypto.randomUUID()}.tmp`;
      const handle = await fsp.open(temp, 'wx');
      try { await handle.writeFile(payload, 'utf8'); await handle.sync(); }
      finally { await handle.close(); }
      for (let attempt = 0; attempt < 6; attempt += 1) {
        try {
          await fsp.rename(temp, this.storagePath);
          return;
        } catch (error) {
          if (!['EPERM', 'EACCES', 'EBUSY'].includes(error?.code) || attempt === 5) {
            await fsp.rm(temp, { force: true }).catch(() => {});
            throw error;
          }
          await new Promise((resolve) => setTimeout(resolve, 25 * (attempt + 1)));
        }
      }
    };
    this.writeChain = this.writeChain.catch(() => {}).then(task);
    await this.writeChain;
  }

  async add(operation) {
    await this.ensureLoaded();
    if (this.data.operations.length >= MAX_JOURNAL_OPERATIONS) throw studioError('STUDIO_JOURNAL_FULL', 'The journal is full. Existing recovery records were preserved; no files were changed.');
    const next = jsonClone(this.data);
    next.operations.unshift(operation);
    try { await this.persist(next); }
    catch (error) { throw studioError('STUDIO_JOURNAL_WRITE_FAILED', `The journal could not be saved (${error?.code || 'IO_ERROR'}).`); }
    this.data = next;
  }

  async update(operationId, mutator) {
    await this.ensureLoaded();
    const next = jsonClone(this.data);
    const operation = next.operations.find((item) => item.id === operationId);
    if (!operation) return null;
    mutator(operation);
    operation.updatedAt = iso(this.now());
    try { await this.persist(next); }
    catch (error) { throw studioError('STUDIO_JOURNAL_WRITE_FAILED', `The journal checkpoint could not be saved (${error?.code || 'IO_ERROR'}).`); }
    this.data = next;
    return operation;
  }

  async get(operationId) {
    await this.ensureLoaded();
    return this.data.operations.find((item) => item.id === operationId) || null;
  }

  async list() {
    await this.ensureLoaded();
    return this.data.operations;
  }
}

function createOrganizationEngine({ storagePath, now = () => Date.now(), maxPlansPerOwner = 10 } = {}) {
  if (!storagePath) throw new Error('Studio organization engine needs a journal path.');
  const journal = new JournalStore(storagePath, { now });
  const plans = new Map();
  const active = new Map();
  const undoPlans = new Map();
  const profileId = stableHash(path.resolve(storagePath).toLowerCase());
  let ready;
  const ensureReady = () => {
    if (!ready) ready = journal.ensureLoaded().then(() => true);
    return ready;
  };

  function prunePlans() {
    const byOwner = new Map();
    for (const [id, record] of plans) {
      if (record.used || record.stale || record.plan.expiresAtMs < now()) {
        plans.delete(id);
        continue;
      }
      const list = byOwner.get(record.owner) || [];
      list.push(id);
      byOwner.set(record.owner, list);
    }
    for (const list of byOwner.values()) {
      while (list.length > maxPlansPerOwner) plans.delete(list.shift());
    }
  }

  function publicEntryFor(operation) {
    return {
      operationId: operation.id,
      mode: operation.mode,
      status: operation.status,
      createdAt: operation.createdAt,
      updatedAt: operation.updatedAt,
      planId: operation.planId,
      destinationSummary: operation.destinationSummary || null,
      sourceRoots: operation.sourceRoots || [],
      totalFiles: operation.totalFiles || 0,
      totalBytes: operation.totalBytes || 0,
      completedFiles: operation.completedFiles || 0,
      failedFiles: operation.failedFiles || 0,
      skippedFiles: operation.skippedFiles || 0,
      cancelledFiles: operation.cancelledFiles || 0,
      undoAvailable: operation.mode === 'move' && operation.entries.some((entry) => ['moved', 'delete-intent'].includes(entry.state) && !['restored', 'restored-destination-remains', 'interrupted'].includes(entry.undo?.state)),
      undoCompletedFiles: operation.entries.filter((entry) => ['restored', 'restored-destination-remains'].includes(entry.undo?.state)).length,
      interruptedAt: operation.interruptedAt || null,
      warnings: operation.warnings || [],
      errors: operation.errors || [],
      entries: operation.entries.map((entry) => ({
        index: entry.index,
        name: entry.name,
        category: entry.category,
        sourceRelative: entry.sourceRelative,
        sourceRoot: entry.sourceRoot,
        targetRelative: entry.targetRelative,
        targetRoot: entry.targetRoot,
        size: entry.size,
        state: entry.state,
        verification: entry.verification || null,
        error: entry.error || null,
        undo: entry.undo ? { state: entry.undo.state, at: entry.undo.at || null, error: entry.undo.error || null } : null
      }))
    };
  }

  async function buildPlan({ owner, request, getInventory, resolveDestination }) {
    await ensureReady();
    prunePlans();
    const operation = request.operation;
    if (!['virtual', 'copy', 'move'].includes(operation)) throw studioError('STUDIO_INVALID_MODE', 'Unknown organization operation.');
    const collisionPolicy = request.collisionPolicy || 'review';
    if (!['skip', 'rename', 'review'].includes(collisionPolicy)) throw studioError('STUDIO_INVALID_COLLISION_POLICY', 'Unknown collision policy.');
    const structure = request.structure === 'flat' ? 'flat' : 'categorized';
    const selections = Array.isArray(request.selections) ? request.selections : [];
    if (!selections.length) throw studioError('STUDIO_EMPTY_SELECTION', 'Select at least one file or category first.');

    const selected = new Map();
    const inventoryByRoot = new Map();
    for (const selection of selections) {
      const inventory = getInventory(selection.inventoryId, owner);
      if (!inventory) throw studioError('STUDIO_INDEX_EXPIRED', 'The index expired. Rescan the folder and try again.');
      inventoryByRoot.set(inventory.root.toLowerCase(), inventory.root);
      let candidates = [];
      if (Array.isArray(selection.fileIds)) {
        for (const fileId of selection.fileIds) {
          const file = inventory.files[Number(fileId)];
          if (!file || file.id !== Number(fileId)) throw studioError('STUDIO_UNKNOWN_FILE', 'A selected file is no longer part of the current index.');
          candidates.push(file);
        }
      } else if (selection.category) {
        candidates = inventory.files.filter((file) => file.category === selection.category);
      } else if (selection.all === true) {
        candidates = inventory.files;
      } else {
        throw studioError('STUDIO_INVALID_SELECTION', 'Each selection must name files, a category or the whole index.');
      }
      for (const file of candidates) {
        const key = safety.keyOf(path.resolve(inventory.root, ...file.relative.split('/')));
        const duplicate = selected.get(key);
        if (duplicate && duplicate.file.identity?.fileIdentity !== file.identity?.fileIdentity) throw studioError('STUDIO_PLAN_STALE', 'Overlapping source indices disagree. Reindex them before planning.');
        if (!duplicate) selected.set(key, { inventory, file });
        if (selected.size > MAX_PLAN_FILES) throw studioError('STUDIO_PLAN_TOO_LARGE', `A plan can contain at most ${MAX_PLAN_FILES} files. Narrow the selection.`);
      }
    }
    if (!selected.size) throw studioError('STUDIO_EMPTY_SELECTION', 'The current index contains no files in that selection.');

    const categories = Array.from(new Set(Array.from(selected.values()).map(({ file }) => file.category)));
    const folderNames = new Map();
    const requestedNames = request.categoryFolderNames || {};
    for (const category of categories) {
      const candidate = typeof requestedNames[category] === 'string' && requestedNames[category].trim()
        ? requestedNames[category]
        : (CAT.CATEGORY_LABELS[category]?.en || category);
      const check = safety.validateFolderName(candidate);
      if (!check.ok) throw studioError('STUDIO_INVALID_FOLDER_NAME', `${candidate}: ${check.message}`, { category });
      folderNames.set(category, check.name);
    }

    const needsDestination = operation !== 'virtual';
    const sharedDestination = request.destination?.destinationId
      ? await resolveBaseDestination(request.destination, resolveDestination)
      : null;
    if (!sharedDestination && needsDestination) throw studioError('STUDIO_DESTINATION_REQUIRED', 'Choose an authorized destination folder first.');

    const categoryBases = new Map();
    const categoryOverrides = request.categoryDestinations || {};
    for (const category of categories) {
      const override = categoryOverrides[category];
      if (override?.destinationId) {
        categoryBases.set(category, await resolveBaseDestination(override, resolveDestination));
      } else if (sharedDestination) {
        categoryBases.set(category, sharedDestination);
      }
    }

    for (const sourceRoot of inventoryByRoot.values()) {
      for (const base of new Set(Array.from(categoryBases.values()).map((item) => item.base.toLowerCase()))) {
        const basePath = Array.from(categoryBases.values()).find((item) => item.base.toLowerCase() === base)?.base;
        if (!basePath) continue;
        if (safety.isInside(sourceRoot, basePath)) {
          throw studioError('STUDIO_DESTINATION_INSIDE_SOURCE', 'Choose a destination outside the scanned source folder. Organizing into the same source tree is refused to prevent recursive self-inclusion.');
        }
      }
    }

    const folderSteps = new Map();
    const destinationSummaries = new Map();
    const publicFiles = [];
    const internalOperations = [];
    const skipped = [];
    const collisions = [];
    const warnings = [];
    const categoryTotals = new Map();
    const plannedTargets = new Set();
    let totalBytes = 0;

    for (const { inventory, file } of selected.values()) {
      const sourceAbsolute = path.resolve(inventory.root, ...file.relative.split('/'));
      if (!safety.isInside(inventory.root, sourceAbsolute) || path.basename(sourceAbsolute) !== file.name) {
        throw studioError('STUDIO_INVALID_SOURCE', 'An indexed source path failed identity validation.');
      }
      if (operation !== 'virtual') {
        const nameCheck = safety.validateNameForNewPath(file.name);
        if (!nameCheck.ok) throw studioError('STUDIO_INVALID_FILE_NAME', `${file.name}: ${nameCheck.message}`);
      }
      const base = categoryBases.get(file.category) || null;
      let folderPath = null;
      let targetName = file.name;
      let targetAbsolute = null;
      let targetRelative = null;
      let status = 'ready';

      if (operation === 'virtual' && !base) {
        // A virtual grouping has no filesystem target at all.
      } else if (!base) {
        throw studioError('STUDIO_DESTINATION_REQUIRED', 'Every category needs a destination.');
      } else {
        folderPath = structure === 'categorized' ? path.join(base.base, folderNames.get(file.category)) : base.base;
        if (structure === 'categorized') {
          const absoluteFolder = validationFullPath(folderPath);
          if (!safety.isInside(base.root, absoluteFolder)) throw studioError('STUDIO_DESTINATION_ESCAPE', 'The category folder would leave the authorized destination.');
          const existing = await safety.lstatOrNull(absoluteFolder);
          if (existing) {
            if (existing.isSymbolicLink() || !existing.isDirectory()) throw studioError('STUDIO_DESTINATION_BLOCKED', `The category folder "${folderNames.get(file.category)}" is not a normal directory.`);
          } else {
            folderSteps.set(`${base.root.toLowerCase()}|${absoluteFolder.toLowerCase()}`, {
              path: absoluteFolder,
              relative: relativeForDisplay(base.root, absoluteFolder),
              category: file.category,
              exists: false
            });
          }
          destinationSummaries.set(`${base.root.toLowerCase()}|${absoluteFolder.toLowerCase()}`, absoluteFolder);
        }
        targetAbsolute = path.join(folderPath, targetName);
        if (!safety.isInside(base.root, targetAbsolute)) throw studioError('STUDIO_DESTINATION_ESCAPE', 'The destination file would leave the authorized folder.');
        validationFullPath(targetAbsolute);
        targetRelative = relativeForDisplay(base.root, targetAbsolute);
        const existingTarget = await safety.lstatOrNull(targetAbsolute);
        const targetKey = targetAbsolute.toLowerCase();
        if (existingTarget || plannedTargets.has(targetKey)) {
          if (collisionPolicy === 'skip') {
            skipped.push({ name: file.name, sourceRelative: file.relative, category: file.category, size: file.size, reason: 'COLLISION' });
            status = 'skipped';
          } else if (collisionPolicy === 'rename') {
            targetName = await uniquePlannedName(folderPath, file.name, plannedTargets);
            targetAbsolute = path.join(folderPath, targetName);
            validationFullPath(targetAbsolute);
            targetRelative = relativeForDisplay(base.root, targetAbsolute);
            warnings.push(`Renamed ${file.name} to ${targetName} to avoid replacing an existing file.`);
          } else {
            collisions.push({ name: file.name, sourceRelative: file.relative, targetPath: targetAbsolute, size: file.size });
            status = 'collision';
          }
        }
        if (status !== 'skipped') plannedTargets.add(targetAbsolute.toLowerCase());
      }

      if (status === 'skipped') continue;

      const categoryTotal = categoryTotals.get(file.category) || { category: file.category, files: 0, bytes: 0, folderName: folderNames.get(file.category), targetPath: folderPath };
      categoryTotal.files += 1;
      categoryTotal.bytes += file.size;
      categoryTotals.set(file.category, categoryTotal);
      totalBytes += file.size;

      const index = publicFiles.length;
      publicFiles.push({
        index,
        inventoryId: inventory.id,
        fileId: file.id,
        name: file.name,
        sourceRelative: file.relative,
        sourceRoot: inventory.root,
        category: file.category,
        size: file.size,
        ext: file.ext || extOf(file.name),
        modifiedAt: file.modifiedAt,
        targetName,
        targetPath: targetAbsolute,
        targetRelative,
        status
      });

      if (operation !== 'virtual') {
        internalOperations.push({
          index,
          inventoryId: inventory.id,
          fileId: file.id,
          name: file.name,
          category: file.category,
          size: file.size,
          sourceRoot: inventory.root,
          sourceRelative: file.relative,
          sourceAbsolute,
          sourceIdentity: file.identity,
          sourceModifiedAt: file.modifiedAt,
          targetRoot: base.root,
          targetAbsolute,
          targetRelative,
          verification: 'sha256'
        });
      }
    }

    if (publicFiles.length === 0) throw studioError('STUDIO_EMPTY_PLAN', 'Every selected file was skipped by the current collision policy.');

    const destinationRoots = Array.from(new Map(
      Array.from(categoryBases.values()).map((base) => [base.root.toLowerCase(), {
        id: base.id,
        name: base.label,
        root: base.root,
        base: base.base,
        baseRelative: relativeForDisplay(base.root, base.base)
      }])
    ).values());
    const destinationSummary = destinationRoots.length === 1
      ? destinationRoots[0].base
      : destinationRoots.map((entry) => entry.base).join(' | ');
    const executable = !(collisionPolicy === 'review' && collisions.length > 0);
    const planId = crypto.randomUUID();
    const createdAtMs = now();
    const expiresAtMs = createdAtMs + PLAN_TTL_MS;
    const sourceRoots = Array.from(inventoryByRoot.values());
    const planForHash = {
      planId,
      createdAt: iso(createdAtMs),
      expiresAt: iso(expiresAtMs),
      operation,
      structure,
      collisionPolicy,
      destinationSummary,
      destinationRoots,
      folderSteps: Array.from(folderSteps.values()),
      categories: Array.from(categoryTotals.values()),
      files: publicFiles,
      skipped,
      collisions,
      warnings,
      sourceRoots,
      totals: {
        files: publicFiles.length,
        bytes: totalBytes,
        categories: categoryTotals.size,
        folderSteps: folderSteps.size,
        skipped: skipped.length,
        collisions: collisions.length
      }
    };
    const planHash = stableHash(planForHash);
    const publicPlan = deepFreeze({ ...planForHash, planHash, executable, expiresAtMs });
    const inventoryRecords = [...new Set([...selected.values()].map(item => item.inventory))];
    const rootIdentities = await Promise.all([...new Set([...sourceRoots, ...destinationRoots.map(item => item.root)])].map(async root => ({ root, identity: (await safety.assertSafeRoute(root)).identity })));
    for (const inventory of inventoryRecords) {
      if (getInventory(inventory.id, owner) !== inventory) throw studioError('STUDIO_PLAN_STALE', 'A source grant was revoked during planning.');
      if (inventory.rootIdentity?.fileIdentity !== rootIdentities.find(item => item.root === inventory.root)?.identity?.fileIdentity) throw studioError('STUDIO_PLAN_STALE', 'A source root was replaced after indexing.');
    }
    for (const destination of destinationRoots) {
      const grant = resolveDestination(destination.id);
      const grantRoot = grant ? await safety.assertRealDirectory(grant.root, 'Destination').catch(() => null) : null;
      if (!grant || grantRoot !== destination.root || grant.identity?.fileIdentity !== rootIdentities.find(item => item.root === destination.root)?.identity?.fileIdentity) throw studioError('STUDIO_PLAN_STALE', 'A destination root grant changed during planning.');
    }
    plans.set(planId, {
      owner,
      plan: publicPlan,
      internalOperations,
      destinationRoots,
      getInventory,
      resolveDestination,
      inventoryRecords,
      rootIdentities,
      used: false,
      stale: false,
      createdAtMs
    });
    prunePlans();
    return jsonClone(publicPlan);
  }

  async function resolveBaseDestination(request, resolveDestination) {
    const authorization = resolveDestination(request.destinationId);
    if (!authorization) throw studioError('STUDIO_DESTINATION_NOT_AUTHORIZED', 'That destination was not selected in this window. Choose it again with the native folder picker.');
    // A grant is only ever used through its real path. Windows may describe the
    // same folder with a short (8.3) name, and mixing the two spellings would
    // make an in-root test fail for a folder that is genuinely inside.
    const root = await safety.assertRealDirectory(authorization.root, 'Destination');
    const base = await safety.resolveWithinRoot(root, request.relativePath || '', { create: false, label: 'Destination' });
    return {
      id: authorization.id,
      label: authorization.label,
      root,
      base: base.realPath
    };
  }

  async function uniquePlannedName(folderPath, requestedName, plannedTargets) {
    const ext = path.extname(requestedName);
    const stem = ext ? requestedName.slice(0, -ext.length) : requestedName;
    for (let index = 1; index <= 9999; index += 1) {
      const candidate = index === 1 ? requestedName : `${stem} (${index})${ext}`;
      const check = safety.validateNameForNewPath(candidate);
      if (!check.ok) throw studioError('STUDIO_INVALID_FILE_NAME', check.message);
      const absolute = path.join(folderPath, candidate);
      if (plannedTargets.has(absolute.toLowerCase())) continue;
      if (await safety.lstatOrNull(absolute)) continue;
      return candidate;
    }
    throw studioError('STUDIO_NAME_EXHAUSTED', 'Could not build a unique destination name.');
  }

  function validationFullPath(folderPath) {
    const check = safety.validateFullPath(folderPath);
    if (!check.ok) throw studioError(check.code, check.message);
    return check.path;
  }

  async function verifySourceForOperation(op) {
    if (!safety.isInside(op.sourceRoot, op.sourceAbsolute)) throw studioError('STUDIO_SOURCE_ESCAPE', 'The source path left the indexed folder.');
    const relativeSourceFolder = path.relative(op.sourceRoot, path.dirname(op.sourceAbsolute));
    await safety.resolveWithinRoot(op.sourceRoot, relativeSourceFolder, { create: false, label: 'Source' });
    // The reparse test happens before anything opens the file. A cloud
    // placeholder looks like an ordinary file to `lstat`, and opening it makes
    // the storage provider download the content, which is a side effect the
    // user never asked for.
    const plain = await safety.assertPlainEntry(op.sourceAbsolute);
    if (!plain.ok) {
      throw studioError(plain.code || 'STUDIO_PATH_UNSAFE', `${op.name} is a link, a cloud placeholder or cannot be confirmed as a local file, so it was refused.`);
    }
    const stats = plain.record;
    if (!stats.safe || !stats.regular) throw studioError('STUDIO_SOURCE_CHANGED', `${op.name} is no longer a normal local file.`);
    if (stats.hardlinked) {
      throw studioError('STUDIO_SOURCE_CHANGED', `${op.name} has more than one directory entry, so it was refused.`);
    }
    const identity = stats.identity;
    const before = op.sourceIdentity || {};
    if (Number(stats.size) !== op.size) throw studioError('STUDIO_PLAN_STALE', `${op.name} changed size after the plan was reviewed.`);
    if (!before.fileIdentity || before.fileIdentity !== identity?.fileIdentity) throw studioError('STUDIO_PLAN_STALE', `${op.name} was replaced after the plan was reviewed.`);
    if (Math.abs(Number(identity.modifiedMs) - Number(before.modifiedMs)) > 0.001) throw studioError('STUDIO_PLAN_STALE', `${op.name} was modified after the plan was reviewed.`);
    const real = await fsp.realpath(op.sourceAbsolute);
    if (!safety.isInside(op.sourceRoot, real)) throw studioError('STUDIO_SOURCE_ESCAPE', `${op.name} resolves outside the indexed folder.`);
    return stats;
  }

  /**
   * Removes an original only when its path still describes the exact file
   * object that was copied and verified.
   *
   * The deletion is never performed on the user-visible path. Checking a path
   * and then unlinking that same path leaves a window, and Windows widens it:
   * a held file handle does not stop another process renaming or deleting the
   * path, because Node requests FILE_SHARE_DELETE. So the entry is first moved
   * to a private, unpredictable name in the same directory - which destroys
   * nothing - its identity is read back from that name, and only then unlinked.
   * If the object under the private name is not the one that was verified, it
   * is moved back and reported, so the worst case of every race in here is a
   * file that survives.
   *
   * NTFS file indices are not handed out twice, so a look-alike created by
   * another process cannot impersonate the original. A filesystem that
   * supplies no index at all (exFAT, some network shares) is never deleted
   * from, because the promise cannot be checked.
   */
  async function deleteVerifiedEntry({ absolute, identity, size, label }) {
    const current = await safety.inspectPath(absolute);
    if (!current.exists) return { removed: true, alreadyAbsent: true };
    if (!current.regular || current.symbolic || !current.safe) {
      throw studioError('STUDIO_SOURCE_REPLACED', `The entry at ${label} is no longer the file that was verified.`);
    }
    if (!current.identityAvailable || !identity?.fileIdentity) {
      throw studioError('STUDIO_SOURCE_IDENTITY_UNAVAILABLE', `${label} is on a filesystem without stable file identities, so nothing was deleted.`);
    }
    if (current.identity.fileIdentity !== identity.fileIdentity) {
      throw studioError('STUDIO_SOURCE_REPLACED', `${label} now points at a different file, so nothing was deleted.`);
    }
    if (Number.isFinite(Number(size)) && Number(current.size) !== Number(size)) {
      throw studioError('STUDIO_SOURCE_REPLACED', `${label} changed size after verification, so nothing was deleted.`);
    }
    if (current.hardlinked) {
      throw studioError('STUDIO_SOURCE_HARDLINKED', `${label} gained another directory entry, so nothing was deleted.`);
    }
    const quarantine = path.join(path.dirname(absolute), `.knoux-delete-${crypto.randomUUID()}`);
    try {
      await fsp.rename(absolute, quarantine);
    } catch (error) {
      if (error?.code === 'ENOENT') return { removed: true, alreadyAbsent: true };
      throw studioError('STUDIO_SOURCE_REMOVAL_FAILED', `${label} could not be prepared for removal (${error?.code || 'UNKNOWN'}), so it was left in place.`);
    }
    const parked = await safety.inspectPath(quarantine);
    const provablyOurs = parked.exists && parked.regular && !parked.symbolic && parked.identityAvailable &&
      parked.identity.fileIdentity === identity.fileIdentity &&
      (!Number.isFinite(Number(size)) || Number(parked.size) === Number(size)) &&
      !parked.hardlinked;
    if (!provablyOurs) {
      const restored = await fsp.rename(quarantine, absolute).then(() => true).catch(() => false);
      throw studioError(
        restored ? 'STUDIO_SOURCE_REPLACED' : 'STUDIO_SOURCE_QUARANTINED',
        restored
          ? `${label} was replaced while it was being prepared for removal, so nothing was deleted.`
          : `${label} was replaced and could not be moved back; it is preserved under its review name.`
      );
    }
    await fsp.unlink(quarantine);
    if ((await safety.inspectPath(quarantine)).exists) {
      throw studioError('STUDIO_SOURCE_REMOVAL_UNCONFIRMED', `${label} is still present after removal.`);
    }
    return { removed: true, alreadyAbsent: false };
  }

  async function execute({ owner, request, emit = () => {} }) {
    await ensureReady();
    const record = plans.get(request.planId);
    if (!record || record.owner !== owner) throw studioError('STUDIO_PLAN_NOT_FOUND', 'That plan is no longer available. Build a new plan.');
    const plan = record.plan;
    if (record.used) throw studioError('STUDIO_PLAN_USED', 'That plan was already executed. Build and review a new plan.');
    if (record.stale || plan.expiresAtMs < now()) {
      record.stale = true;
      throw studioError('STUDIO_PLAN_STALE', 'That plan expired or became stale. Build and review a new plan.');
    }
    if (request.planHash !== plan.planHash) throw studioError('STUDIO_PLAN_TAMPERED', 'The plan approval did not match the reviewed snapshot.');
    if (request.approved !== true) throw studioError('STUDIO_APPROVAL_REQUIRED', 'Explicit approval is required.');
    if (request.operation !== plan.operation) throw studioError('STUDIO_APPROVAL_MISMATCH', 'The approved operation does not match the plan.');
    if (String(request.destinationSummary || '') !== plan.destinationSummary) throw studioError('STUDIO_APPROVAL_MISMATCH', 'The approved destination does not match the plan.');
    if (!plan.executable) throw studioError('STUDIO_PLAN_HAS_COLLISIONS', 'Resolve every destination collision before executing this plan.');
    if (active.size > 0) throw studioError('STUDIO_OPERATION_ACTIVE', 'Another Studio operation is already running. Wait for it to finish or cancel it.');

    const executionId = crypto.randomUUID();
    const abort = new AbortController();
    const startedAt = iso(now());
    active.set(owner, { executionId, abort, kind: 'execute' });
    emit({ type: 'execution', operationId: executionId, planId: plan.planId, phase: 'started', at: startedAt, operation: plan.operation, totalFiles: plan.totals.files, totalBytes: plan.totals.bytes });

    try {
      for (const root of record.rootIdentities) {
        if (abort.signal.aborted) throw studioError('STUDIO_CANCELLED', 'Cancelled before mutation.');
        const current = await safety.assertSafeRoute(root.root);
        if (!root.identity?.fileIdentity || current.identity?.fileIdentity !== root.identity.fileIdentity) throw studioError('STUDIO_PLAN_STALE', 'An authorized root was replaced after review.');
      }
      for (const inventory of record.inventoryRecords) {
        if (record.getInventory(inventory.id, owner) !== inventory) throw studioError('STUDIO_PLAN_STALE', 'A source grant was revoked.');
      }
      for (const destination of record.destinationRoots) {
        const grant = record.resolveDestination(destination.id);
        const grantRoot = grant ? await safety.assertRealDirectory(grant.root, 'Destination').catch(() => null) : null;
        if (!grant || grantRoot !== destination.root || grant.identity?.fileIdentity !== record.rootIdentities.find(item => item.root === destination.root)?.identity?.fileIdentity) throw studioError('STUDIO_PLAN_STALE', 'A destination grant changed.');
      }
      if (abort.signal.aborted) throw studioError('STUDIO_CANCELLED', 'Cancelled before mutation.');
      if (plan.operation === 'virtual') {
        // A virtual grouping is recorded in the journal, never on disk. It is a
        // durable workspace collection with no move, copy or link on the source.
        const folderFor = new Map(plan.categories.map((entry) => [entry.category, entry.folderName || entry.category]));
        const entries = plan.files.map((file) => ({
          index: file.index,
          inventoryId: file.inventoryId,
          fileId: file.fileId,
          name: file.name,
          category: file.category,
          size: file.size,
          sourceRoot: file.sourceRoot,
          sourceRelative: file.sourceRelative,
          sourceAbsolute: path.resolve(file.sourceRoot, ...file.sourceRelative.split('/')),
          sourceIdentity: null,
          targetRoot: '',
          targetAbsolute: null,
          targetRelative: folderFor.get(file.category) || file.category,
          targetIdentity: null,
          verification: null,
          hash: null,
          state: 'grouped',
          startedAt: startedAt,
          completedAt: iso(now()),
          error: null,
          undo: null
        }));
        const operation = await journalFromPlan({
          executionId,
          plan,
          owner,
          status: 'completed',
          entries,
          completedFiles: entries.length,
          startedAt
        });
        record.used = true;
        const summary = operationSummary(operation);
        emit({ type: 'execution', operationId: executionId, planId: plan.planId, phase: 'completed', at: iso(now()), files: entries.length, mode: 'virtual', summary, journalId: operation.id });
        return { success: true, mode: 'virtual', journalId: operation.id, summary, files: [] };
      }

      // Stale-plan preflight is complete before any folder or file is mutated.
      for (const op of record.internalOperations) {
        if (abort.signal.aborted) throw studioError('STUDIO_CANCELLED', 'Cancelled during preflight.');
        try {
          await verifySourceForOperation(op);
        } catch (error) {
          if (String(error?.code || '').startsWith('STUDIO_PLAN_STALE')) record.stale = true;
          throw error;
        }
      }
      for (const step of plan.folderSteps) {
        if (await safety.lstatOrNull(step.path)) throw studioError('STUDIO_PLAN_STALE', `A destination folder appeared after review: ${step.relative}`);
        await safety.assertRealDirectory(path.dirname(step.path), 'Destination parent');
      }
      for (const op of record.internalOperations) {
        if (!safety.isInside(op.targetRoot, op.targetAbsolute)) throw studioError('STUDIO_DESTINATION_ESCAPE', 'A destination path left its authorized root.');
        if (await safety.lstatOrNull(op.targetAbsolute)) {
          record.stale = true;
          throw studioError('STUDIO_PLAN_STALE', `A destination file appeared after review: ${op.name}`);
        }
      }

      if (abort.signal.aborted) throw studioError('STUDIO_CANCELLED', 'Cancelled before mutation.');
      const operation = await initializeJournal({ executionId, plan, record, owner, startedAt });
      record.used = true;
      emit({ type: 'execution', operationId: executionId, planId: plan.planId, phase: 'creating-folders', at: iso(now()), journalId: operation.id });

      const createdFolders = [];
      for (const step of plan.folderSteps) {
        const existing = await safety.lstatOrNull(step.path);
        if (existing) continue;
        try {
          await fsp.mkdir(step.path);
          createdFolders.push(step.relative);
        } catch (error) {
          if (error?.code !== 'EEXIST') {
            await journal.update(operation.id, (stored) => {
              stored.status = 'failed';
              stored.errors.push(`Could not create ${step.relative}: ${error?.code || error?.message || 'unknown error'}`);
              stored.phase = 'failed';
            });
            throw studioError('STUDIO_FOLDER_CREATE_FAILED', `Could not create the destination folder ${step.relative}.`);
          }
        }
      }

      await journal.update(operation.id, (stored) => {
        stored.status = 'copying';
        stored.phase = 'copying';
        stored.foldersCreated = createdFolders;
      });

      let completedFiles = 0;
      let failedFiles = 0;
      let cancelledFiles = 0;
      let bytesDone = 0;
      let cancelled = false;

      for (const op of record.internalOperations) {
        if (abort.signal.aborted) {
          cancelled = true;
          cancelledFiles += 1;
          continue;
        }
        let entry;
        await journal.update(operation.id, (stored) => {
          entry = stored.entries.find((item) => item.index === op.index);
          if (entry) {
            entry.state = 'copying';
            entry.startedAt = iso(now());
          }
          stored.phase = 'copying';
        });
        emit({
          type: 'execution', operationId: executionId, planId: plan.planId, phase: 'progress',
          at: iso(now()), processed: completedFiles + failedFiles + cancelledFiles, total: record.internalOperations.length,
          bytes: bytesDone, totalBytes: plan.totals.bytes, currentName: op.name, operation: plan.operation
        });
        try {
          await verifySourceForOperation(op);
          const relativeTargetFolder = path.relative(op.targetRoot, path.dirname(op.targetAbsolute));
          await safety.resolveWithinRoot(op.targetRoot, relativeTargetFolder, { create: false, label: 'Destination' });
          if (await safety.lstatOrNull(op.targetAbsolute)) throw studioError('STUDIO_COLLISION', 'A destination file appeared while the plan was running.');
          const check = safety.validateFullPath(op.targetAbsolute);
          if (!check.ok) throw studioError(check.code, check.message);
          let lastChunkAt = 0;
          const bytesBeforeFile = bytesDone;
          const copy = await copyExclusive(op.sourceAbsolute, op.targetAbsolute, {
            expectedSize: op.size,
            expectedIdentity: op.sourceIdentity,
            verifyHash: op.verification === 'sha256',
            signal: abort.signal,
            onChunk: (_bytes, position) => {
              const at = Date.now();
              if (at - lastChunkAt < 140) return;
              lastChunkAt = at;
              emit({
                type: 'execution', operationId: executionId, planId: plan.planId, phase: 'progress',
                at: iso(at), processed: completedFiles + failedFiles + cancelledFiles, total: record.internalOperations.length,
                bytes: bytesBeforeFile + position, totalBytes: plan.totals.bytes, currentName: op.name, operation: plan.operation
              });
            }
          });
          bytesDone += copy.bytes;
          await journal.update(operation.id, (stored) => {
            const current = stored.entries.find((item) => item.index === op.index);
            if (current) {
              current.state = 'copied';
              current.targetIdentity = {
                size: Number(copy.destStats.size),
                modifiedMs: Number(copy.destStats.mtimeMs),
                fileIdentity: winMeta.identitySnapshot(copy.destStats).fileIdentity
              };
              current.verification = copy.verification;
              current.hash = copy.copiedHash;
            }
            stored.bytesCopied = (stored.bytesCopied || 0) + copy.bytes;
          });
          if (plan.operation === 'move') {
            try {
              const removal = await deleteVerifiedEntry({
                absolute: op.sourceAbsolute,
                identity: copy.sourceIdentity,
                size: copy.bytes,
                label: `the original of ${op.name}`
              });
              completedFiles += 1;
              await journal.update(operation.id, (stored) => {
                const current = stored.entries.find((item) => item.index === op.index);
                if (current) {
                  current.state = 'moved';
                  current.completedAt = iso(now());
                }
                if (removal.alreadyAbsent) {
                  stored.warnings.push(`${op.name}: the original path was already empty when the verified copy was made, so nothing was deleted.`);
                }
                stored.completedFiles = (stored.completedFiles || 0) + 1;
              });
            } catch (error) {
              failedFiles += 1;
              await journal.update(operation.id, (stored) => {
                const current = stored.entries.find((item) => item.index === op.index);
                if (current) {
                  current.state = 'copy-verified-source-remains';
                  current.error = `Verified destination created, but the original was preserved (${error?.code || 'UNKNOWN'}).`;
                }
                stored.failedFiles = (stored.failedFiles || 0) + 1;
                stored.warnings.push(`${op.name}: the verified copy exists and the original was preserved (${error?.code || 'UNKNOWN'}).`);
              });
            }
          } else {
            completedFiles += 1;
            await journal.update(operation.id, (stored) => {
              const current = stored.entries.find((item) => item.index === op.index);
              if (current) {
                current.state = 'copied-final';
                current.completedAt = iso(now());
              }
              stored.completedFiles = (stored.completedFiles || 0) + 1;
            });
          }
        } catch (error) {
          if (error?.code === 'STUDIO_CANCELLED' || abort.signal.aborted) {
            cancelled = true;
            cancelledFiles += 1;
            await journal.update(operation.id, (stored) => {
              const current = stored.entries.find((item) => item.index === op.index);
              if (current) { current.state = 'cancelled'; current.error = 'Cancelled before the copy completed; no source file was removed.'; }
              stored.cancelledFiles = (stored.cancelledFiles || 0) + 1;
            });
            continue;
          }
          failedFiles += 1;
          await journal.update(operation.id, (stored) => {
            const current = stored.entries.find((item) => item.index === op.index);
            if (current) { current.state = 'failed'; current.error = String(error?.message || error).slice(0, 300); }
            stored.failedFiles = (stored.failedFiles || 0) + 1;
            stored.errors.push(`${op.name}: ${String(error?.message || error).slice(0, 200)}`);
            // A partial destination we could not prove ownership of is never
            // silently discarded: say that it is still there.
            if (error?.destinationRemains) {
              stored.warnings.push(`${op.name}: an unverified partial file was left at the destination and must be inspected.`);
            }
          });
        }
        emit({
          type: 'execution', operationId: executionId, planId: plan.planId, phase: 'progress',
          at: iso(now()), processed: completedFiles + failedFiles + cancelledFiles, total: record.internalOperations.length,
          completed: completedFiles, failed: failedFiles, cancelled: cancelledFiles, bytes: bytesDone, totalBytes: plan.totals.bytes,
          currentName: null, operation: plan.operation
        });
      }

      const finalStatus = cancelled ? 'cancelled' : failedFiles > 0 || completedFiles < record.internalOperations.length ? 'partial' : 'completed';
      const finalOperation = await journal.update(operation.id, (stored) => {
        stored.status = finalStatus;
        stored.phase = 'finished';
        stored.completedFiles = completedFiles;
        stored.failedFiles = failedFiles;
        stored.cancelledFiles = cancelledFiles;
        stored.finishedAt = iso(now());
        stored.cancelRequested = abort.signal.aborted;
      });
      const summary = operationSummary(finalOperation);
      emit({
        type: 'execution', operationId: executionId, planId: plan.planId, phase: cancelled ? 'cancelled' : failedFiles ? 'partial' : 'completed',
        at: iso(now()), journalId: operation.id, summary, completed: completedFiles, failed: failedFiles,
        cancelled: cancelledFiles, bytes: bytesDone, totalBytes: plan.totals.bytes, operation: plan.operation
      });
      return {
        success: failedFiles === 0 && !cancelled,
        partial: failedFiles > 0 || cancelled,
        mode: plan.operation,
        journalId: operation.id,
        summary,
        undoAvailable: plan.operation === 'move' && completedFiles > 0
      };
    } catch (error) {
      emit({ type: 'execution', operationId: executionId, planId: plan.planId, phase: 'failed', at: iso(now()), message: String(error?.message || error).slice(0, 300) });
      throw error;
    } finally {
      active.delete(owner);
    }
  }

  async function initializeJournal({ executionId, plan, record, owner, startedAt }) {
    const operation = {
      id: executionId,
      planId: plan.planId,
      planHash: plan.planHash,
      owner,
      profileId,
      mode: plan.operation,
      status: 'running',
      phase: 'initializing',
      createdAt: startedAt,
      updatedAt: startedAt,
      finishedAt: null,
      destinationSummary: plan.destinationSummary,
      destinationRoots: record.destinationRoots,
      sourceRoots: plan.sourceRoots,
      totalFiles: record.internalOperations.length,
      totalBytes: plan.totals.bytes,
      completedFiles: 0,
      failedFiles: 0,
      skippedFiles: plan.skipped.length,
      cancelledFiles: 0,
      bytesCopied: 0,
      foldersCreated: [],
      warnings: plan.warnings.slice(),
      errors: [],
      cancelRequested: false,
      entries: record.internalOperations.map((op) => ({
        ...op,
        sourceRootIdentity: record.rootIdentities.find(item => item.root === op.sourceRoot).identity,
        targetRootIdentity: record.rootIdentities.find(item => item.root === op.targetRoot).identity,
        state: 'pending',
        targetIdentity: null,
        verification: null,
        hash: null,
        startedAt: null,
        completedAt: null,
        error: null,
        undo: null
      }))
    };
    await journal.add(operation);
    return operation;
  }

  async function journalFromPlan({ executionId, plan, owner, status, entries, completedFiles = 0, startedAt }) {
    const operation = {
      id: executionId,
      planId: plan.planId,
      planHash: plan.planHash,
      owner,
      profileId,
      mode: plan.operation,
      status,
      phase: 'finished',
      createdAt: startedAt,
      updatedAt: iso(now()),
      finishedAt: iso(now()),
      destinationSummary: plan.destinationSummary,
      destinationRoots: plan.destinationRoots,
      sourceRoots: plan.sourceRoots,
      totalFiles: plan.totals.files,
      totalBytes: plan.totals.bytes,
      completedFiles,
      failedFiles: 0,
      skippedFiles: plan.skipped.length,
      cancelledFiles: 0,
      bytesCopied: 0,
      foldersCreated: [],
      warnings: plan.warnings.slice(),
      errors: [],
      cancelRequested: false,
      entries
    };
    await journal.add(operation);
    return operation;
  }

  function operationSummary(operation) {
    return {
      id: operation.id,
      mode: operation.mode,
      status: operation.status,
      totalFiles: operation.totalFiles,
      totalBytes: operation.totalBytes,
      completedFiles: operation.completedFiles,
      failedFiles: operation.failedFiles,
      skippedFiles: operation.skippedFiles,
      cancelledFiles: operation.cancelledFiles,
      undoAvailable: operation.mode === 'move' && operation.entries.some((entry) => ['moved', 'delete-intent'].includes(entry.state) && !['restored', 'restored-destination-remains', 'interrupted'].includes(entry.undo?.state))
    };
  }

  function cancel({ owner, operationId }) {
    const activeOperation = active.get(owner);
    if (!activeOperation || activeOperation.executionId !== operationId) return false;
    activeOperation.abort.abort();
    return true;
  }

  async function history() {
    await ensureReady();
    return (await journal.list()).filter(operation => !operation.profileId || operation.profileId === profileId).map(publicEntryFor);
  }

  async function verifyUndoCandidate(operation, entry) {
    const result = { eligible: false, reason: null, restoreName: entry.name, conflict: false };
    if (operation.mode !== 'move') return { ...result, reason: 'Only move operations can be undone.' };
    if (!['moved', 'delete-intent'].includes(entry.state)) return { ...result, reason: 'This file was not recorded as a verified move.' };
    if (entry.undo?.state === 'restored' || entry.undo?.state === 'restored-destination-remains') return { ...result, reason: 'This file was already restored.' };
    if (entry.undo?.state === 'interrupted') return { ...result, reason: 'An interrupted restore requires manual inspection of both recorded paths.' };
    if (!safety.isInside(entry.sourceRoot, entry.sourceAbsolute) || !safety.isInside(entry.targetRoot, entry.targetAbsolute)) return { ...result, reason: 'A journal path is outside its recorded root.' };
    try {
      const sourceRoot = await safety.assertSafeRoute(entry.sourceRoot);
      const targetRoot = await safety.assertSafeRoute(entry.targetRoot);
      if (!entry.sourceRootIdentity || !entry.targetRootIdentity || sourceRoot.identity?.fileIdentity !== entry.sourceRootIdentity.fileIdentity || targetRoot.identity?.fileIdentity !== entry.targetRootIdentity.fileIdentity) return { ...result, reason: 'A recorded root identity is missing or changed.' };
      await safety.assertSafeRoute(path.dirname(entry.sourceAbsolute));
      const target = await safety.assertSafeRoute(entry.targetAbsolute);
      if (!target.regular || !entry.targetIdentity?.fileIdentity || target.identity?.fileIdentity !== entry.targetIdentity.fileIdentity || target.size !== entry.size || Math.abs(target.modifiedMs - entry.targetIdentity.modifiedMs) > 0.001) return { ...result, reason: 'The moved destination was replaced or modified.' };
      if (entry.verification !== 'sha256' || !entry.hash) return { ...result, reason: 'There is no full content-verification record.' };
      const occupied = await safety.lstatOrNull(entry.sourceAbsolute);
      if (entry.state === 'delete-intent' && occupied) return { ...result, reason: 'The interrupted deletion is ambiguous; the original path is occupied.' };
      if (occupied) return { ...result, eligible: true, conflict: true, reason: 'A file now occupies the original path.', restoreName: await safety.uniqueChildName(path.dirname(entry.sourceAbsolute), entry.name) };
      return { ...result, eligible: true };
    } catch { return { ...result, reason: 'A recorded route is unavailable, linked or requires cloud recall.' }; }
  }

  async function undoPreview({ journalId, owner, authorizeRoot }) {
    await ensureReady();
    const operation = await journal.get(journalId);
    if (!operation || (operation.profileId && operation.profileId !== profileId)) throw studioError('STUDIO_JOURNAL_NOT_FOUND', 'That operation is not in the current profile journal.');
    const requiredRoots = [];
    for (const entry of operation.entries) {
      if (!['moved', 'delete-intent'].includes(entry.state)) continue;
      for (const [kind, root, identity] of [['source', entry.sourceRoot, entry.sourceRootIdentity], ['destination', entry.targetRoot, entry.targetRootIdentity]]) {
        const grant = authorizeRoot?.(root, kind);
        if (!grant || grant.identity?.fileIdentity !== identity?.fileIdentity) {
          if (!requiredRoots.some(item => item.root === root && item.kind === kind)) requiredRoots.push({ kind, root });
        }
      }
    }
    const entries = [];
    for (const entry of operation.entries) {
      const check = requiredRoots.length ? { eligible: false, conflict: false, reason: 'Authorize the recorded roots with native pickers before undo.', restoreName: entry.name } : await verifyUndoCandidate(operation, entry);
      entries.push({ index: entry.index, name: entry.name, category: entry.category, sourceRelative: entry.sourceRelative, size: entry.size, state: entry.state, undoState: entry.undo?.state || null, ...check });
    }
    const eligible = entries.filter(entry => entry.eligible);
    const preview = { previewId: crypto.randomUUID(), journalId, mode: operation.mode, status: operation.status, createdAt: operation.createdAt, expiresAtMs: now() + PLAN_TTL_MS, total: entries.length, eligible: eligible.length, conflicts: eligible.filter(entry => entry.conflict).length, bytes: eligible.reduce((sum, entry) => sum + entry.size, 0), requiredRoots, entries };
    const previewHash = stableHash(preview);
    for (const [id, record] of undoPlans) if (record.owner === owner || record.preview.expiresAtMs < now()) undoPlans.delete(id);
    undoPlans.set(preview.previewId, { owner, preview: deepFreeze({ ...preview, previewHash }), operationVersion: operation.updatedAt });
    return jsonClone({ ...preview, previewHash });
  }

  async function undoApply({ journalId, previewId, previewHash, resolution, owner, authorizeRoot, emit = () => {} }) {
    await ensureReady();
    if (active.size > 0) throw studioError('STUDIO_OPERATION_ACTIVE', 'Another Studio operation is still running.');
    const undoId = crypto.randomUUID();
    const abort = new AbortController();
    active.set(owner, { executionId: undoId, abort, kind: 'undo' });
    let restored = 0;
    let skipped = 0;
    let failed = 0;
    try {
      const snapshot = undoPlans.get(previewId);
      if (!snapshot || snapshot.owner !== owner || snapshot.preview.journalId !== journalId || snapshot.preview.previewHash !== previewHash || snapshot.preview.expiresAtMs < now()) throw studioError('STUDIO_UNDO_STALE', 'The undo approval is stale or does not match its preview.');
      const preview = snapshot.preview;
      const operation = await journal.get(journalId);
      if (!operation || operation.profileId !== profileId || operation.updatedAt !== snapshot.operationVersion) throw studioError('STUDIO_UNDO_STALE', 'The operation journal changed after undo review.');
      if (operation.mode !== 'move') throw studioError('STUDIO_UNDO_UNSUPPORTED', 'Only move operations can be undone.');
      if (!preview.eligible || preview.requiredRoots.length) throw studioError('STUDIO_UNDO_EMPTY', 'No authorized verified move remains to undo.');
      if (!['skip', 'rename'].includes(resolution)) throw studioError('STUDIO_UNDO_RESOLUTION', 'Choose a conflict resolution.');
      for (const candidate of preview.entries.filter(entry => entry.eligible)) {
        const entry = operation.entries.find(item => item.index === candidate.index);
        for (const [kind, root, identity] of [['source', entry.sourceRoot, entry.sourceRootIdentity], ['destination', entry.targetRoot, entry.targetRootIdentity]]) {
          const grant = authorizeRoot?.(root, kind);
          if (!grant || grant.identity?.fileIdentity !== identity?.fileIdentity) throw studioError('STUDIO_UNDO_STALE', 'An undo root grant is missing or changed.');
        }
        const check = await verifyUndoCandidate(operation, entry);
        if (!check.eligible || check.conflict !== candidate.conflict || check.restoreName !== candidate.restoreName) throw studioError('STUDIO_UNDO_STALE', 'An undo path changed after review. Preview again.');
        if (abort.signal.aborted) throw studioError('STUDIO_CANCELLED', 'Undo cancelled before mutation.');
      }
      undoPlans.delete(previewId);
      emit({ type: 'undo', operationId: undoId, journalId, phase: 'started', at: iso(now()), totalFiles: preview.eligible });
      await journal.update(journalId, (stored) => {
        stored.undoStatus = 'running';
        stored.undoId = undoId;
        stored.undoStartedAt = iso(now());
        stored.status = stored.status === 'completed' ? 'completed' : stored.status;
      });
      for (const entry of operation.entries) {
        if (abort.signal.aborted) break;
        const current = (await journal.get(journalId)).entries.find((item) => item.index === entry.index);
        const candidate = preview.entries.find(item => item.index === entry.index && item.eligible);
        if (!current || !candidate) continue;
        const check = await verifyUndoCandidate(operation, current);
        if (!check.eligible) {
          skipped += 1;
          await journal.update(journalId, (stored) => {
            const item = stored.entries.find((row) => row.index === entry.index);
            item.undo = { state: 'skipped', at: iso(now()), error: check.reason };
          });
          continue;
        }
        if (check.conflict && resolution === 'skip') {
          skipped += 1;
          await journal.update(journalId, (stored) => {
            const item = stored.entries.find((row) => row.index === entry.index);
            item.undo = { state: 'skipped', at: iso(now()), error: 'The original path is occupied.' };
          });
          continue;
        }
        const parent = path.dirname(current.sourceAbsolute);
        let restorePath = current.sourceAbsolute;
        let restoreName = current.name;
        if (check.conflict) {
          if (resolution !== 'rename') {
            skipped += 1;
            await journal.update(journalId, (stored) => {
              const item = stored.entries.find((row) => row.index === entry.index);
              item.undo = { state: 'skipped', at: iso(now()), error: 'The original path is occupied.' };
            });
            continue;
          }
          restoreName = candidate.restoreName;
          restorePath = path.join(parent, restoreName);
        }
        await journal.update(journalId, (stored) => {
          const item = stored.entries.find((row) => row.index === entry.index);
          item.undo = { state: 'undoing', at: iso(now()), restorePath, restoredName: restoreName };
        });
        emit({ type: 'undo', operationId: undoId, journalId, phase: 'progress', at: iso(now()), processed: restored + skipped + failed, total: preview.eligible, currentName: current.name });
        try {
          if (await safety.lstatOrNull(restorePath)) throw studioError('STUDIO_COLLISION', 'The original path became occupied during undo.');
          const copy = await copyExclusive(current.targetAbsolute, restorePath, {
            expectedSize: current.size,
            expectedIdentity: current.targetIdentity || null,
            verifyHash: current.verification === 'sha256',
            signal: abort.signal
          });
          try {
            await deleteVerifiedEntry({
              absolute: current.targetAbsolute,
              identity: copy.sourceIdentity,
              size: copy.bytes,
              label: `the moved copy of ${current.name}`
            });
            restored += 1;
            await journal.update(journalId, (stored) => {
              const item = stored.entries.find((row) => row.index === entry.index);
              item.undo = { state: 'restored', at: iso(now()), restoredName: restoreName, verification: copy.verification };
            });
            emit({ type: 'undo', operationId: undoId, journalId, phase: 'progress', at: iso(now()), processed: restored + skipped + failed, total: preview.eligible, restoredName: restoreName });
          } catch (error) {
            failed += 1;
            await journal.update(journalId, (stored) => {
              const item = stored.entries.find((row) => row.index === entry.index);
              item.undo = { state: 'restored-destination-remains', at: iso(now()), restoredName: restoreName, error: `The original was restored and verified, but the moved copy could not be removed (${error?.code || 'UNKNOWN'}).` };
            });
          }
        } catch (error) {
          failed += 1;
          await journal.update(journalId, (stored) => {
            const item = stored.entries.find((row) => row.index === entry.index);
            item.undo = { state: 'failed', at: iso(now()), error: String(error?.message || error).slice(0, 300) };
          });
        }
      }
      const finalOperation = await journal.update(journalId, (stored) => {
        stored.undoStatus = 'finished';
        stored.undoFinishedAt = iso(now());
        stored.undoSummary = { restored, skipped, failed };
      });
      emit({
        type: 'undo', operationId: undoId, journalId, phase: failed ? 'partial' : 'completed', at: iso(now()),
        restored, skipped, failed, summary: finalOperation.undoSummary
      });
      return { success: failed === 0, partial: failed > 0 || skipped > 0, restored, skipped, failed, journalId };
    } finally {
      active.delete(owner);
    }
  }

  function invalidateInventory(inventoryId) {
    for (const record of plans.values()) {
      if (record.inventoryRecords.some(inventory => inventory.id === inventoryId)) {
        record.stale = true;
        active.get(record.owner)?.abort.abort();
      }
    }
  }

  function revokeOwner(owner) {
    active.get(owner)?.abort.abort();
    for (const [id, record] of plans) if (record.owner === owner) plans.delete(id);
    for (const [id, record] of undoPlans) if (record.owner === owner) undoPlans.delete(id);
  }

  function dispose() {
    for (const item of active.values()) item.abort.abort();
    plans.clear();
    undoPlans.clear();
  }

  return {
    ready: ensureReady,
    buildPlan,
    execute,
    cancel,
    history,
    undoPreview,
    undoApply,
    invalidateInventory,
    revokeOwner,
    dispose,
    active: (owner) => active.get(owner) || null,
    isBusy: () => active.size > 0,
    journalPath: storagePath
  };
}

module.exports = {
  createOrganizationEngine,
  MAX_PLAN_FILES,
  PLAN_TTL_MS,
  HASH_VERIFY_LIMIT,
  copyExclusive,
  deepFreeze,
  hashFile
};
