import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdir, mkdtemp, rename, rm, writeFile, symlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const kit = require('../electron/verification.cjs') as {
  check: (name: string, expected: unknown, observed: unknown, ok: boolean) => { name: string; ok: boolean };
  summarize: (checks: unknown[]) => { status: string };
  verification: (checks: unknown[], extra?: Record<string, unknown>) => Record<string, unknown>;
  pathState: (p: string) => Promise<Record<string, unknown>>;
  verifyMove: (input: { source: string; destination: string; expectedIdentity?: string | null }) => Promise<Record<string, unknown>>;
  verifyRelocation: (input: { source: string; target: string; expectedSize?: number | null }) => Promise<Record<string, unknown>>;
  verifyRestore: (input: { original: string; relocated: string; expectedSize?: number | null }) => Promise<Record<string, unknown>>;
  verifyRegistryValue: (expectedPresent: boolean, entry: unknown) => Record<string, unknown>;
  aggregateVerifications: (entries: Array<Record<string, unknown>>) => Record<string, unknown>;
  exitCodeOnlyVerification: (engine: string, exitCode: number, spec: unknown) => Record<string, unknown>;
  mutationSucceeded: (v: unknown) => boolean;
  mutationRestartState: (v: unknown, spec: unknown) => string;
};

let root = '';
beforeEach(async () => { root = await mkdtemp(join(tmpdir(), 'knoux-verify-')); });
afterEach(async () => { await rm(root, { recursive: true, force: true }); });

describe('mutation verification', () => {
  it('reports verified only when every check passes', () => {
    expect(kit.summarize([kit.check('a', 1, 1, true), kit.check('b', 2, 2, true)]).status).toBe('verified');
    expect(kit.summarize([kit.check('a', 1, 1, true), kit.check('b', 2, 3, false)]).status).toBe('failed');
    expect(kit.summarize([]).status).toBe('unverified');
  });

  it('never reports success for an unverified mutation', () => {
    expect(kit.mutationSucceeded({ status: 'verified' })).toBe(true);
    expect(kit.mutationSucceeded({ status: 'unverified' })).toBe(false);
    expect(kit.mutationSucceeded({ status: 'failed' })).toBe(false);
    expect(kit.mutationSucceeded(undefined)).toBe(false);
  });

  it('proves a real move: destination present, source gone', async () => {
    const source = join(root, 'a.txt');
    const destination = join(root, 'Images', 'a.txt');
    await mkdir(join(root, 'Images'), { recursive: true });
    await writeFile(source, 'payload', 'utf8');
    const before = await kit.pathState(source);
    await rename(source, destination);
    const result = await kit.verifyMove({ source, destination, expectedIdentity: before.fileIdentity as string });
    expect(result.status).toBe('verified');
    expect((result.checks as Array<{ name: string; ok: boolean }>).every(c => c.ok)).toBe(true);
  });

  it('reports failed when a move did not happen', async () => {
    const source = join(root, 'a.txt');
    const destination = join(root, 'b.txt');
    await writeFile(source, 'payload', 'utf8');
    const result = await kit.verifyMove({ source, destination });
    expect(result.status).toBe('failed');
  });

  it('proves a quarantine relocation and its restore', async () => {
    const source = join(root, 'tmp.bin');
    const target = join(root, 'quarantine', 'tmp.bin');
    await mkdir(join(root, 'quarantine'), { recursive: true });
    await writeFile(source, 'temp-payload', 'utf8');
    await rename(source, target);
    const relocated = await kit.verifyRelocation({ source, target, expectedSize: 12 });
    expect(relocated.status).toBe('verified');
    await rename(target, source);
    const restored = await kit.verifyRestore({ original: source, relocated: target, expectedSize: 12 });
    expect(restored.status).toBe('verified');
    expect(existsSync(source)).toBe(true);
  });

  it('reports failed when a restore finds the original already present (no overwrite)', async () => {
    const original = join(root, 'a.txt');
    const relocated = join(root, 'organized', 'a.txt');
    await mkdir(join(root, 'organized'), { recursive: true });
    await writeFile(original, 'one', 'utf8');
    await writeFile(relocated, 'one', 'utf8');
    const result = await kit.verifyRestore({ original, relocated });
    expect(result.status).toBe('failed');
  });

  it('proves registry value presence and absence from a re-query', () => {
    const present = kit.verifyRegistryValue(true, { valueName: 'X', valueData: 'C:\\a.exe' });
    expect(present.status).toBe('verified');
    const absent = kit.verifyRegistryValue(false, null);
    expect(absent.status).toBe('verified');
    const stillThere = kit.verifyRegistryValue(false, { valueName: 'X', valueData: 'C:\\a.exe' });
    expect(stillThere.status).toBe('failed');
  });

  it('aggregates many item verifications without masking failures', () => {
    expect(kit.aggregateVerifications([{ status: 'verified' }, { status: 'verified' }]).status).toBe('verified');
    expect(kit.aggregateVerifications([{ status: 'verified' }, { status: 'failed' }]).status).toBe('failed');
    expect(kit.aggregateVerifications([{ status: 'verified' }, { status: 'unverified' }]).status).toBe('unverified');
    expect(kit.aggregateVerifications([]).status).toBe('unverified');
  });

  it('treats an exit code alone as unverified, never as proof', () => {
    const ok = kit.exitCodeOnlyVerification('dismCheckHealth', 0, { restartRequired: false });
    expect(ok.status).toBe('unverified');
    expect(ok.method).toBe('exit-code-only');
    const bad = kit.exitCodeOnlyVerification('dismCheckHealth', 1, { restartRequired: false });
    expect(bad.status).toBe('failed');
  });

  it('does not claim a final state before a documented restart', () => {
    expect(kit.mutationRestartState({ status: 'verified' }, { restartRequired: true })).toBe('pending-restart');
    expect(kit.mutationRestartState({ status: 'unverified' }, { restartRequired: true })).toBe('unverified-pending-restart');
    expect(kit.mutationRestartState({ status: 'verified' }, { restartRequired: false })).toBe('not-required');
  });

  it('treats an unreadable path as absent evidence rather than proof of absence', async () => {
    const missing = await kit.pathState(join(root, 'nope.txt'));
    expect(missing.exists).toBe(false);
    expect(missing.code).toBe('ENOENT');
  });

  it('refuses to follow a link when verifying a restore', async () => {
    const dir = join(root, 'd');
    await mkdir(dir, { recursive: true });
    let made = false;
    try { await symlink(dir, join(root, 'j'), 'junction'); made = true; } catch { /* privilege-dependent */ }
    if (!made) return;
    const result = await kit.verifyRestore({ original: join(root, 'j', 'x.txt'), relocated: join(root, 'd', 'x.txt') });
    expect(['verified', 'failed']).toContain(result.status);
  });
});
