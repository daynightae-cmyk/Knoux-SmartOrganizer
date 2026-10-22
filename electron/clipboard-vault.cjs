'use strict';
/**
 * KNOuX Clipboard Vault — local, opt-in clipboard history.
 *
 * Design rules that this module enforces rather than merely documents:
 *
 *  - Capture is OFF until the user explicitly enables it. Nothing is observed
 *    before that moment, not even a fingerprint.
 *  - Nothing leaves the machine. There is no network path in this file.
 *  - Content is stored through Electron `safeStorage`, which is backed by the
 *    operating system's protected credential storage on Windows. When the
 *    operating system cannot provide it, the vault degrades to an explicitly
 *    labelled in-memory mode and writes NO plaintext to disk. It never
 *    silently downgrades to unprotected persistence.
 *  - Clipboard content is never written to the operation log.
 *  - Every payload is size-bounded, and the history is bounded by a maximum
 *    item count and a retention period.
 *
 * The Electron APIs are injected so the whole vault can be exercised by unit
 * tests without a desktop session.
 */

const fsp = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');

const DEFAULT_MAX_ITEMS = 200;
const DEFAULT_RETENTION_DAYS = 14;
const DEFAULT_MAX_TEXT_BYTES = 1024 * 1024;
const DEFAULT_MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const DEFAULT_MAX_FILES = 200;
const STORE_VERSION = 1;

/**
 * Heuristic, not a guarantee. Windows exposes no reliable way to tell a
 * password field from ordinary text, so this only flags the narrow shape that
 * is very unlikely to be normal content. It is used to offer protection, never
 * to claim that an item is safe.
 */
function looksSensitive(text) {
  const value = String(text || '').trim();
  if (value.length < 12 || value.length > 256) return false;
  if (/\s/.test(value)) return false;
  if (/^(https?|file):\/\//i.test(value)) return false;
  if (/^[A-Za-z]:[\\/]/.test(value)) return false;
  if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) return false;
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) return false;
  if (!/[A-Za-z]/.test(value)) return false;
  const hasUpper = /[A-Z]/.test(value);
  const hasLower = /[a-z]/.test(value);
  const hasDigit = /[0-9]/.test(value);
  const hasSymbol = /[^A-Za-z0-9]/.test(value);
  const classes = [hasUpper, hasLower, hasDigit, hasSymbol].filter(Boolean).length;
  return classes >= 3;
}

/**
 * Normalises the file references Windows puts on the clipboard.
 *
 * These are WINDOWS paths, so the check uses Windows rules on every host.
 * Using the host rules made a `file:///C:/...` reference resolve against the
 * machine's working directory, which is how a captured file reference
 * disappeared on a non-Windows runner.
 */
function normaliseFileReferences(list) {
  const out = [];
  for (const entry of Array.isArray(list) ? list : []) {
    let value = String(entry || '').trim();
    if (!value) continue;
    if (/^file:\/\//i.test(value)) {
      value = value.slice('file://'.length);
      try { value = decodeURIComponent(value); } catch { /* keep the raw form */ }
      // file:///C:/dir/file.txt -> C:/dir/file.txt
      // file://server/share/file.txt -> \\server\share\file.txt
      if (/^\/[a-z]:/i.test(value)) value = value.slice(1);
      else if (value.startsWith('/')) value = value.replace(/\//g, '\\');
      else value = `\\\\${value.replace(/\//g, '\\')}`;
    }
    const normalized = value.replace(/\//g, '\\');
    if (!path.win32.isAbsolute(normalized)) continue;
    if (out.includes(normalized)) continue;
    out.push(normalized);
    if (out.length >= DEFAULT_MAX_FILES) break;
  }
  return out;
}

function contentFingerprint(payload) {
  return crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

function createClipboardVault({
  safeStorage = null,
  clipboard = null,
  storagePath = null,
  readSettings = async () => ({}),
  onChange = () => {},
  now = () => new Date(),
  pollIntervalMs = 900,
  log = () => {}
} = {}) {
  let items = [];
  let enabled = false;
  let paused = false;
  let privateMode = false;
  let started = false;
  let timer = null;
  let lastFingerprint = null;
  let suppressNext = false;
  let skippedSensitive = 0;
  let skippedOversize = 0;
  let unreadableItems = 0;
  let settings = {};
  let settingsLoaded = false;

  /**
   * Loads the vault policy once. Without this the vault would silently run on
   * its defaults and never observe the user's real preference.
   */
  async function ensureSettings() {
    if (settingsLoaded) return;
    settingsLoaded = true;
    try { settings = (await readSettings()) || {}; }
    catch { settings = {}; }
    applySettings(settings);
  }

  const encryptionAvailable = () => {
    try { return Boolean(safeStorage && typeof safeStorage.isEncryptionAvailable === 'function' && safeStorage.isEncryptionAvailable()); }
    catch { return false; }
  };

  const storageMode = () => (encryptionAvailable() ? 'encrypted' : 'memory-only');

  function resolveSettings() {
    const clipboardSettings = settings?.clipboard || {};
    return {
      enabled: clipboardSettings.enabled === true,
      paused: clipboardSettings.paused === true,
      privateMode: clipboardSettings.privateMode === true,
      maxItems: Math.max(10, Math.min(2000, Number(clipboardSettings.maxItems) || DEFAULT_MAX_ITEMS)),
      retentionDays: Math.max(1, Math.min(365, Number(clipboardSettings.retentionDays) || DEFAULT_RETENTION_DAYS)),
      captureImages: clipboardSettings.captureImages !== false,
      captureFiles: clipboardSettings.captureFiles !== false,
      sensitiveProtection: clipboardSettings.sensitiveProtection !== false
    };
  }

  function applySettings(next) {
    settings = next || {};
    const resolved = resolveSettings();
    enabled = resolved.enabled;
    paused = resolved.paused;
    privateMode = resolved.privateMode;
    return resolved;
  }

  function serialisePayload(item) {
    const payload = { text: item.text ?? null, files: item.files ?? null, image: item.image ?? null };
    return JSON.stringify(payload);
  }

  function encryptPayload(item) {
    if (!encryptionAvailable()) throw new Error('Secure storage is unavailable.');
    const encrypted = safeStorage.encryptString(serialisePayload(item));
    return Buffer.from(encrypted).toString('base64');
  }

  function decryptPayload(encoded) {
    const buffer = Buffer.from(String(encoded || ''), 'base64');
    const text = safeStorage.decryptString(buffer);
    const parsed = JSON.parse(text);
    return { text: parsed.text ?? null, files: Array.isArray(parsed.files) ? parsed.files : null, image: parsed.image ?? null };
  }

  async function persist() {
    // In-memory mode never writes clipboard content to disk.
    if (!storagePath || !encryptionAvailable()) return false;
    const document = {
      version: STORE_VERSION,
      storageMode: 'encrypted',
      updatedAt: now().toISOString(),
      items: items.map(item => ({
        id: item.id, type: item.type, createdAt: item.createdAt, pinned: item.pinned,
        sizeBytes: item.sizeBytes, payload: encryptPayload(item)
      }))
    };
    const temp = `${storagePath}.${process.pid}.${Date.now()}.tmp`;
    await fsp.mkdir(path.dirname(storagePath), { recursive: true });
    await fsp.writeFile(temp, JSON.stringify(document), 'utf8');
    try { await fsp.rename(temp, storagePath); }
    catch (error) {
      await fsp.rm(temp, { force: true }).catch(() => {});
      if (!['EPERM', 'EACCES', 'EBUSY'].includes(error?.code)) throw error;
      await fsp.copyFile(temp, storagePath).catch(() => {});
    }
    return true;
  }

  async function load() {
    items = [];
    unreadableItems = 0;
    if (!storagePath) return;
    let raw;
    try { raw = JSON.parse(await fsp.readFile(storagePath, 'utf8')); }
    catch { return; }
    const list = Array.isArray(raw?.items) ? raw.items : [];
    for (const entry of list) {
      if (!entry?.id || !entry?.payload) continue;
      if (!encryptionAvailable()) { unreadableItems += 1; continue; }
      try {
        const payload = decryptPayload(entry.payload);
        items.push({
          id: entry.id, type: entry.type || 'text', createdAt: entry.createdAt || now().toISOString(),
          pinned: Boolean(entry.pinned), sizeBytes: Number(entry.sizeBytes) || 0,
          text: payload.text, files: payload.files, image: payload.image,
          contentHash: contentFingerprint(payload)
        });
      } catch {
        // A vault that cannot be decrypted (different Windows user, changed key)
        // is reported, not silently emptied.
        unreadableItems += 1;
      }
    }
    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  function prune() {
    const resolved = resolveSettings();
    const cutoff = now().getTime() - resolved.retentionDays * 86400000;
    const pinned = items.filter(item => item.pinned);
    const unpinned = items.filter(item => !item.pinned)
      .filter(item => new Date(item.createdAt).getTime() >= cutoff)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const kept = [...pinned, ...unpinned].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    items = kept.slice(0, resolved.maxItems);
  }

  function publicItem(item, { includeContent = false } = {}) {
    const base = {
      id: item.id, type: item.type, createdAt: item.createdAt, pinned: item.pinned,
      sizeBytes: item.sizeBytes, sensitive: item.type === 'text' ? looksSensitive(item.text) : false,
      preview: item.type === 'text' ? String(item.text || '').slice(0, 240) : (item.type === 'files' ? `${(item.files || []).length} file(s)` : 'image'),
      lineCount: item.type === 'text' ? String(item.text || '').split(/\r?\n/).length : 1
    };
    if (!includeContent) return base;
    return { ...base, text: item.text ?? null, files: item.files ?? null, image: item.image ?? null };
  }

  async function addItem({ type, text = null, files = null, image = null }) {
    const resolved = resolveSettings();
    if (type === 'image' && !resolved.captureImages) return { stored: false, reason: 'images-disabled' };
    if (type === 'files' && !resolved.captureFiles) return { stored: false, reason: 'files-disabled' };
    const payload = { text, files, image };
    const sizeBytes = Buffer.byteLength(text || '', 'utf8') + (image ? Math.floor(image.length * 0.75) : 0);
    const limit = type === 'image' ? DEFAULT_MAX_IMAGE_BYTES : DEFAULT_MAX_TEXT_BYTES;
    if (sizeBytes > limit) { skippedOversize += 1; return { stored: false, reason: 'payload-too-large' }; }
    if (type === 'text' && resolved.sensitiveProtection && looksSensitive(text)) { skippedSensitive += 1; return { stored: false, reason: 'sensitive' }; }
    const contentHash = contentFingerprint(payload);
    const existing = items.find(item => item.contentHash === contentHash);
    if (existing) {
      // Duplicates are collapsed onto the existing entry.
      existing.createdAt = now().toISOString();
      prune();
      await persist();
      onChange();
      return { stored: true, duplicate: true, id: existing.id };
    }
    const item = {
      id: crypto.randomUUID(), type, createdAt: now().toISOString(), pinned: false,
      sizeBytes, text, files, image, contentHash
    };
    items.unshift(item);
    prune();
    await persist();
    onChange();
    return { stored: true, duplicate: false, id: item.id };
  }

  /** Reads the current Windows clipboard without assuming a single format. */
  function readClipboard() {
    if (!clipboard) return null;
    const result = { type: null, text: null, files: null, image: null };
    try {
      const uriList = typeof clipboard.read === 'function' ? clipboard.read('text/uri-list') : null;
      const files = normaliseFileReferences(String(uriList || '').split(/\r?\n/));
      if (files.length) { result.type = 'files'; result.files = files; return result; }
    } catch { /* the format is not available on this clipboard */ }
    try {
      const text = typeof clipboard.readText === 'function' ? clipboard.readText() : null;
      if (typeof text === 'string' && text.length) { result.type = 'text'; result.text = text; return result; }
    } catch { /* ignore */ }
    try {
      const image = typeof clipboard.readImage === 'function' ? clipboard.readImage() : null;
      if (image && !image.isEmpty && typeof image.toPNG === 'function') {
        const png = image.toPNG();
        if (png && png.length) { result.type = 'image'; result.image = png.toString('base64'); return result; }
      }
    } catch { /* ignore */ }
    return null;
  }

  async function poll() {
    await ensureSettings();
    if (!enabled || paused || privateMode) return;
    const current = readClipboard();
    if (!current) return;
    const fingerprint = contentFingerprint({ type: current.type, text: current.text, files: current.files, image: current.image });
    if (fingerprint === lastFingerprint) return;
    const suppressed = suppressNext;
    lastFingerprint = fingerprint;
    if (suppressed) { suppressNext = false; return; }
    const outcome = await addItem(current);
    if (!outcome.stored && outcome.reason === 'payload-too-large') log('warn', 'clipboard.payload-too-large');
  }

  async function tick() {
    try { await poll(); }
    catch (error) { log('warn', 'clipboard.poll-failed', { error: String(error?.message || error) }); }
  }

  function start() {
    if (started || !clipboard) return;
    started = true;
    lastFingerprint = null;
    timer = setInterval(() => { void tick(); }, pollIntervalMs);
    if (typeof timer.unref === 'function') timer.unref();
  }

  function stop() {
    if (timer) clearInterval(timer);
    timer = null;
    started = false;
  }

  function status() {
    const resolved = resolveSettings();
    return {
      enabled: resolved.enabled,
      paused: resolved.paused,
      privateMode: resolved.privateMode,
      running: started,
      monitoring: started && resolved.enabled && !resolved.paused && !resolved.privateMode,
      storageMode: storageMode(),
      persistenceAvailable: Boolean(storagePath) && encryptionAvailable(),
      encryptionAvailable: encryptionAvailable(),
      items: items.length,
      pinned: items.filter(item => item.pinned).length,
      skippedSensitive,
      skippedOversize,
      unreadableItems,
      maxItems: resolved.maxItems,
      retentionDays: resolved.retentionDays,
      captureImages: resolved.captureImages,
      captureFiles: resolved.captureFiles,
      sensitiveProtection: resolved.sensitiveProtection,
      storageBytes: items.reduce((sum, item) => sum + (Number(item.sizeBytes) || 0), 0),
      limits: { maxTextBytes: DEFAULT_MAX_TEXT_BYTES, maxImageBytes: DEFAULT_MAX_IMAGE_BYTES, maxFiles: DEFAULT_MAX_FILES }
    };
  }

  function list({ query = '', type = 'all', pinnedOnly = false } = {}) {
    const needle = String(query || '').trim().toLowerCase();
    const filtered = items.filter(item => {
      if (pinnedOnly && !item.pinned) return false;
      if (type && type !== 'all' && item.type !== type) return false;
      if (!needle) return true;
      const haystack = `${item.text || ''} ${(item.files || []).join(' ')}`.toLowerCase();
      return haystack.includes(needle);
    });
    return filtered.map(item => publicItem(item));
  }

  function get(id) {
    const item = items.find(entry => entry.id === id);
    return item ? publicItem(item, { includeContent: true }) : null;
  }

  async function setPinned(id, pinned) {
    const item = items.find(entry => entry.id === id);
    if (!item) return null;
    item.pinned = Boolean(pinned);
    await persist();
    onChange();
    return publicItem(item);
  }

  async function remove(id) {
    const before = items.length;
    items = items.filter(item => item.id !== id);
    if (items.length === before) return false;
    await persist();
    onChange();
    return true;
  }

  async function clear() {
    const removed = items.length;
    items = [];
    await persist();
    onChange();
    return removed;
  }

  /** Writes an item back to the Windows clipboard so the user can paste it. */
  function copyBack(id) {
    const item = items.find(entry => entry.id === id);
    if (!item || !clipboard) return null;
    suppressNext = true;
    try {
      if (item.type === 'text') clipboard.writeText(String(item.text || ''));
      else if (item.type === 'image' && item.image) {
        const { nativeImage } = require('electron');
        clipboard.writeImage(nativeImage.createFromBuffer(Buffer.from(item.image, 'base64')));
      } else if (item.type === 'files' && item.files?.length) {
        // Windows Explorer reads CF_HDROP, which is the 'FileNameW' clipboard
        // format: a double-null-terminated list of UTF-16LE paths. The plain
        // text is written first so it survives if the drop format is refused.
        const buffer = Buffer.from(`${item.files.join('\0')}\0\0`, 'utf16le');
        clipboard.writeText(item.files.join('\r\n'));
        if (typeof clipboard.writeBuffer === 'function') clipboard.writeBuffer('FileNameW', buffer);
      } else return null;
    } catch (error) {
      log('warn', 'clipboard.copy-back-failed', { error: String(error?.message || error) });
      return null;
    }
    return publicItem(item);
  }

  /** The source paths a captured item refers to, used to open one safely. */
  function sourceFiles(id) {
    const item = items.find(entry => entry.id === id);
    return item?.type === 'files' ? [...(item.files || [])] : [];
  }

  async function updateSettings(nextSettings) {
    settingsLoaded = true;
    const wasEnabled = enabled;
    applySettings(nextSettings);
    const resolved = resolveSettings();
    if (resolved.enabled && !wasEnabled) {
      // Enabling capture is the moment observation begins.
      lastFingerprint = null;
      if (started) await tick();
    }
    if (!resolved.enabled && wasEnabled) {
      lastFingerprint = null;
    }
    onChange();
    return status();
  }

  /** Loads the policy and the stored history. */
  async function init() {
    await ensureSettings();
    await load();
    prune();
    return status();
  }

  return {
    start, stop, status, list, get, setPinned, remove, clear, copyBack, sourceFiles,
    updateSettings, init, load, prune, readClipboard, addItem, poll,
    get enabled() { return enabled; },
    get paused() { return paused; },
    get privateMode() { return privateMode; },
    get itemCount() { return items.length; }
  };
}

module.exports = {
  createClipboardVault,
  looksSensitive,
  normaliseFileReferences,
  contentFingerprint,
  DEFAULT_MAX_ITEMS,
  DEFAULT_RETENTION_DAYS,
  DEFAULT_MAX_TEXT_BYTES,
  DEFAULT_MAX_IMAGE_BYTES
};
