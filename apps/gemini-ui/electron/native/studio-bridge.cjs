'use strict';

/**
 * KNOuX Gemini — read-only Studio native adapter.
 *
 * Reuses the existing root Studio scanner, safety primitives, organization
 * planner and thumbnail provider. It exposes measured source inventory,
 * classification, querying, thumbnails, an immutable preview plan and preview
 * receipts. It deliberately exposes NO execute/undo-write capability; those
 * require an explicit user approval and a separate mission gate.
 */

const fsp = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const os = require('node:os');

function resolveStudioDir() {
  try {
    // app.isPackaged is available before app.whenReady; in a plain Node test
    // the electron module is absent and the repository path is correct.
    const { app } = require('electron');
    if (app && app.isPackaged) return path.join(process.resourcesPath, 'native', 'studio');
  } catch {
    // Not running under Electron.
  }
  return path.resolve(__dirname, '..', '..', '..', '..', 'electron', 'studio');
}

const STUDIO_DIR = resolveStudioDir();

const inventory = require(path.join(STUDIO_DIR, 'folder-inventory.cjs'));
const safety = require(path.join(STUDIO_DIR, 'studio-safety.cjs'));
const CAT = require(path.join(STUDIO_DIR, 'folder-categories.cjs'));
const { createOrganizationEngine } = require(path.join(STUDIO_DIR, 'studio-organization.cjs'));
const { createThumbnailService } = require(path.join(STUDIO_DIR, 'studio-thumbnails.cjs'));

const MAX_FILES = 10000;
const MAX_DEPTH = 32;
const MAX_THUMBNAILS = 24;
const MAX_PREVIEW_PLANS = 20;
const SCAN_TIMEOUT_MS = 120000;
const UI_CATEGORY_MAP = Object.freeze({
  image: ['image'],
  video: ['video'],
  audio: ['audio'],
  document: ['document'],
  spreadsheet: ['spreadsheet'],
  presentation: ['presentation'],
  pdf: ['pdf'],
  archive: ['archive', 'discImage'],
  application: ['installer'],
  design: ['design', 'model'],
  code: ['code'],
  font: ['font'],
  ebook: ['ebook'],
  system: ['config'],
  web: ['markup'],
  other: ['other'],
  database: [],
  folder: [],
});
const ROOT_TO_UI = Object.freeze({
  image: 'image',
  video: 'video',
  audio: 'audio',
  document: 'document',
  spreadsheet: 'spreadsheet',
  presentation: 'presentation',
  pdf: 'pdf',
  archive: 'archive',
  installer: 'application',
  code: 'code',
  markup: 'web',
  config: 'system',
  font: 'font',
  design: 'design',
  model: 'design',
  ebook: 'ebook',
  discImage: 'archive',
  other: 'other',
});

function studioError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function nowIso() {
  return new Date().toISOString();
}

function safeId(value) {
  return typeof value === 'string' && /^[a-f0-9-]{8,64}$/i.test(value) ? value : null;
}

function normalizeCategories(categories) {
  const byUi = new Map();
  for (const stat of Array.isArray(categories) ? categories : []) {
    const rootKey = stat.key || stat.category;
    const uiKey = ROOT_TO_UI[rootKey] || 'other';
    const current = byUi.get(uiKey) || { key: uiKey, count: 0, bytes: 0 };
    current.count += Number(stat.count ?? stat.files) || 0;
    current.bytes += Number(stat.bytes) || 0;
    byUi.set(uiKey, current);
  }
  return Array.from(byUi.values());
}

function expandCategories(input) {
  const values = Array.isArray(input) ? input : input ? [input] : [];
  const result = new Set();
  for (const value of values) {
    if (value === 'all') {
      Object.values(UI_CATEGORY_MAP).forEach((list) => list.forEach((item) => result.add(item)));
      continue;
    }
    if (UI_CATEGORY_MAP[value]) UI_CATEGORY_MAP[value].forEach((item) => result.add(item));
    else if (CAT.CATEGORY_LABELS[value]) result.add(value);
  }
  return Array.from(result);
}

function isProtectedRoot(root) {
  const target = path.resolve(root).toLowerCase();
  const protectedRoots = [
    process.env.SystemRoot,
    process.env.ProgramFiles,
    process.env['ProgramFiles(x86)'],
    process.env.ProgramData,
    'C:\\$Recycle.Bin',
    'C:\\System Volume Information',
  ]
    .filter(Boolean)
    .map((value) => path.resolve(String(value)).toLowerCase());
  return protectedRoots.some((entry) => target === entry || target.startsWith(`${entry}${path.sep}`));
}

class StudioBridge {
  constructor({ userDataPath, nativeImage = null, isPackaged = false, emit = () => {}, chooseFolder = null, env = process.env }) {
    this.userDataPath = userDataPath;
    this.nativeImage = nativeImage;
    this.isPackaged = isPackaged;
    this.emit = emit;
    this.chooseFolder = chooseFolder;
    this.env = env;
    this.root = path.join(userDataPath, 'gemini-studio');
    this.sourcesPath = path.join(this.root, 'sources.json');
    this.historyPath = path.join(this.root, 'preview-history.json');
    this.inventoryDir = path.join(this.root, 'inventories');
    this.sources = [];
    this.inventories = new Map();
    this.destinations = new Map();
    this.activeScans = new Map();
    this.engine = null;
    this.thumbnailService = null;
    this.ready = false;
  }

  async init() {
    if (this.ready) return;
    await fsp.mkdir(this.inventoryDir, { recursive: true });
    this.sources = await this.loadJson(this.sourcesPath, []);
    if (!Array.isArray(this.sources)) this.sources = [];
    this.sources = this.sources.filter((source) => safeId(source?.id) && typeof source.path === 'string');
    for (const source of this.sources) {
      const cached = await this.loadJson(path.join(this.inventoryDir, `${source.id}.json`), null);
      if (cached && cached.root) this.inventories.set(source.id, cached);
    }
    this.engine = createOrganizationEngine({ storagePath: path.join(this.root, 'organization-journal.json') });
    this.thumbnailService = createThumbnailService({ nativeImage: this.nativeImage });
    this.ready = true;
  }

  async loadJson(file, fallback) {
    try {
      return JSON.parse(await fsp.readFile(file, 'utf8'));
    } catch {
      return fallback;
    }
  }

  async writeJson(file, value) {
    await fsp.mkdir(path.dirname(file), { recursive: true });
    const temp = `${file}.${process.pid}.${crypto.randomUUID()}.tmp`;
    await fsp.writeFile(temp, JSON.stringify(value, null, 2), 'utf8');
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        await fsp.rename(temp, file);
        return;
      } catch (error) {
        if (attempt === 4) throw error;
        await new Promise((resolve) => setTimeout(resolve, 30 * (attempt + 1)));
      }
    }
  }

  async persistSources() {
    await this.writeJson(this.sourcesPath, this.sources);
  }

  async persistInventory(sourceId, record) {
    await this.writeJson(path.join(this.inventoryDir, `${sourceId}.json`), record);
  }

  publicSource(source) {
    const record = this.inventories.get(source.id);
    const summary = record?.summary;
    return {
      id: source.id,
      path: source.path,
      label: path.basename(source.path) || source.path,
      addedAt: source.addedAt,
      status: record ? (summary?.partial || summary?.cancelled ? 'partial' : 'ready') : 'needs_scan',
      fileCount: Number(summary?.totalFiles) || 0,
      folderCount: Number(summary?.counts?.folders) || 0,
      fileTypesCount: Array.isArray(summary?.categories) ? summary.categories.length : 0,
      totalBytes: Number(summary?.totalBytes) || 0,
      categories: normalizeCategories(summary?.categories),
      lastScanned: record?.scannedAt || null,
      partial: Boolean(summary?.partial || summary?.cancelled || summary?.truncated),
      warnings: Array.isArray(summary?.warnings) ? summary.warnings.slice(0, 12) : [],
    };
  }

  async listSources() {
    return this.sources.map((source) => this.publicSource(source));
  }

  async chooseSource() {
    if (!this.chooseFolder) throw studioError('STUDIO_PICKER_UNAVAILABLE', 'The native folder picker is not available.');
    const selected = await this.chooseFolder({ title: 'Authorize a source folder (read-only)', buttonLabel: 'Authorize source' });
    if (!selected) return null;
    return this.addSource(selected);
  }

  async addSource(folder) {
    const sourceRoot = await inventory.validateSource(folder);
    if (isProtectedRoot(sourceRoot)) {
      throw studioError('STUDIO_PROTECTED_ROOT', 'Windows system and application roots cannot be authorized in Studio.');
    }
    const existing = this.sources.find((source) => safety.keyOf(source.path) === safety.keyOf(sourceRoot));
    if (existing) return this.publicSource(existing);
    const source = {
      id: crypto.randomUUID(),
      path: sourceRoot,
      addedAt: nowIso(),
      lastScanned: null,
    };
    this.sources.push(source);
    await this.persistSources();
    return this.publicSource(source);
  }

  async removeSource(sourceId) {
    const id = safeId(sourceId);
    const controller = this.activeScans.get(id);
    if (controller) controller.abort();
    const before = this.sources.length;
    this.sources = this.sources.filter((source) => source.id !== id);
    this.inventories.delete(id);
    await fsp.rm(path.join(this.inventoryDir, `${id}.json`), { force: true }).catch(() => {});
    await this.persistSources();
    return { removed: this.sources.length !== before };
  }

  emitProgress(event) {
    try {
      this.emit({
        ...event,
        at: nowIso(),
      });
    } catch {
      // Event delivery is non-fatal; the scan still returns its result.
    }
  }

  async scanSource(sourceId) {
    await this.init();
    const id = safeId(sourceId);
    const source = this.sources.find((entry) => entry.id === id);
    if (!source) throw studioError('STUDIO_SOURCE_NOT_FOUND', 'The source grant no longer exists.');
    if (this.activeScans.has(id)) throw studioError('STUDIO_SCAN_BUSY', 'A scan is already running for this source.');
    const root = await inventory.validateSource(source.path);
    if (isProtectedRoot(root)) throw studioError('STUDIO_PROTECTED_ROOT', 'Windows system roots are not scanned by Studio.');
    const controller = new AbortController();
    this.activeScans.set(id, controller);
    const timer = setTimeout(() => controller.abort(), SCAN_TIMEOUT_MS);
    const startedAt = nowIso();
    try {
      const result = await inventory.scanFolder(root, {
        signal: controller.signal,
        maxFiles: MAX_FILES,
        maxDepth: MAX_DEPTH,
        exclusions: ['.git', 'node_modules', '$RECYCLE.BIN', 'System Volume Information'],
        onProgress: (progress) => {
          this.emitProgress({
            type: 'scan-progress',
            sourceId: id,
            files: progress.files,
            bytes: progress.bytes,
            folders: progress.folders,
            message: 'Reading directory entries (metadata only).',
          });
        },
      });
      const record = {
        version: 1,
        id,
        root: result.root,
        rootIdentity: result.rootIdentity,
        files: result.files,
        summary: result.summary,
        scannedAt: nowIso(),
        startedAt,
      };
      this.inventories.set(id, record);
      await this.persistInventory(id, record);
      source.lastScanned = record.scannedAt;
      await this.persistSources();
      this.emitProgress({
        type: result.summary.cancelled ? 'scan-cancelled' : 'scan-complete',
        sourceId: id,
        files: result.summary.totalFiles,
        bytes: result.summary.totalBytes,
        folders: result.summary.counts?.folders || 0,
        message: result.summary.cancelled ? 'Scan cancelled; partial index preserved.' : 'Read-only inventory complete.',
      });
      return this.publicSource(source);
    } catch (error) {
      const code = typeof error?.code === 'string' ? error.code : 'STUDIO_SCAN_FAILED';
      this.emitProgress({ type: 'scan-failed', sourceId: id, message: 'The source could not be indexed.' });
      throw studioError(code === 'STUDIO_SCAN_FAILED' ? code : code, 'The source could not be indexed.');
    } finally {
      clearTimeout(timer);
      this.activeScans.delete(id);
    }
  }

  cancelScan(sourceId) {
    const id = safeId(sourceId);
    const controller = this.activeScans.get(id);
    if (!controller) return { cancelled: false };
    controller.abort();
    return { cancelled: true };
  }

  query(request = {}) {
    const id = safeId(request.sourceId);
    const record = this.inventories.get(id);
    if (!record) throw studioError('STUDIO_INDEX_UNAVAILABLE', 'The source has not been indexed yet.');
    const roots = expandCategories(request.categories || request.category);
    const search = String(request.search || '').trim().toLowerCase();
    const rows = record.files.filter((file) => {
      if (roots.length && !roots.includes(file.category)) return false;
      if (search && !file.relative.toLowerCase().includes(search) && !file.name.toLowerCase().includes(search)) return false;
      return true;
    });
    const sort = ['name', 'size', 'modified', 'type'].includes(request.sort) ? request.sort : 'name';
    const desc = Boolean(request.desc);
    const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
    rows.sort((a, b) => {
      const compare =
        sort === 'size' ? a.size - b.size :
        sort === 'modified' ? a.modifiedMs - b.modifiedMs :
        sort === 'type' ? collator.compare(a.ext, b.ext) :
        collator.compare(a.relative, b.relative);
      return (desc ? -1 : 1) * (compare || a.id - b.id);
    });
    const offset = Number.isInteger(request.offset) ? Math.max(0, request.offset) : 0;
    const limit = Number.isInteger(request.limit) ? Math.min(200, Math.max(1, request.limit)) : 60;
    const page = rows.slice(offset, offset + limit);
    return {
      sourceId: id,
      total: rows.length,
      bytes: rows.reduce((sum, file) => sum + file.size, 0),
      offset,
      limit,
      rows: page.map((file) => ({
        id: file.id,
        name: file.name,
        relative: file.relative,
        category: file.category,
        uiCategory: ROOT_TO_UI[file.category] || 'other',
        size: file.size,
        ext: file.ext,
        modifiedAt: file.modifiedAt,
        hasThumbnail: ['image', 'video', 'pdf', 'design', 'document', 'spreadsheet', 'presentation'].includes(file.category),
      })),
      partial: Boolean(record.summary?.partial || record.summary?.cancelled || record.summary?.truncated),
      warnings: Array.isArray(record.summary?.warnings) ? record.summary.warnings.slice(0, 12) : [],
    };
  }

  async thumbnails(sourceId, fileIds) {
    await this.init();
    const id = safeId(sourceId);
    const record = this.inventories.get(id);
    if (!record) throw studioError('STUDIO_INDEX_UNAVAILABLE', 'The source has not been indexed yet.');
    const ids = (Array.isArray(fileIds) ? fileIds : [])
      .map((value) => Number(value))
      .filter((value) => Number.isInteger(value) && value >= 0)
      .slice(0, MAX_THUMBNAILS);
    const result = {};
    for (const fileId of ids) {
      const resultEntry = await this.thumbnailService.getThumbnail(record, fileId);
      result[String(fileId)] = {
        thumbnail: resultEntry.thumbnail || null,
        reason: resultEntry.reason || null,
      };
    }
    return result;
  }

  async chooseDestination() {
    if (!this.chooseFolder) throw studioError('STUDIO_PICKER_UNAVAILABLE', 'The native folder picker is not available.');
    const selected = await this.chooseFolder({ title: 'Choose an output destination', buttonLabel: 'Authorize destination' });
    if (!selected) return null;
    const root = await safety.assertRealDirectory(selected, 'Destination');
    if (isProtectedRoot(root)) throw studioError('STUDIO_PROTECTED_ROOT', 'Windows system and application roots cannot be used as destinations.');
    await safety.assertWritableDirectory(root);
    const grant = { id: crypto.randomUUID(), label: path.basename(root) || root, root, selectedAt: nowIso() };
    this.destinations.set(grant.id, grant);
    return { id: grant.id, path: root };
  }

  expandPlanFileIds(request, record) {
    if (Array.isArray(request.fileIds) && request.fileIds.length) {
      const ids = request.fileIds.map((value) => Number(value)).filter((value) => Number.isInteger(value) && value >= 0);
      if (!ids.length) throw studioError('STUDIO_EMPTY_SELECTION', 'Select at least one file.');
      return ids;
    }
    const roots = expandCategories(request.categories || request.category);
    return record.files.filter((file) => !roots.length || roots.includes(file.category)).map((file) => file.id);
  }

  async previewPlan(request = {}) {
    const id = safeId(request.sourceId);
    const source = this.sources.find((entry) => entry.id === id);
    const record = this.inventories.get(id);
    if (!source || !record) throw studioError('STUDIO_INDEX_UNAVAILABLE', 'Index the source before building a plan.');
    const operation = ['copy', 'move', 'virtual'].includes(request.operation) ? request.operation : 'virtual';
    if (operation !== 'virtual') {
      if (!safeId(request.destinationId) || !this.destinations.has(request.destinationId)) {
        throw studioError('STUDIO_DESTINATION_REQUIRED', 'Choose an authorized destination folder before a copy/move plan.');
      }
    }
    const fileIds = this.expandPlanFileIds(request, record);
    if (!fileIds.length) throw studioError('STUDIO_EMPTY_SELECTION', 'The selected category contains no indexed files.');
    if (fileIds.length > 10000) throw studioError('STUDIO_PLAN_TOO_LARGE', 'Narrow the selection to 10,000 files or fewer.');
    const plan = await this.engine.buildPlan({
      owner: 'gemini-studio',
      request: {
        selections: [{ inventoryId: id, fileIds }],
        operation,
        structure: request.structure === 'flat' ? 'flat' : 'categorized',
        collisionPolicy: ['skip', 'rename', 'review'].includes(request.collisionPolicy) ? request.collisionPolicy : 'review',
        ...(operation !== 'virtual' ? { destination: { destinationId: request.destinationId, relativePath: '' } } : {}),
        categoryFolderNames: request.categoryFolderNames && typeof request.categoryFolderNames === 'object' ? request.categoryFolderNames : {},
        categoryDestinations: {},
      },
      getInventory: (inventoryId) => (inventoryId === id ? record : null),
      resolveDestination: (destinationId) => this.destinations.get(destinationId) || null,
    });
    const historyEntry = {
      id: crypto.randomUUID(),
      planHash: plan.planHash,
      createdAt: nowIso(),
      operation,
      files: plan.totals.files,
      bytes: plan.totals.bytes,
      categories: plan.totals.categories,
      sourceRoots: plan.sourceRoots,
      destinationSummary: plan.destinationSummary || null,
      collisions: plan.totals.collisions,
      skipped: plan.totals.skipped,
      warnings: (plan.warnings || []).slice(0, 12),
      previewOnly: true,
    };
    const history = await this.loadJson(this.historyPath, []);
    const nextHistory = [historyEntry, ...(Array.isArray(history) ? history : [])].slice(0, MAX_PREVIEW_PLANS);
    await this.writeJson(this.historyPath, nextHistory);
    return {
      planHash: plan.planHash,
      operation,
      structure: plan.structure,
      collisionPolicy: plan.collisionPolicy,
      destinationSummary: plan.destinationSummary || null,
      files: (plan.files || []).slice(0, 500).map((file) => ({
        index: file.index,
        fileId: file.fileId,
        name: file.name,
        sourceRelative: file.sourceRelative,
        sourceRoot: file.sourceRoot,
        category: file.category,
        size: file.size,
        targetName: file.targetName,
        targetPath: file.targetPath || null,
        targetRelative: file.targetRelative || null,
        status: file.status,
      })),
      truncated: (plan.files || []).length > 500,
      categories: plan.categories || [],
      collisions: plan.collisions || [],
      skipped: plan.skipped || [],
      warnings: plan.warnings || [],
      totals: plan.totals,
      createdAt: plan.createdAt,
      expiresAt: plan.expiresAt,
      previewOnly: true,
      execution: 'blocked_explicit_approval_required',
    };
  }

  async previewHistory() {
    await this.init();
    const history = await this.loadJson(this.historyPath, []);
    return Array.isArray(history) ? history.slice(0, MAX_PREVIEW_PLANS) : [];
  }

  async addSmokeSource(folder) {
    await this.init();
    const source = await this.addSource(folder);
    await this.scanSource(source.id);
    return source;
  }

  async dispose() {
    for (const controller of this.activeScans.values()) controller.abort();
    this.activeScans.clear();
    this.thumbnailService?.clear();
  }
}

module.exports = {
  StudioBridge,
  UI_CATEGORY_MAP,
  MAX_FILES,
  MAX_THUMBNAILS,
  MAX_PREVIEW_PLANS,
};
