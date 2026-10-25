/**
 * KNOuX SmartOrganizer — Studio Panels (Left Sources, Center Grid & Gallery, Right Inspector)
 */

import React, { useState } from 'react';
import {
  Folder,
  Plus,
  RefreshCw,
  MoreVertical,
  Database,
  Grid,
  List,
  ChevronDown,
  Check,
  AlertTriangle,
  Lock,
  ShieldCheck,
  Compass,
  FileText,
  Sliders,
  Calendar,
  Layers,
  ArrowRight,
  ExternalLink,
  Trash,
} from 'lucide-react';
import { useStudio } from './context';
import { renderCategoryIcon } from './parts';
import { CategoryKey, StudioFileItem } from './types';

/**
 * 04 — Left Column: Authorized Sources (~18-20% width)
 */
export function AuthorizedSourcesPanel() {
  const {
    authorizedSources,
    inventory,
    openModal,
    refreshSources,
    removeAuthorizedSource,
    locale,
  } = useStudio();

  const [activeMenuFolderId, setActiveMenuFolderId] = useState<string | null>(null);

  return (
    <div className="w-64 xl:w-72 shrink-0 flex flex-col gap-3 select-none">
      {/* Authorized Sources Container */}
      <div className="studio-glass-panel rounded-xl p-3 border border-[#132c52] flex flex-col flex-1">
        {/* Header */}
        <div className="flex items-center gap-2 pb-2.5 border-b border-[#0f2545]">
          <Folder className="w-4 h-4 text-cyan-400" />
          <h2 className="text-xs font-bold text-white tracking-wide">
            {locale === 'en' ? 'Authorized Sources' : 'المصادر المصرح بها'}
          </h2>
        </div>

        {/* Folder items list */}
        <div className="py-2 space-y-2 flex-1 overflow-y-auto studio-scrollbar pr-0.5">
          {authorizedSources.length === 0 ? (
            <div className="p-4 text-center rounded-lg border border-dashed border-[#1a3d6d] bg-[#061427]/60">
              <Folder className="w-8 h-8 text-slate-500 mx-auto mb-2" />
              <div className="text-xs font-semibold text-slate-300">
                {locale === 'en' ? 'No authorized sources' : 'لا توجد مصادر مصرح بها'}
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                {locale === 'en'
                  ? 'Grant access to local folders to index & organize.'
                  : 'امنح الإذن للمجلدات المحلية للبدء في الفهرسة والتنظيم.'}
              </p>
            </div>
          ) : (
            authorizedSources.map((folder) => (
              <div
                key={folder.id}
                className="relative p-2 rounded-lg bg-[#0a182e] hover:bg-[#0f2342] border border-[#142e56] hover:border-[#1d427b] transition-all group"
              >
                <div className="flex items-start justify-between gap-1.5">
                  <div className="flex items-start gap-2 min-w-0">
                    <Folder className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 fill-amber-400/20" />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-200 truncate group-hover:text-white" title={folder.path}>
                        {folder.path}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {folder.fileCount.toLocaleString()} files &nbsp;|&nbsp; {folder.sizeGb} GB
                      </div>
                    </div>
                  </div>

                  {/* 3-dots button */}
                  <div className="relative">
                    <button
                      onClick={() =>
                        setActiveMenuFolderId(activeMenuFolderId === folder.id ? null : folder.id)
                      }
                      className="p-1 rounded text-slate-500 hover:text-slate-300 hover:bg-[#163663] transition-colors cursor-pointer"
                      title="More options"
                    >
                      <MoreVertical className="w-3.5 h-3.5" />
                    </button>

                    {activeMenuFolderId === folder.id && (
                      <div className="absolute right-0 top-6 w-36 bg-[#091a33] border border-[#1a3c6d] rounded-lg shadow-xl py-1 z-30 text-xs">
                        <button
                          onClick={() => {
                            refreshSources();
                            setActiveMenuFolderId(null);
                          }}
                          className="w-full text-left px-3 py-1.5 text-slate-300 hover:bg-[#132c52] flex items-center gap-1.5"
                        >
                          <RefreshCw className="w-3 h-3 text-cyan-400" />
                          <span>{locale === 'en' ? 'Re-scan folder' : 'إعادة الفحص'}</span>
                        </button>
                        <button
                          onClick={() => {
                            removeAuthorizedSource(folder.id);
                            setActiveMenuFolderId(null);
                          }}
                          className="w-full text-left px-3 py-1.5 text-red-400 hover:bg-[#132c52] flex items-center gap-1.5"
                        >
                          <Trash className="w-3 h-3" />
                          <span>{locale === 'en' ? 'Revoke grant' : 'إلغاء التصريح'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Buttons: + Add Folder & Refresh Source */}
        <div className="pt-2 border-t border-[#0f2545] space-y-1.5">
          <button
            onClick={() => openModal('add_folder')}
            className="w-full py-1.5 rounded-lg bg-[#0d223f] hover:bg-[#143563] text-cyan-300 border border-[#2476ff]/50 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-cyan-400" />
            <span>{locale === 'en' ? 'Add Folder' : 'إضافة مجلد'}</span>
          </button>

          <button
            onClick={refreshSources}
            className="w-full py-1.5 rounded-lg bg-[#081528] hover:bg-[#0c1f3b] text-slate-400 hover:text-slate-200 border border-[#132c52] text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <RefreshCw className="w-3 h-3 text-slate-500" />
            <span>{locale === 'en' ? 'Refresh Source' : 'تحديث المصدر'}</span>
          </button>
        </div>
      </div>

      {/* Inventory Summary sub-card */}
      <div className="studio-glass-panel rounded-xl p-3 border border-[#132c52]">
        <div className="flex items-center gap-2 pb-2 border-b border-[#0f2545]">
          <Database className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-bold text-white tracking-wide">
            {locale === 'en' ? 'Inventory Summary' : 'ملخص المخزون'}
          </h3>
        </div>

        <div className="pt-2.5 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">{locale === 'en' ? 'Total Files' : 'إجمالي الملفات'}</span>
            <span className="font-semibold text-white font-mono">
              {inventory.totalFiles.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">{locale === 'en' ? 'Total Size' : 'الحجم الكلي'}</span>
            <span className="font-semibold text-cyan-300 font-mono">
              {inventory.totalSizeGb} GB
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">{locale === 'en' ? 'Folders' : 'المجلدات'}</span>
            <span className="font-semibold text-white font-mono">
              {inventory.totalFolders.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">{locale === 'en' ? 'File Types' : 'أنواع الملفات'}</span>
            <span className="font-semibold text-white font-mono">
              {inventory.fileTypesCount}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 05 & 06 — Center Column: File Categories (18) and Gallery
 */
export function CenterCategoriesAndGallery() {
  const {
    categories,
    selectedCategoryKey,
    setSelectedCategoryKey,
    files,
    selectedFileIds,
    toggleFileSelection,
    selectAllFiles,
    deselectAllFiles,
    viewMode,
    setViewMode,
    sortOrder,
    setSortOrder,
    locale,
  } = useStudio();

  const selectedCategory = categories.find((c) => c.key === selectedCategoryKey) || categories[0];

  return (
    <div className="flex-1 flex flex-col gap-3 min-w-0 select-none">
      {/* 05 — File Categories (18) Grid */}
      <div className="studio-glass-panel rounded-xl p-3 border border-[#132c52]">
        <div className="flex items-center justify-between pb-2 border-b border-[#0f2545]">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <h2 className="text-xs font-bold text-white tracking-wide">
              {locale === 'en' ? `File Categories (${categories.length})` : `فئات الملفات (${categories.length})`}
            </h2>
          </div>
          <span className="text-[10px] text-slate-400">
            {locale === 'en' ? 'Select category to filter & inspect' : 'اختر فئة للتصفية والمعاينة'}
          </span>
        </div>

        {/* 6 columns × 3 rows grid of 18 categories */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 pt-2.5">
          {categories.map((cat) => {
            const isSelected = cat.key === selectedCategoryKey;
            return (
              <button
                key={cat.key}
                onClick={() => setSelectedCategoryKey(cat.key)}
                className={`flex flex-col p-2 rounded-lg text-left transition-all cursor-pointer relative overflow-hidden group ${
                  isSelected
                    ? 'bg-[#122e5a] border-2 border-[#2476ff] shadow-[0_0_16px_rgba(36,118,255,0.6)]'
                    : 'bg-[#08172c] hover:bg-[#0e223d] border border-[#142e56] hover:border-[#1e447a]'
                }`}
              >
                {/* Active glow top line */}
                {isSelected && (
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#2476ff] via-[#26c6ff] to-[#713bff]" />
                )}

                <div className="flex items-center justify-between mb-1.5">
                  <div
                    className="p-1.5 rounded-md flex items-center justify-center"
                    style={{
                      backgroundColor: isSelected ? 'rgba(36, 118, 255, 0.3)' : 'rgba(15, 33, 60, 0.6)',
                      color: cat.colorAccent,
                    }}
                  >
                    {renderCategoryIcon(cat.iconName, 'w-4 h-4')}
                  </div>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-[#26c6ff] shadow-[0_0_6px_#26c6ff]" />
                  )}
                </div>

                <div className="text-xs font-bold text-slate-100 truncate group-hover:text-white">
                  {locale === 'en' ? cat.labelEn : cat.labelAr}
                </div>

                <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
                  {cat.fileCount.toLocaleString()} files
                </div>
                <div className="text-[10px] text-cyan-300 font-mono truncate">
                  {cat.sizeGb} GB
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 06 — Gallery for Selected Category */}
      <div className="studio-glass-panel rounded-xl p-3 border border-[#132c52] flex-1 flex flex-col min-h-0">
        {/* Gallery Header & Controls */}
        <div className="flex items-center justify-between pb-2 border-b border-[#0f2545]">
          <div className="flex items-center gap-2">
            <div className="text-cyan-400">
              {renderCategoryIcon(selectedCategory.iconName, 'w-4 h-4')}
            </div>
            <h3 className="text-xs font-bold text-white tracking-wide">
              {selectedCategory.labelEn} Files ({selectedCategory.fileCount.toLocaleString()})
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {/* View mode buttons: List & Grid */}
            <div className="flex items-center bg-[#071529] p-0.5 rounded-md border border-[#142e56]">
              <button
                onClick={() => setViewMode('list')}
                className={`p-1 rounded text-xs transition-colors cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-[#173866] text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="List view"
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1 rounded text-xs transition-colors cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-[#173866] text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Grid view"
              >
                <Grid className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
                className="bg-[#091930] text-slate-300 hover:text-white border border-[#142e56] rounded-md px-2 py-1 text-xs font-medium cursor-pointer appearance-none pr-6 outline-none focus:border-[#2476ff]"
              >
                <option value="date_newest">Sort: Date (Newest)</option>
                <option value="date_oldest">Sort: Date (Oldest)</option>
                <option value="name_asc">Sort: Name (A-Z)</option>
                <option value="size_desc">Sort: Size (Largest)</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-1.5 top-2 pointer-events-none" />
            </div>

            {/* Select all / Deselect toggle */}
            <button
              onClick={() => {
                if (selectedFileIds.size > 0) {
                  deselectAllFiles();
                } else {
                  selectAllFiles();
                }
              }}
              className="px-2 py-1 rounded bg-[#0a1b32] hover:bg-[#122e54] text-[11px] text-cyan-300 border border-[#1b3f70] transition-colors cursor-pointer"
            >
              {selectedFileIds.size > 0 ? 'Deselect All' : 'Select All'}
            </button>
          </div>
        </div>

        {/* Gallery Content: 6-column grid */}
        <div className="pt-3 flex-1 overflow-y-auto studio-scrollbar">
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
              {files.map((file) => {
                const isChecked = selectedFileIds.has(file.id);

                return (
                  <div
                    key={file.id}
                    onClick={() => toggleFileSelection(file.id)}
                    className={`group relative rounded-lg overflow-hidden border transition-all cursor-pointer ${
                      isChecked
                        ? 'bg-[#122b54] border-[#2476ff] shadow-[0_0_12px_rgba(36,118,255,0.45)]'
                        : 'bg-[#09192f] hover:bg-[#0f2442] border-[#132c52] hover:border-[#1d427b]'
                    }`}
                  >
                    {/* Thumbnail Image Container */}
                    <div className="relative aspect-video w-full bg-[#050d1a] overflow-hidden">
                      {file.thumbnailUrl ? (
                        <img
                          src={file.thumbnailUrl}
                          alt={file.name}
                          loading="lazy"
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-[#0b1b33] to-[#071324] text-slate-500">
                          {renderCategoryIcon(selectedCategory.iconName, 'w-8 h-8 opacity-60')}
                        </div>
                      )}

                      {/* Custom Checkbox in Upper-Left Corner */}
                      <div className="absolute top-1.5 left-1.5 z-10">
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                            isChecked
                              ? 'bg-[#2476ff] border-[#26c6ff] text-white shadow-[0_0_8px_rgba(36,118,255,0.8)]'
                              : 'bg-black/50 border-white/50 hover:border-white'
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>

                      {/* Size badge overlay on bottom right */}
                      <div className="absolute bottom-1 right-1 px-1 py-0.5 rounded bg-black/70 text-[9px] font-mono text-slate-300">
                        {file.sizeFormatted}
                      </div>
                    </div>

                    {/* Meta info below image */}
                    <div className="p-1.5">
                      <div
                        className="text-[11px] font-semibold text-slate-200 truncate group-hover:text-white"
                        title={file.name}
                      >
                        {file.name}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        {file.dateModified}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* List view */
            <div className="space-y-1">
              {files.map((file) => {
                const isChecked = selectedFileIds.has(file.id);
                return (
                  <div
                    key={file.id}
                    onClick={() => toggleFileSelection(file.id)}
                    className={`flex items-center justify-between p-2 rounded-lg border transition-all cursor-pointer ${
                      isChecked
                        ? 'bg-[#122b54] border-[#2476ff]'
                        : 'bg-[#08172c] hover:bg-[#0c1f38] border-[#132c52]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center border ${
                          isChecked
                            ? 'bg-[#2476ff] border-[#26c6ff] text-white'
                            : 'bg-transparent border-slate-500'
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <div className="w-7 h-7 rounded overflow-hidden bg-slate-900 shrink-0">
                        {file.thumbnailUrl ? (
                          <img src={file.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-500">
                            {renderCategoryIcon(selectedCategory.iconName, 'w-3.5 h-3.5')}
                          </div>
                        )}
                      </div>
                      <span className="text-xs font-medium text-slate-200 truncate">{file.name}</span>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
                      <span>{file.resolution || file.extension.toUpperCase()}</span>
                      <span>{file.sizeFormatted}</span>
                      <span>{file.dateModified}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * 07 — Right Column: Organization Inspector (~24% width)
 */
export function OrganizationInspectorPanel() {
  const {
    categories,
    selectedCategoryKey,
    destinationPath,
    namingRule,
    groupingRule,
    operationMode,
    setOperationMode,
    openModal,
    locale,
  } = useStudio();

  const selectedCategory = categories.find((c) => c.key === selectedCategoryKey) || categories[0];

  return (
    <div className="w-72 xl:w-80 shrink-0 flex flex-col gap-3 select-none">
      <div className="studio-glass-panel rounded-xl p-3 border border-[#132c52] flex-1 flex flex-col overflow-y-auto studio-scrollbar">
        {/* Header */}
        <div className="flex items-center gap-2 pb-2.5 border-b border-[#0f2545]">
          <Compass className="w-4 h-4 text-cyan-400" />
          <h2 className="text-xs font-bold text-white tracking-wide">
            {locale === 'en' ? 'Organization Preview' : 'معاينة التنظيم'}
          </h2>
        </div>

        <div className="pt-2.5 space-y-3 text-xs">
          {/* Block 1: Selected Category Banner */}
          <div className="p-2.5 rounded-lg bg-[#0e2447] border border-[#2476ff]/60 flex items-center gap-3 shadow-[0_0_12px_rgba(36,118,255,0.25)]">
            <div className="w-10 h-10 rounded-lg bg-[#163a70] border border-cyan-400/40 flex items-center justify-center text-cyan-300 shrink-0">
              {renderCategoryIcon(selectedCategory.iconName, 'w-5 h-5')}
            </div>
            <div className="min-w-0">
              <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                {locale === 'en' ? 'Selected Category' : 'الفئة المحددة'}
              </div>
              <div className="text-sm font-bold text-white tracking-wide truncate">
                {locale === 'en' ? selectedCategory.labelEn : selectedCategory.labelAr}
              </div>
              <div className="text-[10px] text-cyan-300 font-mono mt-0.5">
                {selectedCategory.fileCount.toLocaleString()} files &nbsp;|&nbsp; {selectedCategory.sizeGb} GB
              </div>
            </div>
          </div>

          {/* Block 2: Destination Proposal */}
          <div className="p-2 rounded-lg bg-[#08172c] border border-[#142e56]">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5 text-slate-400 font-medium text-[11px]">
                <Folder className="w-3.5 h-3.5 text-cyan-400" />
                <span>{locale === 'en' ? 'Destination Proposal' : 'الوجهة المقترحة'}</span>
              </div>
              <button
                onClick={() => openModal('change_destination')}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 underline font-medium cursor-pointer"
              >
                {locale === 'en' ? 'Change...' : 'تغيير...'}
              </button>
            </div>
            <div className="font-mono text-xs text-slate-200 bg-[#050e1a] p-1.5 rounded border border-[#0d213d] truncate" title={destinationPath}>
              {destinationPath}
            </div>
          </div>

          {/* Block 3: Naming Rules */}
          <div className="p-2 rounded-lg bg-[#08172c] border border-[#142e56]">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5 text-slate-400 font-medium text-[11px]">
                <FileText className="w-3.5 h-3.5 text-cyan-400" />
                <span>{locale === 'en' ? 'Naming Rules' : 'قواعد التسمية'}</span>
              </div>
              <button
                onClick={() => openModal('edit_naming')}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 underline font-medium cursor-pointer"
              >
                {locale === 'en' ? 'Edit...' : 'تعديل...'}
              </button>
            </div>
            <div className="text-[11px] text-slate-300 leading-snug">
              <div>Keep original name</div>
              <div className="text-slate-500 text-[10px]">Add date if duplicate exists (YYYY-MM-DD)</div>
            </div>
          </div>

          {/* Block 4: Grouping Options */}
          <div className="p-2 rounded-lg bg-[#08172c] border border-[#142e56]">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5 text-slate-400 font-medium text-[11px]">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>{locale === 'en' ? 'Grouping Options' : 'خيارات التجميع'}</span>
              </div>
              <button
                onClick={() => openModal('edit_grouping')}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 underline font-medium cursor-pointer"
              >
                {locale === 'en' ? 'Edit...' : 'تعديل...'}
              </button>
            </div>
            <div className="text-[11px] text-slate-300 leading-snug">
              <div>Group by: Capture Date</div>
              <div className="text-slate-500 text-[10px] font-mono">Structure: YYYY \ MM \ DD</div>
            </div>
          </div>

          {/* Block 5: Operation Mode */}
          <div className="p-2 rounded-lg bg-[#08172c] border border-[#142e56]">
            <div className="flex items-center gap-1.5 text-slate-400 font-medium text-[11px] mb-2">
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              <span>{locale === 'en' ? 'Operation Mode' : 'وضع العملية'}</span>
            </div>
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 cursor-pointer text-[11px] text-slate-200 hover:text-white">
                <input
                  type="radio"
                  name="operationMode"
                  value="copy"
                  checked={operationMode === 'copy'}
                  onChange={() => setOperationMode('copy')}
                  className="accent-[#2476ff]"
                />
                <span>{locale === 'en' ? 'Copy files (keep originals)' : 'نسخ الملفات (الحفاظ على الأصل)'}</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-[11px] text-slate-300 hover:text-white">
                <input
                  type="radio"
                  name="operationMode"
                  value="move"
                  checked={operationMode === 'move'}
                  onChange={() => setOperationMode('move')}
                  className="accent-[#2476ff]"
                />
                <span>{locale === 'en' ? 'Move files (faster, save space)' : 'نقل الملفات (أسرع، توفير مساحة)'}</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-[11px] text-slate-300 hover:text-white">
                <input
                  type="radio"
                  name="operationMode"
                  value="virtual"
                  checked={operationMode === 'virtual'}
                  onChange={() => setOperationMode('virtual')}
                  className="accent-[#2476ff]"
                />
                <span>{locale === 'en' ? 'Create virtual organization (shortcuts)' : 'تنظيم افتراضي (اختصارات)'}</span>
              </label>
            </div>
          </div>

          {/* Block 6: Potential Conflicts */}
          <div className="p-2 rounded-lg bg-amber-950/20 border border-amber-600/40">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-semibold text-amber-300">
                    {locale === 'en' ? 'Potential Conflicts' : 'تعارضات محتملة'}
                  </div>
                  <div className="text-[10px] text-amber-200/80 mt-0.5">
                    12 files may have duplicate names
                  </div>
                  <div className="text-[10px] text-slate-400">
                    3 folders already exist at destination
                  </div>
                </div>
              </div>

              <button
                onClick={() => openModal('conflict_details')}
                className="px-2 py-0.5 rounded bg-[#10243e] hover:bg-[#1a3c68] text-[10px] text-cyan-300 border border-[#2476ff]/40 cursor-pointer"
              >
                {locale === 'en' ? 'Details...' : 'تفاصيل...'}
              </button>
            </div>
          </div>

          {/* Block 7: Permissions */}
          <div className="p-2 rounded-lg bg-[#08172c] border border-[#142e56]">
            <div className="flex items-center gap-1.5 text-slate-400 font-medium text-[11px] mb-1.5">
              <Lock className="w-3.5 h-3.5 text-cyan-400" />
              <span>{locale === 'en' ? 'Permissions' : 'الصلاحيات'}</span>
            </div>
            <div className="space-y-1 text-[11px]">
              <div className="flex items-center gap-1.5 text-slate-300">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Destination is writable</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-300">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>No elevation required</span>
              </div>
            </div>
          </div>

          {/* Block 8: Safety Information */}
          <div className="p-2 rounded-lg bg-[#08172c] border border-[#142e56]">
            <div className="flex items-center gap-1.5 text-slate-400 font-medium text-[11px] mb-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>{locale === 'en' ? 'Safety Information' : 'معلومات الأمان'}</span>
            </div>
            <div className="space-y-1 text-[11px]">
              <div className="flex items-center gap-1.5 text-slate-300">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Original files will remain unchanged</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-300">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>You can review and modify the plan</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-300">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Full undo available after execution</span>
              </div>
            </div>
          </div>

          {/* Block 9: Caution alert banner */}
          <div className="p-2 rounded-lg bg-amber-950/40 border border-amber-500/50 flex items-center justify-center gap-2 text-amber-300 text-xs font-medium">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>
              {locale === 'en' ? 'Preview only — no files changed' : 'معاينة فقط — لم يتم تغيير أي ملف'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
