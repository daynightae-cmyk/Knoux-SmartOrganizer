import settingsDefaults from './settings-defaults.json';

export type Locale = 'ar' | 'en';
export type RiskLevel = 'read-only' | 'safe-write' | 'system-change' | 'administrator' | 'destructive';
export type OperationPhase =
  | 'idle'
  | 'queued'
  | 'preflight'
  | 'awaiting-confirmation'
  | 'awaiting-admin'
  | 'running'
  | 'progress'
  | 'result'
  | 'completed'
  | 'cancelled'
  | 'failed'
  | 'rolling-back'
  | 'rolled-back';

export interface SchemaDescriptor {
  id: string;
  version: number;
}

export interface ToolAvailability {
  available: boolean;
  reason?: string;
  capability?: string;
}

export interface ToolDefinition {
  id: string;
  nameKey: string;
  descriptionKey: string;
  category: string;
  icon: string;
  riskLevel: RiskLevel;
  requiresAdmin: boolean;
  supportsDryRun: boolean;
  supportsProgress: boolean;
  supportsCancel: boolean;
  supportsUndo: boolean;
  supportsExport: boolean;
  inputSchema: SchemaDescriptor;
  outputSchema: SchemaDescriptor;
  estimatedCost: 'low' | 'medium' | 'high';
  availability: ToolAvailability;
}

export interface OperationEvent {
  operationId: string;
  toolId: string;
  startedAt: string;
  updatedAt: string;
  progress: number | null;
  phase: OperationPhase;
  summary: Record<string, unknown>;
  warnings: string[];
  errors: string[];
  cancelRequested: boolean;
  undoMetadata: Record<string, unknown> | null;
  message: string;
  current?: number;
  total?: number;
  percent?: number;
  at: string;
  result?: ToolResult;
}

export interface ToolResult {
  operationId: string;
  toolId: string;
  success: boolean;
  startedAt: string;
  finishedAt: string;
  summary: Record<string, unknown>;
  items: Array<Record<string, unknown>>;
  warnings: string[];
  errors: string[];
  partial?: boolean;
  restartRequired?: boolean;
  undoMetadata?: Record<string, unknown> | null;
}

export interface OperationRecord extends ToolResult {
  action: string;
  durationMs: number;
  undoAvailable: boolean;
}

export interface AppSettings {
  settingsVersion: 2;
  general: {
    startWithWindows: boolean;
    startMinimized: boolean;
    minimizeToTray: boolean;
    closeBehavior: 'tray' | 'exit' | 'ask';
    rememberWindowBounds: boolean;
    restorePreviousPage: boolean;
    confirmExitActiveOperations: boolean;
  };
  appearance: {
    theme: 'dark' | 'light' | 'system' | 'high-contrast';
    accent: 'violet' | 'blue' | 'green' | 'amber';
    density: 'comfortable' | 'compact';
    fontScale: number;
    reduceMotion: boolean;
    transparency: boolean;
    animations: boolean;
  };
  localization: {
    locale: Locale;
    region: string;
    numberFormat: 'locale';
    dateFormat: 'short' | 'medium' | 'long';
    timeFormat: 'short' | 'medium';
    byteUnits: 'binary' | 'decimal';
  };
  scanning: {
    includeHidden: boolean;
    includeSystem: boolean;
    includeRemovable: boolean;
    includeNetworkLocations: boolean;
    exclusions: string[];
    minimumDuplicateBytes: number;
    largeFileBytes: number;
    scanWorkers: number;
    hashWorkers: number;
    reparsePointPolicy: 'skip' | 'same-volume';
  };
  cleanup: {
    recycleBinByDefault: boolean;
    confirmDestructive: boolean;
    minimumFileAgeDays: number;
    exclusions: string[];
    rememberSelection: boolean;
    safetyBackup: boolean;
  };
  performance: {
    mode: 'eco' | 'balanced' | 'performance';
    workerCount: number;
    ioThrottle: 'low' | 'balanced' | 'unlimited';
    batteryBehavior: 'pause' | 'reduce' | 'continue';
    backgroundBehavior: 'continue' | 'pause-intensive' | 'pause-all';
  };
  privacy: {
    telemetry: false;
    crashReporting: false;
    diagnostics: boolean;
    usageAnalytics: false;
    aiPrivacy: 'local-only';
  };
  notifications: {
    operationSuccess: boolean;
    operationFailure: boolean;
    diskWarning: boolean;
    scheduledScan: boolean;
    update: boolean;
    restartRequired: boolean;
  };
  automation: {
    enabled: boolean;
    quietHoursStart: string;
    quietHoursEnd: string;
    onBatteryPolicy: 'skip' | 'skip-intensive' | 'run';
    missedSchedulePolicy: 'skip' | 'run-next-start';
  };
  history: {
    retentionDays: number;
    automaticCleanup: boolean;
    exportFormat: 'json' | 'csv';
  };
  security: {
    elevationPolicy: 'ask-each-time' | 'deny';
    confirmDestructive: boolean;
    confirmExternalLinks: boolean;
    secureCredentials: boolean;
  };
  updates: {
    automaticChecks: boolean;
    channel: 'stable';
  };
  advanced: {
    diagnosticLogging: boolean;
    logLevel: 'error' | 'warn' | 'info' | 'debug';
    developerTools: boolean;
  };
  window: {
    bounds: { x?: number; y?: number; width: number; height: number } | null;
    lastPage: string;
  };
}

export const defaultSettings: AppSettings = settingsDefaults as AppSettings;
