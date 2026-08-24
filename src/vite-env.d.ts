/// <reference types="vite/client" />
import type { AppSettings, OperationEvent, OperationRecord, ToolDefinition, ToolResult } from '@shared/contracts';

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

declare global {
  interface Window {
    knoux: {
      appInfo: () => Promise<{ version: string; startedAt: string; platform: string; isPackaged: boolean; electron: string; chromium: string }>;
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
      runTool: (request: { toolId: string; inputs: Record<string, unknown> }) => Promise<ToolResult>;
      cancelOperation: (operationId: string) => Promise<boolean>;
      openPath: (target: string) => Promise<string>;
      onSettingsChanged: (callback: (settings: AppSettings) => void) => () => void;
      onOperationEvent: (callback: (event: OperationEvent) => void) => () => void;
    };
  }
}
export {};
