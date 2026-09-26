import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
// The provider module is plain CommonJS; every exported entry is a pure normalizer
// that accepts an untyped Windows payload and returns a normalized record.
const providers = require('../electron/windows-providers.cjs') as Record<string, (...args: unknown[]) => unknown>;

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
    const adapter = network.items[0];
    expect(adapter.status).toBe('Up');
    expect(adapter.ipv4).toHaveLength(1);
    expect(adapter.dnsServers).toEqual(['1.1.1.1']);
    expect(adapter.defaultGateway).toBe('192.168.1.1');
    expect(adapter.dhcp).toBe('Enabled');
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

  it('never uses Win32_Product or WinGet as installation truth', () => {
    const source = JSON.stringify(providers.UNINSTALL_ROOTS);
    expect(source).not.toMatch(/Win32_Product/i);
    expect(source).toMatch(/WOW6432Node/);
    expect(providers.UNINSTALL_ROOTS).toHaveLength(3);
  });
});
