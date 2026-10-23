'use strict';
/**
 * Windows metadata adapter for the Studio organization engine.
 *
 * This module answers one question with evidence instead of assumptions:
 * "can this path be opened and transferred without following a link or
 * hydrating cloud content?"
 *
 * Everything here is built on two authorities only:
 *  - Node `fs.lstat(path, { bigint: true })`, which on Windows reports the real
 *    NTFS file index in `st_ino` (verified on the pinned runtime, and verified
 *    to survive a rename and to be shared by hard links).
 *  - `fsutil reparsepoint query`, the documented read-only reparse-tag reader
 *    already used elsewhere in this application.
 *
 * What is NOT available from Node and is therefore reported as unavailable
 * rather than guessed:
 *  - `FILE_ATTRIBUTE_*` values (no attributes field on `Stats`).
 *  - allocated/cluster size. `st_blocks` is not trustworthy on Windows: on the
 *    pinned runtime a 1 KiB file reported 8 blocks while a 5 byte file reported
 *    0, so an "empty allocation means placeholder" test would be false. A
 *    placeholder is instead refused by its reparse tag, or by refusing to guess.
 *  - directory-handle locking. Node cannot open a directory handle on Windows,
 *    and an open *file* handle does not stop another process renaming or
 *    deleting the path: verified on the pinned runtime, libuv opens files with
 *    FILE_SHARE_DELETE, so `fs.rename` succeeded while a `fs.open` handle was
 *    still held.
 *
 * Because the path is not lockable, every destructive step is gated on the
 * object identity taken through the open handle (`FileHandle.stat()` follows the
 * file object, not the path) and re-checked against the path immediately before
 * a delete. A path whose current index differs from the index we copied is
 * never deleted, and a filesystem that supplies no index at all is never
 * deleted from.
 */

const fsp = require('node:fs/promises');
const path = require('node:path');
const win = require('../windows-fs-metadata.cjs');

const CASELESS = process.platform === 'win32';

function identityOf(bigStats, smallStats) {
  const fileIdentity = Number.isFinite(Number(bigStats.ino)) && Number(bigStats.ino) > 0 && Number.isFinite(Number(bigStats.dev)) && Number(bigStats.dev) > 0
    ? `${Number(bigStats.dev)}:${Number(bigStats.ino)}`
    : null;
  return {
    fileIdentity,
    identityAvailable: Boolean(fileIdentity),
    size: Number(smallStats.size),
    modifiedMs: Number(smallStats.mtimeMs),
    linkCount: Number.isFinite(Number(bigStats.nlink)) && Number(bigStats.nlink) > 0 ? Number(bigStats.nlink) : null,
    hardlinked: Number.isFinite(Number(bigStats.nlink)) && Number(bigStats.nlink) > 1,
    volumeSerial: Number.isFinite(Number(bigStats.dev)) && Number(bigStats.dev) > 0 ? Number(bigStats.dev) : null
  };
}

async function readPair(target) {
  const big = await fsp.lstat(target, { bigint: true });
  const small = await fsp.lstat(target);
  return { big, small };
}

async function describeOne(target) {
  const resolved = path.resolve(String(target || ''));
  let pair;
  try {
    pair = await readPair(resolved);
  } catch (error) {
    if (['ENOENT', 'ENOTDIR', 'EPERM', 'EACCES'].includes(error?.code)) {
      return {
        path: resolved, exists: false, safe: false, directory: false, regular: false,
        reason: error.code, attributes: null, attributesAvailable: false,
        identity: { fileIdentity: null, identityAvailable: false, size: 0, modifiedMs: 0 },
        size: 0, modifiedMs: 0, linkCount: null, hardlinked: false, volumeSerial: null, identityAvailable: false
      };
    }
    throw error;
  }
  const { big, small } = pair;
  const identity = identityOf(big, small);
  const symbolic = small.isSymbolicLink();
  return {
    path: resolved,
    exists: true,
    // A reparse point that Node can name (symbolic link or junction/mount
    // point) is never treated as a transferable local entry.
    safe: !symbolic && (small.isFile() || small.isDirectory()),
    directory: small.isDirectory(),
    regular: small.isFile(),
    symbolic,
    reason: symbolic ? 'reparse-point' : (small.isFile() || small.isDirectory() ? null : 'not-a-regular-entry'),
    attributes: null,
    attributesAvailable: false,
    identity,
    identityAvailable: identity.identityAvailable,
    size: identity.size,
    modifiedMs: identity.modifiedMs,
    linkCount: identity.linkCount,
    hardlinked: identity.hardlinked,
    volumeSerial: identity.volumeSerial
  };
}

/**
 * Reparse-tag probe with an explicit budget and a freshness key.
 *
 * `fsutil` is a real process spawn, so an unbounded probe would make a transfer
 * arbitrarily slow; a cache keyed only by path would also keep saying "plain
 * file" after the file was replaced. Both are handled: the budget is finite and
 * every cache key carries the size and modified time, so any change re-probes.
 */
function createProbeService({ platform = process.platform, maxProbes = 2048, execFileAsync = null, windowsDirectory = process.env.WINDIR || 'C:\\Windows' } = {}) {
  const query = win.createReparseTagReader({
    execFile: execFileAsync || require('node:util').promisify(require('node:child_process').execFile),
    platform,
    windowsDirectory,
    maxQueries: Number.MAX_SAFE_INTEGER
  });
  const cache = new Map();
  let used = 0;
  let exhausted = false;

  async function probe(target, { size, modifiedMs } = {}) {
    const resolved = path.resolve(String(target || ''));
    const key = `${CASELESS ? resolved.toLowerCase() : resolved}:${Number(size) || 0}:${Number(modifiedMs) || 0}`;
    if (cache.has(key)) return cache.get(key);
    if (platform !== 'win32') {
      const result = { name: 'unsupported-platform', tag: null, available: false, queried: false, refused: false };
      cache.set(key, result);
      return result;
    }
    if (used >= maxProbes) {
      exhausted = true;
      return { name: 'query-budget-exhausted', tag: null, available: false, queried: false, refused: true };
    }
    used += 1;
    const result = { ...await query(resolved), refused: false };
    if (cache.size > maxProbes) cache.clear();
    cache.set(key, result);
    return result;
  }

  return {
    probe,
    stats: () => ({ probes: used, budget: maxProbes, exhausted, cached: cache.size }),
    clear: () => { cache.clear(); }
  };
}

function createWindowsStudioNative(options = {}) {
  const probes = createProbeService(options);

  async function inspect(targets) {
    const list = Array.isArray(targets) ? targets : [targets];
    return Promise.all(list.map(describeOne));
  }

  async function inspectOne(target) {
    return (await inspect([target]))[0];
  }

  /**
   * True only when Windows itself says the entry is not a reparse point.
   * Anything else - a cloud tag, an unknown tag, a failed query or an
   * exhausted budget - is refused, because opening a dehydrated file makes
   * the storage provider download it.
   */
  async function assertPlainEntry(target) {
    const record = await inspectOne(target);
    if (!record.exists) return { ok: false, code: 'STUDIO_PATH_UNSAFE', record, reparse: null };
    if (record.symbolic) return { ok: false, code: 'STUDIO_REPARSE_REFUSED', record, reparse: { name: 'reparse-point' } };
    if (!record.regular && !record.directory) return { ok: false, code: 'STUDIO_PATH_UNSAFE', record, reparse: null };
    const reparse = await probes.probe(target, { size: record.size, modifiedMs: record.modifiedMs });
    if (reparse.name === 'not-a-reparse-point') return { ok: true, record, reparse };
    if (reparse.name === 'query-budget-exhausted') return { ok: false, code: 'STUDIO_REPARSE_BUDGET', record, reparse };
    return { ok: false, code: 'STUDIO_REPARSE_REFUSED', record, reparse };
  }

  return {
    inspect,
    inspectOne,
    assertPlainEntry,
    probeReparse: probes.probe,
    probeStats: probes.stats,
    clearProbes: probes.clear,
    capabilities: Object.freeze({
      platform: options.platform || process.platform,
      fileIdentity: true,
      fileAttributes: false,
      allocatedSize: false,
      directoryHandleLock: false,
      pathReplacementLock: false,
      reparseTagQuery: (options.platform || process.platform) === 'win32'
    })
  };
}

module.exports = {
  createWindowsStudioNative,
  createProbeService,
  identityOf,
  describeOne
};
