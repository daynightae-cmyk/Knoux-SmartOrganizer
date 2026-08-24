import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { createAutomationStore } = require('../electron/automation.cjs') as {
  createAutomationStore: (options: { userDataPath: string; executablePath: string; runTask: (args: string[]) => Promise<{ stdout: string; stderr: string }> }) => {
    list: () => Promise<AutomationSchedule[]>;
    create: (input: { toolId: string; label: string; trigger: Record<string, unknown> }) => Promise<AutomationSchedule>;
    remove: (id: string) => Promise<boolean>;
    setEnabled: (id: string, enabled: boolean) => Promise<AutomationSchedule>;
    recordRun: (id: string, result: Record<string, unknown>) => Promise<AutomationSchedule>;
  };
};

interface AutomationSchedule { id: string; toolId: string; label: string; enabled: boolean; trigger: Record<string, unknown>; lastRun: Record<string, unknown> | null; }
let userDataPath = '';
let runTask: ReturnType<typeof vi.fn>;

beforeEach(async () => {
  userDataPath = await mkdtemp(join(tmpdir(), 'knoux-automations-'));
  runTask = vi.fn(async () => ({ stdout: '', stderr: '' }));
});
afterEach(async () => { await rm(userDataPath, { recursive: true, force: true }); });

describe('local automation store', () => {
  it('creates only allowlisted scan/report schedules and persists them', async () => {
    const store = createAutomationStore({ userDataPath, executablePath: 'C:\\Program Files\\KNOuX SmartOrganizer\\KNOuX SmartOrganizer.exe', runTask });
    const created = await store.create({ toolId: 'smart-scan', label: 'Daily scan; not a command', trigger: { kind: 'daily', time: '09:15' } });
    expect(created.enabled).toBe(true);
    expect(created.toolId).toBe('smart-scan');
    expect(await store.list()).toHaveLength(1);
    expect(runTask).toHaveBeenCalledWith(expect.arrayContaining(['/Create', '/SC', 'DAILY', '/ST', '09:15', '/F']));
    expect(JSON.stringify(runTask.mock.calls[0][0])).toContain('--automation-run=');
    expect(JSON.stringify(runTask.mock.calls[0][0])).not.toContain('Daily scan; not a command');
    const reloaded = createAutomationStore({ userDataPath, executablePath: 'C:\\Program Files\\KNOuX SmartOrganizer\\KNOuX SmartOrganizer.exe', runTask });
    expect(await reloaded.list()).toHaveLength(1);
  });

  it('rejects unregistered operations and malformed triggers before Task Scheduler is invoked', async () => {
    const store = createAutomationStore({ userDataPath, executablePath: 'C:\\KNOuX.exe', runTask });
    await expect(store.create({ toolId: 'service-control', label: 'Unsafe', trigger: { kind: 'daily', time: '08:00' } })).rejects.toThrow();
    await expect(store.create({ toolId: 'smart-scan', label: 'Bad', trigger: { kind: 'daily', time: '25:99', command: 'cmd.exe' } })).rejects.toThrow();
    expect(runTask).not.toHaveBeenCalled();
  });

  it('pauses, resumes, records a bounded local result, and deletes a schedule', async () => {
    const store = createAutomationStore({ userDataPath, executablePath: 'C:\\KNOuX.exe', runTask });
    const created = await store.create({ toolId: 'system-health', label: 'Health at startup', trigger: { kind: 'startup' } });
    const paused = await store.setEnabled(created.id, false);
    expect(paused.enabled).toBe(false);
    const resumed = await store.setEnabled(created.id, true);
    expect(resumed.enabled).toBe(true);
    const recorded = await store.recordRun(created.id, { startedAt: '2026-08-24T10:00:00.000Z', finishedAt: '2026-08-24T10:00:01.000Z', success: true, summary: { memory: 42 }, warnings: [], errors: [] });
    expect(recorded.lastRun).toMatchObject({ success: true, summary: { memory: 42 } });
    await expect(store.remove(created.id)).resolves.toBe(true);
    expect(await store.list()).toEqual([]);
    expect(runTask.mock.calls.map(call => call[0][2])).toContainEqual(expect.stringContaining('KNOuXSmartOrganizer-'));
  });
});
