/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ServiceStatus = 'Running' | 'Stopped' | 'Paused' | 'Starting' | 'Stopping';
export type StartupType = 'Automatic' | 'Automatic (Delayed)' | 'Manual' | 'Disabled';
export type ServiceAccount = 'Local System' | 'Network Service' | 'Local Service' | 'User Account';

export interface WindowsServiceItem {
  name: string; // ServiceName (e.g. "Spooler")
  displayName: string; // Display Name (e.g. "Print Spooler")
  status: ServiceStatus;
  startupType: StartupType;
  account: ServiceAccount;
  dependencies: string[]; // Services this service depends on
  dependents: string[]; // Services that depend on this service
  executablePath: string;
  isProtected: boolean;
  protectionRestrictions?: string;
  managementRights: string;
  description: string;
  category: 'System' | 'Network' | 'Security' | 'Media' | 'Utilities' | 'Hardware';
  pid?: number;
  memoryUsageMb?: number;
}

export interface ServiceCommanderMetric {
  id: string;
  title: string;
  count: number;
  icon: 'database' | 'play' | 'stop' | 'gear' | 'file' | 'slash';
  color: string;
  filterKey: 'all' | 'running' | 'stopped' | 'automatic' | 'manual' | 'disabled' | 'protected';
}

export interface ServiceNavigationCard {
  id: string;
  serviceKey: string;
  title: string;
  subtitle: string;
  iconType:
    | 'register'
    | 'control'
    | 'undo'
    | 'dependencies'
    | 'protected'
    | 'search'
    | 'startup-report'
    | 'state-history'
    | 'dependents'
    | 'diagnose'
    | 'config'
    | 'perf';
  capabilityState: 'Available' | 'Active' | 'Ready' | 'Protected';
  previewAction: string;
}

export interface RecentServiceActivityRecord {
  id: string;
  timestamp: string;
  serviceName: string;
  action: 'Started' | 'Stopped' | 'Restarted' | 'Startup Type Changed' | 'Configured';
  previousState: string;
  newState: string;
  details: string;
  user: string;
}

export interface DependencyGraphNode {
  id: string;
  name: string;
  role: 'dependency' | 'dependent' | 'selected';
  status: ServiceStatus;
}

export const SERVICE_COMMANDER_METRICS: ServiceCommanderMetric[] = [
  { id: 'discovered', title: 'Services Discovered', count: 271, icon: 'database', color: 'text-blue-400', filterKey: 'all' },
  { id: 'running', title: 'Running', count: 189, icon: 'play', color: 'text-emerald-400', filterKey: 'running' },
  { id: 'stopped', title: 'Stopped', count: 82, icon: 'stop', color: 'text-slate-400', filterKey: 'stopped' },
  { id: 'automatic', title: 'Automatic', count: 122, icon: 'gear', color: 'text-cyan-400', filterKey: 'automatic' },
  { id: 'manual', title: 'Manual', count: 98, icon: 'file', color: 'text-indigo-400', filterKey: 'manual' },
  { id: 'disabled', title: 'Disabled', count: 51, icon: 'slash', color: 'text-rose-400', filterKey: 'disabled' }
];

export const SERVICE_NAVIGATION_CARDS: ServiceNavigationCard[] = [
  {
    id: 'services-inventory',
    serviceKey: 'services-inventory',
    title: 'Services Register',
    subtitle: '271 services. View and manage all Windows services.',
    iconType: 'register',
    capabilityState: 'Available',
    previewAction: 'Open Register'
  },
  {
    id: 'services-control',
    serviceKey: 'services-control',
    title: 'Service Start/Stop',
    subtitle: 'Start, stop or restart services.',
    iconType: 'control',
    capabilityState: 'Ready',
    previewAction: 'Control Service'
  },
  {
    id: 'services-undo',
    serviceKey: 'services-undo',
    title: 'Undo Service Change',
    subtitle: 'Revert recent service changes.',
    iconType: 'undo',
    capabilityState: 'Available',
    previewAction: 'View Undo Rollback'
  },
  {
    id: 'services-dependencies',
    serviceKey: 'services-dependencies',
    title: 'Dependency Explorer',
    subtitle: 'Visualize service dependencies.',
    iconType: 'dependencies',
    capabilityState: 'Available',
    previewAction: 'Open Graph'
  },
  {
    id: 'services-protected',
    serviceKey: 'services-protected',
    title: 'Protected Services',
    subtitle: '28 protected services. View and manage protected services.',
    iconType: 'protected',
    capabilityState: 'Protected',
    previewAction: 'Inspect Protection'
  },
  {
    id: 'services-search',
    serviceKey: 'services-search',
    title: 'Service Search',
    subtitle: 'Find services quickly.',
    iconType: 'search',
    capabilityState: 'Available',
    previewAction: 'Filter Search'
  },
  {
    id: 'services-startup-report',
    serviceKey: 'services-startup-report',
    title: 'Startup Type Report',
    subtitle: 'Startup policy overview.',
    iconType: 'startup-report',
    capabilityState: 'Available',
    previewAction: 'View Report'
  },
  {
    id: 'services-state-history',
    serviceKey: 'services-state-history',
    title: 'State History',
    subtitle: 'Track service state changes.',
    iconType: 'state-history',
    capabilityState: 'Available',
    previewAction: 'View Journal'
  },
  {
    id: 'services-dependents',
    serviceKey: 'services-dependents',
    title: 'Dependent Services',
    subtitle: 'View services that depend on this one.',
    iconType: 'dependents',
    capabilityState: 'Available',
    previewAction: 'Analyze Dependents'
  },
  {
    id: 'services-diagnose',
    serviceKey: 'services-diagnose',
    title: 'Service Diagnosis',
    subtitle: 'Check for configuration issues.',
    iconType: 'diagnose',
    capabilityState: 'Available',
    previewAction: 'Run Diagnostics'
  },
  {
    id: 'services-config',
    serviceKey: 'services-config',
    title: 'Configuration Editor',
    subtitle: 'View and edit service configuration.',
    iconType: 'config',
    capabilityState: 'Ready',
    previewAction: 'Edit Config'
  },
  {
    id: 'services-perf',
    serviceKey: 'services-perf',
    title: 'Service Performance',
    subtitle: 'View resource usage and metrics.',
    iconType: 'perf',
    capabilityState: 'Available',
    previewAction: 'View Telemetry'
  }
];

export const INITIAL_SERVICES_REGISTER: WindowsServiceItem[] = [
  {
    name: 'Spooler',
    displayName: 'Print Spooler',
    status: 'Running',
    startupType: 'Automatic',
    account: 'Local System',
    dependencies: ['RPCSS', 'HTTP'],
    dependents: ['Fax'],
    executablePath: 'C:\\Windows\\System32\\spoolsv.exe',
    isProtected: false,
    managementRights: 'Standard Administrator',
    description: 'Manages print queues and controls all print and fax jobs sent to printer drivers.',
    category: 'Utilities',
    pid: 2412,
    memoryUsageMb: 18.4
  },
  {
    name: 'WSearch',
    displayName: 'Windows Search',
    status: 'Running',
    startupType: 'Automatic (Delayed)',
    account: 'Local System',
    dependencies: ['RPCSS'],
    dependents: [],
    executablePath: 'C:\\Windows\\System32\\SearchIndexer.exe',
    isProtected: false,
    managementRights: 'Standard Administrator',
    description: 'Provides content indexing, property caching, and search results for files, email, and other content.',
    category: 'System',
    pid: 3980,
    memoryUsageMb: 64.2
  },
  {
    name: 'BITS',
    displayName: 'Background Intelligent Transfer Service',
    status: 'Running',
    startupType: 'Manual',
    account: 'Local System',
    dependencies: ['RPCSS', 'WinHTTP'],
    dependents: [],
    executablePath: 'C:\\Windows\\System32\\svchost.exe -k netsvcs -p',
    isProtected: false,
    managementRights: 'Standard Administrator',
    description: 'Transfers files in the background using idle network bandwidth. Used by Windows Update.',
    category: 'Network',
    pid: 1844,
    memoryUsageMb: 12.8
  },
  {
    name: 'WinDefend',
    displayName: 'Microsoft Defender Antivirus Service',
    status: 'Running',
    startupType: 'Automatic',
    account: 'Local System',
    dependencies: ['RPCSS'],
    dependents: ['WdFilter'],
    executablePath: 'C:\\Program Files\\Windows Defender\\MsMpEng.exe',
    isProtected: true,
    protectionRestrictions: 'Critical Windows service (protected)',
    managementRights: 'Administrator required',
    description: 'Helps protect users from malware and other potentially unwanted software.',
    category: 'Security',
    pid: 4892,
    memoryUsageMb: 184.6
  },
  {
    name: 'Dhcp',
    displayName: 'DHCP Client',
    status: 'Running',
    startupType: 'Automatic',
    account: 'Local System',
    dependencies: ['NSI', 'Tcpip'],
    dependents: ['WinHttpAutoProxySvc'],
    executablePath: 'C:\\Windows\\System32\\svchost.exe -k LocalServiceNetworkRestricted',
    isProtected: true,
    protectionRestrictions: 'Critical Windows service (protected)',
    managementRights: 'Administrator required',
    description: 'Registers and updates IP addresses and DNS records for this computer.',
    category: 'Network',
    pid: 1208,
    memoryUsageMb: 9.3
  },
  {
    name: 'Dnscache',
    displayName: 'DNS Client',
    status: 'Running',
    startupType: 'Automatic',
    account: 'Network Service',
    dependencies: ['Tcpip'],
    dependents: [],
    executablePath: 'C:\\Windows\\System32\\svchost.exe -k NetworkService -p',
    isProtected: true,
    protectionRestrictions: 'Critical Windows service (protected)',
    managementRights: 'Administrator required',
    description: 'The DNS Client service (dnscache) caches Domain Name System (DNS) names and registers the full computer name.',
    category: 'Network',
    pid: 1420,
    memoryUsageMb: 14.1
  },
  {
    name: 'EventLog',
    displayName: 'Windows Event Log',
    status: 'Running',
    startupType: 'Automatic',
    account: 'Local System',
    dependencies: ['RPCSS'],
    dependents: ['TaskScheduler', 'WinDefend'],
    executablePath: 'C:\\Windows\\System32\\svchost.exe -k LocalServiceNetworkRestricted -p',
    isProtected: true,
    protectionRestrictions: 'Critical Windows service (protected)',
    managementRights: 'Administrator required',
    description: 'Manages events and event logs. It supports logging events, querying events, subscribing to events.',
    category: 'System',
    pid: 1112,
    memoryUsageMb: 24.5
  },
  {
    name: 'Themes',
    displayName: 'Themes',
    status: 'Running',
    startupType: 'Automatic',
    account: 'Local System',
    dependencies: ['UxSms'],
    dependents: [],
    executablePath: 'C:\\Windows\\System32\\svchost.exe -k netsvcs -p',
    isProtected: false,
    managementRights: 'Standard Administrator',
    description: 'Provides user experience theme management and desktop window rendering style configuration.',
    category: 'Utilities',
    pid: 2908,
    memoryUsageMb: 15.2
  },
  {
    name: 'AudioSrv',
    displayName: 'Windows Audio',
    status: 'Running',
    startupType: 'Automatic',
    account: 'Local Service',
    dependencies: ['RpcSs', 'MMCSS'],
    dependents: ['AudioEndpointBuilder'],
    executablePath: 'C:\\Windows\\System32\\svchost.exe -k LocalServiceNetworkRestricted -p',
    isProtected: false,
    managementRights: 'Standard Administrator',
    description: 'Manages audio for Windows-based programs. If stopped, audio devices will not function properly.',
    category: 'Media',
    pid: 3104,
    memoryUsageMb: 22.0
  },
  {
    name: 'W32Time',
    displayName: 'Windows Time',
    status: 'Stopped',
    startupType: 'Manual',
    account: 'Local Service',
    dependencies: [],
    dependents: [],
    executablePath: 'C:\\Windows\\System32\\w32tm.exe',
    isProtected: false,
    managementRights: 'Standard Administrator',
    description: 'Maintains date and time synchronization on all clients and servers in the network.',
    category: 'System',
    memoryUsageMb: 0
  },
  {
    name: 'WerSvc',
    displayName: 'Windows Error Reporting Service',
    status: 'Stopped',
    startupType: 'Manual',
    account: 'Local System',
    dependencies: ['RPCSS'],
    dependents: [],
    executablePath: 'C:\\Windows\\System32\\svchost.exe -k WerSvcGroup',
    isProtected: false,
    managementRights: 'Standard Administrator',
    description: 'Allows errors to be reported when programs stop working or responding and solutions to be delivered.',
    category: 'System',
    memoryUsageMb: 0
  },
  {
    name: 'seclogon',
    displayName: 'Secondary Logon',
    status: 'Stopped',
    startupType: 'Manual',
    account: 'Local System',
    dependencies: [],
    dependents: [],
    executablePath: 'C:\\Windows\\System32\\svchost.exe -k netsvcs',
    isProtected: false,
    managementRights: 'Standard Administrator',
    description: 'Enables starting processes under alternate credentials (such as Run As Administrator).',
    category: 'Security',
    memoryUsageMb: 0
  },
  {
    name: 'SysMain',
    displayName: 'SysMain (Superfetch)',
    status: 'Running',
    startupType: 'Automatic',
    account: 'Local System',
    dependencies: ['RPCSS'],
    dependents: [],
    executablePath: 'C:\\Windows\\System32\\svchost.exe -k sysmain',
    isProtected: false,
    managementRights: 'Standard Administrator',
    description: 'Maintains and improves system performance over time by pre-caching frequent applications.',
    category: 'System',
    pid: 2180,
    memoryUsageMb: 36.4
  },
  {
    name: 'DiagTrack',
    displayName: 'Connected User Experiences and Telemetry',
    status: 'Running',
    startupType: 'Automatic',
    account: 'Local System',
    dependencies: ['RPCSS'],
    dependents: [],
    executablePath: 'C:\\Windows\\System32\\svchost.exe -k utcsvc',
    isProtected: false,
    managementRights: 'Standard Administrator',
    description: 'Enables features that support in-application and connected user experiences on Windows.',
    category: 'Utilities',
    pid: 2540,
    memoryUsageMb: 19.8
  },
  {
    name: 'wuauserv',
    displayName: 'Windows Update',
    status: 'Running',
    startupType: 'Manual',
    account: 'Local System',
    dependencies: ['rpcss'],
    dependents: [],
    executablePath: 'C:\\Windows\\System32\\svchost.exe -k netsvcs -p',
    isProtected: false,
    managementRights: 'Administrator required',
    description: 'Enables the detection, download, and installation of updates for Windows and other programs.',
    category: 'System',
    pid: 1928,
    memoryUsageMb: 42.1
  }
];

export const INITIAL_ACTIVITY_LOGS: RecentServiceActivityRecord[] = [
  {
    id: 'act-1',
    timestamp: '4/14/2025 10:43:12 AM',
    serviceName: 'Spooler',
    action: 'Started',
    previousState: 'Stopped',
    newState: 'Running',
    details: 'Service started successfully.',
    user: 'SYSTEM'
  },
  {
    id: 'act-2',
    timestamp: '4/14/2025 10:25:01 AM',
    serviceName: 'W32Time',
    action: 'Stopped',
    previousState: 'Running',
    newState: 'Stopped',
    details: 'Service stopped by user.',
    user: 'Administrator'
  },
  {
    id: 'act-3',
    timestamp: '4/14/2025 9:12:18 AM',
    serviceName: 'WerSvc',
    action: 'Startup Type Changed',
    previousState: 'Automatic',
    newState: 'Manual',
    details: 'Startup type changed from Automatic to Manual.',
    user: 'Administrator'
  },
  {
    id: 'act-4',
    timestamp: '4/14/2025 8:47:33 AM',
    serviceName: 'Dhcp',
    action: 'Started',
    previousState: 'Stopped',
    newState: 'Running',
    details: 'Service started successfully.',
    user: 'SYSTEM'
  },
  {
    id: 'act-5',
    timestamp: '4/14/2025 8:12:05 AM',
    serviceName: 'Themes',
    action: 'Restarted',
    previousState: 'Running',
    newState: 'Running',
    details: 'Service restarted successfully.',
    user: 'Administrator'
  }
];

export const INITIAL_DEPENDENCY_GRAPH_NODES: Record<string, DependencyGraphNode[]> = {
  WinDefend: [
    { id: 'RPCSS', name: 'RPCSS', role: 'dependency', status: 'Running' },
    { id: 'EventLog', name: 'EventLog', role: 'dependency', status: 'Running' },
    { id: 'WinDefend', name: 'WinDefend', role: 'selected', status: 'Running' },
    { id: 'BFE', name: 'BFE', role: 'dependency', status: 'Running' },
    { id: 'WdFilter', name: 'WdFilter', role: 'dependent', status: 'Running' }
  ],
  Spooler: [
    { id: 'RPCSS', name: 'RPCSS', role: 'dependency', status: 'Running' },
    { id: 'HTTP', name: 'HTTP', role: 'dependency', status: 'Running' },
    { id: 'Spooler', name: 'Spooler', role: 'selected', status: 'Running' },
    { id: 'Fax', name: 'Fax', role: 'dependent', status: 'Stopped' }
  ],
  Dhcp: [
    { id: 'NSI', name: 'NSI', role: 'dependency', status: 'Running' },
    { id: 'Tcpip', name: 'Tcpip', role: 'dependency', status: 'Running' },
    { id: 'Dhcp', name: 'Dhcp', role: 'selected', status: 'Running' },
    { id: 'WinHttpAutoProxySvc', name: 'WinHttpAutoProxySvc', role: 'dependent', status: 'Running' }
  ]
};
