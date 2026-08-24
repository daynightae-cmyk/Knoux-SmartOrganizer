import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const { createToolRegistry, serializeRegistry } = require('../electron/tool-registry.cjs') as {
  createToolRegistry: (resolver: (engine: string) => (...args: unknown[]) => Promise<unknown>, options?: { platform?: string; availabilityResolver?: (engine: string) => Promise<Record<string, unknown>> }) => any[];
  serializeRegistry: (registry: any[]) => Promise<any[]>;
};
const handler = async () => ({ summary: {}, items: [] });
const hostileFields = ['command', 'executable', 'args', 'shell', 'script', 'path', 'unexpected'];

describe('tool registry', () => {
  it('has at least the required tool surface and every enabled tool has a handler, schemas, and probe', async () => {
    const registry = createToolRegistry(() => handler, { platform: 'win32' });
    expect(registry).toHaveLength(34);
    for (const tool of registry) {
      expect(typeof tool.handler).toBe('function');
      expect(tool.inputSchema.safeParse).toBeTypeOf('function');
      expect(tool.outputSchema.safeParse).toBeTypeOf('function');
      expect(await tool.availabilityProbe()).toMatchObject({ available: true });
    }
  });

  it('requires confirm:true for every administrator tool and rejects missing or false confirmation', () => {
    const registry = createToolRegistry(() => handler, { platform: 'win32' });
    const adminTools = registry.filter((tool: { requiresAdmin: boolean }) => tool.requiresAdmin);
    expect(adminTools.length).toBeGreaterThan(0);
    for (const tool of adminTools) {
      if (tool.id === 'service-control' || tool.id === 'service-startup-undo') continue;
      expect(tool.inputSchema.safeParse({ confirm: true }).success).toBe(true);
      expect(tool.inputSchema.safeParse({ confirm: false }).success).toBe(false);
      expect(tool.inputSchema.safeParse({}).success).toBe(false);
      for (const field of hostileFields) expect(tool.inputSchema.safeParse({ confirm: true, [field]: 'injected' }).success).toBe(false);
    }
    const serviceControl = registry.find((tool: { id: string }) => tool.id === 'service-control');
    expect(serviceControl.inputSchema.safeParse({ serviceName: 'Spooler', action: 'restart', confirm: true }).success).toBe(true);
    expect(serviceControl.inputSchema.safeParse({ serviceName: 'Spooler', action: 'restart', confirm: false }).success).toBe(false);
    expect(serviceControl.inputSchema.safeParse({ serviceName: 'Spooler', action: 'restart' }).success).toBe(false);
    for (const field of hostileFields) expect(serviceControl.inputSchema.safeParse({ serviceName: 'Spooler', action: 'restart', confirm: true, [field]: 'injected' }).success).toBe(false);
  });

  it('serializes only safe availability metadata for administrator tools', async () => {
    const availabilityResolver = async () => ({ available: true, capability: 'windows-elevation', executable: 'C:\\Windows\\System32\\dism.exe', args: ['/Online'], command: 'dism /Online', script: 'bad' });
    const serialized = await serializeRegistry(createToolRegistry(() => handler, { platform: 'win32', availabilityResolver }));
    const admins = serialized.filter((tool: { requiresAdmin: boolean }) => tool.requiresAdmin);
    for (const tool of admins) {
      expect(Object.keys(tool.availability).sort()).toEqual(['available', 'capability']);
      expect(tool.availability).toEqual({ available: true, capability: 'windows-elevation' });
      expect(tool).not.toHaveProperty('executable');
      expect(tool).not.toHaveProperty('args');
      expect(tool).not.toHaveProperty('command');
      expect(tool).not.toHaveProperty('script');
      expect(JSON.stringify(tool)).not.toMatch(/System32|dism\.exe|\/Online/i);
    }
  });

  it('preserves a safe unavailable reason without implementation details', async () => {
    const availabilityResolver = async () => ({ available: false, capability: 'windows-elevation', reason: 'Required Windows component is unavailable.', executable: 'C:\\Windows\\System32\\dism.exe' });
    const serialized = await serializeRegistry(createToolRegistry(() => handler, { platform: 'win32', availabilityResolver }));
    const admin = serialized.find((tool: { id: string }) => tool.id === 'repair-dism-check-health');
    expect(admin.availability).toEqual({ available: false, capability: 'windows-elevation', reason: 'Required Windows component is unavailable.' });
  });

  it('rejects extra fields and wrong input types for non-admin tools too', () => {
    const registry = createToolRegistry(() => handler);
    const disk = registry.find((tool: { id: string }) => tool.id === 'disk-overview');
    const large = registry.find((tool: { id: string }) => tool.id === 'large-files');
    expect(disk.inputSchema.safeParse({ command: 'whoami' }).success).toBe(false);
    expect(large.inputSchema.safeParse({ folder: 4 }).success).toBe(false);
    expect(large.inputSchema.safeParse({ folder: 'C:\\fixture', unexpected: true }).success).toBe(false);
  });

  it('rejects oversized and missing file-hash input', () => {
    const registry = createToolRegistry(() => handler);
    const hash = registry.find((tool: { id: string }) => tool.id === 'file-hash');
    expect(hash.inputSchema.safeParse({}).success).toBe(false);
    expect(hash.inputSchema.safeParse({ filePath: 'x'.repeat(32768) }).success).toBe(false);
    expect(hash.inputSchema.safeParse({ filePath: 'C:\\fixture', algorithm: 'md5' }).success).toBe(false);
  });

  it('permits bounded organizer input but rejects renderer command fields', () => {
    const registry = createToolRegistry(() => handler);
    const preview = registry.find((tool: { id: string }) => tool.id === 'organize-downloads-preview');
    const apply = registry.find((tool: { id: string }) => tool.id === 'organize-downloads-apply');
    const cleanup = registry.find((tool: { id: string }) => tool.id === 'temp-cleanup-apply');
    expect(preview.inputSchema.safeParse({ folder: 'C:\\fixture', limit: 100 }).success).toBe(true);
    expect(apply.inputSchema.safeParse({ folder: 'C:\\fixture', confirm: true, limit: 100 }).success).toBe(true);
    expect(apply.inputSchema.safeParse({ folder: 'C:\\fixture', confirm: true, command: 'Remove-Item' }).success).toBe(false);
    expect(cleanup.inputSchema.safeParse({ confirm: true, limit: 10 }).success).toBe(true);
    expect(cleanup.inputSchema.safeParse({}).success).toBe(false);
    expect(cleanup.inputSchema.safeParse({ confirm: true, path: 'C:\\Windows' }).success).toBe(false);
    const startupDisable = registry.find((tool: { id: string }) => tool.id === 'startup-disable');
    const startupRestore = registry.find((tool: { id: string }) => tool.id === 'startup-restore');
    expect(startupDisable.inputSchema.safeParse({ valueName: 'OneDrive', confirm: true }).success).toBe(true);
    expect(startupDisable.inputSchema.safeParse({ valueName: 'bad\\name', confirm: true }).success).toBe(false);
    expect(startupDisable.inputSchema.safeParse({ valueName: 'OneDrive', confirm: true, command: 'reg delete' }).success).toBe(false);
    expect(startupRestore.inputSchema.safeParse({ journalId: '11111111-1111-4111-8111-111111111111', confirm: true }).success).toBe(true);
  });
});
