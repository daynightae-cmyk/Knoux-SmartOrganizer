/**
 * KNOuX SmartOrganizer — Files / Instant Find & Visual Intelligence
 * Mandatory Target: REF-03_Files_Instant_Find.png (1672x941 native)
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  Search,
  Settings,
  Minus,
  Square,
  X,
  Home,
  FileText,
  FolderTree,
  Trash2,
  Sliders,
  Bot,
  Layers,
  ChevronDown,
  Check,
  Play,
  FolderOpen,
  Copy,
  Hash,
  ExternalLink,
  MoreHorizontal,
  Cloud,
  CheckCircle,
  Clock,
  HardDrive,
  Download,
  LayoutGrid,
  CheckCheck,
  RotateCcw,
  FolderMinus,
  PieChart,
  Tag,
  History,
  Image as ImageIcon,
  Video,
  Archive,
  Code,
  Folder,
  ArrowRight,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
} from 'lucide-react';

import {
  FILES_DOMAIN_SERVICES,
  FILES_INSTANT_FIND_FIXTURE,
  FILE_TYPES_DISTRIBUTION,
  FileCategoryFilter,
  FileResultItem,
  FilesServiceKey,
  MODIFICATION_AGE_DISTRIBUTION,
} from '../lib/file-inventory';
import { FileIcon } from '../components/files/FileIcon';
import { useFilesNative, formatBytes } from '../files/useFilesNative';
import { FilesNativeBanner } from '../files/FilesNativeBanner';
import { FilesServiceFocus } from '../files/FilesServiceFocus';
import { useNavigation } from '../context/NavigationContext';
import { KNOuXTitleBar, KNOuXSidebar } from '../components/shell/KNOuXShellComponents';
import '../files.css';

interface FilesPageProps {
  onNavigateSection?: (section: string) => void;
}

export function FilesPage({ onNavigateSection }: FilesPageProps) {
  const { navigateTo, isActive, locale, isArabic, toggleLocale, setLocale } = useNavigation();
  const [files, setFiles] = useState<FileResultItem[]>(FILES_INSTANT_FIND_FIXTURE);
  const [selectedFile, setSelectedFile] = useState<FileResultItem>(FILES_INSTANT_FIND_FIXTURE[1]); // Aurora_Norway.jpg active
  const [checkedFileIds, setCheckedFileIds] = useState<Set<string>>(new Set(['file-2'])); // file-2 checked in screenshot
  const [activeCategory, setActiveCategory] = useState<FileCategoryFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExtension, setSelectedExtension] = useState('All');
  const [selectedSizeFilter, setSelectedSizeFilter] = useState('Any');
  const [dateFilter, setDateFilter] = useState<'any' | 'today' | 'week' | 'month'>('any');
  const [locationFilter, setLocationFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'date_desc' | 'name_asc' | 'size_desc'>('date_desc');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [activeService, setActiveService] = useState<FilesServiceKey | null>(null);
  const [previewExpanded, setPreviewExpanded] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const filesNative = useFilesNative();
  const measured = filesNative.mode === 'measured';
  const sourceFiles = measured ? filesNative.files : files;
  const measuredOverview = filesNative.overview;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleToggleCheck = (id: string) => {
    setCheckedFileIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleCheckAll = () => {
    if (checkedFileIds.size === filteredFiles.length) {
      setCheckedFileIds(new Set());
    } else {
      setCheckedFileIds(new Set(filteredFiles.map((f) => f.id)));
    }
  };

  // Filter and sort files. Measured filtering is primarily executed by the
  // native query; this pass keeps fixture filters honest and applies the same
  // visible predicates to the returned page.
  const filteredFiles = useMemo(() => {
    const now = Date.now();
    const dateLimit =
      dateFilter === 'today' ? now - 86_400_000 :
      dateFilter === 'week' ? now - 7 * 86_400_000 :
      dateFilter === 'month' ? now - 30 * 86_400_000 : null;
    const extensionSets: Record<string, string[]> = {
      jpg: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
      docx: ['docx', 'pdf', 'doc', 'txt', 'md'],
      zip: ['zip', 'rar', '7z', 'tar', 'gz'],
    };
    const allowedExtensions = extensionSets[selectedExtension] || null;
    const rows = sourceFiles.filter((file) => {
      if (!['all', 'files'].includes(activeCategory) && file.category !== activeCategory) return false;
      if (!measured && locationFilter !== 'all' && file.source !== locationFilter) return false;
      if (activeCategory === 'folders') return false;
      if (allowedExtensions) {
        const ext = String(file.name.split('.').pop() || '').toLowerCase();
        if (!allowedExtensions.includes(ext)) return false;
      }
      if (selectedSizeFilter === 'large' && file.sizeBytes < 100 * 1024 * 1024) return false;
      if (selectedSizeFilter === 'medium' && (file.sizeBytes < 10 * 1024 * 1024 || file.sizeBytes >= 100 * 1024 * 1024)) return false;
      if (selectedSizeFilter === 'small' && file.sizeBytes >= 10 * 1024 * 1024) return false;
      if (dateLimit !== null) {
        const modified = new Date(file.dateModifiedRaw).getTime();
        if (!Number.isFinite(modified) || modified < dateLimit) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          file.name.toLowerCase().includes(q) ||
          file.parentFolder.toLowerCase().includes(q) ||
          file.type.toLowerCase().includes(q)
        );
      }
      return true;
    });
    return rows.sort((a, b) => {
      if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
      if (sortBy === 'size_desc') return b.sizeBytes - a.sizeBytes;
      return new Date(b.dateModifiedRaw).getTime() - new Date(a.dateModifiedRaw).getTime();
    });
  }, [sourceFiles, activeCategory, searchQuery, selectedExtension, selectedSizeFilter, dateFilter, sortBy, measured, locationFilter]);

  // Measured mode asks the native query whenever a visible filter changes.
  useEffect(() => {
    if (!measured || !filesNative.source?.id) return;
    filesNative.reload({
      search: searchQuery,
      category: activeCategory,
      extension: selectedExtension,
      sizeFilter: selectedSizeFilter,
      dateFilter,
      sort: sortBy,
    });
  }, [measured, filesNative.source?.id, filesNative.reload, searchQuery, activeCategory, selectedExtension, selectedSizeFilter, dateFilter, sortBy]);

  // Keep a real selected row when a measured page arrives.
  useEffect(() => {
    if (!measured || !filteredFiles.length) return;
    if (!filteredFiles.some((file) => file.id === selectedFile.id)) {
      setSelectedFile(filteredFiles[0]);
      setCheckedFileIds(new Set());
    }
  }, [measured, filteredFiles, selectedFile.id]);

  useEffect(() => {
    if (!measured) return;
    const fileId = selectedFile.nativeFileId;
    if (typeof fileId === 'number') void filesNative.loadMetadata(fileId);
  }, [measured, selectedFile.id, selectedFile.nativeFileId, filesNative.loadMetadata]);

  const L = locale === 'ar'
    ? {
        name: 'الاسم', parentFolder: 'المجلد الأصل', type: 'النوع', size: 'الحجم',
        dateModified: 'تاريخ التعديل', source: 'المصدر',
        all: 'الكل', files: 'ملفات', folders: 'مجلدات', images: 'صور', videos: 'فيديو',
        documents: 'مستندات', archives: 'أرشيف', code: 'برمجة', other: 'أخرى',
        extensionAll: 'الامتداد: كل الامتدادات', fileSizeAny: 'الحجم: أي حجم',
        fileSizeLarge: 'أكبر من 100 م.ب', fileSizeMedium: 'من 10 إلى 100 م.ب', fileSizeSmall: 'أقل من 10 م.ب',
        dateAny: 'تاريخ التعديل: أي وقت', dateToday: 'اليوم', dateWeek: 'هذا الأسبوع', dateMonth: 'هذا الشهر',
        locationAll: 'الموقع: كل المواقع', sourcePrefix: 'المصدر:',
        sortDate: 'الترتيب: الأحدث تعديلًا', sortName: 'الترتيب: الاسم (أ-ي)', sortSize: 'الترتيب: الحجم (الأكبر)',
        fileTypes: 'توزيع أنواع الملفات', ageDistribution: 'توزيع أعمار التعديل',
        ageDay: 'آخر 24 ساعة', ageWeek: 'آخر 7 أيام', ageMonth: 'آخر 30 يومًا', ageYear: 'آخر سنة', ageOlder: 'أقدم / غير معروف',
        open: 'فتح', reveal: 'إظهار في المستكشف', copyPath: 'نسخ المسار',
        calculateHash: 'حساب SHA-256', planStudio: 'خطة في استوديو التنظيم',
        livePreview: 'معاينة الخدمة الحية', services: 'خدمات KNOuX', measured: 'مقيس', fixture: 'تجريبي',
        selected: 'ملف محدد', selectedPlural: 'ملفات محددة', first: 'أول', of: 'من',
        path: 'المسار', created: 'أُنشئ', identity: 'الهوية', zone: 'المنطقة / MotW', attributes: 'السمات',
        readingMetadata: 'جارٍ قراءة البيانات الوصفية…', hashing: 'جارٍ حساب التجزئة للقراءة فقط…',
        openStudio: 'فتح استوديو التنظيم', noMetadata: 'اختر ملفًا مقيسًا.',
      }
    : {
        name: 'Name', parentFolder: 'Parent Folder', type: 'Type', size: 'Size',
        dateModified: 'Date Modified', source: 'Source',
        all: 'All', files: 'Files', folders: 'Folders', images: 'Images', videos: 'Videos',
        documents: 'Documents', archives: 'Archives', code: 'Code', other: 'Other',
        extensionAll: 'Extension: All extensions', fileSizeAny: 'File Size: Any size',
        fileSizeLarge: '> 100 MB', fileSizeMedium: '10 MB - 100 MB', fileSizeSmall: '< 10 MB',
        dateAny: 'Date Modified: Any time', dateToday: 'Today', dateWeek: 'This Week', dateMonth: 'This Month',
        locationAll: 'Location: All locations', sourcePrefix: 'Source:',
        sortDate: 'Sort: Date modified (newest)', sortName: 'Sort: Name (A-Z)', sortSize: 'Sort: Size (largest)',
        fileTypes: 'File Types Distribution', ageDistribution: 'Modification Age Distribution',
        ageDay: 'Last 24 hours', ageWeek: 'Last 7 days', ageMonth: 'Last 30 days', ageYear: 'Last year', ageOlder: 'Older / unknown',
        open: 'Open', reveal: 'Reveal in Explorer', copyPath: 'Copy Path',
        calculateHash: 'Calculate SHA-256', planStudio: 'Plan in Organization Studio',
        livePreview: 'Live Service Preview', services: 'KNOuX Services', measured: 'MEASURED', fixture: 'FIXTURE',
        selected: 'file selected', selectedPlural: 'files selected', first: 'first', of: 'of',
        path: 'Path', created: 'Created', identity: 'Identity', zone: 'Zone / MotW', attributes: 'Attributes',
        readingMetadata: 'جارٍ قراءة البيانات الوصفية…', hashing: 'جارٍ حساب التجزئة للقراءة فقط…',
        openStudio: 'Open Organization Studio', noMetadata: 'Select a measured file.',
      };

  // Measured aggregates replace every fixture figure; the fixture remains
  // visible only when no native source exists.
  const indexedItemCount = measured && measuredOverview ? measuredOverview.totals.files : 1_248_632;
  const indexedLocations = measured && measuredOverview ? 1 : 5;
  const measuredCategoryTotals = useMemo(() => {
    const totals = new Map<string, number>();
    for (const category of measuredOverview?.categories || []) {
      totals.set(category.key, (totals.get(category.key) || 0) + category.count);
    }
    const sum = (...keys: string[]) => keys.reduce((total, key) => total + (totals.get(key) || 0), 0);
    return {
      all: measuredOverview?.totals.files || 0,
      files: measuredOverview?.totals.files || 0,
      folders: measuredOverview?.totals.folders || 0,
      images: sum('image'),
      videos: sum('video'),
      documents: sum('document', 'spreadsheet', 'presentation', 'pdf', 'ebook'),
      archives: sum('archive', 'application'),
      code: sum('code', 'web'),
      other: sum('audio', 'design', 'font', 'system', 'other'),
    };
  }, [measuredOverview]);

  const countLabel = (key: keyof typeof measuredCategoryTotals, fixtureLabel: string) =>
    measured ? `${measuredCategoryTotals[key].toLocaleString()}${key === 'folders' ? '*' : ''}` : fixtureLabel;

  const categoryPills = [
    { id: 'all' as FileCategoryFilter, label: `${L.all} (${measured ? countLabel('all', '') : '1.2M'})`, icon: null },
    { id: 'files' as FileCategoryFilter, label: `${L.files} (${measured ? countLabel('files', '') : '987K'})`, icon: FileText },
    { id: 'folders' as FileCategoryFilter, label: `${L.folders} (${measured ? countLabel('folders', '') : '261K'})`, icon: Folder, color: '#eab308' },
    { id: 'images' as FileCategoryFilter, label: `${L.images} (${measured ? countLabel('images', '') : '184K'})`, icon: ImageIcon, color: '#ec4899' },
    { id: 'videos' as FileCategoryFilter, label: `${L.videos} (${measured ? countLabel('videos', '') : '48K'})`, icon: Video, color: '#a855f7' },
    { id: 'documents' as FileCategoryFilter, label: `${L.documents} (${measured ? countLabel('documents', '') : '320K'})`, icon: FileText, color: '#3b82f6' },
    { id: 'archives' as FileCategoryFilter, label: `${L.archives} (${measured ? countLabel('archives', '') : '24K'})`, icon: Archive, color: '#f59e0b' },
    { id: 'code' as FileCategoryFilter, label: `${L.code} (${measured ? countLabel('code', '') : '96K'})`, icon: Code, color: '#10b981' },
    { id: 'other' as FileCategoryFilter, label: `${L.other} (${measured ? countLabel('other', '') : '47K'})`, icon: FileText, color: '#64748b' },
  ];

  const distributionPalette = ['#3b82f6', '#a855f7', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#84cc16', '#64748b'];
  const measuredTypeTotal = measuredOverview?.extensions.reduce((sum, item) => sum + item.count, 0) || 0;
  const fileTypeStats = measured
    ? (measuredOverview?.extensions || []).slice(0, 7).map((item, index) => ({
        label: item.ext === '(none)' ? 'No extension' : `.${item.ext}`,
        countFormatted: item.count.toLocaleString(),
        percentage: measuredTypeTotal ? Math.max(1, Math.round((item.count / measuredTypeTotal) * 100)) : 0,
        color: distributionPalette[index % distributionPalette.length],
      }))
    : FILE_TYPES_DISTRIBUTION.map((item, index) => ({
        ...item,
        label: [L.images, L.videos, L.documents, L.archives, L.code, L.other][index] || item.label,
      }));
  const measuredAgeTotal = measuredOverview?.ages.reduce((sum, item) => sum + item.count, 0) || 0;
  const ageStats = measured
    ? (measuredOverview?.ages || []).map((item, index) => ({
        label: [L.ageDay, L.ageWeek, L.ageMonth, L.ageYear, L.ageOlder][index] || item.label,
        countFormatted: item.count.toLocaleString(),
        percentage: measuredAgeTotal ? Math.max(0, Math.round((item.count / measuredAgeTotal) * 100)) : 0,
        color: distributionPalette[index % distributionPalette.length],
      }))
    : MODIFICATION_AGE_DISTRIBUTION.map((item, index) => ({
        ...item,
        label: [L.ageDay, L.ageWeek, L.ageMonth, L.ageYear, L.ageOlder][index] || item.label,
      }));

  // Aggregate selected files info
  const selectedCount = checkedFileIds.size;
  const selectedSizeFormatted =
    selectedCount === 1
      ? sourceFiles.find((f) => checkedFileIds.has(f.id))?.sizeFormatted || '0 B'
      : `${(sourceFiles.filter((f) => checkedFileIds.has(f.id)).reduce((sum, f) => sum + f.sizeBytes, 0) / (1024 * 1024)).toFixed(1)} MB`;

  const selectedNativeId = measured ? selectedFile.nativeFileId : undefined;
  const selectedMetadata = filesNative.metadata?.fileId === selectedNativeId ? filesNative.metadata : null;
  const selectedHash = filesNative.hash?.fileId === selectedNativeId ? filesNative.hash : null;

  const handleOpenFile = async () => {
    if (!measured || typeof selectedNativeId !== 'number') {
      showToast('Design fixture — no Windows file was opened.');
      return;
    }
    const result = await filesNative.openFile(selectedNativeId);
    showToast(result.message);
  };

  const handleRevealFile = async () => {
    if (!measured || typeof selectedNativeId !== 'number') {
      showToast('Design fixture — Explorer was not asked to reveal anything.');
      return;
    }
    const result = await filesNative.revealFile(selectedNativeId);
    showToast(result.message);
  };

  const handleCopyPath = async () => {
    const value = measured ? selectedMetadata?.fullPath : `${selectedFile.parentFolder}\\${selectedFile.name}`;
    if (!value) {
      showToast('Measured path is still loading.');
      return;
    }
    try {
      await navigator.clipboard.writeText(value);
      showToast(measured ? 'Measured path copied.' : 'Fixture path copied — not a device file.');
    } catch {
      showToast('The clipboard is unavailable.');
    }
  };

  const handleHashFile = async () => {
    if (!measured || typeof selectedNativeId !== 'number') {
      setActiveService('file-hash');
      return;
    }
    await filesNative.computeHash(selectedNativeId);
    showToast('SHA-256 request completed.');
  };

  const handleOpenRowMenu = (file: FileResultItem) => {
    setSelectedFile(file);
    if (measured && typeof file.nativeFileId === 'number') {
      void filesNative.loadMetadata(file.nativeFileId);
      showToast(`Measured metadata loaded for ${file.name}.`);
      return;
    }
    showToast('Fixture row — no native metadata exists.');
  };

  const stepSelection = (delta: number) => {
    if (!filteredFiles.length) return;
    const currentIndex = filteredFiles.findIndex((file) => file.id === selectedFile.id);
    const base = currentIndex >= 0 ? currentIndex : 0;
    const nextIndex = (base + delta + filteredFiles.length) % filteredFiles.length;
    setSelectedFile(filteredFiles[nextIndex]);
  };

  const handleOpenStudio = () => {
    if (onNavigateSection) onNavigateSection('studio');
    else navigateTo('studio');
    showToast('Studio opened — plan execution still needs explicit approval.');
  };

  const renderServiceIcon = (iconName: string) => {
    switch (iconName) {
      case 'Download': return <Download className="w-3.5 h-3.5" />;
      case 'LayoutGrid': return <LayoutGrid className="w-3.5 h-3.5" />;
      case 'CheckCheck': return <CheckCheck className="w-3.5 h-3.5" />;
      case 'RotateCcw': return <RotateCcw className="w-3.5 h-3.5" />;
      case 'FolderMinus': return <FolderMinus className="w-3.5 h-3.5" />;
      case 'Hash': return <Hash className="w-3.5 h-3.5" />;
      case 'Search': return <Search className="w-3.5 h-3.5" />;
      case 'PieChart': return <PieChart className="w-3.5 h-3.5" />;
      case 'Clock': return <Clock className="w-3.5 h-3.5" />;
      case 'HardDrive': return <HardDrive className="w-3.5 h-3.5" />;
      case 'Tag': return <Tag className="w-3.5 h-3.5" />;
      case 'History': return <History className="w-3.5 h-3.5" />;
      default: return <FileText className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
      className="w-screen h-screen flex flex-col bg-[#050e1f] text-slate-100 overflow-hidden font-sans select-none relative"
      style={{
        fontFamily:
          locale === 'ar'
            ? "'Tajawal', system-ui, sans-serif"
            : "'Plus Jakarta Sans', system-ui, sans-serif",
      }}
    >
      {/* 00 — Thin Windows Title Bar & Global Search */}
      <KNOuXTitleBar
        sectionName={locale === 'ar' ? 'الملفات' : 'Files'}
        sectionSubtitle={locale === 'ar' ? 'البحث الفوري والذكاء البصري' : 'Instant Find & Visual Intelligence'}
        onNavigateHome={() => (onNavigateSection ? onNavigateSection('home') : navigateTo('home'))}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder={locale === 'ar' ? 'ابحث في الملفات أو المجلدات أو المحتوى... (Ctrl+K)' : 'Search files, folders, content, or type a command... (Ctrl+K)'}
        isArabic={locale === 'ar'}
        onToggleArabic={toggleLocale}
      />

      {/* Main Body Layout */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left Global Navigation Sidebar */}
        <KNOuXSidebar
          activeSection="files"
          onNavigate={(sec) => (onNavigateSection ? onNavigateSection(sec) : navigateTo(sec))}
          isArabic={locale === 'ar'}
        />

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#061226] relative overflow-hidden">
          {/* Toast feedback */}
          {toastMessage && (
            <div className="absolute top-3 right-6 z-50 px-3.5 py-2 rounded-lg bg-cyan-950/95 border border-cyan-400 text-cyan-200 text-xs shadow-xl flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-cyan-400" />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* 1. Hero & Commanding Search Area */}
          <div className="relative pt-3 pb-2 px-6 shrink-0 bg-gradient-to-b from-[#08172e] to-[#061226] border-b border-[#0f2444] select-none overflow-hidden">
            <div className="absolute inset-0 files-hero-nebula pointer-events-none" />

            {/* Breadcrumb & Title */}
            <div className="relative z-10 mb-2">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-0.5">
                <Folder className="w-3.5 h-3.5 text-cyan-400" />
                <span>‹</span>
                <span>{locale === 'en' ? 'Files' : 'الملفات'}</span>
              </div>

              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                <span className="bg-gradient-to-r from-white via-cyan-100 to-cyan-400 bg-clip-text text-transparent">
                  {locale === 'en' ? 'Instant Find' : 'البحث الفوري الذكي'}
                </span>
              </h1>
              <p className="text-xs text-slate-300 mt-0.5 font-normal">
                {locale === 'en'
                  ? 'Every file in focus. Search, discover, inspect and organize.'
                  : 'كل ملف في متناولك. ابحث، واستكشف، وافحص، ورتّب بذكاء وسرعة فائقة.'}
              </p>
            </div>

            {/* Wide Search Bar with Live Index Status */}
            <div className="relative mb-2.5">
              <div className="flex items-center bg-[#07152b] border border-[#173766] rounded-xl px-3.5 py-2 shadow-inner focus-within:border-[#2476ff] transition-all">
                <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
                <input
                  data-testid="files-search"
                  aria-label={locale === 'ar' ? 'البحث في الملفات' : 'Search files'}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    locale === 'en'
                      ? 'Search files, folders, content, or use filters...'
                      : 'ابحث عن الملفات أو المجلدات أو استخدم الفلاتر...'
                  }
                  className="w-full bg-transparent text-xs text-white placeholder-slate-500 outline-none font-medium"
                />

                <kbd className="px-1.5 py-0.5 rounded bg-[#0d223d] text-[10px] font-mono text-slate-400 border border-[#1b3f70] mr-3 shrink-0">
                  Ctrl + K
                </kbd>

                {/* Live index badge inside search input */}
                <div className="flex items-center gap-2 pl-3 border-l border-[#132c52] shrink-0 text-right">
                  <span className={`w-2 h-2 rounded-full ${measured ? 'bg-emerald-400 shadow-[0_0_6px_#10b981]' : 'bg-amber-400 shadow-[0_0_6px_#f59e0b]'}`} />
                  <div className="text-[10px] leading-tight">
                    <span className="font-bold text-white font-mono">
                      {measured
                        ? `${indexedItemCount.toLocaleString()} ${locale === 'en' ? 'items' : 'عنصر'}`
                        : (locale === 'en' ? 'Indexed 1,248,632 items' : '1,248,632 عنصر مفهرس')}
                    </span>
                    <div className="text-slate-400 text-[9px]">
                      {measured
                        ? (locale === 'en'
                            ? `${indexedLocations} authorized source • ${measuredOverview?.coverage || 'complete'}`
                            : `${indexedLocations} مصدر مصرح • ${measuredOverview?.coverage === 'partial' ? 'جزئي' : 'مكتمل'}`)
                        : (locale === 'en' ? `${indexedLocations} locations • Design fixture` : `${indexedLocations} مواقع • بيانات تجريبية`)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <FilesNativeBanner
              locale={locale}
              available={filesNative.available}
              mode={filesNative.mode}
              overview={filesNative.overview}
              scanning={filesNative.scanning}
              progress={filesNative.progress}
              error={filesNative.error}
              warnings={filesNative.warnings}
              onAdd={() => void filesNative.addSource()}
              onRescan={() => filesNative.source && void filesNative.scanSource(filesNative.source.id)}
              onCancel={() => void filesNative.cancelScan()}
            />

            {/* Category Filter Pills (9 categories) */}
            <div className="flex flex-wrap items-center gap-1.5 pb-1 mb-2">
              {categoryPills.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeCategory === tab.id;

                return (
                  <button
                    key={tab.id}
                    data-testid={`files-category-${tab.id}`}
                    onClick={() => setActiveCategory(tab.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                      isActive
                        ? 'bg-gradient-to-r from-[#173e80] to-[#2476ff] text-white border border-cyan-400/60 shadow-[0_0_12px_rgba(36,118,255,0.5)]'
                        : 'bg-[#08172c] hover:bg-[#0e223d] text-slate-300 border border-[#132c52]'
                    }`}
                  >
                    {Icon && (
                      <span style={{ color: tab.color }}>
                        <Icon className="w-3.5 h-3.5" />
                      </span>
                    )}
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Sub-Filters Menus (Extension, Size, Date, Location, Sort) */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                {/* Extension */}
                <div className="relative">
                  <select
                    value={selectedExtension}
                    data-testid="files-extension"
                    aria-label={locale === 'ar' ? 'تصفية حسب الامتداد' : 'Filter by extension'}
                    onChange={(e) => setSelectedExtension(e.target.value)}
                    className="bg-[#08172c] text-slate-300 hover:text-white border border-[#142e56] rounded-md px-2.5 py-1 text-xs font-medium cursor-pointer appearance-none pr-6 outline-none"
                  >
                    <option value="All">{L.extensionAll}</option>
                    {measured
                      ? (measuredOverview?.extensions || []).slice(0, 12).map((item) => (
                          <option key={item.ext} value={item.ext === '(none)' ? 'none' : item.ext}>
                            .{item.ext === '(none)' ? 'no extension' : item.ext} ({item.count.toLocaleString()})
                          </option>
                        ))
                      : (
                        <>
                          <option value="jpg">.jpg, .png</option>
                          <option value="docx">.docx, .pdf</option>
                          <option value="zip">.zip, .rar</option>
                        </>
                      )}
                  </select>
                  <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-2 pointer-events-none" />
                </div>

                {/* File Size */}
                <div className="relative">
                  <select
                    value={selectedSizeFilter}
                    data-testid="files-size"
                    aria-label={locale === 'ar' ? 'تصفية حسب الحجم' : 'Filter by file size'}
                    onChange={(e) => setSelectedSizeFilter(e.target.value)}
                    className="bg-[#08172c] text-slate-300 hover:text-white border border-[#142e56] rounded-md px-2.5 py-1 text-xs font-medium cursor-pointer appearance-none pr-6 outline-none"
                  >
                    <option value="Any">{L.fileSizeAny}</option>
                    <option value="large">{L.fileSizeLarge}</option>
                    <option value="medium">{L.fileSizeMedium}</option>
                    <option value="small">{L.fileSizeSmall}</option>
                  </select>
                  <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-2 pointer-events-none" />
                </div>

                {/* Date Modified */}
                <div className="relative">
                  <select
                    value={dateFilter}
                    data-testid="files-date"
                    aria-label={locale === 'ar' ? 'تصفية حسب تاريخ التعديل' : 'Filter by modification date'}
                    onChange={(e) => setDateFilter(e.target.value as 'any' | 'today' | 'week' | 'month')}
                    className="bg-[#08172c] text-slate-300 hover:text-white border border-[#142e56] rounded-md px-2.5 py-1 text-xs font-medium cursor-pointer appearance-none pr-6 outline-none"
                  >
                    <option value="any">{L.dateAny}</option>
                    <option value="today">{L.dateToday}</option>
                    <option value="week">{L.dateWeek}</option>
                    <option value="month">{L.dateMonth}</option>
                  </select>
                  <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-2 pointer-events-none" />
                </div>

                {/* Location */}
                <div className="relative">
                  <select
                    value={measured ? (filesNative.source?.label || 'authorized') : locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    disabled={measured}
                    title={measured ? 'Measured mode queries one authorized source at a time.' : undefined}
                    className="bg-[#08172c] text-slate-300 hover:text-white border border-[#142e56] rounded-md px-2.5 py-1 text-xs font-medium cursor-pointer appearance-none pr-6 outline-none disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {measured ? (
                      <option value={filesNative.source?.label || 'authorized'}>
                        {L.sourcePrefix} {filesNative.source?.label || 'authorized folder'}
                      </option>
                    ) : (
                      <>
                        <option value="all">{L.locationAll}</option>
                        <option>Local Disk (C:)</option>
                        <option>OneDrive</option>
                        <option>GitHub</option>
                      </>
                    )}
                  </select>
                  <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-2 pointer-events-none" />
                </div>
              </div>

              {/* Sort & View Density Toggle */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <select
                    value={sortBy}
                    data-testid="files-sort"
                    aria-label={locale === 'ar' ? 'ترتيب الملفات' : 'Sort files'}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-[#08172c] text-slate-300 hover:text-white border border-[#142e56] rounded-md px-2.5 py-1 text-xs font-medium cursor-pointer appearance-none pr-6 outline-none"
                  >
                    <option value="date_desc">{L.sortDate}</option>
                    <option value="name_asc">{L.sortName}</option>
                    <option value="size_desc">{L.sortSize}</option>
                  </select>
                  <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-2 pointer-events-none" />
                </div>

                <div className="flex items-center bg-[#071529] p-0.5 rounded-md border border-[#142e56]">
                  <button
                    data-testid="files-view-list"
                    title={locale === 'en' ? 'List view' : 'عرض القائمة'}
                    aria-label={locale === 'en' ? 'List view' : 'عرض القائمة'}
                    aria-pressed={viewMode === 'list'}
                    onClick={() => setViewMode('list')}
                    className={`p-1 rounded text-xs transition-colors cursor-pointer ${
                      viewMode === 'list' ? 'bg-[#173866] text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </button>
                  <button
                    data-testid="files-view-grid"
                    title={locale === 'en' ? 'Grid view' : 'عرض الشبكة'}
                    aria-label={locale === 'en' ? 'Grid view' : 'عرض الشبكة'}
                    aria-pressed={viewMode === 'grid'}
                    onClick={() => setViewMode('grid')}
                    className={`p-1 rounded text-xs transition-colors cursor-pointer ${
                      viewMode === 'grid' ? 'bg-[#173866] text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5 rotate-45" />
                  </button>
                </div>
              </div>
            </div>

            {/* 2. Data Composition Band (Two Horizontal Distribution Gauges) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-3 pt-2.5 border-t border-[#0e223d]">
              {/* Distribution 1: File Types */}
              <div className="bg-[#07152b] p-2.5 rounded-lg border border-[#122b50]">
                <div className="text-[11px] font-bold text-white mb-1.5 flex items-center justify-between">
                  <span>{L.fileTypes}</span>
                </div>

                <div className="files-distribution-bar mb-2">
                  {fileTypeStats.map((item, i) => (
                    <div
                      key={i}
                      className="files-distribution-segment"
                      style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                      title={`${item.label}: ${item.countFormatted}`}
                    />
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-mono">
                  {fileTypeStats.map((item, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-slate-300 font-semibold">{item.label}</span>
                      <span className="text-slate-500">{item.countFormatted}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Distribution 2: Modification Age */}
              <div className="bg-[#07152b] p-2.5 rounded-lg border border-[#122b50]">
                <div className="text-[11px] font-bold text-white mb-1.5 flex items-center justify-between">
                  <span>{L.ageDistribution}</span>
                </div>

                <div className="files-distribution-bar mb-2">
                  {ageStats.map((item, i) => (
                    <div
                      key={i}
                      className="files-distribution-segment"
                      style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                      title={`${item.label}: ${item.countFormatted}`}
                    />
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-mono">
                  {ageStats.map((item, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-slate-300 font-semibold">{item.label}</span>
                      <span className="text-slate-500">{item.countFormatted}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 3. Main Center Split: Table Register & Right Detail Inspector */}
          <div className="flex-1 flex gap-3 px-6 py-2.5 min-h-0 overflow-hidden">
            {/* Left-Center Results Table */}
            <div className="flex-1 bg-[#061226] rounded-xl border border-[#132c52] overflow-hidden flex flex-col min-h-0 select-none shadow-inner">
              {/* Table Header */}
              <div className="h-8 bg-[#091a33] border-b border-[#132c52] px-3 flex items-center text-[11px] font-semibold text-slate-400">
                <div className="w-8 shrink-0 flex items-center">
                  <div
                    data-testid="files-select-all"
                    role="checkbox"
                    tabIndex={0}
                    aria-checked={filteredFiles.length > 0 && checkedFileIds.size === filteredFiles.length}
                    aria-label={locale === 'en' ? 'Select all visible files' : 'تحديد كل الملفات الظاهرة'}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        handleToggleCheckAll();
                      }
                    }}
                    onClick={handleToggleCheckAll}
                    className={`w-3.5 h-3.5 rounded flex items-center justify-center border cursor-pointer ${
                      filteredFiles.length > 0 && checkedFileIds.size === filteredFiles.length
                        ? 'bg-[#2476ff] border-[#26c6ff] text-white'
                        : 'bg-transparent border-slate-600 hover:border-slate-400'
                    }`}
                  >
                    {filteredFiles.length > 0 && checkedFileIds.size === filteredFiles.length && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                  </div>
                </div>

                <div className="flex-1 min-w-[140px]">{L.name}</div>
                <div className="w-44 hidden min-[1600px]:block">{L.parentFolder}</div>
                <div className="w-32 hidden md:block px-2">{L.type}</div>
                <div className="w-20 text-right px-2">{L.size}</div>
                <div className="w-36 hidden lg:block px-2">{L.dateModified} ↓</div>
                <div className="w-24 hidden min-[1800px]:block">{L.source}</div>
                <div className="w-10 text-center">•••</div>
                {measured && (
                  <div className="ml-2 text-[9px] font-mono text-emerald-300/80 normal-case">
                    {L.first} {filteredFiles.length} {L.of} {measuredOverview?.totals.files.toLocaleString() || 0}
                  </div>
                )}
              </div>

              {/* Empty state */}
              {filteredFiles.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center p-6">
                  <FileText className="w-8 h-8 text-slate-500" />
                  <div className="text-xs font-semibold text-slate-300">
                    {measured
                      ? (activeCategory === 'folders'
                          ? 'Folder rows are not indexed by this read-only inventory.'
                          : 'No measured files match the current filters.')
                      : 'No fixture files match the current filters.'}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {measured ? 'Adjust the query or rescan the authorized source.' : 'Design fixture only — no device scan occurred.'}
                  </div>
                </div>
              )}

              {/* Table Rows */}
              <div className={`${viewMode === 'grid' || filteredFiles.length === 0 ? 'hidden' : 'flex-1 overflow-y-auto'} files-scrollbar divide-y divide-[#0c1f3b]`}>
                {filteredFiles.map((file) => {
                  const isSelected = selectedFile.id === file.id;
                  const isChecked = checkedFileIds.has(file.id);

                  return (
                    <div
                      key={file.id}
                      onClick={() => setSelectedFile(file)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          setSelectedFile(file);
                        }
                      }}
                      tabIndex={0}
                      data-testid={`files-row-${file.id}`}
                      className={`h-9 px-3 flex items-center text-xs transition-colors cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-cyan-400 ${
                        isSelected
                          ? 'file-row-selected'
                          : 'hover:bg-[#091a32] text-slate-200'
                      }`}
                    >
                      {/* Checkbox */}
                      <div
                        className="w-8 shrink-0 flex items-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleCheck(file.id);
                        }}
                      >
                        <div
                          className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-all ${
                            isChecked
                              ? 'bg-[#2476ff] border-[#26c6ff] text-white shadow-[0_0_6px_#26c6ff]'
                              : 'bg-transparent border-slate-600 hover:border-slate-400'
                          }`}
                        >
                          {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                      </div>

                      {/* Icon & File Name */}
                      <div className="flex-1 min-w-[140px] flex items-center gap-2 truncate pr-2">
                        {file.thumbnailUrl ? (
                          <img
                            src={file.thumbnailUrl}
                            alt=""
                            className="w-5 h-5 rounded object-cover shrink-0 border border-slate-700"
                          />
                        ) : (
                          <FileIcon name={file.name} type={file.type} />
                        )}
                        <span className={`truncate font-medium ${isSelected ? 'text-white font-bold' : 'text-slate-200'}`}>
                          {file.name}
                        </span>
                      </div>

                      {/* Parent Folder */}
                      <div className="w-44 text-slate-400 truncate text-[11px] font-mono hidden min-[1600px]:block px-2" title={file.parentFolder}>
                        {file.parentFolder}
                      </div>

                      {/* Type */}
                      <div className="w-32 text-slate-400 truncate text-[11px] hidden md:block px-2">
                        {file.type}
                      </div>

                      {/* Size */}
                      <div className="w-20 text-right px-2 text-slate-300 font-mono text-[11px]">
                        {file.sizeFormatted}
                      </div>

                      {/* Date Modified */}
                      <div className="w-36 text-slate-400 font-mono text-[11px] truncate hidden lg:block px-2">
                        {file.dateModifiedFormatted}
                      </div>

                      {/* Source */}
                      <div className="w-24 text-slate-400 text-[11px] truncate hidden min-[1800px]:block px-2">
                        {file.source}
                      </div>

                      {/* Action Menu */}
                      <div
                        className="w-10 flex items-center justify-center text-slate-500 hover:text-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenRowMenu(file);
                        }}
                      >
                        <MoreHorizontal className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Grid view */}
              {viewMode === 'grid' && filteredFiles.length > 0 && (
                <div className="flex-1 overflow-y-auto files-scrollbar p-2 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 content-start">
                  {filteredFiles.map((file) => {
                    const isSelected = selectedFile.id === file.id;
                    const isChecked = checkedFileIds.has(file.id);
                    return (
                      <div
                        key={file.id}
                        onClick={() => setSelectedFile(file)}
                        className={`rounded-lg overflow-hidden border cursor-pointer transition-all ${isSelected ? 'border-[#2476ff] bg-[#0e2447] shadow-[0_0_12px_rgba(36,118,255,0.35)]' : 'border-[#132c52] bg-[#08172c] hover:border-[#1d427b]'}`}
                      >
                        <div className="relative aspect-video bg-[#050d1a] flex items-center justify-center overflow-hidden">
                          {file.thumbnailUrl ? (
                            <img src={file.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <FileIcon name={file.name} type={file.type} className="w-8 h-8" />
                          )}
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              handleToggleCheck(file.id);
                            }}
                            className={`absolute top-1.5 left-1.5 w-4 h-4 rounded border flex items-center justify-center ${isChecked ? 'bg-[#2476ff] border-[#26c6ff] text-white' : 'bg-black/50 border-white/50'}`}
                            aria-label={`Select ${file.name}`}
                          >
                            {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </button>
                        </div>
                        <div className="p-1.5">
                          <div className="text-[11px] font-semibold text-slate-200 truncate" title={file.name}>{file.name}</div>
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5 flex items-center justify-between gap-1">
                            <span className="truncate">{file.type}</span>
                            <span className="shrink-0">{file.sizeFormatted}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Detail Panel (Inspector) */}
            <div className="w-80 xl:w-96 shrink-0 flex flex-col gap-2.5 select-none overflow-y-auto files-scrollbar">
              {/* Selected File Dossier */}
              <div className="bg-[#07152b] rounded-xl p-3.5 border border-[#132c52] space-y-3 shadow-lg">
                {/* Header with Title and Window Controls */}
                <div className="flex items-center justify-between pb-2 border-b border-[#0f2545]">
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-xs font-bold text-white truncate" title={selectedFile.name}>
                      {selectedFile.name}
                    </span>
                    <span className={`text-[8px] font-mono font-bold px-1 py-0.5 rounded border ${measured ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40' : 'bg-amber-950/60 text-amber-300 border-amber-500/40'}`}>
                      {measured ? 'MEASURED' : 'FIXTURE'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-slate-400">
                    <button onClick={() => stepSelection(-1)} disabled={!filteredFiles.length} title={locale === 'en' ? 'Previous file' : 'الملف السابق'} aria-label={locale === 'en' ? 'Previous file' : 'الملف السابق'} className="p-1 hover:text-white disabled:opacity-40"><ChevronLeft className="w-3.5 h-3.5" /></button>
                    <button onClick={() => stepSelection(1)} disabled={!filteredFiles.length} title={locale === 'en' ? 'Next file' : 'الملف التالي'} aria-label={locale === 'en' ? 'Next file' : 'الملف التالي'} className="p-1 hover:text-white disabled:opacity-40"><ChevronRight className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setPreviewExpanded((value) => !value)} title={locale === 'en' ? 'Expand preview' : 'توسيع المعاينة'} aria-label={locale === 'en' ? 'Expand preview' : 'توسيع المعاينة'} aria-pressed={previewExpanded} className="p-1 hover:text-white"><Maximize2 className="w-3 h-3" /></button>
                  </div>
                </div>

                {/* Big Photo Preview */}
                <div className={`relative w-full rounded-lg overflow-hidden bg-black/60 border border-[#142e56] shadow-md group ${previewExpanded ? 'h-64' : 'h-32 min-[1600px]:h-40'}`}>
                  {selectedFile.thumbnailUrl ? (
                    <img
                      src={selectedFile.thumbnailUrl}
                      alt={selectedFile.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-[#091a32] to-[#0d274d]">
                      <FileIcon name={selectedFile.name} type={selectedFile.type} className="w-12 h-12" />
                    </div>
                  )}
                </div>

                {/* Actions Grid */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => void handleOpenFile()}
                    className="py-1.5 rounded-lg bg-[#2476ff] hover:bg-[#3282ff] text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-[0_0_12px_rgba(36,118,255,0.4)] cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>{L.open}</span>
                  </button>

                  <button
                    onClick={() => void handleRevealFile()}
                    className="py-1.5 rounded-lg bg-[#0a182d] hover:bg-[#122c50] text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 border border-[#1b3f70] cursor-pointer"
                  >
                    <FolderOpen className="w-3.5 h-3.5 text-slate-400" />
                    <span>{L.reveal}</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => void handleCopyPath()}
                    disabled={measured && !selectedMetadata}
                    className="py-1 rounded bg-[#08162b] hover:bg-[#10274a] disabled:opacity-50 text-slate-300 hover:text-white text-[11px] flex items-center justify-center gap-1 border border-[#132c52] cursor-pointer"
                  >
                    <Copy className="w-3 h-3 text-slate-400" />
                    <span>{L.copyPath}</span>
                  </button>

                  <button
                    onClick={() => void handleHashFile()}
                    disabled={measured && filesNative.hashLoading}
                    className="py-1 rounded bg-[#08162b] hover:bg-[#10274a] disabled:opacity-50 text-slate-300 hover:text-white text-[11px] flex items-center justify-center gap-1 border border-[#132c52] cursor-pointer"
                  >
                    <Hash className="w-3 h-3 text-cyan-400" />
                    <span>{L.calculateHash}</span>
                  </button>
                </div>


                {/* Metadata Rows */}
                <div className="space-y-1 text-[11px]">
                  <div className="flex items-start justify-between py-0.5">
                    <span className="text-slate-400">{L.name}</span>
                    <span className="font-semibold text-white truncate max-w-[190px] text-right" title={selectedFile.name}>
                      {selectedFile.name}
                    </span>
                  </div>

                  <div className="flex items-start justify-between py-0.5">
                    <span className="text-slate-400">{L.type}</span>
                    <span className="text-slate-200 text-right">{selectedFile.type}</span>
                  </div>

                  <div className="flex items-start justify-between py-0.5">
                    <span className="text-slate-400">{L.size}</span>
                    <span className="font-mono text-slate-200 text-right">
                      {selectedFile.sizeFormatted} ({selectedFile.exactBytes?.toLocaleString() || '—'} bytes)
                    </span>
                  </div>

                  {selectedFile.dimensions && (
                    <div className="flex items-start justify-between py-0.5">
                      <span className="text-slate-400">{locale === 'en' ? 'Dimensions' : 'الأبعاد'}</span>
                      <span className="font-mono text-cyan-300 text-right">{selectedFile.dimensions}</span>
                    </div>
                  )}

                  <div className="flex items-start justify-between py-0.5">
                    <span className="text-slate-400">{L.dateModified}</span>
                    <span className="font-mono text-slate-200 text-right">{selectedFile.dateModifiedFormatted}</span>
                  </div>

                  <div className="flex items-start justify-between py-0.5">
                    <span className="text-slate-400 shrink-0">{L.path}</span>
                    <span
                      className="font-mono text-slate-400 text-[10px] text-right truncate max-w-[190px]"
                      title={selectedMetadata?.fullPath || `${selectedFile.parentFolder}\\${selectedFile.name}`}
                    >
                      {selectedMetadata?.fullPath || `${selectedFile.parentFolder}\\${selectedFile.name}`}
                    </span>
                  </div>

                  {measured && selectedMetadata && (
                    <>
                      <div className="flex items-start justify-between py-0.5">
                        <span className="text-slate-400">{L.created}</span>
                        <span className="font-mono text-slate-200 text-right">
                          {selectedMetadata.createdAt ? new Date(selectedMetadata.createdAt).toLocaleString() : '—'}
                        </span>
                      </div>
                      <div className="flex items-start justify-between py-0.5">
                        <span className="text-slate-400">{L.identity}</span>
                        <span className="font-mono text-cyan-300 text-[10px] text-right truncate max-w-[190px]" title={selectedMetadata.fileIdentity || undefined}>
                          {selectedMetadata.fileIdentity || '—'}
                        </span>
                      </div>
                      <div className="flex items-start justify-between py-0.5">
                        <span className="text-slate-400">{L.zone}</span>
                        <span className="font-mono text-slate-200 text-right">
                          {selectedMetadata.zone.zoneAvailable
                            ? `Zone ${selectedMetadata.zone.zoneId ?? '?'}`
                            : (locale === 'en' ? 'No Zone.Identifier' : 'لا توجد Zone.Identifier')}
                        </span>
                      </div>
                      <div className="flex items-start justify-between py-0.5">
                        <span className="text-slate-400">{L.attributes}</span>
                        <span className="font-mono text-slate-400 text-right">
                          {selectedMetadata.attributesAvailable
                            ? String(selectedMetadata.attributes)
                            : (locale === 'en' ? 'Unavailable — not guessed' : 'غير متاحة — دون تخمين')}
                        </span>
                      </div>
                    </>
                  )}
                  {measured && filesNative.metadataLoading && (
                    <div className="text-[10px] text-cyan-300 font-mono animate-pulse">
                      {locale === 'en' ? 'Reading measured metadata…' : 'جارٍ قراءة البيانات الوصفية…'}
                    </div>
                  )}
                </div>

                {measured && selectedHash && (
                  <div className="rounded-lg bg-[#050e1c] border border-emerald-500/30 p-2 space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-emerald-300 font-mono font-bold">
                      <span>SHA-256</span>
                      <span>
                        {selectedHash.digestReliable
                          ? (locale === 'en' ? 'Verified read' : 'قراءة موثقة')
                          : (locale === 'en' ? 'File changed during read' : 'تغيّر الملف أثناء القراءة')}
                      </span>
                    </div>
                    <div className="font-mono text-[9px] text-slate-300 break-all">{selectedHash.digest}</div>
                    <div className="text-[9px] text-slate-500 font-mono">
                      {selectedHash.bytesRead.toLocaleString()} bytes · {selectedHash.algorithm}
                    </div>
                  </div>
                )}
                {measured && filesNative.hashLoading && (
                  <div className="text-[10px] text-cyan-300 font-mono animate-pulse">
                    {locale === 'en' ? 'Hashing the selected file (read-only)…' : 'جارٍ حساب التجزئة للقراءة فقط…'}
                  </div>
                )}

                {/* Add to Organization Plan Button */}
                <button
                  onClick={handleOpenStudio}
                  className="w-full py-2 rounded-lg bg-gradient-to-r from-[#713bff] to-[#5123bb] hover:from-[#844dff] hover:to-[#612de0] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-[0_0_14px_rgba(113,59,255,0.5)] border border-purple-400/50 cursor-pointer"
                >
                  <FolderTree className="w-3.5 h-3.5" />
                  <span>{L.planStudio}</span>
                </button>
              </div>

              {/* Sub-Card 1: Live Service Preview */}
              <div className="bg-[#07152b] rounded-xl p-3 border border-[#132c52] space-y-2">
                <div className="flex items-center justify-between pb-1.5 border-b border-[#0f2545]">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                    <Cloud className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{L.livePreview}</span>
                  </div>
                  <span className="text-[10px] text-cyan-300 font-mono">{measured ? (filesNative.source?.label || 'Local') : 'OneDrive (fixture)'}</span>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-12 h-10 rounded overflow-hidden bg-black shrink-0 border border-slate-700">
                    <img src={selectedFile.thumbnailUrl || ''} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate">{selectedFile.name}</div>
                    <div className="text-[10px] text-slate-400">
                      {measured
                        ? (locale === 'en' ? 'Measured local file. No organization plan has executed.' : 'ملف محلي مقيس. لم تُنفذ أي خطة تنظيم.')
                        : (locale === 'en' ? 'Design fixture — not an actual OneDrive item.' : 'بيانات تجريبية — ليست عنصر OneDrive فعليًا.')}
                    </div>
                  </div>
                </div>

                {/* Suggested Action Box */}
                <div className="p-2 rounded-lg bg-[#0e223d] border border-[#2476ff]/40 flex items-start justify-between gap-1.5 transition-all">
                  <div className="flex items-start gap-1.5 min-w-0">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <div className="text-[10px] text-slate-300 leading-snug">
                      <span className="text-amber-300 font-bold">Suggested action: </span>
                      {selectedFile.suggestedAction || 'Move to Pictures\\Nature\\ and rename using YYYY-MM-DD_Location format.'}
                    </div>
                  </div>
                  <button onClick={handleOpenStudio} title="Review this in the Studio plan" className="shrink-0">
                    <ArrowRight className="w-3.5 h-3.5 text-cyan-400 mt-0.5" />
                  </button>
                </div>
              </div>

              {activeService && (
                <FilesServiceFocus
                  service={activeService}
                  locale={locale}
                  measured={measured}
                  overview={measuredOverview}
                  selectedFile={selectedFile}
                  metadata={selectedMetadata}
                  hash={selectedHash}
                  emptyFolders={filesNative.emptyFolders}
                  emptyFoldersLoading={filesNative.emptyFoldersLoading}
                  onClose={() => setActiveService(null)}
                  onAdd={() => void filesNative.addSource()}
                  onRescan={() => filesNative.source && void filesNative.scanSource(filesNative.source.id)}
                  onOpenStudio={handleOpenStudio}
                  onLoadEmpty={() => void filesNative.loadEmptyFolders()}
                  onHash={() => void handleHashFile()}
                />
              )}

              {/* Sub-Card 2: KNOuX Services (12 Domain Service Cards Dock) */}
              <div className="bg-[#07152b] rounded-xl p-3 border border-[#132c52] space-y-2">
                <div className="text-xs font-bold text-white flex items-center justify-between pb-1 border-b border-[#0f2545]">
                  <span>{L.services}</span>
                  <span className="text-[9px] text-slate-500 font-mono">{measured ? 'Measured read-only' : 'Design fixture'}</span>
                </div>

                <div className="grid grid-cols-6 gap-1.5">
                  {FILES_DOMAIN_SERVICES.map((serv) => (
                    <button
                      key={serv.key}
                      data-service-key={serv.key}
                      onClick={() => setActiveService(serv.key)}
                      className="p-1.5 rounded-lg bg-[#091a33] hover:bg-[#122e57] text-cyan-300 hover:text-white border border-[#142e56] hover:border-[#2476ff]/60 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer group"
                      title={serv.labelEn}
                    >
                      {renderServiceIcon(serv.iconName)}
                      <span className="text-[8px] font-mono leading-tight text-center truncate w-full text-slate-400 group-hover:text-cyan-200">
                        {serv.labelEn.split(' ')[0]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 4. Sticky Action Footer */}
          <footer className="h-12 bg-[#050e1f] border-t border-[#132c52] px-6 flex items-center justify-between select-none shrink-0 z-30">
            {/* Left Selection Stat */}
            <div className="flex items-center gap-2.5 text-xs text-slate-300">
              <div
                onClick={handleToggleCheckAll}
                className={`w-3.5 h-3.5 rounded flex items-center justify-center border cursor-pointer ${
                  selectedCount > 0 ? 'bg-[#2476ff] border-[#26c6ff] text-white' : 'border-slate-500'
                }`}
              >
                {selectedCount > 0 && <Check className="w-2.5 h-2.5 stroke-[3]" />}
              </div>
              <span className="font-semibold text-white">
                {selectedCount} {selectedCount === 1 ? L.selected : L.selectedPlural} ({selectedSizeFormatted})
              </span>
            </div>

            {/* Center Readiness Label */}
            <div className="text-xs text-slate-400 hidden md:block">
              {measured ? (
                locale === 'en' ? (
                  <><span className="text-cyan-300 font-bold">Measured read-only</span> • Plan execution stays blocked until explicit approval.</>
                ) : (
                  <><span className="text-cyan-300 font-bold">فهرس مقيس للقراءة فقط</span> • يبقى التنفيذ محظورًا حتى الموافقة الصريحة.</>
                )
              ) : locale === 'en' ? (
                <><span className="text-amber-300 font-bold">Design fixture</span> • Index real files in the Electron client.</>
              ) : (
                <><span className="text-amber-300 font-bold">بيانات تجريبية</span> • افهرس ملفات حقيقية في عميل Electron.</>
              )}
            </div>

            {/* Right Action Button */}
            <button
              data-testid="files-plan-cta"
              onClick={handleOpenStudio}
              className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-[#713bff] via-[#2476ff] to-[#1c5fdb] hover:from-[#844dff] hover:to-[#226cf0] text-white text-xs font-bold flex items-center gap-1.5 shadow-[0_0_15px_rgba(36,118,255,0.6)] border border-cyan-400/50 cursor-pointer"
            >
              <span>{L.planStudio}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </footer>
        </main>
      </div>


    </div>
  );
}
