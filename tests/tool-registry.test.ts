import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const { createToolRegistry, serializeRegistry } = require('../electron/tool-registry.cjs') as {
  createToolRegistry: (resolver: (engine: string) => (...args: any[]) => Promise<any>, options?: { platform?: string }) => any[];
  serializeRegistry: (registry: any[]) => Promise<any[]>;
};
const handler = async () => ({ summary: {}, items: [] });

describe('tool registry', () => {
  it('has a real handler, schemas, and availability probe for every enabled tool', async () => {
    const registry = createToolRegistry(() => handler, { platform: 'win32' });
    expect(registry).toHaveLength(17);
    for (const tool of registry) {
      expect(typeof tool.handler).toBe('function');
      expect(tool.inputSchema.safeParse).toBeTypeOf('function');
      expect(tool.outputSchema.safeParse).toBeTypeOf('function');
      expect(await tool.availabilityProbe()).toMatchObject({ available: true });
    }
  });

  it('serializes no executable capability to the renderer', async () => {
    const serialized = await serializeRegistry(createToolRegistry(() => handler, { platform: 'win32' }));
    expect(serialized[0]).not.toHaveProperty('handler');
    expect(serialized[0]).not.toHaveProperty('availabilityProbe');
    expect(serialized[0]).toMatchObject({ inputSchema: { version: 1 }, outputSchema: { version: 1 } });
  });

  it('rejects extra fields and wrong input types', () => {
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

  it('permits a bounded organizer fixture folder but rejects renderer command fields', () => {
    const registry = createToolRegistry(() => handler);
    const preview = registry.find((tool: { id: string }) => tool.id === 'organize-downloads-preview');
    const apply = registry.find((tool: { id: string }) => tool.id === 'organize-downloads-apply');
    expect(preview.inputSchema.safeParse({ folder: 'C:\\fixture', limit: 100 }).success).toBe(true);
    expect(apply.inputSchema.safeParse({ folder: 'C:\\fixture', confirm: true, limit: 100 }).success).toBe(true);
    expect(apply.inputSchema.safeParse({ folder: 'C:\\fixture', confirm: true, command: 'Remove-Item' }).success).toBe(false);
  });
});
