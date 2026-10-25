/**
 * KNOuX SmartOrganizer — Reusable Studio UI Parts
 */

import React from 'react';
import {
  Folder,
  Image as ImageIcon,
  Video,
  FileText,
  Music,
  Archive,
  Box,
  Palette,
  Code,
  Table,
  Presentation,
  FileCheck2,
  Type,
  Database,
  BookOpen,
  Cog,
  Globe,
  MoreHorizontal,
  Minus,
  Square,
  X,
  Home,
  Scan,
  Clipboard,
  Layers,
  HardDrive,
  Trash2,
  Zap,
  Cpu,
  Wrench,
  Server,
  Wifi,
  Activity,
  Bot,
  Settings,
  CheckCircle2,
  RotateCw,
  Clock,
  RefreshCw,
  FolderPlus,
  ArrowRight,
  ShieldCheck,
  Lock,
  AlertTriangle,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { useStudio } from './context';
import { useNavigation } from '../context/NavigationContext';
import { KNOuXLogo, KNOuXSidebar, KNOuXAssistantTrigger, windowControlProps } from '../components/shell/KNOuXShellComponents';
import { controlNativeWindow } from '../native/client';
import { CategoryKey, StudioStageId } from './types';

// Map icon name to Lucide component
export function renderCategoryIcon(iconName: string, className = 'w-5 h-5') {
  switch (iconName) {
    case 'Image':
      return <ImageIcon className={className} />;
    case 'Video':
      return <Video className={className} />;
    case 'FileText':
      return <FileText className={className} />;
    case 'Music':
      return <Music className={className} />;
    case 'Archive':
      return <Archive className={className} />;
    case 'Box':
      return <Box className={className} />;
    case 'Palette':
      return <Palette className={className} />;
    case 'Code':
      return <Code className={className} />;
    case 'Table':
      return <Table className={className} />;
    case 'Presentation':
      return <Presentation className={className} />;
    case 'FileCheck2':
      return <FileCheck2 className={className} />;
    case 'Type':
      return <Type className={className} />;
    case 'Database':
      return <Database className={className} />;
    case 'BookOpen':
      return <BookOpen className={className} />;
    case 'Cog':
      return <Cog className={className} />;
    case 'Globe':
      return <Globe className={className} />;
    case 'Folder':
      return <Folder className={className} />;
    default:
      return <MoreHorizontal className={className} />;
  }
}

/**
 * 00 — Thin Windows Title Bar
 */
export function WindowsTitleBar() {
  const { locale, setLocale, openModal, resetToDefaultScreenshotFixture } = useStudio();
  const { setLocale: navSetLocale } = useNavigation();

  return (
    <div className="knoux-titlebar h-10 bg-[#040a16] border-b border-[#0d213d] flex items-center justify-between px-3 text-xs select-none z-50 shrink-0">
      <div className="flex items-center gap-2">
        <KNOuXLogo size="sm" />
        <span className="text-[10px] text-slate-500 hidden sm:inline-block border-l border-[#0d213d] pl-2">
          v2.4.0 High-Performance Workstation
        </span>
      </div>

      <div className="flex items-center gap-2">
        {/* Quick controls: Locale toggle, Dev test helper */}
        <div className="flex items-center gap-1.5 mr-3">
          <button
            onClick={() => {
              const next = locale === 'en' ? 'ar' : 'en';
              setLocale(next);
              navSetLocale(next);
            }}
            className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#0e223d] hover:bg-[#163866] text-cyan-300 border border-[#1b3f70] transition-colors"
            title="Toggle Arabic / English (RTL/LTR)"
          >
            {locale === 'en' ? 'العربية' : 'English'}
          </button>
          <button
            onClick={() => openModal('command_center')}
            className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#132c52] hover:bg-[#1d427b] text-blue-200 border border-[#2476ff]/40 transition-colors flex items-center gap-1"
            title="Open Studio Command Center & Scenarios"
          >
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>Dev Scenarios</span>
          </button>
          <button
            onClick={resetToDefaultScreenshotFixture}
            className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#0b1b33] hover:bg-[#142e56] text-slate-400 border border-[#173663] transition-colors"
            title="Reset directly to the exact screenshot state"
          >
            Reset to Ref
          </button>
          <KNOuXAssistantTrigger title="Open KNOuX AI Copilot" />
        </div>

        {/* Windows standard min/max/close controls */}
        <div className="flex items-center">
          <button
            {...windowControlProps('minimize')}
            onClick={() => void controlNativeWindow('minimize')}
            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#122b4e] transition-colors disabled:opacity-45 disabled:hover:bg-transparent disabled:hover:text-slate-400 disabled:cursor-not-allowed"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            {...windowControlProps('maximize')}
            onClick={() => void controlNativeWindow('maximize')}
            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#122b4e] transition-colors disabled:opacity-45 disabled:hover:bg-transparent disabled:hover:text-slate-400 disabled:cursor-not-allowed"
          >
            <Square className="w-3 h-3" />
          </button>
          <button
            {...windowControlProps('close')}
            onClick={() => void controlNativeWindow('close')}
            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-red-600 transition-colors disabled:opacity-45 disabled:hover:bg-transparent disabled:hover:text-slate-400 disabled:cursor-not-allowed"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * 00 — Global Navigation Sidebar
 */
export function GlobalSidebar({ onNavigate }: { onNavigate?: (section: string) => void }) {
  const { locale } = useStudio();
  const { navigateTo } = useNavigation();

  return (
    <KNOuXSidebar
      activeSection="studio"
      onNavigate={(sec) => {
        if (onNavigate) onNavigate(sec);
        else navigateTo(sec);
      }}
      isArabic={locale === 'ar'}
    />
  );
}

/**
 * 01 — Cinematic Header with Earth/Planet Horizon Curve
 */
export function CinematicHeader() {
  const { locale } = useStudio();

  return (
    <div className="relative pt-3 pb-2 px-6 overflow-hidden select-none">
      {/* Background Curved Planet Glow */}
      <div className="absolute inset-0 planet-horizon-glow pointer-events-none" />
      <div className="planet-arc-line" />

      {/* Atmospheric Star Particles */}
      <div className="absolute inset-0 opacity-40 pointer-events-none bg-[radial-gradient(#26c6ff_1px,transparent_1px)] [background-size:24px_24px]" />

      <div className="relative z-10 flex items-start justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>
              {locale === 'en' ? 'Smart Organization Studio' : 'استوديو التنظيم الذكي'}
            </span>
          </h1>
          <p className="text-xs text-slate-300/90 mt-0.5 font-normal tracking-wide">
            {locale === 'en'
              ? 'From scattered files to intelligent order.'
              : 'من ملفات متفرقة ومشتتة إلى نظام وتنظيم ذكي.'}
          </p>
        </div>

        <div className="text-right hidden sm:block">
          <span className="text-xs italic text-blue-300/80 font-light tracking-wide">
            {locale === 'en' ? 'A more organized tomorrow.' : 'غد رقمي أكثر تنظيماً.'}
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * 02 — Authorization Telemetry Strip (4 Horizontal Metric Capsules)
 */
export function TelemetryStrip() {
  const { inventory, refreshSources, locale } = useStudio();

  return (
    <div className="px-6 py-2 select-none">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {/* Metric 1: Source Authorization */}
        <div className="studio-glass-panel rounded-lg px-3.5 py-2.5 flex items-center gap-3 border border-[#132c52] hover:border-[#1d427b] transition-all">
          <div className="w-8 h-8 rounded-full bg-emerald-950/80 border border-emerald-500/50 flex items-center justify-center shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.35)]">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
              {locale === 'en' ? 'Source Authorization' : 'تصاريح المصادر'}
            </div>
            <div className="text-xs font-bold text-white tracking-wide truncate">
              {inventory.sourceCount}{' '}
              {locale === 'en' ? 'folders authorized' : 'مجلدات مصرح بها'}
            </div>
          </div>
        </div>

        {/* Metric 2: Scan State */}
        <div className="studio-glass-panel rounded-lg px-3.5 py-2.5 flex items-center gap-3 border border-[#132c52] hover:border-[#1d427b] transition-all">
          <div className="w-8 h-8 rounded-full bg-sky-950/80 border border-cyan-500/50 flex items-center justify-center shrink-0 shadow-[0_0_8px_rgba(38,198,255,0.35)]">
            <RotateCw className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
              {locale === 'en' ? 'Scan State' : 'حالة الفحص'}
            </div>
            <div className="text-xs font-bold text-white tracking-wide truncate">
              {inventory.scanState}
            </div>
          </div>
        </div>

        {/* Metric 3: Files Analyzed */}
        <div className="studio-glass-panel rounded-lg px-3.5 py-2.5 flex items-center gap-3 border border-[#132c52] hover:border-[#1d427b] transition-all">
          <div className="w-8 h-8 rounded-full bg-blue-950/80 border border-blue-500/50 flex items-center justify-center shrink-0 shadow-[0_0_8px_rgba(36,118,255,0.35)]">
            <FileText className="w-4 h-4 text-blue-400" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
              {locale === 'en' ? 'Files Analyzed' : 'الملفات المحللة'}
            </div>
            <div className="text-xs font-bold text-white tracking-wide truncate">
              {inventory.totalFiles.toLocaleString()} files &nbsp;|&nbsp; {inventory.totalSizeGb} GB
            </div>
          </div>
        </div>

        {/* Metric 4: Last Refreshed + Refresh button */}
        <div className="studio-glass-panel rounded-lg px-3.5 py-2.5 flex items-center justify-between border border-[#132c52] hover:border-[#1d427b] transition-all">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-indigo-950/80 border border-indigo-500/50 flex items-center justify-center shrink-0 shadow-[0_0_8px_rgba(99,102,241,0.35)]">
              <Clock className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                {locale === 'en' ? 'Last Refreshed' : 'آخر تحديث'}
              </div>
              <div className="text-xs font-bold text-white tracking-wide truncate">
                {inventory.lastRefreshed}
              </div>
            </div>
          </div>

          <button
            onClick={refreshSources}
            className="px-2.5 py-1 rounded bg-[#10243e] hover:bg-[#1a3d6d] text-cyan-300 border border-[#2476ff]/40 text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer ml-2"
          >
            <RefreshCw className="w-3 h-3" />
            <span>{locale === 'en' ? 'Refresh' : 'تحديث'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * 03 — Nine Horizontal Stages Bar
 */
export function HorizontalStagesBar() {
  const { stages, activeStageId, setActiveStageId, locale } = useStudio();

  return (
    <div className="px-6 py-1 select-none">
      <div className="w-full overflow-x-auto studio-scrollbar py-1">
        <div className="flex items-center gap-1 min-w-[920px] bg-[#071426] p-1.5 rounded-lg border border-[#132c52]">
          {stages.map((stage) => {
            const isActive = stage.id === activeStageId;
            const isCompleted = stage.status === 'completed';

            return (
              <button
                key={stage.id}
                onClick={() => setActiveStageId(stage.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-medium transition-all cursor-pointer relative ${
                  isActive
                    ? 'bg-gradient-to-r from-[#173e80] via-[#2476ff] to-[#1a5bc9] text-white shadow-[0_0_14px_rgba(36,118,255,0.7)] border border-cyan-400/80 font-semibold'
                    : isCompleted
                    ? 'text-cyan-200 hover:text-white hover:bg-[#0c1f38] border border-transparent'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#09182d] border border-transparent'
                }`}
                aria-current={isActive ? 'step' : undefined}
                title={`Stage ${stage.id}: ${stage.nameEn}`}
              >
                {/* Stage number circle badge */}
                <span
                  className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold shrink-0 ${
                    isActive
                      ? 'bg-white text-[#103b7b] shadow-sm'
                      : isCompleted
                      ? 'bg-cyan-900/60 text-cyan-300 border border-cyan-600/50'
                      : 'bg-[#10243e] text-slate-400'
                  }`}
                >
                  {stage.id}
                </span>

                <span className="truncate">
                  {locale === 'en' ? stage.nameEn : stage.nameAr}
                </span>

                {/* Subtle right chevron arrow if not last */}
                {stage.id < 9 && (
                  <span className="text-[10px] opacity-40 text-slate-500 absolute -right-1 pointer-events-none">
                    ›
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * 08 — Sticky Footer with Selection Summary and Actions
 */
function formatSelectionBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let index = 0;
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }
  return `${value.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

export function StickyFooter({ dpiControl }: { dpiControl?: React.ReactNode }) {
  const {
    selectedFileIds,
    files,
    categories,
    deselectAllFiles,
    openModal,
    setActiveStageId,
    chooseNativeDestination,
    native,
    operationMode,
    locale,
  } = useStudio();

  const selectedFiles = files.filter((file) => selectedFileIds.has(file.id));
  const selectedCount = selectedFiles.length;
  const selectedSize = formatSelectionBytes(selectedFiles.reduce((sum, file) => sum + file.sizeBytes, 0));

  return (
    <footer className="h-12 bg-[#050e1f] border-t border-[#132c52] px-6 flex items-center justify-between select-none z-40 shrink-0">
      {/* Left statistics summary */}
      <div className="flex items-center gap-3 text-xs text-slate-300">
        <ImageIcon className="w-4 h-4 text-cyan-400" />
        <span className="font-medium">
          {categories.length} {locale === 'en' ? 'categories' : 'تصنيف'}
        </span>
        <span className="text-slate-600">|</span>
        <span className="text-white font-semibold">
          {selectedCount.toLocaleString()} {locale === 'en' ? 'files selected' : 'ملفات محددة'}
        </span>
        <span className="text-slate-600">|</span>
        <span className="text-cyan-300 font-mono font-medium">
          {selectedSize}
        </span>
        <span className={`px-1.5 py-0.2 rounded-full text-[8px] font-mono font-bold border ${native.mode === 'measured' ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40' : 'bg-amber-950/60 text-amber-300 border-amber-500/40'}`}>
          {native.mode === 'measured' ? (locale === 'en' ? 'MEASURED' : 'مقيس') : (locale === 'en' ? 'FIXTURE' : 'تجريبي')}
        </span>
        <span className="text-slate-500 font-mono uppercase text-[9px]">{operationMode}</span>
      </div>

      {/* Center slot — hosts the DPI preview switch so it can never be painted
          over by the footer (the previous floating overlay was occluded here). */}
      <div className="flex items-center justify-center flex-1 min-w-0">{dpiControl}</div>

      {/* Right control buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => openModal('edit_categories')}
          className="px-3 py-1.5 rounded-md bg-[#0a182d] hover:bg-[#122b4e] text-slate-300 hover:text-white border border-[#1b3f70] text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Cog className="w-3.5 h-3.5 text-slate-400" />
          <span>{locale === 'en' ? 'Edit Categories' : 'تعديل التصنيفات'}</span>
        </button>

        <button
          onClick={() => (native.available ? void chooseNativeDestination() : openModal('change_destination'))}
          className="px-3 py-1.5 rounded-md bg-[#0a182d] hover:bg-[#122b4e] text-slate-300 hover:text-white border border-[#1b3f70] text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Folder className="w-3.5 h-3.5 text-slate-400" />
          <span>{locale === 'en' ? 'Change Destination' : 'تغيير الوجهة'}</span>
        </button>

        <button
          onClick={deselectAllFiles}
          disabled={selectedFileIds.size === 0}
          className="px-3 py-1.5 rounded-md bg-transparent hover:bg-[#0d1e36] disabled:opacity-40 disabled:cursor-not-allowed text-slate-400 hover:text-slate-200 text-xs font-medium transition-colors cursor-pointer"
        >
          {locale === 'en' ? 'Cancel' : 'إلغاء'}
        </button>

        <button
          onClick={() => setActiveStageId(6)} // Advance to Stage 6: Plan Review
          className="px-4 py-1.5 rounded-md bg-gradient-to-r from-[#2476ff] to-[#1c5fdb] hover:from-[#3582ff] hover:to-[#226cf0] text-white text-xs font-semibold flex items-center gap-1.5 shadow-[0_0_15px_rgba(36,118,255,0.6)] border border-cyan-400/50 transition-all cursor-pointer"
        >
          <span>{locale === 'en' ? 'Review Organization Plan' : 'مراجعة خطة التنظيم'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </footer>
  );
}
