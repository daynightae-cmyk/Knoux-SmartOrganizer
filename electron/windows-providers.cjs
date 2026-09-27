'use strict';
/**
 * Documented read-only Windows providers.
 *
 * Every collector here is read-only and uses documented Windows interfaces:
 *   - CIM/WMI classes exposed by PowerShell (Win32_Service, Win32_Process,
 *     Win32_LogicalDisk, Win32_PnPEntity, MSFT_PhysicalDisk, Win32_StartupCommand,
 *     Get-NetAdapter / Get-NetIPAddress / Get-NetRoute, Get-AppxPackage).
 *   - Node's own `os` module for values Windows exposes without a subprocess.
 *
 * Each provider is split into:
 *   collect*()  - performs the bounded read (needs Windows)
 *   normalize*() - pure transformation, unit-testable on any platform
 *
 * Values Windows did not supply are `null` and the matching `*Available` flag
 * is `false`. Nothing is estimated.
 */

const os = require('node:os');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');

const execFileAsync = promisify(execFile);

const POWERSHELL_TIMEOUT = 60000;

/**
 * Measured provider budgets.
 *
 * A single global budget was a real defect: on this machine `Get-NetIPAddress`
 * alone needs ~90s, so one global timeout failed network-diagnostics,
 * hardware-inventory, installed-apps and smart-scan outright. Budgets are now
 * per provider, and deliberately larger than the slowest measured class so a
 * slow-but-answering provider is not reported as unavailable.
 */
const PROVIDER_TIMEOUTS = Object.freeze({
  'Win32_LogicalDisk': 30000,
  'MSFT_PhysicalDisk': 60000,
  'Win32_Service': 60000,
  'Win32_Process': 60000,
  'Get-WinEvent': 45000,
  'Win32_StartupCommand': 90000,
  'uninstall-registry': 120000,
  'Get-AppxPackage': 60000,
  'Get-NetAdapter': 120000,
  'Get-NetIPAddress': 150000,
  'Get-NetIPInterface': 150000,
  'Get-DnsClientServerAddress': 120000,
  'Get-NetRoute': 120000,
  'Win32_Processor': 45000,
  'Win32_VideoController': 45000,
  'Win32_BIOS': 45000,
  'Win32_PhysicalMemory': 45000,
  'Win32_DesktopMonitor': 60000,
  'Win32_SoundDevice': 60000,
  'Win32_USBController': 60000,
  'Win32_PnPEntity': 90000,
  'Win32_Battery': 60000,
  'root/WMI BatteryStatus': 60000,
  'Win32_OperatingSystem': 45000,
  'Win32_PerfFormattedData_PerfOS_Processor': 45000
});

/**
 * A provider failure the renderer can act on, without the PowerShell source.
 *
 * `execFile` embeds the whole command line in its error message; forwarding that
 * to the renderer would hand it raw PowerShell, which the security boundary
 * explicitly forbids. Only the provider identity and a stable reason code cross.
 */
class ProviderUnavailableError extends Error {
  constructor(provider, reason, { timeoutMs = null } = {}) {
    super(`The Windows provider "${provider}" is unavailable (${reason}).`);
    this.name = 'ProviderUnavailableError';
    this.code = 'PROVIDER_UNAVAILABLE';
    this.provider = provider;
    this.reason = reason;
    this.timeoutMs = timeoutMs;
  }
  toJSON() { return { code: this.code, provider: this.provider, reason: this.reason, timeoutMs: this.timeoutMs }; }
}

function providerTimeout(provider, fallback = POWERSHELL_TIMEOUT) {
  return PROVIDER_TIMEOUTS[provider] ?? fallback;
}

function asArray(value) {
  if (value == null) return [];
  return Array.isArray(value) ? value.filter(item => item != null) : [value];
}

function text(value) {
  if (value == null) return null;
  const result = String(value).trim();
  return result === '' ? null : result;
}

function numberOrNull(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function boolOrNull(value) {
  if (value == null) return null;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  const normalized = String(value).trim().toLowerCase();
  if (['true', '1', 'yes'].includes(normalized)) return true;
  if (['false', '0', 'no'].includes(normalized)) return false;
  return null;
}

/**
 * Windows/PowerShell date normalisation.
 * `ConvertTo-Json` serialises a DateTime as `\/Date(1790454025500)\/`, which is
 * not a parseable ISO string, so it must be decoded before use.
 */
function dateOrNull(value) {
  if (value == null) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value.toISOString();
  if (typeof value === 'number') {
    const fromEpoch = new Date(value);
    return Number.isNaN(fromEpoch.getTime()) ? null : fromEpoch.toISOString();
  }
  const raw = String(value).trim();
  if (!raw) return null;
  const ms = raw.match(/^\/?Date\((-?\d+)\)\/?$/);
  if (ms) {
    const decoded = new Date(Number(ms[1]));
    return Number.isNaN(decoded.getTime()) ? null : decoded.toISOString();
  }
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function uptimeSecondsFrom(bootTime) {
  const boot = dateOrNull(bootTime);
  if (!boot) return null;
  return Math.max(0, Math.round((Date.now() - new Date(boot).getTime()) / 1000));
}

/**
 * Windows CIM/NetCmdlet enums are serialised as integers by `ConvertTo-Json`.
 * They are mapped to their documented names so the UI never shows "11" or "0"
 * where a state name belongs. Unknown values stay null.
 */
const ENUMS = Object.freeze({
  // System.Net.Sockets.AddressFamily: InterNetwork = 2, InterNetworkV6 = 23.
  AddressFamily: Object.freeze({ 2: 'IPv4', 23: 'IPv6' }),
  AddressState: Object.freeze({ 0: 'Invalid', 1: 'Preferred', 2: 'Deprecated', 3: 'Tentative', 4: 'Duplicate' }),
  Dhcp: Object.freeze({ 0: 'Disabled', 1: 'Enabled' }),
  ConnectionState: Object.freeze({ 0: 'Disconnected', 1: 'Connected', 2: 'Connecting' }),
  ProcessorArchitecture: Object.freeze({ 0: 'x86', 1: 'MIPS', 2: 'Alpha', 3: 'PowerPC', 4: 'SH', 5: 'ARM', 6: 'IA64', 9: 'x64', 12: 'ARM64' }),
  AppxArchitecture: Object.freeze({ 0: 'X86', 1: 'ARM', 2: 'ARM64', 3: 'X64', 4: 'Neutral', 11: 'X64', 12: 'ARM64' }),
  // Microsoft.PowerShell.Cmdletization.GeneratedTypes.NetSecurity.PrefixOrigin
  // and .SuffixOrigin share one enumeration.
  PrefixOrigin: Object.freeze({ 0: 'Other', 1: 'Manual', 2: 'Dhcp', 3: 'RouterAdvertisement', 4: 'WellKnown' }),
  SuffixOrigin: Object.freeze({ 0: 'Other', 1: 'Manual', 2: 'Dhcp', 3: 'RouterAdvertisement', 4: 'WellKnown' })
});

function enumName(group, value) {
  if (value == null) return null;
  const table = ENUMS[group];
  if (!table) return null;
  // NetCmdlets usually emit the name already; only fall back to the numeric table.
  if (typeof value === 'string' && /[A-Za-z]/.test(value)) return value;
  return table[Number(value)] ?? null;
}

async function powershellJson(script, { timeout = POWERSHELL_TIMEOUT, maxBuffer = 32 * 1024 * 1024, execFile: runner = execFileAsync, provider = 'PowerShell' } = {}) {
  let stdout;
  try {
    ({ stdout } = await runner('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', script], { windowsHide: true, timeout, maxBuffer }));
  } catch (error) {
    // `error.message` from execFile embeds the full command line, so it is never
    // forwarded. The provider identity and a stable reason are the only signal.
    const timedOut = error.killed === true || error.signal === 'SIGTERM' || error.code === 'ETIMEDOUT';
    const missing = error.code === 'ENOENT';
    throw new ProviderUnavailableError(provider, missing ? 'powershell-not-found' : timedOut ? 'timed-out' : 'query-failed', { timeoutMs: timeout });
  }
  const trimmed = String(stdout).trim();
  if (!trimmed) return null;
  try { return JSON.parse(trimmed); } catch { throw new ProviderUnavailableError(provider, 'unreadable-response'); }
}

/**
 * Runs independent provider scripts and keeps whatever actually answered.
 *
 * Used where a tool is built from several unrelated Windows sources, so one slow
 * or unreadable source yields a truthful partial result instead of no result.
 */
async function collectSources(sources, { runner = powershellJson } = {}) {
  const settled = await Promise.allSettled(sources.map(source => runner(source.script, source.options)));
  const payload = {};
  const unavailable = [];
  settled.forEach((outcome, index) => {
    const source = sources[index];
    if (outcome.status === 'fulfilled') {
      const value = outcome.value;
      // Store every result under its own source key, single objects included:
      // PowerShell `ConvertTo-Json` returns a bare object (not an array) when a
      // query yields exactly one row, and the normalizers read by key via asArray.
      // Spreading a single object onto the payload silently dropped CPU, GPU,
      // BIOS and monitor results while reporting success.
      if (Array.isArray(value)) payload[source.key] = value;
      else if (value && typeof value === 'object') payload[source.key] = value;
      else payload[source.key] = value == null ? null : value;
    } else {
      unavailable.push(outcome.reason instanceof ProviderUnavailableError ? outcome.reason.toJSON() : { provider: source.options?.provider || 'PowerShell', reason: 'query-failed' });
    }
  });
  return { payload, partial: unavailable.length > 0, unavailable };
}


// ---------------------------------------------------------------------------
// Volume / physical disk  (Wave 1 storage, Wave 6 hardware)
// ---------------------------------------------------------------------------

const LOGICAL_DISK_SCRIPT = "Get-CimInstance Win32_LogicalDisk -Filter 'DriveType=3' | Select-Object DeviceID,VolumeName,FileSystem,Size,FreeSpace,VolumeSerialNumber | ConvertTo-Json -Depth 3";

const PHYSICAL_DISK_SCRIPT = "Get-PhysicalDisk -ErrorAction SilentlyContinue | Select-Object DeviceId,FriendlyName,MediaType,BusType,Size,HealthStatus,OperationalStatus,UniqueId | ConvertTo-Json -Depth 4";

function normalizeLogicalDisk(raw) {
  return asArray(raw).map(disk => {
    const size = numberOrNull(disk.Size);
    const free = numberOrNull(disk.FreeSpace);
    return {
      deviceId: text(disk.DeviceID),
      volumeName: text(disk.VolumeName),
      fileSystem: text(disk.FileSystem),
      volumeSerialNumber: text(disk.VolumeSerialNumber),
      sizeBytes: size,
      freeBytes: free,
      usedBytes: size != null && free != null ? Math.max(0, size - free) : null,
      provider: 'Win32_LogicalDisk'
    };
  });
}

function normalizePhysicalDisk(raw) {
  return asArray(raw).map(disk => {
    const size = numberOrNull(disk.Size);
    return {
      deviceId: text(disk.DeviceId),
      friendlyName: text(disk.FriendlyName),
      mediaType: text(disk.MediaType),
      busType: text(disk.BusType),
      sizeBytes: size,
      healthStatus: text(disk.HealthStatus),
      operationalStatus: text(disk.OperationalStatus),
      // MSFT_PhysicalDisk does not expose a portable temperature; never invent one.
      temperatureCelsius: null,
      temperatureAvailable: false,
      temperatureProvider: null,
      provider: 'MSFT_PhysicalDisk'
    };
  });
}

async function collectLogicalDisks(options = {}) { return normalizeLogicalDisk(await powershellJson(LOGICAL_DISK_SCRIPT, { ...options, provider: 'Win32_LogicalDisk', timeout: options.timeout ?? providerTimeout('Win32_LogicalDisk') })); }
async function collectPhysicalDisks(options = {}) { return normalizePhysicalDisk(await powershellJson(PHYSICAL_DISK_SCRIPT, { ...options, provider: 'MSFT_PhysicalDisk', timeout: options.timeout ?? providerTimeout('MSFT_PhysicalDisk') })); }

// ---------------------------------------------------------------------------
// Services  (Wave 9) - Win32_Service already carries DelayedAutoStart, so no
// per-service registry read is required.
// ---------------------------------------------------------------------------

const SERVICE_SCRIPT = "Get-CimInstance Win32_Service | Select-Object Name,DisplayName,Description,State,StartMode,DelayedAutoStart,ProcessId,ServiceType,StartName,PathName,Dependencies,AcceptStop,CheckPoint,WaitHint,Started | ConvertTo-Json -Depth 5";

const STARTUP_TYPE_MAP = Object.freeze({ Auto: 'automatic', Manual: 'manual', Disabled: 'disabled' });

function normalizeService(raw, { isProtected = () => false } = {}) {
  return asArray(raw).map(service => {
    const name = text(service.Name) || '';
    const startMode = text(service.StartMode);
    return {
      name,
      displayName: text(service.DisplayName),
      description: text(service.Description),
      state: text(service.State),
      startMode,
      startupType: startMode ? (STARTUP_TYPE_MAP[startMode] || 'unknown') : 'unknown',
      delayedAuto: boolOrNull(service.DelayedAutoStart),
      processId: numberOrNull(service.ProcessId),
      running: text(service.State) === 'Running',
      serviceType: text(service.ServiceType),
      account: text(service.StartName),
      binaryPath: text(service.PathName),
      dependencies: asArray(service.Dependencies).map(text).filter(Boolean),
      acceptsStop: boolOrNull(service.AcceptStop),
      checkPoint: numberOrNull(service.CheckPoint),
      waitHint: numberOrNull(service.WaitHint),
      startedAt: text(service.Started),
      protected: isProtected(name),
      controllable: /^[A-Za-z0-9_.-]{1,256}$/.test(name) && !isProtected(name),
      provider: 'Win32_Service'
    };
  });
}

async function collectServices(options = {}) { return normalizeService(await powershellJson(SERVICE_SCRIPT, { ...options, provider: 'Win32_Service', timeout: options.timeout ?? providerTimeout('Win32_Service') })); }

// ---------------------------------------------------------------------------
// Processes  (Wave 7)
// ---------------------------------------------------------------------------

const PROCESS_SCRIPT = "Get-CimInstance Win32_Process | Select-Object ProcessId,ParentProcessId,Name,ExecutablePath,CreationDate,WorkingSetSize,KernelModeTime,UserModeTime | ConvertTo-Json -Depth 4";

function normalizeProcess(raw) {
  return asArray(raw).map(entry => ({
    processId: numberOrNull(entry.ProcessId),
    parentProcessId: numberOrNull(entry.ParentProcessId),
    name: text(entry.Name),
    executablePath: text(entry.ExecutablePath),
    startedAt: dateOrNull(entry.CreationDate),
    workingSetBytes: numberOrNull(entry.WorkingSetSize),
    cpuSeconds: numberOrNull(entry.KernelModeTime) != null && numberOrNull(entry.UserModeTime) != null
      ? Math.round(((numberOrNull(entry.KernelModeTime) + numberOrNull(entry.UserModeTime)) / 1e7) * 10) / 10
      : null,
    // Owner/integrity/signature need extra provider passes; filled in by the
    // collector only when Windows actually answered.
    owner: null,
    ownerAvailable: false,
    integrityLevel: null,
    integrityLevelAvailable: false,
    signatureStatus: null,
    signatureAvailable: false,
    provider: 'Win32_Process'
  }));
}

function normalizeSignature(entry) {
  const status = text(entry?.status);
  return {
    path: text(entry?.path),
    signatureStatus: status,
    signatureAvailable: status != null,
    signatureSubject: text(entry?.signer),
    signatureMessage: text(entry?.statusMessage)
  };
}

async function collectProcesses(options = {}) { return normalizeProcess(await powershellJson(PROCESS_SCRIPT, { ...options, provider: 'Win32_Process', timeout: options.timeout ?? providerTimeout('Win32_Process') })); }

/**
 * Bounded Authenticode verification for the heaviest processes.
 * One PowerShell process verifies the whole batch: spawning a process per file
 * was slow enough to stall the operation.
 */
async function collectProcessSignatures(paths, { limit = 40, execFile: runner = execFileAsync } = {}) {
  const candidates = Array.isArray(paths) ? paths.filter(Boolean).slice(0, limit) : [];
  if (!candidates.length) return [];
  const list = candidates.map(value => `'${String(value).replace(/'/g, "''")}'`).join(',');
  const script = `$paths=@(${list}); $out=@(); foreach($p in $paths){ try { $s=Get-AuthenticodeSignature -LiteralPath $p -ErrorAction Stop; $out += [pscustomobject]@{path=$p;status=[string]$s.Status;signer=if($s.SignerCertificate){$s.SignerCertificate.Subject}else{$null}} } catch { $out += [pscustomobject]@{path=$p;status=$null} } }; $out | ConvertTo-Json -Depth 3 -Compress`;
  try {
    const { stdout } = await runner('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', script], { windowsHide: true, timeout: 90000, maxBuffer: 4 * 1024 * 1024 });
    const parsed = JSON.parse(String(stdout).trim() || '[]');
    return asArray(parsed).map(entry => normalizeSignature(entry));
  } catch {
    return candidates.map(candidate => ({ path: candidate, signatureStatus: null, signatureAvailable: false, signatureSubject: null, signatureMessage: 'not-checked' }));
  }
}

// ---------------------------------------------------------------------------
// Events  (Wave 8) - bounded, level-filtered, provider-clustered.
// ---------------------------------------------------------------------------

const EVENT_SCRIPT = "$start=(Get-Date).AddDays(-7); Get-WinEvent -FilterHashtable @{LogName='System';Level=1,2,3;StartTime=$start} -MaxEvents 200 -ErrorAction SilentlyContinue | Select-Object TimeCreated,Id,ProviderName,LevelDisplayName,Level,Message,ActivityId | ConvertTo-Json -Depth 4";

function normalizeEvent(raw) {
  return asArray(raw).map(entry => ({
    provider: text(entry.ProviderName) || 'Unknown',
    eventId: numberOrNull(entry.Id),
    level: numberOrNull(entry.Level),
    levelName: text(entry.LevelDisplayName),
    timeCreated: dateOrNull(entry.TimeCreated),
    activityId: text(entry.ActivityId),
    message: text(entry.Message) ? String(entry.Message).replace(/\s+/g, ' ').slice(0, 300) : null
  }));
}

async function collectEvents(options = {}) { return normalizeEvent(await powershellJson(EVENT_SCRIPT, { ...options, provider: 'Get-WinEvent', timeout: options.timeout ?? providerTimeout('Get-WinEvent') })); }

// ---------------------------------------------------------------------------
// Startup read coverage  (Wave 10)
// ---------------------------------------------------------------------------

const STARTUP_SCRIPT = "Get-CimInstance Win32_StartupCommand -ErrorAction SilentlyContinue | Select-Object Name,Command,Location,User | ConvertTo-Json -Depth 4";

const STARTUP_SOURCE_MAP = Object.freeze([
  // Specific hives are matched before the generic Run key so the writable scope stays exact.
  // Win32_StartupCommand reports the user key as HKU\<sid>, not HKCU.
  { match: /^HKU\\S-1-[\d-]+\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run$/i, source: 'registry-run-user', writable: true },
  { match: /^HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run$/i, source: 'registry-run-user', writable: true },
  { match: /^HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Run$/i, source: 'registry-run-machine', writable: false },
  { match: /^HKLM\\Software\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Run$/i, source: 'registry-run-machine-32bit', writable: false },
  { match: /CurrentVersion\\RunOnce/i, source: 'registry-run-once', writable: false },
  { match: /CurrentVersion\\Run(?!Once)/i, source: 'registry-run', writable: false },
  { match: /Start Menu\\Programs\\Startup/i, source: 'startup-folder-user', writable: false },
  { match: /Common Startup/i, source: 'startup-folder-common', writable: false }
]);

function classifyStartupSource(location) {
  const value = String(location || '');
  for (const rule of STARTUP_SOURCE_MAP) if (rule.match.test(value)) return rule;
  if (/StartupTask/i.test(value)) return { source: 'startup-task', writable: false };
  return { source: 'other', writable: false };
}

function normalizeStartup(raw) {
  return asArray(raw).map(entry => {
    const location = text(entry.Location) || '';
    const rule = classifyStartupSource(location);
    return {
      name: text(entry.Name),
      command: text(entry.Command),
      location,
      user: text(entry.User),
      source: rule.source,
      sourceDetail: location,
      writable: rule.writable && (text(entry.Name) || '') !== null,
      // SmartOrganizer only mutates the current-user Run key; everything else is read-only.
      managedBySmartOrganizer: rule.source === 'registry-run-user',
      provider: 'Win32_StartupCommand'
    };
  });
}

async function collectStartupItems(options = {}) { return normalizeStartup(await powershellJson(STARTUP_SCRIPT, { ...options, provider: 'Win32_StartupCommand', timeout: options.timeout ?? providerTimeout('Win32_StartupCommand') })); }

// ---------------------------------------------------------------------------
// Installed applications  (Wave 2)
// ---------------------------------------------------------------------------

const UNINSTALL_ROOTS = [
  'HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall',
  'HKLM:\\Software\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall',
  'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall'
];

function uninstallScript(roots) {
  const list = (Array.isArray(roots) && roots.length ? roots : UNINSTALL_ROOTS).map(root => `'${String(root).replace(/'/g, "''")}'`).join(',');
  return `$roots=@(${list}); $items=@(); $sourceFailures=0; $entryFailures=0; foreach($root in $roots){ if(-not (Test-Path -LiteralPath $root)){ $sourceFailures++; continue }; $keys=Get-ChildItem -LiteralPath $root -ErrorAction SilentlyContinue; foreach($key in @($keys)){ try { $x=Get-ItemProperty -LiteralPath $key.PSPath -ErrorAction Stop; if($x.DisplayName){ $items += [pscustomobject]@{name=[string]$x.DisplayName;version=[string]$x.DisplayVersion;publisher=[string]$x.Publisher;installLocation=[string]$x.InstallLocation;uninstallString=[string]$x.UninstallString;installDate=[string]$x.InstallDate;installSource=[string]$x.InstallSource;estimatedSize=[string]$x.EstimatedSize;releaseType=[string]$x.ReleaseType;systemComponent=[string]$x.SystemComponent;parentKeyName=[string]$x.ParentKeyName;windowsInstaller=[string]$x.WindowsInstaller;source=$root} } } catch { $entryFailures++ } } }; [pscustomobject]@{items=$items;sourceFailures=$sourceFailures;entryFailures=$entryFailures;roots=$roots} | ConvertTo-Json -Depth 4`;
}

const APPX_SCRIPT = "Get-AppxPackage -ErrorAction SilentlyContinue | Select-Object Name,PackageFullName,Version,Publisher,InstallLocation,Architecture,SignatureKind,Status,IsFramework,NonRemovable | ConvertTo-Json -Depth 4";

const ARCH_GUESS = Object.freeze([
  { match: /\b(?:x64|amd64)\b/i, architecture: 'x64' },
  { match: /\bx86\b|\b32-?bit\b/i, architecture: 'x86' },
  { match: /\barm64\b/i, architecture: 'arm64' }
]);

function guessArchitecture(...values) {
  for (const value of values) {
    const text_ = String(value || '');
    for (const rule of ARCH_GUESS) if (rule.match.test(text_)) return rule.architecture;
  }
  return null;
}

const CANONICAL_ARCHITECTURES = Object.freeze(['x64', 'x86', 'arm64', 'arm', 'neutral']);

/**
 * One canonical spelling per architecture. The same machine reported both `x86`
 * and `X86` because numeric and string sources were passed through unchanged, so
 * consumers could not group by architecture without re-normalising themselves.
 */
function canonicalArchitecture(value) {
  const raw = String(value == null ? '' : value).trim();
  if (!raw) return null;
  const lowered = raw.toLowerCase();
  if (CANONICAL_ARCHITECTURES.includes(lowered)) return lowered;
  return enumName('AppxArchitecture', value) ? canonicalArchitecture(enumName('AppxArchitecture', value)) : guessArchitecture(raw);
}

/**
 * The resource architecture is the third underscore-delimited segment of a package
 * full name: `Name_Version_Architecture_ProcessorArchitecture_PublisherId`. Word
 * boundaries cannot match it because the segments are separated by underscores.
 */
function architectureFromPackageFullName(value) {
  const parts = String(value || '').split('_');
  if (parts.length < 3) return null;
  const token = String(parts[2] || '').trim().toLowerCase();
  return CANONICAL_ARCHITECTURES.includes(token) ? token : null;
}

/** Only trust InstallDate when it is a real, parseable date (YYYYMMDD). */
function normalizeInstallDate(value) {
  const raw = text(value);
  if (!raw) return null;
  const match = raw.match(/^(\d{4})(\d{2})(\d{2})/);
  if (!match) return null;
  const [, year, month, day] = match;
  const parsed = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
}

function normalizeUninstallApp(raw) {
  return asArray(raw).map(entry => {
    const name = text(entry.name);
    const installLocation = text(entry.installLocation);
    const uninstallString = text(entry.uninstallString);
    const root = text(entry.source) || '';
    return {
      name,
      version: text(entry.version),
      publisher: text(entry.publisher),
      installDate: normalizeInstallDate(entry.installDate),
      installLocation,
      architecture: guessArchitecture(installLocation, entry.windowsInstaller),
      scope: /^HKCU/i.test(root) ? 'user' : 'machine',
      registryView: /WOW6432Node/i.test(root) ? '32-bit' : '64-bit',
      packageIdentity: null,
      uninstallCapability: uninstallString ? 'uninstall-string' : null,
      repairCapability: null,
      updateCapability: null,
      estimatedSizeBytes: numberOrNull(entry.estimatedSize) != null ? Number(entry.estimatedSize) * 1024 : null,
      installSource: text(entry.installSource),
      systemComponent: boolOrNull(entry.systemComponent),
      releaseType: text(entry.releaseType),
      isFramework: null,
      source: 'uninstall-registry',
      evidence: { root, keyName: text(entry.parentKeyName) },
      provider: 'UninstallRegistry'
    };
  });
}

function normalizeAppxApp(raw) {
  return asArray(raw).map(entry => {
    const installLocation = text(entry.InstallLocation);
    return {
      name: text(entry.Name),
      version: text(entry.Version),
      publisher: text(entry.Publisher),
      installDate: null,
      installLocation,
      architecture: canonicalArchitecture(entry.Architecture) || architectureFromPackageFullName(entry.PackageFullName) || guessArchitecture(entry.SignatureKind),
      scope: 'user',
      registryView: null,
      packageIdentity: text(entry.PackageFullName),
      // MSIX packages are removed through the package manager, not an uninstall string.
      uninstallCapability: 'appx-package',
      repairCapability: 'appx-package',
      updateCapability: 'appx-package',
      estimatedSizeBytes: null,
      installSource: null,
      systemComponent: null,
      releaseType: null,
      isFramework: boolOrNull(entry.IsFramework),
      nonRemovable: boolOrNull(entry.NonRemovable),
      signatureKind: text(entry.SignatureKind),
      status: text(entry.Status),
      source: 'appx-msix',
      evidence: { packageFullName: text(entry.PackageFullName), installLocation },
      provider: 'Get-AppxPackage'
    };
  });
}

async function collectUninstallApps(options = {}) { return powershellJson(uninstallScript(), { ...options, provider: 'uninstall-registry', timeout: options.timeout ?? providerTimeout('uninstall-registry') }); }
async function collectAppxApps(options = {}) { return normalizeAppxApp(await powershellJson(APPX_SCRIPT, { ...options, provider: 'Get-AppxPackage', timeout: options.timeout ?? providerTimeout('Get-AppxPackage') })); }

// ---------------------------------------------------------------------------
// Network  (Wave 5)
// ---------------------------------------------------------------------------

// Each Net* cmdlet is an independent Windows source with its own measured budget,
// because Get-NetIPAddress alone can outlast a shared global timeout.
const NETWORK_SOURCES = [
  { key: 'adapters', options: { provider: 'Get-NetAdapter' }, script: "Get-NetAdapter -ErrorAction SilentlyContinue | Select-Object Name,InterfaceDescription,Status,MacAddress,LinkSpeed,MediaType,InterfaceIndex,ifAlias | ConvertTo-Json -Depth 4" },
  { key: 'addresses', options: { provider: 'Get-NetIPAddress' }, script: "Get-NetIPAddress -ErrorAction SilentlyContinue | Select-Object InterfaceAlias,InterfaceIndex,IPAddress,PrefixLength,AddressFamily,PrefixOrigin,SuffixOrigin,AddressState,Type | ConvertTo-Json -Depth 4" },
  { key: 'dns', options: { provider: 'Get-DnsClientServerAddress' }, script: "Get-DnsClientServerAddress -ErrorAction SilentlyContinue | Select-Object InterfaceAlias,InterfaceIndex,ServerAddresses | ConvertTo-Json -Depth 4" },
  { key: 'interfaces', options: { provider: 'Get-NetIPInterface' }, script: "Get-NetIPInterface -ErrorAction SilentlyContinue | Select-Object InterfaceAlias,InterfaceIndex,Dhcp,ConnectionState,InterfaceDescription,NlMtu,AutomaticMetric | ConvertTo-Json -Depth 4" },
  { key: 'defaultRoutes', options: { provider: 'Get-NetRoute' }, script: "Get-NetRoute -ErrorAction SilentlyContinue | Select-Object InterfaceAlias,InterfaceIndex,DestinationPrefix,NextHop,RouteMetric,PolicyStore | Where-Object { $_.DestinationPrefix -eq '0.0.0.0/0' } | ConvertTo-Json -Depth 4" }
];

function normalizeNetwork(raw) {
  const payload = raw && typeof raw === 'object' ? raw : {};
  const adapters = asArray(payload.adapters);
  const addresses = asArray(payload.addresses);
  const dnsServers = asArray(payload.dns ?? payload.dnsServers);
  const interfaces = asArray(payload.interfaces);
  const routes = asArray(payload.defaultRoutes);

  const items = adapters.length ? adapters.map(adapter => {
    const alias = text(adapter.Name) || text(adapter.ifAlias) || text(adapter.InterfaceDescription) || '';
    const index = numberOrNull(adapter.InterfaceIndex);
    const ownedAddresses = addresses.filter(entry => (text(entry.InterfaceAlias) || '') === alias || (index != null && numberOrNull(entry.InterfaceIndex) === index));
    const ownedDns = dnsServers.filter(entry => (text(entry.InterfaceAlias) || '') === alias || (index != null && numberOrNull(entry.InterfaceIndex) === index));
    const ownedInterface = interfaces.find(entry => (text(entry.InterfaceAlias) || '') === alias || (index != null && numberOrNull(entry.InterfaceIndex) === index));
    const ownedRoutes = routes.filter(entry => (text(entry.InterfaceAlias) || '') === alias || (index != null && numberOrNull(entry.InterfaceIndex) === index));
    const preferred = (entry) => enumName('AddressState', entry.AddressState) === 'Preferred';
    const ipv4Entries = ownedAddresses.filter(entry => enumName('AddressFamily', entry.AddressFamily) === 'IPv4');
    const ipv6Entries = ownedAddresses.filter(entry => enumName('AddressFamily', entry.AddressFamily) === 'IPv6');
    return {
      name: alias,
      description: text(adapter.InterfaceDescription),
      status: text(adapter.Status),
      mac: text(adapter.MacAddress),
      mediaType: text(adapter.MediaType),
      linkSpeed: text(adapter.LinkSpeed),
      interfaceIndex: index,
      interfaceType: ownedInterface ? text(ownedInterface.InterfaceDescription) : null,
      connectionState: ownedInterface ? enumName('ConnectionState', ownedInterface.ConnectionState) : null,
      dhcp: ownedInterface ? enumName('Dhcp', ownedInterface.Dhcp) : null,
      mtu: ownedInterface ? numberOrNull(ownedInterface.NlMtu) : null,
      automaticMetric: ownedInterface ? boolOrNull(ownedInterface.AutomaticMetric) : null,
      ipv4: ipv4Entries.filter(preferred).map(entry => ({ address: text(entry.IPAddress), prefixLength: numberOrNull(entry.PrefixLength), prefixOrigin: enumName('PrefixOrigin', entry.PrefixOrigin), suffixOrigin: enumName('SuffixOrigin', entry.SuffixOrigin), state: enumName('AddressState', entry.AddressState) })),
      ipv6: ipv6Entries.filter(preferred).map(entry => ({ address: text(entry.IPAddress), prefixLength: numberOrNull(entry.PrefixLength), prefixOrigin: enumName('PrefixOrigin', entry.PrefixOrigin), suffixOrigin: enumName('SuffixOrigin', entry.SuffixOrigin), state: enumName('AddressState', entry.AddressState) })),
      ipv4Configured: ipv4Entries.length,
      ipv6Configured: ipv6Entries.length,
      dnsServers: ownedDns.flatMap(entry => asArray(entry.ServerAddresses).map(text)).filter(Boolean),
      defaultGateway: ownedRoutes.map(entry => text(entry.NextHop)).filter(Boolean)[0] || null,
      defaultRoutes: ownedRoutes.map(entry => ({ destination: text(entry.DestinationPrefix), nextHop: text(entry.NextHop), metric: numberOrNull(entry.RouteMetric) })),
      provider: 'Get-NetAdapter'
    };
  }) : [];

  return { items, addresses, dnsServers, interfaces, routes };
}

async function collectNetwork(options = {}) {
  const sources = NETWORK_SOURCES.map(source => ({ ...source, options: { ...source.options, ...options, timeout: options.timeout ?? providerTimeout(source.options.provider) } }));
  const { payload, partial, unavailable } = await collectSources(sources, { runner: options.execFile ? (script, opts) => powershellJson(script, { ...opts, execFile: options.execFile }) : powershellJson });
  return { ...normalizeNetwork(payload), partial, unavailable };
}

// ---------------------------------------------------------------------------
// Hardware / devices  (Wave 6)
// ---------------------------------------------------------------------------

const HARDWARE_SOURCES = [
  { key: 'cpu', options: { provider: 'Win32_Processor' }, script: "Get-CimInstance Win32_Processor -ErrorAction SilentlyContinue | Select-Object Name,NumberOfCores,NumberOfLogicalProcessors,MaxClockSpeed,Architecture | ConvertTo-Json -Depth 3" },
  { key: 'gpu', options: { provider: 'Win32_VideoController' }, script: "Get-CimInstance Win32_VideoController -ErrorAction SilentlyContinue | Select-Object Name,AdapterRAM,DriverVersion,DriverDate,VideoModeDescription,Status | ConvertTo-Json -Depth 3" },
  { key: 'bios', options: { provider: 'Win32_BIOS' }, script: "Get-CimInstance Win32_BIOS -ErrorAction SilentlyContinue | Select-Object Manufacturer,SMBIOSBIOSVersion,ReleaseDate,SerialNumber | ConvertTo-Json -Depth 3" },
  { key: 'memory', options: { provider: 'Win32_PhysicalMemory' }, script: "Get-CimInstance Win32_PhysicalMemory -ErrorAction SilentlyContinue | Select-Object Manufacturer,PartNumber,Capacity,Speed,ConfiguredClockSpeed,DeviceLocator | ConvertTo-Json -Depth 3" },
  { key: 'disks', options: { provider: 'MSFT_PhysicalDisk' }, script: "Get-PhysicalDisk -ErrorAction SilentlyContinue | Select-Object DeviceId,FriendlyName,MediaType,BusType,Size,HealthStatus,OperationalStatus,UniqueId | ConvertTo-Json -Depth 4" },
  { key: 'monitors', options: { provider: 'Win32_DesktopMonitor' }, script: "Get-CimInstance Win32_DesktopMonitor -ErrorAction SilentlyContinue | Select-Object Name,DeviceID,ScreenWidth,ScreenHeight,Status,PNPDeviceID | ConvertTo-Json -Depth 3" },
  { key: 'audio', options: { provider: 'Win32_SoundDevice' }, script: "Get-CimInstance Win32_SoundDevice -ErrorAction SilentlyContinue | Select-Object Name,Manufacturer,Status,PNPDeviceID | ConvertTo-Json -Depth 3" },
  { key: 'usb', options: { provider: 'Win32_USBController' }, script: "Get-CimInstance Win32_USBController -ErrorAction SilentlyContinue | Select-Object Name,Manufacturer,Status,PNPDeviceID | ConvertTo-Json -Depth 3" },
  { key: 'pnpProblems', options: { provider: 'Win32_PnPEntity' }, script: 'Get-CimInstance Win32_PnPEntity -Filter "ConfigManagerErrorCode<>0" -ErrorAction SilentlyContinue | Select-Object Name,PNPDeviceID,ConfigManagerErrorCode,Manufacturer | ConvertTo-Json -Depth 3' }
];

function normalizeHardware(raw) {
  const payload = raw && typeof raw === 'object' ? raw : {};
  return {
    cpu: asArray(payload.cpu).map(entry => ({
      name: text(entry.Name), cores: numberOrNull(entry.NumberOfCores), logicalProcessors: numberOrNull(entry.NumberOfLogicalProcessors),
      maxClockMHz: numberOrNull(entry.MaxClockSpeed), architecture: enumName('ProcessorArchitecture', entry.Architecture), provider: 'Win32_Processor'
    })),
    gpu: asArray(payload.gpu).map(entry => ({
      name: text(entry.Name), adapterRamBytes: numberOrNull(entry.AdapterRAM), driverVersion: text(entry.DriverVersion),
      driverDate: dateOrNull(entry.DriverDate), videoMode: text(entry.VideoModeDescription), status: text(entry.Status), provider: 'Win32_VideoController'
    })),
    bios: asArray(payload.bios).map(entry => ({
      manufacturer: text(entry.Manufacturer), version: text(entry.SMBIOSBIOSVersion), releaseDate: dateOrNull(entry.ReleaseDate),
      serialNumber: text(entry.SerialNumber), provider: 'Win32_BIOS'
    })),
    memoryModules: asArray(payload.memory).map(entry => ({
      manufacturer: text(entry.Manufacturer), partNumber: text(entry.PartNumber), capacityBytes: numberOrNull(entry.Capacity),
      speedMHz: numberOrNull(entry.Speed), configuredSpeedMHz: numberOrNull(entry.ConfiguredClockSpeed), locator: text(entry.DeviceLocator), provider: 'Win32_PhysicalMemory'
    })),
    physicalDisks: normalizePhysicalDisk(payload.disks),
    monitors: asArray(payload.monitors).map(entry => ({
      name: text(entry.Name), deviceId: text(entry.DeviceID), width: numberOrNull(entry.ScreenWidth), height: numberOrNull(entry.ScreenHeight),
      status: text(entry.Status), pnpDeviceId: text(entry.PNPDeviceID), provider: 'Win32_DesktopMonitor'
    })),
    audio: asArray(payload.audio).map(entry => ({ name: text(entry.Name), manufacturer: text(entry.Manufacturer), status: text(entry.Status), pnpDeviceId: text(entry.PNPDeviceID), provider: 'Win32_SoundDevice' })),
    usbControllers: asArray(payload.usb).map(entry => ({ name: text(entry.Name), manufacturer: text(entry.Manufacturer), status: text(entry.Status), pnpDeviceId: text(entry.PNPDeviceID), provider: 'Win32_USBController' })),
    problemDevices: asArray(payload.pnpProblems).map(entry => ({
      name: text(entry.Name), pnpDeviceId: text(entry.PNPDeviceID), problemCode: numberOrNull(entry.ConfigManagerErrorCode), manufacturer: text(entry.Manufacturer), provider: 'Win32_PnPEntity'
    })),
    temperatures: { available: false, provider: null, celsius: null, reason: 'No documented Windows provider exposes CPU/GPU/SSD temperature through the interfaces used by this application.' }
  };
}

async function collectHardware(options = {}) {
  const sources = HARDWARE_SOURCES.map(source => ({ ...source, options: { ...source.options, ...options, timeout: options.timeout ?? providerTimeout(source.options.provider) } }));
  const { payload, partial, unavailable } = await collectSources(sources, { runner: options.execFile ? (script, opts) => powershellJson(script, { ...opts, execFile: options.execFile }) : powershellJson });
  return { ...normalizeHardware(payload), partial, unavailable };
}

const BATTERY_SCRIPT = [
  "$win32=@(Get-CimInstance Win32_Battery -ErrorAction SilentlyContinue | Select-Object Name,EstimatedChargeRemaining,BatteryStatus,DesignCapacity,FullChargeCapacity,EstimatedRunTime,DeviceID,Status)",
  "$status=@(Get-CimInstance -Namespace root/WMI -ClassName BatteryStatus -ErrorAction SilentlyContinue | Select-Object InstanceName,PowerOnline,Discharging,Charging,RemainingCapacity,Voltage,Rate)",
  "[pscustomobject]@{batteries=$win32;status=$status} | ConvertTo-Json -Depth 5"
].join('; ');

function normalizeBattery(raw) {
  const payload = raw && typeof raw === 'object' ? raw : {};
  return asArray(payload.batteries).map((entry, index) => {
    const statusEntry = asArray(payload.status)[index] || asArray(payload.status)[0] || {};
    return {
      name: text(entry.Name),
      deviceId: text(entry.DeviceID),
      chargePercent: numberOrNull(entry.EstimatedChargeRemaining),
      batteryStatus: numberOrNull(entry.BatteryStatus),
      designCapacityMilliWatts: numberOrNull(entry.DesignCapacity),
      fullChargeCapacityMilliWatts: numberOrNull(entry.FullChargeCapacity),
      estimatedRunTimeMinutes: numberOrNull(entry.EstimatedRunTime),
      // BatteryStatus (root/WMI) is the documented charging/discharging source.
      powerOnline: boolOrNull(statusEntry.PowerOnline),
      discharging: boolOrNull(statusEntry.Discharging),
      charging: boolOrNull(statusEntry.Charging),
      remainingCapacityMilliWatts: numberOrNull(statusEntry.RemainingCapacity),
      voltageMillivolts: numberOrNull(statusEntry.Voltage),
      dischargeRateMilliWatts: numberOrNull(statusEntry.Rate),
      // Cycle count and cell temperature are not exposed by these providers.
      cycleCount: null,
      cycleCountAvailable: false,
      temperatureCelsius: null,
      temperatureAvailable: false,
      provider: 'Win32_Battery + BatteryStatus'
    };
  });
}

async function collectBatteries(options = {}) { return normalizeBattery(await powershellJson(BATTERY_SCRIPT, { ...options, provider: 'Win32_Battery', timeout: options.timeout ?? providerTimeout('Win32_Battery') })); }

// ---------------------------------------------------------------------------
// System health  (Wave 1 / system P0)
// ---------------------------------------------------------------------------

const SYSTEM_SCRIPT = [
  "$os=Get-CimInstance Win32_OperatingSystem",
  "$cpu=@(Get-CimInstance Win32_Processor | Select-Object LoadPercentage,Name,NumberOfCores,NumberOfLogicalProcessors)",
  // Win32_Processor.LoadPercentage is frequently unavailable or saturated; the
  // documented performance counter is preferred and both values are reported.
  "$perf=$null; try { $perf=Get-CimInstance Win32_PerfFormattedData_PerfOS_Processor -Filter \"Name='_Total'\" -ErrorAction Stop | Select-Object PercentProcessorTime } catch { $perf=$null }",
  "$disk=@(Get-CimInstance Win32_LogicalDisk -Filter 'DriveType=3' | Select-Object DeviceID,VolumeName,FileSystem,Size,FreeSpace)",
  "$battery=@(Get-CimInstance Win32_Battery -ErrorAction SilentlyContinue | Select-Object EstimatedChargeRemaining,BatteryStatus)",
  "$startup=(Get-CimInstance Win32_OperatingSystem).LastBootUpTime",
  "[pscustomobject]@{os=$os;cpu=$cpu;perf=$perf;disks=$disk;battery=$battery;lastBootUpTime=$startup} | ConvertTo-Json -Depth 5"
].join('; ');

function normalizeSystemHealth(raw) {
  const payload = raw && typeof raw === 'object' ? raw : {};
  const os_ = payload.os || {};
  const cpu = asArray(payload.cpu)[0] || {};
  const perf = asArray(payload.perf)[0] || null;
  const counterLoad = perf ? numberOrNull(perf.PercentProcessorTime) : null;
  const win32Load = numberOrNull(cpu.LoadPercentage);
  const memoryTotalBytes = numberOrNull(os_.TotalVisibleMemorySize) != null ? numberOrNull(os_.TotalVisibleMemorySize) * 1024 : null;
  const memoryFreeBytes = numberOrNull(os_.FreePhysicalMemory) != null ? numberOrNull(os_.FreePhysicalMemory) * 1024 : null;
  const disks = normalizeLogicalDisk(payload.disks);
  const systemDrive = disks.find(disk => String(disk.deviceId || '').toUpperCase() === 'C:') || disks[0] || null;
  const battery = asArray(payload.battery)[0] || null;
  return {
    platform: process.platform,
    hostname: os.hostname(),
    osCaption: text(os_.Caption),
    osVersion: text(os_.Version),
    osBuild: text(os_.BuildNumber),
    osArchitecture: text(os_.OSArchitecture),
    lastBootUpTime: dateOrNull(payload.lastBootUpTime),
    uptimeSeconds: uptimeSecondsFrom(payload.lastBootUpTime) ?? Math.round(os.uptime()),
    uptimeSource: dateOrNull(payload.lastBootUpTime) ? 'Win32_OperatingSystem.LastBootUpTime' : 'Node os.uptime() fallback',
    cpuModel: text(cpu.Name),
    cpuCores: numberOrNull(cpu.NumberOfCores),
    cpuLogicalProcessors: numberOrNull(cpu.NumberOfLogicalProcessors),
    cpuLoadPercent: counterLoad ?? win32Load,
    cpuLoadAvailable: (counterLoad ?? win32Load) != null,
    cpuLoadSource: counterLoad != null ? 'Win32_PerfFormattedData_PerfOS_Processor (_Total)' : (win32Load != null ? 'Win32_Processor.LoadPercentage' : 'unavailable'),
    cpuLoadWin32Percent: win32Load,
    cpuLoadWin32Available: win32Load != null,
    memoryTotalBytes: memoryTotalBytes ?? os.totalmem(),
    memoryFreeBytes: memoryFreeBytes ?? os.freemem(),
    memoryUsedPercent: memoryTotalBytes ? Math.round((1 - memoryFreeBytes / memoryTotalBytes) * 100) : null,
    systemDrive: systemDrive?.deviceId ?? null,
    systemDriveFreeBytes: systemDrive?.freeBytes ?? null,
    systemDriveTotalBytes: systemDrive?.sizeBytes ?? null,
    volumes: disks,
    batteryChargePercent: battery ? numberOrNull(battery.EstimatedChargeRemaining) : null,
    batteryAvailable: Boolean(battery),
    provider: 'Win32_OperatingSystem + Win32_Processor + Win32_LogicalDisk'
  };
}

async function collectSystemHealth(options = {}) { return normalizeSystemHealth(await powershellJson(SYSTEM_SCRIPT, { ...options, provider: 'Win32_OperatingSystem', timeout: options.timeout ?? providerTimeout('Win32_OperatingSystem') })); }

module.exports = {
  UNINSTALL_ROOTS,
  asArray,
  text,
  numberOrNull,
  boolOrNull,
  dateOrNull,
  enumName,
  ENUMS,
  uptimeSecondsFrom,
  powershellJson,
  collectSources,
  ProviderUnavailableError,
  PROVIDER_TIMEOUTS,
  providerTimeout,
  normalizeLogicalDisk,
  normalizePhysicalDisk,
  normalizeService,
  normalizeProcess,
  normalizeSignature,
  normalizeEvent,
  normalizeStartup,
  classifyStartupSource,
  normalizeUninstallApp,
  normalizeAppxApp,
  normalizeInstallDate,
  guessArchitecture,
  normalizeNetwork,
  normalizeHardware,
  normalizeBattery,
  normalizeSystemHealth,
  collectLogicalDisks,
  collectPhysicalDisks,
  collectServices,
  collectProcesses,
  collectProcessSignatures,
  collectEvents,
  collectStartupItems,
  collectUninstallApps,
  collectAppxApps,
  collectNetwork,
  collectHardware,
  collectBatteries,
  collectSystemHealth
};
