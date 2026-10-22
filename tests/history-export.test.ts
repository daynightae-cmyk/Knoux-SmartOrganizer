import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { serializeHistory, parseCsv, CSV_FIELDS } = require('../electron/history-export.cjs') as {
  serializeHistory: (records: unknown[], format: string) => string;
  parseCsv: (text: string) => Record<string, string>[];
  CSV_FIELDS: string[];
};

function record(overrides: Record<string, unknown> = {}) {
  return {
    operationId: '11111111-1111-4111-8111-111111111111',
    toolId: 'system-health',
    action: 'system-health',
    success: true,
    startedAt: '2026-10-22T10:00:00.000Z',
    finishedAt: '2026-10-22T10:00:01.000Z',
    durationMs: 1000,
    undoAvailable: false,
    ...overrides
  };
}

describe('operation history export', () => {
  it('serializes a nonempty JSON history as records, not as an empty object', () => {
    const payload = serializeHistory([record(), record({ toolId: 'smart-scan' })], 'json');
    const parsed = JSON.parse(payload);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed).toHaveLength(2);
    expect(parsed[0].toolId).toBe('system-health');
    expect(parsed[1].toolId).toBe('smart-scan');
  });

  it('serializes an empty history as an empty array', () => {
    expect(JSON.parse(serializeHistory([], 'json'))).toEqual([]);
  });

  it('serializes an empty history to a CSV header only', () => {
    const csv = serializeHistory([], 'csv');
    expect(csv.split('\r\n')[0]).toBe(CSV_FIELDS.join(','));
    expect(parseCsv(csv)).toEqual([]);
  });

  it('round-trips Arabic unicode, quotes, commas and newlines through CSV', () => {
    const csv = serializeHistory([record({ toolId: 'نظافة-القرص', action: 'a,b"c', durationMs: 'line1\nline2' })], 'csv');
    const rows = parseCsv(csv);
    expect(rows).toHaveLength(1);
    expect(rows[0].toolId).toBe('نظافة-القرص');
    expect(rows[0].action).toBe('a,b"c');
    expect(rows[0].durationMs).toBe('line1\nline2');
  });

  it('keeps failed and partial operations in the export', () => {
    const csv = serializeHistory([record({ success: false, toolId: 'repair-dism-scan-health' })], 'csv');
    const rows = parseCsv(csv);
    expect(rows).toHaveLength(1);
    expect(rows[0].success).toBe('false');
    expect(rows[0].toolId).toBe('repair-dism-scan-health');
  });

  it('rejects a non-array history without throwing', () => {
    expect(JSON.parse(serializeHistory(null as unknown as unknown[], 'json'))).toEqual([]);
    expect(() => serializeHistory(undefined as unknown as unknown[], 'csv')).not.toThrow();
  });

  it('does not silently drop records that are not objects', () => {
    const parsed = JSON.parse(serializeHistory([record(), null as unknown as Record<string, unknown>, 'nope'] as unknown as Record<string, unknown>[], 'json'));
    expect(parsed).toHaveLength(1);
  });
});
