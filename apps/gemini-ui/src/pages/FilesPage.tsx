/**
 * KNOuX SmartOrganizer — Files / Instant Find & Visual Intelligence
 * Mandatory Target: REF-03_Files_Instant_Find.png (1672x941 native)
 */

import React, { useState, useMemo } from 'react';
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
import { FileWorkspacesModal } from '../components/files/FileWorkspaces';
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
  const [sortBy, setSortBy] = useState<'date_desc' | 'name_asc' | 'size_desc'>('date_desc');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [activeServiceModal, setActiveServiceModal] = useState<FilesServiceKey | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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

  // Filter and sort files
  const filteredFiles = useMemo(() => {
    return files.filter((file) => {
      if (activeCategory === 'images' && file.category !== 'images') return false;
      if (activeCategory === 'videos' && file.category !== 'videos') return false;
      if (activeCategory === 'documents' && file.category !== 'documents') return false;
      if (activeCategory === 'archives' && file.category !== 'archives') return false;
      if (activeCategory === 'code' && file.category !== 'code') return false;
      if (activeCategory === 'other' && file.category !== 'other') return false;

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
  }, [files, activeCategory, searchQuery]);

  // Aggregate selected files info
  const selectedCount = checkedFileIds.size;
  const selectedSizeFormatted =
    selectedCount === 1
      ? files.find((f) => checkedFileIds.has(f.id))?.sizeFormatted || '6.1 MB'
      : `${(selectedCount * 4.2).toFixed(1)} MB`;

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
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981]" />
                  <div className="text-[10px] leading-tight">
                    <span className="font-bold text-white font-mono">Indexed 1,248,632</span> items
                    <div className="text-slate-400 text-[9px]">5 locations • Live results</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Category Filter Pills (9 categories) */}
            <div className="flex items-center gap-1.5 overflow-x-auto files-scrollbar pb-1 mb-2">
              {[
                { id: 'all' as FileCategoryFilter, label: 'All (1.2M)', icon: null },
                { id: 'files' as FileCategoryFilter, label: 'Files (987K)', icon: FileText },
                { id: 'folders' as FileCategoryFilter, label: 'Folders (261K)', icon: Folder, color: '#eab308' },
                { id: 'images' as FileCategoryFilter, label: 'Images (184K)', icon: ImageIcon, color: '#ec4899' },
                { id: 'videos' as FileCategoryFilter, label: 'Videos (48K)', icon: Video, color: '#a855f7' },
                { id: 'documents' as FileCategoryFilter, label: 'Documents (320K)', icon: FileText, color: '#3b82f6' },
                { id: 'archives' as FileCategoryFilter, label: 'Archives (24K)', icon: Archive, color: '#f59e0b' },
                { id: 'code' as FileCategoryFilter, label: 'Code (96K)', icon: Code, color: '#10b981' },
                { id: 'other' as FileCategoryFilter, label: 'Other (47K)', icon: FileText, color: '#64748b' },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeCategory === tab.id;

                return (
                  <button
                    key={tab.id}
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
                    onChange={(e) => setSelectedExtension(e.target.value)}
                    className="bg-[#08172c] text-slate-300 hover:text-white border border-[#142e56] rounded-md px-2.5 py-1 text-xs font-medium cursor-pointer appearance-none pr-6 outline-none"
                  >
                    <option value="All">Extension: All extensions</option>
                    <option value="jpg">.jpg, .png</option>
                    <option value="docx">.docx, .pdf</option>
                    <option value="zip">.zip, .rar</option>
                  </select>
                  <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-2 pointer-events-none" />
                </div>

                {/* File Size */}
                <div className="relative">
                  <select
                    value={selectedSizeFilter}
                    onChange={(e) => setSelectedSizeFilter(e.target.value)}
                    className="bg-[#08172c] text-slate-300 hover:text-white border border-[#142e56] rounded-md px-2.5 py-1 text-xs font-medium cursor-pointer appearance-none pr-6 outline-none"
                  >
                    <option value="Any">File Size: Any size</option>
                    <option value="large">&gt; 100 MB</option>
                    <option value="medium">10 MB - 100 MB</option>
                    <option value="small">&lt; 10 MB</option>
                  </select>
                  <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-2 pointer-events-none" />
                </div>

                {/* Date Modified */}
                <div className="relative">
                  <select className="bg-[#08172c] text-slate-300 hover:text-white border border-[#142e56] rounded-md px-2.5 py-1 text-xs font-medium cursor-pointer appearance-none pr-6 outline-none">
                    <option>Date Modified: Any time</option>
                    <option>Today</option>
                    <option>This Week</option>
                    <option>This Month</option>
                  </select>
                  <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-2 pointer-events-none" />
                </div>

                {/* Location */}
                <div className="relative">
                  <select className="bg-[#08172c] text-slate-300 hover:text-white border border-[#142e56] rounded-md px-2.5 py-1 text-xs font-medium cursor-pointer appearance-none pr-6 outline-none">
                    <option>Location: All locations</option>
                    <option>Local Disk (C:)</option>
                    <option>OneDrive</option>
                    <option>GitHub</option>
                  </select>
                  <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-2 pointer-events-none" />
                </div>
              </div>

              {/* Sort & View Density Toggle */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-[#08172c] text-slate-300 hover:text-white border border-[#142e56] rounded-md px-2.5 py-1 text-xs font-medium cursor-pointer appearance-none pr-6 outline-none"
                  >
                    <option value="date_desc">Sort: Date modified (newest)</option>
                    <option value="name_asc">Sort: Name (A-Z)</option>
                    <option value="size_desc">Sort: Size (largest)</option>
                  </select>
                  <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-2 pointer-events-none" />
                </div>

                <div className="flex items-center bg-[#071529] p-0.5 rounded-md border border-[#142e56]">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1 rounded text-xs transition-colors cursor-pointer ${
                      viewMode === 'list' ? 'bg-[#173866] text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </button>
                  <button
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
                  <span>{locale === 'en' ? 'File Types Distribution' : 'توزيع أنواع الملفات'}</span>
                </div>

                <div className="files-distribution-bar mb-2">
                  {FILE_TYPES_DISTRIBUTION.map((item, i) => (
                    <div
                      key={i}
                      className="files-distribution-segment"
                      style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                      title={`${item.label}: ${item.countFormatted}`}
                    />
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-mono">
                  {FILE_TYPES_DISTRIBUTION.map((item, i) => (
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
                  <span>{locale === 'en' ? 'Modification Age Distribution' : 'توزيع أعمار التعديل'}</span>
                </div>

                <div className="files-distribution-bar mb-2">
                  {MODIFICATION_AGE_DISTRIBUTION.map((item, i) => (
                    <div
                      key={i}
                      className="files-distribution-segment"
                      style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                      title={`${item.label}: ${item.countFormatted}`}
                    />
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-mono">
                  {MODIFICATION_AGE_DISTRIBUTION.map((item, i) => (
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
                    onClick={handleToggleCheckAll}
                    className={`w-3.5 h-3.5 rounded flex items-center justify-center border cursor-pointer ${
                      checkedFileIds.size === filteredFiles.length
                        ? 'bg-[#2476ff] border-[#26c6ff] text-white'
                        : 'bg-transparent border-slate-600 hover:border-slate-400'
                    }`}
                  >
                    {checkedFileIds.size === filteredFiles.length && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                  </div>
                </div>

                <div className="flex-1 min-w-[140px]">Name</div>
                <div className="w-48 hidden sm:block">Parent Folder</div>
                <div className="w-32 hidden md:block">Type</div>
                <div className="w-20 text-right pr-2">Size</div>
                <div className="w-36 hidden lg:block">Date Modified ↓</div>
                <div className="w-24 hidden xl:block">Source</div>
                <div className="w-10 text-center">•••</div>
              </div>

              {/* Table Rows */}
              <div className="flex-1 overflow-y-auto files-scrollbar divide-y divide-[#0c1f3b]">
                {filteredFiles.map((file) => {
                  const isSelected = selectedFile.id === file.id;
                  const isChecked = checkedFileIds.has(file.id);

                  return (
                    <div
                      key={file.id}
                      onClick={() => setSelectedFile(file)}
                      className={`h-9 px-3 flex items-center text-xs transition-colors cursor-pointer ${
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
                      <div className="w-48 text-slate-400 truncate text-[11px] font-mono hidden sm:block" title={file.parentFolder}>
                        {file.parentFolder}
                      </div>

                      {/* Type */}
                      <div className="w-32 text-slate-400 truncate text-[11px] hidden md:block">
                        {file.type}
                      </div>

                      {/* Size */}
                      <div className="w-20 text-right pr-2 text-slate-300 font-mono text-[11px]">
                        {file.sizeFormatted}
                      </div>

                      {/* Date Modified */}
                      <div className="w-36 text-slate-400 font-mono text-[11px] truncate hidden lg:block">
                        {file.dateModifiedFormatted}
                      </div>

                      {/* Source */}
                      <div className="w-24 text-slate-400 text-[11px] truncate hidden xl:block">
                        {file.source}
                      </div>

                      {/* Action Menu */}
                      <div
                        className="w-10 flex items-center justify-center text-slate-500 hover:text-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          showToast(`Options for ${file.name}`);
                        }}
                      >
                        <MoreHorizontal className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  );
                })}
              </div>
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
                  </div>

                  <div className="flex items-center gap-1 text-slate-400">
                    <button className="p-1 hover:text-white"><ChevronLeft className="w-3.5 h-3.5" /></button>
                    <button className="p-1 hover:text-white"><ChevronRight className="w-3.5 h-3.5" /></button>
                    <button className="p-1 hover:text-white"><Maximize2 className="w-3 h-3" /></button>
                  </div>
                </div>

                {/* Big Photo Preview */}
                <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-black/60 border border-[#142e56] shadow-md group">
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

                {/* Metadata Rows */}
                <div className="space-y-1 text-[11px]">
                  <div className="flex items-start justify-between py-0.5">
                    <span className="text-slate-400">Name</span>
                    <span className="font-semibold text-white truncate max-w-[190px] text-right" title={selectedFile.name}>
                      {selectedFile.name}
                    </span>
                  </div>

                  <div className="flex items-start justify-between py-0.5">
                    <span className="text-slate-400">Type</span>
                    <span className="text-slate-200 text-right">{selectedFile.type}</span>
                  </div>

                  <div className="flex items-start justify-between py-0.5">
                    <span className="text-slate-400">Size</span>
                    <span className="font-mono text-slate-200 text-right">
                      {selectedFile.sizeFormatted} ({selectedFile.exactBytes?.toLocaleString() || '6,437,281'} bytes)
                    </span>
                  </div>

                  {selectedFile.dimensions && (
                    <div className="flex items-start justify-between py-0.5">
                      <span className="text-slate-400">Dimensions</span>
                      <span className="font-mono text-cyan-300 text-right">{selectedFile.dimensions}</span>
                    </div>
                  )}

                  <div className="flex items-start justify-between py-0.5">
                    <span className="text-slate-400">Date Modified</span>
                    <span className="font-mono text-slate-200 text-right">{selectedFile.dateModifiedFormatted}</span>
                  </div>

                  <div className="flex items-start justify-between py-0.5">
                    <span className="text-slate-400 shrink-0">Path</span>
                    <span className="font-mono text-slate-400 text-[10px] text-right truncate max-w-[190px]" title={`${selectedFile.parentFolder}\\${selectedFile.name}`}>
                      {selectedFile.parentFolder}\{selectedFile.name}
                    </span>
                  </div>
                </div>

                {/* Actions Grid */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => showToast(`Opened ${selectedFile.name}`)}
                    className="py-1.5 rounded-lg bg-[#2476ff] hover:bg-[#3282ff] text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-[0_0_12px_rgba(36,118,255,0.4)] cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>Open</span>
                  </button>

                  <button
                    onClick={() => showToast(`Revealed in Explorer`)}
                    className="py-1.5 rounded-lg bg-[#0a182d] hover:bg-[#122c50] text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 border border-[#1b3f70] cursor-pointer"
                  >
                    <FolderOpen className="w-3.5 h-3.5 text-slate-400" />
                    <span>Reveal in Explorer</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => showToast(`Copied path to clipboard`)}
                    className="py-1 rounded bg-[#08162b] hover:bg-[#10274a] text-slate-300 hover:text-white text-[11px] flex items-center justify-center gap-1 border border-[#132c52] cursor-pointer"
                  >
                    <Copy className="w-3 h-3 text-slate-400" />
                    <span>Copy Path</span>
                  </button>

                  <button
                    onClick={() => setActiveServiceModal('file-hash')}
                    className="py-1 rounded bg-[#08162b] hover:bg-[#10274a] text-slate-300 hover:text-white text-[11px] flex items-center justify-center gap-1 border border-[#132c52] cursor-pointer"
                  >
                    <Hash className="w-3 h-3 text-cyan-400" />
                    <span>Calculate Hash</span>
                  </button>
                </div>

                {/* Add to Organization Plan Button */}
                <button
                  onClick={() => showToast(`Added ${selectedFile.name} to Organization Plan`)}
                  className="w-full py-2 rounded-lg bg-gradient-to-r from-[#713bff] to-[#5123bb] hover:from-[#844dff] hover:to-[#612de0] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-[0_0_14px_rgba(113,59,255,0.5)] border border-purple-400/50 cursor-pointer"
                >
                  <FolderTree className="w-3.5 h-3.5" />
                  <span>Add to Organization Plan</span>
                </button>
              </div>

              {/* Sub-Card 1: Live Service Preview */}
              <div className="bg-[#07152b] rounded-xl p-3 border border-[#132c52] space-y-2">
                <div className="flex items-center justify-between pb-1.5 border-b border-[#0f2545]">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                    <Cloud className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Live Service Preview</span>
                  </div>
                  <span className="text-[10px] text-cyan-300 font-mono">OneDrive</span>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-12 h-10 rounded overflow-hidden bg-black shrink-0 border border-slate-700">
                    <img src={selectedFile.thumbnailUrl || ''} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate">{selectedFile.name}</div>
                    <div className="text-[10px] text-slate-400">This file is not yet organized.</div>
                  </div>
                </div>

                {/* Suggested Action Box */}
                <div
                  onClick={() => showToast(`Executing suggestion for ${selectedFile.name}`)}
                  className="p-2 rounded-lg bg-[#0e223d] border border-[#2476ff]/40 flex items-start justify-between gap-1.5 cursor-pointer hover:border-[#2476ff] transition-all"
                >
                  <div className="flex items-start gap-1.5 min-w-0">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <div className="text-[10px] text-slate-300 leading-snug">
                      <span className="text-amber-300 font-bold">Suggested action: </span>
                      {selectedFile.suggestedAction || 'Move to Pictures\\Nature\\ and rename using YYYY-MM-DD_Location format.'}
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                </div>
              </div>

              {/* Sub-Card 2: KNOuX Services (12 Domain Service Cards Dock) */}
              <div className="bg-[#07152b] rounded-xl p-3 border border-[#132c52] space-y-2">
                <div className="text-xs font-bold text-white flex items-center justify-between pb-1 border-b border-[#0f2545]">
                  <span>KNOuX Services</span>
                  <span className="text-[9px] text-slate-500 font-mono">12 Active Services</span>
                </div>

                <div className="grid grid-cols-6 gap-1.5">
                  {FILES_DOMAIN_SERVICES.map((serv) => (
                    <button
                      key={serv.key}
                      onClick={() => setActiveServiceModal(serv.key)}
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
                {selectedCount} {selectedCount === 1 ? 'file' : 'files'} selected ({selectedSizeFormatted})
              </span>
            </div>

            {/* Center Readiness Label */}
            <div className="text-xs text-slate-400 hidden md:block">
              <span className="text-emerald-400 font-bold">Ready for next step</span> • Review and apply your organization plan.
            </div>

            {/* Right Action Button */}
            <button
              onClick={() => {
                if (onNavigateSection) onNavigateSection('studio');
                showToast('Reviewing Organization Plan in Studio...');
              }}
              className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-[#713bff] via-[#2476ff] to-[#1c5fdb] hover:from-[#844dff] hover:to-[#226cf0] text-white text-xs font-bold flex items-center gap-1.5 shadow-[0_0_15px_rgba(36,118,255,0.6)] border border-cyan-400/50 cursor-pointer"
            >
              <span>{locale === 'en' ? 'Review Organization Plan' : 'مراجعة خطة التنظيم'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </footer>
        </main>
      </div>

      {activeServiceModal && (
        <FileWorkspacesModal
          serviceKey={activeServiceModal}
          onClose={() => setActiveServiceModal(null)}
          locale={locale}
        />
      )}

    </div>
  );
}
