/**
 * KNOuX SmartOrganizer — Studio Context & State Manager
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  AuthorizedFolder,
  CategoryInfo,
  CategoryKey,
  GroupingRule,
  HistoryJournalEntry,
  InventoryStats,
  NamingRule,
  OperationMode,
  PotentialConflict,
  StudioCollection,
  StudioFileItem,
  StudioStage,
  StudioStageId,
  StudioSuggestion,
} from './types';
import {
  FILE_CATEGORIES,
  IMAGE_GALLERY_FIXTURE,
  INITIAL_AUTHORIZED_FOLDERS,
  INITIAL_COLLECTIONS,
  INITIAL_CONFLICTS,
  INITIAL_HISTORY_JOURNAL,
  INITIAL_INVENTORY,
  INITIAL_STAGES,
  INITIAL_SUGGESTIONS,
} from './mockData';
import {
  cancelStudioScan,
  chooseStudioDestination,
  chooseStudioSource,
  getStudioShell,
  listStudioSources,
  loadStudioPreviewHistory,
  loadStudioThumbnails,
  previewStudioPlan,
  queryStudioInventory,
  removeStudioSource,
  scanStudioSource,
  subscribeStudioEvents,
} from './native';
import type {
  StudioPlanPreview,
  StudioPreviewHistoryEntry,
  StudioProgressEvent,
  StudioSource,
} from '../../shared/native-contracts';

export type ActiveModalType =
  | null
  | 'add_folder'
  | 'edit_categories'
  | 'change_destination'
  | 'edit_naming'
  | 'edit_grouping'
  | 'conflict_details'
  | 'review_plan'
  | 'command_center';

export interface StudioContextValue {
  stages: StudioStage[];
  activeStageId: StudioStageId;
  setActiveStageId: (id: StudioStageId) => void;

  authorizedSources: AuthorizedFolder[];
  addAuthorizedSource: (path: string) => void;
  removeAuthorizedSource: (id: string) => void;
  refreshSources: () => void;

  inventory: InventoryStats;
  categories: CategoryInfo[];
  selectedCategoryKey: CategoryKey;
  setSelectedCategoryKey: (key: CategoryKey) => void;

  files: StudioFileItem[];
  selectedFileIds: Set<string>;
  toggleFileSelection: (id: string) => void;
  selectAllFiles: () => void;
  deselectAllFiles: () => void;

  viewMode: 'grid' | 'list';
  setViewMode: (mode: 'grid' | 'list') => void;
  sortOrder: 'date_newest' | 'date_oldest' | 'name_asc' | 'size_desc';
  setSortOrder: (order: 'date_newest' | 'date_oldest' | 'name_asc' | 'size_desc') => void;

  destinationPath: string;
  setDestinationPath: (path: string) => void;

  namingRule: NamingRule;
  setNamingRule: React.Dispatch<React.SetStateAction<NamingRule>>;

  groupingRule: GroupingRule;
  setGroupingRule: React.Dispatch<React.SetStateAction<GroupingRule>>;

  operationMode: OperationMode;
  setOperationMode: (mode: OperationMode) => void;

  conflicts: PotentialConflict[];
  collections: StudioCollection[];
  historyJournal: HistoryJournalEntry[];
  suggestions: StudioSuggestion[];

  dismissSuggestion: (id: string) => void;
  revertJournalEntry: (id: string) => void;

  activeModal: ActiveModalType;
  openModal: (modal: ActiveModalType) => void;
  closeModal: () => void;

  locale: 'en' | 'ar';
  setLocale: (locale: 'en' | 'ar') => void;

  native: {
    available: boolean;
    mode: 'fixture' | 'measured';
    sourceId: string | null;
    scanning: boolean;
    progress: { files: number; bytes: number; folders: number } | null;
    error: string | null;
    warnings: string[];
    destination: { id: string; path: string } | null;
    plan: StudioPlanPreview | null;
    planLoading: boolean;
    planError: string | null;
    previewHistory: StudioPreviewHistoryEntry[];
  };
  addNativeSource: () => Promise<void>;
  scanActiveSource: () => Promise<void>;
  cancelActiveScan: () => Promise<void>;
  chooseNativeDestination: () => Promise<void>;
  previewNativePlan: (operationOverride?: OperationMode) => Promise<void>;

  // Simulator controls
  simulateZeroSources: () => void;
  simulateScanningState: () => void;
  simulatePermissionError: () => void;
  resetToDefaultScreenshotFixture: () => void;
}

const StudioContext = createContext<StudioContextValue | undefined>(undefined);

export function StudioProvider({ children }: { children: ReactNode }) {
  const [stages, setStages] = useState<StudioStage[]>(INITIAL_STAGES);
  const [activeStageId, setActiveStageIdState] = useState<StudioStageId>(2); // Stage 2: Visual Library default in screenshot
  const [authorizedSources, setAuthorizedSources] = useState<AuthorizedFolder[]>(INITIAL_AUTHORIZED_FOLDERS);
  const [inventory, setInventory] = useState<InventoryStats>(INITIAL_INVENTORY);
  const [categories, setCategories] = useState<CategoryInfo[]>(FILE_CATEGORIES);
  const [selectedCategoryKey, setSelectedCategoryKeyState] = useState<CategoryKey>('image');
  const [files, setFiles] = useState<StudioFileItem[]>(IMAGE_GALLERY_FIXTURE);

  // Default checked item: mountain-lake.jpg as shown in reference image
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set(['img-1']));

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortOrder, setSortOrder] = useState<'date_newest' | 'date_oldest' | 'name_asc' | 'size_desc'>('date_newest');

  const [destinationPath, setDestinationPath] = useState<string>('D:\\Organized\\Images\\');
  const [operationMode, setOperationMode] = useState<OperationMode>('copy');

  const [namingRule, setNamingRule] = useState<NamingRule>({
    id: 'name-rule-1',
    name: 'Keep original name',
    strategy: 'original',
    duplicateHandling: 'add_date',
    descriptionEn: 'Keep original name\nAdd date if duplicate exists (YYYY-MM-DD)',
    descriptionAr: 'الاحتفاظ بالاسم الأصلي\nإضافة التاريخ عند وجود تكرار (YYYY-MM-DD)',
  });

  const [groupingRule, setGroupingRule] = useState<GroupingRule>({
    id: 'group-rule-1',
    groupBy: 'capture_date',
    structure: 'YYYY \\ MM \\ DD',
    descriptionEn: 'Group by: Capture Date\nStructure: YYYY \\ MM \\ DD',
    descriptionAr: 'تجميع حسب: تاريخ الالتقاط\nالهيكل: YYYY \\ MM \\ DD',
  });

  const [conflicts, setConflicts] = useState<PotentialConflict[]>(INITIAL_CONFLICTS);
  const [collections, setCollections] = useState<StudioCollection[]>(INITIAL_COLLECTIONS);
  const [historyJournal, setHistoryJournal] = useState<HistoryJournalEntry[]>(INITIAL_HISTORY_JOURNAL);
  const [suggestions, setSuggestions] = useState<StudioSuggestion[]>(INITIAL_SUGGESTIONS);

  const [activeModal, setActiveModal] = useState<ActiveModalType>(null);
  const [locale, setLocale] = useState<'en' | 'ar'>('en');

  const [nativeAvailable, setNativeAvailable] = useState(false);
  const [dataMode, setDataMode] = useState<'fixture' | 'measured'>('fixture');
  const [nativeSourceId, setNativeSourceId] = useState<string | null>(null);
  const [nativeScanning, setNativeScanning] = useState(false);
  const [nativeProgress, setNativeProgress] = useState<{ files: number; bytes: number; folders: number } | null>(null);
  const [nativeError, setNativeError] = useState<string | null>(null);
  const [nativeWarnings, setNativeWarnings] = useState<string[]>([]);
  const [nativeDestination, setNativeDestination] = useState<{ id: string; path: string } | null>(null);
  const [nativePlan, setNativePlan] = useState<StudioPlanPreview | null>(null);
  const [nativePlanLoading, setNativePlanLoading] = useState(false);
  const [nativePlanError, setNativePlanError] = useState<string | null>(null);
  const [nativePreviewHistory, setNativePreviewHistory] = useState<StudioPreviewHistoryEntry[]>([]);

  const formatBytes = (bytes: number): string => {
    if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let value = bytes;
    let index = 0;
    while (value >= 1024 && index < units.length - 1) {
      value /= 1024;
      index += 1;
    }
    return `${value.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
  };

  const mapNativeFile = (row: import('../../shared/native-contracts').StudioQueryFile): StudioFileItem => ({
    id: String(row.id),
    nativeFileId: row.id,
    name: row.name,
    category: row.uiCategory as CategoryKey,
    sizeBytes: row.size,
    sizeFormatted: formatBytes(row.size),
    extension: (row.ext || '').toUpperCase(),
    dateModified: new Date(row.modifiedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }),
    sourcePath: row.relative,
    thumbnailUrl: undefined,
    status: 'pending',
  });

  const toAuthorizedFolder = (source: StudioSource): AuthorizedFolder => ({
    id: source.id,
    path: source.path,
    fileCount: source.fileCount,
    sizeGb: Number((source.totalBytes / 1_000_000_000).toFixed(2)),
    isWritable: false,
    status:
      source.status === 'scanning'
        ? 'scanning'
        : source.status === 'offline'
        ? 'offline'
        : source.status === 'error'
        ? 'permission_required'
        : 'authorized',
    lastScanned: source.lastScanned
      ? new Date(source.lastScanned).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : undefined,
  });

  const loadNativeCategory = async (sourceId: string, category: CategoryKey) => {
    const envelope = await queryStudioInventory({ sourceId, category, limit: 200 });
    if (!envelope || envelope.status !== 'complete' || !envelope.data) {
      setNativeError(envelope?.error?.message || 'The measured inventory could not be queried.');
      setFiles([]);
      return;
    }
    const rows = envelope.data.rows;
    setFiles(rows.map(mapNativeFile));
    setSelectedFileIds(new Set());
    setNativeError(null);
    const ids = rows.filter((row) => row.hasThumbnail).slice(0, 18).map((row) => row.id);
    if (ids.length) {
      const thumbs = await loadStudioThumbnails(sourceId, ids);
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
  };

  const applyNativeSource = async (source: StudioSource, preferredCategory?: CategoryKey) => {
    setDataMode('measured');
    setNativeSourceId(source.id);
    setNativeAvailable(true);
    setNativeWarnings(source.warnings || []);
    setAuthorizedSources((prev) => {
      const others = prev.filter((item) => item.id !== source.id && !String(item.id).startsWith('folder-'));
      return [toAuthorizedFolder(source), ...others];
    });
    const counts = new Map((source.categories || []).map((category) => [category.key, category]));
    const measuredCategories = FILE_CATEGORIES.map((category) => {
      const stat = counts.get(category.key);
      return {
        ...category,
        fileCount: stat?.count || 0,
        sizeGb: stat ? Number((stat.bytes / 1_000_000_000).toFixed(2)) : 0,
      };
    });
    setCategories(measuredCategories);
    setCollections(
      (source.categories || [])
        .slice(0, 6)
        .map((stat) => {
          const category = FILE_CATEGORIES.find((entry) => entry.key === stat.key);
          return {
            id: `measured-collection-${stat.key}`,
            name: category ? category.labelEn : stat.key,
            fileCount: stat.count,
            totalSizeFormatted: formatBytes(stat.bytes),
            color: category?.colorAccent || '#3b82f6',
            ruleTag: 'Measured category',
            createdDate: source.lastScanned ? new Date(source.lastScanned).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
          };
        })
    );
    setSuggestions(
      (source.categories || [])
        .filter((stat) => stat.count > 0)
        .slice(0, 5)
        .map((stat) => {
          const category = FILE_CATEGORIES.find((entry) => entry.key === stat.key);
          const labelEn = category?.labelEn || stat.key;
          const labelAr = category?.labelAr || stat.key;
          const actionType =
            stat.key === 'image'
              ? ('group_raw_photos' as const)
              : stat.key === 'archive'
              ? ('archive_downloads' as const)
              : stat.key === 'code'
              ? ('extract_code_assets' as const)
              : ('deduplicate' as const);
          return {
            id: `measured-suggestion-${stat.key}`,
            titleEn: `Review ${stat.count.toLocaleString()} ${labelEn} files`,
            titleAr: `راجع ${stat.count.toLocaleString()} ملفًا من ${labelAr}`,
            descriptionEn: `Category-derived grouping suggestion from the measured index (${formatBytes(stat.bytes)}). It is not AI analysis and saves nothing until an approved plan executes.`,
            descriptionAr: `اقتراح تجميع مشتق من الفهرس المقيس (${formatBytes(stat.bytes)}). ليس تحليل ذكاء اصطناعي ولا يوفر مساحة قبل تنفيذ خطة معتمدة.`,
            impactFilesCount: stat.count,
            savedSpaceFormatted: undefined,
            actionType,
            confidenceScore: 0,
          };
        })
    );
    setInventory({
      totalFiles: source.fileCount,
      totalSizeGb: Number((source.totalBytes / 1_000_000_000).toFixed(2)),
      totalFolders: source.folderCount,
      fileTypesCount: source.fileTypesCount,
      scanState: source.partial ? 'Partial scan' : 'Scan complete',
      lastRefreshed: source.lastScanned
        ? new Date(source.lastScanned).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
        : 'Never',
      sourceCount: 1,
    });
    const category =
      preferredCategory ||
      (source.categories.find((item) => item.key === 'image')?.key as CategoryKey | undefined) ||
      (source.categories[0]?.key as CategoryKey | undefined) ||
      'other';
    setSelectedCategoryKeyState(category);
    if (source.fileCount > 0) {
      await loadNativeCategory(source.id, category);
    } else {
      setFiles([]);
      setSelectedFileIds(new Set());
    }
  };

  const mapNativeHistory = (entries: StudioPreviewHistoryEntry[]): HistoryJournalEntry[] =>
    entries.map((entry) => ({
      id: entry.id,
      timestamp: new Date(entry.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }),
      filesProcessed: entry.files,
      totalSizeFormatted: formatBytes(entry.bytes),
      destinationPath: entry.destinationSummary || 'Virtual grouping (no filesystem target)',
      mode: ['copy', 'move', 'virtual'].includes(entry.operation) ? (entry.operation as OperationMode) : 'virtual',
      status: 'preview',
      canUndo: false,
      previewOnly: true,
      summaryEn: `Preview plan ${entry.planHash.slice(0, 8)} — not executed`,
      summaryAr: `خطة معاينة ${entry.planHash.slice(0, 8)} — لم تُنفذ`,
    }));

  const refreshNativeHistory = async () => {
    const history = await loadStudioPreviewHistory();
    if (history?.status === 'complete' && Array.isArray(history.data)) {
      setNativePreviewHistory(history.data);
      setHistoryJournal(mapNativeHistory(history.data));
    }
  };

  const scanNativeSource = async (sourceId: string) => {
    setNativeScanning(true);
    setNativeError(null);
    setNativeProgress(null);
    setAuthorizedSources((prev) => prev.map((item) => (item.id === sourceId ? { ...item, status: 'scanning' } : item)));
    try {
      const envelope = await scanStudioSource(sourceId);
      if (!envelope || envelope.status !== 'complete' || !envelope.data) {
        setNativeError(envelope?.error?.message || 'The source could not be indexed.');
        setAuthorizedSources((prev) =>
          prev.map((item) => (item.id === sourceId ? { ...item, status: 'permission_required' } : item))
        );
        return;
      }
      await applyNativeSource(envelope.data);
    } finally {
      setNativeScanning(false);
      setNativeProgress(null);
    }
  };

  const addNativeSource = async () => {
    const envelope = await chooseStudioSource();
    if (!envelope) return;
    if (envelope.status !== 'complete' || !envelope.data) {
      if (envelope.status !== 'cancelled') setNativeError(envelope.error?.message || 'The source could not be authorized.');
      return;
    }
    const source = envelope.data;
    setNativeError(null);
    setNativeAvailable(true);
    setAuthorizedSources((prev) => [
      toAuthorizedFolder(source),
      ...prev.filter((item) => item.id !== source.id && !String(item.id).startsWith('folder-')),
    ]);
    await scanNativeSource(source.id);
  };

  const scanActiveSource = async () => {
    if (nativeSourceId) {
      await scanNativeSource(nativeSourceId);
      return;
    }
    const first = authorizedSources.find((source) => !String(source.id).startsWith('folder-'));
    if (first) await scanNativeSource(first.id);
  };

  const cancelActiveScan = async () => {
    if (!nativeSourceId) return;
    await cancelStudioScan(nativeSourceId);
  };

  const chooseNativeDestination = async () => {
    const envelope = await chooseStudioDestination();
    if (!envelope) return;
    if (envelope.status === 'complete' && envelope.data) {
      setNativeDestination(envelope.data);
      setDestinationPath(envelope.data.path);
      setNativePlan(null);
      setNativePlanError(null);
    } else if (envelope.status !== 'cancelled') {
      setNativeError(envelope.error?.message || 'No destination was authorized.');
    }
  };

  const previewNativePlan = async (operationOverride?: OperationMode) => {
    if (!nativeSourceId) {
      setNativePlanError('Add and index a native source before planning.');
      return;
    }
    setNativePlanLoading(true);
    setNativePlanError(null);
    const requested = operationOverride || operationMode;
    const operation = nativeDestination ? requested : 'virtual';
    const ids = Array.from(selectedFileIds)
      .map((id) => files.find((file) => file.id === id)?.nativeFileId)
      .filter((id): id is number => typeof id === 'number');
    const envelope = await previewStudioPlan({
      sourceId: nativeSourceId,
      ...(ids.length ? { fileIds: ids } : { category: selectedCategoryKey }),
      operation,
      // The native engine supports category/flat structures and a fixed
      // collision policy. Custom date tokens/templates remain drafts until a
      // reviewed write-capable engine lands.
      structure: groupingRule.structure === 'Flat' ? 'flat' : 'categorized',
      collisionPolicy: namingRule.duplicateHandling === 'skip' ? 'skip' : 'review',
      ...(nativeDestination ? { destinationId: nativeDestination.id, relativePath: '' } : {}),
    });
    setNativePlanLoading(false);
    if (!envelope || envelope.status !== 'complete' || !envelope.data) {
      setNativePlanError(envelope?.error?.message || 'The plan preview could not be built.');
      return;
    }
    const plan = envelope.data;
    setNativePlan(plan);
    const extraWarnings = [...plan.warnings];
    if (!nativeDestination && requested !== 'virtual') {
      extraWarnings.push(
        'No destination is authorized; this is a virtual grouping preview. Choose a destination for a copy/move plan.'
      );
    }
    if (extraWarnings.length) setNativeWarnings((prev) => Array.from(new Set([...prev, ...extraWarnings])));
    await refreshNativeHistory();
  };

  useEffect(() => {
    const api = getStudioShell();
    if (!api) return;
    setNativeAvailable(true);
    let active = true;
    const unsubscribe = subscribeStudioEvents((event: StudioProgressEvent) => {
      if (!active) return;
      if (event.type === 'scan-progress') {
        setNativeProgress({ files: event.files || 0, bytes: event.bytes || 0, folders: event.folders || 0 });
      }
      if (event.type === 'scan-failed') {
        setNativeError(event.message || 'The source could not be indexed.');
      }
    });
    void (async () => {
      const sources = await listStudioSources();
      if (!active) return;
      if (sources?.status === 'complete' && Array.isArray(sources.data) && sources.data.length) {
        setAuthorizedSources(sources.data.map(toAuthorizedFolder));
        const ready = sources.data.find((source) => source.status === 'ready' || source.status === 'partial') || sources.data[0];
        if (ready) await applyNativeSource(ready);
      } else {
        setDataMode('fixture');
        setNativeSourceId(null);
      }
      await refreshNativeHistory();
    })();
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('knoux_studio_draft_v1');
      if (!raw) return;
      const draft = JSON.parse(raw);
      if (typeof draft.activeStageId === 'number' && draft.activeStageId >= 1 && draft.activeStageId <= 9) {
        setActiveStageIdState(draft.activeStageId as StudioStageId);
      }
      if (draft.namingRule && typeof draft.namingRule === 'object') setNamingRule(draft.namingRule);
      if (draft.groupingRule && typeof draft.groupingRule === 'object') setGroupingRule(draft.groupingRule);
      if (draft.operationMode === 'copy' || draft.operationMode === 'move' || draft.operationMode === 'virtual') {
        setOperationMode(draft.operationMode);
      }
      if (typeof draft.destinationPath === 'string') setDestinationPath(draft.destinationPath);
    } catch {
      // A malformed draft must never block Studio.
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        'knoux_studio_draft_v1',
        JSON.stringify({ activeStageId, namingRule, groupingRule, operationMode, destinationPath })
      );
    } catch {
      // Persistence is best-effort and never affects the measured inventory.
    }
  }, [activeStageId, namingRule, groupingRule, operationMode, destinationPath]);

  const setSelectedCategoryKey = (key: CategoryKey) => {
    setSelectedCategoryKeyState(key);
    if (dataMode === 'measured' && nativeSourceId) {
      void loadNativeCategory(nativeSourceId, key);
    } else {
      // The fixture only contains image samples; clear a hidden selection when
      // the visible category changes so the footer never counts unseen files.
      setSelectedFileIds(new Set());
    }
  };

  const setActiveStageId = (id: StudioStageId) => {
    setActiveStageIdState(id);
    setStages((prev) =>
      prev.map((s) => ({
        ...s,
        status: s.id === id ? 'active' : s.id < id ? 'completed' : 'available',
      }))
    );
  };

  const addAuthorizedSource = (newPath: string) => {
    if (nativeAvailable) {
      void addNativeSource();
      return;
    }
    if (!newPath.trim()) return;
    const newFolder: AuthorizedFolder = {
      id: `folder-${Date.now()}`,
      path: newPath.trim(),
      fileCount: Math.floor(Math.random() * 1500) + 200,
      sizeGb: parseFloat((Math.random() * 40 + 5).toFixed(1)),
      isWritable: true,
      status: 'authorized',
      lastScanned: 'Just now',
    };
    setAuthorizedSources((prev) => [...prev, newFolder]);
    setInventory((prev) => ({
      ...prev,
      sourceCount: prev.sourceCount + 1,
      totalFolders: prev.totalFolders + 12,
      totalFiles: prev.totalFiles + newFolder.fileCount,
      totalSizeGb: parseFloat((prev.totalSizeGb + newFolder.sizeGb).toFixed(1)),
      lastRefreshed: 'Just now',
    }));
  };

  const removeAuthorizedSource = (id: string) => {
    if (nativeAvailable && !String(id).startsWith('folder-')) {
      void removeStudioSource(id).then(() => {
        setAuthorizedSources((prev) => prev.filter((f) => f.id !== id));
        if (nativeSourceId === id) {
          setDataMode('fixture');
          setNativeSourceId(null);
          setNativePlan(null);
        }
      });
      return;
    }
    setAuthorizedSources((prev) => prev.filter((f) => f.id !== id));
  };

  const refreshSources = () => {
    if (nativeAvailable) {
      void scanActiveSource();
      return;
    }
    setInventory((prev) => ({
      ...prev,
      scanState: 'Scan complete',
      lastRefreshed: `Today ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
    }));
  };

  const toggleFileSelection = (id: string) => {
    setSelectedFileIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAllFiles = () => {
    setSelectedFileIds(new Set(files.map((f) => f.id)));
  };

  const deselectAllFiles = () => {
    setSelectedFileIds(new Set());
  };

  const dismissSuggestion = (id: string) => {
    setSuggestions((prev) => prev.filter((s) => s.id !== id));
  };

  const revertJournalEntry = (id: string) => {
    setHistoryJournal((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status: 'reverted',
              canUndo: false,
              summaryEn: `[Reverted] ${item.summaryEn}`,
              summaryAr: `[تم التراجع] ${item.summaryAr}`,
            }
          : item
      )
    );
  };

  const openModal = (modal: ActiveModalType) => setActiveModal(modal);
  const closeModal = () => setActiveModal(null);

  // Testing & Edge Cases Simulators
  const simulateZeroSources = () => {
    setAuthorizedSources([]);
    setInventory({
      totalFiles: 0,
      totalSizeGb: 0,
      totalFolders: 0,
      fileTypesCount: 0,
      scanState: 'Idle',
      lastRefreshed: 'Never',
      sourceCount: 0,
    });
    setFiles([]);
    setSelectedFileIds(new Set());
    setActiveStageId(1);
  };

  const simulateScanningState = () => {
    setInventory((prev) => ({
      ...prev,
      scanState: 'Scanning...',
      lastRefreshed: 'In progress...',
    }));
  };

  const simulatePermissionError = () => {
    setAuthorizedSources((prev) =>
      prev.map((f, i) => (i === 0 ? { ...f, status: 'permission_required', isWritable: false } : f))
    );
  };

  const resetToDefaultScreenshotFixture = () => {
    setDataMode('fixture');
    setNativeSourceId(null);
    setNativePlan(null);
    setNativePlanError(null);
    setSelectedFileIds(new Set(['img-1']));
    setActiveStageIdState(2);
    setStages(INITIAL_STAGES);
    setActiveStageIdState(2);
    setAuthorizedSources(INITIAL_AUTHORIZED_FOLDERS);
    setInventory(INITIAL_INVENTORY);
    setCategories(FILE_CATEGORIES);
    setSelectedCategoryKey('image');
    setFiles(IMAGE_GALLERY_FIXTURE);
    setSelectedFileIds(new Set(['img-1']));
    setDestinationPath('D:\\Organized\\Images\\');
    setOperationMode('copy');
    setConflicts(INITIAL_CONFLICTS);
    setCollections(INITIAL_COLLECTIONS);
    setHistoryJournal(INITIAL_HISTORY_JOURNAL);
    setSuggestions(INITIAL_SUGGESTIONS);
  };

  const value: StudioContextValue = ({
      stages,
      activeStageId,
      setActiveStageId,
      authorizedSources,
      addAuthorizedSource,
      removeAuthorizedSource,
      refreshSources,
      inventory,
      categories,
      selectedCategoryKey,
      setSelectedCategoryKey,
      files,
      selectedFileIds,
      toggleFileSelection,
      selectAllFiles,
      deselectAllFiles,
      viewMode,
      setViewMode,
      sortOrder,
      setSortOrder,
      destinationPath,
      setDestinationPath,
      namingRule,
      setNamingRule,
      groupingRule,
      setGroupingRule,
      operationMode,
      setOperationMode,
      conflicts,
      collections,
      historyJournal,
      suggestions,
      dismissSuggestion,
      revertJournalEntry,
      activeModal,
      openModal,
      closeModal,
      locale,
      setLocale,
      simulateZeroSources,
      simulateScanningState,
      simulatePermissionError,
      resetToDefaultScreenshotFixture,
      native: {
        available: nativeAvailable,
        mode: dataMode,
        sourceId: nativeSourceId,
        scanning: nativeScanning,
        progress: nativeProgress,
        error: nativeError,
        warnings: nativeWarnings,
        destination: nativeDestination,
        plan: nativePlan,
        planLoading: nativePlanLoading,
        planError: nativePlanError,
        previewHistory: nativePreviewHistory,
      },
      addNativeSource,
      scanActiveSource,
      cancelActiveScan,
      chooseNativeDestination,
      previewNativePlan,
    });

  return <StudioContext.Provider value={value}>{children}</StudioContext.Provider>;
}

export function useStudio() {
  const context = useContext(StudioContext);
  if (!context) {
    throw new Error('useStudio must be used within a StudioProvider');
  }
  return context;
}
