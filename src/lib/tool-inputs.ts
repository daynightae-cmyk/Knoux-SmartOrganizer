import type { ToolDefinition } from '@shared/contracts';

export interface ToolRunInputs {
  journalId: string;
  serviceName: string;
  serviceAction: string;
  startupValue: string;
  dryRun: boolean;
}

/**
 * Builds the exact input payload for a tool.
 *
 * Every schema in the registry is strict, so a single stray key makes the whole
 * operation fail before it starts. The payload is therefore assembled from the
 * tool definition alone, and `dryRun` is only ever sent to tools that declare
 * support for it.
 */
export function buildToolInputs(
  tool: ToolDefinition,
  extra: Record<string, unknown>,
  confirmed: boolean,
  aux: ToolRunInputs
): Record<string, unknown> {
  const toolId = tool.id;
  const dryRun = tool.supportsDryRun && aux.dryRun ? { dryRun: true } : {};
  if (['organize-downloads-undo', 'temp-cleanup-undo'].includes(toolId)) return { journalId: aux.journalId, ...extra };
  if (toolId === 'service-startup-undo' || toolId === 'startup-restore') return { journalId: aux.journalId, confirm: true, ...dryRun, ...extra };
  if (toolId === 'service-control') {
    return { serviceName: aux.serviceName, action: aux.serviceAction, confirm: true, ...dryRun, ...extra };
  }
  if (toolId === 'startup-disable') return { valueName: aux.startupValue, confirm: true, ...dryRun, ...extra };
  if (['organize-downloads-apply', 'temp-cleanup-apply'].includes(toolId)) {
    return { confirm: true, ...dryRun, ...extra };
  }
  const base: Record<string, unknown> = { ...extra };
  // A read-only tool has a strict empty input schema: sending it `confirm`
  // would reject the whole request. Confirmation only belongs on write tools.
  const isWrite = tool.requiresAdmin || tool.riskLevel !== 'read-only';
  if (isWrite) { base.confirm = true; Object.assign(base, dryRun); }
  if (confirmed && isWrite) base.confirm = true;
  return base;
}
