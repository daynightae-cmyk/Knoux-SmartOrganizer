import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { OPERATION_SPECS, createPrivilegedRunner } = require('../electron/privileged-runner.cjs') as {
  OPERATION_SPECS: Record<string, Readonly<{ executable: string; args: readonly string[]; restartRequired: boolean }>>;
  createPrivilegedRunner: (options: { platform?: string; windowsDirectory?: string; elevatedExecutor?: (input: { executable: string; args: string[] }) => Promise<{ exitCode: number; stderr: string }> }) => {
    probe: (engine: string) => Promise<{ available: boolean; capability: string; reason?: string }>;
    run: (engine: string, input?: Record<string, unknown>) => Promise<{ summary: Record<string, unknown>; items: Array<Record<string, unknown>>; warnings?: string[]; restartRequired?: boolean }>;
    runService: (input: { serviceName: string; action: string; dryRun?: boolean }) => Promise<Record<string, unknown>>;
    isProtectedService: (serviceName: string) => boolean;
  };
};

let windowsDirectory = '';
beforeEach(async () => {
  windowsDirectory = await mkdtemp(join(tmpdir(), 'knoux-windows-'));
  const system32 = join(windowsDirectory, 'System32');
  await mkdir(system32);
  for (const executable of new Set(Object.values(OPERATION_SPECS).map(spec => spec.executable))) await writeFile(join(system32, executable), 'fixture');
});
afterEach(async () => { await rm(windowsDirectory, { recursive: true, force: true }); });

describe('privileged operation allowlist', () => {
  it('contains fixed deeply frozen Windows operation specifications', () => {
    expect(Object.keys(OPERATION_SPECS)).toHaveLength(8);
    expect(Object.isFrozen(OPERATION_SPECS)).toBe(true);
    for (const spec of Object.values(OPERATION_SPECS)) {
      expect(Object.isFrozen(spec)).toBe(true);
      expect(Object.isFrozen(spec.args)).toBe(true);
      expect(spec.executable).toMatch(/^[a-z0-9]+\.exe$/i);
      expect(spec.args.join(' ')).not.toMatch(/[;&|`$]/);
    }
  });

  it('does not permit mutation of executable paths or arguments', () => {
    const spec = OPERATION_SPECS.dismCheckHealth as unknown as { executable: string; args: string[] };
    expect(() => { spec.executable = 'cmd.exe'; }).toThrow();
    expect(() => { spec.args.push('/evil'); }).toThrow();
    expect(OPERATION_SPECS.dismCheckHealth.executable).toBe('dism.exe');
    expect(OPERATION_SPECS.dismCheckHealth.args).toEqual(['/Online', '/Cleanup-Image', '/CheckHealth']);
  });

  it('rejects an unknown engine before any executor is called', async () => {
    const elevatedExecutor = vi.fn();
    const runner = createPrivilegedRunner({ platform: 'win32', windowsDirectory, elevatedExecutor });
    await expect(runner.run('rendererCommand', { dryRun: false })).rejects.toThrow('not allowlisted');
    expect(elevatedExecutor).not.toHaveBeenCalled();
  });

  it('never throws while classifying a service name it could never control', async () => {
    const runner = createPrivilegedRunner({ platform: 'win32', windowsDirectory });
    // The read-side inventory must survive names sc.exe could not address.
    expect(runner.isProtectedService('A name with spaces/and+chars')).toBe(true);
    expect(runner.isProtectedService('')).toBe(true);
    // A documented protected service stays protected.
    expect(runner.isProtectedService('Dhcp')).toBe(true);
    // An ordinary service that sc.exe can address is not protected.
    expect(runner.isProtectedService('w32time')).toBe(false);
    // The mutation boundary still refuses them.
    await expect(runner.runService({ serviceName: 'A name with spaces', action: 'start' })).rejects.toThrow('Invalid Windows service name');
  });

  it('reports non-Windows as unavailable without exposing a filesystem path', async () => {
    const runner = createPrivilegedRunner({ platform: 'linux', windowsDirectory });
    await expect(runner.probe('sfcVerifyOnly')).resolves.toEqual({ available: false, reason: 'Windows is required.', capability: 'windows-elevation' });
    await expect(runner.run('sfcVerifyOnly')).rejects.toThrow('Windows is required');
  });

  it('reports missing System32 executable safely without elevation', async () => {
    await rm(join(windowsDirectory, 'System32', 'dism.exe'));
    const elevatedExecutor = vi.fn();
    const runner = createPrivilegedRunner({ platform: 'win32', windowsDirectory, elevatedExecutor });
    await expect(runner.probe('dismCheckHealth')).resolves.toEqual({ available: false, reason: 'Required Windows component is unavailable.', capability: 'windows-elevation' });
    await expect(runner.run('dismCheckHealth')).rejects.toThrow('Required Windows component is unavailable');
    expect(elevatedExecutor).not.toHaveBeenCalled();
  });

  it('uses dry-run metadata only and never invokes elevation or exposes command details', async () => {
    const elevatedExecutor = vi.fn();
    const runner = createPrivilegedRunner({ platform: 'win32', windowsDirectory, elevatedExecutor });
    const result = await runner.run('dismCheckHealth', { dryRun: true });
    expect(elevatedExecutor).not.toHaveBeenCalled();
    expect(result.summary).toEqual(expect.objectContaining({ operation: 'dismCheckHealth', execution: 'dry-run', allowlisted: true, adminRequired: true, dryRun: true, restartRequired: false }));
    expect(result.items).toEqual([{ operation: 'dismCheckHealth', status: 'planned', commandIdentity: 'dismCheckHealth' }]);
    expect(result.summary).toEqual(expect.objectContaining({ verification: expect.objectContaining({ status: 'unverified', method: expect.stringContaining('dry-run') }) }));
    expect(JSON.stringify(result)).not.toMatch(/dism\.exe|Cleanup-Image|System32|arguments|executable/i);
  });

  it('passes exact allowlisted executable and args to injected elevation exactly once', async () => {
    const elevatedExecutor = vi.fn(async () => ({ exitCode: 0, stderr: '' }));
    const runner = createPrivilegedRunner({ platform: 'win32', windowsDirectory, elevatedExecutor });
    const result = await runner.run('flushDns');
    expect(elevatedExecutor).toHaveBeenCalledTimes(1);
    expect(elevatedExecutor).toHaveBeenCalledWith({ executable: join(windowsDirectory, 'System32', 'ipconfig.exe'), args: ['/flushdns'] });
    expect(result.summary).toEqual(expect.objectContaining({ operation: 'flushDns', execution: 'elevated', exitCode: 0, succeeded: true }));
  });

  it('rejects caller attempts to inject executable, args, command, shell, script, path, or extra input', async () => {
    const elevatedExecutor = vi.fn();
    const runner = createPrivilegedRunner({ platform: 'win32', windowsDirectory, elevatedExecutor });
    for (const key of ['executable', 'args', 'command', 'shell', 'script', 'path', 'unexpected']) {
      await expect(runner.run('flushDns', { [key]: 'cmd.exe' })).rejects.toThrow('unsupported field');
    }
    expect(elevatedExecutor).not.toHaveBeenCalled();
  });

  it('represents a non-zero elevated exit without masking it as success', async () => {
    const runner = createPrivilegedRunner({ platform: 'win32', windowsDirectory, elevatedExecutor: async () => ({ exitCode: 87, stderr: 'invalid parameter' }) });
    const result = await runner.run('flushDns');
    expect(result.summary).toEqual(expect.objectContaining({ exitCode: 87, succeeded: false }));
    expect(result.items).toEqual([expect.objectContaining({ operation: 'flushDns', status: 'failed', exitCode: 87, finalState: 'undetermined' })]);
    expect(result.warnings).toContain('invalid parameter');
  });

  it('never reports a repair as verified from the exit code alone', async () => {
    const runner = createPrivilegedRunner({ platform: 'win32', windowsDirectory, elevatedExecutor: async () => ({ exitCode: 0, stdout: 'The operation completed successfully.', stderr: '' }) });
    const result = await runner.run('dismCheckHealth');
    const verification = result.summary.verification as Record<string, unknown>;
    expect(verification.status).not.toBe('verified');
    expect(verification.method).toBe('exit-code-only');
    expect(String(verification.limitation)).toMatch(/no documented post-condition re-query/i);
    expect(result.summary).toEqual(expect.objectContaining({ startedAt: expect.any(String), finishedAt: expect.any(String), durationMs: expect.any(Number), adminState: 'elevated' }));
  });

  it('classifies documented Microsoft outcomes and reports undetermined otherwise', async () => {
    const healthy = createPrivilegedRunner({ platform: 'win32', windowsDirectory, elevatedExecutor: async () => ({ exitCode: 0, stdout: 'No component store corruption detected.', stderr: '' }) });
    await expect(healthy.run('dismCheckHealth')).resolves.toEqual(expect.objectContaining({
      summary: expect.objectContaining({ finalState: 'healthy', finalStateSource: 'Microsoft documented output text' })
    }));
    const opaque = createPrivilegedRunner({ platform: 'win32', windowsDirectory, elevatedExecutor: async () => ({ exitCode: 0, stdout: ' unexpected output', stderr: '' }) });
    const result = await opaque.run('dismCheckHealth');
    expect(result.summary).toEqual(expect.objectContaining({ finalState: 'undetermined' }));
    expect((result.warnings || []).join(' ')).toMatch(/no documented outcome text/i);
  });

  it('does not claim a final state before a documented restart when the operation requires one', async () => {
    const runner = createPrivilegedRunner({ platform: 'win32', windowsDirectory, elevatedExecutor: async () => ({ exitCode: 0, stdout: 'The restore operation completed successfully.', stderr: '' }) });
    const result = await runner.run('dismRestoreHealth');
    expect(result.summary).toEqual(expect.objectContaining({ restartRequired: true, restartState: 'pending-restart' }));
    expect((result.warnings || []).join(' ')).toMatch(/requires a restart/i);
    expect(result.restartRequired).toBe(true);
  });

  it('records documented Windows log locations without leaking an expanded filesystem path', async () => {
    const runner = createPrivilegedRunner({ platform: 'win32', windowsDirectory, elevatedExecutor: async () => ({ exitCode: 0, stdout: '', stderr: '' }) });
    const result = await runner.run('dismRestoreHealth');
    const logLocations = result.summary.logLocations as string[];
    expect(logLocations).toContain('%windir%\\Logs\\DISM\\dism.log');
    expect(logLocations.join(' ')).not.toContain(windowsDirectory);
  });

  it('exposes an unclassified status when Windows reports no documented outcome text', async () => {
    const runner = createPrivilegedRunner({ platform: 'win32', windowsDirectory, elevatedExecutor: async () => ({ exitCode: 0, stdout: 'done', stderr: '' }) });
    const result = await runner.run('flushDns');
    expect(result.items).toEqual([expect.objectContaining({ status: 'completed-unverified-state' })]);
  });
});
