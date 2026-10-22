import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { requireTemporaryPath, temporaryRoots } = require('../electron/smoke-paths.cjs') as {
  requireTemporaryPath: (target: string, label: string, environment?: Record<string, string | undefined>, platform?: string) => string;
  temporaryRoots: (environment?: Record<string, string | undefined>, platform?: string) => string[];
};

// The application is a Windows application, so a smoke path is a Windows path.
// The expectations below are written with the Windows rules on purpose: the
// check must produce the same answer on a Linux CI runner as it does on the
// Windows machine, otherwise the suite only proves something about the host.
const windows = path.win32;

const windowsEnvironment = {
  TEMP: 'C:\\Users\\Tester\\AppData\\Local\\Temp',
  TMP: 'C:\\Users\\Tester\\AppData\\Local\\Temp',
  LOCALAPPDATA: 'C:\\Users\\Tester\\AppData\\Local',
  SystemRoot: 'C:\\Windows',
  WINDIR: 'C:\\Windows'
};

describe('smoke output paths', () => {
  it('accepts a path inside the user temporary directory', () => {
    const target = 'C:\\Users\\Tester\\AppData\\Local\\Temp\\knoux\\evidence.json';
    expect(requireTemporaryPath(target, 'Smoke output', windowsEnvironment, 'win32')).toBe(windows.resolve(target));
  });

  it('accepts the CI runner temporary directory even on another volume', () => {
    // The GitHub Windows runner keeps RUNNER_TEMP on a different volume from
    // TEMP. Refusing it made the packaged application exit with code 1 on a
    // fresh runner before it could produce any evidence.
    const environment = { ...windowsEnvironment, RUNNER_TEMP: 'D:\\a\\_temp' };
    const target = 'D:\\a\\_temp\\knoux-clean\\operations.json';
    expect(requireTemporaryPath(target, 'Smoke output', environment, 'win32')).toBe(windows.resolve(target));
  });

  it('accepts a path inside the system temporary directory', () => {
    const target = 'C:\\Windows\\Temp\\knoux\\evidence.json';
    expect(requireTemporaryPath(target, 'Smoke output', windowsEnvironment, 'win32')).toBe(windows.resolve(target));
  });

  it('refuses a path outside every temporary root', () => {
    expect(() => requireTemporaryPath('C:\\Users\\Tester\\Documents\\evidence.json', 'Smoke output', windowsEnvironment, 'win32'))
      .toThrow(/temporary directory/);
  });

  it('refuses a path that only shares a prefix with a temporary root', () => {
    expect(() => requireTemporaryPath('C:\\Users\\Tester\\AppData\\Local\\TempEvil\\evidence.json', 'Smoke output', windowsEnvironment, 'win32'))
      .toThrow(/temporary directory/);
  });

  it('refuses a path that escapes a temporary root through a parent segment', () => {
    expect(() => requireTemporaryPath('C:\\Users\\Tester\\AppData\\Local\\Temp\\..\\..\\Documents\\evidence.json', 'Smoke output', windowsEnvironment, 'win32'))
      .toThrow(/temporary directory/);
  });

  it('refuses an empty target', () => {
    expect(() => requireTemporaryPath('', 'Smoke output', windowsEnvironment, 'win32')).toThrow(/temporary directory/);
  });

  it('collects every temporary root the machine offers', () => {
    const roots = temporaryRoots({ ...windowsEnvironment, RUNNER_TEMP: 'D:\\a\\_temp' }, 'win32');
    expect(roots.some(root => root.toLowerCase().includes('_temp'))).toBe(true);
    expect(roots.some(root => root.toLowerCase().endsWith('appdata\\local\\temp'))).toBe(true);
    expect(roots.some(root => root.toLowerCase() === 'd:\\a\\_temp')).toBe(true);
  });

  it('resolves a Windows smoke path the same way on every host', () => {
    // A regression guard: the guard must not fall back to the host's path
    // rules, which would turn a `C:\...` target into a working-directory
    // relative path on a non-Windows runner.
    const target = 'C:\\Users\\Tester\\AppData\\Local\\Temp\\knoux\\evidence.json';
    const resolved = requireTemporaryPath(target, 'Smoke output', windowsEnvironment, 'win32');
    expect(resolved).toBe('C:\\Users\\Tester\\AppData\\Local\\Temp\\knoux\\evidence.json');
    expect(resolved.startsWith('C:')).toBe(true);
  });
});
