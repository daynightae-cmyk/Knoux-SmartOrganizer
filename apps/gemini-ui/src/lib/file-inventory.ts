/**
 * KNOuX SmartOrganizer — Files & Instant Find Types & Data
 * Section 03: Files / Instant Find & Visual Intelligence
 */

export type FileCategoryFilter =
  | 'all'
  | 'files'
  | 'folders'
  | 'images'
  | 'videos'
  | 'documents'
  | 'archives'
  | 'code'
  | 'other';

export interface FileResultItem {
  id: string;
  name: string;
  parentFolder: string;
  type: string;
  category: FileCategoryFilter;
  sizeBytes: number;
  sizeFormatted: string;
  dateModifiedFormatted: string;
  dateModifiedRaw: string;
  source: string; // e.g. "Local Disk (C:)", "OneDrive", "GitHub"
  thumbnailUrl?: string;
  dimensions?: string;
  exactBytes?: number;
  hashSha256?: string;
  isOrganized?: boolean;
  suggestedAction?: string;
  suggestedPath?: string;
  author?: string;
  provenance?: string;
  nativeFileId?: number;
}

export interface FileDistributionStat {
  label: string;
  countFormatted: string;
  percentage: number;
  color: string;
}

export type FilesServiceKey =
  | 'file-downloads-inventory'
  | 'file-organize-preview'
  | 'file-organize-apply'
  | 'file-organize-undo'
  | 'file-empty-folders'
  | 'file-hash'
  | 'file-search'
  | 'file-type-map'
  | 'file-recents'
  | 'file-largest'
  | 'file-metadata'
  | 'file-provenance';

export interface FilesServiceMeta {
  key: FilesServiceKey;
  labelEn: string;
  labelAr: string;
  descEn: string;
  descAr: string;
  iconName: string;
}

export const FILES_DOMAIN_SERVICES: FilesServiceMeta[] = [
  {
    key: 'file-downloads-inventory',
    labelEn: 'Downloads Inventory',
    labelAr: 'مخزون التنزيلات',
    descEn: 'Scan and curate unorganized downloaded packages',
    descAr: 'فحص وتنظيم الملفات والحزم المنزلة',
    iconName: 'Download',
  },
  {
    key: 'file-organize-preview',
    labelEn: 'Organize Preview',
    labelAr: 'معاينة التنظيم',
    descEn: 'Deterministic dry-run tree simulation before moving',
    descAr: 'محاكاة هيكلية لنقل وترتيب الملفات',
    iconName: 'LayoutGrid',
  },
  {
    key: 'file-organize-apply',
    labelEn: 'Apply Organization',
    labelAr: 'تطبيق التنظيم',
    descEn: 'Execute validated batch transformation with safety ledger',
    descAr: 'تنفيذ عمليات النقل المؤكدة بدفتر أمان',
    iconName: 'CheckCheck',
  },
  {
    key: 'file-organize-undo',
    labelEn: 'Undo Organization',
    labelAr: 'التراجع عن التنظيم',
    descEn: 'Revert previous transaction back to original directories',
    descAr: 'استرجاع الملفات المنقولة لحالتها السابقة',
    iconName: 'RotateCcw',
  },
  {
    key: 'file-empty-folders',
    labelEn: 'Empty Folders',
    labelAr: 'المجلدات الفارغة',
    descEn: 'Detect abandoned directory skeletons across drives',
    descAr: 'اكتشاف وتطهير المجلدات الفارغة المتروكة',
    iconName: 'FolderMinus',
  },
  {
    key: 'file-hash',
    labelEn: 'File Hash',
    labelAr: 'تجزئة الملفات',
    descEn: 'Compute cryptographic SHA-256, MD5, and Blake3 digests',
    descAr: 'حساب بصمات التجزئة والتشفير للملفات',
    iconName: 'Hash',
  },
  {
    key: 'file-search',
    labelEn: 'File Search',
    labelAr: 'البحث الفوري',
    descEn: 'Instant regex and metadata queries over 1.2M indexed nodes',
    descAr: 'استعلام فوري بتعبيرات قياسية لـ 1.2 مليون ملف',
    iconName: 'Search',
  },
  {
    key: 'file-type-map',
    labelEn: 'File Type Map',
    labelAr: 'خريطة أنواع الملفات',
    descEn: 'Hierarchical sunburst distribution of extensions and mime types',
    descAr: 'توزيع بياني شامل للامتدادات والأنواع',
    iconName: 'PieChart',
  },
  {
    key: 'file-recents',
    labelEn: 'Recent Files',
    labelAr: 'الملفات الحديثة',
    descEn: 'Chronological activity stream of newly created or saved files',
    descAr: 'خط زمني بالملفات التي تم إنشاؤها مؤخراً',
    iconName: 'Clock',
  },
  {
    key: 'file-largest',
    labelEn: 'Largest Files',
    labelAr: 'الملفات الأضخم',
    descEn: 'Identify high-capacity storage consumers (> 1 GB)',
    descAr: 'كشف الملفات الضخمة المستهلكة لسعة القرص',
    iconName: 'HardDrive',
  },
  {
    key: 'file-metadata',
    labelEn: 'Metadata Explorer',
    labelAr: 'مستكشف البيانات الوصفية',
    descEn: 'Inspect EXIF, ID3 audio tags, PDF attributes and camera parameters',
    descAr: 'فحص بيانات EXIF والوسوم الصوتية للملفات',
    iconName: 'Tag',
  },
  {
    key: 'file-provenance',
    labelEn: 'Provenance Inspector',
    labelAr: 'فاحص الأصل والمصدر',
    descEn: 'Audit Zone.Identifier alternate data streams and download origin',
    descAr: 'تدقيق مصدر الملفات وعلامات تحميل الويب',
    iconName: 'History',
  },
];

// Distribution bars data matching REF-03
export const FILE_TYPES_DISTRIBUTION: FileDistributionStat[] = [
  { label: 'Images', countFormatted: '184K (14.7%)', percentage: 14.7, color: '#ec4899' },
  { label: 'Videos', countFormatted: '48K (3.8%)', percentage: 3.8, color: '#a855f7' },
  { label: 'Documents', countFormatted: '320K (25.6%)', percentage: 25.6, color: '#3b82f6' },
  { label: 'Archives', countFormatted: '24K (1.9%)', percentage: 1.9, color: '#f59e0b' },
  { label: 'Code', countFormatted: '96K (7.7%)', percentage: 7.7, color: '#10b981' },
  { label: 'Other', countFormatted: '587K (46.3%)', percentage: 46.3, color: '#64748b' },
];

export const MODIFICATION_AGE_DISTRIBUTION: FileDistributionStat[] = [
  { label: 'Today', countFormatted: '125K (10.0%)', percentage: 10.0, color: '#0284c7' },
  { label: 'This Week', countFormatted: '282K (22.6%)', percentage: 22.6, color: '#06b6d4' },
  { label: 'This Month', countFormatted: '401K (32.1%)', percentage: 32.1, color: '#8b5cf6' },
  { label: 'This Year', countFormatted: '320K (25.6%)', percentage: 25.6, color: '#d97706' },
  { label: 'Older', countFormatted: '120K (9.6%)', percentage: 9.6, color: '#64748b' },
];

// The exact 12 file rows from the reference screenshot
export const FILES_INSTANT_FIND_FIXTURE: FileResultItem[] = [
  {
    id: 'file-1',
    name: 'Mountains_Lake_4K.jpg',
    parentFolder: 'C:\\Users\\Alex\\Pictures\\Landscapes',
    type: 'JPG Image',
    category: 'images',
    sizeBytes: 5033165,
    sizeFormatted: '4.8 MB',
    dateModifiedFormatted: 'Oct 26, 2024 2:17 PM',
    dateModifiedRaw: '2024-10-26T14:17:00',
    source: 'Local Disk (C:)',
    dimensions: '3840 × 2160 (4K)',
    thumbnailUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80',
    hashSha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
    isOrganized: false,
    suggestedAction: 'Move to Pictures\\Landscapes\\4K\\',
  },
  {
    id: 'file-2',
    name: 'Aurora_Norway.jpg',
    parentFolder: 'C:\\Users\\Alex\\Pictures\\Landscapes',
    type: 'JPG Image',
    category: 'images',
    sizeBytes: 6437281,
    sizeFormatted: '6.1 MB',
    exactBytes: 6437281,
    dateModifiedFormatted: 'Oct 24, 2024 8:03 PM',
    dateModifiedRaw: '2024-10-24T20:03:00',
    source: 'Local Disk (C:)',
    dimensions: '3840 × 2160 (4K)',
    thumbnailUrl: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=1000&auto=format&fit=crop&q=85',
    hashSha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    isOrganized: false,
    suggestedAction: 'Move to Pictures\\Nature\\ and rename using YYYY-MM-DD_Location format.',
    suggestedPath: 'C:\\Users\\Alex\\Pictures\\Nature\\2024-10-24_Norway_Aurora.jpg',
  },
  {
    id: 'file-3',
    name: 'Project_Plan_v3.docx',
    parentFolder: 'C:\\Users\\Alex\\Documents\\Work',
    type: 'Word Document',
    category: 'documents',
    sizeBytes: 350208,
    sizeFormatted: '342 KB',
    dateModifiedFormatted: 'Oct 22, 2024 11:14 AM',
    dateModifiedRaw: '2024-10-22T11:14:00',
    source: 'OneDrive',
    hashSha256: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
    isOrganized: true,
  },
  {
    id: 'file-4',
    name: 'Demo_Video.mp4',
    parentFolder: 'C:\\Users\\Alex\\Videos\\Captures',
    type: 'MP4 Video',
    category: 'videos',
    sizeBytes: 134217728,
    sizeFormatted: '128 MB',
    dateModifiedFormatted: 'Oct 20, 2024 4:33 PM',
    dateModifiedRaw: '2024-10-20T16:33:00',
    source: 'Local Disk (C:)',
    dimensions: '1920 × 1080 (FHD)',
    thumbnailUrl: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800&auto=format&fit=crop&q=80',
    hashSha256: '4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a',
    isOrganized: false,
    suggestedAction: 'Route to Videos\\Captures\\2024\\',
  },
  {
    id: 'file-5',
    name: 'KNOuX Presentation.pptx',
    parentFolder: 'C:\\Users\\Alex\\Documents\\Presentations',
    type: 'PowerPoint Presentation',
    category: 'documents',
    sizeBytes: 19503514,
    sizeFormatted: '18.6 MB',
    dateModifiedFormatted: 'Oct 18, 2024 9:12 AM',
    dateModifiedRaw: '2024-10-18T09:12:00',
    source: 'OneDrive',
    hashSha256: 'ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d',
    isOrganized: true,
  },
  {
    id: 'file-6',
    name: 'source_code.zip',
    parentFolder: 'C:\\Users\\Alex\\Downloads',
    type: 'ZIP Archive',
    category: 'archives',
    sizeBytes: 25270682,
    sizeFormatted: '24.1 MB',
    dateModifiedFormatted: 'Oct 14, 2024 6:01 PM',
    dateModifiedRaw: '2024-10-14T18:01:00',
    source: 'Local Disk (C:)',
    hashSha256: '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4',
    isOrganized: false,
    suggestedAction: 'Extract to Projects\\Archives\\ and delete zip',
  },
  {
    id: 'file-7',
    name: 'main.py',
    parentFolder: 'C:\\Users\\Alex\\Projects\\KNOuX',
    type: 'Python File',
    category: 'code',
    sizeBytes: 6554,
    sizeFormatted: '6.4 KB',
    dateModifiedFormatted: 'Oct 12, 2024 1:20 PM',
    dateModifiedRaw: '2024-10-12T13:20:00',
    source: 'Local Disk (C:)',
    hashSha256: 'ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb',
    isOrganized: true,
  },
  {
    id: 'file-8',
    name: 'Budget_2024.xlsx',
    parentFolder: 'C:\\Users\\Alex\\Documents\\Finance',
    type: 'Excel Workbook',
    category: 'documents',
    sizeBytes: 1258291,
    sizeFormatted: '1.2 MB',
    dateModifiedFormatted: 'Oct 11, 2024 3:45 PM',
    dateModifiedRaw: '2024-10-11T15:45:00',
    source: 'OneDrive',
    hashSha256: '3e23e8160039594a33894f6564e1b1348bbd7a0088d42c4acb73eeaed59c009d',
    isOrganized: true,
  },
  {
    id: 'file-9',
    name: 'logo-transparent.png',
    parentFolder: 'C:\\Users\\Alex\\Projects\\KNOuX\\Assets',
    type: 'PNG Image',
    category: 'images',
    sizeBytes: 1153434,
    sizeFormatted: '1.1 MB',
    dateModifiedFormatted: 'Oct 9, 2024 10:18 AM',
    dateModifiedRaw: '2024-10-09T10:18:00',
    source: 'Local Disk (C:)',
    dimensions: '2048 × 2048',
    thumbnailUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
    hashSha256: '2c624232cdd221771294dfbb310aca000a0df6ac8b66b696d90ef06fdefb64a3',
    isOrganized: true,
  },
  {
    id: 'file-10',
    name: 'KNOuX_Setup.exe',
    parentFolder: 'C:\\Users\\Alex\\Downloads',
    type: 'Application',
    category: 'other',
    sizeBytes: 96888422,
    sizeFormatted: '92.4 MB',
    dateModifiedFormatted: 'Oct 7, 2024 8:54 PM',
    dateModifiedRaw: '2024-10-07T20:54:00',
    source: 'Local Disk (C:)',
    hashSha256: '11a4a60b518f97b1ee99c8604bc8f06079e0a735b6347d3e6c93f884fec174ed',
    isOrganized: false,
    suggestedAction: 'Installer detected in downloads. Move to Installers repository',
  },
  {
    id: 'file-11',
    name: 'Readme.md',
    parentFolder: 'C:\\Users\\Alex\\Projects\\KNOuX',
    type: 'Markdown File',
    category: 'code',
    sizeBytes: 12902,
    sizeFormatted: '12.6 KB',
    dateModifiedFormatted: 'Oct 6, 2024 4:21 PM',
    dateModifiedRaw: '2024-10-06T16:21:00',
    source: 'GitHub',
    hashSha256: 'fb8e20fc2e4c3f248c60c39bd652f3c1347298ab977b8b4d79f03a8a5323a3f5',
    isOrganized: true,
  },
  {
    id: 'file-12',
    name: 'City_Skyline_8K.jpg',
    parentFolder: 'C:\\Users\\Alex\\Pictures\\Cities',
    type: 'JPG Image',
    category: 'images',
    sizeBytes: 7654605,
    sizeFormatted: '7.3 MB',
    dateModifiedFormatted: 'Oct 3, 2024 9:36 AM',
    dateModifiedRaw: '2024-10-03T09:36:00',
    source: 'Local Disk (C:)',
    dimensions: '7680 × 4320 (8K)',
    thumbnailUrl: 'https://images.unsplash.com/photo-1477959858617-67f30bc75b82?w=800&auto=format&fit=crop&q=80',
    hashSha256: '6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b',
    isOrganized: false,
    suggestedAction: 'Route to Wallpapers\\8K\\',
  },
];
