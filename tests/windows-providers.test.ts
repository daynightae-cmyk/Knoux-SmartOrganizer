import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
// The provider module is plain CommonJS; every exported entry is a pure normalizer
// that accepts an untyped Windows payload and returns a normalized record.
const providers = require('../electron/windows-providers.cjs') as Record<string, (...args: unknown[]) => unknown>;

interface ProviderUnavailable {
  code: string;
  provider: string;
  reason: string;
  timeoutMs: number | null;
}

interface ProviderErrorCtor {
  new (provider: string, reason: string, options?: { timeoutMs?: number | null }): ProviderUnavailable;
}

/** The CommonJS module also exports a constructible error class and constants. */
const providerModule = providers as unknown as {
  ProviderUnavailableError: ProviderErrorCtor;
  providerTimeout: (provider: string, fallback?: number) => number;
  powershellJson: (script: string, options?: Record<string, unknown>) => Promise<unknown>;
  collectSources: (sources: Array<{ key: string; options: { provider: string } }>, options?: { runner?: (script: string, options: { provider: string }) => Promise<unknown> }) => Promise<{ payload: Record<string, unknown>; partial: boolean; unavailable: ProviderUnavailable[] }>;
  collectHardware: (options?: { execFile?: (file: string, args: string[], options: unknown) => Promise<{ stdout: string }> }) => Promise<{ cpu: Array<{ name: string; cores: number | null }>; bios: Array<{ manufacturer: string }>; memoryModules: unknown[]; partial: boolean }>;
  collectSystemHealth: (options?: { execFile?: (file: string, args: string[], options: unknown) => Promise<{ stdout: string }> }) => Promise<{ osCaption: string; osVersion: string; osBuild: string }>;
  UNINSTALL_ROOTS: string[];
  ENUMS: Record<string, Record<string, string>>;
};

describe('windows provider normalizers', () => {
  it('normalizes a logical disk and computes used bytes', () => {
    const [disk] = providers.normalizeLogicalDisk([{ DeviceID: 'C:', VolumeName: 'System', FileSystem: 'NTFS', Size: 1000, FreeSpace: 250, VolumeSerialNumber: '1234' }]) as Array<Record<string, unknown>>;
    expect(disk.deviceId).toBe('C:');
    expect(disk.sizeBytes).toBe(1000);
    expect(disk.freeBytes).toBe(250);
    expect(disk.usedBytes).toBe(750);
    expect(disk.provider).toBe('Win32_LogicalDisk');
  });

  it('never invents a physical-disk temperature', () => {
    const [disk] = providers.normalizePhysicalDisk([{ DeviceId: '0', FriendlyName: 'SSD', Size: 500, HealthStatus: 'Healthy' }]) as Array<Record<string, unknown>>;
    expect(disk.temperatureCelsius).toBeNull();
    expect(disk.temperatureAvailable).toBe(false);
    expect(disk.healthStatus).toBe('Healthy');
  });

  it('reads DelayedAutoStart from Win32_Service instead of a per-service registry read', () => {
    const [service] = providers.normalizeService([{ Name: 'Dhcp', State: 'Running', StartMode: 'Auto', DelayedAutoStart: false, ProcessId: 1880, ServiceType: 'Share Process', StartName: 'NT AUTHORITY\\LocalService', PathName: 'C:\\Windows\\system32\\svchost.exe -k netsvcs' }]) as Array<Record<string, unknown>>;
    expect(service.delayedAuto).toBe(false);
    expect(service.startupType).toBe('automatic');
    expect(service.processId).toBe(1880);
    expect(service.running).toBe(true);
    expect(service.provider).toBe('Win32_Service');
  });

  it('marks an unknown startup mode as unknown instead of guessing', () => {
    const [service] = providers.normalizeService([{ Name: 'X', State: 'Stopped', StartMode: 'Bogus' }]) as Array<Record<string, unknown>>;
    expect(service.startupType).toBe('unknown');
  });

  it('normalizes a process with parent id, path and CPU seconds', () => {
    const [entry] = providers.normalizeProcess([{ ProcessId: 100, ParentProcessId: 4, Name: 'a.exe', ExecutablePath: 'C:\\a.exe', CreationDate: '2026-01-01T00:00:00Z', WorkingSetSize: 2048, KernelModeTime: 1e7, UserModeTime: 1e7 }]) as Array<Record<string, unknown>>;
    expect(entry.processId).toBe(100);
    expect(entry.parentProcessId).toBe(4);
    expect(entry.cpuSeconds).toBe(2);
    expect(entry.signatureAvailable).toBe(false);
    expect(entry.ownerAvailable).toBe(false);
  });

  it('leaves owner and integrity unavailable rather than guessing them', () => {
    const [entry] = providers.normalizeProcess([{ ProcessId: 1, Name: 'x.exe' }]) as Array<Record<string, unknown>>;
    expect(entry.owner).toBeNull();
    expect(entry.integrityLevel).toBeNull();
    expect(entry.integrityLevelAvailable).toBe(false);
  });

  it('normalizes a signature result and tolerates an unchecked one', () => {
    expect(providers.normalizeSignature({ path: 'C:\\a.exe', status: 'Valid', signer: 'CN=X' })).toEqual({ path: 'C:\\a.exe', signatureStatus: 'Valid', signatureAvailable: true, signatureSubject: 'CN=X', signatureMessage: null });
    expect((providers.normalizeSignature({ path: 'C:\\a.exe' }) as { signatureAvailable: boolean }).signatureAvailable).toBe(false);
  });

  it('normalizes an event with provider, id, level and timestamp', () => {
    const [event] = providers.normalizeEvent([{ ProviderName: 'Disk', Id: 7, Level: 2, LevelDisplayName: 'Error', TimeCreated: '2026-01-01T00:00:00Z', Message: 'bad\n  lines' }]) as Array<Record<string, unknown>>;
    expect(event.provider).toBe('Disk');
    expect(event.eventId).toBe(7);
    expect(event.level).toBe(2);
    expect(String(event.message)).toBe('bad lines');
  });

  it('classifies startup sources and only marks the current-user Run key as managed', () => {
    const items = providers.normalizeStartup([
      { Name: 'A', Command: 'a.exe', Location: 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run', User: 'me' },
      { Name: 'B', Command: 'b.exe', Location: 'HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Run', User: 'SYSTEM' },
      { Name: 'C', Command: 'c.lnk', Location: 'C:\\Users\\me\\AppData\\Roaming\\Microsoft\\Windows\\Start Menu\\Programs\\Startup', User: 'me' },
      { Name: 'D', Command: 'd.exe', Location: 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\RunOnce', User: 'me' }
    ]) as Array<Record<string, unknown>>;
    expect(items[0].source).toBe('registry-run-user');
    expect(items[0].managedBySmartOrganizer).toBe(true);
    expect(items[1].source).toBe('registry-run-machine');
    expect(items[1].managedBySmartOrganizer).toBe(false);
    expect(items[2].source).toBe('startup-folder-user');
    expect(items[3].source).toBe('registry-run-once');
    expect(items.every(item => item.writable === false || item.managedBySmartOrganizer)).toBe(true);
  });

  it('only trusts an InstallDate that is a real parseable date', () => {
    expect(providers.normalizeInstallDate('20240115')).toBe('2024-01-15');
    expect(providers.normalizeInstallDate('20240115xxxx')).toBe('2024-01-15');
    expect(providers.normalizeInstallDate('not-a-date')).toBeNull();
    expect(providers.normalizeInstallDate('')).toBeNull();
    expect(providers.normalizeInstallDate(undefined)).toBeNull();
  });

  it('guesses architecture only from explicit evidence', () => {
    expect(providers.guessArchitecture('C:\\Program Files\\App (x86)\\a.exe')).toBe('x86');
    expect(providers.guessArchitecture('C:\\Program Files\\App', 'amd64')).toBe('x64');
    expect(providers.guessArchitecture('C:\\Program Files\\App')).toBeNull();
  });

  it('normalizes uninstall registry entries with scope, view and capability', () => {
    const [app] = providers.normalizeUninstallApp([{ name: 'App', version: '1.0', publisher: 'Pub', installLocation: 'C:\\Program Files\\App', uninstallString: 'MsiExec', installDate: '20240115', estimatedSize: '2048', source: 'HKLM:\\Software\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall' }]) as Array<Record<string, unknown>>;
    expect(app.scope).toBe('machine');
    expect(app.registryView).toBe('32-bit');
    expect(app.installDate).toBe('2024-01-15');
    expect(app.uninstallCapability).toBe('uninstall-string');
    expect(app.repairCapability).toBeNull();
    expect(app.estimatedSizeBytes).toBe(2097152);
    expect(app.source).toBe('uninstall-registry');
    expect(app.packageIdentity).toBeNull();
  });

  it('normalizes an AppX package with package identity and MSIX capabilities', () => {
    const [app] = providers.normalizeAppxApp([{ Name: 'StoreApp', PackageFullName: 'StoreApp_1.0_x64__8we', Version: '1.0', Publisher: 'CN=MS', InstallLocation: 'C:\\Program Files\\WindowsApps\\a', Architecture: 'x64', SignatureKind: 'Store' }]) as Array<Record<string, unknown>>;
    expect(app.packageIdentity).toBe('StoreApp_1.0_x64__8we');
    expect(app.uninstallCapability).toBe('appx-package');
    expect(app.repairCapability).toBe('appx-package');
    expect(app.updateCapability).toBe('appx-package');
    expect(app.source).toBe('appx-msix');
    expect(app.estimatedSizeBytes).toBeNull();
  });

  it('builds a structured adapter record with IPv4, IPv6, DNS, gateway and routes', () => {
    const network = providers.normalizeNetwork({
      adapters: [{ Name: 'Ethernet', InterfaceDescription: 'Intel', Status: 'Up', MacAddress: 'AA:BB', MediaType: '802.3', LinkSpeed: '1 Gbps', InterfaceIndex: 12 }],
      addresses: [{ InterfaceAlias: 'Ethernet', InterfaceIndex: 12, IPAddress: '192.168.1.5', PrefixLength: 24, AddressFamily: 'IPv4', AddressState: 'Preferred', PrefixOrigin: 'Dhcp' }],
      dnsServers: [{ InterfaceAlias: 'Ethernet', InterfaceIndex: 12, ServerAddresses: ['1.1.1.1'] }],
      interfaces: [{ InterfaceAlias: 'Ethernet', InterfaceIndex: 12, Dhcp: 'Enabled', ConnectionState: 'Connected', NlMtu: 1500, AutomaticMetric: true }],
      defaultRoutes: [{ InterfaceAlias: 'Ethernet', InterfaceIndex: 12, DestinationPrefix: '0.0.0.0/0', NextHop: '192.168.1.1', RouteMetric: 25 }]
    }) as { items: Array<Record<string, unknown>> };
    const adapter = network.items[0] as Record<string, unknown> & { ipv4: Array<Record<string, unknown>>; ipv6: Array<Record<string, unknown>>; dnsServers: string[]; defaultRoutes: Array<Record<string, unknown>>; dhcp: unknown; connectionState: unknown; defaultGateway: unknown; linkSpeed: unknown };
    expect(adapter.status).toBe('Up');
    expect(adapter.ipv4).toHaveLength(1);
    expect(adapter.ipv4[0]).toEqual(expect.objectContaining({ address: '192.168.1.5', state: 'Preferred' }));
    expect(adapter.dnsServers).toEqual(['1.1.1.1']);
    expect(adapter.dhcp).toBe('Enabled');
    expect(adapter.connectionState).toBe('Connected');
    expect(adapter.defaultGateway).toBe('192.168.1.1');
    expect(adapter.linkSpeed).toBe('1 Gbps');
    expect(adapter.defaultRoutes).toHaveLength(1);
  });

  it('normalizes hardware and reports temperatures as unavailable with a reason', () => {
    const hardware = providers.normalizeHardware({
      cpu: [{ Name: 'CPU', NumberOfCores: 4, NumberOfLogicalProcessors: 4, MaxClockSpeed: 3200 }],
      gpu: [{ Name: 'GPU', AdapterRAM: 1024, DriverVersion: '1.0' }],
      bios: [{ Manufacturer: 'Vendor', SMBIOSBIOSVersion: '1.0' }],
      memory: [{ Manufacturer: 'M', Capacity: 8589934592, Speed: 1333 }],
      disks: [{ DeviceId: '0', FriendlyName: 'SSD', Size: 100, HealthStatus: 'Healthy' }],
      monitors: [{ Name: 'Monitor', ScreenWidth: 1920, ScreenHeight: 1080, Status: 'OK' }],
      audio: [{ Name: 'Audio', Status: 'OK' }],
      usb: [{ Name: 'USB', Status: 'OK' }],
      pnpProblems: [{ Name: 'Broken', ConfigManagerErrorCode: 22, PNPDeviceID: 'X' }]
    }) as Record<string, unknown> & {
      cpu: Array<Record<string, unknown>>;
      gpu: Array<Record<string, unknown>>;
      memoryModules: Array<Record<string, unknown>>;
      problemDevices: Array<Record<string, unknown>>;
      temperatures: { available: boolean; reason: string };
    };
    expect(hardware.cpu).toHaveLength(1);
    expect(hardware.gpu).toHaveLength(1);
    expect(hardware.memoryModules[0]).toEqual(expect.objectContaining({ capacityBytes: 8589934592 }));
    expect(hardware.problemDevices[0]).toEqual(expect.objectContaining({ problemCode: 22 }));
    expect(hardware.temperatures.available).toBe(false);
    expect(hardware.temperatures.reason).toMatch(/No documented Windows provider/i);
  });

  it('normalizes battery truth and leaves cycle count and temperature unavailable', () => {
    const [battery] = providers.normalizeBattery({
      batteries: [{ Name: 'B', EstimatedChargeRemaining: 80, BatteryStatus: 2, DesignCapacity: 100, FullChargeCapacity: 90 }],
      status: [{ PowerOnline: true, Discharging: false, Charging: false, RemainingCapacity: 88 }]
    }) as Array<Record<string, unknown>>;
    expect(battery.chargePercent).toBe(80);
    expect(battery.powerOnline).toBe(true);
    expect(battery.cycleCount).toBeNull();
    expect(battery.cycleCountAvailable).toBe(false);
    expect(battery.temperatureAvailable).toBe(false);
  });

  it('returns an empty battery list when Windows reports no device', () => {
    expect(providers.normalizeBattery({ batteries: [], status: [] })).toEqual([]);
  });

  it('normalizes system health and reports CPU load availability explicitly', () => {
    const health = providers.normalizeSystemHealth({
      os: { Caption: 'Windows', Version: '10', BuildNumber: '19045', OSArchitecture: '64-bit', TotalVisibleMemorySize: 8388608, FreePhysicalMemory: 2097152, LastBootUpTime: new Date(Date.now() - 60000).toISOString() },
      cpu: [{ LoadPercentage: 12, Name: 'CPU', NumberOfCores: 4, NumberOfLogicalProcessors: 8 }],
      disks: [{ DeviceID: 'C:', Size: 1000, FreeSpace: 400 }],
      battery: [{ EstimatedChargeRemaining: 55 }],
      lastBootUpTime: new Date(Date.now() - 60000).toISOString()
    }) as Record<string, unknown>;
    expect(health.cpuLoadPercent).toBe(12);
    expect(health.cpuLoadAvailable).toBe(true);
    // Win32_OperatingSystem reports memory in KiB; the normalizer converts to bytes.
    expect(health.memoryTotalBytes).toBe(8388608 * 1024);
    expect(health.memoryFreeBytes).toBe(2097152 * 1024);
    expect(health.memoryUsedPercent).toBe(75);
    expect(health.systemDrive).toBe('C:');
    expect(health.batteryChargePercent).toBe(55);
    expect(health.volumes).toHaveLength(1);
  });

  it('reports CPU load as unavailable when Windows does not answer', () => {
    const health = providers.normalizeSystemHealth({ os: { TotalVisibleMemorySize: 100, FreePhysicalMemory: 50 }, cpu: [{}], disks: [] }) as Record<string, unknown>;
    expect(health.cpuLoadPercent).toBeNull();
    expect(health.cpuLoadAvailable).toBe(false);
  });

  it('decodes the PowerShell \\/Date(...)\\/ serialisation instead of losing the value', () => {
    const bootMs = Date.now() - 3_600_000;
    // PowerShell emits "\/Date(1690000000000)\/"; after JSON.parse the escapes are
    // resolved, so the provider receives "/Date(1690000000000)/".
    const health = providers.normalizeSystemHealth({
      os: { TotalVisibleMemorySize: 1024, FreePhysicalMemory: 512 },
      cpu: [{}],
      disks: [],
      battery: [],
      lastBootUpTime: `/Date(${bootMs})/`
    }) as Record<string, unknown> & { uptimeSource: string };
    expect(health.lastBootUpTime).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(health.uptimeSeconds).toBeGreaterThan(3500);
    expect(health.uptimeSource).toBe('Win32_OperatingSystem.LastBootUpTime');
  });

  it('falls back to the Node uptime source and says so when Windows omits the boot time', () => {
    const health = providers.normalizeSystemHealth({ os: { TotalVisibleMemorySize: 1024, FreePhysicalMemory: 512 }, cpu: [{}], disks: [], battery: [] }) as Record<string, unknown> & { uptimeSource: string; uptimeSeconds: number };
    expect(health.lastBootUpTime).toBeNull();
    expect(health.uptimeSource).toMatch(/fallback/i);
    expect(health.uptimeSeconds).toBeGreaterThan(0);
  });

  it('reports an unparseable date as unavailable rather than an invalid Date', () => {
    const health = providers.normalizeSystemHealth({ os: { TotalVisibleMemorySize: 1, FreePhysicalMemory: 1 }, cpu: [{}], disks: [], battery: [], lastBootUpTime: 'not-a-date' }) as Record<string, unknown>;
    expect(health.lastBootUpTime).toBeNull();
  });

  it('never throws on a service name that cannot be controlled', () => {
    // The read-side classification must survive names sc.exe could never address.
    expect(providers.normalizeService([{ Name: 'A name with spaces/and+chars', State: 'Stopped' }])).toHaveLength(1);
    expect(providers.normalizeService([{ Name: '', State: 'Stopped' }])).toHaveLength(1);
  });

  it('maps Windows enum integers to documented names instead of leaking 0 or 11', () => {
    const network = providers.normalizeNetwork({
      adapters: [{ Name: 'Wi-Fi', Status: 'Up', InterfaceIndex: 11, LinkSpeed: '433 Mbps' }],
      addresses: [{ InterfaceAlias: 'Wi-Fi', InterfaceIndex: 11, IPAddress: '192.168.0.5', PrefixLength: 24, AddressFamily: 2, AddressState: 1, PrefixOrigin: 'Dhcp' }],
      dnsServers: [{ InterfaceAlias: 'Wi-Fi', InterfaceIndex: 11, ServerAddresses: ['1.1.1.1'] }],
      interfaces: [{ InterfaceAlias: 'Wi-Fi', InterfaceIndex: 11, Dhcp: 1, ConnectionState: 1, NlMtu: 1500, AutomaticMetric: true }],
      defaultRoutes: [{ InterfaceAlias: 'Wi-Fi', InterfaceIndex: 11, DestinationPrefix: '0.0.0.0/0', NextHop: '192.168.0.1', RouteMetric: 281 }]
    }) as { items: Array<Record<string, unknown>> };
    const adapter = network.items[0] as Record<string, unknown> & { ipv4: Array<Record<string, unknown>> };
    expect(adapter.ipv4).toHaveLength(1);
    expect(adapter.ipv4[0]).toEqual(expect.objectContaining({ address: '192.168.0.5', state: 'Preferred' }));
    expect(adapter.dhcp).toBe('Enabled');
    expect(adapter.connectionState).toBe('Connected');
    expect(adapter.defaultGateway).toBe('192.168.0.1');
  });

  it('drops non-preferred addresses instead of counting them as active', () => {
    const network = providers.normalizeNetwork({
      adapters: [{ Name: 'Wi-Fi', Status: 'Up', InterfaceIndex: 11 }],
      addresses: [
        { InterfaceAlias: 'Wi-Fi', InterfaceIndex: 11, IPAddress: '10.0.0.2', AddressFamily: 2, AddressState: 0 },
        { InterfaceAlias: 'Wi-Fi', InterfaceIndex: 11, IPAddress: '10.0.0.3', AddressFamily: 2, AddressState: 1 }
      ],
      dnsServers: [], interfaces: [], defaultRoutes: []
    }) as { items: Array<Record<string, unknown>> };
    const adapter = network.items[0] as Record<string, unknown> & { ipv4: Array<Record<string, unknown>> };
    expect(adapter.ipv4).toHaveLength(1);
    expect(adapter.ipv4[0]).toEqual(expect.objectContaining({ address: '10.0.0.3' }));
  });

  it('maps AppX and processor architecture enums instead of showing the raw integer', () => {
    const [app] = providers.normalizeAppxApp([{ Name: 'A', PackageFullName: 'A_1_x64__8we', Architecture: 11 }]) as Array<Record<string, unknown>>;
    expect(app.architecture).toBe('x64');
    const hardware = providers.normalizeHardware({ cpu: [{ Name: 'CPU', Architecture: 9 }] }) as { cpu: Array<Record<string, unknown>> };
    expect(hardware.cpu[0].architecture).toBe('x64');
  });

  it('reports one canonical architecture spelling so string and enum sources cannot collide', () => {
    const apps = providers.normalizeAppxApp([
      { Name: 'FromString', PackageFullName: 'FromString_1_x64__a', Architecture: 'X64' },
      { Name: 'FromEnum', PackageFullName: 'FromEnum_1_x64__b', Architecture: 11 },
      { Name: 'FromName', PackageFullName: 'FromName_1_x86__c', Architecture: 'x86' },
      { Name: 'FromEnum86', PackageFullName: 'FromEnum86_1_x86__d', Architecture: 0 }
    ]) as Array<{ architecture: string }>;
    expect(apps.map(app => app.architecture)).toEqual(['x64', 'x64', 'x86', 'x86']);
    expect(new Set(apps.map(app => app.architecture)).size).toBe(2);
  });

  it('derives AppX architecture from the package identity when the field is absent', () => {
    // Get-AppxPackage reported no Architecture for Store-signed packages whose
    // identity still records it as the third underscore-delimited segment.
    const [devToys] = providers.normalizeAppxApp([{ Name: 'DevToys', PackageFullName: '64360VelerSoftware.DevToys_1.0.14.0_x64__j80j2txgjg9dj', SignatureKind: '3' }]) as Array<{ architecture: string }>;
    expect(devToys.architecture).toBe('x64');
    const [neutral] = providers.normalizeAppxApp([{ Name: 'Picker', PackageFullName: 'Microsoft.Windows.FilePicker_10.0.19041.4239_neutral_neutral_cw5n1h2txyewy' }]) as Array<{ architecture: string }>;
    expect(neutral.architecture).toBe('neutral');
  });

  it('names the IPv4 prefix and suffix origins instead of leaking enum integers', () => {
    const network = providers.normalizeNetwork({
      adapters: [{ Name: 'Ethernet', InterfaceIndex: 7, ConnectionState: 1, Dhcp: 1 }],
      addresses: [{ InterfaceAlias: 'Ethernet', InterfaceIndex: 7, IPAddress: '169.254.1.2', PrefixLength: 16, PrefixOrigin: 2, SuffixOrigin: 4, AddressState: 1, AddressFamily: 2 }]
    }) as { items: Array<{ ipv4: Array<{ prefixOrigin: string; suffixOrigin: string }> }> };
    expect(network.items[0].ipv4[0].prefixOrigin).toBe('Dhcp');
    expect(network.items[0].ipv4[0].suffixOrigin).toBe('WellKnown');
  });

  it('recognises the current-user Run key reported as HKU by Win32_StartupCommand', () => {
    const [item] = providers.normalizeStartup([{ Name: 'X', Command: 'x.exe', Location: 'HKU\\S-1-5-21-1-2-3-1001\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run' }]) as Array<Record<string, unknown>>;
    expect(item.source).toBe('registry-run-user');
    expect(item.managedBySmartOrganizer).toBe(true);
  });

  it('prefers the performance counter for CPU load and keeps the Win32 value separately', () => {
    const health = providers.normalizeSystemHealth({
      os: { TotalVisibleMemorySize: 1024, FreePhysicalMemory: 512 },
      cpu: [{ LoadPercentage: 100, Name: 'CPU' }],
      perf: [{ PercentProcessorTime: 7 }],
      disks: [], battery: []
    }) as Record<string, unknown> & { cpuLoadSource: string };
    expect(health.cpuLoadPercent).toBe(7);
    expect(health.cpuLoadSource).toMatch(/PerfFormattedData/);
    expect(health.cpuLoadWin32Percent).toBe(100);
  });

  it('falls back to the Win32 load value when the counter is unavailable', () => {
    const health = providers.normalizeSystemHealth({ os: { TotalVisibleMemorySize: 1, FreePhysicalMemory: 1 }, cpu: [{ LoadPercentage: 42 }], perf: null, disks: [], battery: [] }) as Record<string, unknown> & { cpuLoadSource: string };
    expect(health.cpuLoadPercent).toBe(42);
    expect(health.cpuLoadSource).toBe('Win32_Processor.LoadPercentage');
  });

  it('reports CPU load as unavailable when neither source answers', () => {
    const health = providers.normalizeSystemHealth({ os: { TotalVisibleMemorySize: 1, FreePhysicalMemory: 1 }, cpu: [{}], disks: [], battery: [] }) as Record<string, unknown>;
    expect(health.cpuLoadPercent).toBeNull();
    expect(health.cpuLoadAvailable).toBe(false);
    expect(health.cpuLoadSource).toBe('unavailable');
  });

  it('never uses Win32_Product or WinGet as installation truth', () => {
    const source = JSON.stringify(providers.UNINSTALL_ROOTS);
    expect(source).not.toMatch(/Win32_Product/i);
    expect(source).toMatch(/WOW6432Node/);
    expect(providers.UNINSTALL_ROOTS).toHaveLength(3);
  });
});

describe('provider failure isolation and budgets', () => {
  it('gives the measured slow providers a budget larger than their observed runtime', () => {
    // Get-NetIPAddress was measured at ~90s on the QA machine; a shared 60s
    // budget is what made network-diagnostics fail outright.
    expect(providerModule.providerTimeout('Get-NetIPAddress')).toBeGreaterThanOrEqual(150000);
    expect(providerModule.providerTimeout('Get-NetAdapter')).toBeGreaterThanOrEqual(120000);
    expect(providerModule.providerTimeout('uninstall-registry')).toBeGreaterThanOrEqual(120000);
    expect(providerModule.providerTimeout('Win32_StartupCommand')).toBeGreaterThanOrEqual(90000);
  });

  it('keeps cheap providers on a tight budget', () => {
    expect(providerModule.providerTimeout('Win32_LogicalDisk')).toBeLessThanOrEqual(30000);
    expect(providerModule.providerTimeout('Win32_OperatingSystem')).toBeLessThanOrEqual(45000);
    expect(providerModule.providerTimeout('Win32_Processor')).toBeLessThanOrEqual(45000);
  });

  it('falls back to the default budget for an unknown provider instead of guessing', () => {
    expect(providerModule.providerTimeout('Not-A-Real-Provider')).toBe(60000);
  });

  it('never forwards the PowerShell command line to the renderer on failure', async () => {
    const secretish = 'Get-ItemProperty -LiteralPath HKLM:\\Secret | ConvertTo-Json';
    const failing = async () => { const error = Object.assign(new Error(`Command failed: powershell.exe -Command ${secretish}`), { code: 'ENOENT' }); throw error; };
    await expect(providerModule.powershellJson(secretish, { provider: 'Win32_Service', execFile: failing })).rejects.toMatchObject({ code: 'PROVIDER_UNAVAILABLE', provider: 'Win32_Service', reason: 'powershell-not-found' });
    await expect(providerModule.powershellJson(secretish, { provider: 'Win32_Service', execFile: failing })).rejects.toThrow(/Win32_Service/);
    const message = await providerModule.powershellJson(secretish, { provider: 'Win32_Service', execFile: failing }).catch((error: Error) => error.message);
    expect(message).not.toMatch(/Get-ItemProperty/);
    expect(message).not.toMatch(/HKLM/);
  });

  it('classifies a killed provider as timed out rather than as a failed query', async () => {
    const timingOut = async () => { throw Object.assign(new Error('Command failed: powershell.exe -Command <script>'), { killed: true }); };
    await expect(providerModule.powershellJson('x', { provider: 'Get-NetRoute', timeout: 1000, execFile: timingOut })).rejects.toMatchObject({ reason: 'timed-out', timeoutMs: 1000 });
  });

  it('reports an unreadable provider response instead of silently returning nothing', async () => {
    const garbage = async () => ({ stdout: 'not json at all' });
    await expect(providerModule.powershellJson('x', { provider: 'Win32_BIOS', execFile: garbage })).rejects.toMatchObject({ reason: 'unreadable-response' });
  });

  it('keeps every source that answered when one independent source fails', async () => {
    const sources = [
      { key: 'adapters', options: { provider: 'Get-NetAdapter' } },
      { key: 'addresses', options: { provider: 'Get-NetIPAddress' } },
      { key: 'defaultRoutes', options: { provider: 'Get-NetRoute' } }
    ];
    const runner = async (_script: string, opts: { provider: string }) => {
      if (opts.provider === 'Get-NetIPAddress') throw new providerModule.ProviderUnavailableError('Get-NetIPAddress', 'timed-out', { timeoutMs: 150000 });
      if (opts.provider === 'Get-NetRoute') return [{ DestinationPrefix: '0.0.0.0/0', NextHop: '192.168.1.1' }];
      return [{ Name: 'Ethernet', InterfaceIndex: 12, Status: 'Up' }];
    };
    const collected = await providerModule.collectSources(sources, { runner });
    expect(collected.partial).toBe(true);
    expect(collected.payload.adapters).toHaveLength(1);
    expect(collected.payload.defaultRoutes).toHaveLength(1);
    expect(collected.unavailable).toEqual([{ code: 'PROVIDER_UNAVAILABLE', provider: 'Get-NetIPAddress', reason: 'timed-out', timeoutMs: 150000 }]);
  });

  it('is not partial when every source answered', async () => {
    const sources = [{ key: 'a', options: { provider: 'Win32_Processor' } }, { key: 'b', options: { provider: 'Win32_BIOS' } }];
    const collected = await providerModule.collectSources(sources, { runner: async () => ({ Name: 'x' }) });
    expect(collected.partial).toBe(false);
    expect(collected.unavailable).toEqual([]);
  });

  it('keeps a single-object result under its own source key instead of spreading it', async () => {
    // ConvertTo-Json emits a bare object, not an array, when a query returns one
    // row. Spreading it onto the payload silently dropped CPU/GPU/BIOS sources.
    const sources = [
      { key: 'cpu', options: { provider: 'Win32_Processor' } },
      { key: 'memory', options: { provider: 'Win32_PhysicalMemory' } }
    ];
    const runner = async (_script: string, opts: { provider: string }) => opts.provider === 'Win32_Processor'
      ? { Name: 'Intel(R) Core(TM) i5-4570 CPU @ 3.20GHz', NumberOfCores: 4 }
      : [{ Manufacturer: 'Hynix/Hyundai', Capacity: 8589934592 }];
    const collected = await providerModule.collectSources(sources, { runner });
    expect(collected.payload.cpu).toEqual({ Name: 'Intel(R) Core(TM) i5-4570 CPU @ 3.20GHz', NumberOfCores: 4 });
    expect(collected.payload.memory).toEqual([{ Manufacturer: 'Hynix/Hyundai', Capacity: 8589934592 }]);
    expect(collected.payload).not.toHaveProperty('Name');
    expect(collected.partial).toBe(false);
  });

  it('surfaces a single-object CPU and BIOS row through the hardware normalizer', async () => {
    // execFile receives (file, args, options); the script is the last argument.
    const byClass: Record<string, unknown> = {
      Win32_Processor: { Name: 'Intel(R) Core(TM) i5-4570 CPU @ 3.20GHz', NumberOfCores: 4, NumberOfLogicalProcessors: 4, MaxClockSpeed: 3201, Architecture: 9 },
      Win32_BIOS: { Manufacturer: 'LENOVO', SMBIOSBIOSVersion: 'FEKT83AUS', ReleaseDate: '/Date(1400630400000)/' },
      Win32_PhysicalMemory: [{ Manufacturer: 'Hynix/Hyundai', Capacity: 8589934592 }]
    };
    const hardware = await providerModule.collectHardware({
      execFile: async (_file: string, args: string[]) => {
        const script = args[args.length - 1] as string;
        const key = Object.keys(byClass).find((name) => script.includes(name)) as string | undefined;
        return { stdout: JSON.stringify(key ? byClass[key] : []) };
      }
    });
    expect(hardware.cpu).toHaveLength(1);
    expect(hardware.cpu[0].name).toBe('Intel(R) Core(TM) i5-4570 CPU @ 3.20GHz');
    expect(hardware.cpu[0].cores).toBe(4);
    expect(hardware.bios).toHaveLength(1);
    expect(hardware.bios[0].manufacturer).toBe('LENOVO');
    expect(hardware.memoryModules).toHaveLength(1);
    expect(hardware.partial).toBe(false);
  });

  it('reports the Windows edition from a single-object Win32_OperatingSystem row', async () => {
    const health = await providerModule.collectSystemHealth({
      execFile: async () => ({ stdout: JSON.stringify({ os: { Caption: 'Microsoft Windows 10 Pro', Version: '10.0.19045', BuildNumber: '19045' }, cpu: [], perf: null, disks: [], battery: [] }) })
    });
    expect(health.osCaption).toBe('Microsoft Windows 10 Pro');
  });

  it('separates IPv4 from IPv6 and prefers only preferred addresses', () => {
    const network = providers.normalizeNetwork({
      adapters: [{ Name: 'Ethernet', InterfaceDescription: 'Intel', Status: 'Up', InterfaceIndex: 12, LinkSpeed: '1 Gbps' }],
      addresses: [
        { InterfaceAlias: 'Ethernet', AddressFamily: 2, IPAddress: '192.168.1.20', AddressState: 1, PrefixLength: 24 },
        { InterfaceAlias: 'Ethernet', AddressFamily: 2, IPAddress: '169.254.1.1', AddressState: 2, PrefixLength: 16 },
        { InterfaceAlias: 'Ethernet', AddressFamily: 23, IPAddress: 'fe80::1', AddressState: 1, PrefixLength: 64 }
      ],
      dns: [{ InterfaceAlias: 'Ethernet', ServerAddresses: ['1.1.1.1'] }],
      interfaces: [{ InterfaceAlias: 'Ethernet', Dhcp: 'Enabled', ConnectionState: 'Connected', NlMtu: 1500 }],
      defaultRoutes: [{ InterfaceAlias: 'Ethernet', DestinationPrefix: '0.0.0.0/0', NextHop: '192.168.1.1', RouteMetric: 35 }]
    }) as { items: Array<Record<string, unknown>> };
    const [adapter] = network.items;
    expect(adapter.dhcp).toBe('Enabled');
    expect(adapter.connectionState).toBe('Connected');
    expect((adapter.ipv4 as unknown[])).toHaveLength(1);
    expect((adapter.ipv6 as unknown[])).toHaveLength(1);
    expect(adapter.ipv4Configured).toBe(2);
    expect(adapter.dnsServers).toEqual(['1.1.1.1']);
    expect(adapter.defaultGateway).toBe('192.168.1.1');
  });
});
