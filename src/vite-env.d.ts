/// <reference types="vite/client" />
import type { AppSettings, OperationEvent, OperationRecord, ToolDefinition, ToolResult } from '@shared/contracts';
import type { StudioBridge } from './studio/types';

type AutomationTrigger =
  | { kind: 'daily'; time: string }
  | { kind: 'weekly'; time: string; dayOfWeek: 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN' }
  | { kind: 'monthly'; time: string; dayOfMonth: number }
  | { kind: 'startup' };
interface AutomationSchedule {
  id: string;
  toolId: 'smart-scan' | 'disk-overview' | 'downloads-inventory' | 'temp-cleanup-preview' | 'system-health';
  label: string;
  trigger: AutomationTrigger;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  lastRun: { startedAt: string; finishedAt: string; success: boolean; summary: Record<string, unknown>; warnings: string[]; errors: string[] } | null;
}

export interface ClipboardItem {
  id: string;
  type: 'text' | 'image' | 'files';
  createdAt: string;
  pinned: boolean;
  sizeBytes: number;
  sensitive: boolean;
  preview: string;
  lineCount: number;
  text?: string | null;
  files?: string[] | null;
  image?: string | null;
}

export interface ClipboardStatus {
  enabled: boolean;
  paused: boolean;
  privateMode: boolean;
  running: boolean;
  monitoring: boolean;
  storageMode: 'encrypted' | 'memory-only';
  persistenceAvailable: boolean;
  encryptionAvailable: boolean;
  items: number;
  pinned: number;
  skippedSensitive: number;
  skippedOversize: number;
  unreadableItems: number;
  maxItems: number;
  retentionDays: number;
  captureImages: boolean;
  captureFiles: boolean;
  sensitiveProtection: boolean;
  storageBytes: number;
  limits: { maxTextBytes: number; maxImageBytes: number; maxFiles: number };
}

/**
 * A Windows-native application icon for the Applications workspace.
 *
 * `ready` always carries a real PNG produced from the shell, an MSIX/AppX package
 * or a `.ico` file. Anything that could not be resolved comes back `unavailable`
 * with a machine-readable reason token, so the renderer can show the typographic
 * identity instead of a placeholder. No path ever crosses this bridge.
 */
export interface AppIconResult {
  id: string;
  status: 'ready' | 'unavailable' | 'unknown-app';
  source: 'shell' | 'package' | 'ico' | 'none';
  dataUrl?: string;
  /** Square edge actually produced; icons are never upscaled. */
  pixels?: number;
  reason?: string;
}

export interface AppInfo {
  version: string;
  startedAt: string;
  platform: string;
  arch?: string;
  isPackaged: boolean;
  electron: string;
  chromium: string;
  node?: string;
  releaseChannel?: string;
  codeSigning?: {
    state: 'SIGNED_PRODUCTION' | 'UNSIGNED_PRODUCTION_CANDIDATE' | 'UNAVAILABLE';
    status: string | null;
    publisher: string | null;
    timestampPublisher: string | null;
    signatureAlgorithm: string | null;
    timestamped?: boolean;
  };
}

declare global {
  interface Window {
    knoux: {
      appInfo: () => Promise<AppInfo>;
      listTools: () => Promise<ToolDefinition[]>;
      getSettings: () => Promise<AppSettings>;
      updateSettings: (patch: Partial<AppSettings>) => Promise<AppSettings>;
      exportSettings: () => Promise<string | null>;
      importSettings: () => Promise<AppSettings | null>;
      resetSettingsSection: (section: keyof Omit<AppSettings, 'settingsVersion'>) => Promise<AppSettings>;
      resetSettings: () => Promise<AppSettings>;
      listHistory: () => Promise<OperationRecord[]>;
      exportHistory: (format: 'json' | 'csv') => Promise<string | null>;
      listAutomations: () => Promise<AutomationSchedule[]>;
      createAutomation: (input: { toolId: AutomationSchedule['toolId']; label: string; trigger: AutomationTrigger }) => Promise<AutomationSchedule>;
      removeAutomation: (id: string) => Promise<boolean>;
      setAutomationEnabled: (request: { id: string; enabled: boolean }) => Promise<AutomationSchedule>;
      runAutomation: (id: string) => Promise<ToolResult>;
      chooseFolder: () => Promise<string | null>;
      chooseFile: () => Promise<string | null>;
      runTool: (request: { toolId: string; inputs: Record<string, unknown>; silent?: boolean }) => Promise<ToolResult>;
      cancelOperation: (operationId: string) => Promise<boolean>;
      openPath: (target: string) => Promise<string>;
      exportDiagnostics: () => Promise<string | null>;
      codeSigning: () => Promise<NonNullable<AppInfo['codeSigning']>>;
      /** Opaque installed-application ids in, native icons or an honest reason out. */
      appIcons: (request: { ids: string[] }) => Promise<AppIconResult[]>;
      clipboardStatus: () => Promise<ClipboardStatus>;
      clipboardList: (request?: { query?: string; type?: 'all' | 'text' | 'image' | 'files'; pinnedOnly?: boolean }) => Promise<ClipboardItem[]>;
      clipboardGet: (id: string) => Promise<ClipboardItem | null>;
      clipboardSetPinned: (request: { id: string; pinned: boolean }) => Promise<ClipboardItem | null>;
      clipboardDelete: (id: string) => Promise<boolean>;
      clipboardClear: () => Promise<number>;
      clipboardCopyBack: (id: string) => Promise<ClipboardItem | null>;
      clipboardOpenSource: (id: string) => Promise<string>;
      onClipboardChanged: (callback: (status: ClipboardStatus) => void) => () => void;
      onSettingsChanged: (callback: (settings: AppSettings) => void) => () => void;
      onOperationEvent: (callback: (event: OperationEvent) => void) => () => void;
    };
    knouxStudio?: StudioBridge;
  }
}
export {};
