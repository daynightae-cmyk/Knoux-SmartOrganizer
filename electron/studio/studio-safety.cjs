'use strict';
/**
 * Filesystem safety primitives shared by the Studio organization engine.
 *
 * Every destination is resolved beneath a root the user explicitly granted with
 * a native picker. Links are refused at every component instead of being
 * followed, names use the real Windows rules, and no helper overwrites an
 * existing entry.
 */
const fsp = require('node:fs/promises');
const path = require('node:path');

const WINDOWS_RESERVED = new Set([
  'CON', 'PRN', 'AUX', 'NUL',
  'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9',
  'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9',
  'COM¹', 'COM²', 'COM³', 'LPT¹', 'LPT²', 'LPT³'
]);
const INVALID_NAME_CHARS = /[<>:"/\\|?*]/;
const MAX_NAME_BYTES = 255;
const MAX_PATH_UNITS = 32767;
const CASELESS = process.platform === 'win32';
let native;

function nativeService() {
  if (!native) native = require('./windows-studio-native.cjs').createWindowsStudioNative();
  return native;
}

async function inspectPaths(paths) {
  return nativeService().inspect(paths);
}

async function inspectPath(target) {
  return (await inspectPaths([target]))[0];
}

/**
 * Refuses any entry that Windows reports as a reparse point, including the
 * cloud placeholder tags that `lstat` alone cannot name. Called before a file
 * is opened, because opening a dehydrated file makes the storage provider
 * download it.
 */
async function assertPlainEntry(target) {
  if (process.platform !== 'win32') {
    const record = await inspectPath(target);
    const ok = record.exists && record.safe;
    return { ok, code: ok ? null : 'STUDIO_PATH_UNSAFE', record, reparse: null };
  }
  return nativeService().assertPlainEntry(target);
}

async function assertSafeRoute(target) {
  let current = path.resolve(target);
  const routes = [current];
  while (path.dirname(current) !== current) { current = path.dirname(current); routes.unshift(current); }
  const records = await inspectPaths(routes);
  if (records.length !== routes.length || records.some(record => !record.safe)) {
    throw Object.assign(new Error('A path component is unavailable, a reparse point or requires cloud recall.'), { code: 'STUDIO_PATH_UNSAFE' });
  }
  return records[records.length - 1];
}

function keyOf(value) {
  const resolved = path.resolve(String(value || ''));
  return CASELESS ? resolved.toLowerCase() : resolved;
}

function isInside(root, candidate) {
  const from = keyOf(root);
  const to = keyOf(candidate);
  return to === from || to.startsWith(from.endsWith(path.sep) ? from : `${from}${path.sep}`);
}

function validateFolderName(raw) {
  if (typeof raw !== 'string') return { ok: false, code: 'INVALID_TYPE', message: 'Folder name must be text.' };
  if (raw.length === 0) return { ok: false, code: 'EMPTY', message: 'Enter a folder name.' };
  if (raw !== raw.trim()) return { ok: false, code: 'EDGE_WHITESPACE', message: 'A folder name cannot start or end with a space.' };
  if (raw === '.' || raw === '..') return { ok: false, code: 'DOT_NAME', message: 'That folder name is reserved.' };
  if (/[. ]$/.test(raw)) return { ok: false, code: 'TRAILING_DOT_OR_SPACE', message: 'A folder name cannot end with a dot or a space.' };
  if (INVALID_NAME_CHARS.test(raw) || Array.from(raw).some(char => char.charCodeAt(0) < 32)) return { ok: false, code: 'INVALID_CHARACTER', message: 'The name contains a character Windows does not allow: < > : " / \\ | ? *' };
  if (raw.length > MAX_NAME_BYTES) return { ok: false, code: 'NAME_TOO_LONG', message: 'The folder name is longer than Windows allows.' };
  const stem = raw.split('.')[0].trim().toUpperCase();
  if (WINDOWS_RESERVED.has(stem)) return { ok: false, code: 'RESERVED_NAME', message: `${stem} is a reserved Windows device name.` };
  return { ok: true, name: raw };
}

function validateNameForNewPath(name) {
  const result = validateFolderName(name);
  if (!result.ok) return result;
  if (/[. ]$/.test(name)) return { ok: false, code: 'TRAILING_DOT_OR_SPACE', message: 'A folder name cannot end with a dot or a space.' };
  return result;
}

function validateFullPath(target) {
  const full = path.resolve(String(target || ''));
  if (full.length > MAX_PATH_UNITS) return { ok: false, code: 'PATH_TOO_LONG', message: 'The destination path is longer than Windows supports.' };
  return { ok: true, path: full, longPath: full.length > 260 };
}

async function lstatOrNull(target) {
  try { return await fsp.lstat(target); }
  catch (error) {
    if (error?.code === 'ENOENT' || error?.code === 'ENOTDIR') return null;
    throw error;
  }
}

async function readDirectoryBounded(directory, { max = 500, includeFiles = false } = {}) {
  let handle;
  try { handle = await fsp.opendir(directory); }
  catch (error) {
    const failure = new Error(`That destination folder cannot be read (${error?.code || 'UNKNOWN'}).`);
    failure.code = error?.code === 'EACCES' || error?.code === 'EPERM' ? 'EACCES' : 'DESTINATION_UNREADABLE';
    throw failure;
  }
  const entries = [];
  let truncated = false;
  try {
    for await (const entry of handle) {
      if (entries.length >= max) { truncated = true; break; }
      if (entry.isSymbolicLink()) continue;
      if (!includeFiles && !entry.isDirectory()) continue;
      entries.push({ name: entry.name, type: entry.isDirectory() ? 'directory' : entry.isFile() ? 'file' : 'other' });
    }
  } finally {
    try { await handle.close(); } catch { /* opendir closes idempotently */ }
  }
  entries.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
  return { entries, truncated };
}

function splitRelative(relative) {
  const value = String(relative || '').trim();
  if (!value || value === '.') return [];
  if (path.isAbsolute(value) || /^[a-zA-Z]:/.test(value) || value.startsWith('\\\\')) {
    throw Object.assign(new Error('A relative destination path is required.'), { code: 'ABSOLUTE_RELATIVE_PATH' });
  }
  const segments = value.replace(/\\/g, '/').split('/').filter(Boolean);
  if (!segments.length) return [];
  for (const segment of segments) {
    if (segment === '.' || segment === '..') {
      throw Object.assign(new Error('Destination paths cannot escape the folder you authorized.'), { code: 'PATH_TRAVERSAL' });
    }
    const check = validateFolderName(segment);
    if (!check.ok) throw Object.assign(new Error(check.message), { code: check.code });
  }
  return segments;
}

/**
 * Confirms a granted root is a real directory.
 *
 * The link test is made against the entry itself, not by comparing the path
 * with `realpath`: Windows short (8.3) names such as `C:\Users\USERNA~1` are
 * legitimate, resolve to a different spelling of the same directory, and are
 * not links. `realpath` is still used for the value that is returned, so every
 * path built under a root uses one canonical long spelling.
 */
async function assertRealDirectory(rootReal, label = 'Destination') {
  const root = path.resolve(String(rootReal || ''));
  await assertSafeRoute(root);
  const plain = await assertPlainEntry(root);
  if (!plain.ok) {
    throw Object.assign(new Error(`${label} is a link, a cloud placeholder, or could not be confirmed as a local folder.`), { code: plain.code === 'STUDIO_REPARSE_BUDGET' ? 'STUDIO_REPARSE_BUDGET' : 'DESTINATION_LINK_REFUSED' });
  }
  if (!plain.record.exists || !plain.record.directory) {
    throw Object.assign(new Error(`${label} is unavailable or is not a folder.`), { code: 'DESTINATION_UNAVAILABLE' });
  }
  return fsp.realpath(root);
}

/**
 * Resolves a user-visible relative path under an authorized, already-real root.
 * When `create` is true, missing directories are created one level at a time.
 * A link anywhere in the chain aborts the operation.
 */
async function resolveWithinRoot(rootReal, relative, { create = false, label = 'Destination' } = {}) {
  const root = await assertRealDirectory(rootReal, label);
  const segments = splitRelative(relative);
  let current = root;
  for (const segment of segments) {
    current = path.join(current, segment);
    let stats = await lstatOrNull(current);
    if (!stats) {
      if (!create) throw Object.assign(new Error(`Destination folder not found: ${segment}`), { code: 'DESTINATION_NOT_FOUND' });
      await fsp.mkdir(current);
      stats = await fsp.lstat(current);
    }
    if (stats.isSymbolicLink()) {
      throw Object.assign(new Error(`Destination path contains a link at ${segment}; it was refused.`), { code: 'DESTINATION_LINK_REFUSED' });
    }
    if (!stats.isDirectory()) {
      throw Object.assign(new Error(`A file blocks the destination path at ${segment}.`), { code: 'DESTINATION_NOT_DIRECTORY' });
    }
    const metadata = await inspectPath(current);
    if (!metadata.safe || !metadata.directory) throw Object.assign(new Error('A destination component is unsafe.'), { code: 'STUDIO_PATH_UNSAFE' });
    const real = await fsp.realpath(current);
    if (!isInside(root, real)) {
      throw Object.assign(new Error('Destination path resolves outside the authorized folder.'), { code: 'DESTINATION_ESCAPE' });
    }
    current = real;
  }
  return { absolute: current, realPath: current, relative: segments.join(path.sep) };
}

async function assertWritableDirectory(directory) {
  try { await fsp.access(directory, require('node:fs').constants.W_OK); }
  catch {
    throw Object.assign(new Error('Windows denied write access to that destination folder.'), { code: 'EACCES' });
  }
}

async function findCaseInsensitiveChild(directory, name) {
  const wanted = String(name).toLowerCase();
  let handle;
  try { handle = await fsp.opendir(directory); }
  catch { return null; }
  try {
    for await (const entry of handle) {
      if (entry.name.toLowerCase() === wanted) return entry.name;
    }
  } finally {
    try { await handle.close(); } catch { /* already closed */ }
  }
  return null;
}

async function validateNewFolder({ rootReal, parentRelative = '', name }) {
  const root = await assertRealDirectory(rootReal, 'Destination');
  const nameCheck = validateNameForNewPath(name);
  if (!nameCheck.ok) return { ok: false, ...nameCheck };
  const parent = await resolveWithinRoot(root, parentRelative, { create: false, label: 'Destination' });
  await assertWritableDirectory(parent.realPath);
  const normalized = nameCheck.name;
  const fullPath = path.join(parent.realPath, normalized);
  const fullCheck = validateFullPath(fullPath);
  if (!fullCheck.ok) return fullCheck;
  if (!isInside(root, fullPath)) return { ok: false, code: 'DESTINATION_ESCAPE', message: 'The folder would be outside the authorized destination.' };
  const existingExact = await lstatOrNull(fullPath);
  if (existingExact) {
    return { ok: false, code: 'EXISTS', message: 'A file or folder with that name already exists.', existing: true, existingType: existingExact.isDirectory() ? 'directory' : 'file' };
  }
  const caseInsensitive = await findCaseInsensitiveChild(parent.realPath, normalized);
  if (caseInsensitive) {
    return { ok: false, code: 'EXISTS', message: 'A folder with that name already exists (Windows names are case-insensitive).', existing: true, existingName: caseInsensitive };
  }
  return { ok: true, name: normalized, parentPath: parent.realPath, fullPath, relativePath: path.relative(root, fullPath), longPath: fullCheck.longPath };
}

async function createNewFolder({ rootReal, parentRelative = '', name }) {
  const validation = await validateNewFolder({ rootReal, parentRelative, name });
  if (!validation.ok) {
    const error = new Error(validation.message);
    error.code = validation.code;
    error.validation = validation;
    throw error;
  }
  try { await fsp.mkdir(validation.fullPath); }
  catch (error) {
    if (error?.code === 'EEXIST') {
      const exists = new Error('A file or folder with that name already exists.');
      exists.code = 'EXISTS';
      throw exists;
    }
    throw error;
  }
  const stats = await fsp.lstat(validation.fullPath);
  if (!stats.isDirectory() || stats.isSymbolicLink()) throw new Error('The created folder could not be verified.');
  return validation;
}

async function uniqueChildName(directory, requestedName, { isDirectory = false } = {}) {
  const ext = isDirectory ? '' : path.extname(requestedName);
  const stem = ext ? requestedName.slice(0, -ext.length) : requestedName;
  for (let index = 1; index <= 9999; index += 1) {
    const candidate = index === 1 ? requestedName : `${stem} (${index})${ext}`;
    const check = validateNameForNewPath(candidate);
    if (!check.ok) throw Object.assign(new Error(check.message), { code: check.code });
    const existing = await lstatOrNull(path.join(directory, candidate));
    if (!existing) return candidate;
  }
  throw Object.assign(new Error('Could not build a unique destination name.'), { code: 'NAME_EXHAUSTED' });
}

function pathForDisplay(target) {
  return String(target || '').replace(/\//g, path.sep);
}

module.exports = {
  WINDOWS_RESERVED,
  MAX_NAME_BYTES,
  MAX_PATH_UNITS,
  keyOf,
  isInside,
  validateFolderName,
  validateNameForNewPath,
  validateFullPath,
  lstatOrNull,
  readDirectoryBounded,
  splitRelative,
  assertRealDirectory,
  resolveWithinRoot,
  assertWritableDirectory,
  findCaseInsensitiveChild,
  validateNewFolder,
  createNewFolder,
  uniqueChildName,
  pathForDisplay,
  inspectPaths,
  inspectPath,
  assertSafeRoute,
  assertPlainEntry,
  nativeService
};
