export type Locale = 'ar' | 'en';
export type RiskLevel = 'read-only' | 'safe-write' | 'system-change' | 'destructive' | 'admin';
export type OperationPhase = 'idle' | 'queued' | 'preflight' | 'waiting-for-permission' | 'running' | 'progress' | 'result' | 'completed' | 'cancelled' | 'failed' | 'rolled-back';

export interface ToolDefinition {
  id: string;
  nameKey: string;
  descriptionKey: string;
  category: string;
  icon: string;
  riskLevel: RiskLevel;
  requiresAdmin: boolean;
  supportsDryRun: boolean;
  supportsCancel: boolean;
  supportsUndo: boolean;
  supportsExport: boolean;
  estimatedCost: 'low' | 'medium' | 'high';
  available: boolean;
}

export interface OperationEvent {
  operationId: string;
  toolId: string;
  phase: OperationPhase;
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
  summary: Record<string, string | number | boolean | null>;
  items: Array<Record<string, unknown>>;
  warnings: string[];
  errors: string[];
  partial?: boolean;
}

export interface OperationRecord extends ToolResult {
  action: string;
  durationMs: number;
  undoAvailable: boolean;
}

export interface AppSettings {
  settingsVersion: 1;
  general: { startMinimized: boolean; closeToTray: boolean; rememberLastSection: boolean };
  appearance: { theme: 'dark' | 'light' | 'system'; density: 'comfortable' | 'compact'; reducedMotion: boolean; fontScale: number };
  localization: { locale: Locale; byteUnits: 'binary' | 'decimal' };
  scan: { includeHidden: boolean; followReparsePoints: false; minimumDuplicateBytes: number; largeFileBytes: number };
  cleanup: { recycleBinByDefault: boolean; minimumFileAgeDays: number; confirmDestructive: boolean };
  performance: { mode: 'eco' | 'balanced' | 'performance' };
  privacy: { telemetry: false; crashReports: false };
  notifications: { taskCompleted: boolean; taskFailed: boolean; lowDiskSpace: boolean };
}

export const defaultSettings: AppSettings = {
  settingsVersion: 1,
  general: { startMinimized: false, closeToTray: true, rememberLastSection: true },
  appearance: { theme: 'dark', density: 'comfortable', reducedMotion: false, fontScale: 1 },
  localization: { locale: 'ar', byteUnits: 'binary' },
  scan: { includeHidden: false, followReparsePoints: false, minimumDuplicateBytes: 1024 * 1024, largeFileBytes: 500 * 1024 * 1024 },
  cleanup: { recycleBinByDefault: true, minimumFileAgeDays: 7, confirmDestructive: true },
  performance: { mode: 'balanced' },
  privacy: { telemetry: false, crashReports: false },
  notifications: { taskCompleted: true, taskFailed: true, lowDiskSpace: true }
};
