/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type StartupImpactLevel = 'high' | 'medium' | 'low' | 'none';

export type StartupSourceType =
  | 'registry_hkcu'
  | 'registry_hklm'
  | 'scheduled_task'
  | 'startup_folder_user'
  | 'startup_folder_common'
  | 'windows_service';

export type StartupItemStatus = 'enabled' | 'disabled' | 'delayed';

export type SignatureStatus = 'microsoft_verified' | 'trusted_ca' | 'unsigned';

export type RecommendationType =
  | 'safe_to_disable'
  | 'safe_to_delay'
  | 'keep_enabled'
  | 'caution_system';

export interface StartupItem {
  id: string;
  name: string;
  publisher: string;
  command: string;
  executablePath: string;
  source: StartupSourceType;
  sourceLocation: string;
  status: StartupItemStatus;
  delaySeconds: number; // e.g. 0, 15, 30, 60, 120
  impact: StartupImpactLevel;
  impactDelayMs: number; // boot delay in ms
  cpuUsageAtBoot: string; // e.g. "14.2%"
  diskIoAtBoot: string; // e.g. "48.2 MB/s"
  signature: SignatureStatus;
  category: 'cloud_sync' | 'communication' | 'gaming' | 'audio_hardware' | 'creative' | 'developer' | 'system' | 'browser';
  description: string;
  recommendation: RecommendationType;
  checkpoints: string[];
  isProtected?: boolean;
}

export interface BootMetric {
  id: string;
  value: string;
  label: string;
  subtext: string;
  type: 'boot_time' | 'active_items' | 'high_impact' | 'potential_savings';
  isAlert?: boolean;
}

export interface BootStage {
  id: string;
  name: string;
  durationMs: number;
  durationDisplay: string;
  percentage: number;
  color: string;
  description: string;
}

export interface StartupSourceSummary {
  id: StartupSourceType;
  name: string;
  count: number;
  path: string;
  icon: string;
}

export interface JournalEntry {
  id: string;
  timestamp: string;
  itemId: string;
  itemName: string;
  action: 'disable' | 'enable' | 'delay' | 'restore';
  previousState: string;
  newState: string;
  revertible: boolean;
  user: string;
  journalHash: string;
}

export interface StartupServiceMeta {
  id: string;
  serviceKey: string;
  name: string;
  subtitle: string;
  iconName: string;
  colorTheme: 'cyan' | 'purple' | 'amber' | 'emerald' | 'blue' | 'rose';
  category: 'analysis' | 'control' | 'safety' | 'automation';
}

export const INITIAL_BOOT_METRICS: BootMetric[] = [
  {
    id: 'boot-duration',
    value: '13.8s',
    label: 'Boot Duration',
    subtext: 'BIOS: 2.4s · Windows logon: 11.4s',
    type: 'boot_time'
  },
  {
    id: 'active-items',
    value: '28',
    label: 'Active Autostart Items',
    subtext: 'Across 6 Windows source registers',
    type: 'active_items'
  },
  {
    id: 'high-impact',
    value: '6',
    label: 'High Impact Delays',
    subtext: 'Individually delaying boot > 1.2s',
    type: 'high_impact',
    isAlert: true
  },
  {
    id: 'reclaimable-velocity',
    value: '4.6s',
    label: 'Estimated Boot Savings',
    subtext: 'Reclaimable with staged delay & disable',
    type: 'potential_savings'
  }
];

export const BOOT_STAGES_BREAKDOWN: BootStage[] = [
  {
    id: 'stage-uefi',
    name: 'Firmware & UEFI BIOS',
    durationMs: 2400,
    durationDisplay: '2.4s',
    percentage: 17.4,
    color: '#06b6d4', // cyan
    description: 'Hardware POST, memory test, and NVMe boot loader initialization.'
  },
  {
    id: 'stage-kernel',
    name: 'Windows Kernel & HAL',
    durationMs: 3100,
    durationDisplay: '3.1s',
    percentage: 22.5,
    color: '#3b82f6', // blue
    description: 'Core NTOSKRNL initialization, security subsystem, and driver stack load.'
  },
  {
    id: 'stage-drivers',
    name: 'Driver & Subsystem Init',
    durationMs: 2200,
    durationDisplay: '2.2s',
    percentage: 15.9,
    color: '#8b5cf6', // purple
    description: 'Graphics display drivers, audio endpoints, and network adapter binding.'
  },
  {
    id: 'stage-logon',
    name: 'Logon & User Profile',
    durationMs: 1800,
    durationDisplay: '1.8s',
    percentage: 13.0,
    color: '#ec4899', // pink
    description: 'Winlogon session token preparation, credential provider, and desktop shell mount.'
  },
  {
    id: 'stage-startup-apps',
    name: 'Startup Apps & Tasks',
    durationMs: 4300,
    durationDisplay: '4.3s',
    percentage: 31.2,
    color: '#f59e0b', // amber
    description: 'Autostart execution from Run keys, scheduled tasks, and delayed services.'
  }
];

export const STARTUP_SOURCES_SUMMARY: StartupSourceSummary[] = [
  {
    id: 'registry_hkcu',
    name: 'Registry Current User (HKCU)',
    count: 11,
    path: 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run',
    icon: 'registry'
  },
  {
    id: 'registry_hklm',
    name: 'Registry Local Machine (HKLM)',
    count: 6,
    path: 'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run',
    icon: 'registry'
  },
  {
    id: 'scheduled_task',
    name: 'Task Scheduler (Logon Triggers)',
    count: 8,
    path: '\\Microsoft\\Windows & Third-Party Tasks',
    icon: 'task'
  },
  {
    id: 'startup_folder_user',
    name: 'User Startup Folder',
    count: 3,
    path: '%APPDATA%\\Microsoft\\Windows\\Start Menu\\Programs\\Startup',
    icon: 'folder'
  },
  {
    id: 'startup_folder_common',
    name: 'Common Startup Folder',
    count: 1,
    path: '%PROGRAMDATA%\\Microsoft\\Windows\\Start Menu\\Programs\\Startup',
    icon: 'folder'
  },
  {
    id: 'windows_service',
    name: 'Services (Delayed Auto-Start)',
    count: 5,
    path: 'SYSTEM\\CurrentControlSet\\Services',
    icon: 'service'
  }
];

export const STARTUP_ITEMS_FIXTURE: StartupItem[] = [
  {
    id: 'item-onedrive',
    name: 'Microsoft OneDrive',
    publisher: 'Microsoft Corporation',
    command: '"C:\\Users\\User\\AppData\\Local\\Microsoft\\OneDrive\\OneDrive.exe" /background',
    executablePath: 'C:\\Users\\User\\AppData\\Local\\Microsoft\\OneDrive\\OneDrive.exe',
    source: 'registry_hkcu',
    sourceLocation: 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run',
    status: 'enabled',
    delaySeconds: 0,
    impact: 'high',
    impactDelayMs: 1850,
    cpuUsageAtBoot: '14.2%',
    diskIoAtBoot: '48.2 MB/s',
    signature: 'microsoft_verified',
    category: 'cloud_sync',
    description: 'Synchronizes personal and workplace files with Microsoft Cloud upon logon.',
    recommendation: 'safe_to_delay',
    checkpoints: [
      'Digital signature verified by Microsoft Windows Hardware Compatibility',
      'No critical boot dependencies for desktop or network stack',
      'Recommended action: 30-second staggered delay prevents logon CPU spikes'
    ]
  },
  {
    id: 'item-discord',
    name: 'Discord Updater',
    publisher: 'Discord Inc.',
    command: '"C:\\Users\\User\\AppData\\Local\\Discord\\Update.exe" --processStart Discord.exe',
    executablePath: 'C:\\Users\\User\\AppData\\Local\\Discord\\app-1.0.9168\\Discord.exe',
    source: 'registry_hkcu',
    sourceLocation: 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run',
    status: 'enabled',
    delaySeconds: 0,
    impact: 'high',
    impactDelayMs: 1420,
    cpuUsageAtBoot: '12.8%',
    diskIoAtBoot: '36.5 MB/s',
    signature: 'trusted_ca',
    category: 'communication',
    description: 'Instant messenger and voice client automatic background launch.',
    recommendation: 'safe_to_delay',
    checkpoints: [
      'Valid DigiCert code signature for Discord Inc.',
      'Performs aggressive web checks and CDN updates during logon',
      'Safe to disable or delay launch by 45 seconds'
    ]
  },
  {
    id: 'item-spotify',
    name: 'Spotify Music',
    publisher: 'Spotify AB',
    command: '"C:\\Users\\User\\AppData\\Roaming\\Spotify\\Spotify.exe" --autostart --minimized',
    executablePath: 'C:\\Users\\User\\AppData\\Roaming\\Spotify\\Spotify.exe',
    source: 'registry_hkcu',
    sourceLocation: 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run',
    status: 'enabled',
    delaySeconds: 0,
    impact: 'medium',
    impactDelayMs: 890,
    cpuUsageAtBoot: '8.4%',
    diskIoAtBoot: '21.0 MB/s',
    signature: 'trusted_ca',
    category: 'creative',
    description: 'Streaming music desktop app minimized autostart.',
    recommendation: 'safe_to_disable',
    checkpoints: [
      'Third-party multimedia application with no system utility dependencies',
      'Disabling frees 890 ms of boot time with zero operational friction'
    ]
  },
  {
    id: 'item-nvidia',
    name: 'NVIDIA ShadowPlay & Overlay Proxy',
    publisher: 'NVIDIA Corporation',
    command: '"C:\\Program Files\\NVIDIA Corporation\\NVIDIA GeForce Experience\\NVIDIA Share.exe"',
    executablePath: 'C:\\Program Files\\NVIDIA Corporation\\NVIDIA GeForce Experience\\NVIDIA Share.exe',
    source: 'registry_hklm',
    sourceLocation: 'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run',
    status: 'enabled',
    delaySeconds: 0,
    impact: 'medium',
    impactDelayMs: 650,
    cpuUsageAtBoot: '5.6%',
    diskIoAtBoot: '15.4 MB/s',
    signature: 'trusted_ca',
    category: 'gaming',
    description: 'Hardware encoder telemetry and gaming overlay shortcut hook.',
    recommendation: 'keep_enabled',
    checkpoints: [
      'Certified NVIDIA digital certificate',
      'Manages hotkeys for instant replay and display optimization',
      'Keep enabled if gaming overlay and highlights are utilized'
    ]
  },
  {
    id: 'item-steam',
    name: 'Steam Client Bootstrapper',
    publisher: 'Valve Corporation',
    command: '"C:\\Program Files (x86)\\Steam\\steam.exe" -silent',
    executablePath: 'C:\\Program Files (x86)\\Steam\\steam.exe',
    source: 'registry_hkcu',
    sourceLocation: 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run',
    status: 'enabled',
    delaySeconds: 0,
    impact: 'high',
    impactDelayMs: 1980,
    cpuUsageAtBoot: '18.1%',
    diskIoAtBoot: '54.2 MB/s',
    signature: 'trusted_ca',
    category: 'gaming',
    description: 'Gaming distribution platform background daemon and workshop syncer.',
    recommendation: 'safe_to_delay',
    checkpoints: [
      'Valid Valve Corporation digital signature',
      'Heavy disk read during game cache checks and cloud sync initialization',
      'Safe to delay launch by 60s without affecting gameplay'
    ]
  },
  {
    id: 'item-adobe-cc',
    name: 'Adobe Creative Cloud CCXProcess',
    publisher: 'Adobe Inc.',
    command: '"C:\\Program Files (x86)\\Adobe\\Adobe Creative Cloud Experience\\CCXProcess.exe"',
    executablePath: 'C:\\Program Files (x86)\\Adobe\\Adobe Creative Cloud Experience\\CCXProcess.exe',
    source: 'scheduled_task',
    sourceLocation: '\\Adobe\\Adobe Creative Cloud Experience\\CCXProcess',
    status: 'enabled',
    delaySeconds: 0,
    impact: 'high',
    impactDelayMs: 1620,
    cpuUsageAtBoot: '15.7%',
    diskIoAtBoot: '39.8 MB/s',
    signature: 'trusted_ca',
    category: 'creative',
    description: 'Syncs fonts, cloud assets, and background Adobe services at logon.',
    recommendation: 'safe_to_disable',
    checkpoints: [
      'Adobe Systems Incorporated code certificate',
      'Consumes background RAM and CPU before any Creative Cloud app is opened',
      'Safe to disable; app reloads automatically on launching Photoshop or Illustrator'
    ]
  },
  {
    id: 'item-edge',
    name: 'Microsoft Edge Startup Boost',
    publisher: 'Microsoft Corporation',
    command: '"C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe" --no-startup-window --win-session-start',
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    source: 'registry_hklm',
    sourceLocation: 'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run',
    status: 'enabled',
    delaySeconds: 0,
    impact: 'low',
    impactDelayMs: 310,
    cpuUsageAtBoot: '3.2%',
    diskIoAtBoot: '8.4 MB/s',
    signature: 'microsoft_verified',
    category: 'browser',
    description: 'Pre-warms Edge browser core processes in background to accelerate first browser launch.',
    recommendation: 'safe_to_disable',
    checkpoints: [
      'Genuine Microsoft Edge binary',
      'Pre-allocates 120 MB RAM; optional feature for non-Edge default browsers'
    ]
  },
  {
    id: 'item-realtek',
    name: 'Realtek HD Audio Universal Service',
    publisher: 'Realtek Semiconductor Corp.',
    command: '"C:\\Program Files\\Realtek\\Audio\\HDA\\RtkAudioService64.exe"',
    executablePath: 'C:\\Program Files\\Realtek\\Audio\\HDA\\RtkAudioService64.exe',
    source: 'windows_service',
    sourceLocation: 'SYSTEM\\CurrentControlSet\\Services\\RtkAudioService64',
    status: 'enabled',
    delaySeconds: 0,
    impact: 'low',
    impactDelayMs: 180,
    cpuUsageAtBoot: '1.9%',
    diskIoAtBoot: '4.1 MB/s',
    signature: 'trusted_ca',
    category: 'audio_hardware',
    description: 'Controls hardware jack detection, microphone array beamforming, and DSP presets.',
    recommendation: 'keep_enabled',
    checkpoints: [
      'Certified Realtek driver stack',
      'Maintains headphone jack plug detection and audio profile routing',
      'Should remain enabled to avoid hardware audio switching anomalies'
    ],
    isProtected: true
  },
  {
    id: 'item-chrome',
    name: 'Google Update Elevation Task',
    publisher: 'Google LLC',
    command: '"C:\\Program Files (x86)\\Google\\Update\\GoogleUpdate.exe" /c',
    executablePath: 'C:\\Program Files (x86)\\Google\\Update\\GoogleUpdate.exe',
    source: 'scheduled_task',
    sourceLocation: '\\GoogleUpdateTaskMachineUA',
    status: 'enabled',
    delaySeconds: 0,
    impact: 'low',
    impactDelayMs: 120,
    cpuUsageAtBoot: '1.1%',
    diskIoAtBoot: '2.5 MB/s',
    signature: 'trusted_ca',
    category: 'browser',
    description: 'Verifies browser security updates and component integrity upon user logon.',
    recommendation: 'safe_to_delay',
    checkpoints: [
      'Google LLC digital signature',
      'Runs once daily; can safely be delayed without security degradation'
    ]
  },
  {
    id: 'item-docker',
    name: 'Docker Desktop Engine',
    publisher: 'Docker Inc.',
    command: '"C:\\Program Files\\Docker\\Docker\\Docker Desktop.exe"',
    executablePath: 'C:\\Program Files\\Docker\\Docker\\Docker Desktop.exe',
    source: 'registry_hkcu',
    sourceLocation: 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run',
    status: 'disabled',
    delaySeconds: 0,
    impact: 'high',
    impactDelayMs: 2400,
    cpuUsageAtBoot: '22.4%',
    diskIoAtBoot: '72.0 MB/s',
    signature: 'trusted_ca',
    category: 'developer',
    description: 'Container virtualization backend with WSL2 integration.',
    recommendation: 'safe_to_delay',
    checkpoints: [
      'Currently disabled via KNOuX Soft-Disable Journal',
      'Massive resource footprint during boot; launch on-demand recommended'
    ]
  },
  {
    id: 'item-slack',
    name: 'Slack Helper Daemon',
    publisher: 'Slack Technologies LLC',
    command: '"C:\\Users\\User\\AppData\\Local\\slack\\slack.exe" --startup',
    executablePath: 'C:\\Users\\User\\AppData\\Local\\slack\\app-4.38.125\\slack.exe',
    source: 'registry_hkcu',
    sourceLocation: 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run',
    status: 'delayed',
    delaySeconds: 30,
    impact: 'medium',
    impactDelayMs: 740,
    cpuUsageAtBoot: '7.1%',
    diskIoAtBoot: '18.9 MB/s',
    signature: 'trusted_ca',
    category: 'communication',
    description: 'Workplace chat and presence client with staggered 30s launch timer.',
    recommendation: 'safe_to_delay',
    checkpoints: [
      'Configured with 30-second delay via KNOuX Smart-Delay engine',
      'Smoothly yields system resources during initial desktop load'
    ]
  },
  {
    id: 'item-security',
    name: 'Windows Security Systray',
    publisher: 'Microsoft Windows',
    command: '"%windir%\\system32\\SecurityHealthSystray.exe"',
    executablePath: 'C:\\Windows\\System32\\SecurityHealthSystray.exe',
    source: 'registry_hklm',
    sourceLocation: 'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run',
    status: 'enabled',
    delaySeconds: 0,
    impact: 'low',
    impactDelayMs: 90,
    cpuUsageAtBoot: '0.8%',
    diskIoAtBoot: '1.2 MB/s',
    signature: 'microsoft_verified',
    category: 'system',
    description: 'Windows Defender and system protection taskbar status indicator.',
    recommendation: 'caution_system',
    checkpoints: [
      'Critical Microsoft Operating System security component',
      'Protected by KNOuX Guard; modification prohibited to maintain defense in depth'
    ],
    isProtected: true
  },
  {
    id: 'item-powertoys',
    name: 'Microsoft PowerToys Runner',
    publisher: 'Microsoft Corporation',
    command: '"C:\\Program Files\\PowerToys\\PowerToys.exe"',
    executablePath: 'C:\\Program Files\\PowerToys\\PowerToys.exe',
    source: 'startup_folder_user',
    sourceLocation: '%APPDATA%\\Microsoft\\Windows\\Start Menu\\Programs\\Startup\\PowerToys.lnk',
    status: 'enabled',
    delaySeconds: 0,
    impact: 'medium',
    impactDelayMs: 560,
    cpuUsageAtBoot: '4.8%',
    diskIoAtBoot: '12.3 MB/s',
    signature: 'microsoft_verified',
    category: 'system',
    description: 'System productivity utilities including FancyZones, Text Extractor, and Run launcher.',
    recommendation: 'keep_enabled',
    checkpoints: [
      'Official Microsoft PowerToys build',
      'Powers global window tiling shortcuts and quick launcher',
      'Low background idle consumption once initialized'
    ]
  },
  {
    id: 'item-epic',
    name: 'Epic Games Launcher',
    publisher: 'Epic Games Inc.',
    command: '"C:\\Program Files (x86)\\Epic Games\\Launcher\\Portal\\Binaries\\Win64\\EpicGamesLauncher.exe" -Silent',
    executablePath: 'C:\\Program Files (x86)\\Epic Games\\Launcher\\Portal\\Binaries\\Win64\\EpicGamesLauncher.exe',
    source: 'registry_hkcu',
    sourceLocation: 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run',
    status: 'disabled',
    delaySeconds: 0,
    impact: 'high',
    impactDelayMs: 1750,
    cpuUsageAtBoot: '16.5%',
    diskIoAtBoot: '44.8 MB/s',
    signature: 'trusted_ca',
    category: 'gaming',
    description: 'Unreal Engine and game store launcher background service.',
    recommendation: 'safe_to_delay',
    checkpoints: [
      'Disabled via KNOuX Staging',
      'Eliminated 1.75s from boot sequence; start manually when launching games'
    ]
  }
];

export const INITIAL_JOURNAL_LOG: JournalEntry[] = [
  {
    id: 'jn-001',
    timestamp: '2026-10-24 16:42:10',
    itemId: 'item-docker',
    itemName: 'Docker Desktop Engine',
    action: 'disable',
    previousState: 'Enabled (HKCU Run)',
    newState: 'Disabled (Soft-Registry Staging)',
    revertible: true,
    user: 'Administrator (Interactive)',
    journalHash: 'SHA256:7c9e1f...4b8d'
  },
  {
    id: 'item-slack-entry',
    timestamp: '2026-10-24 15:30:05',
    itemId: 'item-slack',
    itemName: 'Slack Helper Daemon',
    action: 'delay',
    previousState: 'Enabled (Instant)',
    newState: 'Delayed (+30s Staggered)',
    revertible: true,
    user: 'Administrator (Interactive)',
    journalHash: 'SHA256:3a4b9c...8f12'
  },
  {
    id: 'jn-003',
    timestamp: '2026-10-24 14:15:22',
    itemId: 'item-epic',
    itemName: 'Epic Games Launcher',
    action: 'disable',
    previousState: 'Enabled (HKCU Run)',
    newState: 'Disabled (Safe Staging)',
    revertible: true,
    user: 'Administrator (Interactive)',
    journalHash: 'SHA256:d84e2a...91ce'
  }
];

export const STARTUP_SERVICES_CATALOG: StartupServiceMeta[] = [
  {
    id: 'service-overview',
    serviceKey: 'startup-overview',
    name: 'Boot Sequence Overview',
    subtitle: 'Inspect firmware, kernel, driver, and logon timeline stages with health telemetry',
    iconName: 'Activity',
    colorTheme: 'cyan',
    category: 'analysis'
  },
  {
    id: 'service-disable',
    serviceKey: 'startup-disable',
    name: 'Non-Destructive Disable',
    subtitle: 'Safely suspend autostart items without deleting registry keys or tasks',
    iconName: 'PowerOff',
    colorTheme: 'purple',
    category: 'control'
  },
  {
    id: 'service-restore',
    serviceKey: 'startup-restore',
    name: 'Rollback & Restore Engine',
    subtitle: 'Instant 1-click recovery of startup configurations from snapshot journals',
    iconName: 'RotateCcw',
    colorTheme: 'emerald',
    category: 'safety'
  },
  {
    id: 'service-sources',
    serviceKey: 'startup-sources',
    name: 'Multi-Source Explorer',
    subtitle: 'Deep inspection of HKLM, HKCU, Task Scheduler, and Startup folders',
    iconName: 'FolderTree',
    colorTheme: 'blue',
    category: 'analysis'
  },
  {
    id: 'service-journal',
    serviceKey: 'startup-journal',
    name: 'Audit Trail & Boot Journal',
    subtitle: 'Cryptographically hashed history of all boot modifications and state changes',
    iconName: 'FileCheck',
    colorTheme: 'purple',
    category: 'safety'
  },
  {
    id: 'service-filter',
    serviceKey: 'startup-filter',
    name: 'Advanced Rule-Based Filter',
    subtitle: 'Filter startup inventory by signature validity, impact latency, or origin',
    iconName: 'Filter',
    colorTheme: 'cyan',
    category: 'analysis'
  },
  {
    id: 'service-impact',
    serviceKey: 'startup-impact',
    name: 'Boot Impact Analyzer',
    subtitle: 'Measure CPU cycles, disk I/O throughput, and process launch latency',
    iconName: 'Gauge',
    colorTheme: 'amber',
    category: 'analysis'
  },
  {
    id: 'service-services',
    serviceKey: 'startup-services',
    name: 'Windows Services Manager',
    subtitle: 'Configure Delayed Auto-Start for third-party background Windows services',
    iconName: 'Cog',
    colorTheme: 'blue',
    category: 'control'
  },
  {
    id: 'service-tasks',
    serviceKey: 'startup-tasks',
    name: 'Task Scheduler Triggers',
    subtitle: 'Control autostart scheduled tasks triggered at logon or system startup',
    iconName: 'CalendarClock',
    colorTheme: 'purple',
    category: 'control'
  },
  {
    id: 'service-delay',
    serviceKey: 'startup-delay',
    name: 'Smart Launch Staggering',
    subtitle: 'Configure intelligent delay queues (+15s, +30s, +60s) to eliminate CPU spikes',
    iconName: 'Clock',
    colorTheme: 'amber',
    category: 'control'
  },
  {
    id: 'service-batch',
    serviceKey: 'startup-batch',
    name: 'Batch Optimization Profiles',
    subtitle: 'One-click safe optimization profiles (Gaming, Workstation, Clean Boot)',
    iconName: 'Sparkles',
    colorTheme: 'rose',
    category: 'automation'
  },
  {
    id: 'service-undo-all',
    serviceKey: 'startup-undo-all',
    name: 'Emergency Global Revert',
    subtitle: 'Revert all staged modifications back to default Windows state instantaneously',
    iconName: 'ShieldAlert',
    colorTheme: 'rose',
    category: 'safety'
  }
];
