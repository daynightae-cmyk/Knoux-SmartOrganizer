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

export interface NativeShellApi {
  contractVersion: number;
  getStatus: () => Promise<NativeEnvelope<BridgeStatusData>>;
  getSystemSummary: () => Promise<NativeEnvelope<SystemSummaryData>>;
  getServicesSummary: () => Promise<NativeEnvelope<ServicesSummaryData>>;
  chooseFolder: () => Promise<NativeEnvelope<FolderChoiceData>>;
  windowControl: (action: (typeof WINDOW_ACTIONS)[number]) => Promise<NativeEnvelope<{ action: string }>>;
}
