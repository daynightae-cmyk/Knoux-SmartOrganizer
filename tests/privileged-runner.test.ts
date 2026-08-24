import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { OPERATION_SPECS, createPrivilegedRunner } = require('../electron/privileged-runner.cjs') as {
  OPERATION_SPECS: Record<string, { executable: string; args: string[] }>;
  createPrivilegedRunner: (options: { platform?: string; windowsDirectory?: string; elevatedExecutor?: (input: { executable: string; args: string[] }) => Promise<{ exitCode: number; stderr: string }> }) => any;
};

let windowsDirectory = '';
beforeEach(async () => {
  windowsDirectory = await mkdtemp(join(tmpdir(), 'knoux-windows-'));
  const system32 = join(windowsDirectory, 'System32'); await mkdir(system32);
  for (const executable of new Set(Object.values(OPERATION_SPECS).map(spec => spec.executable))) await writeFile(join(system32, executable), 'fixture');
});
afterEach(async () => { await rm(windowsDirectory, { recursive: true, force: true }); });

describe('privileged operation allowlist', () => {
  it('contains only fixed Windows executables and argument arrays', () => {
    expect(Object.keys(OPERATION_SPECS)).toHaveLength(8);
    for (const spec of Object.values(OPERATION_SPECS)) {
      expect(spec.executable).toMatch(/^[a-z0-9]+\.exe$/i);
      expect(Array.isArray(spec.args)).toBe(true);
      expect(spec.args.join(' ')).not.toMatch(/[;&|`$]/);
    }
  });

  it('rejects unknown operation IDs before invoking an executor', async () => {
    const elevatedExecutor = vi.fn();
    const runner = createPrivilegedRunner({ platform: 'win32', windowsDirectory, elevatedExecutor });
    await expect(runner.run('rendererCommand', { dryRun: false })).rejects.toThrow('not allowlisted');
    expect(elevatedExecutor).not.toHaveBeenCalled();
  });

  it('dry-run returns exact technical details without elevation', async () => {
    const elevatedExecutor = vi.fn();
    const runner = createPrivilegedRunner({ platform: 'win32', windowsDirectory, elevatedExecutor });
    const result = await runner.run('dismCheckHealth', { dryRun: true });
    expect(result.summary).toMatchObject({ dryRun: true, adminRequired: true, restartRequired: false });
    expect(result.items[0]).toMatchObject({ executable: 'dism.exe', arguments: ['/Online', '/Cleanup-Image', '/CheckHealth'] });
    expect(elevatedExecutor).not.toHaveBeenCalled();
  });

  it('passes only the allowlisted executable and arguments to elevation', async () => {
    const elevatedExecutor = vi.fn(async () => ({ exitCode: 0, stderr: '' }));
    const runner = createPrivilegedRunner({ platform: 'win32', windowsDirectory, elevatedExecutor });
    const result = await runner.run('flushDns');
    expect(elevatedExecutor).toHaveBeenCalledWith({ executable: join(windowsDirectory, 'System32', 'ipconfig.exe'), args: ['/flushdns'] });
    expect(result.summary).toMatchObject({ exitCode: 0, restartRequired: false });
  });

  it('reports unavailable capability without executing', async () => {
    const runner = createPrivilegedRunner({ platform: 'linux', windowsDirectory });
    await expect(runner.run('sfcVerifyOnly')).rejects.toThrow('Windows is required');
  });
});
