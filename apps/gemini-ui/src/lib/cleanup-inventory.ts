/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type SafetyLevel = 'safe' | 'review-recommended' | 'review-required';

export interface CleanupCandidate {
  id: string;
  name: string;
  path: string;
  source: string;
  sourceIcon: 'chrome' | 'windows' | 'teams' | 'adobe' | 'download' | 'recycle' | 'folder';
  ageDisplay: string;
  sizeDisplay: string;
  sizeBytes: number;
  safety: SafetyLevel;
  safetyLabel: string;
  category: 'temporary' | 'residues' | 'logs' | 'browser' | 'downloads' | 'recycle';
  itemCount: number;
  recoverability: string;
  userImpact: string;
  permissionRequired: string;
  checkpoints: string[];
}

export interface CleanupMetric {
  id: string;
  value: string;
  label: string;
  subtext: string;
  type: 'coverage' | 'candidates' | 'recovery' | 'review';
  isAlert?: boolean;
}

export interface BreakdownSegment {
  id: string;
  label: string;
  percentage: number;
  sizeDisplay: string;
  color: string;
}

export interface CleanupServiceMeta {
  id: string;
  serviceKey: string;
  name: string;
  subtitle: string;
  iconName: string;
  colorTheme: 'purple' | 'coral' | 'teal' | 'amber' | 'blue' | 'emerald';
}

export const INITIAL_CLEANUP_METRICS: CleanupMetric[] = [
  {
    id: 'scan-coverage',
    value: '92%',
    label: 'Scan Coverage',
    subtext: '1,842,651 items analyzed',
    type: 'coverage'
  },
  {
    id: 'candidate-files',
    value: '24,893',
    label: 'Candidate Files',
    subtext: 'across 7 categories',
    type: 'candidates'
  },
  {
    id: 'potential-recovery',
    value: '8.46 GB',
    label: 'Potential Space Recovery',
    subtext: 'Estimated reclaimable space',
    type: 'recovery'
  },
  {
    id: 'items-review',
    value: '317',
    label: 'Items Requiring Review',
    subtext: 'May affect apps or system behavior',
    type: 'review',
    isAlert: true
  }
];

export const CATEGORY_BREAKDOWN_BAR: BreakdownSegment[] = [
  {
    id: 'seg-temp',
    label: 'Temporary Files',
    percentage: 33.8,
    sizeDisplay: '8.42 GB',
    color: '#38bdf8' // sky blue
  },
  {
    id: 'seg-residues',
    label: 'Application Residues',
    percentage: 18.7,
    sizeDisplay: '4.65 GB',
    color: '#a855f7' // purple
  },
  {
    id: 'seg-logs',
    label: 'System Logs',
    percentage: 12.4,
    sizeDisplay: '2.06 GB',
    color: '#fbbf24' // amber yellow
  },
  {
    id: 'seg-browser',
    label: 'Browser Cache',
    percentage: 20.1,
    sizeDisplay: '3.76 GB',
    color: '#2dd4bf' // cyan teal
  },
  {
    id: 'seg-downloads',
    label: 'Downloads',
    percentage: 9.8,
    sizeDisplay: '1.63 GB',
    color: '#f43f5e' // rose pink
  },
  {
    id: 'seg-recycle',
    label: 'Recycle Bin',
    percentage: 5.2,
    sizeDisplay: '1.10 GB',
    color: '#64748b' // slate gray
  }
];

export const CLEANUP_CANDIDATES_FIXTURE: CleanupCandidate[] = [
  {
    id: 'cand-1',
    name: 'Chrome Cache Files',
    path: 'C:\\Users\\Alex\\AppData\\Local\\Google\\Chrome\\...\\Cache',
    source: 'Browser Cache',
    sourceIcon: 'chrome',
    ageDisplay: '2 days',
    sizeDisplay: '1.24 GB',
    sizeBytes: 1331560448,
    safety: 'safe',
    safetyLabel: 'Safe to Clean',
    category: 'browser',
    itemCount: 247,
    recoverability: 'Easily recoverable (via browser rebuild)',
    userImpact: 'No impact on personal files. Websites may re-download when next visited.',
    permissionRequired: 'Standard user (no elevation required)',
    checkpoints: [
      'Files are temporary cache data',
      'No personal documents detected',
      'Not required for Windows or installed apps',
      'Can be safely recreated by the application'
    ]
  },
  {
    id: 'cand-2',
    name: 'Windows Update Download Cache',
    path: 'C:\\Windows\\SoftwareDistribution\\Download',
    source: 'Windows Update',
    sourceIcon: 'windows',
    ageDisplay: '12 days',
    sizeDisplay: '892 MB',
    sizeBytes: 935329792,
    safety: 'safe',
    safetyLabel: 'Safe to Clean',
    category: 'temporary',
    itemCount: 142,
    recoverability: 'Re-downloadable via Windows Update service',
    userImpact: 'No impact. Completed update installation packages already committed.',
    permissionRequired: 'Administrator privileges (UAC prompt on execute)',
    checkpoints: [
      'Successfully installed update packages',
      'Superseded manifest references confirmed',
      'Windows servicing stack verified intact'
    ]
  },
  {
    id: 'cand-3',
    name: 'Microsoft Teams - Cache',
    path: 'C:\\Users\\Alex\\AppData\\Local\\Packages\\MSTeams\\Cache',
    source: 'Application Residue',
    sourceIcon: 'teams',
    ageDisplay: '6 days',
    sizeDisplay: '412 MB',
    sizeBytes: 432013312,
    safety: 'safe',
    safetyLabel: 'Safe to Clean',
    category: 'residues',
    itemCount: 1890,
    recoverability: 'Cached profile avatars and message thumbnails will refresh',
    userImpact: 'Teams may take 2-3 seconds longer to open during first restart.',
    permissionRequired: 'Standard user (no elevation required)',
    checkpoints: [
      'No chat history or credentials deleted',
      'Local avatar thumbnail blobs only',
      'Electron IndexedDB state untouched'
    ]
  },
  {
    id: 'cand-4',
    name: 'Adobe Installer Logs',
    path: 'C:\\ProgramData\\Adobe\\Setup Logs',
    source: 'System Logs',
    sourceIcon: 'adobe',
    ageDisplay: '18 days',
    sizeDisplay: '221 MB',
    sizeBytes: 231735296,
    safety: 'review-recommended',
    safetyLabel: 'Review Recommended',
    category: 'logs',
    itemCount: 38,
    recoverability: 'Non-recoverable text diagnostics',
    userImpact: 'Diagnostic setup logs. Only needed if debugging a failed Adobe setup.',
    permissionRequired: 'Standard user (no elevation required)',
    checkpoints: [
      'Setup process completed over 14 days ago',
      'No active installation transactions',
      'Contains detailed setup error trace logs'
    ]
  },
  {
    id: 'cand-5',
    name: 'Old Downloads',
    path: 'C:\\Users\\Alex\\Downloads',
    source: 'Downloads',
    sourceIcon: 'download',
    ageDisplay: '45 days',
    sizeDisplay: '1.13 GB',
    sizeBytes: 1213349888,
    safety: 'review-required',
    safetyLabel: 'Review Required',
    category: 'downloads',
    itemCount: 317,
    recoverability: 'Irreversible unless moved to Recycle Bin',
    userImpact: 'May contain downloaded PDFs, installers, or personal files.',
    permissionRequired: 'Standard user',
    checkpoints: [
      'User files located in personal Downloads folder',
      'Inactive for over 30 days',
      'Requires explicit user confirmation before deletion'
    ]
  },
  {
    id: 'cand-6',
    name: 'Recycle Bin Contents',
    path: 'C:\\$Recycle.Bin',
    source: 'Recycle Bin',
    sourceIcon: 'recycle',
    ageDisplay: 'Varies',
    sizeDisplay: '1.10 GB',
    sizeBytes: 1181116006,
    safety: 'safe',
    safetyLabel: 'Safe to Clean',
    category: 'recycle',
    itemCount: 434,
    recoverability: 'Permanent deletion from local storage',
    userImpact: 'Files previously deleted by user will be purged from the disk.',
    permissionRequired: 'Standard user',
    checkpoints: [
      'Items already discarded by user',
      'Frees unallocated space immediately'
    ]
  }
];

export const CLEANUP_SERVICES_CATALOG: CleanupServiceMeta[] = [
  {
    id: 'srv-temp-prev',
    serviceKey: 'cleanup-temp-preview',
    name: 'Temporary File Preview',
    subtitle: 'Inspect and clean temp files',
    iconName: 'FileText',
    colorTheme: 'purple'
  },
  {
    id: 'srv-temp-quar',
    serviceKey: 'cleanup-temp-quarantine',
    name: 'Quarantine Cleanup',
    subtitle: 'Safely remove quarantined items',
    iconName: 'ShieldAlert',
    colorTheme: 'coral'
  },
  {
    id: 'srv-temp-undo',
    serviceKey: 'cleanup-temp-undo',
    name: 'Undo Cleanup',
    subtitle: 'Restore previously cleaned items',
    iconName: 'RotateCcw',
    colorTheme: 'emerald'
  },
  {
    id: 'srv-quar-list',
    serviceKey: 'cleanup-quarantine-list',
    name: 'Quarantine Browser',
    subtitle: 'Isolate and clean browser data',
    iconName: 'Layers',
    colorTheme: 'purple'
  },
  {
    id: 'srv-reclaim-est',
    serviceKey: 'cleanup-estimate',
    name: 'Reclaim Estimate',
    subtitle: 'Detailed space recovery analysis',
    iconName: 'Coins',
    colorTheme: 'amber'
  },
  {
    id: 'srv-recycle-bin',
    serviceKey: 'cleanup-recycle',
    name: 'Recycle Bin',
    subtitle: 'Manage recycle bin contents',
    iconName: 'Trash2',
    colorTheme: 'blue'
  },
  {
    id: 'srv-unused-items',
    serviceKey: 'cleanup-unused',
    name: 'Unused Items',
    subtitle: 'Find rarely used files and apps',
    iconName: 'Sparkles',
    colorTheme: 'purple'
  },
  {
    id: 'srv-update-cache',
    serviceKey: 'cleanup-update-cache',
    name: 'Windows Update Cache',
    subtitle: 'Clean update download files',
    iconName: 'DownloadCloud',
    colorTheme: 'emerald'
  },
  {
    id: 'srv-browser-cache',
    serviceKey: 'cleanup-browser-cache',
    name: 'Browser Cache',
    subtitle: 'Clean cache from all browsers',
    iconName: 'Globe',
    colorTheme: 'blue'
  },
  {
    id: 'srv-logs-exp',
    serviceKey: 'cleanup-logs',
    name: 'Log Explorer',
    subtitle: 'Analyze and clean system logs',
    iconName: 'FileCode2',
    colorTheme: 'coral'
  },
  {
    id: 'srv-schedule',
    serviceKey: 'cleanup-schedule',
    name: 'Cleanup Scheduler',
    subtitle: 'Automate cleanup tasks',
    iconName: 'Clock',
    colorTheme: 'amber'
  },
  {
    id: 'srv-reports',
    serviceKey: 'cleanup-reports',
    name: 'Cleanup Reports',
    subtitle: 'View history and detailed reports',
    iconName: 'FileSpreadsheet',
    colorTheme: 'blue'
  }
];
