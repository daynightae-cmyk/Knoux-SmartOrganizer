import type { OperationEvent, OperationPhase, ToolDefinition, ToolResult } from '@shared/contracts';
import type { PageId } from './pages';

export const ACTIVE_PHASES: OperationPhase[] = [
  'queued', 'preflight', 'awaiting-confirmation', 'awaiting-admin', 'running', 'progress'
];

export const TERMINAL_PHASES: OperationPhase[] = ['completed', 'cancelled', 'failed', 'result'];

const UNDO_WITHOUT_EXPLICIT_CONFIRM = new Set(['organize-downloads-undo', 'temp-cleanup-undo']);

const FOLDER_TOOLS = new Set([
  'large-files', 'duplicate-files', 'empty-folders',
  'organize-downloads-preview', 'organize-downloads-apply'
]);

export function isActivePhase(phase: string | undefined | null): boolean {
  return !!phase && (ACTIVE_PHASES as string[]).includes(phase);
}

export function resolveTool(tools: ToolDefinition[], id: string | null | undefined): ToolDefinition | null {
  if (!id) return null;
  return tools.find(tool => tool.id === id) ?? null;
}

export function canRunTool(tool: ToolDefinition | null | undefined): boolean {
  return !!tool && tool.availability.available === true;
}

export function unavailableReason(tool: ToolDefinition | null | undefined): string {
  if (!tool) return 'Unknown tool.';
  return tool.availability.reason || 'Tool is unavailable.';
}

/** Non-read-only tools require an explicit checkbox, except undo-restore tools that carry their own journal flow. */
export function requiresConfirmation(tool: ToolDefinition | null | undefined): boolean {
  if (!tool) return false;
  if (UNDO_WITHOUT_EXPLICIT_CONFIRM.has(tool.id)) return false;
  return tool.riskLevel !== 'read-only';
}

export function cancelAllowed(tool: ToolDefinition | null | undefined, event: OperationEvent | null): boolean {
  if (!tool || !event) return false;
  if (!tool.supportsCancel) return false;
  return isActivePhase(event.phase) && event.phase !== 'awaiting-admin';
}

export function undoAllowed(tool: ToolDefinition | null | undefined, result: ToolResult | null): boolean {
  if (!tool || !result) return false;
  if (!tool.supportsUndo) return false;
  return result.undoMetadata != null && typeof result.undoMetadata === 'object';
}

export function needsFolder(tool: ToolDefinition | null | undefined): boolean {
  return !!tool && FOLDER_TOOLS.has(tool.id);
}

export function needsFile(tool: ToolDefinition | null | undefined): boolean {
  return !!tool && tool.id === 'file-hash';
}

export function filterToolsByPage(tools: ToolDefinition[], page: string): ToolDefinition[] {
  if (page === 'home') return tools;
  if (page === 'scan') return tools.filter(tool => tool.id === 'smart-scan');
  if (page === 'history' || page === 'settings' || page === 'automation') return [];
  return tools.filter(tool => tool.category === page);
}

export function searchFilterTools(
  tools: ToolDefinition[],
  page: string,
  query: string,
  translate: (key: string) => string
): ToolDefinition[] {
  const scoped = filterToolsByPage(tools, page === 'home' ? 'home' : page);
  const q = query.trim().toLowerCase();
  if (!q) return scoped;
  return scoped.filter(tool => {
    const haystack = `${translate(tool.nameKey)} ${translate(tool.descriptionKey)} ${tool.category} ${tool.id}`.toLowerCase();
    return q.split(/\s+/).every(word => haystack.includes(word));
  });
}

export function paletteTargetForTool(tool: ToolDefinition): PageId {
  if (tool.category === 'scan') return 'scan';
  const known: PageId[] = ['storage', 'files', 'applications', 'cleanup', 'startup', 'system', 'repair', 'services', 'network', 'hardware'];
  return (known as string[]).includes(tool.category) ? (tool.category as PageId) : 'home';
}

export function phaseLabelKey(phase: string): string {
  const known = ['idle', 'queued', 'preflight', 'awaiting-confirmation', 'awaiting-admin', 'running', 'progress', 'result', 'completed', 'cancelled', 'failed', 'rolling-back', 'rolled-back'];
  return known.includes(phase) ? `phase.${phase}` : 'phase.running';
}

export function progressOf(event: OperationEvent | null, result: ToolResult | null): number {
  if (typeof event?.percent === 'number') return Math.max(0, Math.min(100, event.percent));
  if (typeof event?.progress === 'number') return Math.max(0, Math.min(100, event.progress));
  if (event && typeof event.current === 'number' && typeof event.total === 'number' && event.total > 0) {
    return Math.max(0, Math.min(100, Math.round((event.current / event.total) * 100)));
  }
  if (result) return 100;
  return 0;
}

export function isIndeterminate(event: OperationEvent | null, tool: ToolDefinition | null): boolean {
  if (!event || !isActivePhase(event.phase)) return false;
  if (tool && tool.supportsProgress === false) return true;
  return event.percent == null && event.progress == null && (event.current == null || event.total == null);
}
