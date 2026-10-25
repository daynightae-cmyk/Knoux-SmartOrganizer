/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface TelemetrySourceMeta {
  id: string;
  name: string;
  provider: string;
  status: 'awaiting_data' | 'connected' | 'paused' | 'error';
  statusText: string;
  lastSampleTime?: string;
}

export interface InstrumentMetric {
  id: 'cpu' | 'memory' | 'disk' | 'network';
  name: string;
  title: string;
  subtitle: string;
  icon: 'cpu' | 'memory' | 'disk' | 'network';
  gaugeValue: string; // e.g. "--%"
  gaugeStatus: string; // e.g. "Awaiting sample"
  sparklineColor: string;
  sparklinePoints: number[];
  footerStats: Array<{
    label: string;
    value: string;
  }>;
}

export interface SystemInfoData {
  windowsVersion: string;
  versionBuild: string;
  systemManufacturer: string;
  systemModel: string;
  processor: string;
  installedRam: string;
  uptime: string;
  processCount: string;
  lastRead: string;
}

export interface RunningProcessItem {
  pid: number;
  name: string;
  cpu: string;
  memory: string;
  user: string;
  status: 'Running' | 'Suspended' | 'Idle';
  signature?: 'Microsoft' | 'Verified' | 'Unsigned';
  commandLine?: string;
  threads?: number;
}

export interface SystemServiceMeta {
  id: string;
  serviceKey: string;
  name: string;
  subtitle: string;
  iconName: string;
  category: 'health' | 'diagnostics' | 'security' | 'performance' | 'internals';
  status: 'ready' | 'monitoring' | 'idle';
}

export interface NetworkServiceMeta {
  id: string;
  serviceKey: string;
  name: string;
  subtitle: string;
  iconName: string;
}

export interface HardwareServiceMeta {
  id: string;
  serviceKey: string;
  name: string;
  subtitle: string;
  iconName: string;
}

export const INITIAL_TELEMETRY_SOURCE: TelemetrySourceMeta = {
  id: 'perf-counters',
  name: 'Windows Performance Counters',
  provider: 'PDH / ETW Kernel Subsystem',
  status: 'awaiting_data',
  statusText: 'Awaiting data...'
};

export const INITIAL_INSTRUMENT_METRICS: InstrumentMetric[] = [
  {
    id: 'cpu',
    name: 'CPU',
    title: 'CPU',
    subtitle: 'Processor Activity',
    icon: 'cpu',
    gaugeValue: '--%',
    gaugeStatus: 'Awaiting sample',
    sparklineColor: '#38bdf8', // electric blue
    sparklinePoints: [20, 25, 18, 45, 30, 60, 42, 55, 38, 70, 45, 62, 50, 65, 48, 58],
    footerStats: [
      { label: 'Base Speed', value: '-- GHz' },
      { label: 'Cores', value: '--' },
      { label: 'Logical', value: '--' }
    ]
  },
  {
    id: 'memory',
    name: 'Memory',
    title: 'Memory',
    subtitle: 'Physical Memory Usage',
    icon: 'memory',
    gaugeValue: '--%',
    gaugeStatus: 'Awaiting sample',
    sparklineColor: '#a855f7', // purple
    sparklinePoints: [30, 32, 35, 33, 36, 40, 38, 42, 45, 43, 44, 46, 45, 48, 47, 46],
    footerStats: [
      { label: 'Total', value: '-- GB' },
      { label: 'In Use', value: '-- GB' },
      { label: 'Available', value: '-- GB' }
    ]
  },
  {
    id: 'disk',
    name: 'Disk Activity',
    title: 'Disk Activity',
    subtitle: 'Read / Write Activity',
    icon: 'disk',
    gaugeValue: '--%',
    gaugeStatus: 'Awaiting sample',
    sparklineColor: '#10b981', // green/teal
    sparklinePoints: [10, 15, 8, 40, 12, 55, 20, 75, 15, 60, 25, 45, 18, 30, 12, 22],
    footerStats: [
      { label: 'Read Rate', value: '-- MB/s' },
      { label: 'Write Rate', value: '-- MB/s' },
      { label: 'Active Time', value: '--%' }
    ]
  },
  {
    id: 'network',
    name: 'Network Activity',
    title: 'Network Activity',
    subtitle: 'Inbound / Outbound Traffic',
    icon: 'network',
    gaugeValue: '--%',
    gaugeStatus: 'Awaiting sample',
    sparklineColor: '#00f2fe', // cyan
    sparklinePoints: [15, 18, 12, 35, 22, 48, 30, 65, 28, 50, 35, 58, 40, 52, 36, 44],
    footerStats: [
      { label: 'Download', value: '-- Mbps' },
      { label: 'Upload', value: '-- Mbps' },
      { label: 'Total', value: '-- GB' }
    ]
  }
];

export const INITIAL_SYSTEM_INFO: SystemInfoData = {
  windowsVersion: 'Windows 11 Pro',
  versionBuild: '-- (Build ----)',
  systemManufacturer: '--',
  systemModel: '--',
  processor: '--',
  installedRam: '-- GB',
  uptime: '--:--:--',
  processCount: '--',
  lastRead: '--/--/---- --:--:--'
};

export const SAMPLE_SYSTEM_INFO_ACTIVE: SystemInfoData = {
  windowsVersion: 'Windows 11 Pro',
  versionBuild: '24H2 (Build 26100.2161)',
  systemManufacturer: 'Custom PC / ASUS ROG',
  systemModel: 'Maximus Z790 HERO',
  processor: '13th Gen Intel(R) Core(TM) i9-13900K',
  installedRam: '64.0 GB DDR5-6000',
  uptime: '03:14:28:12',
  processCount: '248 active',
  lastRead: '24/10/2026 18:48:30'
};

export const INITIAL_SERVICES_CATALOG: SystemServiceMeta[] = [
  {
    id: 'srv-health',
    serviceKey: 'system-health-check',
    name: 'Health Overview',
    subtitle: 'System health at a glance',
    iconName: 'Heart',
    category: 'health',
    status: 'ready'
  },
  {
    id: 'srv-events',
    serviceKey: 'system-events',
    name: 'Windows Event Warnings',
    subtitle: 'Recent system warnings',
    iconName: 'AlertTriangle',
    category: 'diagnostics',
    status: 'ready'
  },
  {
    id: 'srv-processes',
    serviceKey: 'system-processes',
    name: 'Process Inventory',
    subtitle: 'Detailed process information',
    iconName: 'ListFilter',
    category: 'performance',
    status: 'ready'
  },
  {
    id: 'srv-signatures',
    serviceKey: 'system-signatures',
    name: 'Signature Inspection',
    subtitle: 'Verify digital signatures',
    iconName: 'ShieldCheck',
    category: 'security',
    status: 'ready'
  },
  {
    id: 'srv-uptime',
    serviceKey: 'system-uptime',
    name: 'Uptime',
    subtitle: 'System uptime and history',
    iconName: 'Clock',
    category: 'health',
    status: 'ready'
  },
  {
    id: 'srv-perf',
    serviceKey: 'system-perf',
    name: 'Performance Monitoring',
    subtitle: 'In-depth performance data',
    iconName: 'BarChart3',
    category: 'performance',
    status: 'ready'
  },
  {
    id: 'srv-drivers',
    serviceKey: 'system-drivers',
    name: 'Driver Explorer',
    subtitle: 'Installed drivers and versions',
    iconName: 'Cog',
    category: 'internals',
    status: 'ready'
  },
  {
    id: 'srv-logs',
    serviceKey: 'system-logs',
    name: 'System Logs',
    subtitle: 'View and analyze system logs',
    iconName: 'FileText',
    category: 'diagnostics',
    status: 'ready'
  },
  {
    id: 'srv-resources',
    serviceKey: 'system-resources',
    name: 'Resource Monitor',
    subtitle: 'Live resource utilization',
    iconName: 'PieChart',
    category: 'performance',
    status: 'ready'
  },
  {
    id: 'srv-autostart',
    serviceKey: 'system-autostart',
    name: 'Autostart Links',
    subtitle: 'Manage startup applications',
    iconName: 'PlayCircle',
    category: 'internals',
    status: 'ready'
  },
  {
    id: 'srv-services-map',
    serviceKey: 'system-services-map',
    name: 'Service Relationship Map',
    subtitle: 'Visualize service dependencies',
    iconName: 'Network',
    category: 'internals',
    status: 'ready'
  },
  {
    id: 'srv-timeline',
    serviceKey: 'system-timeline',
    name: 'System Event Timeline',
    subtitle: 'Chronological event stream',
    iconName: 'Activity',
    category: 'diagnostics',
    status: 'ready'
  }
];

export const NETWORK_SERVICES_CATALOG: NetworkServiceMeta[] = [
  { id: 'net-1', serviceKey: 'network-interfaces', name: 'Network Interfaces', subtitle: 'Ethernet & Wi-Fi interface controllers', iconName: 'Network' },
  { id: 'net-2', serviceKey: 'network-dns-config', name: 'DNS Configuration', subtitle: 'Nameserver resolution & DNS cache inspection', iconName: 'Globe' },
  { id: 'net-3', serviceKey: 'network-adapters', name: 'Network Adapters', subtitle: 'Physical & virtual adapter link negotiation', iconName: 'Cpu' },
  { id: 'net-4', serviceKey: 'network-connectivity', name: 'Connectivity Tests', subtitle: 'Default gateway & WAN ICMP latency checks', iconName: 'Radio' },
  { id: 'net-5', serviceKey: 'network-throughput', name: 'Throughput Monitor', subtitle: 'Real-time inbound/outbound bandwidth tracking', iconName: 'Gauge' },
  { id: 'net-6', serviceKey: 'network-traceroute', name: 'Traceroute Visualizer', subtitle: 'Multi-hop network route & packet drop telemetry', iconName: 'Compass' },
  { id: 'net-7', serviceKey: 'network-topology', name: 'Network Topology', subtitle: 'Subnet device discovery & ARP neighborhood', iconName: 'Share2' },
  { id: 'net-8', serviceKey: 'network-ports', name: 'Listening Ports', subtitle: 'TCP/UDP listening ports & process owners', iconName: 'Lock' },
  { id: 'net-9', serviceKey: 'network-wifi', name: 'Wi-Fi Signal Analytics', subtitle: 'BSSID, RSSI channel width & interference analysis', iconName: 'Wifi' },
  { id: 'net-10', serviceKey: 'network-hosts', name: 'Hosts File Inspector', subtitle: 'Static name resolution & DNS override rules', iconName: 'FileCode' },
  { id: 'net-11', serviceKey: 'network-proxies', name: 'Proxy & VPN Diagnostics', subtitle: 'WinHTTP & user proxy configuration status', iconName: 'Shield' },
  { id: 'net-12', serviceKey: 'network-repair-link', name: 'Network Repair Engine', subtitle: 'Non-destructive Winsock & adapter link reset', iconName: 'Wrench' }
];

export const HARDWARE_SERVICES_CATALOG: HardwareServiceMeta[] = [
  { id: 'hw-1', serviceKey: 'hardware-inventory', name: 'Hardware Inventory', subtitle: 'Comprehensive SMBIOS motherboard & component ledger', iconName: 'HardDrive' },
  { id: 'hw-2', serviceKey: 'hardware-battery', name: 'Battery Health', subtitle: 'Battery wear level, design capacity & cycle count', iconName: 'BatteryCharging' },
  { id: 'hw-3', serviceKey: 'hardware-cpu', name: 'CPU Architecture', subtitle: 'Microarchitecture, cache hierarchy & thermal limits', iconName: 'Cpu' },
  { id: 'hw-4', serviceKey: 'hardware-gpu', name: 'GPU Subsystem', subtitle: 'VRAM allocation, PCIe bus link & driver revisions', iconName: 'Tv' },
  { id: 'hw-5', serviceKey: 'hardware-memory', name: 'Memory Topology', subtitle: 'DIMM slot layout, XMP/EXPO timings & SPD profiles', iconName: 'Layers' },
  { id: 'hw-6', serviceKey: 'hardware-cycles', name: 'Power Cycles & S.M.A.R.T.', subtitle: 'NVMe/SSD power-on hours & health endurance', iconName: 'RotateCcw' },
  { id: 'hw-7', serviceKey: 'hardware-thermal', name: 'Thermal Sensors', subtitle: 'Package temperature, VRM hotspots & fan tachometers', iconName: 'Thermometer' },
  { id: 'hw-8', serviceKey: 'hardware-disks', name: 'Storage Controllers', subtitle: 'NVMe PCIe lanes, AHCI controllers & volume health', iconName: 'Database' },
  { id: 'hw-9', serviceKey: 'hardware-usb', name: 'USB Topology', subtitle: 'USB 3.2/USB4 host controllers & device descriptors', iconName: 'Usb' },
  { id: 'hw-10', serviceKey: 'hardware-display', name: 'Display Diagnostics', subtitle: 'EDID information, refresh rates, HDR & color profiles', iconName: 'Monitor' },
  { id: 'hw-11', serviceKey: 'hardware-audio', name: 'Audio Endpoints', subtitle: 'High Definition Audio codecs, sample rates & DSP chips', iconName: 'Volume2' },
  { id: 'hw-12', serviceKey: 'hardware-health-report', name: 'Hardware Health Report', subtitle: 'Consolidated hardware diagnostic summary & export', iconName: 'FileCheck' }
];

export const SAMPLE_PROCESS_FIXTURES: RunningProcessItem[] = [
  {
    pid: 4,
    name: 'System',
    cpu: '0.4%',
    memory: '128 KB',
    user: 'NT AUTHORITY\\SYSTEM',
    status: 'Running',
    signature: 'Microsoft',
    commandLine: 'ntoskrnl.exe',
    threads: 284
  },
  {
    pid: 892,
    name: 'dwm.exe',
    cpu: '1.2%',
    memory: '84.2 MB',
    user: 'Window Manager\\DWM-1',
    status: 'Running',
    signature: 'Microsoft',
    commandLine: 'C:\\Windows\\System32\\dwm.exe',
    threads: 24
  },
  {
    pid: 1420,
    name: 'explorer.exe',
    cpu: '0.8%',
    memory: '142.6 MB',
    user: 'User',
    status: 'Running',
    signature: 'Microsoft',
    commandLine: 'C:\\Windows\\explorer.exe',
    threads: 68
  },
  {
    pid: 2180,
    name: 'svchost.exe (DcomLaunch)',
    cpu: '0.2%',
    memory: '38.4 MB',
    user: 'NT AUTHORITY\\SYSTEM',
    status: 'Running',
    signature: 'Microsoft',
    commandLine: 'C:\\Windows\\system32\\svchost.exe -k DcomLaunch -p',
    threads: 42
  },
  {
    pid: 3840,
    name: 'msedge.exe',
    cpu: '2.4%',
    memory: '382.1 MB',
    user: 'User',
    status: 'Running',
    signature: 'Microsoft',
    commandLine: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    threads: 86
  },
  {
    pid: 4912,
    name: 'Discord.exe',
    cpu: '1.6%',
    memory: '228.4 MB',
    user: 'User',
    status: 'Running',
    signature: 'Verified',
    commandLine: 'C:\\Users\\User\\AppData\\Local\\Discord\\app-1.0.9168\\Discord.exe',
    threads: 38
  },
  {
    pid: 5824,
    name: 'Spotify.exe',
    cpu: '0.9%',
    memory: '164.2 MB',
    user: 'User',
    status: 'Running',
    signature: 'Verified',
    commandLine: 'C:\\Users\\User\\AppData\\Roaming\\Spotify\\Spotify.exe',
    threads: 32
  },
  {
    pid: 6730,
    name: 'Code.exe',
    cpu: '1.8%',
    memory: '412.0 MB',
    user: 'User',
    status: 'Running',
    signature: 'Microsoft',
    commandLine: 'C:\\Users\\User\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe',
    threads: 54
  }
];
