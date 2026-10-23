export type StudioCategoryKey =
  | 'image'
  | 'video'
  | 'audio'
  | 'document'
  | 'spreadsheet'
  | 'presentation'
  | 'pdf'
  | 'archive'
  | 'installer'
  | 'code'
  | 'markup'
  | 'config'
  | 'font'
  | 'design'
  | 'model'
  | 'ebook'
  | 'discImage'
  | 'other';

export interface Source {
  id: string;
  name: string;
  folder: string;
  inventory?: SourceInventory | null;
}

export interface CategoryStat {
  key: StudioCategoryKey;
  count: number;
  bytes: number;
}

export interface ExtensionStat {
  ext: string;
  count: number;
  bytes: number;
}

export interface ScanCounts {
  folders: number;
  links: number;
  errors: number;
  depthSkipped: number;
  excluded: number;
}

export interface ScanSummary {
  inventoryId: string;
  sourceId: string;
  operationId: string;
  totalFiles: number;
  totalBytes: number;
  categories: CategoryStat[];
  extensions: ExtensionStat[];
  counts: ScanCounts;
  partial: boolean;
  truncated: boolean;
  cancelled: boolean;
  metadataOnly: true;
  cloudAttributeInspection: boolean;
  oldestMtimeMs: number | null;
  newestMtimeMs: number | null;
  limits: { maxFiles: number; maxDepth: number };
  warnings: string[];
}

export type ScanFailure = { cancelled: true; partial: true };

/** Latest retained index for a source, restored across Studio remounts. */
export type SourceInventory = ScanSummary;

export interface FileInfo {
  id: number;
  name: string;
  relative: string;
  category: StudioCategoryKey;
  size: number;
  ext: string;
  modifiedAt: string;
  readonly: boolean;
  hidden: boolean;
  hasThumbnail: boolean;
}

export interface PageResult {
  total: number;
  bytes: number;
  offset: number;
  limit: number;
  rows: FileInfo[];
}

export type StudioSort = 'name' | 'size' | 'modified' | 'type';
export type StudioView = 'grid' | 'list';

export interface InventoryQuery {
  inventoryId: string;
  category?: StudioCategoryKey | 'all';
  search?: string;
  sort?: StudioSort;
  desc?: boolean;
  offset?: number;
  limit?: number;
  extensions?: string[];
  minBytes?: number;
  maxBytes?: number;
  modifiedAfter?: number;
  modifiedBefore?: number;
}

export interface DestinationAuthorization {
  id: string;
  name: string;
  path: string;
}

export interface DestinationListing {
  destinationId: string;
  name: string;
  root: string;
  path: string;
  relativePath: string;
  parentRelative: string | null;
  folders: Array<{ name: string; relativePath: string }>;
  truncated: boolean;
}

export interface FolderValidationResult {
  ok: boolean;
  code?: string;
  message?: string;
  existing?: boolean;
  existingType?: 'directory' | 'file';
  existingName?: string;
  name?: string;
  parentPath?: string;
  fullPath?: string;
  relativePath?: string;
  longPath?: boolean;
}

export interface CreatedFolder {
  ok: true;
  name: string;
  path: string;
  relativePath: string;
  parentRelative: string;
  longPath: boolean;
}

export type OrganizationMode = 'virtual' | 'copy' | 'move';
export type CollisionPolicy = 'skip' | 'rename' | 'review';

export interface PlanSelection {
  inventoryId: string;
  fileIds?: number[];
  category?: StudioCategoryKey;
  all?: boolean;
}

export interface PlanDestinationRef {
  destinationId: string;
  relativePath?: string;
}

export interface PlanRequest {
  selections: PlanSelection[];
  operation: OrganizationMode;
  destination?: PlanDestinationRef;
  structure: 'categorized' | 'flat';
  categoryFolderNames: Partial<Record<StudioCategoryKey, string>>;
  categoryDestinations?: Partial<Record<StudioCategoryKey, PlanDestinationRef>>;
  collisionPolicy: CollisionPolicy;
}

export interface PlanFile {
  index: number;
  inventoryId: string;
  fileId: number;
  name: string;
  sourceRelative: string;
  sourceRoot: string;
  category: StudioCategoryKey;
  size: number;
  ext: string;
  modifiedAt: string;
  targetName: string;
  targetPath: string | null;
  targetRelative: string | null;
  status: 'ready' | 'collision';
}

export interface PlanSkipped {
  name: string;
  sourceRelative: string;
  category: StudioCategoryKey;
  size: number;
  reason: string;
}

export interface PlanCollision {
  name: string;
  sourceRelative: string;
  targetPath: string;
  size: number;
}

export interface PlanFolderStep {
  path: string;
  relative: string;
  category: StudioCategoryKey;
  exists: boolean;
}

export interface PlanDestinationRoot {
  id: string;
  name: string;
  root: string;
  base: string;
  baseRelative: string;
}

export interface OrganizationPlan {
  planId: string;
  planHash: string;
  createdAt: string;
  expiresAt: string;
  expiresAtMs: number;
  operation: OrganizationMode;
  structure: 'categorized' | 'flat';
  collisionPolicy: CollisionPolicy;
  executable: boolean;
  destinationSummary: string;
  destinationRoots: PlanDestinationRoot[];
  folderSteps: PlanFolderStep[];
  categories: Array<{
    category: StudioCategoryKey;
    files: number;
    bytes: number;
    folderName?: string;
    targetPath?: string | null;
  }>;
  files: PlanFile[];
  skipped: PlanSkipped[];
  collisions: PlanCollision[];
  warnings: string[];
  sourceRoots: string[];
  totals: {
    files: number;
    bytes: number;
    categories: number;
    folderSteps: number;
    skipped: number;
    collisions: number;
  };
}

export interface ExecutionApproval {
  planId: string;
  planHash: string;
  approved: true;
  operation: OrganizationMode;
  destinationSummary: string;
}

export interface JournalEntry {
  index: number;
  name: string;
  category: StudioCategoryKey;
  sourceRelative: string;
  sourceRoot: string;
  targetRelative: string;
  targetRoot: string;
  size: number;
  state: string;
  verification: string | null;
  error: string | null;
  undo: { state: string; at: string | null; error: string | null } | null;
}

export interface JournalOperation {
  operationId: string;
  mode: OrganizationMode;
  status: string;
  createdAt: string;
  updatedAt: string;
  planId: string;
  destinationSummary: string | null;
  sourceRoots: string[];
  totalFiles: number;
  totalBytes: number;
  completedFiles: number;
  failedFiles: number;
  skippedFiles: number;
  cancelledFiles: number;
  undoAvailable: boolean;
  undoCompletedFiles: number;
  interruptedAt: string | null;
  warnings: string[];
  errors: string[];
  entries: JournalEntry[];
}

export interface ExecutionSummary {
  id: string;
  mode: OrganizationMode;
  status: string;
  totalFiles: number;
  totalBytes: number;
  completedFiles: number;
  failedFiles: number;
  skippedFiles: number;
  cancelledFiles: number;
  undoAvailable: boolean;
}

export interface ExecutionResult {
  success: boolean;
  partial?: boolean;
  mode: OrganizationMode;
  journalId: string;
  summary: ExecutionSummary;
  undoAvailable?: boolean;
  files?: unknown[];
}

export interface UndoPreviewEntry {
  index: number;
  name: string;
  category: StudioCategoryKey;
  sourceRelative: string;
  size: number;
  state: string;
  undoState: string | null;
  eligible: boolean;
  conflict: boolean;
  reason: string | null;
  restoreName: string;
}

export interface UndoPreview {
  previewId: string;
  previewHash: string;
  expiresAtMs: number;
  requiredRoots: Array<{ kind: 'source' | 'destination'; root: string }>;
  journalId: string;
  mode: OrganizationMode;
  status: string;
  createdAt: string;
  total: number;
  eligible: number;
  conflicts: number;
  bytes: number;
  entries: UndoPreviewEntry[];
}

export interface UndoResult {
  success: boolean;
  partial: boolean;
  restored: number;
  skipped: number;
  failed: number;
  journalId: string;
}

export interface ThumbnailResult {
  thumbnail: string | null;
  width?: number;
  height?: number;
  reason?: string;
  cached?: boolean;
}

export interface StudioEvent {
  operationId: string;
  phase: string;
  at: string;
  type?: 'scan' | 'execution' | 'undo';
  sourceId?: string;
  inventoryId?: string;
  files?: number;
  folders?: number;
  bytes?: number;
  planId?: string;
  journalId?: string;
  operation?: OrganizationMode;
  processed?: number;
  total?: number;
  totalFiles?: number;
  totalBytes?: number;
  completed?: number;
  failed?: number;
  cancelled?: number;
  currentName?: string | null;
  restored?: number;
  skipped?: number;
  summary?: ExecutionSummary | { restored: number; skipped: number; failed: number };
  message?: string;
}

export interface StudioBridge {
  pickSource: () => Promise<Source | null>;
  listSources: () => Promise<Source[]>;
  removeSource: (id: string) => Promise<boolean>;
  scan: (request: { sourceId: string; operationId: string }) => Promise<ScanSummary | ScanFailure>;
  cancel: (operationId: string) => Promise<boolean>;
  query: (request: InventoryQuery) => Promise<PageResult>;
  reveal: (request: { inventoryId: string; fileId: number }) => Promise<boolean>;
  pickDestination: () => Promise<DestinationAuthorization | null>;
  listDestinations: () => Promise<DestinationAuthorization[]>;
  listDestination: (request: { destinationId: string; relativePath?: string }) => Promise<DestinationListing>;
  validateFolder: (request: { destinationId: string; parentRelative: string; name: string }) => Promise<FolderValidationResult>;
  createFolder: (request: { destinationId: string; parentRelative: string; name: string }) => Promise<CreatedFolder>;
  buildPlan: (request: PlanRequest) => Promise<OrganizationPlan>;
  executePlan: (request: ExecutionApproval) => Promise<ExecutionResult>;
  cancelExecution: (request: { operationId: string }) => Promise<boolean>;
  listHistory: () => Promise<JournalOperation[]>;
  previewUndo: (request: { journalId: string }) => Promise<UndoPreview>;
  applyUndo: (request: { journalId: string; previewId: string; previewHash: string; resolution: 'skip' | 'rename'; approved: true }) => Promise<UndoResult>;
  thumbnail: (request: { inventoryId: string; fileId: number }) => Promise<ThumbnailResult>;
  onEvent: (callback: (event: StudioEvent) => void) => () => void;
}

declare global {
  interface Window {
    knouxStudio?: StudioBridge;
  }
}
