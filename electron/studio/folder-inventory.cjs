'use strict';
/**
 * KNOuX Studio read-only library scanner.
 *
 * The walker never opens a file for reading and never mutates the filesystem.
 * It uses directory entries plus lstat only, skips every link/reparse entry, and
 * labels truncated, cancelled and permission-limited results as partial.
 */
const fs = require('node:fs/promises');
const path = require('node:path');
const safety = require('./studio-safety.cjs');
const CAT = require('./folder-categories.cjs');

const KEYS = CAT.CATEGORY_ORDER;
const DEFAULT_LIMITS = Object.freeze({ maxFiles: 200000, maxDepth: 64, progressIntervalMs: 180 });

function categoryFor(name) {
  return CAT.categoryForFileName(name);
}

function inside(root, candidate) {
  const rel = path.relative(path.resolve(root), path.resolve(candidate));
  return rel === '' || (rel !== '..' && !rel.startsWith(`..${path.sep}`) && !path.isAbsolute(rel));
}

async function validateSource(folder) {
  if (typeof folder !== 'string' || !folder || folder.length > 32767 || folder.includes('\0') || !path.isAbsolute(folder)) {
    throw new Error('Invalid source folder');
  }
  const root = path.resolve(folder);
  if (root === path.parse(root).root) throw new Error('Select a directory below the drive root');
  return safety.assertRealDirectory(root, 'Source');
}

function extensionOf(name) {
  return CAT.extensionOf(name);
}

function toPosixRelative(relative) {
  return String(relative).split(path.sep).join('/');
}

async function scanFolder(folder, options = {}) {
  const {
    signal,
    onProgress = () => {},
    maxFiles = DEFAULT_LIMITS.maxFiles,
    maxDepth = DEFAULT_LIMITS.maxDepth,
    exclusions = []
  } = options;

  const root = await validateSource(folder);
  const rootIdentity = (await safety.inspectPath(root)).identity;
  const queue = [{ absolute: root, depth: 0 }];
  const files = [];
  const categoryAcc = CAT.createCategoryAccumulator();
  const extensionAcc = new Map();
  const counts = { folders: 0, links: 0, errors: 0, depthSkipped: 0, excluded: 0 };
  const warnings = [];
  let totalBytes = 0;
  let truncated = false;
  let cancelled = false;
  let ticks = 0;
  let lastProgress = 0;
  let oldestMtimeMs = null;
  let newestMtimeMs = null;

  const isExcluded = (absolute) => exclusions.some((pattern) => {
    if (typeof pattern !== 'string' || !pattern.trim()) return false;
    if (path.isAbsolute(pattern)) return inside(path.resolve(pattern), absolute);
    return path.basename(absolute).toLowerCase() === pattern.trim().toLowerCase();
  });

  const progress = (force = false) => {
    const now = Date.now();
    if (force || now - lastProgress > DEFAULT_LIMITS.progressIntervalMs) {
      lastProgress = now;
      onProgress({ files: files.length, bytes: totalBytes, folders: counts.folders });
    }
  };

  outer: while (queue.length) {
    if (signal?.aborted) { cancelled = true; break; }
    const frame = queue.pop();
    let entries;
    try {
      await safety.assertSafeRoute(frame.absolute);
      entries = await fs.readdir(frame.absolute, { withFileTypes: true });
    } catch (error) {
      counts.errors += 1;
      if (warnings.length < 20) warnings.push(`Folder inaccessible: ${path.basename(frame.absolute)} ${error?.code || ''}`.trim());
      continue;
    }
    counts.folders += 1;
    const metadata = new Map();
    for (let offset = 0; offset < entries.length; offset += 256) {
      if (signal?.aborted) { cancelled = true; break outer; }
      const batch = entries.slice(offset, offset + 256).map(entry => path.join(frame.absolute, entry.name));
      const records = await safety.inspectPaths(batch);
      for (let i = 0; i < batch.length; i += 1) metadata.set(batch[i], records[i]);
    }

    for (const entry of entries) {
      if (signal?.aborted) { cancelled = true; break outer; }
      ticks += 1;
      if (ticks % 120 === 0) await new Promise((resolve) => setImmediate(resolve));

      const absolute = path.join(frame.absolute, entry.name);
      if (isExcluded(absolute)) { counts.excluded += 1; continue; }
      if (entry.isSymbolicLink()) { counts.links += 1; continue; }

      const stat = metadata.get(absolute);
      if (!stat?.safe) { counts.errors += 1; continue; }
      if (stat.directory) {
        if (frame.depth >= maxDepth) {
          counts.depthSkipped += 1;
        } else {
          queue.push({ absolute, depth: frame.depth + 1 });
        }
        continue;
      }
      if (!stat.regular) continue;
      if (files.length >= maxFiles) { truncated = true; break outer; }

      const name = entry.name;
      const ext = extensionOf(name);
      const category = CAT.categoryForFileName(name);
      const size = Number(stat.size) || 0;
      const modifiedMs = Number(stat.modifiedMs) || 0;
      const relative = toPosixRelative(path.relative(root, absolute));

      files.push({
        id: files.length,
        name,
        relative,
        category,
        size,
        ext,
        modifiedAt: new Date(modifiedMs || 0).toISOString(),
        modifiedMs,
        readonly: Boolean(stat.attributes & 1),
        hidden: Boolean(stat.attributes & 2) || name.startsWith('.'),
        identity: stat.identity
      });

      const categoryStat = categoryAcc.get(category) || { category, files: 0, bytes: 0 };
      categoryStat.files += 1;
      categoryStat.bytes += size;
      categoryAcc.set(category, categoryStat);

      const extensionKey = ext || '';
      const extensionStat = extensionAcc.get(extensionKey) || { ext: extensionKey, files: 0, bytes: 0 };
      extensionStat.files += 1;
      extensionStat.bytes += size;
      extensionAcc.set(extensionKey, extensionStat);

      totalBytes += size;
      if (modifiedMs && (oldestMtimeMs === null || modifiedMs < oldestMtimeMs)) oldestMtimeMs = modifiedMs;
      if (modifiedMs && (newestMtimeMs === null || modifiedMs > newestMtimeMs)) newestMtimeMs = modifiedMs;
      progress();
    }
    if (truncated) break;
  }

  if (signal?.aborted) cancelled = true;
  const partial = cancelled || truncated || counts.depthSkipped > 0 || counts.errors > 0;
  if (cancelled) warnings.push('Scan cancelled');
  if (truncated) warnings.push('File limit reached; results are partial');
  if (counts.depthSkipped) warnings.push('Depth limit reached');
  if (counts.links) warnings.push(`Links and reparse entries skipped: ${counts.links}`);
  if (counts.errors) warnings.push(`Some entries could not be read: ${counts.errors}`);
  progress(true);

  const categories = CAT.finalizeCategories(categoryAcc).map((stat) => ({ key: stat.category, count: stat.files, bytes: stat.bytes }));
  const extensions = Array.from(extensionAcc.values())
    .sort((a, b) => b.bytes - a.bytes || b.files - a.files || a.ext.localeCompare(b.ext))
    .slice(0, 64)
    .map((stat) => ({ ext: stat.ext, count: stat.files, bytes: stat.bytes }));

  return {
    root,
    rootIdentity,
    files,
    summary: {
      totalFiles: files.length,
      totalBytes,
      categories,
      extensions,
      counts,
      partial,
      truncated,
      cancelled,
      metadataOnly: true,
      cloudAttributeInspection: process.platform === 'win32',
      skipHidden: false,
      oldestMtimeMs,
      newestMtimeMs,
      limits: { maxFiles, maxDepth },
      warnings
    }
  };
}

function normaliseExtensions(list) {
  if (!Array.isArray(list)) return [];
  return Array.from(new Set(list
    .filter((value) => typeof value === 'string')
    .map((value) => value.trim().toLowerCase().replace(/^\./, ''))
    .filter((value) => /^[a-z0-9+._-]{1,16}$/.test(value))))
    .slice(0, 24);
}

function query(index, request) {
  const search = String(request.search || '').trim().toLowerCase();
  const extensions = normaliseExtensions(request.extensions);
  const minBytes = Number.isFinite(Number(request.minBytes)) ? Math.max(0, Number(request.minBytes)) : null;
  const maxBytes = Number.isFinite(Number(request.maxBytes)) ? Math.max(0, Number(request.maxBytes)) : null;
  const modifiedAfter = Number.isFinite(Number(request.modifiedAfter)) ? Number(request.modifiedAfter) : null;
  const modifiedBefore = Number.isFinite(Number(request.modifiedBefore)) ? Number(request.modifiedBefore) : null;

  const rows = index.files.filter((file) => {
    if (request.category && request.category !== 'all' && file.category !== request.category) return false;
    if (search && !file.relative.toLowerCase().includes(search) && !file.name.toLowerCase().includes(search)) return false;
    if (extensions.length && !extensions.includes(file.ext)) return false;
    if (minBytes !== null && file.size < minBytes) return false;
    if (maxBytes !== null && file.size > maxBytes) return false;
    if (modifiedAfter !== null && file.modifiedMs < modifiedAfter) return false;
    if (modifiedBefore !== null && file.modifiedMs > modifiedBefore) return false;
    return true;
  });

  const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
  const compare = (a, b) => {
    if (request.sort === 'size') return a.size - b.size;
    if (request.sort === 'modified') return a.modifiedMs - b.modifiedMs;
    if (request.sort === 'type') return collator.compare(a.ext, b.ext);
    return collator.compare(a.relative, b.relative);
  };
  rows.sort((a, b) => (request.desc ? -1 : 1) * (compare(a, b) || a.id - b.id));

  const offset = Number.isInteger(request.offset) ? Math.max(0, request.offset) : 0;
  const limit = Number.isInteger(request.limit) ? Math.min(200, Math.max(1, request.limit)) : 48;
  const page = rows.slice(offset, offset + limit);
  return {
    total: rows.length,
    bytes: rows.reduce((sum, file) => sum + file.size, 0),
    offset,
    limit,
    rows: page.map((file) => ({
      id: file.id,
      name: file.name,
      relative: file.relative,
      category: file.category,
      size: file.size,
      ext: file.ext,
      modifiedAt: file.modifiedAt,
      readonly: file.readonly,
      hidden: file.hidden,
      hasThumbnail: ['image', 'video', 'pdf', 'design', 'document', 'spreadsheet', 'presentation'].includes(file.category)
    }))
  };
}

module.exports = {
  scanFolder,
  query,
  validateSource,
  inside,
  categoryFor,
  extensionOf,
  KEYS,
  CATEGORY_ORDER: CAT.CATEGORY_ORDER,
  CATEGORY_LABELS: CAT.CATEGORY_LABELS,
  DEFAULT_LIMITS
};
