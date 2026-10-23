import { createContext, useContext } from 'react';
import type { Locale } from '../locales';
import type { StudioText } from './copy';
import type {
  CategoryStat,
  DestinationAuthorization,
  ExecutionResult,
  ExecutionSummary,
  FileInfo,
  JournalOperation,
  OrganizationMode,
  OrganizationPlan,
  PageResult,
  ScanSummary,
  Source,
  StudioBridge,
  StudioCategoryKey,
  StudioSort,
  StudioView,
  CollisionPolicy
} from './types';

export type StudioSurface =
  | 'sources'
  | 'library'
  | 'details'
  | 'builder'
  | 'destinations'
  | 'review'
  | 'execution'
  | 'history'
  | 'suggestions';

export interface ScanRunning {
  sourceId: string;
  operationId: string;
  files: number;
  folders: number;
  bytes: number;
}

export interface FocusedFile {
  source: Source;
  file: FileInfo;
}

interface BasketBase {
  key: string;
  sourceId: string;
  sourceName: string;
  inventoryId: string;
}

export interface BasketFile extends BasketBase {
  kind: 'file';
  file: FileInfo;
}

export interface BasketCategory extends BasketBase {
  kind: 'category';
  category: StudioCategoryKey;
  count: number;
  bytes: number;
}

export interface BasketAll extends BasketBase {
  kind: 'all';
  count: number;
  bytes: number;
  categories: CategoryStat[];
}

export type BasketItem = BasketFile | BasketCategory | BasketAll;

export interface BasketCategoryInfo {
  category: StudioCategoryKey;
  count: number;
  bytes: number;
  sources: number;
}

export type SizePreset = 'any' | 'tiny' | 'small' | 'medium' | 'large' | 'from50';
export type DatePreset = 'any' | 'week' | 'month' | 'year';

export interface LibraryFilters {
  search: string;
  category: StudioCategoryKey | 'all';
  ext: string;
  size: SizePreset;
  date: DatePreset;
  sort: StudioSort;
  desc: boolean;
  offset: number;
  limit: number;
}

export interface DestinationChoice {
  destinationId: string;
  rootName: string;
  rootPath: string;
  relativePath: string;
  path: string;
}

export interface CategoryDestinationChoice {
  destinationId: string;
  relativePath: string;
}

export interface ExecutionLive {
  operationId: string;
  planId: string | null;
  phase: string;
  processed: number;
  total: number;
  bytes: number;
  totalBytes: number;
  completed: number;
  failed: number;
  cancelled: number;
  currentName: string | null;
  message: string | null;
  summary?: ExecutionSummary;
}

export interface InsightState {
  loading: boolean;
  largeCount: number;
  largeBytes: number;
  largestName: string | null;
}

export interface StudioContextValue {
  bridge?: StudioBridge;
  locale: Locale;
  t: StudioText;
  surface: StudioSurface;
  goto: (surface: StudioSurface) => void;

  sources: Source[];
  saved: Record<string, ScanSummary>;
  sourcesLoading: boolean;
  activeSourceId: string | null;
  setActiveSourceId: (id: string) => void;
  activeSource: Source | null;
  inventory: ScanSummary | null;

  scanRunning: ScanRunning | null;
  pickSource: () => Promise<void>;
  beginScan: (sourceId: string) => Promise<void>;
  cancelScan: () => Promise<void>;
  removeSource: (sourceId: string) => Promise<void>;

  notice: string;
  error: string;
  dismissBanner: () => void;
  notify: (message: string) => void;

  filters: LibraryFilters;
  updateFilters: (patch: Partial<LibraryFilters>) => void;
  resetFilters: () => void;
  page: PageResult | null;
  pageLoading: boolean;

  view: StudioView;
  setView: (view: StudioView) => void;
  focused: FocusedFile | null;
  focusFile: (source: Source, file: FileInfo) => void;

  basket: BasketItem[];
  basketCount: number;
  basketCategories: BasketCategoryInfo[];
  toggleFile: (source: Source, file: FileInfo) => void;
  addCategory: (source: Source, category: StudioCategoryKey) => void;
  addAll: (source: Source) => void;
  removeBasketItem: (key: string) => void;
  clearBasket: () => void;
  isFileSelected: (inventoryId: string, file: FileInfo) => boolean;
  isFileCovered: (inventoryId: string, category: StudioCategoryKey) => boolean;

  destinations: DestinationAuthorization[];
  addDestinationRoot: () => Promise<DestinationAuthorization | null>;
  destination: DestinationChoice | null;
  setDestination: (choice: DestinationChoice | null) => void;

  mode: OrganizationMode;
  setMode: (mode: OrganizationMode) => void;
  structure: 'categorized' | 'flat';
  setStructure: (structure: 'categorized' | 'flat') => void;
  collisionPolicy: CollisionPolicy;
  setCollisionPolicy: (policy: CollisionPolicy) => void;
  folderNames: Record<string, string>;
  setFolderName: (category: StudioCategoryKey, name: string) => void;
  categoryDestinations: Partial<Record<StudioCategoryKey, CategoryDestinationChoice>>;
  setCategoryDestination: (category: StudioCategoryKey, choice: CategoryDestinationChoice | null) => void;
  buildPlan: () => Promise<boolean>;
  planBuilding: boolean;
  plan: OrganizationPlan | null;
  discardPlan: () => void;
  executePlan: (plan: OrganizationPlan) => Promise<void>;
  executing: boolean;
  executionLive: ExecutionLive | null;
  lastExecution: ExecutionResult | null;
  cancelExecution: () => Promise<void>;

  history: JournalOperation[];
  historyLoading: boolean;
  loadHistory: () => Promise<void>;

  insight: InsightState;
}

export const StudioContext = createContext<StudioContextValue | null>(null);

export function useStudio(): StudioContextValue {
  const value = useContext(StudioContext);
  if (!value) throw new Error('Studio context is missing.');
  return value;
}
