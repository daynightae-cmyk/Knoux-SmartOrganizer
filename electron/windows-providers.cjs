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

async function powershellJson(script, { timeout = POWERSHELL_TIMEOUT, maxBuffer = 32 * 1024 * 1024, execFile: runner = execFileAsync } = {}) {
  const { stdout } = await runner('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', script], { windowsHide: true, timeout, maxBuffer });
  const trimmed = String(stdout).trim();
  if (!trimmed) return null;
  try { return JSON.parse(trimmed); } catch { return null; }
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

async function collectLogicalDisks(options = {}) { return normalizeLogicalDisk(await powershellJson(LOGICAL_DISK_SCRIPT, options)); }
async function collectPhysicalDisks(options = {}) { return normalizePhysicalDisk(await powershellJson(PHYSICAL_DISK_SCRIPT, options)); }

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

async function collectServices(options = {}) { return normalizeService(await powershellJson(SERVICE_SCRIPT, options)); }

// ---------------------------------------------------------------------------
// Processes  (Wave 7)
// ---------------------------------------------------------------------------

const PROCESS_SCRIPT = "Get-CimInstance Win32_Process | Select-Object ProcessId,ParentProcessId,Name,ExecutablePath,CreationDate,WorkingSetSize,KernelModeTime,UserModeTime | ConvertTo-Json -Depth 4";
const PROCESS_SIGNATURE_SCRIPT = process => `$s=Get-AuthenticodeSignature -LiteralPath ${JSON.stringify(String(process).replace(/'/g, "''"))} -ErrorAction SilentlyContinue; if($s){[pscustomobject]@{path=${JSON.stringify(String(process))};status=[string]$s.Status;statusMessage=[string]$s.StatusMessage;signer=if($s.SignerCertificate){$s.SignerCertificate.Subject}else{$null}} | ConvertTo-Json -Compress}else{'null'}`;

function normalizeProcess(raw) {
  return asArray(raw).map(entry => ({
    processId: numberOrNull(entry.ProcessId),
    parentProcessId: numberOrNull(entry.ParentProcessId),
    name: text(entry.Name),
    executablePath: text(entry.ExecutablePath),
    startedAt: text(entry.CreationDate),
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

async function collectProcesses(options = {}) { return normalizeProcess(await powershellJson(PROCESS_SCRIPT, options)); }

/** Bounded Authenticode verification for the heaviest processes only. */
async function collectProcessSignatures(paths, { limit = 40, execFile: runner = execFileAsync } = {}) {
  const candidates = Array.isArray(paths) ? paths.filter(Boolean).slice(0, limit) : [];
  const out = [];
  for (const candidate of candidates) {
    try {
      const { stdout } = await runner('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', PROCESS_SIGNATURE_SCRIPT(candidate)], { windowsHide: true, timeout: 20000, maxBuffer: 1024 * 1024 });
      const parsed = JSON.parse(String(stdout).trim() || 'null');
      out.push(normalizeSignature(parsed ? { ...parsed, path: parsed.path || candidate } : { path: candidate }));
    } catch {
      out.push({ path: candidate, signatureStatus: null, signatureAvailable: false, signatureSubject: null, signatureMessage: 'not-checked' });
    }
  }
  return out;
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
    timeCreated: text(entry.TimeCreated),
    activityId: text(entry.ActivityId),
    message: text(entry.Message) ? String(entry.Message).replace(/\s+/g, ' ').slice(0, 300) : null
  }));
}

async function collectEvents(options = {}) { return normalizeEvent(await powershellJson(EVENT_SCRIPT, options)); }

// ---------------------------------------------------------------------------
// Startup read coverage  (Wave 10)
// ---------------------------------------------------------------------------

const STARTUP_SCRIPT = "Get-CimInstance Win32_StartupCommand -ErrorAction SilentlyContinue | Select-Object Name,Command,Location,User | ConvertTo-Json -Depth 4";

const STARTUP_SOURCE_MAP = Object.freeze([
  // Specific hives are matched before the generic Run key so the writable scope stays exact.
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

async function collectStartupItems(options = {}) { return normalizeStartup(await powershellJson(STARTUP_SCRIPT, options)); }

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
      architecture: text(entry.Architecture) || guessArchitecture(entry.SignatureKind),
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

async function collectUninstallApps(options = {}) { return powershellJson(uninstallScript(), options); }
async function collectAppxApps(options = {}) { return normalizeAppxApp(await powershellJson(APPX_SCRIPT, options)); }

// ---------------------------------------------------------------------------
// Network  (Wave 5)
// ---------------------------------------------------------------------------

const NETWORK_SCRIPT = [
  "$adapters = @(Get-NetAdapter -ErrorAction SilentlyContinue | Select-Object Name,InterfaceDescription,Status,MacAddress,LinkSpeed,MediaType,InterfaceIndex,ifAlias)",
  "$addresses = @(Get-NetIPAddress -ErrorAction SilentlyContinue | Select-Object InterfaceAlias,InterfaceIndex,IPAddress,PrefixLength,AddressFamily,PrefixOrigin,SuffixOrigin,AddressState,Type)",
  "$dns = @(Get-DnsClientServerAddress -ErrorAction SilentlyContinue | Select-Object InterfaceAlias,InterfaceIndex,ServerAddresses)",
  "$dhcp = @(Get-NetIPInterface -ErrorAction SilentlyContinue | Select-Object InterfaceAlias,InterfaceIndex,Dhcp,ConnectionState,InterfaceDescription,NlMtu,AutomaticMetric)",
  "$routes = @(Get-NetRoute -ErrorAction SilentlyContinue | Select-Object InterfaceAlias,InterfaceIndex,DestinationPrefix,NextHop,RouteMetric,PolicyStore | Where-Object { $_.DestinationPrefix -eq '0.0.0.0/0' })",
  "[pscustomobject]@{adapters=$adapters;addresses=$addresses;dns=$dns;interfaces=$dhcp;defaultRoutes=$routes} | ConvertTo-Json -Depth 6"
].join('; ');

function familyName(value) {
  const raw = String(value ?? '');
  if (/IPv6/i.test(raw) || raw === '2') return 'IPv6';
  if (/IPv4/i.test(raw) || raw === '0' || raw === '1') return 'IPv4';
  return text(raw);
}

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
    return {
      name: alias,
      description: text(adapter.InterfaceDescription),
      status: text(adapter.Status),
      mac: text(adapter.MacAddress),
      mediaType: text(adapter.MediaType),
      linkSpeed: text(adapter.LinkSpeed),
      interfaceIndex: index,
      interfaceType: ownedInterface ? text(ownedInterface.InterfaceDescription) : null,
      connectionState: ownedInterface ? text(ownedInterface.ConnectionState) : null,
      dhcp: ownedInterface ? text(ownedInterface.Dhcp) : null,
      mtu: ownedInterface ? numberOrNull(ownedInterface.NlMtu) : null,
      automaticMetric: ownedInterface ? boolOrNull(ownedInterface.AutomaticMetric) : null,
      ipv4: ownedAddresses.filter(entry => familyName(entry.AddressFamily) === 'IPv4' && text(entry.AddressState) === 'Preferred').map(entry => ({ address: text(entry.IPAddress), prefixLength: numberOrNull(entry.PrefixLength), prefixOrigin: text(entry.PrefixOrigin), suffixOrigin: text(entry.SuffixOrigin), state: text(entry.AddressState) })),
      ipv6: ownedAddresses.filter(entry => familyName(entry.AddressFamily) === 'IPv6' && text(entry.AddressState) === 'Preferred').map(entry => ({ address: text(entry.IPAddress), prefixLength: numberOrNull(entry.PrefixLength), prefixOrigin: text(entry.PrefixOrigin), state: text(entry.AddressState) })),
      dnsServers: ownedDns.flatMap(entry => asArray(entry.ServerAddresses).map(text)).filter(Boolean),
      defaultGateway: ownedRoutes.map(entry => text(entry.NextHop)).filter(Boolean)[0] || null,
      defaultRoutes: ownedRoutes.map(entry => ({ destination: text(entry.DestinationPrefix), nextHop: text(entry.NextHop), metric: numberOrNull(entry.RouteMetric) })),
      provider: 'Get-NetAdapter'
    };
  }) : [];

  return { items, addresses, dnsServers, interfaces, routes };
}

async function collectNetwork(options = {}) { return normalizeNetwork(await powershellJson(NETWORK_SCRIPT, options)); }

// ---------------------------------------------------------------------------
// Hardware / devices  (Wave 6)
// ---------------------------------------------------------------------------

const HARDWARE_SCRIPT = [
  "$cpu=@(Get-CimInstance Win32_Processor | Select-Object Name,NumberOfCores,NumberOfLogicalProcessors,MaxClockSpeed,Architecture)",
  "$gpu=@(Get-CimInstance Win32_VideoController | Select-Object Name,AdapterRAM,DriverVersion,DriverDate,VideoModeDescription,Status)",
  "$bios=@(Get-CimInstance Win32_BIOS | Select-Object Manufacturer,SMBIOSBIOSVersion,ReleaseDate,SerialNumber)",
  "$memory=@(Get-CimInstance Win32_PhysicalMemory | Select-Object Manufacturer,PartNumber,Capacity,Speed,ConfiguredClockSpeed,DeviceLocator)",
  "$disks=@(Get-PhysicalDisk -ErrorAction SilentlyContinue | Select-Object DeviceId,FriendlyName,MediaType,BusType,Size,HealthStatus)",
  "$monitors=@(Get-CimInstance Win32_DesktopMonitor -ErrorAction SilentlyContinue | Select-Object Name,DeviceID,ScreenWidth,ScreenHeight,Status,PNPDeviceID)",
  "$audio=@(Get-CimInstance Win32_SoundDevice -ErrorAction SilentlyContinue | Select-Object Name,Manufacturer,Status,PNPDeviceID)",
  "$usb=@(Get-CimInstance Win32_USBController -ErrorAction SilentlyContinue | Select-Object Name,Manufacturer,Status,PNPDeviceID)",
  "$pnp=@(Get-CimInstance Win32_PnPEntity -Filter \"ConfigManagerErrorCode<>0\" -ErrorAction SilentlyContinue | Select-Object Name,PNPDeviceID,ConfigManagerErrorCode,Manufacturer)",
  "[pscustomobject]@{cpu=$cpu;gpu=$gpu;bios=$bios;memory=$memory;disks=$disks;monitors=$monitors;audio=$audio;usb=$usb;pnpProblems=$pnp} | ConvertTo-Json -Depth 6"
].join('; ');

function normalizeHardware(raw) {
  const payload = raw && typeof raw === 'object' ? raw : {};
  return {
    cpu: asArray(payload.cpu).map(entry => ({
      name: text(entry.Name), cores: numberOrNull(entry.NumberOfCores), logicalProcessors: numberOrNull(entry.NumberOfLogicalProcessors),
      maxClockMHz: numberOrNull(entry.MaxClockSpeed), architecture: text(entry.Architecture), provider: 'Win32_Processor'
    })),
    gpu: asArray(payload.gpu).map(entry => ({
      name: text(entry.Name), adapterRamBytes: numberOrNull(entry.AdapterRAM), driverVersion: text(entry.DriverVersion),
      driverDate: text(entry.DriverDate), videoMode: text(entry.VideoModeDescription), status: text(entry.Status), provider: 'Win32_VideoController'
    })),
    bios: asArray(payload.bios).map(entry => ({
      manufacturer: text(entry.Manufacturer), version: text(entry.SMBIOSBIOSVersion), releaseDate: text(entry.ReleaseDate),
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

async function collectHardware(options = {}) { return normalizeHardware(await powershellJson(HARDWARE_SCRIPT, options)); }

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

async function collectBatteries(options = {}) { return normalizeBattery(await powershellJson(BATTERY_SCRIPT, options)); }

// ---------------------------------------------------------------------------
// System health  (Wave 1 / system P0)
// ---------------------------------------------------------------------------

const SYSTEM_SCRIPT = [
  "$os=Get-CimInstance Win32_OperatingSystem",
  "$cpu=@(Get-CimInstance Win32_Processor | Select-Object LoadPercentage,Name,NumberOfCores,NumberOfLogicalProcessors)",
  "$disk=@(Get-CimInstance Win32_LogicalDisk -Filter 'DriveType=3' | Select-Object DeviceID,VolumeName,FileSystem,Size,FreeSpace)",
  "$battery=@(Get-CimInstance Win32_Battery -ErrorAction SilentlyContinue | Select-Object EstimatedChargeRemaining,BatteryStatus)",
  "$startup=(Get-CimInstance Win32_OperatingSystem).LastBootUpTime",
  "[pscustomobject]@{os=$os;cpu=$cpu;disks=$disk;battery=$battery;lastBootUpTime=$startup} | ConvertTo-Json -Depth 5"
].join('; ');

function normalizeSystemHealth(raw) {
  const payload = raw && typeof raw === 'object' ? raw : {};
  const os_ = payload.os || {};
  const cpu = asArray(payload.cpu)[0] || {};
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
    lastBootUpTime: text(payload.lastBootUpTime),
    uptimeSeconds: numberOrNull(os_.LastBootUpTime) != null || text(payload.lastBootUpTime) ? Math.max(0, Math.round((Date.now() - new Date(payload.lastBootUpTime).getTime()) / 1000)) : Math.round(os.uptime()),
    cpuModel: text(cpu.Name),
    cpuCores: numberOrNull(cpu.NumberOfCores),
    cpuLogicalProcessors: numberOrNull(cpu.NumberOfLogicalProcessors),
    cpuLoadPercent: numberOrNull(cpu.LoadPercentage),
    cpuLoadAvailable: numberOrNull(cpu.LoadPercentage) != null,
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

async function collectSystemHealth(options = {}) { return normalizeSystemHealth(await powershellJson(SYSTEM_SCRIPT, options)); }

module.exports = {
  UNINSTALL_ROOTS,
  asArray,
  text,
  numberOrNull,
  boolOrNull,
  powershellJson,
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
  familyName,
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
