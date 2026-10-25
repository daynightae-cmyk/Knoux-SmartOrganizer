import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { mkdir, mkdtemp, readdir, rm, symlink, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

type Marker = { width: number; height: number; empty?: boolean };
type IconOutcome = { exitCode: number | null; signal?: string | null; error?: string };
type SpawnInput = { scriptPath: string; timeoutMs: number };
type SpawnHandle = { done: Promise<IconOutcome>; cancel: () => void };
type AppIconResult = {
  id: string;
  status: 'ready' | 'unavailable' | 'unknown-app';
  source: 'shell' | 'package' | 'ico' | 'none';
  dataUrl?: string;
  pixels?: number;
  reason?: string;
};
type ProviderOptions = {
  cacheDirectory?: string;
  platform?: string;
  nativeImage?: unknown;
  spawnPowerShell?: (input: SpawnInput) => SpawnHandle;
  tempDirectories?: string[];
  driveRootExists?: (root: string) => boolean;
  batchSize?: number;
  batchTimeoutMs?: number;
  killGraceMs?: number;
  maxIconFileBytes?: number;
  maxDiskCacheBytes?: number;
  maxDiskCacheFiles?: number;
};
type Provider = {
  registerInventory(items: Array<Record<string, unknown>>): { registered: number };
  getIcons(ids: string[]): Promise<AppIconResult[]>;
  hasApp(id: string): boolean;
  stats(): Record<string, unknown>;
  dispose(): void;
};

const appIcons = require('../electron/app-icons.cjs') as {
  createAppIconProvider: (options: ProviderOptions) => Provider;
  buildExtractionScript: (iconPaths: string[], outputDirectory: string) => string;
  parseDisplayIcon: (raw: unknown) => { path: string | null; index: number | null };
  executableFromCommand: (raw: unknown) => string | null;
  declaredLogoPaths: (manifestText: string | null) => Array<{ key: string; value: string }>;
  locationInside: (root: string, candidate: string) => boolean;
  driveRootOf: (value: string) => string | null;
  rootOf: (value: string) => string | null;
  BATCH_SIZE: number;
  BATCH_TIMEOUT_MS: number;
  ICON_EDGE: number;
  REASONS: Record<string, string>;
};
const windowsProviders = require('../electron/windows-providers.cjs') as {
  uninstallScript: (roots?: string[]) => string;
  normalizeUninstallApp: (raw: unknown) => Array<Record<string, unknown>>;
};

const BACKSLASH = String.fromCharCode(92);
/** Test fixtures are written with forward slashes so they also run on POSIX CI. */
const win = (value: string) => value.replace(/\//g, BACKSLASH);

// -- fake image codec -------------------------------------------------------
// The provider only ever asks nativeImage for a decode, a resize and toPNG. A
// tiny textual marker keeps those calls observable without a real PNG codec.

function encodeMarker(marker: Marker): Buffer {
  return Buffer.from(`KNOUXPNG ${marker.width}x${marker.height}${marker.empty ? ' EMPTY' : ''}`, 'utf8');
}

function decodeMarker(buffer: Buffer | null | undefined): Marker {
  const match = /^KNOUXPNG (\d+)x(\d+)( EMPTY)?$/.exec(buffer ? buffer.toString('utf8') : '');
  if (!match) return { width: 0, height: 0, empty: true };
  return { width: Number(match[1]), height: Number(match[2]), empty: match[3] === ' EMPTY' };
}

function pngData(marker: Marker): string {
  return `data:image/png;base64,${encodeMarker(marker).toString('base64')}`;
}

function createFakeNativeImage(counters = { buffers: 0, paths: 0, resizes: 0 }) {
  const make = (marker: Marker): Record<string, unknown> => ({
    isEmpty: () => Boolean(marker.empty) || marker.width === 0,
    getSize: () => ({ width: marker.width, height: marker.height }),
    resize: (options: { width?: number }) => {
      counters.resizes += 1;
      const width = Number(options.width) || marker.width;
      const ratio = marker.width ? width / marker.width : 1;
      return make({ width, height: Math.max(1, Math.round(marker.height * ratio)) });
    },
    toPNG: () => encodeMarker(marker)
  });
  return {
    counters,
    createFromBuffer: (buffer: Buffer) => {
      counters.buffers += 1;
      return make(decodeMarker(buffer));
    },
    createFromPath: (filePath: string) => {
      counters.paths += 1;
      let buffer: Buffer | null = null;
      try { buffer = readFileSync(filePath); } catch { buffer = null; }
      return make(decodeMarker(buffer));
    }
  };
}

// -- fake PowerShell --------------------------------------------------------

type BatchCall = {
  scriptPath: string;
  timeoutMs: number;
  batchDirectory: string;
  paths: string[];
  cancelCount: number;
  release: (outcome?: IconOutcome, icons?: Array<Marker | null>) => void;
};

/**
 * Reads the `$paths` literal array back out of the generated script, the same way
 * the real PowerShell would, so tests can assert exactly which paths were handed
 * to the shell.
 */
function scriptLiterals(line: string): string[] {
  const values: string[] = [];
  const pattern = /'((?:[^']|'')*)'/g;
  let match: RegExpExecArray | null = pattern.exec(line);
  while (match) {
    values.push(match[1].replace(/''/g, "'"));
    match = pattern.exec(line);
  }
  return values;
}

function pathsInScript(scriptPath: string): string[] {
  const text = readFileSync(scriptPath, 'utf8').replace(/\r\n/g, '\n');
  const line = /^\$paths = @\((.*)\)$/m.exec(text);
  return line ? scriptLiterals(line[1]) : [];
}

type FakePowerShellOptions = { autoIcon?: Marker | null };

function createFakePowerShell(options: FakePowerShellOptions = {}) {
  const defaultIcon = options.autoIcon === undefined ? { width: 32, height: 32 } : options.autoIcon;
  const calls: BatchCall[] = [];
  const spawnPowerShell = (input: SpawnInput) => {
    const batchDirectory = dirname(input.scriptPath);
    const paths = pathsInScript(input.scriptPath);
    let resolve = (value: IconOutcome) => { void value; };
    const done = new Promise<IconOutcome>(inner => { resolve = inner; });
    const call: BatchCall = {
      scriptPath: input.scriptPath,
      timeoutMs: input.timeoutMs,
      batchDirectory,
      paths,
      cancelCount: 0,
      release: (outcome?: IconOutcome, icons?: Array<Marker | null>) => {
        const produced = icons || paths.map(() => defaultIcon);
        // Written synchronously: the provider reads the batch output as soon as
        // the process reports back, exactly like a real PowerShell would.
        produced.forEach((marker, index) => {
          if (!marker) return;
          writeFileSync(join(batchDirectory, `icon-${index}.png`), encodeMarker(marker));
        });
        resolve(outcome || { exitCode: 0 });
      }
    };
    calls.push(call);
    return {
      done,
      cancel: () => { call.cancelCount += 1; }
    };
  };
  return { calls, spawnPowerShell };
}

type RecordedCall = { scriptPath: string; timeoutMs: number; batchDirectory: string; paths: string[] };

/** A spawner that behaves like a real one: it answers immediately. */
function createAutoPowerShell(options: { icon?: Marker | null; outcome?: IconOutcome; missing?: number } = {}) {
  const calls: RecordedCall[] = [];
  const spawnPowerShell = (input: SpawnInput) => {
    const batchDirectory = dirname(input.scriptPath);
    const paths = pathsInScript(input.scriptPath);
    const call = { scriptPath: input.scriptPath, timeoutMs: input.timeoutMs, batchDirectory, paths };
    calls.push(call);
    const done = Promise.resolve().then(async () => {
      const outcome = options.outcome || { exitCode: 0 };
      if (!outcome.error && outcome.exitCode === 0) {
        for (let index = 0; index < paths.length; index += 1) {
          const marker = options.missing === index ? null : (options.icon === undefined ? { width: 32, height: 32 } : options.icon);
          if (marker) await writeFile(join(batchDirectory, `icon-${index}.png`), encodeMarker(marker));
        }
      }
      return outcome;
    });
    return { done, cancel: () => { /* nothing to cancel */ } };
  };
  return { calls, spawnPowerShell };
}

// -- fixtures ---------------------------------------------------------------

let root = '';
let cacheDirectory = '';
let tempZone = '';

async function fixture(relativePath: string, marker: Marker | string = { width: 256, height: 256 }): Promise<string> {
  const target = join(root, relativePath);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, typeof marker === 'string' ? marker : encodeMarker(marker));
  return target;
}

/** The id rule main.cjs uses; the provider itself only ever sees the opaque value. */
function appId(tuple: string): string {
  return `app-${createHash('sha1').update(tuple).digest('hex').slice(0, 16)}`;
}

function iconProvider(options: ProviderOptions = {}): Provider {
  return appIcons.createAppIconProvider({
    cacheDirectory,
    platform: 'win32',
    nativeImage: createFakeNativeImage(),
    tempDirectories: [tempZone],
    ...options
  });
}

async function flush(times = 10): Promise<void> {
  for (let index = 0; index < times; index += 1) await new Promise(resolve => { setTimeout(resolve, 0); });
}

/** Waits for a condition the provider drives through asynchronous filesystem work. */
async function waitFor(condition: () => boolean, label = 'condition'): Promise<void> {
  const deadline = Date.now() + 4000;
  while (!condition()) {
    if (Date.now() > deadline) throw new Error(`Timed out waiting for ${label}`);
    await new Promise(resolve => { setTimeout(resolve, 5); });
  }
}

function cacheFileNames(appIdValue: string, resolvedPath: string): string {
  return `${createHash('sha1').update(`${appIdValue}|${resolvedPath}|v1`).digest('hex')}.png`;
}

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'knoux-app-icons-'));
  cacheDirectory = join(root, 'icon-cache');
  tempZone = join(root, 'temp-zone');
  await mkdir(tempZone, { recursive: true });
});

afterEach(async () => {
  // Batch teardown is asynchronous and best-effort. On Windows a just-killed
  // fake PowerShell can leave a disposable cache directory handle alive for a
  // few milliseconds; retry the temp-root sweep instead of turning that into a
  // test failure. No assertion or production behavior is changed.
  await rm(root, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 }).catch(() => {});
});

// -- DisplayIcon parsing ---------------------------------------------------

describe('DisplayIcon parsing', () => {
  it('handles every real-world uninstall registry shape', () => {
    expect(appIcons.parseDisplayIcon(win('"C:/Program Files/Foo/foo.exe"'))).toEqual({ path: win('C:/Program Files/Foo/foo.exe'), index: null });
    expect(appIcons.parseDisplayIcon(win('C:/Dir/app.exe,0'))).toEqual({ path: win('C:/Dir/app.exe'), index: 0 });
    expect(appIcons.parseDisplayIcon(win('C:/Dir/app.exe -arg'))).toEqual({ path: win('C:/Dir/app.exe'), index: null });
    expect(appIcons.parseDisplayIcon(win('C:/Windows/System32/shell32.dll,220'))).toEqual({ path: win('C:/Windows/System32/shell32.dll'), index: 220 });
    expect(appIcons.parseDisplayIcon(win('"C:/Program Files/Foo/foo.exe",1'))).toEqual({ path: win('C:/Program Files/Foo/foo.exe'), index: 1 });
    expect(appIcons.parseDisplayIcon(win('C:/Windows/Installer/Foo.msi'))).toEqual({ path: win('C:/Windows/Installer/Foo.msi'), index: null });
    expect(appIcons.parseDisplayIcon('Foo')).toEqual({ path: 'Foo', index: null });
    expect(appIcons.parseDisplayIcon('')).toEqual({ path: null, index: null });
    expect(appIcons.parseDisplayIcon(undefined)).toEqual({ path: null, index: null });
  });

  it('refuses to borrow a host process icon from an uninstall command', () => {
    expect(appIcons.executableFromCommand('MsiExec.exe /X{1B4F0B42-ABC}')).toBeNull();
    expect(appIcons.executableFromCommand(win('C:/Program Files/Foo/uninst.exe /S'))).toBe(win('C:/Program Files/Foo/uninst.exe'));
    expect(appIcons.executableFromCommand('')).toBeNull();
  });

  it('names the manifest logo paths a packaged application declares', () => {
    const manifest = '<uap:VisualElements Square44x44Logo="Assets' + BACKSLASH + 'Square44x44Logo.targetsize-96_altform-unplated.png" Square150x150Logo="Assets' + BACKSLASH + 'Square150x150Logo.png"><uap:Logo>Assets/StoreLogo.png</uap:Logo></uap:VisualElements>';
    expect(appIcons.declaredLogoPaths(manifest).map(entry => entry.key)).toEqual(['Square44x44Logo', 'Square150x150Logo', 'Logo']);
    expect(appIcons.declaredLogoPaths('')).toEqual([]);
  });
});

// -- resolution order ------------------------------------------------------

describe('application icon resolution', () => {
  it('serves the manifest-declared package logo without touching PowerShell', async () => {
    const unplated = await fixture('packages/Tailwind.App/Assets/Square44x44Logo.targetsize-96_altform-unplated.png', { width: 96, height: 96 });
    const packageRoot = dirname(dirname(unplated));
    await writeFile(join(packageRoot, 'AppxManifest.xml'), '<Package><uap:VisualElements Square44x44Logo="Assets' + BACKSLASH + 'Square44x44Logo.scale-400.png"/></Package>');
    await writeFile(join(packageRoot, 'Assets', 'Square44x44Logo.scale-400.png'), encodeMarker({ width: 44, height: 44 }));
    await writeFile(join(packageRoot, 'Assets', 'StoreLogo.png'), encodeMarker({ width: 50, height: 50 }));
    const powershell = createAutoPowerShell();
    const provider = iconProvider({ spawnPowerShell: powershell.spawnPowerShell });
    const id = appId('Tailwind App|1.0|Tailwind.App_1.0_x64__abc||' + packageRoot);
    provider.registerInventory([{ id, name: 'Tailwind App', version: '1.0', packageIdentity: 'Tailwind.App_1.0_x64__abc', installLocation: packageRoot }]);

    const [icon] = await provider.getIcons([id]);
    // The 96px unplated variant wins over the declared scale-400 and the store
    // logo, then normalises down to 64px.
    expect(icon).toMatchObject({ id, status: 'ready', source: 'package', pixels: 64 });
    expect(icon.dataUrl).toBe(pngData({ width: 64, height: 64 }));
    expect(powershell.calls).toHaveLength(0);
    provider.dispose();
  });

  it('globs the Images folder when a package ships no manifest', async () => {
    const storeLogo = await fixture('packages/Bits/Images/StoreLogo.png', { width: 60, height: 60 });
    const packageRoot = dirname(dirname(storeLogo));
    await writeFile(join(packageRoot, 'Images', 'Square44x44Logo.targetsize-256.png'), encodeMarker({ width: 256, height: 256 }));
    const powershell = createAutoPowerShell();
    const provider = iconProvider({ spawnPowerShell: powershell.spawnPowerShell });
    const id = appId('Bits|2|Bits.Package_2_x64__abc||' + packageRoot);
    provider.registerInventory([{ id, name: 'Bits', version: '2', packageIdentity: 'Bits.Package_2_x64__abc', installLocation: packageRoot }]);

    const [icon] = await provider.getIcons([id]);
    expect(icon.status).toBe('ready');
    expect(icon.source).toBe('package');
    expect(icon.dataUrl).toBe(pngData({ width: 64, height: 64 }));
    provider.dispose();
  });

  it('reads a standalone .ico file through the shell image path without spawning PowerShell', async () => {
    const iconPath = await fixture('apps/gimp/creative.ico', { width: 256, height: 256 });
    const powershell = createAutoPowerShell();
    const provider = iconProvider({ spawnPowerShell: powershell.spawnPowerShell });
    const id = appId('Creative|3.0|||');
    provider.registerInventory([{ id, name: 'Creative', version: '3.0', displayIcon: iconPath }]);

    const [icon] = await provider.getIcons([id]);
    expect(icon).toMatchObject({ id, status: 'ready', source: 'ico', pixels: appIcons.ICON_EDGE });
    expect(icon.dataUrl).toBe(pngData({ width: 64, height: 64 }));
    expect(powershell.calls).toHaveLength(0);
    provider.dispose();
  });

  it('extracts an executable icon in one bounded PowerShell batch and shrinks it to 64px', async () => {
    const exePath = await fixture('apps/foo/foo.exe', { width: 256, height: 256 });
    const powershell = createFakePowerShell();
    const provider = iconProvider({ spawnPowerShell: powershell.spawnPowerShell });
    const id = appId('Foo|1.0|||' + dirname(exePath));
    provider.registerInventory([{ id, name: 'Foo', version: '1.0', installLocation: dirname(exePath), displayIcon: exePath }]);

    const pending = provider.getIcons([id]);
    await waitFor(() => powershell.calls.length === 1, 'the first extraction batch');
    expect(powershell.calls[0].paths).toEqual([exePath]);
    expect(powershell.calls[0].timeoutMs).toBe(appIcons.BATCH_TIMEOUT_MS);
    powershell.calls[0].release({ exitCode: 0 }, [{ width: 256, height: 256 }]);

    const [icon] = await pending;
    expect(icon).toMatchObject({ id, status: 'ready', source: 'shell', pixels: 64 });
    expect(icon.dataUrl).toBe(pngData({ width: 64, height: 64 }));
    provider.dispose();
  });

  it('keeps a small shell icon at its real size instead of upscaling it', async () => {
    const exePath = await fixture('apps/small/small.exe');
    const powershell = createAutoPowerShell({ icon: { width: 32, height: 32 } });
    const provider = iconProvider({ spawnPowerShell: powershell.spawnPowerShell });
    const id = appId('Small|1||||');
    provider.registerInventory([{ id, name: 'Small', version: '1', displayIcon: exePath }]);

    const [icon] = await provider.getIcons([id]);
    expect(icon).toMatchObject({ status: 'ready', source: 'shell', pixels: 32 });
    provider.dispose();
  });

  it('drops the embedded icon index but still names only the file for the shell', async () => {
    const dllPath = await fixture('Windows/System32/imageres.dll');
    const powershell = createAutoPowerShell();
    const provider = iconProvider({ spawnPowerShell: powershell.spawnPowerShell });
    const id = appId('Explorer|1||||');
    provider.registerInventory([{ id, name: 'Explorer', version: '1', displayIcon: `${dllPath},13` }]);

    const [icon] = await provider.getIcons([id]);
    expect(icon.status).toBe('ready');
    expect(powershell.calls[0].paths).toEqual([dllPath]);
    expect(powershell.calls[0].paths[0]).not.toContain(',13');
    provider.dispose();
  });

  it('extracts at most 24 icons per PowerShell process', async () => {
    const paths: string[] = [];
    const items: Array<Record<string, unknown>> = [];
    for (let index = 0; index < 30; index += 1) {
      const exePath = await fixture(`apps/batch/app${index}.exe`, { width: 64, height: 64 });
      paths.push(exePath);
      items.push({ id: appId(`Batch ${index}|1||||`), name: `Batch ${index}`, version: '1', displayIcon: exePath });
    }
    const powershell = createAutoPowerShell({ icon: { width: 64, height: 64 } });
    const provider = iconProvider({ spawnPowerShell: powershell.spawnPowerShell });
    provider.registerInventory(items);

    const icons = await provider.getIcons(items.map(item => String(item.id)));
    expect(icons).toHaveLength(30);
    expect(icons.every(icon => icon.status === 'ready')).toBe(true);
    // Requests that arrive together share a process; a process never carries more
    // than the documented ceiling, and no app gets a process of its own.
    const batchSizes = powershell.calls.map(call => call.paths.length);
    expect(batchSizes.reduce((sum, size) => sum + size, 0)).toBe(30);
    expect(Math.max(...batchSizes)).toBeLessThanOrEqual(appIcons.BATCH_SIZE);
    expect(powershell.calls.length).toBeLessThan(30);
    provider.dispose();
  });

  it('falls back to the uninstall command only when no icon is declared', async () => {
    const exePath = await fixture('apps/bar/uninstall-helper.exe');
    const powershell = createAutoPowerShell();
    const provider = iconProvider({ spawnPowerShell: powershell.spawnPowerShell });
    const id = appId('Bar|1||||');
    provider.registerInventory([{ id, name: 'Bar', version: '1', uninstallString: `"${exePath}" /SILENT` }]);

    const [icon] = await provider.getIcons([id]);
    expect(icon.status).toBe('ready');
    expect(powershell.calls[0].paths).toEqual([exePath]);
    provider.dispose();
  });

  it('only guesses an executable in the install location when that file exists', async () => {
    const installLocation = dirname(await fixture('apps/sevenzip/7-Zip.exe'));
    const powershell = createAutoPowerShell();
    const provider = iconProvider({ spawnPowerShell: powershell.spawnPowerShell });
    const id = appId('7-Zip|24||||');
    provider.registerInventory([{ id, name: '7-Zip', version: '24', installLocation }]);

    const [icon] = await provider.getIcons([id]);
    expect(icon.status).toBe('ready');
    expect(powershell.calls[0].paths).toEqual([join(installLocation, '7-Zip.exe')]);
    provider.dispose();
  });

  it('ignores a guessed executable that is not on disk', async () => {
    const installLocation = dirname(await fixture('apps/ghost/keep.txt', 'not an icon'));
    const powershell = createAutoPowerShell();
    const provider = iconProvider({ spawnPowerShell: powershell.spawnPowerShell });
    const id = appId('Ghost|1||||');
    provider.registerInventory([{ id, name: 'Ghost', version: '1', installLocation }]);

    const [icon] = await provider.getIcons([id]);
    expect(icon).toMatchObject({ status: 'unavailable', source: 'none' });
    expect(powershell.calls).toHaveLength(0);
    provider.dispose();
  });
});

// -- the path security boundary -------------------------------------------

describe('icon path validation', () => {
  const realExe = () => fixture('boundary/real.exe');

  async function refused(displayIcon: string, options: ProviderOptions = {}): Promise<AppIconResult> {
    await realExe();
    const powershell = createAutoPowerShell();
    const provider = iconProvider({ spawnPowerShell: powershell.spawnPowerShell, ...options });
    const id = appId('Boundary|1||||');
    provider.registerInventory([{ id, name: 'Boundary', version: '1', displayIcon }]);
    const [icon] = await provider.getIcons([id]);
    expect(powershell.calls).toHaveLength(0);
    provider.dispose();
    return icon;
  }

  it('refuses a relative path', async () => {
    expect(await refused('relative/foo.exe')).toMatchObject({ status: 'unavailable', reason: appIcons.REASONS.PATH_REFUSED });
  });

  it('refuses a UNC and a namespace path', async () => {
    expect(await refused(win('\\\\fileserver\\share\\foo.exe'))).toMatchObject({ status: 'unavailable', reason: appIcons.REASONS.PATH_REFUSED });
    expect(await refused(win('\\\\.\\PhysicalDrive0\\foo.exe'))).toMatchObject({ status: 'unavailable', reason: appIcons.REASONS.PATH_REFUSED });
  });

  it('refuses control characters and a null byte', async () => {
    expect(await refused(`${win('C:/Windows/foo.exe')}\u0000.txt`)).toMatchObject({ status: 'unavailable', reason: appIcons.REASONS.PATH_REFUSED });
    expect(await refused(`${win('C:/Windows/foo.exe')}\u0007`)).toMatchObject({ status: 'unavailable', reason: appIcons.REASONS.PATH_REFUSED });
  });

  it('refuses an extension outside the icon allowlist', async () => {
    const target = await fixture('boundary/notepad.bat', 'echo never');
    expect(await refused(target)).toMatchObject({ status: 'unavailable', reason: appIcons.REASONS.ICON_TYPE_UNSUPPORTED });
  });

  it('refuses a directory and a file that does not exist', async () => {
    const lookalikeDirectory = join(root, 'boundary', 'program.exe');
    await mkdir(lookalikeDirectory, { recursive: true });
    expect(await refused(lookalikeDirectory)).toMatchObject({ status: 'unavailable', reason: appIcons.REASONS.ICON_FILE_MISSING });
    expect(await refused(join(root, 'boundary', 'gone.exe'))).toMatchObject({ status: 'unavailable', reason: appIcons.REASONS.ICON_FILE_MISSING });
  });

  it('refuses a file above the size ceiling', async () => {
    const exePath = await realExe();
    expect(await refused(exePath, { maxIconFileBytes: 4 })).toMatchObject({ status: 'unavailable', reason: appIcons.REASONS.PATH_REFUSED });
  });

  it('refuses an executable that lives under the user temp directory', async () => {
    const exePath = await fixture('temp-zone/sneaky.exe');
    expect(await refused(exePath)).toMatchObject({ status: 'unavailable', reason: appIcons.REASONS.PATH_REFUSED });
  });

  it('refuses an executable whose drive root is not present', async () => {
    const exePath = await realExe();
    expect(await refused(exePath, { driveRootExists: () => false })).toMatchObject({ status: 'unavailable', reason: appIcons.REASONS.PATH_REFUSED });
  });

  it('never follows a symbolic link out of the validated location', async () => {
    const exePath = await realExe();
    const linkPath = join(root, 'boundary', 'link.exe');
    let created = true;
    try { await symlink(exePath, linkPath); } catch { created = false; }
    if (!created) { expect(await refused(exePath)).toMatchObject({ status: 'ready' }); return; }
    expect(await refused(linkPath)).toMatchObject({ status: 'unavailable', reason: appIcons.REASONS.PATH_REFUSED });
  });

  it('reports an honest reason when nothing could be resolved', async () => {
    const powershell = createAutoPowerShell();
    const provider = iconProvider({ spawnPowerShell: powershell.spawnPowerShell });
    const bare = appId('Bare|1||||');
    const msi = appId('Msi|1||||');
    const packaged = appId('Packaged|1|Packaged_1_x64__abc||');
    provider.registerInventory([
      { id: bare, name: 'Bare', version: '1', displayIcon: 'Bare' },
      { id: msi, name: 'Msi', version: '1', displayIcon: win('C:/Windows/Installer/package.msi') },
      { id: packaged, name: 'Packaged', version: '1', packageIdentity: 'Packaged_1_x64__abc', installLocation: join(root, 'packages', 'missing') }
    ]);

    const [bareIcon, msiIcon, packagedIcon, unknownIcon] = await provider.getIcons([bare, msi, packaged, appId('Never|registered||||')]);
    expect(bareIcon).toMatchObject({ status: 'unavailable', source: 'none', reason: appIcons.REASONS.NO_ICON_PATH });
    expect(msiIcon).toMatchObject({ status: 'unavailable', source: 'none', reason: appIcons.REASONS.ICON_TYPE_UNSUPPORTED });
    expect(packagedIcon).toMatchObject({ status: 'unavailable', source: 'none', reason: appIcons.REASONS.PACKAGE_LOGO_MISSING });
    expect(unknownIcon).toMatchObject({ id: unknownIcon.id, status: 'unknown-app', source: 'none' });
    expect(powershell.calls).toHaveLength(0);
    provider.dispose();
  });

  it('classifies location rules on plain strings, independent of the host filesystem', () => {
    expect(appIcons.locationInside(win('C:/Users/k/AppData/Local/Temp'), win('C:/Users/k/AppData/Local/Temp/Sub/a.exe'))).toBe(true);
    expect(appIcons.locationInside(win('C:/Users/k/AppData/Local/Temp'), win('C:/Users/k/AppData/Local/Temp2/a.exe'))).toBe(false);
    expect(appIcons.driveRootOf(win('c:/windows/a.exe'))).toBe('C:\\');
    expect(appIcons.rootOf(win('c:/windows/a.exe'))).toBe('C:\\');
    expect(appIcons.rootOf(win('relative/a.exe'))).toBeNull();
    // A native fixture path always resolves to a real root on this machine.
    const nativeRoot = appIcons.rootOf(join(root, 'a.exe'));
    expect(nativeRoot).toBeTruthy();
    expect(join(root, 'a.exe').toLowerCase().startsWith(String(nativeRoot).toLowerCase().replace(/[\\/]$/, ''))).toBe(true);
  });
});

// -- failures, queueing and caching ---------------------------------------

describe('extraction resilience and caching', () => {
  it('does not throw when PowerShell is missing or reports a failure', async () => {
    for (const outcome of [{ exitCode: null, error: 'ENOENT' }, { exitCode: 1 }]) {
      const exePath = await fixture(`fails/${outcome.error ? 'a' : 'b'}.exe`);
      const powershell = createAutoPowerShell({ outcome });
      const provider = iconProvider({ spawnPowerShell: powershell.spawnPowerShell });
      const id = appId('Failing|1||||');
      provider.registerInventory([{ id, name: 'Failing', version: '1', displayIcon: exePath }]);
      const [icon] = await provider.getIcons([id]);
      expect(icon).toMatchObject({ id, status: 'unavailable', source: 'none', reason: appIcons.REASONS.EXTRACTION_FAILED });
      provider.dispose();
    }
  });

  it('kills a batch that overruns its deadline instead of hanging the application', async () => {
    const exePath = await fixture('hang/slow.exe');
    const powershell = createFakePowerShell();
    const provider = iconProvider({ spawnPowerShell: powershell.spawnPowerShell, batchTimeoutMs: 25, killGraceMs: 10 });
    const id = appId('Slow|1||||');
    provider.registerInventory([{ id, name: 'Slow', version: '1', displayIcon: exePath }]);

    const [icon] = await provider.getIcons([id]);
    expect(icon).toMatchObject({ status: 'unavailable', reason: appIcons.REASONS.EXTRACTION_FAILED });
    expect(powershell.calls).toHaveLength(1);
    expect(powershell.calls[0].cancelCount).toBe(1);
    provider.dispose();
  });

  it('answers an id that produced no PNG as a failed extraction', async () => {
    const exePath = await fixture('empty/no-icon.exe');
    const powershell = createFakePowerShell();
    const provider = iconProvider({ spawnPowerShell: powershell.spawnPowerShell });
    const id = appId('NoIcon|1||||');
    provider.registerInventory([{ id, name: 'NoIcon', version: '1', displayIcon: exePath }]);

    const pending = provider.getIcons([id]);
    // The batch is launched by asynchronous queue work, so wait for the child
    // process instead of counting microtask ticks: on a machine running 27 test
    // workers at once, four timers can expire before the process ever spawns.
    await waitFor(() => powershell.calls.length >= 1, 'the no-PNG extraction batch');
    expect(powershell.calls).toHaveLength(1);
    powershell.calls[0].release({ exitCode: 0 }, [null]);
    const [icon] = await pending;
    expect(icon).toMatchObject({ status: 'unavailable', reason: appIcons.REASONS.EXTRACTION_FAILED });
    provider.dispose();
  });

  it('keeps one batch in flight and supersedes queued ids a newer request dropped', async () => {
    const visible = await fixture('queue/visible.exe');
    const first = await fixture('queue/first.exe');
    const stale = await fixture('queue/stale.exe');
    const powershell = createFakePowerShell();
    const provider = iconProvider({ spawnPowerShell: powershell.spawnPowerShell });
    const visibleId = appId('Visible|1||||');
    const firstId = appId('First|1||||');
    const staleId = appId('Stale|1||||');
    provider.registerInventory([
      { id: firstId, name: 'First', version: '1', displayIcon: first },
      { id: visibleId, name: 'Visible', version: '1', displayIcon: visible },
      { id: staleId, name: 'Stale', version: '1', displayIcon: stale }
    ]);

    const started = provider.getIcons([firstId]);
    await waitFor(() => powershell.calls.length === 1, 'the first batch to start');
    expect(provider.stats().batchInFlight).toBe(true);

    const scrolling = provider.getIcons([visibleId, staleId]);
    await flush(6);
    expect(provider.stats().queued).toBe(2);

    // The user stopped scrolling: only `visibleId` is on screen now.
    const settled = provider.getIcons([visibleId]);
    await flush(6);
    expect(provider.stats().queued).toBe(1);

    powershell.calls[0].release({ exitCode: 0 }, [{ width: 32, height: 32 }]);
    await waitFor(() => powershell.calls.length === 2, 'the second batch to start');
    expect(powershell.calls[1].paths).toEqual([visible]);
    powershell.calls[1].release({ exitCode: 0 }, [{ width: 32, height: 32 }]);

    const [startedIcons, scrollingIcons, settledIcons] = await Promise.all([started, scrolling, settled]);
    expect(startedIcons[0].status).toBe('ready');
    expect(scrollingIcons[0].status).toBe('ready');
    expect(scrollingIcons[1]).toMatchObject({ id: staleId, status: 'unavailable', reason: appIcons.REASONS.SUPERSEDED });
    // The same in-flight id is served from one extraction, never twice.
    expect(settledIcons[0].dataUrl).toBe(scrollingIcons[0].dataUrl);
    expect(powershell.calls.reduce((sum, call) => sum + call.paths.length, 0)).toBe(2);
    provider.dispose();
  });

  it('deduplicates concurrent requests for the same id', async () => {
    const exePath = await fixture('dedupe/dup.exe');
    const powershell = createFakePowerShell();
    const provider = iconProvider({ spawnPowerShell: powershell.spawnPowerShell });
    const id = appId('Dup|1||||');
    provider.registerInventory([{ id, name: 'Dup', version: '1', displayIcon: exePath }]);

    const first = provider.getIcons([id]);
    const second = provider.getIcons([id]);
    await waitFor(() => powershell.calls.length >= 1, 'the shared extraction batch');
    // Give the second request its turn at the queue: dedupe is decided when a
    // batch is formed, so a stray timer here would let a duplicate process slip
    // in and the count below would be a real bug rather than a flake.
    await flush(8);
    expect(powershell.calls).toHaveLength(1);
    powershell.calls[0].release({ exitCode: 0 }, [{ width: 32, height: 32 }]);
    const [firstIcons, secondIcons] = await Promise.all([first, second]);
    expect(firstIcons[0].status).toBe('ready');
    expect(secondIcons[0].status).toBe('ready');
    expect(secondIcons[0].dataUrl).toBe(firstIcons[0].dataUrl);
    provider.dispose();
  });

  it('reuses the on-disk cache after a restart without re-extracting', async () => {
    const exePath = await fixture('cache/restart.exe');
    const firstPowerShell = createAutoPowerShell({ icon: { width: 32, height: 32 } });
    const provider = iconProvider({ spawnPowerShell: firstPowerShell.spawnPowerShell });
    const id = appId('Restart|1||||');
    provider.registerInventory([{ id, name: 'Restart', version: '1', displayIcon: exePath }]);

    const [warm] = await provider.getIcons([id]);
    expect(warm.status).toBe('ready');
    expect(await readdir(cacheDirectory)).toContain(cacheFileNames(id, exePath));
    provider.dispose();

    const secondPowerShell = createAutoPowerShell();
    const restarted = iconProvider({ spawnPowerShell: secondPowerShell.spawnPowerShell });
    restarted.registerInventory([{ id, name: 'Restart', version: '1', displayIcon: exePath }]);
    const [cold] = await restarted.getIcons([id]);
    expect(cold).toMatchObject({ status: 'ready', source: 'shell', pixels: 32 });
    expect(secondPowerShell.calls).toHaveLength(0);
    restarted.dispose();
  });

  it('evicts the oldest cached icons past the file ceiling and leaves only cached PNGs behind', async () => {
    const powershell = createAutoPowerShell({ icon: { width: 32, height: 32 } });
    const provider = iconProvider({ spawnPowerShell: powershell.spawnPowerShell, maxDiskCacheFiles: 2, maxDiskCacheBytes: 10_000_000 });
    const ids: string[] = [];
    for (let index = 0; index < 3; index += 1) {
      const exePath = await fixture(`evict/app${index}.exe`);
      const id = appId(`Evict ${index}|1||||`);
      ids.push(id);
      provider.registerInventory([{ id, name: `Evict ${index}`, version: '1', displayIcon: exePath }]);
      const [icon] = await provider.getIcons([id]);
      expect(icon.status).toBe('ready');
      await flush(3);
    }
    const cached = await readdir(cacheDirectory);
    expect(cached.filter(name => name.endsWith('.png'))).toHaveLength(2);
    // The batch folder is deleted once its PNGs are consumed.
    expect(cached.filter(name => !name.endsWith('.png'))).toEqual([]);
    provider.dispose();
  });

  it('writes nothing at all on a platform that has no shell icon provider', async () => {
    const exePath = await fixture('other-platform/foreign.exe');
    const powershell = createAutoPowerShell();
    const provider = appIcons.createAppIconProvider({
      cacheDirectory,
      platform: 'linux',
      nativeImage: createFakeNativeImage(),
      spawnPowerShell: powershell.spawnPowerShell
    });
    const id = appId('Foreign|1||||');
    provider.registerInventory([{ id, name: 'Foreign', version: '1', displayIcon: exePath }]);

    const [icon] = await provider.getIcons([id]);
    expect(icon).toMatchObject({ id, status: 'unavailable', source: 'none', reason: appIcons.REASONS.NOT_WINDOWS });
    expect(powershell.calls).toHaveLength(0);
    expect(existsSync(cacheDirectory)).toBe(false);
    provider.dispose();
  });

  it('never returns a filesystem path to the caller', async () => {
    const exePath = await fixture('leak/leaky.exe');
    const iconPath = await fixture('leak/leaky.ico', { width: 48, height: 48 });
    const packageRoot = await fixture('leak/package/Assets/StoreLogo.png', { width: 40, height: 40 });
    const powershell = createAutoPowerShell();
    const provider = iconProvider({ spawnPowerShell: powershell.spawnPowerShell });
    const ids = [appId('Leaky|1||||'), appId('Iconic|1||||'), appId('Packaged|1|Packaged_1_x64__abc||')];
    provider.registerInventory([
      { id: ids[0], name: 'Leaky', version: '1', displayIcon: exePath, installLocation: dirname(exePath) },
      { id: ids[1], name: 'Iconic', version: '1', displayIcon: iconPath },
      { id: ids[2], name: 'Packaged', version: '1', packageIdentity: 'Packaged_1_x64__abc', installLocation: dirname(packageRoot) }
    ]);

    const payload = JSON.stringify(await provider.getIcons(ids));
    expect(payload).not.toContain(root);
    expect(payload).not.toContain(exePath);
    expect(payload).not.toContain('displayIcon');
    expect(payload).toContain('data:image/png;base64,');
    provider.dispose();
  });

  it('settles every waiter and removes its batch folder when disposed', async () => {
    const exePath = await fixture('dispose/first.exe');
    const queuedPath = await fixture('dispose/second.exe');
    const powershell = createFakePowerShell();
    const provider = iconProvider({ spawnPowerShell: powershell.spawnPowerShell });
    const firstId = appId('Dispose first|1||||');
    const secondId = appId('Dispose second|1||||');
    provider.registerInventory([
      { id: firstId, name: 'Dispose first', version: '1', displayIcon: exePath },
      { id: secondId, name: 'Dispose second', version: '1', displayIcon: queuedPath }
    ]);

    const first = provider.getIcons([firstId]);
    await flush(4);
    const second = provider.getIcons([secondId]);
    await flush(4);
    provider.dispose();

    expect(powershell.calls[0].cancelCount).toBe(1);
    const [firstIcons, secondIcons] = await Promise.all([first, second]);
    expect(firstIcons[0]).toMatchObject({ status: 'unavailable', reason: appIcons.REASONS.DISPOSED });
    expect(secondIcons[0]).toMatchObject({ status: 'unavailable', reason: appIcons.REASONS.DISPOSED });
    expect(provider.stats().queued).toBe(0);
  });

  it('generates one read-only script per batch inside the cache directory', async () => {
    const script = appIcons.buildExtractionScript([win('C:/Program Files/Foo/foo.exe'), win("C:/it's/bar.dll")], win('C:/cache/batch-1'));
    expect(script).toContain('SHGetFileInfo');
    expect(script).toContain('DestroyIcon');
    expect(script).toContain('ImageFormat.Png');
    expect(script).toContain("'C:\\it''s\\bar.dll'");
    expect(script).toContain("$targets = @('C:\\cache\\batch-1\\icon-0.png', 'C:\\cache\\batch-1\\icon-1.png')");
    expect(script).not.toMatch(/Start-Process|Invoke-Expression|&\s|\.Launch|msiexec/i);
  });
});

// -- registry plumbing -----------------------------------------------------

describe('uninstall registry icon field', () => {
  it('reads DisplayIcon in the read-only query and carries it through unchanged', () => {
    const script = windowsProviders.uninstallScript();
    expect(script).toContain('displayIcon=[string]$x.DisplayIcon');
    expect(script).toContain('uninstallString=[string]$x.UninstallString');
    expect(script).toContain('DisplayName');

    const [app] = windowsProviders.normalizeUninstallApp([{
      name: 'App',
      version: '1.0',
      publisher: 'Pub',
      installLocation: win('C:\\Program Files\\App'),
      uninstallString: 'MsiExec.exe /X{ABC}',
      installDate: '20240115',
      estimatedSize: '2048',
      displayIcon: win('C:\\Program Files\\App\\app.exe,0'),
      source: 'HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall'
    }]) as Array<Record<string, unknown>>;
    expect(app.displayIcon).toBe(win('C:\\Program Files\\App\\app.exe,0'));
    expect(app.name).toBe('App');
    expect(app.scope).toBe('machine');
    expect(app.registryView).toBe('64-bit');
    expect(app.installDate).toBe('2024-01-15');
    expect(app.estimatedSizeBytes).toBe(2097152);
    expect(app.source).toBe('uninstall-registry');

    const [withoutIcon] = windowsProviders.normalizeUninstallApp([{ name: 'Plain' }]) as Array<Record<string, unknown>>;
    expect(withoutIcon.displayIcon).toBeNull();
  });
});
