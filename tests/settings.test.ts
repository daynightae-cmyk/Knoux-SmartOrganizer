import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { createSettingsStore, defaults } = require('../electron/settings.cjs') as {
  createSettingsStore: (options: { userDataPath: string; now?: () => Date; rename?: (from: string, to: string) => Promise<void> }) => any;
  defaults: any;
};

let directory = '';
beforeEach(async () => { directory = await mkdtemp(join(tmpdir(), 'knoux-settings-')); });
afterEach(async () => { await rm(directory, { recursive: true, force: true }); });

describe('versioned settings storage', () => {
  it('loads defaults and persists them atomically', async () => {
    const store = createSettingsStore({ userDataPath: directory });
    expect(await store.load()).toEqual(defaults);
    expect(JSON.parse(await readFile(join(directory, 'settings.json'), 'utf8'))).toEqual(defaults);
  });

  it('retries a transient Windows rename lock and preserves atomic persistence', async () => {
    let calls = 0;
    const rename = async (from: string, to: string) => { calls++; if (calls < 3) { const error = Object.assign(new Error('locked'), { code: 'EPERM' }); throw error; } await (await import('node:fs/promises')).rename(from, to); };
    const store = createSettingsStore({ userDataPath: directory, rename });
    await store.load();
    expect(calls).toBe(3);
    expect(JSON.parse(await readFile(join(directory, 'settings.json'), 'utf8'))).toEqual(defaults);
  });

  it('saves a validated update and survives a new store instance', async () => {
    const first = createSettingsStore({ userDataPath: directory });
    await first.load();
    await first.update({ appearance: { ...defaults.appearance, theme: 'dark', fontScale: 1.2 } });
    const restarted = createSettingsStore({ userDataPath: directory });
    expect((await restarted.load()).appearance).toMatchObject({ theme: 'dark', fontScale: 1.2 });
    expect(await readFile(first.backup, 'utf8')).toContain('"settingsVersion": 2');
  });

  it('imports complete valid JSON', async () => {
    const store = createSettingsStore({ userDataPath: directory });
    const imported = { ...defaults, localization: { ...defaults.localization, locale: 'en', region: 'US' } };
    expect((await store.importText(JSON.stringify(imported))).localization).toMatchObject({ locale: 'en', region: 'US' });
  });

  it('persists an imported document through a restarted store', async () => {
    const store = createSettingsStore({ userDataPath: directory });
    const imported = { ...defaults, appearance: { ...defaults.appearance, accent: 'green' } };
    await store.importText(JSON.stringify(imported));
    expect((await createSettingsStore({ userDataPath: directory }).load()).appearance.accent).toBe('green');
  });

  it('rejects incomplete or unknown-key imported documents', async () => {
    const store = createSettingsStore({ userDataPath: directory });
    await expect(store.importText(JSON.stringify({ settingsVersion: 2 }))).rejects.toThrow();
    await expect(store.importText(JSON.stringify({ ...defaults, unexpected: true }))).rejects.toThrow();
  });

  it('resets one section without changing the others', async () => {
    const store = createSettingsStore({ userDataPath: directory });
    await store.load();
    await store.update({ appearance: { ...defaults.appearance, theme: 'dark' }, history: { ...defaults.history, retentionDays: 14 } });
    const reset = await store.resetSection('appearance');
    expect(reset.appearance).toEqual(defaults.appearance);
    expect(reset.history.retentionDays).toBe(14);
  });

  it('resets all settings', async () => {
    const store = createSettingsStore({ userDataPath: directory });
    await store.load();
    await store.update({ automation: { ...defaults.automation, enabled: true } });
    expect(await store.resetAll()).toEqual(defaults);
  });

  it('backs up invalid JSON and safely restores defaults', async () => {
    await writeFile(join(directory, 'settings.json'), '{invalid', 'utf8');
    const store = createSettingsStore({ userDataPath: directory, now: () => new Date('2026-08-24T10:00:00.000Z') });
    expect(await store.load()).toEqual(defaults);
    expect(await readFile(join(directory, 'settings.json.invalid-2026-08-24T10-00-00-000Z.bak'), 'utf8')).toBe('{invalid');
  });

  it('migrates schema version 1 and keeps privacy disabled', async () => {
    await writeFile(join(directory, 'settings.json'), JSON.stringify({ settingsVersion: 1, appearance: { theme: 'light', density: 'compact', reducedMotion: true, fontScale: 1.1 }, localization: { locale: 'en', byteUnits: 'decimal' }, scan: { minimumDuplicateBytes: 2048, largeFileBytes: 4096 }, privacy: { telemetry: true, crashReports: true } }), 'utf8');
    const migrated = await createSettingsStore({ userDataPath: directory }).load();
    expect(migrated.settingsVersion).toBe(2);
    expect(migrated.appearance).toMatchObject({ theme: 'light', density: 'compact', reduceMotion: true, fontScale: 1.1 });
    expect(migrated.privacy).toMatchObject({ telemetry: false, crashReporting: false });
  });

  it('rejects unknown keys rather than silently persisting them', async () => {
    const store = createSettingsStore({ userDataPath: directory });
    await store.load();
    await expect(store.update({ appearance: { ...defaults.appearance, hiddenOverride: true } })).rejects.toThrow();
  });
});
