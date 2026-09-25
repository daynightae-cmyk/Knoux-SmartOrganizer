import type { OperationEvent, ToolResult } from '@shared/contracts';

export const SMART_SCAN_STAGES = [
  { index: 1, key: 'smartScan.stage.1' },
  { index: 2, key: 'smartScan.stage.2' },
  { index: 3, key: 'smartScan.stage.3' },
  { index: 4, key: 'smartScan.stage.4' },
  { index: 5, key: 'smartScan.stage.5' },
  { index: 6, key: 'smartScan.stage.6' },
  { index: 7, key: 'smartScan.stage.7' }
] as const;

export const SMART_SCAN_TOTAL = 7;

/** Derives the completed stage count from a real backend progress event. Never invents stages. */
export function smartScanStageFromEvent(event: OperationEvent | null): number {
  if (!event || event.toolId !== 'smart-scan') return 0;
  if (typeof event.current === 'number' && typeof event.total === 'number' && event.total === SMART_SCAN_TOTAL) {
    return Math.max(0, Math.min(SMART_SCAN_TOTAL, Math.floor(event.current)));
  }
  if (typeof event.percent === 'number') {
    return Math.max(0, Math.min(SMART_SCAN_TOTAL, Math.floor((event.percent / 100) * SMART_SCAN_TOTAL)));
  }
  if (typeof event.progress === 'number') {
    return Math.max(0, Math.min(SMART_SCAN_TOTAL, Math.floor((event.progress / 100) * SMART_SCAN_TOTAL)));
  }
  return 0;
}

export interface SmartScanFinding {
  severity: 'info' | 'warning';
  key: string;
  drive?: unknown;
  freePercent?: unknown;
  pressure?: unknown;
  value?: unknown;
  bytes?: unknown;
  groups?: unknown;
  reclaimableBytes?: unknown;
  contentsInspected?: unknown;
}

export function smartScanFindings(result: ToolResult | null): SmartScanFinding[] {
  if (!result || result.toolId !== 'smart-scan' || !Array.isArray(result.items)) return [];
  const out: SmartScanFinding[] = [];
  for (const item of result.items) {
    if (typeof item !== 'object' || item === null) continue;
    const record = item as Record<string, unknown>;
    if (typeof record.key !== 'string') continue;
    out.push({
      severity: record.severity === 'warning' ? 'warning' : 'info',
      key: record.key,
      drive: record.drive,
      freePercent: record.freePercent,
      pressure: record.pressure,
      value: record.value,
      bytes: record.bytes,
      groups: record.groups,
      reclaimableBytes: record.reclaimableBytes,
      contentsInspected: record.contentsInspected
    });
  }
  return out;
}

export function smartScore(result: ToolResult | null): number | null {
  const value = result?.summary?.smartScore;
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export function smartScoreReasons(result: ToolResult | null): string[] {
  const value = result?.summary?.scoreReasons;
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

export function scoreReasonKey(reason: string): string {
  const normalized = reason.toLowerCase().replace(/[^a-z]+/g, '-').replace(/^-+|-+$/g, '');
  const known: Record<string, string> = {
    'high-memory-pressure': 'smartScan.reason.high-memory-pressure',
    'memory-pressure': 'smartScan.reason.memory-pressure',
    'critical-disk-pressure': 'smartScan.reason.critical-disk-pressure',
    'disk-pressure': 'smartScan.reason.disk-pressure',
    'large-duplicate-footprint': 'smartScan.reason.large-duplicate-footprint',
    'duplicate-footprint': 'smartScan.reason.duplicate-footprint',
    'privacy-review': 'smartScan.reason.privacy-review',
    'large-temp-footprint': 'smartScan.reason.large-temp-footprint'
  };
  return known[normalized] ?? reason;
}

export function findingTitleKey(finding: SmartScanFinding): string {
  return `smartScan.finding.${finding.key}`;
}
