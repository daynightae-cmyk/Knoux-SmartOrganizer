/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface VolumeItem {
  id: string;
  letter: string;
  name: string;
  filesystem: string;
  totalBytes: number;
  usedBytes: number;
  freeBytes: number;
  totalDisplay: string;
  usedDisplay: string;
  freeDisplay: string;
  usedPercent: number;
  freePercent: number;
  isLowSpace: boolean;
  physicalDevice: string;
  filesCount: number;
  foldersCount: number;
  scanTimestamp: string;
  scanSource: string;
  metadataLimitations: string;
  statusText: string;
}

export interface MetricCard {
  id: string;
  value: string;
  label: string;
  iconName: 'drive' | 'database' | 'pie' | 'warning' | 'server';
  isAlert?: boolean;
}

export interface TreemapNode {
  id: string;
  name: string;
  sizeDisplay: string;
  sizeBytes: number;
  color: string;
  borderColor?: string;
  children?: TreemapNode[];
  flexWeight: number;
}

export interface LargestFileItem {
  id: string;
  name: string;
  size: string;
  sizeBytes: number;
  type: string;
  iconType: 'disk-image' | 'vhd' | 'folder' | 'archive' | 'music' | 'camera';
}

export interface StorageServiceMeta {
  id: string;
  serviceKey: string;
  name: string;
  subtitle: string;
  iconName: string;
  tag: string;
}

export const INITIAL_STORAGE_METRICS: MetricCard[] = [
  {
    id: 'connected-volumes',
    value: '3',
    label: 'Connected Volumes',
    iconName: 'drive'
  },
  {
    id: 'measured-capacity',
    value: '3.72 TB',
    label: 'Measured Capacity',
    iconName: 'database'
  },
  {
    id: 'available-space',
    value: '1.28 TB',
    label: 'Available Space',
    iconName: 'pie'
  },
  {
    id: 'low-space-volumes',
    value: '1',
    label: 'Low-Space Volumes',
    iconName: 'warning',
    isAlert: true
  },
  {
    id: 'physical-drives',
    value: '2',
    label: 'Physical Drives',
    iconName: 'server'
  }
];

export const INITIAL_VOLUMES: VolumeItem[] = [
  {
    id: 'vol-c',
    letter: 'C:',
    name: 'Windows',
    filesystem: 'NTFS',
    totalBytes: 511101108224, // 476 GB
    usedBytes: 405443274752,  // 377.6 GB
    freeBytes: 105657833472,  // 98.4 GB
    totalDisplay: '476 GB',
    usedDisplay: '377.6 GB',
    freeDisplay: '98.4 GB',
    usedPercent: 79.3,
    freePercent: 20.7,
    isLowSpace: true,
    physicalDevice: 'Disk 0 (NVMe SSD, 512 GB)',
    filesCount: 336482,
    foldersCount: 67219,
    scanTimestamp: 'Mar 9, 2025 10:24 PM',
    scanSource: 'Live volume scan',
    metadataLimitations: 'Some system files restricted (Administrator privileges)',
    statusText: 'All analysis actions available'
  },
  {
    id: 'vol-d',
    letter: 'D:',
    name: 'Data',
    filesystem: 'NTFS',
    totalBytes: 1954316713984, // 1.82 TB
    usedBytes: 1301072486400,  // 1.21 TB
    freeBytes: 653244227584,   // 608 GB
    totalDisplay: '1.82 TB',
    usedDisplay: '1.21 TB',
    freeDisplay: '608 GB',
    usedPercent: 66.4,
    freePercent: 33.6,
    isLowSpace: false,
    physicalDevice: 'Disk 1 (SATA SSD, 2.00 TB)',
    filesCount: 712940,
    foldersCount: 41802,
    scanTimestamp: 'Mar 9, 2025 09:12 PM',
    scanSource: 'Live volume scan',
    metadataLimitations: 'Full volume permissions granted',
    statusText: 'All analysis actions available'
  },
  {
    id: 'vol-e',
    letter: 'E:',
    name: 'Projects',
    filesystem: 'exFAT',
    totalBytes: 999653638144, // 931 GB
    usedBytes: 374720114688,  // 349 GB
    freeBytes: 624933523456,  // 582 GB
    totalDisplay: '931 GB',
    usedDisplay: '349 GB',
    freeDisplay: '582 GB',
    usedPercent: 37.5,
    freePercent: 62.5,
    isLowSpace: false,
    physicalDevice: 'Disk 1 (SATA SSD, 2.00 TB, Partition 2)',
    filesCount: 199210,
    foldersCount: 14208,
    scanTimestamp: 'Mar 8, 2025 04:30 PM',
    scanSource: 'Live volume scan',
    metadataLimitations: 'exFAT - No file permission ACLs',
    statusText: 'All analysis actions available'
  }
];

export const INITIAL_TREEMAP_DATA: TreemapNode[] = [
  {
    id: 'node-windows',
    name: 'Windows',
    sizeDisplay: '93.6 GB',
    sizeBytes: 100502667264,
    color: '#1d4ed8',
    borderColor: '#3b82f6',
    flexWeight: 93,
    children: [
      { id: 'win-sys32', name: 'System32', sizeDisplay: '31.2 GB', sizeBytes: 33500000000, color: '#2563eb', flexWeight: 31 },
      { id: 'win-winsxs', name: 'WinSxS', sizeDisplay: '24.1 GB', sizeBytes: 25800000000, color: '#1d4ed8', flexWeight: 24 },
      { id: 'win-install', name: 'Installer', sizeDisplay: '18.4 GB', sizeBytes: 19700000000, color: '#1e40af', flexWeight: 18 },
      { id: 'win-other', name: 'System Core', sizeDisplay: '19.9 GB', sizeBytes: 21300000000, color: '#172554', flexWeight: 20 }
    ]
  },
  {
    id: 'node-users',
    name: 'Users',
    sizeDisplay: '76.2 GB',
    sizeBytes: 81818976256,
    color: '#7c3aed',
    borderColor: '#8b5cf6',
    flexWeight: 76,
    children: [
      {
        id: 'usr-alex',
        name: 'Alex',
        sizeDisplay: '58.4 GB',
        sizeBytes: 62706352128,
        color: '#6d28d9',
        borderColor: '#a78bfa',
        flexWeight: 58,
        children: [
          { id: 'usr-alex-doc', name: 'Documents', sizeDisplay: '24.8 GB', sizeBytes: 26627000000, color: '#5b21b6', flexWeight: 25 },
          { id: 'usr-alex-app', name: 'AppData', sizeDisplay: '19.2 GB', sizeBytes: 20615000000, color: '#4c1d95', flexWeight: 19 },
          { id: 'usr-alex-vid', name: 'Videos', sizeDisplay: '14.4 GB', sizeBytes: 15462000000, color: '#3b0764', flexWeight: 14 }
        ]
      },
      { id: 'usr-public', name: 'Public', sizeDisplay: '12.1 GB', sizeBytes: 12992282624, color: '#5b21b6', flexWeight: 12 },
      { id: 'usr-shared', name: 'Default / Shared', sizeDisplay: '5.7 GB', sizeBytes: 6120341504, color: '#4c1d95', flexWeight: 6 }
    ]
  },
  {
    id: 'node-progfiles',
    name: 'Program Files',
    sizeDisplay: '62.9 GB',
    sizeBytes: 67537616896,
    color: '#059669',
    borderColor: '#10b981',
    flexWeight: 63,
    children: [
      { id: 'pf-epic', name: 'Epic Games', sizeDisplay: '26.4 GB', sizeBytes: 28345000000, color: '#047857', flexWeight: 26 },
      { id: 'pf-adobe', name: 'Adobe', sizeDisplay: '18.1 GB', sizeBytes: 19434000000, color: '#065f46', flexWeight: 18 },
      { id: 'pf-common', name: 'Common Files', sizeDisplay: '10.2 GB', sizeBytes: 10952000000, color: '#064e3b', flexWeight: 10 },
      { id: 'pf-other', name: 'Other Apps', sizeDisplay: '8.2 GB', sizeBytes: 8805000000, color: '#022c22', flexWeight: 8 }
    ]
  },
  {
    id: 'node-progfiles86',
    name: 'Program Files (x86)',
    sizeDisplay: '34.7 GB',
    sizeBytes: 37258334208,
    color: '#d97706',
    borderColor: '#f59e0b',
    flexWeight: 35,
    children: [
      { id: 'pf86-steam', name: 'Steam', sizeDisplay: '21.5 GB', sizeBytes: 23085000000, color: '#b45309', flexWeight: 22 },
      { id: 'pf86-ms', name: 'Microsoft', sizeDisplay: '7.8 GB', sizeBytes: 837500000, color: '#92400e', flexWeight: 8 },
      { id: 'pf86-other', name: 'Legacy Utilities', sizeDisplay: '5.4 GB', sizeBytes: 5798000000, color: '#78350f', flexWeight: 5 }
    ]
  },
  {
    id: 'node-progdata',
    name: 'ProgramData',
    sizeDisplay: '28.1 GB',
    sizeBytes: 30172459008,
    color: '#dc2626',
    borderColor: '#ef4444',
    flexWeight: 28,
    children: [
      { id: 'pd-packages', name: 'Package Cache', sizeDisplay: '14.2 GB', sizeBytes: 15247000000, color: '#b91c1c', flexWeight: 14 },
      { id: 'pd-defender', name: 'Security Defs', sizeDisplay: '8.1 GB', sizeBytes: 8697000000, color: '#991b1b', flexWeight: 8 },
      { id: 'pd-logs', name: 'Application Logs', sizeDisplay: '5.8 GB', sizeBytes: 6228000000, color: '#7f1d1d', flexWeight: 6 }
    ]
  },
  {
    id: 'node-pagefile',
    name: 'pagefile.sys',
    sizeDisplay: '16.0 GB',
    sizeBytes: 17179869184,
    color: '#65a30d',
    borderColor: '#84cc16',
    flexWeight: 16
  },
  {
    id: 'node-hiberfil',
    name: 'hiberfil.sys',
    sizeDisplay: '12.6 GB',
    sizeBytes: 13529146982,
    color: '#0891b2',
    borderColor: '#06b6d4',
    flexWeight: 13
  },
  {
    id: 'node-other',
    name: 'Other',
    sizeDisplay: '54.1 GB',
    sizeBytes: 58090000000,
    color: '#475569',
    borderColor: '#64748b',
    flexWeight: 54,
    children: [
      { id: 'oth-swap', name: 'swapfile.sys', sizeDisplay: '0.5 GB', sizeBytes: 536870912, color: '#334155', flexWeight: 1 },
      { id: 'oth-sysvol', name: 'System Volume Information', sizeDisplay: '22.4 GB', sizeBytes: 24051810304, color: '#1e293b', flexWeight: 22 },
      { id: 'oth-recovery', name: 'Recovery Partition', sizeDisplay: '1.2 GB', sizeBytes: 1288490188, color: '#0f172a', flexWeight: 1 },
      { id: 'oth-misc', name: 'Unindexed Sectors', sizeDisplay: '30.0 GB', sizeBytes: 32212254720, color: '#334155', flexWeight: 30 }
    ]
  }
];

export const INITIAL_LARGEST_ITEMS: LargestFileItem[] = [
  {
    id: 'item-1',
    name: 'Windows.iso',
    size: '24.8 GB',
    sizeBytes: 26627000000,
    type: 'Disk Image',
    iconType: 'disk-image'
  },
  {
    id: 'item-2',
    name: 'VirtualMachine.vhdx',
    size: '18.4 GB',
    sizeBytes: 19756000000,
    type: 'Hard Disk Image',
    iconType: 'vhd'
  },
  {
    id: 'item-3',
    name: 'Premiere Projects',
    size: '12.1 GB',
    sizeBytes: 12992000000,
    type: 'File folder',
    iconType: 'folder'
  },
  {
    id: 'item-4',
    name: 'Backup 2024',
    size: '9.6 GB',
    sizeBytes: 10307000000,
    type: 'File folder',
    iconType: 'folder'
  },
  {
    id: 'item-5',
    name: 'Photos Library',
    size: '8.9 GB',
    sizeBytes: 9556000000,
    type: 'File folder',
    iconType: 'folder'
  },
  {
    id: 'item-6',
    name: 'Archive.zip',
    size: '6.7 GB',
    sizeBytes: 7194000000,
    type: 'Compressed (ZIP)',
    iconType: 'archive'
  },
  {
    id: 'item-7',
    name: 'UE5',
    size: '5.4 GB',
    sizeBytes: 5798000000,
    type: 'File folder',
    iconType: 'folder'
  },
  {
    id: 'item-8',
    name: 'Installers',
    size: '4.8 GB',
    sizeBytes: 5153000000,
    type: 'File folder',
    iconType: 'folder'
  },
  {
    id: 'item-9',
    name: 'Camera Raw',
    size: '4.1 GB',
    sizeBytes: 4402000000,
    type: 'File folder',
    iconType: 'folder'
  },
  {
    id: 'item-10',
    name: 'Music Library',
    size: '3.9 GB',
    sizeBytes: 4187000000,
    type: 'File folder',
    iconType: 'folder'
  }
];

export const STORAGE_SERVICES_CATALOG: StorageServiceMeta[] = [
  {
    id: 'srv-overview',
    serviceKey: 'storage-disks',
    name: 'Volume Overview',
    subtitle: 'Key metrics & usage',
    iconName: 'PieChart',
    tag: 'Core'
  },
  {
    id: 'srv-large',
    serviceKey: 'storage-large-files',
    name: 'Largest Files',
    subtitle: 'Find space hogs',
    iconName: 'Scale',
    tag: 'Triage'
  },
  {
    id: 'srv-duplicates',
    serviceKey: 'storage-duplicates',
    name: 'Duplicate Files',
    subtitle: 'Reclaim wasted space',
    iconName: 'Copy',
    tag: 'Reclaim'
  },
  {
    id: 'srv-treemap',
    serviceKey: 'storage-treemap',
    name: 'Space Treemap',
    subtitle: 'Visualize at a glance',
    iconName: 'LayoutGrid',
    tag: 'Visual'
  },
  {
    id: 'srv-folders',
    serviceKey: 'storage-top-folders',
    name: 'Largest Folders',
    subtitle: 'Drill into big folders',
    iconName: 'FolderTree',
    tag: 'Explorer'
  },
  {
    id: 'srv-filetypes',
    serviceKey: 'storage-filetypes',
    name: 'File Type Distribution',
    subtitle: 'See what fills your drive',
    iconName: 'Shapes',
    tag: 'Analytics'
  },
  {
    id: 'srv-scan',
    serviceKey: 'storage-scan-overview',
    name: 'Scan Coverage',
    subtitle: "What's been analyzed",
    iconName: 'ScanLine',
    tag: 'Telemetry'
  },
  {
    id: 'srv-fragmentation',
    serviceKey: 'storage-fragmentation',
    name: 'Fragmentation Inspector',
    subtitle: 'File layout & performance',
    iconName: 'Boxes',
    tag: 'Health'
  },
  {
    id: 'srv-smart',
    serviceKey: 'storage-smart',
    name: 'Disk Health',
    subtitle: 'S.M.A.R.T. insights',
    iconName: 'Activity',
    tag: 'Sensors'
  },
  {
    id: 'srv-reclaim',
    serviceKey: 'storage-reclaim',
    name: 'Space Reclaim Planner',
    subtitle: 'Get cleanup suggestions',
    iconName: 'Sparkles',
    tag: 'Action'
  },
  {
    id: 'srv-history',
    serviceKey: 'storage-history',
    name: 'Storage History',
    subtitle: 'Track usage over time',
    iconName: 'LineChart',
    tag: 'Trends'
  },
  {
    id: 'srv-removable',
    serviceKey: 'storage-removable',
    name: 'Removable Drives',
    subtitle: 'USB, SD and external',
    iconName: 'Usb',
    tag: 'Hardware'
  }
];
