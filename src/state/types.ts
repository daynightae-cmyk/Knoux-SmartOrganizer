import type { OperationEvent, OperationRecord, ToolResult } from '@shared/contracts';

export interface AppInfo { version: string; startedAt: string; platform: string; isPackaged: boolean; electron: string; chromium: string }

export type AutomationTrigger =
  | { kind: 'daily'; time: string }
  | { kind: 'weekly'; time: string; dayOfWeek: 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN' }
  | { kind: 'monthly'; time: string; dayOfMonth: number }
  | { kind: 'startup' };

export interface AutomationSchedule {
  id: string;
  toolId: 'smart-scan' | 'disk-overview' | 'downloads-inventory' | 'temp-cleanup-preview' | 'system-health';
  label: string;
  trigger: AutomationTrigger;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  lastRun: { startedAt: string; finishedAt: string; success: boolean; summary: Record<string, unknown>; warnings: string[]; errors: string[] } | null;
}

export interface RunOptions {
  /** A user-initiated run opens the activity drawer and selects the tool workspace. */
  interactive?: boolean;
}

export interface ActiveOperation {
  event: OperationEvent;
  elapsedMs: number;
}

export type { OperationEvent, OperationRecord, ToolResult };
