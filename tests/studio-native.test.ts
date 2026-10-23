import { afterEach, describe, expect, it } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const native = require('../electron/studio/windows-studio-native.cjs');
const safety = require('../electron/studio/studio-safety.cjs');
const roots: string[] = [];

function workspace() {
  const root = mkdtempSync(join(tmpdir(), 'knoux-studio-native-'));
  roots.push(root);
  writeFileSync(join(root, 'plain.txt'), 'plain local content');
  mkdirSync(join(root, 'folder'));
  return root;
}

afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }); });

const cloudTagged = async () => ({ stdout: 'Reparse Tag Value : 0x9000001a tag value: 0x9000001a\r\n' });
const notAReparsePoint = async () => { throw Object.assign(new Error('The reparse point set is empty.'), { code: 1, stderr: 'This file or directory is not a reparse point.' }); };
const unusable = async () => { throw Object.assign(new Error('Access denied'), { code: 5, stderr: 'Access is denied.' }); };

describe('Studio Windows metadata adapter', () => {
  it('describes a real file from its object identity and never invents unavailable fields', () => {
    const root = workspace();
    const service = native.createWindowsStudioNative();
    return service.inspectOne(join(root, 'plain.txt')).then((record: Record<string, any>) => {
      expect(record).toMatchObject({ exists: true, safe: true, regular: true, directory: false, symbolic: false });
      expect(record.identityAvailable).toBe(true);
      expect(record.identity.fileIdentity).toMatch(/^\d+:\d+$/);
      expect(record.size).toBe(19);
      // Fields Node does not expose on Windows stay reported as unavailable.
      expect(record.attributes).toBeNull();
      expect(record.attributesAvailable).toBe(false);
      expect(record.hardlinked).toBe(false);
      expect(record.linkCount).toBe(1);
      expect(service.capabilities).toMatchObject({
        fileIdentity: true, fileAttributes: false, allocatedSize: false,
        directoryHandleLock: false, pathReplacementLock: false
      });
    });
  });

  it('reports a missing path as unsafe instead of throwing', async () => {
    const root = workspace();
    const service = native.createWindowsStudioNative();
    expect(await service.inspectOne(join(root, 'never-created.txt'))).toMatchObject({ exists: false, safe: false, identityAvailable: false });
  });

  it('refuses a real junction as a reparse point', async () => {
    const root = workspace();
    const link = join(root, 'junction');
    try {
      execFileSync('cmd.exe', ['/c', 'mklink', '/J', link, join(root, 'folder')], { windowsHide: true });
    } catch { /* CI runners may forbid creating links */ return; }
    const service = native.createWindowsStudioNative();
    const record = await service.inspectOne(link);
    expect(record.symbolic).toBe(true);
    expect(record.safe).toBe(false);
    expect(await service.assertPlainEntry(link)).toMatchObject({ ok: false, code: 'STUDIO_REPARSE_REFUSED' });
    // A junction anywhere in a granted route makes the whole route unsafe.
    await expect(safety.assertSafeRoute(join(link, 'anything'))).rejects.toThrow(/STUDIO_PATH_UNSAFE|path component/i);
  });

  it('refuses a cloud placeholder that lstat alone cannot see', async () => {
    const root = workspace();
    const service = native.createWindowsStudioNative({ platform: 'win32', execFileAsync: cloudTagged });
    const checked = await service.assertPlainEntry(join(root, 'plain.txt'));
    expect(checked.ok).toBe(false);
    expect(checked.code).toBe('STUDIO_REPARSE_REFUSED');
    expect(checked.reparse).toMatchObject({ name: 'cloud-files', available: true });
    // One query per object, even when the same file is rechecked repeatedly.
    const before = service.probeStats().probes;
    await service.assertPlainEntry(join(root, 'plain.txt'));
    expect(service.probeStats().probes).toBe(before);
  });

  it('refuses on a failed query and when the probe budget runs out', async () => {
    const root = workspace();
    const strict = native.createWindowsStudioNative({ platform: 'win32', execFileAsync: unusable });
    expect(await strict.assertPlainEntry(join(root, 'plain.txt'))).toMatchObject({ ok: false, code: 'STUDIO_REPARSE_REFUSED' });

    let queries = 0;
    const counted = native.createWindowsStudioNative({
      platform: 'win32',
      maxProbes: 1,
      execFileAsync: async () => { queries += 1; return notAReparsePoint(); }
    });
    expect(await counted.assertPlainEntry(join(root, 'plain.txt'))).toMatchObject({ ok: true });
    expect(await counted.assertPlainEntry(join(root, 'folder'))).toMatchObject({ ok: false, code: 'STUDIO_REPARSE_BUDGET' });
    expect(queries).toBe(1);
    expect(counted.probeStats().exhausted).toBe(true);
  });

  it('lets a verified plain file through and blocks nothing it does not need to', async () => {
    const root = workspace();
    const service = native.createWindowsStudioNative({ platform: 'win32', execFileAsync: notAReparsePoint });
    expect(await service.assertPlainEntry(join(root, 'plain.txt'))).toMatchObject({ ok: true });
    expect((await service.inspect([join(root, 'plain.txt'), join(root, 'folder')])).map((record: Record<string, any>) => record.safe)).toEqual([true, true]);
  });
});
