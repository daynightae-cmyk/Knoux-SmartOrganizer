'use strict';

/**
 * KNOuX Gemini — read-only Storage adapter.
 *
 * Volumes come from the measured Windows provider already used by the platform.
 * File content analysis reuses the persisted read-only Files/Studio inventory.
 * Duplicate verification hashes a bounded set of indexed files through the
 * Files adapter. No cleanup, deletion, defragmentation, TRIM or mutation is
 * exposed.
 */

const fsp = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');

const MAX_TREE_DEPTH = 4;
const MAX_TREE_NODES = 2000;
const MAX_CHILDREN = 12;
const MAX_HISTORY = 120;
const MAX_DUPLICATE_GROUPS = 20;
const MAX_DUPLICATE_FILES = 48;
const MAX_DUPLICATE_BYTES = 256 * 1024 * 1024;
const MIN_DUPLICATE_BYTES = 1024 * 1024;

function storageError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function safeId(value) {
  return typeof value === 'string' && /^[a-f0-9-]{8,64}$/i.test(value) ? value : null;
}

function nowIso() {
  return new Date().toISOString();
}

function volumeLetter(deviceId) {
  const text = String(deviceId || '');
  const match = text.match(/([A-Za-z]):/);
  return match ? `${match[1].toUpperCase()}:` : text || '—';
}

class StorageBridge {
  constructor({ studio, files, readSystemSummary, userDataPath }) {
    if (!studio || !files) throw new Error('StorageBridge requires the Studio and Files adapters.');
    this.studio = studio;
    this.files = files;
    this.readSystemSummary = readSystemSummary;
    this.root = path.join(userDataPath, 'gemini-storage');
    this.historyPath = path.join(this.root, 'capacity-history.json');
    this.ready = false;
  }

  async init() {
    if (this.ready) return;
    await fsp.mkdir(this.root, { recursive: true });
    this.ready = true;
  }

  async loadHistory() {
    try {
      const parsed = JSON.parse(await fsp.readFile(this.historyPath, 'utf8'));
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  async appendHistory(snapshot) {
    const history = await this.loadHistory();
    history.push(snapshot);
    const trimmed = history.slice(-MAX_HISTORY);
    const temp = `${this.historyPath}.${process.pid}.${crypto.randomUUID()}.tmp`;
    await fsp.writeFile(temp, JSON.stringify(trimmed, null, 2), 'utf8');
    await fsp.rename(temp, this.historyPath);
    return trimmed;
  }

  async volumes() {
    await this.init();
    if (typeof this.readSystemSummary !== 'function') {
      throw storageError('STORAGE_VOLUME_PROVIDER_MISSING', 'The measured volume provider is unavailable.');
    }
    const envelope = await this.readSystemSummary();
    const data = envelope?.data;
    if (!data || !Array.isArray(data.volumes)) {
      throw storageError(envelope?.error?.code || 'STORAGE_VOLUME_FAILED', envelope?.error?.message || 'The Windows volume provider did not return a measurement.');
    }
    const volumes = data.volumes.map((volume) => {
      const totalBytes = Number(volume.sizeBytes) || 0;
      const freeBytes = Number(volume.freeBytes) || 0;
      const usedBytes = Math.max(0, totalBytes - freeBytes);
      return {
        id: `volume:${String(volume.deviceId || '').toLowerCase()}`,
        deviceId: volume.deviceId || null,
        letter: volumeLetter(volume.deviceId),
        label: volume.label || 'Mounted volume',
        fileSystem: volume.fileSystem || 'Unknown',
        totalBytes,
        freeBytes,
        usedBytes,
        usedPercent: totalBytes ? Math.round((usedBytes / totalBytes) * 1000) / 10 : 0,
        freePercent: totalBytes ? Math.round((freeBytes / totalBytes) * 1000) / 10 : 0,
        isLowSpace: totalBytes > 0 && freeBytes / totalBytes < 0.1,
        physicalDevice: null,
        physicalDeviceAvailable: false,
        smartAvailable: false,
        readOnly: true,
      };
    });
    const snapshot = {
      capturedAt: nowIso(),
      source: envelope.source || 'Win32 logical disks',
      volumes: volumes.map((volume) => ({
        deviceId: volume.deviceId,
        totalBytes: volume.totalBytes,
        freeBytes: volume.freeBytes,
      })),
    };
    let history = [];
    let historyWarning = null;
    try {
      history = await this.appendHistory(snapshot);
    } catch {
      historyWarning = 'Capacity history could not be persisted; current capacity is still measured.';
    }
    return {
      volumes,
      history,
      observedAt: envelope.observedAt || nowIso(),
      provider: envelope.source || 'Win32 logical disks',
      status: envelope.status || 'complete',
      coverage: envelope.provenance?.coverage || 'unknown',
      warnings: [...(envelope.warnings || []), ...(historyWarning ? [historyWarning] : [])],
      hardwareIdentityAvailable: false,
      smartAvailable: false,
    };
  }

  async history() {
    await this.init();
    return {
      points: await this.loadHistory(),
      retention: MAX_HISTORY,
      note: 'Snapshots are captured only while this application reads the measured volume provider.',
    };
  }

  requireSource(sourceId) {
    const id = safeId(sourceId);
    if (!id) throw storageError('STORAGE_SOURCE_INVALID', 'Authorize a folder before analyzing storage.');
    const source = this.studio.getSource(id);
    const record = this.studio.getInventory(id);
    if (!source) throw storageError('STORAGE_SOURCE_NOT_FOUND', 'The source grant no longer exists.');
    if (!record) throw storageError('STORAGE_INDEX_UNAVAILABLE', 'The authorized folder has not been indexed.');
    return { id, source, record };
  }

  buildTree(record) {
    const root = { relative: '', name: path.basename(record.root) || record.root, sizeBytes: 0, files: 0, children: new Map() };
    for (const file of record.files) {
      const size = Number(file.size) || 0;
      const dirs = String(file.relative || '').split('/').slice(0, -1);
      root.sizeBytes += size;
      root.files += 1;
      let node = root;
      for (const dir of dirs) {
        if (!node.children.has(dir)) {
          node.children.set(dir, {
            relative: node.relative ? `${node.relative}/${dir}` : dir,
            name: dir,
            sizeBytes: 0,
            files: 0,
            children: new Map(),
          });
        }
        node = node.children.get(dir);
        node.sizeBytes += size;
        node.files += 1;
      }
    }

    let nodeCount = 0;
    const serialize = (node, depth) => {
      nodeCount += 1;
      const children = [...node.children.values()]
        .sort((a, b) => b.sizeBytes - a.sizeBytes || a.name.localeCompare(b.name))
        .slice(0, MAX_CHILDREN)
        .filter(() => depth < MAX_TREE_DEPTH && nodeCount < MAX_TREE_NODES)
        .map((child) => serialize(child, depth + 1));
      return {
        id: node.relative ? `folder:${node.relative}` : 'folder:root',
        relative: node.relative,
        name: node.name,
        sizeBytes: node.sizeBytes,
        files: node.files,
        children,
      };
    };

    const tree = serialize(root, 0);
    const rootFilesBytes = Math.max(0, root.sizeBytes - [...root.children.values()].reduce((sum, child) => sum + child.sizeBytes, 0));
    const rootFiles = root.files - [...root.children.values()].reduce((sum, child) => sum + child.files, 0);
    if (rootFiles > 0) {
      tree.children.push({
        id: 'folder:__root_files__',
        relative: '',
        name: '(root files)',
        sizeBytes: rootFilesBytes,
        files: rootFiles,
        children: [],
      });
    }
    tree.children.sort((a, b) => b.sizeBytes - a.sizeBytes);
    return { tree, truncated: nodeCount >= MAX_TREE_NODES };
  }

  async analysis(sourceId) {
    const { source, record } = this.requireSource(sourceId);
    const overview = await this.files.overview(sourceId);
    if (!overview) throw storageError('STORAGE_OVERVIEW_FAILED', 'The measured file overview is unavailable.');
    const { tree, truncated } = this.buildTree(record);
    const rootFolders = tree.children
      .filter((node) => node.id !== 'folder:__root_files__')
      .slice(0, 12)
      .map((node) => ({
        id: node.id,
        name: node.name,
        relative: node.relative,
        sizeBytes: node.sizeBytes,
        files: node.files,
        children: node.children.slice(0, 5).map((child) => ({
          id: child.id,
          name: child.name,
          relative: child.relative,
          sizeBytes: child.sizeBytes,
          files: child.files,
        })),
      }));

    const sizeGroups = new Map();
    for (const file of record.files) {
      if (Number(file.size) < MIN_DUPLICATE_BYTES) continue;
      const list = sizeGroups.get(file.size) || [];
      list.push(file);
      sizeGroups.set(file.size, list);
    }
    const duplicateCandidates = [...sizeGroups.entries()]
      .filter(([, group]) => group.length > 1)
      .map(([size, group]) => ({
        sizeBytes: Number(size),
        count: group.length,
        wastedBytes: Number(size) * (group.length - 1),
        files: group.slice(0, 6).map((file) => ({
          id: file.id,
          name: file.name,
          relative: file.relative,
          size: file.size,
          modifiedAt: file.modifiedAt,
        })),
        truncatedFiles: Math.max(0, group.length - 6),
      }))
      .sort((a, b) => b.wastedBytes - a.wastedBytes)
      .slice(0, MAX_DUPLICATE_GROUPS);

    return {
      sourceId,
      source,
      totals: {
        ...overview.totals,
        analyzedBytes: tree.sizeBytes,
      },
      coverage: {
        files: record.files.length,
        folders: source.folderCount,
        partial: Boolean(record.summary?.partial || record.summary?.truncated || truncated),
        warnings: [...(overview.warnings || []), ...(truncated ? ['Treemap node limit reached; deeper folders are aggregated.'] : [])],
        lastScanned: overview.scannedAt,
        scope: record.root,
        scopeKind: 'authorized-folder',
        coversWholeVolume: false,
      },
      tree,
      folders: rootFolders,
      largest: overview.largest,
      recent: overview.recent,
      categories: overview.categories,
      extensions: overview.extensions,
      ages: overview.ages,
      duplicateCandidates,
      duplicatePolicy: {
        candidatesAreSizeMatches: true,
        contentVerified: false,
        minimumBytes: MIN_DUPLICATE_BYTES,
        maxGroups: MAX_DUPLICATE_GROUPS,
        maxVerifiedFiles: MAX_DUPLICATE_FILES,
        maxVerifiedBytes: MAX_DUPLICATE_BYTES,
      },
      permission: 'read-only',
    };
  }

  async verifyDuplicates(sourceId) {
    const { record } = this.requireSource(sourceId);
    const groupsBySize = new Map();
    for (const file of record.files) {
      if (Number(file.size) < MIN_DUPLICATE_BYTES) continue;
      const list = groupsBySize.get(file.size) || [];
      list.push(file);
      groupsBySize.set(file.size, list);
    }
    const candidates = [...groupsBySize.entries()]
      .filter(([, group]) => group.length > 1)
      .sort((a, b) => (b[0] * (b[1].length - 1)) - (a[0] * (a[1].length - 1)))
      .slice(0, MAX_DUPLICATE_GROUPS);

    const hashes = new Map();
    let filesHashed = 0;
    let bytesHashed = 0;
    let budgetReached = false;
    const errors = [];
    for (const [size, group] of candidates) {
      for (const file of group.slice(0, 6)) {
        if (filesHashed >= MAX_DUPLICATE_FILES || bytesHashed + Number(size) > MAX_DUPLICATE_BYTES) {
          budgetReached = true;
          break;
        }
        try {
          const result = await this.files.hash(sourceId, file.id, 'sha256');
          if (result.changedDuringRead || !result.digestReliable) {
            errors.push({ fileId: file.id, name: file.name, code: 'FILES_FILE_CHANGED', message: 'The file changed while it was hashed and was excluded.' });
            continue;
          }
          filesHashed += 1;
          bytesHashed += Number(size) || 0;
          const key = `${size}:${result.digest}`;
          const entry = hashes.get(key) || { size, digest: result.digest, files: [] };
          entry.files.push({ id: file.id, name: file.name, relative: file.relative, size: file.size, modifiedAt: file.modifiedAt });
          hashes.set(key, entry);
        } catch (error) {
          errors.push({ fileId: file.id, name: file.name, code: error?.code || 'HASH_FAILED', message: String(error?.message || 'Hash failed.').slice(0, 160) });
        }
      }
      if (budgetReached) break;
    }

    const verified = [...hashes.values()]
      .filter((group) => group.files.length > 1)
      .map((group) => ({
        ...group,
        count: group.files.length,
        wastedBytes: group.size * (group.files.length - 1),
      }))
      .sort((a, b) => b.wastedBytes - a.wastedBytes);

    return {
      groups: verified,
      summary: {
        candidates: candidates.length,
        filesHashed,
        bytesHashed,
        verifiedGroups: verified.length,
        reclaimableVerifiedBytes: verified.reduce((sum, group) => sum + group.wastedBytes, 0),
        budgetReached,
        maxFiles: MAX_DUPLICATE_FILES,
        maxBytes: MAX_DUPLICATE_BYTES,
      },
      errors: errors.slice(0, 12),
      warnings: [
        ...(budgetReached ? ['Duplicate verification reached its bounded file/byte budget; results are partial.'] : []),
        ...(errors.length ? [`${errors.length} candidate file(s) could not be hashed and were excluded.`] : []),
      ],
      permission: 'read-only',
      mutation: 'none',
    };
  }
}

module.exports = { StorageBridge };
