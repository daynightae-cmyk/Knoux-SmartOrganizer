/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * KNOuX SmartOrganizer — REF-00 Home Command Center UI Models & Fixtures
 * Matches the canonical Home Command Center reference image (image_9afc3816.png)
 */

export type PageId =
  | 'home'
  | 'scan'
  | 'studio'
  | 'applications'
  | 'files'
  | 'storage'
  | 'cleanup'
  | 'startup'
  | 'system'
  | 'repair'
  | 'services'
  | 'network'
  | 'hardware'
  | 'automation'
  | 'history'
  | 'settings';

export interface DeckTile {
  id: string;
  title: string;
  titleAr: string;
  subtitle: string;
  subtitleAr: string;
  targetPage: PageId;
  accent: 'azure' | 'teal' | 'violet' | 'amber' | 'orange' | 'purple' | 'cyan' | 'coral';
  icon: 'scan' | 'folder' | 'cube' | 'disk' | 'broom' | 'rocket' | 'waveform' | 'wrench';
  tag?: string;
  badge?: string;
  isVisible: boolean;
  order: number;
}

export interface KpiMetric {
  id: string;
  title: string;
  titleAr: string;
  value: string;
  subtext: string;
  subtextAr: string;
  badge?: string;
  badgeColor?: string;
  status: 'optimal' | 'info' | 'warning' | 'alert';
  trend: 'up' | 'down' | 'neutral';
  sparkline: number[];
  color: string;
  targetPage: PageId;
  icon: 'shield' | 'files' | 'database' | 'zap' | 'grid' | 'settings';
}

export interface KnouxInsightData {
  id: string;
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  actionText: string;
  actionTextAr: string;
  detailsText: string;
  detailsTextAr: string;
  reclaimGb: number;
  riskLevel: 'safe' | 'low' | 'moderate';
  targetPage: PageId;
}

export interface HomeActivityItem {
  id: string;
  title: string;
  titleAr: string;
  detail: string;
  detailAr: string;
  timeAgo: string;
  timeAgoAr: string;
  status: 'success' | 'info' | 'warning';
  icon: 'scan' | 'folder' | 'app' | 'startup' | 'repair' | 'service';
  targetPage: PageId;
  isChecked?: boolean;
}

export interface QuickAccessItem {
  id: string;
  name: string;
  path: string;
  category: 'document' | 'spreadsheet' | 'video' | 'picture' | 'archive' | 'folder';
  size: string;
  lastModified: string;
  lastModifiedAr: string;
  isPinned: boolean;
}

export interface StorageVolumeSnapshot {
  id: string;
  letter: string;
  label: string;
  labelAr: string;
  totalBytes: number;
  freeBytes: number;
  totalFormatted: string;
  freeFormatted: string;
  usedFormatted: string;
  usedPercent: number;
  freePercent: number;
  fileSystem: string;
  accentColor: string;
  status: 'healthy' | 'caution' | 'critical';
}

export interface PendingSafeAction {
  id: string;
  title: string;
  titleAr: string;
  scope: string;
  scopeAr: string;
  sizeFormatted: string;
  targetPage: PageId;
  previewSummary: string;
  previewSummaryAr: string;
  safetyLevel: string;
  safetyLevelAr: string;
  itemsCount: number;
  iconType: 'folder' | 'app' | 'browser';
}

export const INITIAL_DECK_TILES: DeckTile[] = [
  {
    id: 'tile-scan',
    title: 'Smart Scan',
    titleAr: 'الفحص الذكي',
    subtitle: 'Analyze & clean',
    subtitleAr: 'فحص وتنظيف شامل',
    targetPage: 'cleanup',
    accent: 'azure',
    icon: 'scan',
    isVisible: true,
    order: 1,
  },
  {
    id: 'tile-studio',
    title: 'Organize Files',
    titleAr: 'تنظيم الملفات',
    subtitle: 'Find & structure',
    subtitleAr: 'بحث وتصنيف ذكي',
    targetPage: 'studio',
    accent: 'teal',
    icon: 'folder',
    isVisible: true,
    order: 2,
  },
  {
    id: 'tile-apps',
    title: 'Applications',
    titleAr: 'التطبيقات',
    subtitle: 'Manage apps',
    subtitleAr: 'إدارة وتحديث البرامج',
    targetPage: 'applications',
    accent: 'violet',
    icon: 'cube',
    isVisible: true,
    order: 3,
  },
  {
    id: 'tile-storage',
    title: 'Storage',
    titleAr: 'التخزين',
    subtitle: 'Explore & analyze',
    subtitleAr: 'استكشاف وتحليل السعة',
    targetPage: 'storage',
    accent: 'amber',
    icon: 'disk',
    isVisible: true,
    order: 4,
  },
  {
    id: 'tile-cleanup',
    title: 'Cleanup',
    titleAr: 'تنظيف المخلفات',
    subtitle: 'Free up space',
    subtitleAr: 'تفريغ المساحة بأمان',
    targetPage: 'cleanup',
    accent: 'orange',
    icon: 'broom',
    isVisible: true,
    order: 5,
  },
  {
    id: 'tile-startup',
    title: 'Startup Control',
    titleAr: 'بدء التشغيل',
    subtitle: 'Optimize boot',
    subtitleAr: 'تسريع الإقلاع وتأخير البرامج',
    targetPage: 'startup',
    accent: 'purple',
    icon: 'rocket',
    isVisible: true,
    order: 6,
  },
  {
    id: 'tile-system',
    title: 'System Live Pulse',
    titleAr: 'نبض النظام الحي',
    subtitle: 'Monitor health',
    subtitleAr: 'مراقبة العتاد والأداء',
    targetPage: 'system',
    accent: 'cyan',
    icon: 'waveform',
    isVisible: true,
    order: 7,
  },
  {
    id: 'tile-repair',
    title: 'Repair Lab',
    titleAr: 'مختبر الصيانة',
    subtitle: 'Diagnose & fix',
    subtitleAr: 'تشخيص وإصلاح المشاكل',
    targetPage: 'repair',
    accent: 'coral',
    icon: 'wrench',
    isVisible: true,
    order: 8,
  },
];

export const INITIAL_KPIS: KpiMetric[] = [
  {
    id: 'kpi-health',
    title: 'System Health',
    titleAr: 'صحة النظام',
    value: '92',
    badge: '● Excellent',
    badgeColor: '#10b981',
    subtext: '+12% this week',
    subtextAr: '+12% هذا الأسبوع',
    status: 'optimal',
    trend: 'up',
    sparkline: [70, 74, 82, 85, 84, 88, 92],
    color: '#10b981',
    targetPage: 'system',
    icon: 'shield',
  },
  {
    id: 'kpi-indexed',
    title: 'Indexed Files',
    titleAr: 'الملفات المفهرسة',
    value: '1,248,632',
    subtext: '+18,392 today',
    subtextAr: '+18,392 اليوم',
    status: 'info',
    trend: 'up',
    sparkline: [12, 18, 14, 24, 20, 26, 30],
    color: '#06b6d4',
    targetPage: 'files',
    icon: 'files',
  },
  {
    id: 'kpi-reclaimable',
    title: 'Space Reclaimable',
    titleAr: 'المساحة القابلة للاسترداد',
    value: '48.6 GB',
    subtext: 'from 1,243 items',
    subtextAr: 'من 1,243 عنصراً',
    status: 'warning',
    trend: 'neutral',
    sparkline: [14, 22, 18, 28, 24, 30, 32],
    color: '#a855f7',
    targetPage: 'cleanup',
    icon: 'database',
  },
  {
    id: 'kpi-automations',
    title: 'Active Automations',
    titleAr: 'المهام المؤتمتة',
    value: '12',
    subtext: '3 ran today',
    subtextAr: '3 تم تشغيلها اليوم',
    status: 'optimal',
    trend: 'up',
    sparkline: [8, 12, 10, 16, 14, 18, 20],
    color: '#10b981',
    targetPage: 'automation',
    icon: 'zap',
  },
  {
    id: 'kpi-apps',
    title: 'Apps Monitored',
    titleAr: 'التطبيقات المراقبة',
    value: '358',
    subtext: '6 updates available',
    subtextAr: '6 تحديثات متاحة',
    status: 'info',
    trend: 'neutral',
    sparkline: [16, 20, 18, 25, 22, 28, 30],
    color: '#3b82f6',
    targetPage: 'applications',
    icon: 'grid',
  },
  {
    id: 'kpi-services',
    title: 'Services Healthy',
    titleAr: 'الخدمات السليمة',
    value: '241 / 271',
    subtext: '89% healthy',
    subtextAr: '89% في حالة عمل ممتازة',
    status: 'optimal',
    trend: 'up',
    sparkline: [20, 24, 22, 28, 26, 30, 32],
    color: '#10b981',
    targetPage: 'services',
    icon: 'settings',
  },
];

export const INITIAL_INSIGHT: KnouxInsightData = {
  id: 'insight-01',
  title: 'You can reclaim up to 48.6 GB of space',
  titleAr: 'يمكنك استرداد حتى 48.6 جيجابايت من المساحة',
  description:
    'Junk files, old system files and unused app data were detected across 1,243 items. Run Smart Scan for a safe cleanup.',
  descriptionAr:
    'تم اكتشاف ملفات مؤقتة ومخلفات برامج قديمة عبر 1,243 عنصراً. قم بتشغيل الفحص الذكي لتنظيف آمن وسريع.',
  actionText: 'Run Smart Scan Now →',
  actionTextAr: 'بدء الفحص الذكي الآن ←',
  detailsText: 'See Details',
  detailsTextAr: 'عرض التفاصيل',
  reclaimGb: 48.6,
  riskLevel: 'safe',
  targetPage: 'cleanup',
};

export const INITIAL_ACTIVITIES: HomeActivityItem[] = [
  {
    id: 'act-1',
    title: 'Smart Scan completed',
    titleAr: 'اكتمل الفحص الذكي',
    detail: 'Found 2.4 GB of junk files',
    detailAr: 'تم العثور على 2.4 جيجابايت من الملفات الزائدة',
    timeAgo: 'Today 2:14 PM',
    timeAgoAr: 'اليوم 2:14 م',
    status: 'success',
    icon: 'scan',
    targetPage: 'cleanup',
    isChecked: true,
  },
  {
    id: 'act-2',
    title: 'Organized 842 files',
    titleAr: 'تنظيم 842 ملفاً',
    detail: 'Moved to categorized folders',
    detailAr: 'تم الفرز إلى المجلدات المناسبة',
    timeAgo: 'Today 12:36 PM',
    timeAgoAr: 'اليوم 12:36 م',
    status: 'success',
    icon: 'folder',
    targetPage: 'studio',
    isChecked: false,
  },
  {
    id: 'act-3',
    title: 'Microsoft Edge updated',
    titleAr: 'تحديث Microsoft Edge',
    detail: 'Version 123.0.2420.65',
    detailAr: 'الإصدار 123.0.2420.65',
    timeAgo: 'Today 10:21 AM',
    timeAgoAr: 'اليوم 10:21 ص',
    status: 'info',
    icon: 'app',
    targetPage: 'applications',
    isChecked: false,
  },
  {
    id: 'act-4',
    title: 'Startup items optimized',
    titleAr: 'تحسين عناصر بدء التشغيل',
    detail: 'Disabled 3 unnecessary items',
    detailAr: 'تم تعطيل 3 برامج غير ضرورية',
    timeAgo: 'Today 9:03 AM',
    timeAgoAr: 'اليوم 9:03 ص',
    status: 'success',
    icon: 'startup',
    targetPage: 'startup',
    isChecked: false,
  },
  {
    id: 'act-5',
    title: 'System health check completed',
    titleAr: 'اكتمل فحص سلامة النظام',
    detail: 'No critical issues found',
    detailAr: 'لم يتم العثور على مشاكل حرجة',
    timeAgo: 'Today 8:41 AM',
    timeAgoAr: 'اليوم 8:41 ص',
    status: 'success',
    icon: 'repair',
    targetPage: 'system',
    isChecked: false,
  },
];

export const INITIAL_QUICK_ACCESS: QuickAccessItem[] = [
  {
    id: 'qa-1',
    name: 'Project_Plan_v3.docx',
    path: 'C:\\Users\\Alex\\Documents\\Work',
    category: 'document',
    size: '1.2 MB',
    lastModified: '2h ago',
    lastModifiedAr: 'منذ ساعتين',
    isPinned: true,
  },
  {
    id: 'qa-2',
    name: 'Budget_2024.xlsx',
    path: 'C:\\Users\\Alex\\Documents\\Finance',
    category: 'spreadsheet',
    size: '840 KB',
    lastModified: '4h ago',
    lastModifiedAr: 'منذ 4 ساعات',
    isPinned: false,
  },
  {
    id: 'qa-3',
    name: 'Demo_Video.mp4',
    path: 'C:\\Users\\Alex\\Videos\\Captures',
    category: 'video',
    size: '42.8 MB',
    lastModified: '6h ago',
    lastModifiedAr: 'منذ 6 ساعات',
    isPinned: false,
  },
  {
    id: 'qa-4',
    name: 'architecture.jpg',
    path: 'C:\\Users\\Alex\\Pictures\\Projects',
    category: 'picture',
    size: '3.4 MB',
    lastModified: '1d ago',
    lastModifiedAr: 'منذ يوم',
    isPinned: false,
  },
  {
    id: 'qa-5',
    name: 'source_code.zip',
    path: 'C:\\Users\\Alex\\Downloads',
    category: 'archive',
    size: '18.6 MB',
    lastModified: '1d ago',
    lastModifiedAr: 'منذ يوم',
    isPinned: false,
  },
];

export const INITIAL_STORAGE_VOLUMES: StorageVolumeSnapshot[] = [
  {
    id: 'vol-c',
    letter: 'C: Windows',
    label: 'NTFS • 476 GB',
    labelAr: 'NTFS • 476 جيجابايت',
    totalBytes: 511116312576,
    freeBytes: 105656188928,
    totalFormatted: '476 GB',
    freeFormatted: '98.4 GB free',
    usedFormatted: '377.6 GB',
    usedPercent: 79.3,
    freePercent: 20.7,
    fileSystem: 'NTFS',
    accentColor: '#38bdf8',
    status: 'healthy',
  },
  {
    id: 'vol-d',
    letter: 'D: Data',
    label: '1.82 TB',
    labelAr: '1.82 تيرابايت',
    totalBytes: 2000398934016,
    freeBytes: 672134041600,
    totalFormatted: '1.82 TB',
    freeFormatted: '625.9 GB free',
    usedFormatted: '1.19 TB',
    usedPercent: 66.4,
    freePercent: 33.6,
    fileSystem: 'NTFS',
    accentColor: '#38bdf8',
    status: 'healthy',
  },
  {
    id: 'vol-e',
    letter: 'E: Projects',
    label: '931 GB',
    labelAr: '931 جيجابايت',
    totalBytes: 999653638144,
    freeBytes: 624783523840,
    totalFormatted: '931 GB',
    freeFormatted: '581.8 GB free',
    usedFormatted: '349.2 GB',
    usedPercent: 37.5,
    freePercent: 62.5,
    fileSystem: 'NTFS',
    accentColor: '#38bdf8',
    status: 'healthy',
  },
];

export const INITIAL_SAFE_ACTIONS: PendingSafeAction[] = [
  {
    id: 'safe-1',
    title: 'Remove 1,243 temporary files',
    titleAr: 'حذف 1,243 ملفاً مؤقتاً',
    scope: '48.6 GB can be freed',
    scopeAr: 'يمكن تفريغ 48.6 جيجابايت',
    sizeFormatted: '48.6 GB',
    targetPage: 'cleanup',
    previewSummary:
      'Cleans up cache files from Windows Update, temporary downloaded installers, thumbnail caches, and recycle bin contents with zero impact on user files or running software.',
    previewSummaryAr:
      'تنظيف ملفات التحديثات المؤقتة وكاش المتصفحات وسلة المحذوفات بأمان تام.',
    safetyLevel: '100% Safe - No Running Interruption',
    safetyLevelAr: 'آمن بنسبة 100% دون مقاطعة البرامج',
    itemsCount: 1243,
    iconType: 'folder',
  },
  {
    id: 'safe-2',
    title: 'Uninstall 12 unused applications',
    titleAr: 'إلغاء تثبيت 12 تطبيقاً غير مستخدم',
    scope: 'Potentially free 4.2 GB',
    scopeAr: 'توفير محتمل لـ 4.2 جيجابايت',
    sizeFormatted: '4.2 GB',
    targetPage: 'applications',
    previewSummary:
      'Identified 12 applications that have not been launched in over 180 days. Full registry and folder cleanup included.',
    previewSummaryAr:
      'تم تحديد 12 تطبيقاً لم يتم تشغيلها منذ أكثر من 180 يوماً.',
    safetyLevel: 'Safe - Application Backups Available',
    safetyLevelAr: 'آمن مع إمكانية استعادة النسخ الاحتياطية',
    itemsCount: 12,
    iconType: 'app',
  },
  {
    id: 'safe-3',
    title: 'Clean up browser data',
    titleAr: 'تنظيف بيانات المتصفحات',
    scope: 'Selected: 3 browsers (1.1 GB)',
    scopeAr: 'محدد: 3 متصفحات (1.1 جيجابايت)',
    sizeFormatted: '1.1 GB',
    targetPage: 'cleanup',
    previewSummary:
      'Purges expired cached images, cached scripts, and temporary browsing data from Edge, Chrome, and Firefox while preserving logins and passwords.',
    previewSummaryAr:
      'تنظيف الكاش والصور المؤقتة من Edge و Chrome و Firefox مع الحفاظ على كلمات المرور.',
    safetyLevel: 'Safe - Passwords and Logins Preserved',
    safetyLevelAr: 'آمن مع الحفاظ التام على كلمات المرور',
    itemsCount: 3,
    iconType: 'browser',
  },
];
