/// <reference types="vite/client" />
import type { AppSettings, OperationEvent, OperationRecord, ToolDefinition, ToolResult } from '@shared/contracts';

declare global {
  interface Window {
    knoux: {
      appInfo: () => Promise<{ version: string; startedAt: string; platform: string; isPackaged: boolean }>;
      listTools: () => Promise<ToolDefinition[]>;
      getSettings: () => Promise<AppSettings>;
      updateSettings: (patch: Partial<AppSettings>) => Promise<AppSettings>;
      listHistory: () => Promise<OperationRecord[]>;
      chooseFolder: () => Promise<string | null>;
      chooseFile: () => Promise<string | null>;
      runTool: (request: { toolId: string; inputs: Record<string, unknown>; dryRun?: boolean }) => Promise<ToolResult>;
      cancelOperation: (operationId: string) => Promise<boolean>;
      openPath: (target: string) => Promise<string>;
      onOperationEvent: (callback: (event: OperationEvent) => void) => () => void;
    };
  }
}
export {};
