import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { createStartupManager, CURRENT_USER_RUN_KEY } = require('../electron/startup-manager.cjs') as {
  CURRENT_USER_RUN_KEY: string;
  createStartupManager: (options: { execFile: (file: string, args: string[], options: Record<string, unknown>) => Promise<{ stdout: string }>; readJournal: (name: string) => Promise<Record<string, unknown> | null>; writeJournal: (name: string, data: Record<string, unknown>) => Promise<void> }) => { disable: (input: { valueName: string; dryRun?: boolean }) => Promise<Record<string, any>>; restore: (input: { journalId: string; dryRun?: boolean }) => Promise<Record<string, any>> };
};

const journalId = '11111111-1111-4111-8111-111111111111';
const RUN_KEY_OUTPUT = `
HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Run
    OneDrive    REG_SZ    C:\\Windows\\System32\\OneDriveSetup.exe /background
`;
let execute: ReturnType<typeof vi.fn>;
let journals: Map<string, Record<string, unknown>>;

beforeEach(() => {
  journals = new Map();
  execute = vi.fn(async (_file: string, args: string[]) => {
    if (args[0] === 'query') return { stdout: RUN_KEY_OUTPUT };
    return { stdout: '' };
  });
});

function manager() {
  return createStartupManager({
    execFile: execute,
    readJournal: async name => journals.get(name) || null,
    writeJournal: async (name, data) => { journals.set(name, data); }
  });
}

describe('current-user startup manager', () => {
  it('disables only one named current-user Run value and stores a restore journal', async () => {
    const result = await manager().disable({ valueName: 'OneDrive' });
    // The whole Run key is read, not a single `/v` value: `reg query /v` exits
    // with code 1 both when the value is missing and when the key is unreadable,
    // which used to turn an unreadable key into a "verified removal".
    expect(execute).toHaveBeenNthCalledWith(1, 'reg.exe', ['query', CURRENT_USER_RUN_KEY], expect.any(Object));
    expect(execute).toHaveBeenNthCalledWith(2, 'reg.exe', ['delete', CURRENT_USER_RUN_KEY, '/v', 'OneDrive', '/f'], expect.any(Object));
    expect(result.summary).toMatchObject({ valueName: 'OneDrive', changed: true, recoverable: true });
    const [name, journal] = [...journals.entries()][0];
    expect(name).toMatch(/^undo-startup-[0-9a-f-]+\.json$/);
    expect(journal).toMatchObject({ source: CURRENT_USER_RUN_KEY, valueName: 'OneDrive', valueType: 'REG_SZ' });
  });

  it('supports an inspect-only dry run and rejects malformed value names before execution', async () => {
    const result = await manager().disable({ valueName: 'OneDrive', dryRun: true });
    expect(result.summary).toMatchObject({ changed: false, dryRun: true, journalId: null });
    expect(execute).toHaveBeenCalledTimes(1);
    expect(journals.size).toBe(0);
    await expect(manager().disable({ valueName: 'bad\\name' })).rejects.toThrow('invalid');
    expect(execute).toHaveBeenCalledTimes(1);
  });

  it('restores only a valid local journal and refuses to overwrite an existing startup value', async () => {
    journals.set(`undo-startup-${journalId}.json`, { journalId, action: 'startup-disable', source: CURRENT_USER_RUN_KEY, valueName: 'OneDrive', valueType: 'REG_SZ', valueData: 'C:\\Windows\\System32\\OneDriveSetup.exe /background' });
    execute.mockImplementationOnce(async () => ({ stdout: '\nHKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\n' }));
    const result = await manager().restore({ journalId });
    expect(result.summary).toMatchObject({ valueName: 'OneDrive', changed: true, recoverable: true });
    expect(execute).toHaveBeenNthCalledWith(2, 'reg.exe', ['add', CURRENT_USER_RUN_KEY, '/v', 'OneDrive', '/t', 'REG_SZ', '/d', 'C:\\Windows\\System32\\OneDriveSetup.exe /background', '/f'], expect.any(Object));
    execute.mockClear();
    await expect(manager().restore({ journalId })).rejects.toThrow('already exists');
    expect(execute).toHaveBeenCalledTimes(1);
  });

  it('reports an unreadable Run key as an error instead of a missing entry', async () => {
    execute.mockImplementationOnce(async () => { const error = new Error('Access is denied.') as Error & { code?: number }; error.code = 1; throw error; });
    await expect(manager().disable({ valueName: 'OneDrive' })).rejects.toThrow('Unable to inspect');
    expect(journals.size).toBe(0);
  });

  it('refuses to delete a startup value whose registry type cannot be restored', async () => {
    execute.mockImplementationOnce(async () => ({ stdout: '\nHKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\n    OneDrive    REG_DWORD    1\n' }));
    await expect(manager().disable({ valueName: 'OneDrive' })).rejects.toThrow('unsupported registry type');
    expect(execute).toHaveBeenCalledTimes(1);
    expect(journals.size).toBe(0);
  });

  it('reports a startup value that does not exist without touching the registry', async () => {
    execute.mockImplementationOnce(async () => ({ stdout: '\nHKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\n' }));
    await expect(manager().disable({ valueName: 'OneDrive' })).rejects.toThrow('not found');
    expect(execute).toHaveBeenCalledTimes(1);
    expect(journals.size).toBe(0);
  });
});
