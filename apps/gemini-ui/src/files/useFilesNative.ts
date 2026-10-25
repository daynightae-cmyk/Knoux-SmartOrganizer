/**
 * Read-only native state for the Files / Instant Find section.
 *
 * The browser preview keeps its design fixture. A measured source replaces the
 * ledger, distributions and inspector values only after a real scan completes.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  FilesEmptyFoldersResult,
  FilesHashResult,
  FilesMetadata,
  FilesOverview,
  FilesQueryRequest,
  StudioProgressEvent,
  StudioSource,
} from '../../shared/native-contracts';
import type { FileCategoryFilter, FileResultItem } from '../lib/file-inventory';
import {
  cancelFilesScan,
  chooseFilesSource,
  getFilesShell,
  hashFile,
  listFilesSources,
  loadEmptyFolders,
  loadFileMetadata,
  loadFilesOverview,
  loadFilesThumbnails,
  openIndexedFile,
  queryFilesInventory,
  revealIndexedFile,
  scanFilesSource,
  subscribeFilesProgress,
} from './native';

export type FilesDataMode = 'fixture' | 'measured';

export interface FilesQueryFilters {
  search?: string;
  category?: FileCategoryFilter;
  extension?: string;
  sizeFilter?: string;
  dateFilter?: 'any' | 'today' | 'week' | 'month';
  sort?: 'date_desc' | 'name_asc' | 'size_desc';
}

export interface FilesActionResult {
  ok: boolean;
  message: string;
}

const CATEGORY_MAP: Record<string, FileCategoryFilter> = {
  image: 'images',
  video: 'videos',
  audio: 'other',
  document: 'documents',
  spreadsheet: 'documents',
  presentation: 'documents',
  pdf: 'documents',
  ebook: 'documents',
  archive: 'archives',
  application: 'archives',
  code: 'code',
  web: 'code',
  design: 'other',
  font: 'other',
  system: 'other',
  other: 'other',
};

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let index = 0;
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }
  return `${value.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function mapRow(
  row: import('../../shared/native-contracts').StudioQueryFile,
  source: StudioSource | null
): FileResultItem {
  const segments = String(row.relative || '').split('/');
  segments.pop();
  const parentFolder = segments.join('\\') || source?.label || 'Indexed source';
  const ext = String(row.ext || '').toUpperCase();
  const category = CATEGORY_MAP[row.uiCategory] || 'other';
  const modified = new Date(row.modifiedAt);
  return {
    id: `native-${row.id}`,
    nativeFileId: row.id,
    name: row.name,
    parentFolder,
    type: ext ? `${ext} File` : 'File',
    category,
    sizeBytes: row.size,
    sizeFormatted: formatBytes(row.size),
    dateModifiedFormatted: Number.isFinite(modified.getTime())
      ? modified.toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
      : 'Unknown',
    dateModifiedRaw: row.modifiedAt,
    source: source?.label || 'Authorized source',
    exactBytes: row.size,
    provenance: 'Measured read-only index',
  };
}

function sizeBounds(sizeFilter?: string): { minBytes?: number; maxBytes?: number } {
  if (sizeFilter === 'large') return { minBytes: 100 * 1024 * 1024 };
  if (sizeFilter === 'medium') return { minBytes: 10 * 1024 * 1024, maxBytes: 100 * 1024 * 1024 };
  if (sizeFilter === 'small') return { maxBytes: 10 * 1024 * 1024 };
  return {};
}

function dateBound(filter?: FilesQueryFilters['dateFilter']): number | undefined {
  if (!filter || filter === 'any') return undefined;
  const days = filter === 'today' ? 1 : filter === 'week' ? 7 : 30;
  return Date.now() - days * 86_400_000;
}

function sortRequest(sort?: FilesQueryFilters['sort']): Pick<FilesQueryRequest, 'sort' | 'desc'> {
  if (sort === 'name_asc') return { sort: 'name', desc: false };
  if (sort === 'size_desc') return { sort: 'size', desc: true };
  return { sort: 'modified', desc: true };
}

export function useFilesNative() {
  const [available, setAvailable] = useState(false);
  const [mode, setMode] = useState<FilesDataMode>('fixture');
  const [sources, setSources] = useState<StudioSource[]>([]);
  const [source, setSource] = useState<StudioSource | null>(null);
  const [overview, setOverview] = useState<FilesOverview | null>(null);
  const [files, setFiles] = useState<FileResultItem[]>([]);
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState<{ files: number; folders: number; bytes: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [metadata, setMetadata] = useState<FilesMetadata | null>(null);
  const [metadataLoading, setMetadataLoading] = useState(false);
  const [hash, setHash] = useState<FilesHashResult | null>(null);
  const [hashLoading, setHashLoading] = useState(false);
  const [emptyFolders, setEmptyFolders] = useState<FilesEmptyFoldersResult | null>(null);
  const [emptyFoldersLoading, setEmptyFoldersLoading] = useState(false);

  const querySeq = useRef(0);
  const queryTimer = useRef<number | null>(null);
  const lastFilters = useRef<FilesQueryFilters>({});
  const activeSourceRef = useRef<StudioSource | null>(null);
  const sourceIdRef = useRef<string | null>(null);

  const setActiveSource = useCallback((next: StudioSource | null) => {
    activeSourceRef.current = next;
    sourceIdRef.current = next?.id || null;
    setSource(next);
    if (next) setMode('measured');
    else setMode('fixture');
  }, []);

  const reloadOverview = useCallback(async (sourceId: string) => {
    const envelope = await loadFilesOverview(sourceId);
    if (!envelope) return;
    if (envelope.status === 'complete' && envelope.data) {
      setOverview(envelope.data);
      setWarnings(envelope.data.warnings || []);
      setError(null);
    } else {
      setError(envelope.error?.message || 'The measured overview could not be loaded.');
    }
  }, []);

  const reload = useCallback(async (filters: FilesQueryFilters) => {
    lastFilters.current = filters;
    const sourceId = sourceIdRef.current;
    const currentSource = activeSourceRef.current;
    if (!sourceId || !currentSource) return;
    const seq = ++querySeq.current;
    const category = filters.category && filters.category !== 'all' ? filters.category : undefined;
    const request: FilesQueryRequest = {
      sourceId,
      ...(filters.search ? { search: filters.search } : {}),
      ...(category ? { category } : {}),
      ...(filters.extension && filters.extension !== 'All' ? { extension: filters.extension } : {}),
      ...sizeBounds(filters.sizeFilter),
      ...(dateBound(filters.dateFilter) ? { modifiedAfterMs: dateBound(filters.dateFilter) } : {}),
      ...sortRequest(filters.sort),
      limit: 200,
    };
    const envelope = await queryFilesInventory(request);
    if (seq !== querySeq.current) return;
    if (!envelope || envelope.status !== 'complete' || !envelope.data) {
      setFiles([]);
      setError(envelope?.error?.message || 'The measured file query could not be completed.');
      return;
    }
    setError(null);
    const mapped = envelope.data.rows.map((row) => mapRow(row, currentSource));
    setFiles(mapped);
    const ids = envelope.data.rows.filter((row) => row.hasThumbnail).slice(0, 24).map((row) => row.id);
    if (ids.length) {
      const thumbs = await loadFilesThumbnails(sourceId, ids);
      if (seq !== querySeq.current) return;
      if (thumbs?.status === 'complete' && thumbs.data) {
        setFiles((prev) =>
          prev.map((file) =>
            file.nativeFileId != null && thumbs.data?.[String(file.nativeFileId)]?.thumbnail
              ? { ...file, thumbnailUrl: thumbs.data[String(file.nativeFileId)].thumbnail || undefined }
              : file
          )
        );
      }
    }
  }, []);

  const applyReadySource = useCallback(async (next: StudioSource) => {
    setActiveSource(next);
    await reloadOverview(next.id);
    await reload(lastFilters.current);
  }, [reload, reloadOverview, setActiveSource]);

  const scanSource = useCallback(async (sourceId: string) => {
    setScanning(true);
    setError(null);
    setProgress(null);
    try {
      const envelope = await scanFilesSource(sourceId);
      if (!envelope || envelope.status !== 'complete' || !envelope.data) {
        setError(envelope?.error?.message || 'The source could not be indexed.');
        return;
      }
      setSources((prev) => prev.map((entry) => (entry.id === sourceId ? envelope.data as StudioSource : entry)));
      if (sourceIdRef.current === sourceId) {
        setActiveSource(envelope.data);
        await reloadOverview(sourceId);
        await reload(lastFilters.current);
      }
    } finally {
      setScanning(false);
    }
  }, [reload, reloadOverview, setActiveSource]);

  const addSource = useCallback(async () => {
    setError(null);
    const chosen = await chooseFilesSource();
    if (!chosen) return;
    if (chosen.status !== 'complete' || !chosen.data) {
      if (chosen.status !== 'cancelled') setError(chosen.error?.message || 'The source could not be authorized.');
      return;
    }
    const next = chosen.data;
    setSources((prev) => [next, ...prev.filter((entry) => entry.id !== next.id)]);
    await scanSource(next.id);
  }, [scanSource]);

  const cancelScan = useCallback(async () => {
    const sourceId = sourceIdRef.current;
    if (!sourceId) return;
    await cancelFilesScan(sourceId);
  }, []);

  const loadMetadata = useCallback(async (fileId: number) => {
    const sourceId = sourceIdRef.current;
    if (!sourceId) return;
    setMetadataLoading(true);
    setHash(null);
    try {
      const envelope = await loadFileMetadata(sourceId, fileId);
      if (!envelope || envelope.status !== 'complete' || !envelope.data) {
        setMetadata(null);
        setError(envelope?.error?.message || 'The file metadata could not be read.');
        return;
      }
      setMetadata(envelope.data);
      setWarnings((prev) => Array.from(new Set([...prev, ...(envelope.data?.warnings || [])])));
    } finally {
      setMetadataLoading(false);
    }
  }, []);

  const computeHash = useCallback(async (fileId: number) => {
    const sourceId = sourceIdRef.current;
    if (!sourceId) return;
    setHashLoading(true);
    setHash(null);
    try {
      const envelope = await hashFile(sourceId, fileId);
      if (!envelope || envelope.status !== 'complete' || !envelope.data) {
        setError(envelope?.error?.message || 'The file hash could not be computed.');
        return;
      }
      setHash(envelope.data);
    } finally {
      setHashLoading(false);
    }
  }, []);

  const loadEmpty = useCallback(async () => {
    const sourceId = sourceIdRef.current;
    if (!sourceId) return;
    setEmptyFoldersLoading(true);
    try {
      const envelope = await loadEmptyFolders(sourceId, 200);
      if (!envelope || envelope.status !== 'complete' || !envelope.data) {
        setError(envelope?.error?.message || 'Empty-folder discovery failed.');
        return;
      }
      setEmptyFolders(envelope.data);
    } finally {
      setEmptyFoldersLoading(false);
    }
  }, []);

  const openFile = useCallback(async (fileId: number): Promise<FilesActionResult> => {
    const sourceId = sourceIdRef.current;
    if (!sourceId) return { ok: false, message: 'No measured source is active.' };
    const envelope = await openIndexedFile(sourceId, fileId);
    return envelope?.status === 'complete'
      ? { ok: true, message: 'Open request sent to Windows.' }
      : { ok: false, message: envelope?.error?.message || 'Windows could not open the file.' };
  }, []);

  const revealFile = useCallback(async (fileId: number): Promise<FilesActionResult> => {
    const sourceId = sourceIdRef.current;
    if (!sourceId) return { ok: false, message: 'No measured source is active.' };
    const envelope = await revealIndexedFile(sourceId, fileId);
    return envelope?.status === 'complete'
      ? { ok: true, message: 'Explorer reveal requested.' }
      : { ok: false, message: envelope?.error?.message || 'Explorer could not reveal the file.' };
  }, []);

  useEffect(() => {
    const api = getFilesShell();
    if (!api) return;
    setAvailable(true);
    let active = true;
    const unsubscribe = subscribeFilesProgress((event: StudioProgressEvent) => {
      if (!active) return;
      if (event.type === 'scan-progress') {
        setProgress({ files: event.files || 0, folders: event.folders || 0, bytes: event.bytes || 0 });
      }
      if (event.type === 'scan-failed') setError(event.message || 'The source could not be indexed.');
    });
    void (async () => {
      const listed = await listFilesSources();
      if (!active) return;
      if (listed?.status === 'complete' && Array.isArray(listed.data)) {
        setSources(listed.data);
        const ready = listed.data.find((entry) => entry.status === 'ready' || entry.status === 'partial');
        if (ready) {
          await applyReadySource(ready);
        } else {
          setActiveSource(null);
        }
      } else {
        setActiveSource(null);
      }
    })();
    return () => {
      active = false;
      unsubscribe();
      if (queryTimer.current !== null) window.clearTimeout(queryTimer.current);
    };
  }, [applyReadySource, setActiveSource]);

  const scheduleReload = useCallback((filters: FilesQueryFilters) => {
    if (queryTimer.current !== null) window.clearTimeout(queryTimer.current);
    queryTimer.current = window.setTimeout(() => {
      queryTimer.current = null;
      void reload(filters);
    }, 180);
  }, [reload]);

  return {
    available,
    mode,
    sources,
    source,
    overview,
    files,
    scanning,
    progress,
    error,
    warnings,
    metadata,
    metadataLoading,
    hash,
    hashLoading,
    emptyFolders,
    emptyFoldersLoading,
    addSource,
    scanSource,
    cancelScan,
    reload: scheduleReload,
    loadMetadata,
    computeHash,
    loadEmptyFolders: loadEmpty,
    openFile,
    revealFile,
    clearError: () => setError(null),
  };
}
