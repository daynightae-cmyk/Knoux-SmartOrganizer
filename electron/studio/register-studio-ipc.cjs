'use strict';
/**
 * Canonical KNOuX Studio IPC.
 *
 * One bridge (`window.knouxStudio`) owns the read-only library, native source
 * and destination grants, folder creation, immutable organization plans,
 * verified execution, history, undo and bounded thumbnails. Every channel is
 * allowlisted, typed with Zod, scoped to the owning renderer and backed by a
 * Main-process authorization registry.
 */
const crypto = require('node:crypto');
const os = require('node:os');
const path = require('node:path');
const { z } = require('zod');
const { scanFolder, query, validateSource, inside, KEYS } = require('./folder-inventory.cjs');
const safety = require('./studio-safety.cjs');
const { createOrganizationEngine } = require('./studio-organization.cjs');
const { createThumbnailService } = require('./studio-thumbnails.cjs');

const CH = Object.freeze({
  pick: 'knoux:studio:pick',
  sources: 'knoux:studio:sources',
  remove: 'knoux:studio:remove',
  scan: 'knoux:studio:scan',
  cancel: 'knoux:studio:cancel',
  query: 'knoux:studio:query',
  reveal: 'knoux:studio:reveal',
  event: 'knoux:studio:event',
  pickDestination: 'knoux:studio:destination-pick',
  destinations: 'knoux:studio:destinations',
  listDestination: 'knoux:studio:destination-list',
  validateFolder: 'knoux:studio:folder-validate',
  createFolder: 'knoux:studio:folder-create',
  buildPlan: 'knoux:studio:plan-build',
  executePlan: 'knoux:studio:plan-execute',
  cancelExecution: 'knoux:studio:execution-cancel',
  history: 'knoux:studio:history',
  undoPreview: 'knoux:studio:undo-preview',
  undoApply: 'knoux:studio:undo-apply',
  thumbnail: 'knoux:studio:thumbnail'
});

const uid = z.string().uuid();
const categoryKeys = [...KEYS];
const scanSchema = z.object({ sourceId: uid, operationId: uid }).strict();
const querySchema = z.object({
  inventoryId: uid,
  category: z.enum(['all', ...categoryKeys]).default('all'),
  search: z.string().max(256).default(''),
  sort: z.enum(['name', 'size', 'modified', 'type']).default('name'),
  desc: z.boolean().default(false),
  offset: z.number().int().min(0).default(0),
  limit: z.number().int().min(1).max(200).default(48),
  extensions: z.array(z.string().max(16)).max(24).default([]),
  minBytes: z.number().int().min(0).optional(),
  maxBytes: z.number().int().min(0).optional(),
  modifiedAfter: z.number().int().min(0).optional(),
  modifiedBefore: z.number().int().min(0).optional()
}).strict();
const revealSchema = z.object({ inventoryId: uid, fileId: z.number().int().min(0) }).strict();
const destinationRefSchema = z.object({
  destinationId: uid,
  relativePath: z.string().max(2048).default('')
}).strict();
const listDestinationSchema = z.object({ destinationId: uid, relativePath: z.string().max(2048).default('') }).strict();
const folderSchema = z.object({ destinationId: uid, parentRelative: z.string().max(2048).default(''), name: z.string().max(512) }).strict();
const selectionSchema = z.object({
  inventoryId: uid,
  fileIds: z.array(z.number().int().min(0).max(1000000)).max(10000).optional(),
  category: z.enum(categoryKeys).optional(),
  all: z.boolean().optional()
}).strict();
const buildPlanSchema = z.object({
  selections: z.array(selectionSchema).min(1).max(64),
  operation: z.enum(['virtual', 'copy', 'move']),
  destination: destinationRefSchema.optional(),
  structure: z.enum(['categorized', 'flat']).default('categorized'),
  categoryFolderNames: z.record(z.string().max(255)).default({}),
  categoryDestinations: z.record(destinationRefSchema).default({}),
  collisionPolicy: z.enum(['skip', 'rename', 'review']).default('review')
}).strict();
const executeSchema = z.object({
  planId: uid,
  planHash: z.string().regex(/^[a-f0-9]{64}$/),
  approved: z.literal(true),
  operation: z.enum(['virtual', 'copy', 'move']),
  destinationSummary: z.string().max(8192)
}).strict();
const cancelExecutionSchema = z.object({ operationId: uid }).strict();
const undoPreviewSchema = z.object({ journalId: uid }).strict();
const undoApplySchema = z.object({ journalId: uid, previewId: uid, previewHash: z.string().regex(/^[a-f0-9]{64}$/), resolution: z.enum(['skip', 'rename']), approved: z.literal(true) }).strict();
const thumbnailSchema = z.object({ inventoryId: uid, fileId: z.number().int().min(0) }).strict();

function registerStudioIpc({
  ipcMain,
  dialog,
  shell,
  windowProvider,
  settingsProvider = null,
  nativeImage = null,
  userDataPath = null
}) {
  const sources = new Map();
  const destinations = new Map();
  const inventories = new Map();
  const active = new Map();
  const owner = (event) => event.sender.id;
  const own = (record, event) => record && record.owner === owner(event);
  const send = (event, operationId, phase, more = {}) => {
    if (event?.sender && !event.sender.isDestroyed()) {
      event.sender.send(CH.event, { operationId, phase, at: new Date().toISOString(), ...more });
    }
  };
  const lifecycleOwners = new Set();
  const folderCodes = new Set(['EACCES', 'EPERM', 'EXISTS', 'INVALID_CHARACTER', 'RESERVED_NAME', 'TRAILING_DOT_OR_SPACE', 'NAME_TOO_LONG', 'PATH_TOO_LONG', 'EMPTY', 'EDGE_WHITESPACE', 'DOT_NAME', 'DESTINATION_NOT_FOUND', 'DESTINATION_NOT_DIRECTORY', 'DESTINATION_UNAVAILABLE', 'DESTINATION_LINK_REFUSED', 'PATH_TRAVERSAL', 'ABSOLUTE_RELATIVE_PATH']);
  const safe = (handler) => async (event, raw) => {
    try {
      if (!isTrustedWindow(event)) throw Object.assign(new Error('Studio is restricted to the application main frame.'), { code: 'STUDIO_SENDER_REFUSED' });
      if (!lifecycleOwners.has(owner(event))) {
        lifecycleOwners.add(owner(event));
        event.sender.once('destroyed', () => revokeOwner(owner(event)));
      }
      return await handler(event, raw);
    }
    catch (error) {
      const code = typeof error?.code === 'string' && (error.code.startsWith('STUDIO_') || folderCodes.has(error.code)) ? error.code : (error?.name === 'ZodError' ? 'STUDIO_INPUT_INVALID' : 'STUDIO_FAILURE');
      const message = String(error?.message || 'Studio operation failed').replace(/\s+/g, ' ').slice(0, 500);
      const wrapped = new Error(`${code}: ${message}`);
      wrapped.code = code;
      wrapped.details = error?.details;
      throw wrapped;
    }
  };
  const handle = (channel, handler) => ipcMain.handle(channel, handler);

  const journalPath = userDataPath
    ? (String(userDataPath).toLowerCase().endsWith('.json') ? userDataPath : path.join(userDataPath, 'studio-organization-journal.json'))
    : path.join(os.tmpdir(), `knoux-studio-journal-${process.pid}.json`);
  const engine = createOrganizationEngine({ storagePath: journalPath });
  const thumbnails = createThumbnailService({ nativeImage });

  const isTrustedWindow = (event) => {
    const contents = windowProvider?.()?.webContents;
    return !!contents && !contents.isDestroyed() && event.sender === contents && !!event.senderFrame && event.senderFrame === contents.mainFrame;
  };

  function revokeOwner(ownerId) {
    engine.revokeOwner(ownerId);
    for (const operation of active.values()) if (operation.owner === ownerId) operation.abort.abort();
    for (const [id, record] of inventories) if (record.owner === ownerId) { inventories.delete(id); engine.invalidateInventory(id); }
    for (const [id, record] of sources) if (record.owner === ownerId) sources.delete(id);
    for (const [id, record] of destinations) if (record.owner === ownerId) destinations.delete(id);
    lifecycleOwners.delete(ownerId);
    thumbnails.clear();
  }

  async function checkedDestination(id, event) {
    const grant = destinationFor(id, event);
    if (!grant) throw Object.assign(new Error('Choose this destination again with the native picker.'), { code: 'STUDIO_DESTINATION_NOT_AUTHORIZED' });
    const current = await safety.assertSafeRoute(grant.root);
    if (!grant.identity?.fileIdentity || current.identity?.fileIdentity !== grant.identity.fileIdentity || !destinationFor(id, event)) throw Object.assign(new Error('The authorized destination root changed.'), { code: 'STUDIO_PLAN_STALE' });
    return grant;
  }

  async function pickerLocale() {
    try {
      const settings = settingsProvider ? await settingsProvider() : null;
      return settings?.localization?.locale === 'ar' ? 'ar' : 'en';
    } catch {
      return 'en';
    }
  }

  async function validateDestinationRoot(folder) {
    if (typeof folder !== 'string' || !folder || !path.isAbsolute(folder) || folder.includes('\0')) {
      throw Object.assign(new Error('Invalid destination folder.'), { code: 'STUDIO_DESTINATION_INVALID' });
    }
    const resolved = path.resolve(folder);
    if (resolved === path.parse(resolved).root) {
      throw Object.assign(new Error('Choose a folder below the drive root.'), { code: 'STUDIO_DESTINATION_INVALID' });
    }
    const root = await safety.assertRealDirectory(resolved, 'Destination');
    await safety.assertWritableDirectory(root);
    return root;
  }

  function destinationFor(id, event) {
    const record = destinations.get(id);
    if (!record || record.owner !== owner(event)) return null;
    return { id: record.id, label: record.label, root: record.root, owner: record.owner, identity: record.identity };
  }

  handle(CH.pick, safe(async (event) => {
    const arabic = (await pickerLocale()) === 'ar';
    const answer = await dialog.showOpenDialog(windowProvider(), {
      properties: ['openDirectory'],
      title: arabic ? 'KNOuX · إضافة مصدر تنظيم' : 'KNOuX · Add organization source'
    });
    if (answer.canceled || !answer.filePaths[0]) return null;
    const folder = await validateSource(answer.filePaths[0]);
    const identity = (await safety.assertSafeRoute(folder)).identity;
    if (!isTrustedWindow(event)) throw Object.assign(new Error('The application window closed.'), { code: 'STUDIO_SENDER_REFUSED' });
    const existing = [...sources.values()].find((record) => own(record, event) && safety.keyOf(record.folder) === safety.keyOf(folder));
    if (existing?.identity?.fileIdentity === identity?.fileIdentity) return { id: existing.id, name: path.basename(existing.folder), folder: existing.folder };
    if (existing) {
      sources.delete(existing.id);
      for (const [inventoryId, index] of inventories) if (index.sourceId === existing.id) { inventories.delete(inventoryId); engine.invalidateInventory(inventoryId); }
    }
    const id = crypto.randomUUID();
    sources.set(id, { id, folder, owner: owner(event), identity });
    return { id, name: path.basename(folder), folder };
  }));

  handle(CH.sources, safe(async (event) => [...sources.values()]
    .filter((record) => own(record, event))
    .map((record) => {
      const index = [...inventories.values()].reverse().find((item) => item.sourceId === record.id && own(item, event));
      return {
        id: record.id,
        name: path.basename(record.folder),
        folder: record.folder,
        inventory: index ? {
          inventoryId: index.id,
          sourceId: record.id,
          operationId: index.operationId || 'restored',
          ...index.summary
        } : null
      };
    })));

  handle(CH.remove, safe(async (event, rawId) => {
    const id = uid.parse(rawId);
    const source = sources.get(id);
    if (!own(source, event)) return false;
    for (const [operationId, record] of active) {
      if (record.sourceId === id) {
        record.abort.abort();
        active.delete(operationId);
      }
    }
    const removedInventories = [];
    for (const [inventoryId, record] of inventories) {
      if (record.sourceId === id && own(record, event)) {
        inventories.delete(inventoryId);
        removedInventories.push(inventoryId);
      }
    }
    for (const inventoryId of removedInventories) engine.invalidateInventory(inventoryId);
    sources.delete(id);
    return true;
  }));

  handle(CH.scan, safe(async (event, raw) => {
    const { sourceId, operationId } = scanSchema.parse(raw);
    const source = sources.get(sourceId);
    if (!own(source, event)) throw Object.assign(new Error('Source has not been selected in this window.'), { code: 'STUDIO_SOURCE_NOT_AUTHORIZED' });
    if (active.has(operationId)) throw new Error('Operation ID already in use');
    if ([...active.values()].some((record) => record.owner === owner(event))) throw new Error('Another folder is being indexed');
    if ((await validateSource(source.folder)).toLowerCase() !== source.folder.toLowerCase()) throw new Error('Source changed');
    const abort = new AbortController();
    active.set(operationId, { abort, owner: owner(event), sourceId });
    send(event, operationId, 'started', { type: 'scan', sourceId });
    try {
      const settings = settingsProvider ? await settingsProvider() : null;
      const exclusions = settings?.scanning?.exclusions || [];
      const data = await scanFolder(source.folder, {
        signal: abort.signal,
        exclusions,
        onProgress: (count) => send(event, operationId, 'progress', { type: 'scan', sourceId, ...count })
      });
      if (data.rootIdentity?.fileIdentity !== source.identity?.fileIdentity) throw Object.assign(new Error('Source root changed after authorization.'), { code: 'STUDIO_SOURCE_CHANGED' });
      if (!own(sources.get(sourceId), event) || data.summary.cancelled) {
        send(event, operationId, 'cancelled', { type: 'scan', sourceId });
        return { cancelled: true, partial: true };
      }
      for (const [key, record] of inventories) {
        if (record.sourceId === sourceId && own(record, event)) {
          inventories.delete(key);
          engine.invalidateInventory(key);
        }
      }
      const inventoryId = crypto.randomUUID();
      inventories.set(inventoryId, { ...data, id: inventoryId, sourceId, operationId, owner: owner(event) });
      while (inventories.size > 12) {
        const oldest = inventories.keys().next().value;
        inventories.delete(oldest);
        engine.invalidateInventory(oldest);
      }
      send(event, operationId, 'completed', { type: 'scan', sourceId, inventoryId });
      return { inventoryId, sourceId, operationId, ...data.summary };
    } catch (error) {
      send(event, operationId, 'failed', { type: 'scan', sourceId, message: String(error?.message || error).slice(0, 200) });
      throw error;
    } finally {
      active.delete(operationId);
    }
  }));

  handle(CH.cancel, safe(async (event, raw) => {
    const id = uid.parse(raw);
    const run = active.get(id);
    if (!own(run, event)) return false;
    run.abort.abort();
    return true;
  }));

  handle(CH.query, safe(async (event, raw) => {
    const request = querySchema.parse(raw);
    const index = inventories.get(request.inventoryId);
    if (!own(index, event)) throw Object.assign(new Error('Index not found or expired.'), { code: 'STUDIO_INDEX_NOT_FOUND' });
    return query(index, request);
  }));

  handle(CH.reveal, safe(async (event, raw) => {
    const request = revealSchema.parse(raw);
    const index = inventories.get(request.inventoryId);
    if (!own(index, event)) return false;
    const file = index.files[request.fileId];
    if (!file) return false;
    const target = path.resolve(index.root, ...file.relative.split('/'));
    if (!inside(index.root, target)) return false;
    const root = await safety.assertSafeRoute(index.root);
    if (root.identity?.fileIdentity !== index.rootIdentity?.fileIdentity) return false;
    const stats = await safety.assertSafeRoute(target);
    const before = file.identity;
    if (!stats.regular || !before?.fileIdentity || stats.identity?.fileIdentity !== before.fileIdentity || stats.size !== before.size || Math.abs(stats.modifiedMs - before.modifiedMs) > 0.001) return false;
    if (!own(inventories.get(index.id), event)) return false;
    shell.showItemInFolder(target);
    return true;
  }));

  handle(CH.thumbnail, safe(async (event, raw) => {
    const request = thumbnailSchema.parse(raw);
    const index = inventories.get(request.inventoryId);
    if (!own(index, event)) return { thumbnail: null, reason: 'INDEX_NOT_FOUND' };
    return thumbnails.getThumbnail(index, request.fileId);
  }));

  handle(CH.pickDestination, safe(async (event) => {
    const arabic = (await pickerLocale()) === 'ar';
    const answer = await dialog.showOpenDialog(windowProvider(), {
      properties: ['openDirectory', 'createDirectory'],
      title: arabic ? 'KNOuX · اختيار وجهة التنظيم' : 'KNOuX · Choose an organization destination'
    });
    if (answer.canceled || !answer.filePaths[0]) return null;
    const root = await validateDestinationRoot(answer.filePaths[0]);
    const identity = (await safety.assertSafeRoute(root)).identity;
    if (!isTrustedWindow(event)) throw Object.assign(new Error('The application window closed.'), { code: 'STUDIO_SENDER_REFUSED' });
    const existing = [...destinations.values()].find((record) => record.owner === owner(event) && safety.keyOf(record.root) === safety.keyOf(root));
    if (existing?.identity?.fileIdentity === identity?.fileIdentity) return { id: existing.id, name: existing.label, path: existing.root };
    if (existing) destinations.delete(existing.id);
    const id = crypto.randomUUID();
    const record = { id, label: path.basename(root) || root, root, owner: owner(event), identity, createdAt: Date.now() };
    destinations.set(id, record);
    return { id, name: record.label, path: root };
  }));

  handle(CH.destinations, safe(async (event) => [...destinations.values()]
    .filter((record) => record.owner === owner(event))
    .map((record) => ({ id: record.id, name: record.label, path: record.root }))));

  handle(CH.listDestination, safe(async (event, raw) => {
    const request = listDestinationSchema.parse(raw);
    const authorization = await checkedDestination(request.destinationId, event);
    const current = await safety.resolveWithinRoot(authorization.root, request.relativePath, { create: false, label: 'Destination' });
    const listing = await safety.readDirectoryBounded(current.realPath);
    const relative = path.relative(authorization.root, current.realPath);
    const parentRelative = relative ? path.dirname(relative) === '.' ? '' : path.dirname(relative) : null;
    return {
      destinationId: authorization.id,
      name: authorization.label,
      root: authorization.root,
      path: current.realPath,
      relativePath: relative,
      parentRelative,
      folders: listing.entries
        .filter((entry) => entry.type === 'directory')
        .map((entry) => ({
          name: entry.name,
          relativePath: path.join(relative, entry.name)
        })),
      truncated: listing.truncated
    };
  }));

  handle(CH.validateFolder, safe(async (event, raw) => {
    const request = folderSchema.parse(raw);
    const authorization = await checkedDestination(request.destinationId, event);
    return safety.validateNewFolder({ rootReal: authorization.root, parentRelative: request.parentRelative, name: request.name });
  }));

  handle(CH.createFolder, safe(async (event, raw) => {
    const request = folderSchema.parse(raw);
    const authorization = await checkedDestination(request.destinationId, event);
    const created = await safety.createNewFolder({ rootReal: authorization.root, parentRelative: request.parentRelative, name: request.name });
    return {
      ok: true,
      name: created.name,
      path: created.fullPath,
      relativePath: created.relativePath,
      parentRelative: path.relative(authorization.root, created.parentPath),
      longPath: created.longPath
    };
  }));

  handle(CH.buildPlan, safe(async (event, raw) => {
    const request = buildPlanSchema.parse(raw);
    return engine.buildPlan({
      owner: owner(event),
      request,
      getInventory: (inventoryId, requestOwner) => {
        const index = inventories.get(inventoryId);
        return index && index.owner === requestOwner ? index : null;
      },
      resolveDestination: (destinationId) => destinationFor(destinationId, event)
    });
  }));

  handle(CH.executePlan, safe(async (event, raw) => {
    const request = executeSchema.parse(raw);
    return engine.execute({
      owner: owner(event),
      request,
      emit: (payload) => send(event, payload.operationId, payload.phase, payload)
    });
  }));

  handle(CH.cancelExecution, safe(async (event, raw) => {
    const request = cancelExecutionSchema.parse(raw);
    return engine.cancel({ owner: owner(event), operationId: request.operationId });
  }));

  handle(CH.history, safe(async (event) => {
    if (!isTrustedWindow(event)) throw new Error('History is available only in the application window.');
    return engine.history(owner(event));
  }));

  function authorizeUndoRoot(event, root, kind) {
    const records = kind === 'source' ? sources : destinations;
    return [...records.values()].find(record => own(record, event) && safety.keyOf(record.folder || record.root) === safety.keyOf(root)) || null;
  }

  handle(CH.undoPreview, safe(async (event, raw) => {
    if (!isTrustedWindow(event)) throw new Error('Undo is available only in the application window.');
    const request = undoPreviewSchema.parse(raw);
    return engine.undoPreview({ journalId: request.journalId, owner: owner(event), authorizeRoot: (root, kind) => authorizeUndoRoot(event, root, kind) });
  }));

  handle(CH.undoApply, safe(async (event, raw) => {
    if (!isTrustedWindow(event)) throw new Error('Undo is available only in the application window.');
    const request = undoApplySchema.parse(raw);
    return engine.undoApply({
      journalId: request.journalId,
      previewId: request.previewId,
      previewHash: request.previewHash,
      resolution: request.resolution,
      owner: owner(event),
      authorizeRoot: (root, kind) => authorizeUndoRoot(event, root, kind),
      emit: (payload) => send(event, payload.operationId, payload.phase, payload)
    });
  }));

  return {
    channels: CH,
    engine,
    thumbnails,
    isBusy: () => active.size > 0 || engine.isBusy(),
    dispose() {
      for (const operation of active.values()) operation.abort.abort();
      active.clear();
      engine.dispose();
      thumbnails.clear();
      for (const channel of Object.values(CH)) {
        if (channel !== CH.event && typeof ipcMain.removeHandler === 'function') ipcMain.removeHandler(channel);
      }
      sources.clear();
      destinations.clear();
      inventories.clear();
    }
  };
}

module.exports = { registerStudioIpc, CH, categoryKeys };
