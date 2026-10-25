/**
 * KNOuX SmartOrganizer — Applications Inventory Types & Data
 * Section 02: Applications / Software Command Center
 */

export type AppInstallScope = 'Per-machine (All users)' | 'Per-user (Current user)' | 'Portable';
export type AppSourceType = 'Microsoft Store' | 'Installer (MSI/EXE)' | 'Winget' | 'Manual';
export type DigitalSignatureStatus = 'valid' | 'unsigned' | 'self_signed' | 'expired';
export type AppCategory = 'browser' | 'productivity' | 'developer' | 'utility' | 'media' | 'social' | 'system';
export type TabFilter = 'all' | 'desktop' | 'packaged' | 'recent' | 'large';

export interface InstalledAppItem {
  id: string;
  name: string;
  publisher: string;
  version: string;
  installedOn: string;
  sizeBytes: number;
  sizeFormatted: string;
  scope: AppInstallScope;
  source: AppSourceType;
  installLocation: string;
  executablePath: string;
  digitalSignature: {
    status: DigitalSignatureStatus;
    signerName: string;
    verified: boolean;
    thumbprint?: string;
  };
  category: AppCategory;
  isPackaged: boolean;
  isRecent: boolean;
  isLarge: boolean; // > 1 GB
  hasUpdate: boolean;
  updateVersion?: string;
  canRepair: boolean;
  canModify: boolean;
  canUninstall: boolean;
  startupImpact?: 'High' | 'Medium' | 'Low' | 'None';
  leftoverTracesCount?: number;
  history: Array<{
    date: string;
    event: string;
    verified: boolean;
  }>;
}

export interface SoftwareCommandMetrics {
  installedAppsCount: number;
  installedAppsChange: string; // e.g. "+6 this month"
  publishersCount: number;
  publishersSubtitle: string; // "Trusted & verified"
  availableMaintenanceCount: number;
  maintenanceBreakdown: string; // "3 repair • 5 update • 4 cleanup"
  pendingUpdatesCount: number;
  pendingUpdatesBreakdown: string; // "2 critical • 5 recommended"
  softwareStorageFormatted: string; // "48.6 GB"
  storagePercentageOfDrive: string; // "12% of system drive"
}

export type DomainServiceKey =
  | 'app-inventory'
  | 'app-identity'
  | 'app-search'
  | 'app-publisher'
  | 'app-recent'
  | 'app-uninstall-queue'
  | 'app-leftovers'
  | 'app-updates'
  | 'app-size'
  | 'app-store-packages'
  | 'app-associations'
  | 'app-startup-impact';

export interface DomainServiceMeta {
  key: DomainServiceKey;
  labelEn: string;
  labelAr: string;
  descEn: string;
  descAr: string;
  iconName: string;
  color: string;
}

export const DOMAIN_SERVICES_META: DomainServiceMeta[] = [
  {
    key: 'app-inventory',
    labelEn: 'Installed Applications',
    labelAr: 'التطبيقات المثبتة',
    descEn: 'View and manage all apps',
    descAr: 'عرض وإدارة جميع التطبيقات',
    iconName: 'LayoutGrid',
    color: '#2476ff',
  },
  {
    key: 'app-identity',
    labelEn: 'App Identity',
    labelAr: 'هوية التطبيق',
    descEn: 'Verify signatures & trust',
    descAr: 'التحقق من التواقيع والموثوقية',
    iconName: 'ShieldCheck',
    color: '#06b6d4',
  },
  {
    key: 'app-search',
    labelEn: 'Advanced Search',
    labelAr: 'البحث المتقدم',
    descEn: 'Find apps with filters',
    descAr: 'البحث عن التطبيقات بتصفية متقدمة',
    iconName: 'Search',
    color: '#3b82f6',
  },
  {
    key: 'app-publisher',
    labelEn: 'Publisher Intelligence',
    labelAr: 'استخبارات الناشرين',
    descEn: 'Insights & reputation',
    descAr: 'تقييم سمعة وموثوقية الناشرين',
    iconName: 'Building2',
    color: '#a855f7',
  },
  {
    key: 'app-recent',
    labelEn: 'Recently Changed Apps',
    labelAr: 'التطبيقات الحديثة',
    descEn: 'Track recent installations',
    descAr: 'تتبع التثبيتات والتحديثات الأخيرة',
    iconName: 'Clock',
    color: '#818cf8',
  },
  {
    key: 'app-uninstall-queue',
    labelEn: 'Uninstall Queue',
    labelAr: 'قائمة إلغاء التثبيت',
    descEn: 'Manage bulk uninstalls',
    descAr: 'إدارة عمليات الإزالة المتعددة بأمان',
    iconName: 'Trash2',
    color: '#ef4444',
  },
  {
    key: 'app-leftovers',
    labelEn: 'Leftover Analysis',
    labelAr: 'تحليل البقايا',
    descEn: 'Find residual files',
    descAr: 'اكتشاف بقايا الملفات وسجلات النظام',
    iconName: 'Sparkles',
    color: '#f59e0b',
  },
  {
    key: 'app-updates',
    labelEn: 'Update Center',
    labelAr: 'مركز التحديثات',
    descEn: 'Check & install updates',
    descAr: 'فحص وتثبيت تحديثات البرامج',
    iconName: 'RefreshCw',
    color: '#26c6ff',
  },
  {
    key: 'app-size',
    labelEn: 'Software Size',
    labelAr: 'حجم البرمجيات',
    descEn: 'Analyze storage usage',
    descAr: 'تحليل استهلاك مساحة التخزين',
    iconName: 'Database',
    color: '#10b981',
  },
  {
    key: 'app-store-packages',
    labelEn: 'Package Center',
    labelAr: 'مركز الحزم',
    descEn: 'Discover popular apps',
    descAr: 'استكشاف وتثبيت حزم البرامج الشائعة',
    iconName: 'Package',
    color: '#eab308',
  },
  {
    key: 'app-associations',
    labelEn: 'File Associations',
    labelAr: 'ارتباطات الملفات',
    descEn: 'Manage default apps',
    descAr: 'إدارة التطبيقات الافتراضية والامتدادات',
    iconName: 'Link',
    color: '#6366f1',
  },
  {
    key: 'app-startup-impact',
    labelEn: 'Startup Impact',
    labelAr: 'تأثير بدء التشغيل',
    descEn: 'See startup influence',
    descAr: 'معرفة تأثير البرامج على إقلاع النظام',
    iconName: 'Zap',
    color: '#f97316',
  },
];

export const INITIAL_METRICS: SoftwareCommandMetrics = {
  installedAppsCount: 358,
  installedAppsChange: '↑ +6 this month',
  publishersCount: 142,
  publishersSubtitle: 'Trusted & verified',
  availableMaintenanceCount: 12,
  maintenanceBreakdown: '3 repair • 5 update • 4 cleanup',
  pendingUpdatesCount: 7,
  pendingUpdatesBreakdown: '2 critical • 5 recommended',
  softwareStorageFormatted: '48.6 GB',
  storagePercentageOfDrive: '12% of system drive',
};

// The exact 12 applications shown in the reference screenshot (REF-02)
export const INSTALLED_APPLICATIONS_FIXTURE: InstalledAppItem[] = [
  {
    id: 'app-edge',
    name: 'Microsoft Edge',
    publisher: 'Microsoft Corporation',
    version: '123.0.2420.65',
    installedOn: '2025-04-10',
    sizeBytes: 819986432,
    sizeFormatted: '782 MB',
    scope: 'Per-machine (All users)',
    source: 'Microsoft Store',
    installLocation: 'C:\\Program Files (x86)\\Microsoft\\Edge',
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    digitalSignature: {
      status: 'valid',
      signerName: 'Microsoft Corporation',
      verified: true,
      thumbprint: '94A1F854D481180F3965EBE14958043685817812',
    },
    category: 'browser',
    isPackaged: true,
    isRecent: true,
    isLarge: false,
    hasUpdate: true,
    updateVersion: '124.0.2478.32',
    canRepair: true,
    canModify: true,
    canUninstall: true,
    startupImpact: 'Medium',
    leftoverTracesCount: 0,
    history: [
      { date: '2025-04-10 10:24', event: 'Updated to 123.0.2420.65', verified: true },
      { date: '2025-03-14 09:11', event: 'Modified installation', verified: true },
      { date: '2025-02-09 18:42', event: 'Installed', verified: true },
    ],
  },
  {
    id: 'app-office365',
    name: 'Microsoft Office 365',
    publisher: 'Microsoft Corporation',
    version: '16.0.17425.20176',
    installedOn: '2025-03-28',
    sizeBytes: 4520796160,
    sizeFormatted: '4.21 GB',
    scope: 'Per-machine (All users)',
    source: 'Installer (MSI/EXE)',
    installLocation: 'C:\\Program Files\\Microsoft Office\\root\\Office16',
    executablePath: 'C:\\Program Files\\Microsoft Office\\root\\Office16\\WINWORD.EXE',
    digitalSignature: {
      status: 'valid',
      signerName: 'Microsoft Corporation',
      verified: true,
    },
    category: 'productivity',
    isPackaged: false,
    isRecent: false,
    isLarge: true,
    hasUpdate: false,
    canRepair: true,
    canModify: true,
    canUninstall: true,
    startupImpact: 'High',
    leftoverTracesCount: 14,
    history: [
      { date: '2025-03-28 14:10', event: 'Updated to 16.0.17425.20176', verified: true },
      { date: '2024-11-15 08:30', event: 'Installed', verified: true },
    ],
  },
  {
    id: 'app-vscode',
    name: 'Visual Studio Code',
    publisher: 'Microsoft Corporation',
    version: '1.89.1',
    installedOn: '2025-04-12',
    sizeBytes: 404750336,
    sizeFormatted: '386 MB',
    scope: 'Per-user (Current user)',
    source: 'Installer (MSI/EXE)',
    installLocation: 'C:\\Users\\Alex\\AppData\\Local\\Programs\\Microsoft VS Code',
    executablePath: 'C:\\Users\\Alex\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe',
    digitalSignature: {
      status: 'valid',
      signerName: 'Microsoft Corporation',
      verified: true,
    },
    category: 'developer',
    isPackaged: false,
    isRecent: true,
    isLarge: false,
    hasUpdate: true,
    updateVersion: '1.89.2',
    canRepair: false,
    canModify: false,
    canUninstall: true,
    startupImpact: 'None',
    leftoverTracesCount: 3,
    history: [
      { date: '2025-04-12 11:05', event: 'Updated to 1.89.1', verified: true },
    ],
  },
  {
    id: 'app-chrome',
    name: 'Google Chrome',
    publisher: 'Google LLC',
    version: '123.0.6312.123',
    installedOn: '2025-04-09',
    sizeBytes: 1127219200,
    sizeFormatted: '1.05 GB',
    scope: 'Per-machine (All users)',
    source: 'Installer (MSI/EXE)',
    installLocation: 'C:\\Program Files\\Google\\Chrome\\Application',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    digitalSignature: {
      status: 'valid',
      signerName: 'Google LLC',
      verified: true,
    },
    category: 'browser',
    isPackaged: false,
    isRecent: true,
    isLarge: true,
    hasUpdate: false,
    canRepair: false,
    canModify: false,
    canUninstall: true,
    startupImpact: 'Medium',
    leftoverTracesCount: 8,
    history: [
      { date: '2025-04-09 16:22', event: 'Updated to 123.0.6312.123', verified: true },
    ],
  },
  {
    id: 'app-notion',
    name: 'Notion',
    publisher: 'Notion Labs, Inc.',
    version: '3.14.2',
    installedOn: '2025-03-20',
    sizeBytes: 332398592,
    sizeFormatted: '317 MB',
    scope: 'Per-user (Current user)',
    source: 'Installer (MSI/EXE)',
    installLocation: 'C:\\Users\\Alex\\AppData\\Local\\Programs\\Notion',
    executablePath: 'C:\\Users\\Alex\\AppData\\Local\\Programs\\Notion\\Notion.exe',
    digitalSignature: {
      status: 'valid',
      signerName: 'Notion Labs, Inc.',
      verified: true,
    },
    category: 'productivity',
    isPackaged: false,
    isRecent: false,
    isLarge: false,
    hasUpdate: false,
    canRepair: false,
    canModify: false,
    canUninstall: true,
    startupImpact: 'Low',
    leftoverTracesCount: 2,
    history: [
      { date: '2025-03-20 18:00', event: 'Updated to 3.14.2', verified: true },
    ],
  },
  {
    id: 'app-discord',
    name: 'Discord',
    publisher: 'Discord Inc.',
    version: '1.0.9031',
    installedOn: '2025-04-14',
    sizeBytes: 373293056,
    sizeFormatted: '356 MB',
    scope: 'Per-user (Current user)',
    source: 'Installer (MSI/EXE)',
    installLocation: 'C:\\Users\\Alex\\AppData\\Local\\Discord',
    executablePath: 'C:\\Users\\Alex\\AppData\\Local\\Discord\\Update.exe',
    digitalSignature: {
      status: 'valid',
      signerName: 'Discord Inc.',
      verified: true,
    },
    category: 'social',
    isPackaged: false,
    isRecent: true,
    isLarge: false,
    hasUpdate: false,
    canRepair: false,
    canModify: false,
    canUninstall: true,
    startupImpact: 'High',
    leftoverTracesCount: 5,
    history: [
      { date: '2025-04-14 09:30', event: 'Updated to 1.0.9031', verified: true },
    ],
  },
  {
    id: 'app-spotify',
    name: 'Spotify',
    publisher: 'Spotify AB',
    version: '1.2.34.982.g0f3ab',
    installedOn: '2025-04-01',
    sizeBytes: 463470592,
    sizeFormatted: '442 MB',
    scope: 'Per-user (Current user)',
    source: 'Microsoft Store',
    installLocation: 'C:\\Users\\Alex\\AppData\\Roaming\\Spotify',
    executablePath: 'C:\\Users\\Alex\\AppData\\Roaming\\Spotify\\Spotify.exe',
    digitalSignature: {
      status: 'valid',
      signerName: 'Spotify AB',
      verified: true,
    },
    category: 'media',
    isPackaged: true,
    isRecent: false,
    isLarge: false,
    hasUpdate: true,
    updateVersion: '1.2.35.100',
    canRepair: false,
    canModify: false,
    canUninstall: true,
    startupImpact: 'Medium',
    leftoverTracesCount: 1,
    history: [
      { date: '2025-04-01 12:45', event: 'Updated to 1.2.34.982.g0f3ab', verified: true },
    ],
  },
  {
    id: 'app-7zip',
    name: '7-Zip',
    publisher: 'Igor Pavlov',
    version: '24.08',
    installedOn: '2025-01-18',
    sizeBytes: 5934899,
    sizeFormatted: '5.66 MB',
    scope: 'Per-machine (All users)',
    source: 'Installer (MSI/EXE)',
    installLocation: 'C:\\Program Files\\7-Zip',
    executablePath: 'C:\\Program Files\\7-Zip\\7zFM.exe',
    digitalSignature: {
      status: 'valid',
      signerName: 'Igor Pavlov',
      verified: true,
    },
    category: 'utility',
    isPackaged: false,
    isRecent: false,
    isLarge: false,
    hasUpdate: false,
    canRepair: false,
    canModify: false,
    canUninstall: true,
    startupImpact: 'None',
    leftoverTracesCount: 0,
    history: [
      { date: '2025-01-18 10:00', event: 'Installed 24.08', verified: true },
    ],
  },
  {
    id: 'app-vlc',
    name: 'VLC media player',
    publisher: 'VideoLAN',
    version: '3.0.20',
    installedOn: '2025-02-11',
    sizeBytes: 187695104,
    sizeFormatted: '179 MB',
    scope: 'Per-machine (All users)',
    source: 'Installer (MSI/EXE)',
    installLocation: 'C:\\Program Files\\VideoLAN\\VLC',
    executablePath: 'C:\\Program Files\\VideoLAN\\VLC\\vlc.exe',
    digitalSignature: {
      status: 'valid',
      signerName: 'VideoLAN',
      verified: true,
    },
    category: 'media',
    isPackaged: false,
    isRecent: false,
    isLarge: false,
    hasUpdate: true,
    updateVersion: '3.0.21',
    canRepair: false,
    canModify: false,
    canUninstall: true,
    startupImpact: 'None',
    leftoverTracesCount: 2,
    history: [
      { date: '2025-02-11 15:30', event: 'Installed 3.0.20', verified: true },
    ],
  },
  {
    id: 'app-sharex',
    name: 'ShareX',
    publisher: 'ShareX Team',
    version: '16.1.0',
    installedOn: '2025-04-05',
    sizeBytes: 36490444,
    sizeFormatted: '34.8 MB',
    scope: 'Per-user (Current user)',
    source: 'Microsoft Store',
    installLocation: 'C:\\Program Files\\ShareX',
    executablePath: 'C:\\Program Files\\ShareX\\ShareX.exe',
    digitalSignature: {
      status: 'valid',
      signerName: 'ShareX Team',
      verified: true,
    },
    category: 'utility',
    isPackaged: true,
    isRecent: true,
    isLarge: false,
    hasUpdate: false,
    canRepair: false,
    canModify: false,
    canUninstall: true,
    startupImpact: 'Medium',
    leftoverTracesCount: 1,
    history: [
      { date: '2025-04-05 13:10', event: 'Updated to 16.1.0', verified: true },
    ],
  },
  {
    id: 'app-acrobat',
    name: 'Adobe Acrobat Reader DC',
    publisher: 'Adobe Inc.',
    version: '24.001.20643',
    installedOn: '2025-03-22',
    sizeBytes: 614465536,
    sizeFormatted: '586 MB',
    scope: 'Per-machine (All users)',
    source: 'Installer (MSI/EXE)',
    installLocation: 'C:\\Program Files\\Adobe\\Acrobat DC\\Acrobat',
    executablePath: 'C:\\Program Files\\Adobe\\Acrobat DC\\Acrobat\\Acrobat.exe',
    digitalSignature: {
      status: 'valid',
      signerName: 'Adobe Inc.',
      verified: true,
    },
    category: 'productivity',
    isPackaged: false,
    isRecent: false,
    isLarge: false,
    hasUpdate: true,
    updateVersion: '24.002.20680',
    canRepair: true,
    canModify: false,
    canUninstall: true,
    startupImpact: 'Low',
    leftoverTracesCount: 11,
    history: [
      { date: '2025-03-22 17:40', event: 'Updated to 24.001.20643', verified: true },
    ],
  },
  {
    id: 'app-powertoys',
    name: 'PowerToys (Preview)',
    publisher: 'Microsoft Corporation',
    version: '0.80.1',
    installedOn: '2025-04-08',
    sizeBytes: 274726912,
    sizeFormatted: '262 MB',
    scope: 'Per-user (Current user)',
    source: 'Microsoft Store',
    installLocation: 'C:\\Users\\Alex\\AppData\\Local\\PowerToys',
    executablePath: 'C:\\Users\\Alex\\AppData\\Local\\PowerToys\\PowerToys.exe',
    digitalSignature: {
      status: 'valid',
      signerName: 'Microsoft Corporation',
      verified: true,
    },
    category: 'system',
    isPackaged: true,
    isRecent: true,
    isLarge: false,
    hasUpdate: true,
    updateVersion: '0.80.2',
    canRepair: false,
    canModify: false,
    canUninstall: true,
    startupImpact: 'High',
    leftoverTracesCount: 4,
    history: [
      { date: '2025-04-08 21:15', event: 'Updated to 0.80.1', verified: true },
    ],
  },
];
