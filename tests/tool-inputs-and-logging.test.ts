import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';
import type { ToolDefinition } from '@shared/contracts';

const require = createRequire(import.meta.url);
const { redactLogValue, formatLogLine } = require('../electron/log-redaction.cjs') as {
  redactLogValue: (value: unknown, key?: string) => unknown;
  formatLogLine: (level: string, event: string, details?: Record<string, unknown>) => string;
};
const { buildToolInputs } = await import('../src/lib/tool-inputs');

function tool(overrides: Partial<ToolDefinition>): ToolDefinition {
  return {
    id: 'system-health', nameKey: 'tools.system-health.name', descriptionKey: 'tools.system-health.description',
    category: 'system', icon: 'Activity', riskLevel: 'read-only', requiresAdmin: false,
    supportsDryRun: false, supportsProgress: false, supportsCancel: false, supportsUndo: false,
    supportsExport: true, inputSchema: { id: 'x', version: 1 }, outputSchema: { id: 'y', version: 1 },
    estimatedCost: 'low', availability: { available: true }, ...overrides
  };
}

const aux = { journalId: '11111111-1111-4111-8111-111111111111', serviceName: 'Spooler', serviceAction: 'restart', startupValue: 'OneDrive', dryRun: false };

describe('tool input payloads', () => {
  const mutating = [
    'organize-downloads-apply', 'organize-downloads-undo', 'temp-cleanup-apply', 'temp-cleanup-undo',
    'startup-disable', 'startup-restore', 'service-control', 'service-startup-undo'
  ];

  it('never sends a key that the strict input schemas would reject', () => {
    for (const id of mutating) {
      const payload = buildToolInputs(tool({ id, riskLevel: 'safe-write' }), {}, true, aux);
      expect(Object.keys(payload)).not.toContain('__admin');
    }
  });

  it('sends confirm for every mutating tool except the undo tools', () => {
    // The undo tools carry their own journal flow and their strict schemas do
    // not accept a confirm key at all.
    const undoTools = ['organize-downloads-undo', 'temp-cleanup-undo'];
    for (const id of mutating) {
      const payload = buildToolInputs(tool({ id, riskLevel: 'safe-write' }), {}, true, aux);
      if (undoTools.includes(id)) expect(payload.confirm).toBeUndefined();
      else expect(payload.confirm).toBe(true);
    }
  });

  it('does not send dryRun to a tool that does not support it', () => {
    const payload = buildToolInputs(tool({ id: 'organize-downloads-apply', riskLevel: 'safe-write' }), {}, true, { ...aux, dryRun: true });
    expect(payload.dryRun).toBeUndefined();
  });

  it('sends dryRun to a tool that supports it', () => {
    const payload = buildToolInputs(tool({ id: 'temp-cleanup-apply', riskLevel: 'safe-write', supportsDryRun: true }), {}, true, { ...aux, dryRun: true });
    expect(payload.dryRun).toBe(true);
  });

  it('keeps a read-only tool payload free of confirmation keys', () => {
    const payload = buildToolInputs(tool({ id: 'system-health' }), { folder: 'C:\\Temp' }, true, aux);
    expect(payload.confirm).toBeUndefined();
    expect(payload.folder).toBe('C:\\Temp');
  });

  it('carries the exact undo journal identifier', () => {
    const payload = buildToolInputs(tool({ id: 'temp-cleanup-undo', riskLevel: 'safe-write' }), {}, true, aux);
    expect(payload.journalId).toBe(aux.journalId);
  });

  it('carries the exact service identity and action', () => {
    const payload = buildToolInputs(tool({ id: 'service-control', riskLevel: 'administrator', requiresAdmin: true }), {}, true, aux);
    expect(payload.serviceName).toBe('Spooler');
    expect(payload.action).toBe('restart');
  });
});

describe('operation log redaction', () => {
  it('redacts secret-looking keys', () => {
    expect(redactLogValue('hunter2', 'password')).toBe('[redacted]');
    expect(redactLogValue('abc', 'apiKey')).toBe('[redacted]');
    expect(redactLogValue('abc', 'authorization')).toBe('[redacted]');
    expect(redactLogValue('abc', 'sessionToken')).toBe('[redacted]');
  });

  it('keeps ordinary values readable', () => {
    expect(redactLogValue(42, 'count')).toBe(42);
    expect(redactLogValue('ok', 'status')).toBe('ok');
    expect(redactLogValue(false, 'partial')).toBe(false);
  });

  it('redacts secrets nested inside objects and arrays', () => {
    const redacted = redactLogValue({ user: 'sa', password: 'hunter2', nested: [{ token: 'x' }] }, 'payload') as Record<string, unknown>;
    expect(redacted.password).toBe('[redacted]');
    expect((redacted.nested as unknown[])[0]).toEqual({ token: '[redacted]' });
    expect(redacted.user).toBe('sa');
  });

  it('never writes a secret into the log line', () => {
    const line = formatLogLine('info', 'operation.completed', { password: 'hunter2', toolId: 'system-health' });
    expect(line).not.toContain('hunter2');
    expect(line).toContain('system-health');
    expect(line.endsWith('\n')).toBe(true);
  });
});
