'use strict';

/**
 * KNOuX Gemini — read-only Files adapter.
 *
 * Reuses the Studio inventory, persisted source grants and Windows metadata
 * service rather than scanning in the renderer or spawning arbitrary commands.
 * It exposes measured metadata, bounded thumbnails, SHA-256/512 of an indexed
 * file, empty-folder discovery, and validated open/reveal requests.
 *
 * No copy, move, delete, overwrite, rename or permission change is exposed.
 */

const fsp = require('node:fs/promises');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { STUDIO_DIR } = require('./studio-bridge.cjs');
// Resolve the reused root engines through the same packaged/dev root as the
// Studio adapter (resources/native/studio in a packaged build).
const safety = require(path.join(STUDIO_DIR, 'studio-safety.cjs'));
const fsMeta = require(path.join(STUDIO_DIR, '..', 'windows-fs-metadata.cjs'));

const MAX_HASH_BYTES = 512 * 1024 * 1024;
const MAX_EMPTY_FOLDERS = 500;
const MAX_EMPTY_WALK_DIRS = 5000;
const EMPTY_WALK_BUDGET_MS = 12000;
const AGE_BUCKETS = [
  { key: 'day', label: 'Last 24 hours', maxDays: 1 },
  { key: 'week', label: 'Last 7 days', maxDays: 7 },
  { key: 'month', label: 'Last 30 days', maxDays: 30 },
  { key: 'year', label: 'Last year', maxDays: 365 },
  { key: 'older', label: 'Older / unknown', maxDays: Infinity },
];

function filesError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function safeId(value) {
  return typeof value === 'string' && /^[a-f0-9-]{8,64}$/i.test(value) ? value : null;
}

function safeFileId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id >= 0 ? id : null;
}

function formatAgeBucket(modifiedMs, now) {
  if (!modifiedMs) return 'older';
  const days = Math.max(0, now - modifiedMs) / 86_400_000;
  for (const bucket of AGE_BUCKETS) {
    if (days <= bucket.maxDays) return bucket.key;
  }
  return 'older';
}

function relativeFolder(file) {
  const folder = path.posix.dirname(String(file.relative || ''));
  return folder === '.' ? '' : folder;
}

function plainFile(file) {
  return {
    id: file.id,
    name: file.name,
    relative: file.relative,
    parentFolder: relativeFolder(file),
    category: file.category,
    size: file.size,
    ext: file.ext,
    modifiedAt: file.modifiedAt,
    modifiedMs: file.modifiedMs,
    readonly: Boolean(file.readonly),
    hidden: Boolean(file.hidden),
  };
}

class FilesBridge {
  constructor({ studio, shell, emit = () => {} }) {
    if (!studio) throw new Error('FilesBridge requires the Studio inventory adapter.');
    this.studio = studio;
    this.shell = shell || null;
    this.emit = emit;
    this.reparse = fsMeta.createReparseTagReader({ maxQueries: 64 });
  }

  listSources() { return this.studio.listSources(); }

  chooseSource() { return this.studio.chooseSource(); }

  scanSource(sourceId) { return this.studio.scanSource(sourceId); }

  cancelScan(sourceId) { return this.studio.cancelScan(sourceId); }

  requireSource(sourceId) {
    const id = safeId(sourceId);
    if (!id) throw filesError('FILES_SOURCE_INVALID', 'Choose an authorized source folder first.');
    const source = this.studio.getSource(id);
    const record = this.studio.getInventory(id);
    if (!source) throw filesError('FILES_SOURCE_NOT_FOUND', 'The source grant no longer exists.');
    if (!record) throw filesError('FILES_INDEX_UNAVAILABLE', 'The source has not been indexed yet.');
    return { id, source, record };
  }

  requireFile(sourceId, fileId) {
    const { id, source, record } = this.requireSource(sourceId);
    const numericId = safeFileId(fileId);
    if (numericId === null) throw filesError('FILES_FILE_INVALID', 'Choose an indexed file first.');
    const file = record.files.find((entry) => entry.id === numericId);
    if (!file) throw filesError('FILES_FILE_NOT_FOUND', 'The indexed file no longer exists.');
    return { sourceId: id, source, record, file, fullPath: path.resolve(record.root, ...String(file.relative).split('/')) };
  }

  async inspectPlainPath(fullPath) {
    const plain = await safety.assertPlainEntry(fullPath);
    if (!plain.ok) {
      throw filesError(plain.code || 'FILES_PATH_UNSAFE', 'The file is a link, cloud placeholder or unsafe path and was not opened.');
    }
    return plain.record;
  }

  async verifyUnchanged(candidate, file) {
    if (!candidate?.regular) throw filesError('FILES_NOT_A_FILE', 'The indexed entry is no longer a regular file.');
    if (Number(candidate.size) !== Number(file.size)) throw filesError('FILES_FILE_CHANGED', 'The file changed since it was indexed.');
    if (Number(candidate.modifiedMs) !== Number(file.modifiedMs)) throw filesError('FILES_FILE_CHANGED', 'The file changed since it was indexed.');
    if (file.identity?.fileIdentity && candidate.identity?.fileIdentity && file.identity.fileIdentity !== candidate.identity.fileIdentity) {
      throw filesError('FILES_FILE_CHANGED', 'The file identity changed since it was indexed.');
    }
    return candidate;
  }

  async query(sourceId, request = {}) {
    this.requireSource(sourceId);
    if (String(request.categories || request.category || '').toLowerCase() === 'folders') {
      return {
        sourceId,
        total: 0,
        bytes: 0,
        offset: 0,
        limit: 0,
        rows: [],
        partial: false,
        warnings: ['Folder rows are not indexed by the read-only file inventory.'],
        unsupported: 'folders',
      };
    }
    return this.studio.query({ ...request, sourceId });
  }

  async thumbnails(sourceId, fileIds) {
    this.requireSource(sourceId);
    return this.studio.thumbnails(sourceId, fileIds);
  }

  async overview(sourceId) {
    const { source, record } = this.requireSource(sourceId);
    const files = record.files;
    const now = Date.now();
    const ages = new Map(AGE_BUCKETS.map((bucket) => [bucket.key, { key: bucket.key, label: bucket.label, count: 0, bytes: 0 }]));
    const extensions = new Map();
    let totalBytes = 0;

    for (const file of files) {
      const size = Number(file.size) || 0;
      totalBytes += size;
      const age = formatAgeBucket(Number(file.modifiedMs) || 0, now);
      const ageStat = ages.get(age);
      if (ageStat) {
        ageStat.count += 1;
        ageStat.bytes += size;
      }
      const ext = String(file.ext || '').toLowerCase() || '(none)';
      const extStat = extensions.get(ext) || { ext, count: 0, bytes: 0 };
      extStat.count += 1;
      extStat.bytes += size;
      extensions.set(ext, extStat);
    }

    const publicSource = this.studio.publicSource(source);
    const recent = [...files].sort((a, b) => b.modifiedMs - a.modifiedMs).slice(0, 20).map(plainFile);
    const largest = [...files].sort((a, b) => b.size - a.size).slice(0, 20).map(plainFile);
    const extensionRows = [...extensions.values()]
      .sort((a, b) => b.bytes - a.bytes || b.count - a.count || a.ext.localeCompare(b.ext))
      .slice(0, 16);

    return {
      source: publicSource,
      totals: {
        files: files.length,
        bytes: totalBytes,
        folders: publicSource.folderCount,
        categories: publicSource.categories.length,
        partial: publicSource.partial,
      },
      categories: publicSource.categories,
      extensions: extensionRows,
      ages: [...ages.values()],
      recent,
      largest,
      scannedAt: publicSource.lastScanned,
      warnings: publicSource.warnings,
      coverage: publicSource.partial ? 'partial' : 'complete',
      permission: 'read-only',
    };
  }

  async metadata(sourceId, fileId) {
    const { source, record, file, fullPath } = this.requireFile(sourceId, fileId);
    const relativeDir = path.posix.dirname(String(file.relative || ''));
    await safety.resolveWithinRoot(record.root, relativeDir === '.' ? '' : relativeDir, { create: false, label: 'Source' });
    const plain = await this.inspectPlainPath(fullPath);
    await this.verifyUnchanged(plain, file);
    let birthtimeMs = 0;
    try { birthtimeMs = (await fsp.lstat(fullPath)).birthtimeMs; } catch {}

    let zone = { zoneId: null, zoneAvailable: false, referrer: null, host: null };
    try {
      const handle = await fsp.open(`${fullPath}:Zone.Identifier`, 'r');
      try {
        const buffer = Buffer.alloc(8192);
        const { bytesRead } = await handle.read(buffer, 0, buffer.length, 0);
        const text = buffer.subarray(0, bytesRead).toString('utf8');
        const value = (key) => {
          const match = text.match(new RegExp(`^${key}=(.*)$`, 'm'));
          return match ? match[1].trim() : null;
        };
        const rawZone = value('ZoneId');
        zone = {
          zoneId: rawZone && /^[0-9]+$/.test(rawZone) ? Number(rawZone) : null,
          zoneAvailable: Boolean(rawZone),
          referrer: value('ReferrerUrl'),
          host: value('HostUrl'),
        };
      } finally {
        await handle.close();
      }
    } catch {
      // A missing Zone.Identifier is a normal state for locally created files.
    }

    return {
      sourceId,
      sourceLabel: source.label || path.basename(record.root),
      fileId: file.id,
      name: file.name,
      relative: file.relative,
      parentFolder: relativeFolder(file),
      fullPath,
      size: Number(plain.size) || 0,
      ext: file.ext || '',
      category: file.category,
      modifiedAt: new Date(Number(plain.modifiedMs) || 0).toISOString(),
      createdAt: birthtimeMs ? new Date(Number(birthtimeMs)).toISOString() : null,
      entryKind: plain.regular ? 'file' : 'other',
      linkCount: plain.linkCount,
      hardlinked: Boolean(plain.hardlinked),
      fileIdentity: plain.identity?.fileIdentity || null,
      volumeSerial: plain.volumeSerial || null,
      readonly: Boolean(file.readonly),
      hidden: Boolean(file.hidden),
      attributesAvailable: Boolean(plain.attributesAvailable),
      attributes: plain.attributes ?? null,
      zone,
      reparse: plain.reparse || null,
      permission: 'read-only',
      warnings: [
        ...(plain.attributesAvailable ? [] : ['Windows file attributes are not exposed by the current native metadata provider.']),
      ],
    };
  }

  async hash(sourceId, fileId, algorithmInput = 'sha256') {
    const { record, file, fullPath } = this.requireFile(sourceId, fileId);
    const algorithm = algorithmInput === 'sha512' ? 'sha512' : 'sha256';
    const relativeDir = path.posix.dirname(String(file.relative || ''));
    await safety.resolveWithinRoot(record.root, relativeDir === '.' ? '' : relativeDir, { create: false, label: 'Source' });
    const plain = await this.inspectPlainPath(fullPath);
    await this.verifyUnchanged(plain, file);
    if (Number(file.size) > MAX_HASH_BYTES) {
      throw filesError('FILES_HASH_TOO_LARGE', 'Hash is limited to 512 MB per file in this read-only build.');
    }

    let handle;
    try {
      handle = await fsp.open(fullPath, 'r');
      const before = await handle.stat({ bigint: true });
      if (Number(before.size) !== Number(file.size) || Math.abs(Number(before.mtimeMs) - Number(file.modifiedMs)) > 1) {
        throw filesError('FILES_FILE_CHANGED', 'The file changed before it could be hashed.');
      }
      const digest = crypto.createHash(algorithm);
      const stream = handle.createReadStream({ autoClose: false });
      let bytesRead = 0;
      for await (const chunk of stream) {
        bytesRead += chunk.length;
        digest.update(chunk);
        if (bytesRead > MAX_HASH_BYTES) {
          throw filesError('FILES_HASH_TOO_LARGE', 'Hash is limited to 512 MB per file in this read-only build.');
        }
      }
      const after = await handle.stat({ bigint: true });
      const changedDuringRead =
        Number(after.size) !== Number(before.size) ||
        Number(after.mtimeMs) !== Number(before.mtimeMs) ||
        (before.ino && after.ino && before.ino !== after.ino);
      return {
        sourceId,
        fileId: file.id,
        name: file.name,
        algorithm,
        digest: digest.digest('hex'),
        bytesRead,
        sizeAtRead: Number(before.size),
        fileIdentity: fsMeta.identitySnapshot(before).fileIdentity,
        changedDuringRead,
        digestReliable: !changedDuringRead,
        warnings: changedDuringRead
          ? ['The file changed while it was hashed; the digest may not describe one consistent version.']
          : [],
        permission: 'read-only',
      };
    } finally {
      await handle?.close().catch(() => {});
    }
  }

  async emptyFolders(sourceId, limitInput = 200) {
    const { record } = this.requireSource(sourceId);
    const limit = Math.min(MAX_EMPTY_FOLDERS, Math.max(1, Number(limitInput) || 200));
    const startedAt = Date.now();
    const queue = [{ absolute: record.root, relative: '' }];
    const items = [];
    const warnings = [];
    let scannedDirs = 0;
    let skippedLinks = 0;
    let errors = 0;

    while (queue.length && scannedDirs < MAX_EMPTY_WALK_DIRS && Date.now() - startedAt < EMPTY_WALK_BUDGET_MS) {
      const current = queue.shift();
      let entries;
      try {
        entries = await fsp.readdir(current.absolute, { withFileTypes: true });
      } catch {
        errors += 1;
        continue;
      }
      scannedDirs += 1;
      if (!entries.length && current.relative) {
        items.push({ relative: current.relative, fullPath: current.absolute });
        if (items.length >= limit) break;
        continue;
      }
      for (const entry of entries) {
        if (entry.isSymbolicLink()) {
          skippedLinks += 1;
          continue;
        }
        if (!entry.isDirectory()) continue;
        const absolute = path.join(current.absolute, entry.name);
        let stats;
        try {
          stats = await fsp.lstat(absolute);
        } catch {
          errors += 1;
          continue;
        }
        if (stats.isSymbolicLink()) {
          skippedLinks += 1;
          continue;
        }
        if (!stats.isDirectory()) continue;
        queue.push({ absolute, relative: current.relative ? `${current.relative}/${entry.name}` : entry.name });
      }
    }

    const partial = queue.length > 0 || scannedDirs >= MAX_EMPTY_WALK_DIRS || Date.now() - startedAt >= EMPTY_WALK_BUDGET_MS;
    if (partial) warnings.push('Empty-folder discovery hit its bounded traversal limit; results are partial.');
    if (skippedLinks) warnings.push(`${skippedLinks} link/reparse entr${skippedLinks === 1 ? 'y was' : 'ies were'} skipped.`);
    if (errors) warnings.push(`${errors} folder(s) could not be read and were neither counted nor traversed.`);

    return {
      items,
      summary: {
        root: record.root,
        foldersScanned: scannedDirs,
        emptyFolders: items.length,
        skippedLinks,
        errors,
        limit,
        elapsedMs: Date.now() - startedAt,
      },
      partial,
      warnings,
      permission: 'read-only',
      mutation: 'none',
    };
  }

  async open(sourceId, fileId) {
    if (!this.shell?.openPath) throw filesError('FILES_SHELL_UNAVAILABLE', 'The Windows shell is unavailable.');
    const { record, file, fullPath } = this.requireFile(sourceId, fileId);
    const relativeDir = path.posix.dirname(String(file.relative || ''));
    await safety.resolveWithinRoot(record.root, relativeDir === '.' ? '' : relativeDir, { create: false, label: 'Source' });
    const plain = await this.inspectPlainPath(fullPath);
    await this.verifyUnchanged(plain, file);
    const error = await this.shell.openPath(fullPath);
    if (error) throw filesError('FILES_OPEN_FAILED', String(error).replace(/\s+/g, ' ').slice(0, 200));
    return { opened: true, fileId: file.id, requestedPath: fullPath };
  }

  async reveal(sourceId, fileId) {
    if (!this.shell?.showItemInFolder) throw filesError('FILES_SHELL_UNAVAILABLE', 'The Windows shell is unavailable.');
    const { record, file, fullPath } = this.requireFile(sourceId, fileId);
    const relativeDir = path.posix.dirname(String(file.relative || ''));
    await safety.resolveWithinRoot(record.root, relativeDir === '.' ? '' : relativeDir, { create: false, label: 'Source' });
    const plain = await this.inspectPlainPath(fullPath);
    await this.verifyUnchanged(plain, file);
    this.shell.showItemInFolder(fullPath);
    return { requested: true, fileId: file.id, requestedPath: fullPath };
  }

  dispose() {
    try { this.reparse.clear?.(); } catch {}
  }
}

module.exports = { FilesBridge, MAX_HASH_BYTES };
