/**
 * KNOuX SmartOrganizer — Studio Context & State Manager
 */

import React, { createContext, useContext, useState, useMemo, ReactNode } from 'react';
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
  const [selectedCategoryKey, setSelectedCategoryKey] = useState<CategoryKey>('image');
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
    setAuthorizedSources((prev) => prev.filter((f) => f.id !== id));
  };

  const refreshSources = () => {
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

  const value = useMemo(
    () => ({
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
    }),
    [
      stages,
      activeStageId,
      authorizedSources,
      inventory,
      categories,
      selectedCategoryKey,
      files,
      selectedFileIds,
      viewMode,
      sortOrder,
      destinationPath,
      namingRule,
      groupingRule,
      operationMode,
      conflicts,
      collections,
      historyJournal,
      suggestions,
      activeModal,
      locale,
    ]
  );

  return <StudioContext.Provider value={value}>{children}</StudioContext.Provider>;
}

export function useStudio() {
  const context = useContext(StudioContext);
  if (!context) {
    throw new Error('useStudio must be used within a StudioProvider');
  }
  return context;
}
