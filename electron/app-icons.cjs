'use strict';
/**
 * Windows-native application icons.
 *
 * The Applications workspace shows the icon Windows itself uses for an installed
 * program. Nothing here is invented: an icon is only reported as `ready` when a
 * real image was read from the shell, from an MSIX/AppX package or from a `.ico`
 * file that actually exists on disk. Anything else comes back as an honest
 * `unavailable` with the reason, so the renderer can fall back to a typographic
 * identity instead of a fake picture.
 *
 * Safety rules this module exists to enforce:
 *   1. The target application is never executed. Icons come from read-only shell
 *      APIs (`SHGetFileInfoW`), from file reads and from package manifests only.
 *   2. The renderer never supplies a path. It sends opaque app ids; paths come
 *      from the inventory the main process recorded (`registerInventory`).
 *   3. Everything is read-only outside the provider's own cache directory, which
 *      is the only place it writes.
 *   4. Extraction is batched, bounded, lazy and cancellable: at most one
 *      PowerShell process at a time, a fixed batch size, a hard deadline per
 *      batch, and queued work that a newer request supersedes.
 *   5. A failure never throws into the UI: it resolves as `unavailable`.
 */
const crypto = require('node:crypto');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');

// ---------------------------------------------------------------------------
// Boundaries
// ---------------------------------------------------------------------------

/** Square edge every cached icon is normalised down to; never upscaled. */
const ICON_EDGE = 64;
/** Icons extracted per PowerShell process. One process per batch, not per app. */
const BATCH_SIZE = 24;
/** Hard deadline for one extraction batch, then the child is killed. */
const BATCH_TIMEOUT_MS = 20000;
/** How long to wait for a killed child to report back before moving on. */
const KILL_GRACE_MS = 2000;
/** An icon source larger than this is refused; it is not an icon. */
const MAX_ICON_FILE_BYTES = 64 * 1024 * 1024;
const MAX_PATH_LENGTH = 32767;
/** On-disk cache ceilings, evicted oldest-first by modification time. */
const MAX_DISK_CACHE_BYTES = 5 * 1024 * 1024;
const MAX_DISK_CACHE_FILES = 800;
const MAX_MEMORY_RESULTS = 192;
const MAX_REGISTERED_ITEMS = 2000;
const MAX_PACKAGE_LOGO_CANDIDATES = 8;
const CACHE_VERSION = 'v1';

const ALLOWED_EXTENSIONS = Object.freeze(['.exe', '.dll', '.ico', '.msi', '.png']);
/** Extensions whose icon is taken from the shell (read-only `SHGetFileInfoW`). */
const SHELL_EXTENSIONS = Object.freeze(['.exe', '.dll']);
/** Extensions read directly as an image file. */
const IMAGE_EXTENSIONS = Object.freeze(['.ico', '.png']);

/**
 * Host processes that appear in uninstall strings but whose icon belongs to
 * Windows, not to the application. Serving them would be exactly the placeholder
 * this provider is forbidden to produce.
 */
const ICON_HOST_EXECUTABLES = Object.freeze([
  'msiexec.exe', 'rundll32.exe', 'regsvr32.exe', 'wscript.exe', 'cscript.exe',
  'cmd.exe', 'powershell.exe', 'pwsh.exe', 'explorer.exe', 'shell.exe',
  'unins000.exe', 'setup.exe', 'install.exe', 'installer.exe'
]);

/** The reasons a result can carry. All of them are honest, none is a picture. */
const REASONS = Object.freeze({
  NOT_WINDOWS: 'not-windows',
  NO_ICON_PATH: 'no-icon-path',
  ICON_FILE_MISSING: 'icon-file-missing',
  PATH_REFUSED: 'path-refused',
  EXTRACTION_FAILED: 'extraction-failed',
  PACKAGE_LOGO_MISSING: 'package-logo-missing',
  ICON_TYPE_UNSUPPORTED: 'icon-type-unsupported',
  DECODER_UNAVAILABLE: 'decoder-unavailable',
  SUPERSEDED: 'superseded',
  DISPOSED: 'provider-disposed',
  NOT_IN_INVENTORY: 'app-not-in-inventory'
});

// ---------------------------------------------------------------------------
// Small pure helpers (exported for tests)
// ---------------------------------------------------------------------------

function positiveNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

/** Control characters and the null byte have no business in a path. */
function hasControlCharacters(value) {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code <= 31 || code === 127) return true;
  }
  return false;
}

function looksLikeWindowsPath(value) {
  return /^[A-Za-z]:[\\/]/.test(value) || value.includes('\\');
}

function pathModuleFor(value) {
  return looksLikeWindowsPath(value) ? path.win32 : path;
}

function extensionOf(value) {
  return pathModuleFor(value).extname(value).toLowerCase();
}

function isAbsoluteShape(value) {
  return /^[A-Za-z]:[\\/]/.test(value) || value.startsWith('\\\\') || pathModuleFor(value).isAbsolute(value);
}

/** `C:\Windows\...` -> `C:\`; anything else -> null. */
function driveRootOf(value) {
  const match = /^([A-Za-z]):[\\/]/.exec(value);
  return match ? `${match[1].toUpperCase()}:\\` : null;
}

/**
 * The root an icon source has to sit under: `C:\` for a Windows path, `/` for a
 * POSIX one. Requiring a root that really exists is what keeps a freshly mounted
 * or renamed location from being read as an installed application.
 */
function rootOf(value) {
  const windows = driveRootOf(value);
  if (windows) return windows;
  if (looksLikeWindowsPath(value)) return null;
  return path.isAbsolute(value) ? path.sep : null;
}

function hasAllowedExtension(value) {
  return ALLOWED_EXTENSIONS.includes(extensionOf(value));
}

/** A value that at least looks like a location rather than a bare word. */
function looksLikePath(value) {
  const text = String(value || '');
  return text.includes('\\') || text.includes('/') || Boolean(driveRootOf(text));
}

/** Case-insensitive Windows-flavoured containment test. */
function normaliseLocation(value) {
  return String(value || '').replace(/[\\/]+/g, '\\').replace(/\\+$/, '').toLowerCase();
}

function locationInside(root, candidate) {
  const base = normaliseLocation(root);
  const target = normaliseLocation(candidate);
  if (!base || !target) return false;
  return target === base || target.startsWith(`${base}\\`);
}

function dedupe(values) {
  return [...new Set(values)];
}

/** Joins using the path dialect the base path is actually written in. */
function joinPath(base, ...segments) {
  return pathModuleFor(base).join(base, ...segments);
}

function basenameOf(value) {
  return pathModuleFor(value).basename(value);
}

/**
 * Splits a real-world `DisplayIcon` value.
 *
 * Observed shapes: `"C:\Program Files\Foo\foo.exe"`, `C:\Dir\app.exe,0`,
 * `C:\Dir\app.exe -arg`, an `.msi` path, a bare `Foo`, a `%SystemRoot%` token and
 * `C:\Windows\System32\shell32.dll,220`.
 *
 * The trailing `,N` is the index of the icon resource inside the file. It is
 * parsed for completeness and then DROPPED: extraction goes through
 * `SHGetFileInfoW`, which returns the icon the file carries, and the resource
 * index would need `ExtractIconEx`/`LoadIcon` handle work we deliberately do not
 * do here. So `shell32.dll,220` yields shell32's own icon, not icon #220.
 */
function parseDisplayIcon(raw) {
  const original = typeof raw === 'string' ? raw.trim() : '';
  if (!original) return { path: null, index: null };
  const value = expandEnvironmentTokens(original);

  if (value.startsWith('"')) {
    const closing = value.indexOf('"', 1);
    if (closing > 1) {
      const inner = value.slice(1, closing).trim();
      const trailing = value.slice(closing + 1).trim();
      const indexed = /^,\s*(\d+)$/.exec(trailing);
      const split = splitIconIndex(inner);
      return { path: split.path, index: indexed ? Number(indexed[1]) : split.index };
    }
  }

  // Whole value first: unquoted paths with spaces are common in the registry.
  const whole = splitIconIndex(value);
  if (whole.path && hasAllowedExtension(whole.path)) return whole;
  // Otherwise the first whitespace-delimited token, the classic command-line form.
  const token = value.split(/\s+/)[0] || '';
  return splitIconIndex(token);
}

function splitIconIndex(value) {
  const text = String(value || '').trim();
  if (!text) return { path: null, index: null };
  const match = /^(.*[\\/][^\\/]+),\s*(\d+)$/.exec(text) || /^(.*\.(?:exe|dll|ico|msi|png)),\s*(\d+)$/i.exec(text);
  if (match) return { path: match[1].trim(), index: Number(match[2]) };
  return { path: text, index: null };
}

/**
 * `%SystemRoot%\System32\imageres.dll,13` is a legitimate registry value. Only a
 * `%NAME%` token that resolves to an absolute drive path is expanded; anything
 * else is left untouched so the path validator can refuse it.
 */
function expandEnvironmentTokens(value) {
  return String(value).replace(/%([A-Za-z0-9_()]+)%/g, (token, name) => {
    const replacement = process.env[name];
    if (typeof replacement === 'string' && /^[A-Za-z]:[\\/]/.test(replacement.trim())) return replacement.trim().replace(/[\\/]+$/, '');
    return token;
  });
}

/**
 * The first executable-looking token of a command line, used only as a fallback
 * when a registry entry has no `DisplayIcon`. Host processes such as `msiexec.exe`
 * are refused: their icon would describe Windows, not the application.
 */
function executableFromCommand(raw) {
  const value = expandEnvironmentTokens(typeof raw === 'string' ? raw.trim() : '');
  if (!value) return null;
  let candidate = null;
  if (value.startsWith('"')) {
    const closing = value.indexOf('"', 1);
    candidate = closing > 1 ? value.slice(1, closing) : null;
  } else {
    // Unquoted paths may still contain spaces, so tokens are re-joined until one
    // ends in `.exe`/`.dll`; the remaining tokens are arguments, not the program.
    const tokens = value.split(/\s+/).filter(Boolean);
    candidate = tokens[0] || null;
    for (let index = 0; index < tokens.length; index += 1) {
      if (!/\.(exe|dll)$/i.test(tokens[index])) continue;
      candidate = tokens.slice(0, index + 1).join(' ');
      break;
    }
  }
  if (!candidate || candidate.length > MAX_PATH_LENGTH) return null;
  const base = basenameOf(candidate).toLowerCase();
  if (!base || ICON_HOST_EXECUTABLES.includes(base)) return null;
  return candidate;
}

/** Names that could plausibly be the program's own executable in its folder. */
function executableNameGuesses(name) {
  const value = String(name || '').trim();
  if (!value) return [];
  const clean = token => token.replace(/[^\w.+-]/g, '').replace(/^[.-]+/, '');
  const candidates = [clean(value), clean(value.split(/\s+/)[0]), clean(value.split(/\s+/)[0]).toLowerCase()];
  // A separator-free name is never a path, and the caller only accepts a file
  // that really exists, so these guesses can only ever resolve inside the folder.
  return dedupe(candidates.filter(candidate => candidate && candidate.length > 1).map(candidate => `${candidate}.exe`)).slice(0, 3);
}

function stemOf(fileName) {
  return String(fileName || '').split('.')[0] || '';
}

function matchesKnownLogoFamily(fileName) {
  return /^(square\d*x\d*logo|storelogo|widelogo|logo|splashscreen)/i.test(String(fileName || ''));
}

/**
 * Preference order for the qualified logo variants a package ships:
 * a 96px (or 256px / unplated) target size, then the plain 44px logo, then the
 * store logo last because it is the least like the app's own tile icon.
 */
function logoPriority(fileName) {
  const name = String(fileName || '').toLowerCase();
  if (name.startsWith('square44x44logo')) {
    if (name.includes('targetsize-96')) return 0;
    if (name.includes('targetsize-48')) return 1;
    if (name.includes('targetsize-256') && name.includes('altform-unplated')) return 2;
    if (name.includes('targetsize-256')) return 3;
    if (name.includes('altform-unplated')) return 4;
    if (name === 'square44x44logo.png') return 5;
    if (name.includes('scale-100')) return 6;
    return 7;
  }
  if (name.startsWith('square150x150logo')) return name.includes('scale-100') || name.includes('targetsize') ? 8 : 9;
  if (name.startsWith('widelogo')) return 10;
  if (name.startsWith('logo')) return 11;
  if (name.startsWith('storelogo')) return 12;
  return 13;
}

/** Manifest logo paths are package-relative; only plain relative segments pass. */
function safeRelativePathSegments(value) {
  const text = String(value || '').trim();
  if (!text || hasControlCharacters(text)) return null;
  if (/^[A-Za-z]:/.test(text) || text.startsWith('\\') || text.startsWith('/')) return null;
  const segments = text.split(/[\\/]+/).filter(Boolean);
  if (!segments.length || segments.some(segment => segment === '..' || segment === '.')) return null;
  return segments;
}

/** Manifest keys that declare a package logo, in the order we prefer them. */
const LOGO_MANIFEST_KEYS = Object.freeze(['Square44x44Logo', 'Square150x150Logo', 'Square310x310Logo', 'Wide310x150Logo', 'Logo']);

/**
 * Logo paths declared in `AppxManifest.xml`. Both real spellings occur:
 * `Square44x44Logo="Assets\Square44x44Logo.png"` as an attribute and
 * `<uap:Logo>Assets\StoreLogo.png</uap:Logo>` as element text.
 */
function declaredLogoPaths(manifestText) {
  if (!manifestText) return [];
  const found = [];
  const seen = new Set();
  for (const key of LOGO_MANIFEST_KEYS) {
    const attribute = new RegExp(`\\b${key}\\s*=\\s*"([^"]+)"`, 'i').exec(manifestText);
    const element = new RegExp(`<[^>]*?\\b${key}\\b[^>]*>\\s*([^<]+?)\\s*<`, 'i').exec(manifestText);
    const value = (attribute && attribute[1]) || (element && element[1]) || null;
    if (value && !seen.has(value)) { seen.add(value); found.push({ key, value }); }
  }
  return found;
}

function psQuote(value) {
  return String(value).split("'").join("''");
}

/**
 * One PowerShell script per batch. It compiles a tiny shell wrapper, asks the
 * shell for each file's icon, writes one PNG per input index and exits. It never
 * runs, installs, repairs or modifies the target application.
 */
function buildExtractionScript(iconPaths, outputDirectory) {
  const targets = iconPaths.map((unusedValue, index) => joinPath(outputDirectory, `icon-${index}.png`));
  const list = values => values.map(value => `'${psQuote(value)}'`).join(', ');
  return [
    '# KNOuX SmartOrganizer read-only icon extraction.',
    '# SHGetFileInfoW only: the target application is never executed.',
    '$ErrorActionPreference = \'Stop\'',
    `Add-Type -AssemblyName System.Drawing`,
    'Add-Type -TypeDefinition @\'',
    SHELL_ICON_SOURCE,
    '\'@ -ReferencedAssemblies System.Drawing',
    `$paths = @(${list(iconPaths)})`,
    `$targets = @(${list(targets)})`,
    'for ($index = 0; $index -lt $paths.Length; $index = $index + 1) {',
    '  $status = [KnouxAppIconSource]::ExtractToPng($paths[$index], $targets[$index])',
    '  if ($status) { Write-Warning $status }',
    '}',
    'exit 0',
    ''
  ].join('\r\n');
}

const SHELL_ICON_SOURCE = [
  'using System;',
  'using System.Runtime.InteropServices;',
  '',
  'public static class KnouxAppIconSource',
  '{',
  '    [StructLayout(LayoutKind.Sequential)]',
  '    public struct ShellFileInfo',
  '    {',
  '        public IntPtr hIcon;',
  '        public int iIcon;',
  '        public uint dwAttributes;',
  '        [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 260)] public string szDisplayName;',
  '        [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 80)] public string szTypeName;',
  '    }',
  '',
  '    [DllImport("shell32.dll", CharSet = CharSet.Unicode)]',
  '    private static extern IntPtr SHGetFileInfo(string pszPath, uint dwFileAttributes, ref ShellFileInfo psfi, uint cbFileInfo, uint uFlags);',
  '',
  '    [DllImport("user32.dll")]',
  '    private static extern bool DestroyIcon(IntPtr hIcon);',
  '',
  '    // SHGFI_ICON (0x100) with SHGFI_LARGEICON (0). SHGFI_USEFILEATTRIBUTES is',
  '    // deliberately absent: it returns the generic icon of the file class instead',
  '    // of the icon the file itself carries.',
  '    public static string ExtractToPng(string path, string targetPath)',
  '    {',
  '        ShellFileInfo info = new ShellFileInfo();',
  '        IntPtr handle = IntPtr.Zero;',
  '        System.Drawing.Icon icon = null;',
  '        System.Drawing.Bitmap bitmap = null;',
  '        try',
  '        {',
  '            SHGetFileInfo(path, 0u, ref info, (uint)Marshal.SizeOf(info), 0x100u);',
  '            handle = info.hIcon;',
  '            if (handle == IntPtr.Zero) { return "no-shell-icon"; }',
  '            icon = System.Drawing.Icon.FromHandle(handle);',
  '            bitmap = icon.ToBitmap();',
  '            bitmap.Save(targetPath, System.Drawing.Imaging.ImageFormat.Png);',
  '            return null;',
  '        }',
  '        catch (Exception error)',
  '        {',
  '            return error.GetType().Name;',
  '        }',
  '        finally',
  '        {',
  '            if (bitmap != null) { bitmap.Dispose(); }',
  '            if (icon != null) { icon.Dispose(); }',
  '            if (handle != IntPtr.Zero) { DestroyIcon(handle); }',
  '        }',
  '    }',
  '}'
].join('\r\n');

function defaultNativeImage() {
  try {
    const electron = require('electron');
    return electron && electron.nativeImage ? electron.nativeImage : null;
  } catch {
    return null;
  }
}

function defaultTempDirectories() {
  return dedupe([os.tmpdir(), process.env.TEMP, process.env.TMP].filter(value => typeof value === 'string' && value));
}

/**
 * The production spawner. It hands back a handle, because the caller owns the
 * deadline and must be able to kill the child. `done` always resolves; a missing
 * PowerShell resolves with an error name instead of rejecting.
 */
function defaultSpawnPowerShell({ scriptPath, timeoutMs }) {
  let child = null;
  const done = new Promise(resolve => {
    try {
      child = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', scriptPath], {
        windowsHide: true,
        stdio: 'ignore',
        timeout: positiveNumber(timeoutMs, BATCH_TIMEOUT_MS)
      });
    } catch (error) {
      resolve({ exitCode: null, error: String(error && error.code ? error.code : 'spawn-failed') });
      return;
    }
    let settled = false;
    const finish = value => { if (!settled) { settled = true; resolve(value); } };
    child.on('error', error => finish({ exitCode: null, error: String(error && error.code ? error.code : 'powershell-error') }));
    child.on('close', (code, signal) => finish({ exitCode: typeof code === 'number' ? code : null, signal: signal || null }));
  });
  return { done, cancel: () => { try { if (child) child.kill(); } catch { /* the child already left */ } } };
}

const SUPERSEDED = Symbol('knoux-app-icon-superseded');

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

/**
 * @param {object} options
 * @param {string} options.cacheDirectory only directory this provider may write
 * @param {string} [options.platform] defaults to process.platform
 * @param {object} [options.nativeImage] Electron nativeImage (injected for tests)
 * @param {(input:{scriptPath:string,timeoutMs:number})=>{done:Promise<any>,cancel:Function}} [options.spawnPowerShell]
 * @param {string[]} [options.tempDirectories] locations refused for executables
 */
function createAppIconProvider(options = {}) {
  const platform = options.platform || process.platform;
  const cacheDirectory = typeof options.cacheDirectory === 'string' && options.cacheDirectory ? options.cacheDirectory : null;
  const nativeImage = options.nativeImage !== undefined ? options.nativeImage : defaultNativeImage();
  const spawnPowerShell = typeof options.spawnPowerShell === 'function' ? options.spawnPowerShell : defaultSpawnPowerShell;
  const tempDirectories = (Array.isArray(options.tempDirectories) && options.tempDirectories.length ? options.tempDirectories : defaultTempDirectories());
  const driveRootExists = typeof options.driveRootExists === 'function' ? options.driveRootExists : root => fs.existsSync(root);
  const batchSize = positiveNumber(options.batchSize, BATCH_SIZE);
  const batchTimeoutMs = positiveNumber(options.batchTimeoutMs, BATCH_TIMEOUT_MS);
  const killGraceMs = positiveNumber(options.killGraceMs, KILL_GRACE_MS);
  const maxIconFileBytes = positiveNumber(options.maxIconFileBytes, MAX_ICON_FILE_BYTES);
  const maxDiskCacheBytes = positiveNumber(options.maxDiskCacheBytes, MAX_DISK_CACHE_BYTES);
  const maxDiskCacheFiles = positiveNumber(options.maxDiskCacheFiles, MAX_DISK_CACHE_FILES);

  /** Opaque app id -> inventory item. Paths only ever come from here. */
  const inventory = new Map();
  /** Opaque app id -> finished result, most-recently-used. */
  const memory = new Map();
  /** Opaque app id -> in-flight request, so one id is never extracted twice. */
  const pending = new Map();
  /** Waiting shell extractions; at most one batch is ever in flight. */
  const queue = [];
  const openBatchDirectories = new Set();
  let batchInFlight = null;
  let batchBusy = false;
  let diskTally = null;
  let staleBatchesSwept = false;
  let disposed = false;

  // -- result shape ---------------------------------------------------------

  function result(id, status, source, extra) {
    const value = { id, status, source };
    if (extra && typeof extra.dataUrl === 'string') value.dataUrl = extra.dataUrl;
    if (extra && typeof extra.pixels === 'number') value.pixels = extra.pixels;
    if (extra && extra.reason) value.reason = extra.reason;
    return value;
  }
  const unavailable = (id, reason) => result(id, 'unavailable', 'none', { reason });

  // -- path validation: the security boundary ------------------------------

  /**
   * Static shape checks, run before a path is touched at all.
   * Rejects relative paths, UNC and namespace paths, control characters, the
   * null byte and anything outside the icon extension allowlist.
   */
  function inspectShape(rawPath) {
    const value = typeof rawPath === 'string' ? rawPath.trim() : '';
    if (!value || value.length > MAX_PATH_LENGTH) return { ok: false, code: 'no-icon-path', reason: REASONS.NO_ICON_PATH };
    if (hasControlCharacters(value)) return { ok: false, code: 'control-characters', reason: REASONS.PATH_REFUSED };
    // `\\server\share`, `\\?\C:\...` and `\\.\Device\...` are all out: no icon
    // may be pulled in from a remote or device-namespace location.
    if (value.startsWith('\\\\') || value.startsWith('//')) return { ok: false, code: 'unc-or-namespace-path', reason: REASONS.PATH_REFUSED };
    if (!isAbsoluteShape(value)) return { ok: false, code: 'relative-path', reason: REASONS.PATH_REFUSED };
    const extension = extensionOf(value);
    if (!ALLOWED_EXTENSIONS.includes(extension)) return { ok: false, code: 'extension-not-allowed', reason: REASONS.ICON_TYPE_UNSUPPORTED };
    return { ok: true, value, extension };
  }

  /** Full validation: shape, then the real file, then the location rules. */
  async function validateIconPath(rawPath) {
    const shape = inspectShape(rawPath);
    if (!shape.ok) return shape;
    let stats = null;
    try { stats = await fsp.lstat(shape.value); } catch { return { ok: false, code: 'file-missing', reason: REASONS.ICON_FILE_MISSING }; }
    // A link is never followed out of the validated location.
    if (stats.isSymbolicLink()) return { ok: false, code: 'symbolic-link', reason: REASONS.PATH_REFUSED };
    if (!stats.isFile()) return { ok: false, code: 'not-a-file', reason: REASONS.ICON_FILE_MISSING };
    if (Number(stats.size) > maxIconFileBytes) return { ok: false, code: 'file-too-large', reason: REASONS.PATH_REFUSED };
    if (Number(stats.size) === 0) return { ok: false, code: 'empty-file', reason: REASONS.ICON_FILE_MISSING };
    // Executables are the only source handed to PowerShell, so they carry the
    // strictest location rule: a real drive root and never the user's temp area.
    if (SHELL_EXTENSIONS.includes(shape.extension)) {
      if (tempDirectories.some(directory => locationInside(directory, shape.value))) return { ok: false, code: 'inside-temp-directory', reason: REASONS.PATH_REFUSED };
      const root = rootOf(shape.value);
      if (!root) return { ok: false, code: 'no-drive-root', reason: REASONS.PATH_REFUSED };
      if (!driveRootExists(root)) return { ok: false, code: 'drive-unavailable', reason: REASONS.PATH_REFUSED };
    }
    return { ok: true, filePath: shape.value, extension: shape.extension };
  }

  // -- image decoding ------------------------------------------------------

  function emptyImage() {
    return { isEmpty: true };
  }

  function decodeBuffer(buffer) {
    if (!nativeImage || typeof nativeImage.createFromBuffer !== 'function' || !buffer) return emptyImage();
    try { return nativeImage.createFromBuffer(buffer) || emptyImage(); } catch { return emptyImage(); }
  }

  function decodeFile(filePath) {
    if (!nativeImage || typeof nativeImage.createFromPath !== 'function') return emptyImage();
    try { return nativeImage.createFromPath(filePath) || emptyImage(); } catch { return emptyImage(); }
  }

  function isEmptyImage(image) {
    if (!image) return true;
    if (image.isEmpty === true) return true;
    if (typeof image.isEmpty === 'function') { try { return Boolean(image.isEmpty()); } catch { return true; } }
    return true;
  }

  /** Normalise to ICON_EDGE, but only ever downscale: a 32px icon stays 32px. */
  function shrink(image) {
    let size = null;
    try { size = typeof image.getSize === 'function' ? image.getSize() : null; } catch { size = null; }
    const width = Number(size && size.width) || 0;
    const height = Number(size && size.height) || 0;
    if (!width || !height || Math.max(width, height) <= ICON_EDGE) return { image, width: width || ICON_EDGE, height: height || ICON_EDGE };
    try {
      const resized = image.resize({ width: ICON_EDGE, quality: 'best' });
      if (resized && !isEmptyImage(resized)) {
        const next = typeof resized.getSize === 'function' ? resized.getSize() : null;
        return { image: resized, width: Number(next && next.width) || ICON_EDGE, height: Number(next && next.height) || ICON_EDGE };
      }
    } catch { /* keep the original size rather than lose the icon */ }
    return { image, width, height };
  }

  /** Turns a decoded image into the wire result, caching it on success. */
  async function present(id, source, image, resolvedPath) {
    if (isEmptyImage(image)) return null;
    const normalised = shrink(image);
    let png = null;
    try { png = normalised.image.toPNG(); } catch { png = null; }
    if (!png || !png.length) return null;
    const dataUrl = `data:image/png;base64,${Buffer.from(png).toString('base64')}`;
    // `pixels` is the square edge actually produced; a non-square asset reports the
    // width that was rendered, so the renderer never claims a size it does not have.
    await writeDiskCache(resolvedPath, id, png);
    return result(id, 'ready', source, { dataUrl, pixels: normalised.width });
  }

  // -- two-tier cache ------------------------------------------------------

  function cacheFileName(appId, resolvedPath) {
    return `${crypto.createHash('sha1').update(`${appId}|${resolvedPath}|${CACHE_VERSION}`).digest('hex')}.png`;
  }

  async function loadDiskTally() {
    if (diskTally) return diskTally;
    diskTally = new Map();
    if (!cacheDirectory) return diskTally;
    let names = [];
    try { names = await fsp.readdir(cacheDirectory); } catch { return diskTally; }
    for (const name of names.filter(entry => /\.png$/i.test(entry))) {
      try {
        const stats = await fsp.stat(path.join(cacheDirectory, name));
        if (stats.isFile()) diskTally.set(name, { size: Number(stats.size) || 0, mtimeMs: Number(stats.mtimeMs) || 0 });
      } catch { /* a vanished entry is simply not cached */ }
    }
    return diskTally;
  }

  async function readDiskCache(appId, resolvedPath) {
    if (!cacheDirectory) return null;
    const target = path.join(cacheDirectory, cacheFileName(appId, resolvedPath));
    try {
      const buffer = await fsp.readFile(target);
      return buffer && buffer.length ? buffer : null;
    } catch { return null; }
  }

  async function writeDiskCache(resolvedPath, appId, png) {
    if (!cacheDirectory || disposed) return;
    const name = cacheFileName(appId, resolvedPath);
    const bytes = Buffer.from(png);
    try {
      await fsp.mkdir(cacheDirectory, { recursive: true });
      await fsp.writeFile(path.join(cacheDirectory, name), bytes);
      const tally = await loadDiskTally();
      tally.set(name, { size: bytes.length, mtimeMs: Date.now() });
      await evictDiskCache(tally);
    } catch {
      // The disk cache is an optimisation. Losing it never costs the user an icon.
    }
  }

  /** Oldest-first eviction against the byte and file ceilings. */
  async function evictDiskCache(tally) {
    let totalBytes = [...tally.values()].reduce((sum, entry) => sum + entry.size, 0);
    let entries = [...tally.entries()].sort((a, b) => a[1].mtimeMs - b[1].mtimeMs);
    while (entries.length && (entries.length > maxDiskCacheFiles || totalBytes > maxDiskCacheBytes)) {
      const [name, entry] = entries.shift();
      totalBytes -= entry.size;
      tally.delete(name);
      try { await fsp.rm(path.join(cacheDirectory, name), { force: true }); } catch { /* best effort */ }
    }
  }

  function remember(id, finished) {
    memory.delete(id);
    memory.set(id, finished);
    while (memory.size > MAX_MEMORY_RESULTS) memory.delete(memory.keys().next().value);
  }

  function cachedResult(id) {
    if (!memory.has(id)) return null;
    const hit = memory.get(id);
    // Re-insert so the map stays least-recently-used ordered.
    memory.delete(id);
    memory.set(id, hit);
    return hit;
  }

  // -- candidate resolution ------------------------------------------------

  /** Logo files a packaged (AppX/MSIX) application declares or ships. */
  async function packageLogoCandidates(installLocation) {
    let manifestText = null;
    try { manifestText = await fsp.readFile(joinPath(installLocation, 'AppxManifest.xml'), 'utf8'); } catch { manifestText = null; }
    const declared = declaredLogoPaths(manifestText);
    const scans = [];
    for (const entry of declared) {
      const segments = safeRelativePathSegments(entry.value);
      if (!segments) continue;
      const fileName = segments.pop();
      scans.push({ directory: joinPath(installLocation, ...segments), stem: stemOf(fileName) });
    }
    if (!scans.length) scans.push(...['Images', 'Assets'].map(folder => ({ directory: joinPath(installLocation, folder), stem: null })));
    const candidates = [];
    for (const scan of scans) {
      let names = [];
      try { names = await fsp.readdir(scan.directory); } catch { continue; }
      const matching = names
        .filter(name => /\.png$/i.test(name))
        .filter(name => (scan.stem ? stemOf(name).toLowerCase() === scan.stem.toLowerCase() : matchesKnownLogoFamily(name)))
        .sort((a, b) => logoPriority(a) - logoPriority(b) || a.localeCompare(b));
      for (const name of matching) candidates.push(joinPath(scan.directory, name));
    }
    return dedupe(candidates).slice(0, MAX_PACKAGE_LOGO_CANDIDATES);
  }

  /**
   * Ordered list of where this application's icon could come from, plus the
   * reasons for the sources that were rejected on the way. Nothing is touched
   * here; every candidate is validated again before it is used.
   */
  async function collectCandidates(item) {
    const candidates = [];
    const reasons = [];
    const installLocation = typeof item.installLocation === 'string' ? item.installLocation.trim().replace(/[\\/]+$/, '') : '';
    const packageIdentity = typeof item.packageIdentity === 'string' ? item.packageIdentity.trim() : '';

    // 1. Packaged application: a real logo file inside the package.
    if (installLocation && packageIdentity) {
      const logos = await packageLogoCandidates(installLocation);
      for (const logo of logos) candidates.push({ source: 'package', filePath: logo });
      if (!logos.length) reasons.push(REASONS.PACKAGE_LOGO_MISSING);
    }

    // 2/3. The registry's own declaration.
    const parsed = parseDisplayIcon(item.displayIcon);
    let msiDeclared = false;
    if (parsed.path) {
      const extension = extensionOf(parsed.path);
      if (IMAGE_EXTENSIONS.includes(extension)) candidates.push({ source: 'file', filePath: parsed.path, iconIndex: parsed.index });
      else if (SHELL_EXTENSIONS.includes(extension)) candidates.push({ source: 'shell', filePath: parsed.path, iconIndex: parsed.index });
      else if (extension === '.msi') {
        // An MSI carries no program icon of its own: the shell would hand back the
        // generic Windows Installer picture, which is exactly the placeholder this
        // provider must not serve. The declaration is recorded and stopped there.
        msiDeclared = true;
        reasons.push(REASONS.ICON_TYPE_UNSUPPORTED);
      } else if (extension || looksLikePath(parsed.path)) {
        // A path with an extension outside the allowlist (`.bat`, `.txt`).
        candidates.push({ source: 'unknown', filePath: parsed.path, iconIndex: parsed.index });
      } else {
        // A bare word such as `Foo`: it names nothing on disk.
        reasons.push(REASONS.NO_ICON_PATH);
      }
    }

    if (!candidates.length && !msiDeclared) {
      // 3b. No usable declaration: the uninstall command may still name the program.
      const fromCommand = executableFromCommand(item.uninstallString);
      if (fromCommand) candidates.push({ source: 'shell', filePath: fromCommand, iconIndex: null });
    }

    if (!candidates.length && installLocation && !msiDeclared) {
      // 3c. Last resort: `<installLocation>\<name-ish>.exe`, only if it exists.
      for (const guess of executableNameGuesses(item.name)) {
        candidates.push({ source: 'shell', filePath: joinPath(installLocation, guess), iconIndex: null, needsExistence: true });
      }
    }

    return { candidates, reasons };
  }

  // -- batched shell extraction -------------------------------------------

  async function awaitWithDeadline(handle) {
    return await new Promise(resolve => {
      let settled = false;
      const finish = value => { if (!settled) { settled = true; clearTimeout(timer); resolve(value); } };
      const timer = setTimeout(() => {
        // The deadline is owned here so a hung PowerShell can never hold the UI:
        // the child is killed and, after a short grace, the batch is abandoned.
        try { handle.cancel(); } catch { /* already gone */ }
        setTimeout(() => finish({ error: 'timeout' }), killGraceMs);
      }, batchTimeoutMs);
      Promise.resolve(handle && handle.done).then(
        outcome => finish(outcome || { error: 'no-outcome' }),
        () => finish({ error: 'spawn-rejected' })
      );
    });
  }

  async function runBatch(entries) {
    const batchDirectory = joinPath(cacheDirectory, `batch-${crypto.randomUUID()}`);
    const scriptPath = joinPath(batchDirectory, 'extract-icons.ps1');
    openBatchDirectories.add(batchDirectory);
    let outcome = { exitCode: null, error: 'not-started' };
    try {
      await fsp.mkdir(batchDirectory, { recursive: true });
      await fsp.writeFile(scriptPath, buildExtractionScript(entries.map(entry => entry.filePath), batchDirectory), 'utf8');
      batchInFlight = spawnPowerShell({ scriptPath, timeoutMs: batchTimeoutMs });
      outcome = await awaitWithDeadline(batchInFlight);
    } catch {
      outcome = { error: 'batch-failed' };
    }
    // Anything but a clean exit code 0 is a failure: a partial batch would look
    // like missing icons rather than report what actually went wrong.
    const succeeded = !outcome.error && outcome.exitCode === 0;
    for (let index = 0; index < entries.length; index += 1) {
      const entry = entries[index];
      if (disposed || !succeeded) { entry.resolve(null); continue; }
      try {
        const buffer = await fsp.readFile(joinPath(batchDirectory, `icon-${index}.png`));
        entry.resolve(buffer && buffer.length ? buffer : null);
      } catch {
        entry.resolve(null);
      }
    }
    batchInFlight = null;
    openBatchDirectories.delete(batchDirectory);
    try { await fsp.rm(batchDirectory, { recursive: true, force: true }); } catch { /* the batch folder is disposable */ }
  }

  function pump() {
    if (disposed || batchBusy || !queue.length) return;
    const batch = queue.splice(0, batchSize);
    if (!batch.length) return;
    // One batch at a time, and the guard is set synchronously so a second
    // request arriving while the batch is still starting cannot spawn a rival.
    batchBusy = true;
    runBatch(batch)
      .catch(() => { for (const entry of batch) entry.resolve(null); })
      .then(() => { batchBusy = false; pump(); });
  }

  /** Queues one shell extraction and waits for its PNG, bounded by the queue. */
  function requestShellIcon(id, filePath) {
    return new Promise(resolveEntry => {
      queue.push({ id, filePath, resolve: resolveEntry });
      pump();
    });
  }

  async function extractWithShell(id, filePath) {
    const cached = await readDiskCache(id, filePath);
    if (cached) {
      const hit = await present(id, 'shell', decodeBuffer(cached), filePath);
      if (hit) return hit;
    }
    const produced = await requestShellIcon(id, filePath);
    if (produced === SUPERSEDED) return unavailable(id, REASONS.SUPERSEDED);
    if (!produced) return unavailable(id, REASONS.EXTRACTION_FAILED);
    const hit = await present(id, 'shell', decodeBuffer(produced), filePath);
    return hit || unavailable(id, REASONS.EXTRACTION_FAILED);
  }

  // -- per-app resolution --------------------------------------------------

  async function buildResult(id) {
    const item = inventory.get(id);
    if (!item) return result(id, 'unknown-app', 'none', { reason: REASONS.NOT_IN_INVENTORY });
    if (disposed) return unavailable(id, REASONS.DISPOSED);

    const { candidates, reasons } = await collectCandidates(item);
    // Nothing usable was found. The reason is the one the resolution itself
    // produced, so `no-icon-path` and `package-logo-missing` stay distinguishable.
    if (!candidates.length) return unavailable(id, reasons[0] || REASONS.NO_ICON_PATH);

    let lastReason = reasons[0] || REASONS.ICON_FILE_MISSING;
    for (const candidate of candidates) {
      const validated = await validateIconPath(candidate.filePath);
      if (!validated.ok) {
        // A speculative name guess adds nothing to a reason the resolution
        // already knows, such as a package that ships no logo at all.
        if (!candidate.needsExistence) lastReason = validated.reason;
        continue;
      }
      const filePath = validated.filePath;
      if (candidate.source === 'shell') {
        const extracted = await extractWithShell(id, filePath);
        if (extracted.status === 'ready') return extracted;
        // A superseded id stops here: its caller already has the honest answer.
        if (extracted.reason === REASONS.SUPERSEDED) return extracted;
        lastReason = extracted.reason;
        continue;
      }
      const source = candidate.source === 'package' ? 'package' : 'ico';
      // A previously cached render is reused, so a restart never re-decodes a
      // package logo or icon file it has already normalised.
      const cached = await readDiskCache(id, filePath);
      if (cached) {
        const hit = await present(id, source, decodeBuffer(cached), filePath);
        if (hit) return hit;
      }
      // A package logo is decoded from its bytes; a standalone icon file goes
      // through the shell image path first, then falls back to its bytes.
      let image = source === 'package' ? emptyImage() : decodeFile(filePath);
      if (isEmptyImage(image)) {
        let buffer = null;
        try { buffer = await fsp.readFile(filePath); } catch { buffer = null; }
        image = decodeBuffer(buffer);
      }
      const finished = await present(id, source, image, filePath);
      if (finished) return finished;
      lastReason = candidate.source === 'package' ? REASONS.PACKAGE_LOGO_MISSING : REASONS.ICON_FILE_MISSING;
    }
    if (!nativeImage) return unavailable(id, REASONS.DECODER_UNAVAILABLE);
    return unavailable(id, lastReason);
  }

  function settle(id, finished) {
    const entry = pending.get(id);
    if (!entry) return;
    pending.delete(id);
    if (finished.status === 'ready') remember(id, finished);
    entry.resolve(finished);
  }

  function requestIcon(id) {
    if (platform !== 'win32') return Promise.resolve(unavailable(id, REASONS.NOT_WINDOWS));
    if (disposed) return Promise.resolve(unavailable(id, REASONS.DISPOSED));
    const hit = cachedResult(id);
    if (hit) return Promise.resolve(hit);
    const existing = pending.get(id);
    if (existing) return existing.promise;

    let resolveEntry = () => { /* replaced below */ };
    const promise = new Promise(resolve => { resolveEntry = resolve; });
    pending.set(id, { promise, resolve: resolveEntry });
    buildResult(id).then(finished => settle(id, finished)).catch(() => settle(id, unavailable(id, REASONS.EXTRACTION_FAILED)));
    return promise;
  }

  /**
   * Ids that are queued but not yet extracting belong to an older viewport: the
   * renderer only asks for what it can see, so a newer request supersedes them.
   * Their callers get `superseded` and are never negatively cached.
   */
  function dropSupersededQueueEntries(wanted) {
    for (let index = queue.length - 1; index >= 0; index -= 1) {
      const entry = queue[index];
      if (wanted.has(entry.id)) continue;
      queue.splice(index, 1);
      settle(entry.id, unavailable(entry.id, REASONS.SUPERSEDED));
      entry.resolve(SUPERSEDED);
    }
  }

  async function sweepStaleBatchDirectories() {
    if (staleBatchesSwept || !cacheDirectory) return;
    staleBatchesSwept = true;
    let names = [];
    try { names = await fsp.readdir(cacheDirectory); } catch { return; }
    for (const name of names.filter(entry => entry.startsWith('batch-'))) {
      const target = path.join(cacheDirectory, name);
      if (openBatchDirectories.has(target)) continue;
      try { await fsp.rm(target, { recursive: true, force: true }); } catch { /* best effort */ }
    }
  }

  return {
    /**
     * Records the inventory the main process built. Only ids it generated can
     * ever be asked for, so the renderer never controls a path.
     */
    registerInventory(items) {
      if (disposed || !Array.isArray(items)) return { registered: 0 };
      let registered = 0;
      for (const item of items) {
        if (!item || typeof item.id !== 'string' || !item.id) continue;
        inventory.set(item.id, item);
        registered += 1;
      }
      while (inventory.size > MAX_REGISTERED_ITEMS) inventory.delete(inventory.keys().next().value);
      return { registered };
    },

    /** @param {string[]} ids opaque app ids */
    async getIcons(ids) {
      const list = Array.isArray(ids) ? ids.filter(id => typeof id === 'string' && id) : [];
      dropSupersededQueueEntries(new Set(list));
      void sweepStaleBatchDirectories();
      return await Promise.all(list.map(id => requestIcon(id)));
    },

    hasApp(id) { return inventory.has(id); },
    stats() {
      return {
        platform,
        cacheDirectory,
        registered: inventory.size,
        memory: memory.size,
        pending: pending.size,
        queued: queue.length,
        batchInFlight: Boolean(batchInFlight),
        decoderAvailable: Boolean(nativeImage)
      };
    },

    /** Stops everything: kills the child, settles waiters, drops temp batches. */
    dispose() {
      if (disposed) return;
      disposed = true;
      if (batchInFlight) { try { batchInFlight.cancel(); } catch { /* already gone */ } }
      while (queue.length) {
        const entry = queue.shift();
        entry.resolve(SUPERSEDED);
      }
      for (const id of [...pending.keys()]) settle(id, unavailable(id, REASONS.DISPOSED));
      memory.clear();
      for (const directory of [...openBatchDirectories]) {
        fsp.rm(directory, { recursive: true, force: true }).catch(() => { /* disposable */ });
      }
      openBatchDirectories.clear();
    }
  };
}

module.exports = {
  createAppIconProvider,
  defaultSpawnPowerShell,
  buildExtractionScript,
  parseDisplayIcon,
  executableFromCommand,
  executableNameGuesses,
  declaredLogoPaths,
  logoPriority,
  safeRelativePathSegments,
  locationInside,
  driveRootOf,
  rootOf,
  hasAllowedExtension,
  ICON_EDGE,
  BATCH_SIZE,
  BATCH_TIMEOUT_MS,
  MAX_ICON_FILE_BYTES,
  ALLOWED_EXTENSIONS,
  SHELL_EXTENSIONS,
  IMAGE_EXTENSIONS,
  MAX_DISK_CACHE_BYTES,
  MAX_DISK_CACHE_FILES,
  CACHE_VERSION,
  REASONS
};
