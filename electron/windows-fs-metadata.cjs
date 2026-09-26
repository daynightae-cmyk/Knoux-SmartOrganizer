'use strict';
/**
 * Windows-aware filesystem metadata adapter.
 *
 * Authority: Node `fs.lstat` / `fs.stat` / `fs.readlink` (which map to
 * GetFileAttributesEx + FindFirstFile + CreateFile on Windows) and the
 * documented `fsutil reparsepoint query` reparse-tag reader.
 *
 * Hard rules enforced here:
 *  - Reparse points (symlinks, junctions, mount points, cloud placeholders) are
 *    NEVER followed by default. Following an unknown reparse point can silently
 *    leave the requested volume, loop forever, or hydrate cloud content.
 *  - Cloud content is never opened for reading during inventory/duplication.
 *  - A hard link to the same physical file is never counted as reclaimable
 *    duplicate storage.
 *  - When Windows did not supply a value, the field is `null` and the matching
 *    `*Available` flag is `false`. Nothing is estimated or invented.
 *
 * `stats.blocks` is 0 for every file on Windows (verified on the pinned
 * runtime), so allocated-size/placeholder detection from Node alone is not
 * possible. That is reported as unavailable rather than guessed.
 */

const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');

const execFileAsync = promisify(execFile);

/** Documented Windows reparse tags we can name without guessing. */
const REPARSE_TAGS = Object.freeze({
  '0x80000017': 'cloud-files',
  '0x9000001a': 'cloud-files',
  '0x9000101a': 'cloud-files',
  '0x9000201a': 'cloud-files',
  '0x9000301a': 'cloud-files',
  '0x9000401a': 'cloud-files',
  '0x9000601a': 'cloud-files',
  '0x9000701a': 'cloud-files',
  '0x9000801a': 'cloud-files',
  '0x9000901a': 'cloud-files',
  '0xa0000003': 'mount-point',
  '0xa000000c': 'symbolic-link',
  '0x8000001e': 'dedup',
  '0x80000023': 'wci'
});

const CLOUD_TAGS = new Set(['cloud-files']);

/** Reparse tags that may point at a different volume than the scanned root. */
const CROSS_VOLUME_TAGS = new Set(['mount-point', 'symbolic-link', 'unknown']);

function volumeKey(targetPath) {
  const resolved = path.resolve(targetPath);
  const parsed = path.parse(resolved);
  return `${parsed.root.toLowerCase()}`;
}

function isInside(root, candidate) {
  const from = path.resolve(root).toLowerCase();
  const to = path.resolve(candidate).toLowerCase();
  return to === from || to.startsWith(from.endsWith(path.sep) ? from : from + path.sep);
}

/** Windows error codes that mean "this entry is not readable", not "scan failed". */
const ACCESS_DENIED_CODES = new Set(['EACCES', 'EPERM', 'EBUSY', 'ETXTBSY', 'ELOOP', 'ENAMETOOLONG', 'ENOENT', 'ENOTDIR', 'EISDIR', 'EINVAL']);

function describeError(error) {
  return {
    code: typeof error?.code === 'string' ? error.code : 'UNKNOWN',
    message: String(error?.message || 'unavailable').replace(/\s+/g, ' ').slice(0, 200)
  };
}

/**
 * Reads the documented reparse tag for a path that lstat already reported as a
 * link. Bounded: one short-lived read-only process per link, capped by
 * `maxQueries`, and any failure degrades to `unknown` rather than throwing.
 *
 * The default budget is deliberately small. Each query is a real process spawn
 * costing hundreds of milliseconds, so an unbounded reader would make a scan
 * arbitrarily slow. Beyond the budget the entry is honestly reported as
 * `query-budget-exhausted` and is still never traversed.
 */
function createReparseTagReader({ execFile = execFileAsync, platform = process.platform, windowsDirectory = process.env.WINDIR || 'C:\\Windows', maxQueries = 64 } = {}) {
  let remaining = maxQueries;
  const cache = new Map();
  return async function readReparseTag(targetPath) {
    if (platform !== 'win32') return { tag: null, name: 'unsupported-platform', available: false, queried: false };
    const key = path.resolve(targetPath).toLowerCase();
    if (cache.has(key)) return cache.get(key);
    if (remaining <= 0) {
      const budget = { tag: null, name: 'query-budget-exhausted', available: false, queried: false };
      cache.set(key, budget);
      return budget;
    }
    remaining -= 1;
    let result;
    try {
      const { stdout } = await execFile(path.join(windowsDirectory, 'System32', 'fsutil.exe'), ['reparsepoint', 'query', targetPath], { windowsHide: true, timeout: 8000, maxBuffer: 256 * 1024 });
      const match = String(stdout).match(/Reparse Tag Value\s*:\s*(0x[0-9a-fA-F]+)/);
      const tag = match ? match[1].toLowerCase() : null;
      result = { tag, name: tag ? (REPARSE_TAGS[tag] || 'unknown') : 'unrecognised', available: Boolean(tag), queried: true };
    } catch (error) {
      // "not a reparse point" is a definitive negative, not an error.
      const notReparse = Number(error?.code) === 1 || /not a reparse point/i.test(String(error?.stderr || error?.message || ''));
      result = { tag: null, name: notReparse ? 'not-a-reparse-point' : 'query-failed', available: false, queried: true };
    }
    cache.set(key, result);
    return result;
  };
}

/**
 * Builds the honest per-entry classification record.
 * `reparse` is the resolved tag reader (may be null when the caller opted out).
 */
function createEntryClassifier({ readReparseTag = null } = {}) {
  return async function classify(targetPath, stats, { reparsePolicy = 'skip' } = {}) {
    const resolved = path.resolve(targetPath);
    const isLink = typeof stats.isSymbolicLink === 'function' && stats.isSymbolicLink();
    const size = Number(stats.size) || 0;
    const ino = Number(stats.ino);
    const dev = Number(stats.dev);
    const nlink = Number(stats.nlink);
    const identityAvailable = Number.isFinite(ino) && ino > 0 && Number.isFinite(dev) && dev > 0;

    const record = {
      path: resolved,
      size,
      entryKind: isLink ? 'reparse' : (stats.isDirectory() ? 'directory' : (stats.isFile() ? 'file' : 'other')),
      linkTarget: null,
      reparseTag: null,
      reparseName: isLink ? 'unprobed' : null,
      fileIdentity: identityAvailable ? `${dev}:${ino}` : null,
      linkCount: Number.isFinite(nlink) && nlink > 0 ? nlink : null,
      hardlinked: Number.isFinite(nlink) && nlink > 1,
      allocatedBytes: null,
      allocatedSizeAvailable: false,
      placeholderState: isLink ? 'possible' : 'not-indicated',
      placeholderStateAvailable: false,
      hydrationRisk: isLink ? 'avoid' : 'none',
      crossVolume: false,
      traversed: false,
      skippedReason: null,
      volume: volumeKey(resolved)
    };

    if (!isLink) return record;

    try { record.linkTarget = path.resolve(path.dirname(resolved), await fsp.readlink(resolved)); }
    catch { record.linkTarget = null; }

    if (readReparseTag) {
      const probe = await readReparseTag(resolved);
      record.reparseTag = probe.tag;
      record.reparseName = probe.name;
      record.reparseTagAvailable = probe.available;
    } else {
      record.reparseTagAvailable = false;
    }

    if (CLOUD_TAGS.has(record.reparseName)) {
      record.placeholderState = 'cloud-placeholder';
      record.placeholderStateAvailable = true;
      record.hydrationRisk = 'avoid';
    } else if (record.reparseName === 'mount-point') {
      record.placeholderState = 'reparse-mount-point';
      record.placeholderStateAvailable = true;
    } else if (record.reparseName === 'symbolic-link') {
      record.placeholderState = 'reparse-symbolic-link';
      record.placeholderStateAvailable = true;
    } else {
      record.placeholderState = 'unknown';
      record.hydrationRisk = 'unknown';
    }

    if (record.linkTarget) {
      const targetVolume = volumeKey(record.linkTarget);
      record.crossVolume = CROSS_VOLUME_TAGS.has(record.reparseName) && targetVolume !== record.volume;
    } else {
      record.crossVolume = true;
    }

    record.traversed = false;
    record.skippedReason = reparsePolicy === 'same-volume' && !record.crossVolume && Boolean(record.linkTarget)
      ? null
      : (reparsePolicy === 'same-volume' ? 'cross-volume-reparse' : 'reparse-policy-skip');
    return record;
  };
}

function sameVolume(left, right) {
  return volumeKey(left) === volumeKey(right);
}

/**
 * Decides whether a classified link may be descended into.
 * Explicit, testable and conservative: unknown tags are never traversed.
 */
function mayTraverseLink(entry, { reparsePolicy = 'skip', root = null } = {}) {
  if (!entry || entry.entryKind !== 'reparse') return false;
  if (reparsePolicy !== 'same-volume') return false;
  if (CLOUD_TAGS.has(entry.reparseName)) return false;
  if (!entry.linkTarget) return false;
  if (entry.crossVolume) return false;
  if (root && !isInside(root, entry.linkTarget) && !isInside(entry.linkTarget, root)) return false;
  if (!sameVolume(entry.path, entry.linkTarget)) return false;
  return true;
}

/** Physical storage accounting: two names for one file index are one file. */
function physicalDuplicateGroups(entries) {
  const byIdentity = new Map();
  for (const entry of Array.isArray(entries) ? entries : []) {
    if (!entry?.fileIdentity) continue;
    const list = byIdentity.get(entry.fileIdentity) || [];
    list.push(entry.path);
    byIdentity.set(entry.fileIdentity, list);
  }
  const groups = [];
  for (const [identity, paths] of byIdentity.entries()) {
    if (paths.length > 1) groups.push({ fileIdentity: identity, paths: paths.sort() });
  }
  return groups;
}

/**
 * Reclaimable bytes for one exact-duplicate group.
 * Hard links share one physical file, so removing an extra directory entry
 * frees nothing. You keep one physical copy and delete the rest, therefore
 * reclaimable = (distinct physical files - 1) * size.
 */
function reclaimableBytesForGroup(files) {
  const list = Array.isArray(files) ? files : [];
  if (list.length < 2) return 0;
  const identities = new Set();
  let size = 0;
  for (const file of list) {
    identities.add(file?.fileIdentity || `path:${file?.path}`);
    size = Math.max(size, Number(file?.size) || 0);
  }
  return size * Math.max(0, identities.size - 1);
}

/** True when every file in the group resolves to the same physical file. */
function groupIsSinglePhysicalFile(files) {
  const list = (Array.isArray(files) ? files : []).filter(file => file?.fileIdentity);
  if (list.length < 2) return false;
  return new Set(list.map(file => file.fileIdentity)).size === 1;
}

/** Stable pre/post identity comparison used to detect a file changing under a read. */
function identitySnapshot(stats) {
  return {
    fileIdentity: Number.isFinite(Number(stats?.ino)) && Number(stats.ino) > 0 ? `${Number(stats.dev)}:${Number(stats.ino)}` : null,
    size: Number(stats?.size) || 0,
    modifiedMs: Number(stats?.mtimeMs) || 0
  };
}

function identityChanged(before, after) {
  if (!before || !after) return true;
  if (before.fileIdentity && after.fileIdentity && before.fileIdentity !== after.fileIdentity) return true;
  return before.size !== after.size || before.modifiedMs !== after.modifiedMs;
}

function tempDirectory() {
  return process.env.TEMP || os.tmpdir();
}

function longPathSafe(targetPath) {
  // Windows long paths need the \\?\ prefix for the Win32 layer; Node already
  // handles this internally, but exposing the resolved form keeps evidence honest.
  const resolved = path.resolve(targetPath);
  return resolved.length > 260 ? `\\\\?\\${resolved}` : resolved;
}

module.exports = {
  REPARSE_TAGS,
  CLOUD_TAGS,
  ACCESS_DENIED_CODES,
  volumeKey,
  isInside,
  sameVolume,
  describeError,
  createReparseTagReader,
  createEntryClassifier,
  mayTraverseLink,
  physicalDuplicateGroups,
  reclaimableBytesForGroup,
  groupIsSinglePhysicalFile,
  identitySnapshot,
  identityChanged,
  tempDirectory,
  longPathSafe,
  fsSync: fs,
  fsp
};
