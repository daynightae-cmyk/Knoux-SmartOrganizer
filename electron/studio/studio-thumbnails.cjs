'use strict';
/**
 * OS thumbnail bridge, restricted to files that are still the exact indexed,
 * non-reparse entries recorded by the scanner. Thumbnail bytes cross the bridge
 * as a data URL, never as a file:// URL and never as a raw path for the renderer
 * to open.
 */
const fsp = require('node:fs/promises');
const path = require('node:path');
const win = require('../windows-fs-metadata.cjs');
const safety = require('./studio-safety.cjs');

const THUMBNAIL_CATEGORIES = new Set(['image', 'video', 'pdf', 'design', 'document', 'spreadsheet', 'presentation']);
const MAX_ENTRIES = 96;
const MAX_CACHE_BYTES = 24 * 1024 * 1024;
const MAX_PROBES = 512;

function createThumbnailService({ nativeImage }) {
  const cache = new Map();
  let cacheBytes = 0;
  const probe = win.createReparseTagReader({ maxQueries: MAX_PROBES });

  function remember(key, value) {
    if (cache.has(key)) {
      const old = cache.get(key);
      cacheBytes -= old.bytes;
      cache.delete(key);
    }
    cache.set(key, value);
    cacheBytes += value.bytes;
    while (cache.size > MAX_ENTRIES || cacheBytes > MAX_CACHE_BYTES) {
      const oldestKey = cache.keys().next().value;
      const removed = cache.get(oldestKey);
      cacheBytes -= removed?.bytes || 0;
      cache.delete(oldestKey);
    }
  }

  async function getThumbnail(index, fileId) {
    if (!nativeImage || typeof nativeImage.createThumbnailFromPath !== 'function') {
      return { thumbnail: null, reason: 'THUMBNAILS_UNAVAILABLE' };
    }
    const file = index.files[Number(fileId)];
    if (!file || file.id !== Number(fileId)) return { thumbnail: null, reason: 'FILE_NOT_INDEXED' };
    if (!THUMBNAIL_CATEGORIES.has(file.category)) return { thumbnail: null, reason: 'TYPE_NOT_PREVIEWABLE' };

    const absolute = path.resolve(index.root, ...file.relative.split('/'));
    if (!safety.isInside(index.root, absolute)) return { thumbnail: null, reason: 'PATH_OUTSIDE_SOURCE' };
    const key = `${index.id}:${file.id}:${file.size}:${file.modifiedMs}`;
    if (cache.has(key)) {
      const hit = cache.get(key);
      cache.delete(key);
      cache.set(key, hit);
      return { thumbnail: hit.dataUrl, width: hit.width, height: hit.height, cached: true };
    }

    let stats;
    try { stats = await fsp.lstat(absolute); }
    catch { return { thumbnail: null, reason: 'FILE_UNAVAILABLE' }; }
    if (!stats.isFile() || stats.isSymbolicLink()) return { thumbnail: null, reason: 'NOT_A_REGULAR_FILE' };
    if (Number(stats.size) !== Number(file.size) || Number(stats.mtimeMs) !== Number(file.identity?.modifiedMs)) {
      return { thumbnail: null, reason: 'FILE_CHANGED' };
    }
    try {
      const relativeFolder = path.relative(index.root, path.dirname(absolute));
      await safety.resolveWithinRoot(index.root, relativeFolder, { create: false, label: 'Source' });
      const real = await fsp.realpath(absolute);
      if (!safety.isInside(index.root, real)) throw new Error('outside');
    } catch {
      return { thumbnail: null, reason: 'SOURCE_PATH_UNSAFE' };
    }

    // A cloud placeholder is a reparse point. The OS thumbnail provider may
    // hydrate it, so the tag is probed before the provider is called.
    const reparse = await probe(absolute);
    if (reparse.name !== 'not-a-reparse-point') {
      return { thumbnail: null, reason: reparse.name === 'query-budget-exhausted' ? 'THUMBNAIL_BUDGET' : 'REPARSE_POINT_REFUSED' };
    }

    let image;
    try {
      image = await nativeImage.createThumbnailFromPath(absolute, { width: 384, height: 240 });
    } catch {
      return { thumbnail: null, reason: 'THUMBNAIL_PROVIDER_FAILED' };
    }
    if (!image || image.isEmpty()) return { thumbnail: null, reason: 'NO_THUMBNAIL_PROVIDER' };
    const size = image.getSize();
    const dataUrl = `data:image/png;base64,${image.toPNG().toString('base64')}`;
    const record = { dataUrl, width: size.width, height: size.height, bytes: dataUrl.length };
    remember(key, record);
    return { thumbnail: dataUrl, width: size.width, height: size.height, cached: false };
  }

  return {
    getThumbnail,
    clear: () => { cache.clear(); cacheBytes = 0; },
    stats: () => ({ entries: cache.size, bytes: cacheBytes, probeBudget: MAX_PROBES })
  };
}

module.exports = { createThumbnailService, THUMBNAIL_CATEGORIES, MAX_ENTRIES, MAX_CACHE_BYTES };
