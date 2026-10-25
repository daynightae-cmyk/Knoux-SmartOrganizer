/**
 * KNOuX Gemini — versioned native bridge contracts.
 *
 * This file is the renderer's source of truth. The Electron main/preload pair
 * reads the same capability/channel identifiers from native-contract.json.
 * Bump contractVersion for any breaking envelope or capability change; never
 * add a generic execute channel.
 */
import contract from './native-contract.json';

export const NATIVE_CONTRACT_VERSION = contract.contractVersion;
export const NATIVE_NAMESPACE = contract.namespace;
export const NATIVE_CHANNELS = contract.channels;
export const NATIVE_CAPABILITIES = contract.capabilities;
export const WINDOW_ACTIONS = contract.windowActions;

export type NativeStatus =
  | 'available'
  | 'unavailable'
  | 'unsupported'
  | 'permission_denied'
  | 'partial'
  | 'cancelled'
  | 'failed'
  | 'complete';

export type ProviderMode = 'measured' | 'fixture' | 'unavailable';
export type PermissionGate = 'read-only' | 'user-initiated' | 'not-granted';
export type RiskLevel = 'read-only' | 'safe-write' | 'system-change' | 'administrator' | 'destructive';

export interface SourceProvenance {
  provider: string;
  mode: ProviderMode;
  observedAt: string;
  coverage?: 'full' | 'partial' | 'unknown';
  permissions?: string[];
  warnings?: string[];
}

export interface NativeError {
  code: string;
  message: string;
  retryable: boolean;
}

export interface NativeEnvelope<T = unknown> {
  contractVersion: number;
  capability: string;
  requestId: string;
  status: NativeStatus;
  source: string;
  observedAt: string;
  permission: PermissionGate;
  warnings: string[];
  data?: T;
  error?: NativeError;
  provenance?: SourceProvenance;
}

export interface ProviderCapability {
  id: string;
  title: string;
  mode: 'read-only' | 'user-initiated';
  channel: string;
  status: NativeStatus;
  detail?: string;
}

export interface NativeRequest<T = unknown> {
  contractVersion: number;
  capability: string;
  requestId?: string;
  payload?: T;
}

/**
 * Reserved for later section providers; platform version 1 does not stream
 * operations. Keeping the shape here prevents each section inventing its own.
 */
export interface OperationProgress {
  operationId: string;
  phase: string;
  current?: number;
  total?: number;
  percent?: number;
  message: string;
  at: string;
}

export interface OperationPlan {
  planId: string;
  capability: string;
  risk: RiskLevel;
  scopeSummary: string;
  effects: string[];
  reversible: boolean;
  requiresElevation: boolean;
  createdAt: string;
}

export interface OperationJournal {
  journalId: string;
  planId?: string;
  capability: string;
  startedAt: string;
  finishedAt?: string;
  status: NativeStatus;
  items: Array<Record<string, unknown>>;
  warnings: string[];
  errors: string[];
}

export interface Recoverability {
  recoverable: boolean;
  method?: 'undo' | 'restore-point' | 'recycle-bin' | 'manual' | 'none';
  notes?: string;
}

export interface BridgeStatusData {
  bridge: 'ready';
  platform: string;
  appVersion: string;
  packaged: boolean;
  providerMode: ProviderMode;
  fixtureEnabled: boolean;
  capabilities: ProviderCapability[];
  contractVersion: number;
  electronVersion?: string;
}

export interface SystemVolume {
  deviceId: string | null;
  label: string | null;
  fileSystem: string | null;
  sizeBytes: number | null;
  freeBytes: number | null;
}

export interface SystemSummaryData {
  platform: string;
  osCaption: string | null;
  osVersion: string | null;
  osBuild: string | null;
  osArchitecture: string | null;
  uptimeSeconds: number | null;
  uptimeSource: string;
  cpuModel: string | null;
  cpuCores: number | null;
  cpuLogicalProcessors: number | null;
  cpuLoadPercent: number | null;
  cpuLoadSource: string;
  memoryTotalBytes: number | null;
  memoryFreeBytes: number | null;
  memoryUsedPercent: number | null;
  systemDrive: string | null;
  systemDriveFreeBytes: number | null;
  systemDriveTotalBytes: number | null;
  volumes: SystemVolume[];
  degraded: boolean;
  degradationReason?: string;
}

export interface ServicesSummaryData {
  total: number;
  running: number;
  stopped: number;
  automatic: number;
  manual: number;
  disabled: number;
  protectedCount: number;
  provider: string;
}

export interface FolderChoiceData {
  canceled: boolean;
  path: string | null;
}

export interface StudioCategoryCount {
  key: string;
  count: number;
  bytes: number;
}

export interface StudioSource {
  id: string;
  path: string;
  label: string;
  addedAt: string;
  status: 'ready' | 'needs_scan' | 'scanning' | 'offline' | 'partial' | 'error';
  fileCount: number;
  folderCount: number;
  fileTypesCount: number;
  totalBytes: number;
  categories: StudioCategoryCount[];
  lastScanned: string | null;
  partial: boolean;
  warnings: string[];
}

export interface StudioQueryFile {
  id: number;
  name: string;
  relative: string;
  category: string;
  uiCategory: string;
  size: number;
  ext: string;
  modifiedAt: string;
  hasThumbnail: boolean;
}

export interface StudioQueryResult {
  sourceId: string;
  total: number;
  bytes: number;
  offset: number;
  limit: number;
  rows: StudioQueryFile[];
  partial: boolean;
  warnings: string[];
}

export interface StudioPlanFile {
  index: number;
  fileId: number;
  name: string;
  sourceRelative: string;
  sourceRoot: string;
  category: string;
  size: number;
  targetName: string;
  targetPath: string | null;
  targetRelative: string | null;
  status: string;
}

export interface StudioPlanPreview {
  planHash: string;
  operation: string;
  structure: string;
  collisionPolicy: string;
  destinationSummary: string | null;
  files: StudioPlanFile[];
  truncated: boolean;
  categories: Array<{ category: string; files: number; bytes: number; folderName?: string; targetPath?: string | null }>;
  collisions: Array<Record<string, unknown>>;
  skipped: Array<Record<string, unknown>>;
  warnings: string[];
  totals: { files: number; bytes: number; categories: number; folderSteps: number; skipped: number; collisions: number };
  createdAt: string;
  expiresAt: string;
  previewOnly: true;
  execution: 'blocked_explicit_approval_required';
}

export interface StudioPreviewHistoryEntry {
  id: string;
  planHash: string;
  createdAt: string;
  operation: string;
  files: number;
  bytes: number;
  categories: number;
  sourceRoots: string[];
  destinationSummary: string | null;
  collisions: number;
  skipped: number;
  warnings: string[];
  previewOnly: true;
}

export interface StudioProgressEvent {
  type: 'scan-progress' | 'scan-complete' | 'scan-cancelled' | 'scan-failed';
  sourceId: string;
  at: string;
  files?: number;
  bytes?: number;
  folders?: number;
  message?: string;
}

export interface StudioShellApi {
  contractVersion: number;
  listSources: () => Promise<NativeEnvelope<StudioSource[]>>;
  chooseSource: () => Promise<NativeEnvelope<StudioSource | null>>;
  removeSource: (sourceId: string) => Promise<NativeEnvelope<{ removed: boolean }>>;
  scanSource: (sourceId: string) => Promise<NativeEnvelope<StudioSource>>;
  cancelScan: (sourceId: string) => Promise<NativeEnvelope<{ cancelled: boolean }>>;
  query: (request: {
    sourceId: string;
    category?: string;
    categories?: string[];
    search?: string;
    sort?: 'name' | 'size' | 'modified' | 'type';
    desc?: boolean;
    offset?: number;
    limit?: number;
  }) => Promise<NativeEnvelope<StudioQueryResult>>;
  thumbnails: (sourceId: string, fileIds: number[]) => Promise<NativeEnvelope<Record<string, { thumbnail: string | null; reason?: string }>>>;
  chooseDestination: () => Promise<NativeEnvelope<{ id: string; path: string } | null>>;
  previewPlan: (request: {
    sourceId: string;
    fileIds?: number[];
    category?: string;
    categories?: string[];
    all?: boolean;
    operation: 'copy' | 'move' | 'virtual';
    structure?: 'categorized' | 'flat';
    categoryFolderNames?: Record<string, string>;
    collisionPolicy?: 'skip' | 'rename' | 'review';
    destinationId?: string;
    relativePath?: string;
  }) => Promise<NativeEnvelope<StudioPlanPreview>>;
  previewHistory: () => Promise<NativeEnvelope<StudioPreviewHistoryEntry[]>>;
  onEvent: (callback: (event: StudioProgressEvent) => void) => () => void;
}

export interface NativeShellApi {
  contractVersion: number;
  getStatus: () => Promise<NativeEnvelope<BridgeStatusData>>;
  getSystemSummary: () => Promise<NativeEnvelope<SystemSummaryData>>;
  getServicesSummary: () => Promise<NativeEnvelope<ServicesSummaryData>>;
  chooseFolder: () => Promise<NativeEnvelope<FolderChoiceData>>;
  windowControl: (action: (typeof WINDOW_ACTIONS)[number]) => Promise<NativeEnvelope<{ action: string }>>;
}

export interface FilesItem {
  id: number;
  name: string;
  relative: string;
  parentFolder: string;
  category: string;
  size: number;
  ext: string;
  modifiedAt: string;
  modifiedMs: number;
  readonly: boolean;
  hidden: boolean;
}

export interface FilesOverview {
  source: StudioSource;
  totals: {
    files: number;
    bytes: number;
    folders: number;
    categories: number;
    partial: boolean;
  };
  categories: Array<{ key: string; count: number; bytes: number }>;
  extensions: Array<{ ext: string; count: number; bytes: number }>;
  ages: Array<{ key: string; label: string; count: number; bytes: number }>;
  recent: FilesItem[];
  largest: FilesItem[];
  scannedAt: string | null;
  warnings: string[];
  coverage: 'complete' | 'partial';
  permission: 'read-only';
}

export interface FilesQueryRequest {
  sourceId: string;
  category?: string;
  categories?: string[];
  search?: string;
  extension?: string;
  minBytes?: number;
  maxBytes?: number;
  modifiedAfterMs?: number;
  modifiedBeforeMs?: number;
  sort?: 'name' | 'size' | 'modified' | 'type';
  desc?: boolean;
  offset?: number;
  limit?: number;
}

export interface FilesMetadata {
  sourceId: string;
  sourceLabel: string;
  fileId: number;
  name: string;
  relative: string;
  parentFolder: string;
  fullPath: string;
  size: number;
  ext: string;
  category: string;
  modifiedAt: string;
  createdAt: string | null;
  entryKind: string;
  linkCount: number | null;
  hardlinked: boolean;
  fileIdentity: string | null;
  volumeSerial: string | null;
  readonly: boolean;
  hidden: boolean;
  attributesAvailable: boolean;
  attributes: number | null;
  zone: {
    zoneId: number | null;
    zoneAvailable: boolean;
    referrer: string | null;
    host: string | null;
  };
  reparse: unknown;
  permission: 'read-only';
  warnings: string[];
}

export interface FilesHashResult {
  sourceId: string;
  fileId: number;
  name: string;
  algorithm: 'sha256' | 'sha512';
  digest: string;
  bytesRead: number;
  sizeAtRead: number;
  fileIdentity: string | null;
  changedDuringRead: boolean;
  digestReliable: boolean;
  warnings: string[];
  permission: 'read-only';
}

export interface FilesEmptyFoldersResult {
  items: Array<{ relative: string; fullPath: string }>;
  summary: {
    root: string;
    foldersScanned: number;
    emptyFolders: number;
    skippedLinks: number;
    errors: number;
    limit: number;
    elapsedMs: number;
  };
  partial: boolean;
  warnings: string[];
  permission: 'read-only';
  mutation: 'none';
}

export interface FilesShellApi {
  contractVersion: number;
  listSources: () => Promise<NativeEnvelope<StudioSource[]>>;
  chooseSource: () => Promise<NativeEnvelope<StudioSource | null>>;
  scanSource: (sourceId: string) => Promise<NativeEnvelope<StudioSource>>;
  cancelScan: (sourceId: string) => Promise<NativeEnvelope<{ cancelled: boolean }>>;
  query: (request: FilesQueryRequest) => Promise<NativeEnvelope<StudioQueryResult & { unsupported?: string }>>;
  thumbnails: (sourceId: string, fileIds: number[]) => Promise<NativeEnvelope<Record<string, { thumbnail: string | null; reason?: string }>>>;
  overview: (sourceId: string) => Promise<NativeEnvelope<FilesOverview>>;
  metadata: (sourceId: string, fileId: number) => Promise<NativeEnvelope<FilesMetadata>>;
  hash: (sourceId: string, fileId: number, algorithm?: 'sha256' | 'sha512') => Promise<NativeEnvelope<FilesHashResult>>;
  emptyFolders: (sourceId: string, limit?: number) => Promise<NativeEnvelope<FilesEmptyFoldersResult>>;
  open: (sourceId: string, fileId: number) => Promise<NativeEnvelope<{ opened: boolean; fileId: number; requestedPath: string }>>;
  reveal: (sourceId: string, fileId: number) => Promise<NativeEnvelope<{ requested: boolean; fileId: number; requestedPath: string }>>;
}
