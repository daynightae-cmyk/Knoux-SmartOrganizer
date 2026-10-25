/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Rocket,
  Search,
  Settings,
  HelpCircle,
  Bell,
  Minus,
  Square,
  X,
  Languages,
  Home,
  Gauge,
  LayoutGrid,
  ShieldCheck,
  BarChart3,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Clock,
  ShieldAlert,
  SlidersHorizontal,
  FolderTree,
  FileCheck,
  PowerOff,
  Filter,
  Cog,
  CalendarClock,
  Zap,
  Activity,
  ChevronRight,
  Copy,
  ExternalLink,
  Shield,
  Layers,
  ArrowRight,
  HardDrive,
  FileText,
  Download,
  Share2,
  Lock,
  RefreshCw,
  Sliders,
  Check
} from 'lucide-react';

import {
  INITIAL_BOOT_METRICS,
  BOOT_STAGES_BREAKDOWN,
  STARTUP_SOURCES_SUMMARY,
  STARTUP_ITEMS_FIXTURE,
  STARTUP_SERVICES_CATALOG,
  StartupItem,
  StartupItemStatus,
  StartupImpactLevel,
  BootMetric,
  BootStage,
  StartupServiceMeta
} from '../lib/startup-inventory';
import { StartupIcon } from '../components/startup/StartupIcon';
import { StartupWorkspaces } from '../components/startup/StartupWorkspaces';
import { useNavigation } from '../context/NavigationContext';
import { KNOuXTitleBar, KNOuXSidebar } from '../components/shell/KNOuXShellComponents';
import { LiveProcessInspector } from '../components/common/LiveProcessInspector';
import '../startup.css';

interface StartupPageProps {
  onNavigateSection?: (section: string) => void;
}

export function StartupPage({ onNavigateSection }: StartupPageProps) {
  const { navigateTo, isActive, isArabic, toggleLocale } = useNavigation();
  // Appearance
  const [viewDensity, setViewDensity] = useState<'comfortable' | 'compact'>('comfortable');

  // Search & Filtering
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeSourceFilter, setActiveSourceFilter] = useState<string>('all');
  const [activeImpactFilter, setActiveImpactFilter] = useState<string>('all');
  const [activeStatusFilter, setActiveStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'impact' | 'name' | 'publisher' | 'delay'>('impact');

  // Interactive items inventory
  const [items, setItems] = useState<StartupItem[]>(STARTUP_ITEMS_FIXTURE);
  const [selectedItemId, setSelectedItemId] = useState<string>('item-onedrive');
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set(['item-onedrive', 'item-discord', 'item-steam']));

  // Active Workspace Modal
  const [activeWorkspaceKey, setActiveWorkspaceKey] = useState<string | null>(null);
  // Bounded pane switch: the register and the 12-service matrix share the
  // same viewport-sized workspace instead of pushing the tools below the fold.
  const [activePane, setActivePane] = useState<'register' | 'services'>('register');

  // User notifications & actions feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const selectedItem = useMemo(() => {
    return items.find((it) => it.id === selectedItemId) || items[0];
  }, [items, selectedItemId]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Toggle single item selection checkbox
  const handleToggleCheck = (id: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Select all / Deselect all
  const handleToggleSelectAll = () => {
    if (checkedIds.size === filteredItems.length) {
      setCheckedIds(new Set());
    } else {
      setCheckedIds(new Set(filteredItems.map((it) => it.id)));
    }
  };

  // Update item status (enable, disable, delay)
  const handleUpdateItemStatus = (id: string, newStatus: StartupItemStatus, newDelay: number = 0) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id === id) {
          return {
            ...it,
            status: newStatus,
            delaySeconds: newStatus === 'delayed' ? (newDelay > 0 ? newDelay : 30) : 0
          };
        }
        return it;
      })
    );
  };

  // Batch apply configuration
  const handleBatchApply = (changes: Array<{ id: string; status: StartupItemStatus; delay: number }>) => {
    setItems((prev) => {
      const map = new Map(changes.map((c) => [c.id, c]));
      return prev.map((it) => {
        const change = map.get(it.id);
        if (change) {
          return {
            ...it,
            status: change.status,
            delaySeconds: change.delay
          };
        }
        return it;
      });
    });
    showToast(`${changes.length} startup modifications applied to staging`);
  };

  // Reset all to baseline defaults
  const handleResetAll = () => {
    setItems(STARTUP_ITEMS_FIXTURE);
    showToast('All startup rules reset to default Windows baseline');
  };

  // Refresh inventory simulation
  const handleRefreshInventory = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      showToast('Inventory re-scanned across HKLM, HKCU, Tasks, and Services (28 items verified)');
    }, 800);
  };

  // Filtered & Sorted items
  const filteredItems = useMemo(() => {
    return items
      .filter((it) => {
        // Source filter
        if (activeSourceFilter !== 'all') {
          if (activeSourceFilter === 'registry' && !it.source.startsWith('registry')) return false;
          if (activeSourceFilter === 'task' && it.source !== 'scheduled_task') return false;
          if (activeSourceFilter === 'folder' && !it.source.startsWith('startup_folder')) return false;
          if (activeSourceFilter === 'service' && it.source !== 'windows_service') return false;
        }

        // Impact filter
        if (activeImpactFilter !== 'all' && it.impact !== activeImpactFilter) {
          return false;
        }

        // Status filter
        if (activeStatusFilter !== 'all' && it.status !== activeStatusFilter) {
          return false;
        }

        // Search text
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          return (
            it.name.toLowerCase().includes(q) ||
            it.publisher.toLowerCase().includes(q) ||
            it.command.toLowerCase().includes(q) ||
            it.sourceLocation.toLowerCase().includes(q)
          );
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'impact') return b.impactDelayMs - a.impactDelayMs;
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'publisher') return a.publisher.localeCompare(b.publisher);
        if (sortBy === 'delay') return b.delaySeconds - a.delaySeconds;
        return 0;
      });
  }, [items, activeSourceFilter, activeImpactFilter, activeStatusFilter, searchQuery, sortBy]);

  // Live estimated savings calculation
  const totalStagedSavingsMs = useMemo(() => {
    return items.reduce((sum, it) => {
      if (it.status === 'disabled') {
        return sum + it.impactDelayMs;
      }
      if (it.status === 'delayed') {
        // Staggered launch saves ~75% of initial logon contention latency
        return sum + Math.round(it.impactDelayMs * 0.75);
      }
      return sum;
    }, 0);
  }, [items]);

  const stagedCount = useMemo(() => {
    return items.filter((it) => it.status !== 'enabled').length;
  }, [items]);

  const handleCopyPath = (path: string) => {
    navigator.clipboard?.writeText(path);
    setCopiedKey(path);
    setTimeout(() => setCopiedKey(null), 2500);
    showToast('Registry / Command path copied to clipboard');
  };

  return (
    <div
      dir={isArabic ? 'rtl' : 'ltr'}
      className="startup-viewport bg-[#040b18] text-slate-100 flex flex-col h-screen select-none relative overflow-hidden"
    >
      {/* 1. Windows Chrome / Top Navigation */}
      <KNOuXTitleBar
        sectionName={isArabic ? 'بدء التشغيل' : 'Startup'}
        sectionSubtitle={isArabic ? 'التحكم في الإقلاع' : 'Boot Control'}
        onNavigateHome={() => (onNavigateSection ? onNavigateSection('home') : navigateTo('home'))}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder={isArabic ? 'البحث عن برامج بدء التشغيل، مسارات السجل، أو المهام... (Ctrl+K)' : 'Search startup apps, registry hives, or tasks... (Ctrl+K)'}
        isArabic={isArabic}
        onToggleArabic={toggleLocale}
      />

      {/* Main Body Shell: Sidebar + Content Canvas */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        {/* Tachometer Boot Velocity Glow Arc */}
        <div className="startup-hero-tachometer" />

        {/* 2. Sidebar Navigation (Left) */}
        <KNOuXSidebar
          activeSection="startup"
          onNavigate={(sec) => (onNavigateSection ? onNavigateSection(sec) : navigateTo(sec))}
          isArabic={isArabic}
        />

        {/* 3. Main Center Canvas */}
        <main className="flex-1 flex flex-col min-h-0 overflow-y-auto startup-custom-scrollbar p-3 sm:p-4 gap-2.5">
          
          {/* Toast Notification */}
          {toastMessage && (
            <div className="fixed top-14 right-6 z-40 bg-gradient-to-r from-cyan-900 to-blue-900 border border-cyan-500/50 text-white text-xs px-4 py-2.5 rounded-xl shadow-xl shadow-cyan-950/80 flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-cyan-300" />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* Refined Ultra-Sleek Boot Control Hero Header Banner */}
          <div className="startup-hero-banner shrink-0 min-h-fit relative px-4 py-3 rounded-2xl bg-gradient-to-r from-[#061833] via-[#0a2347] to-[#06142a] border border-cyan-400/40 overflow-hidden shadow-[0_0_25px_rgba(14,165,233,0.22)]">
            {/* Ambient Background Glow Arcs */}
            <div className="absolute -top-10 -right-10 w-80 h-80 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
            <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div className="flex items-start gap-4">
                {/* Glowing Rocket Icon Emblem */}
                <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-[0_0_20px_rgba(56,189,248,0.6)] border border-cyan-300/60 shrink-0">
                  <Rocket className="w-7 h-7 text-white" />
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-[#061833] animate-pulse" />
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded-md bg-cyan-400/20 text-cyan-200 text-[10px] font-mono font-bold tracking-wider uppercase border border-cyan-400/40">
                      KNOuX Boot Controller
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-950/80 text-emerald-300 text-[10px] font-mono font-bold flex items-center gap-1 border border-emerald-500/40">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      {isArabic ? 'الحماية والبيئة الآمنة مفعّلة' : 'Safe Staging Active'}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-purple-950/80 text-purple-300 text-[10px] font-mono font-bold border border-purple-500/40">
                      {isArabic ? 'تنسيق الإقلاع: المتتابع' : 'Stagger Mode: Active'}
                    </span>
                  </div>

                  <h1 className="startup-hero-title text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-cyan-300 tracking-tight">
                    {isArabic ? 'مركز التحكم بتسلسل الإقلاع وبدء التشغيل' : 'Startup & Boot Sequence Controller'}
                  </h1>
                  <p className="startup-hero-copy text-xs text-slate-300 max-w-2xl mt-1 leading-relaxed font-medium">
                    {isArabic
                      ? 'تحسين وتنسيق تسلسل إقلاع ويندوز، تقليل زمن تحميل السجل، وتحليل تأثير البرامج مع ضمان معالجة الرجوع الآمن.'
                      : 'Optimize Windows boot sequence, stagger autostart delays, analyze system impact, and reduce logon latency with verified rollback safety.'}
                  </p>
                </div>
              </div>

              {/* Boot velocity badge & Controls */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="px-4 py-2.5 rounded-xl bg-[#081e3d]/90 border border-cyan-500/30 text-right backdrop-blur-md shadow-inner">
                  <div className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">
                    {isArabic ? 'زمن آخر إقلاع' : 'Last Boot Duration'}
                  </div>
                  <div className="text-xl font-bold font-mono text-cyan-300 flex items-center justify-end gap-1.5">
                    <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
                    <span>13.8s</span>
                  </div>
                  <div className="text-[10px] text-emerald-400 font-medium">BIOS: 2.4s · Saved +4.2s</div>
                </div>

                <button
                  onClick={handleRefreshInventory}
                  disabled={isRefreshing}
                  className="px-3.5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white border border-cyan-300/40 flex items-center gap-2 text-xs font-bold transition shadow-[0_0_15px_rgba(38,198,218,0.4)] cursor-pointer"
                  title="Rescan autostart entries"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-white' : ''}`} />
                  <span>{isArabic ? 'تحديث الفهرس' : 'Rescan Inventory'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* 4-Metric Summary Ribbon */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            {INITIAL_BOOT_METRICS.map((metric) => (
              <div
                key={metric.id}
                className={`startup-metric-card p-2.5 rounded-xl border transition-all ${
                  metric.isAlert
                    ? 'bg-gradient-to-br from-[#1a1215] to-[#091833] border-rose-500/40 shadow-md shadow-rose-950/20'
                    : 'bg-[#081733] border-slate-800 hover:border-cyan-500/40'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-400 font-medium">{metric.label}</span>
                  {metric.isAlert ? (
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  )}
                </div>
                <div className="text-lg font-black font-mono text-white tracking-tight">
                  {metric.type === 'potential_savings' && stagedCount > 0 ? (
                    <span className="text-emerald-400">+{((totalStagedSavingsMs) / 1000).toFixed(1)}s</span>
                  ) : (
                    metric.value
                  )}
                </div>
                <div className="startup-metric-sub text-[11px] text-slate-400 mt-0.5 flex items-center justify-between gap-2 min-w-0">
                  <span className="truncate">{metric.subtext}</span>
                  {metric.isAlert && <span className="startup-metric-alert text-rose-400 font-mono text-[10px] shrink-0">Action Advised</span>}
                </div>
              </div>
            ))}
          </div>

          {/* Interactive Boot Stages Waterfall Breakdown Ribbon */}
          <div className="p-2.5 rounded-xl bg-[#08152e] border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span className="font-semibold text-slate-200">
                  {isArabic ? 'شريط تسلسل مراحل الإقلاع التفاعلي' : 'Boot Execution Stages Waterfall (13.8s Total)'}
                </span>
              </div>
              <button
                onClick={() => setActiveWorkspaceKey('startup-overview')}
                className="text-cyan-400 hover:text-cyan-300 font-mono text-[11px] flex items-center gap-1 transition"
              >
                <span>Deep Inspection</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Continuous multi-segment bar */}
            <div className="w-full h-3 rounded-full bg-[#050e1f] overflow-hidden flex shadow-inner">
              {BOOT_STAGES_BREAKDOWN.map((stg) => (
                <div
                  key={stg.id}
                  className="waterfall-segment h-full group"
                  style={{ width: `${stg.percentage}%`, backgroundColor: stg.color }}
                  title={`${stg.name}: ${stg.durationDisplay} (${stg.percentage}%)`}
                  onClick={() => setActiveWorkspaceKey('startup-overview')}
                />
              ))}
            </div>

            {/* Stages Legend — collapses into the bar itself on short desktops so the
                boot register stays above the fold. */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] [@media(max-height:820px)]:hidden">
              {BOOT_STAGES_BREAKDOWN.map((stg) => (
                <div
                  key={stg.id}
                  onClick={() => setActiveWorkspaceKey('startup-overview')}
                  className="flex items-center gap-1.5 cursor-pointer hover:text-cyan-300 transition"
                >
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: stg.color }} />
                  <span className="text-slate-300">{stg.name}</span>
                  <span className="font-mono text-slate-400 font-bold">({stg.durationDisplay})</span>
                </div>
              ))}
            </div>
          </div>

          {/* Filters, Search & Command Toolbar */}
          <div className="startup-filter-rail p-2.5 rounded-xl bg-[#081733] border border-slate-800 space-y-2">
            {/* Source Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { key: 'all', label: 'All Items', count: items.length },
                  { key: 'registry', label: 'Registry Run (HKLM/HKCU)', count: 17 },
                  { key: 'task', label: 'Scheduled Tasks', count: 8 },
                  { key: 'folder', label: 'Startup Folders', count: 4 },
                  { key: 'service', label: 'Delayed Services', count: 5 }
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveSourceFilter(tab.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-2 ${
                      activeSourceFilter === tab.key
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-[#050e1f] text-slate-300 border border-slate-700">
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* View Density Toggle */}
              <div className="flex items-center gap-1 bg-[#050e1f] p-1 rounded-lg border border-slate-800">
                <button
                  onClick={() => setViewDensity('comfortable')}
                  className={`px-2.5 py-1 rounded text-xs transition ${
                    viewDensity === 'comfortable' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400'
                  }`}
                >
                  Comfortable
                </button>
                <button
                  onClick={() => setViewDensity('compact')}
                  className={`px-2.5 py-1 rounded text-xs transition ${
                    viewDensity === 'compact' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400'
                  }`}
                >
                  Compact
                </button>
              </div>
            </div>

            {/* Sub-Filters: Impact, Status, and Sort */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-slate-400">Impact:</span>
                {['all', 'high', 'medium', 'low'].map((imp) => (
                  <button
                    key={imp}
                    onClick={() => setActiveImpactFilter(imp)}
                    className={`px-2 py-0.5 rounded capitalize font-mono text-[11px] transition ${
                      activeImpactFilter === imp
                        ? 'bg-cyan-950 text-cyan-300 border border-cyan-700 font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {imp}
                  </button>
                ))}

                <span className="text-slate-600 mx-1">|</span>

                <span className="text-slate-400">Status:</span>
                {['all', 'enabled', 'delayed', 'disabled'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setActiveStatusFilter(st)}
                    className={`px-2 py-0.5 rounded capitalize font-mono text-[11px] transition ${
                      activeStatusFilter === st
                        ? 'bg-cyan-950 text-cyan-300 border border-cyan-700 font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              {/* Sort selector & filter builder trigger */}
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-[#050e1f] border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200"
                >
                  <option value="impact">Highest Boot Delay</option>
                  <option value="name">Name (A-Z)</option>
                  <option value="publisher">Publisher</option>
                  <option value="delay">Launch Delay Time</option>
                </select>

                <button
                  onClick={() => setActiveWorkspaceKey('startup-filter')}
                  className="px-2.5 py-1 rounded bg-[#0a1b38] hover:bg-slate-800 border border-slate-700 text-xs text-cyan-300 flex items-center gap-1.5 transition"
                >
                  <Filter className="w-3.5 h-3.5" />
                  <span>Rule Filter</span>
                </button>
              </div>
            </div>
          </div>

          {/* Bounded workspace switch. The 12-domain matrix is always one visible
              click away instead of being buried under a scrolling main canvas. */}
          <div className="startup-pane-tabs shrink-0 flex items-center justify-between gap-2 border-b border-slate-800/80">
            <div role="tablist" aria-label={isArabic ? 'مساحة عمل بدء التشغيل' : 'Startup workspace'} className="flex items-center gap-1.5">
              <button
                id="startup-tab-register"
                role="tab"
                aria-selected={activePane === 'register'}
                onClick={() => setActivePane('register')}
                className={`px-3 py-1.5 rounded-t-lg text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
                  activePane === 'register'
                    ? 'border-cyan-400 text-cyan-200 bg-cyan-500/10'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{isArabic ? 'سجل برامج بدء التشغيل' : 'Startup Register'}</span>
                <span className="px-1.5 py-0.2 rounded bg-[#050e1f] border border-slate-700 font-mono text-[10px]">{filteredItems.length}</span>
              </button>
              <button
                id="startup-tab-services"
                role="tab"
                aria-selected={activePane === 'services'}
                onClick={() => setActivePane('services')}
                className={`px-3 py-1.5 rounded-t-lg text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
                  activePane === 'services'
                    ? 'border-cyan-400 text-cyan-200 bg-cyan-500/10'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>{isArabic ? 'خدمات الإقلاع' : 'Boot Domain Services'}</span>
                <span className="px-1.5 py-0.2 rounded bg-[#050e1f] border border-slate-700 font-mono text-[10px]">{STARTUP_SERVICES_CATALOG.length}</span>
              </button>
            </div>
            <span className="hidden md:inline text-[10px] font-mono text-slate-500">
              {isArabic ? 'مساحة عمل محددة — تمرير داخلي' : 'Bounded workspace · internal scroll'}
            </span>
          </div>

          {/* Main Content Composition: Split Table Register + Right Inspector
              Both panes are bounded tiles with internal scrollers so the register
              can never run under the staging footer and the dossier stays aligned. */}
          {activePane === 'register' && (
          <div className="flex-1 min-h-0 grid grid-cols-1 grid-rows-2 xl:grid-rows-1 xl:grid-cols-12 gap-3 items-stretch">
            
            {/* Left/Center: Startup Items Table Register (8 Columns) */}
            <div className="xl:col-span-8 bg-[#071329] border border-slate-800 rounded-2xl overflow-hidden shadow-lg flex flex-col h-full min-h-[170px]">
              <div className="flex-1 min-h-0 overflow-x-auto overflow-y-auto startup-custom-scrollbar">
                <table className="startup-register-table w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 z-10 bg-[#0a1835] text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800 tracking-wider">
                    <tr>
                      <th className="p-3 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={checkedIds.size === filteredItems.length && filteredItems.length > 0}
                          onChange={handleToggleSelectAll}
                          className="w-4 h-4 rounded accent-cyan-500 cursor-pointer"
                        />
                      </th>
                      <th className="p-3">Application & Publisher</th>
                      <th className="startup-col-source p-3">Source & Location</th>
                      <th className="p-3">Boot Impact</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-center">Delay Queue</th>
                      <th className="p-3 text-right">Inspect</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    {filteredItems.map((item) => {
                      const isSelected = selectedItem.id === item.id;
                      const isChecked = checkedIds.has(item.id);

                      return (
                        <tr
                          key={item.id}
                          onClick={() => setSelectedItemId(item.id)}
                          className={`cursor-pointer transition ${
                            isSelected
                              ? 'bg-[#0e244d] border-l-4 border-l-cyan-400'
                              : isChecked
                              ? 'bg-[#091b3b]/60'
                              : 'hover:bg-[#0a1d3f]'
                          } ${viewDensity === 'compact' ? 'py-1.5' : 'py-3'}`}
                        >
                          {/* Checkbox */}
                          <td
                            className="p-3 text-center shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleCheck(item.id);
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}}
                              className="w-4 h-4 rounded accent-cyan-500 cursor-pointer"
                            />
                          </td>

                          {/* App & Publisher */}
                          <td className="p-3">
                            <div className="flex items-center gap-2.5">
                              <StartupIcon name={item.name} className="w-6 h-6 shrink-0" />
                              <div className="truncate max-w-[200px]">
                                <div className="font-semibold text-slate-100 flex items-center gap-1.5">
                                  <span>{item.name}</span>
                                  {item.isProtected && (
                                    <span title="System Protected" className="text-amber-400">
                                      <Lock className="w-3 h-3" />
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-400 truncate">{item.publisher}</div>
                              </div>
                            </div>
                          </td>

                          {/* Source & Hive */}
                          <td className="startup-col-source p-3 font-mono text-[11px] text-slate-400">
                            <div className="truncate max-w-[180px]" title={item.sourceLocation}>
                              {item.source === 'registry_hkcu' && 'HKCU\\...\\Run'}
                              {item.source === 'registry_hklm' && 'HKLM\\...\\Run'}
                              {item.source === 'scheduled_task' && 'Task: ' + item.sourceLocation.split('\\').pop()}
                              {item.source === 'startup_folder_user' && 'User Startup'}
                              {item.source === 'windows_service' && 'Service: ' + item.name.split(' ')[0]}
                            </div>
                            <span className="text-[10px] text-slate-500 uppercase font-mono">{item.source.replace('_', ' ')}</span>
                          </td>

                          {/* Impact */}
                          <td className="p-3 whitespace-nowrap">
                            <span
                              className={`startup-impact-value px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                                item.impact === 'high'
                                  ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                  : item.impact === 'medium'
                                  ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                  : 'bg-slate-800 text-slate-300 border border-slate-700'
                              }`}
                            >
                              +{item.impactDelayMs} ms ({item.impact})
                            </span>
                          </td>

                          {/* Status & Quick Toggle */}
                          <td className="p-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                            {item.isProtected ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400 border border-slate-700">
                                Locked
                              </span>
                            ) : (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => {
                                    const next = item.status === 'disabled' ? 'enabled' : 'disabled';
                                    handleUpdateItemStatus(item.id, next);
                                    showToast(`${item.name} set to ${next}`);
                                  }}
                                  className={`px-2.5 py-1 rounded-md text-[10px] font-mono uppercase font-bold transition ${
                                    item.status === 'enabled'
                                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-700 hover:bg-emerald-900'
                                      : item.status === 'delayed'
                                      ? 'bg-amber-950 text-amber-300 border border-amber-700 hover:bg-amber-900'
                                      : 'bg-rose-950 text-rose-300 border border-rose-700 hover:bg-rose-900'
                                  }`}
                                >
                                  {item.status}
                                </button>
                              </div>
                            )}
                          </td>

                          {/* Stagger Delay Quick Selector */}
                          <td className="p-3 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                            {item.status !== 'disabled' ? (
                              <select
                                value={item.delaySeconds}
                                onChange={(e) => {
                                  const sec = Number(e.target.value);
                                  handleUpdateItemStatus(item.id, sec > 0 ? 'delayed' : 'enabled', sec);
                                  showToast(`${item.name} launch scheduled for +${sec}s`);
                                }}
                                className="bg-[#050e1f] border border-slate-700 rounded px-1.5 py-0.5 font-mono text-[10px] text-slate-300"
                              >
                                <option value="0">Instant</option>
                                <option value="15">+15s</option>
                                <option value="30">+30s</option>
                                <option value="60">+60s</option>
                                <option value="120">+120s</option>
                              </select>
                            ) : (
                              <span className="text-[10px] font-mono text-slate-600">—</span>
                            )}
                          </td>

                          {/* Inspect */}
                          <td className="p-3 text-right">
                            <button
                              onClick={() => setSelectedItemId(item.id)}
                              className="p-1 rounded hover:bg-cyan-500/20 text-slate-400 hover:text-cyan-300 transition"
                              title="Inspect Details"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right: Startup Item Dossier & Inspector (4 Columns) — bounded tile,
                internal scroller keeps it flush with the register tile. */}
            <div className="xl:col-span-4 h-full min-h-0 space-y-3 overflow-y-auto startup-custom-scrollbar xl:pr-1">
              <div className="p-4 rounded-2xl bg-[#071329] border border-cyan-500/30 shadow-xl space-y-3">
                
                {/* Header Lockup */}
                <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-3">
                    <StartupIcon name={selectedItem.name} className="w-10 h-10 shrink-0" />
                    <div>
                      <h3 className="font-bold text-sm text-white tracking-wide">{selectedItem.name}</h3>
                      <div className="text-xs text-slate-400">{selectedItem.publisher}</div>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold ${
                      selectedItem.status === 'enabled'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : selectedItem.status === 'delayed'
                        ? 'bg-amber-950 text-amber-300 border border-amber-800'
                        : 'bg-rose-950 text-rose-300 border border-rose-800'
                    }`}
                  >
                    {selectedItem.status} {selectedItem.delaySeconds > 0 ? `(+${selectedItem.delaySeconds}s)` : ''}
                  </span>
                </div>

                {/* Resource Metrics at Logon */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2.5 rounded-xl bg-[#091833] border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase font-mono">Boot Delay</div>
                    <div className="text-sm font-bold font-mono text-rose-400">+{selectedItem.impactDelayMs}ms</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#091833] border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase font-mono">CPU at Boot</div>
                    <div className="text-sm font-bold font-mono text-cyan-400">{selectedItem.cpuUsageAtBoot}</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#091833] border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase font-mono">Disk I/O</div>
                    <div className="text-sm font-bold font-mono text-amber-400">{selectedItem.diskIoAtBoot}</div>
                  </div>
                </div>

                {/* Safety & Recommendation Chip */}
                <div className="p-3 rounded-xl bg-[#091a38] border border-cyan-500/20 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-cyan-300">Safety Recommendation:</span>
                    <span className="font-mono text-[10px] font-bold uppercase text-emerald-400">
                      {selectedItem.recommendation.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300">{selectedItem.description}</p>
                </div>

                {/* Digital Signature & Source Paths */}
                <div className="space-y-2 text-xs font-mono">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase block">Executable Binary:</span>
                    <div className="p-2 rounded bg-[#050e1f] border border-slate-800/80 text-[11px] text-slate-300 break-all select-all flex items-center justify-between">
                      <span className="truncate">{selectedItem.executablePath}</span>
                      <button
                        onClick={() => handleCopyPath(selectedItem.executablePath)}
                        className="p-1 hover:text-cyan-400 transition shrink-0 ml-1"
                        title="Copy Executable Path"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-400 text-[10px] uppercase block">Autostart Registry / Task Hive:</span>
                    <div className="p-2 rounded bg-[#050e1f] border border-slate-800/80 text-[11px] text-slate-300 break-all select-all flex items-center justify-between">
                      <span className="truncate">{selectedItem.sourceLocation}</span>
                      <button
                        onClick={() => handleCopyPath(selectedItem.sourceLocation)}
                        className="p-1 hover:text-cyan-400 transition shrink-0 ml-1"
                        title="Copy Hive Path"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Checkpoints verification */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold">Verified Checkpoints:</span>
                  {selectedItem.checkpoints.map((cp, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-[11px] text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{cp}</span>
                    </div>
                  ))}
                </div>

                {/* Direct Action Controls */}
                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <div className="flex items-center gap-2">
                    {selectedItem.isProtected ? (
                      <div className="w-full py-2 rounded-xl bg-slate-800 text-slate-500 font-bold text-xs text-center">
                        Operating System Protected Item
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            const next = selectedItem.status === 'disabled' ? 'enabled' : 'disabled';
                            handleUpdateItemStatus(selectedItem.id, next);
                            showToast(`${selectedItem.name} set to ${next}`);
                          }}
                          className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                            selectedItem.status === 'disabled'
                              ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                              : 'bg-rose-600/80 hover:bg-rose-600 text-white'
                          }`}
                        >
                          <PowerOff className="w-3.5 h-3.5" />
                          <span>{selectedItem.status === 'disabled' ? 'Enable Autostart' : 'Soft-Disable'}</span>
                        </button>

                        <button
                          onClick={() => {
                            const nextDelay = selectedItem.delaySeconds === 30 ? 60 : 30;
                            handleUpdateItemStatus(selectedItem.id, 'delayed', nextDelay);
                            showToast(`${selectedItem.name} scheduled for +${nextDelay}s delay`);
                          }}
                          className="flex-1 py-2 rounded-xl text-xs font-bold bg-[#0a1e42] hover:bg-cyan-900/50 text-cyan-300 border border-cyan-500/40 transition flex items-center justify-center gap-1.5"
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>Stagger (+30s)</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Live Staging Operation Preview */}
                <div className="p-3 rounded-xl bg-[#050e1f] border border-cyan-500/20 text-[11px] space-y-1">
                  <div className="flex items-center justify-between text-slate-400 font-mono text-[10px]">
                    <span>PROPOSED REGISTRY DELTA</span>
                    <span className="text-cyan-400">Preview Only</span>
                  </div>
                  <div className="text-slate-300 font-mono text-[10px]">
                    Hive: {selectedItem.sourceLocation}
                  </div>
                  <div className="text-emerald-400 font-mono text-[10px]">
                    Target State: {selectedItem.status} ({selectedItem.delaySeconds}s delay)
                  </div>
                  <div className="text-slate-500 text-[10px] pt-1">
                    Authorization: Interactive User Token · Rollback Hash: SHA256:7c9e1f...
                  </div>
                </div>

              </div>
            </div>

          </div>
          )}

          {/* Twelve Domain Services Matrix Dock — bounded pane, never below the fold */}
          {activePane === 'services' && (
          <div className="flex-1 min-h-0 overflow-y-auto startup-custom-scrollbar space-y-3 pr-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <h3 className="font-bold text-sm text-white tracking-wide">
                  {isArabic ? 'مصفوفة خدمات إقلاع ويندوز الاثنتي عشرة' : 'Twelve Boot Domain Services Matrix'}
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">12 specialized interactive modules ready</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2.5">
              {STARTUP_SERVICES_CATALOG.map((svc) => (
                <div
                  key={svc.id}
                  onClick={() => setActiveWorkspaceKey(svc.serviceKey)}
                  className="p-3 rounded-xl bg-[#08152e] border border-slate-800 hover:border-cyan-500/50 hover:bg-[#0a1c3d] cursor-pointer transition flex flex-col justify-between group shadow-sm"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition shrink-0">
                        {svc.serviceKey === 'startup-overview' && <Activity className="w-4 h-4" />}
                        {svc.serviceKey === 'startup-disable' && <PowerOff className="w-4 h-4 text-purple-400" />}
                        {svc.serviceKey === 'startup-restore' && <RotateCcw className="w-4 h-4 text-emerald-400" />}
                        {svc.serviceKey === 'startup-sources' && <FolderTree className="w-4 h-4 text-blue-400" />}
                        {svc.serviceKey === 'startup-journal' && <FileCheck className="w-4 h-4 text-purple-400" />}
                        {svc.serviceKey === 'startup-filter' && <Filter className="w-4 h-4 text-cyan-400" />}
                        {svc.serviceKey === 'startup-impact' && <Gauge className="w-4 h-4 text-amber-400" />}
                        {svc.serviceKey === 'startup-services' && <Cog className="w-4 h-4 text-blue-400" />}
                        {svc.serviceKey === 'startup-tasks' && <CalendarClock className="w-4 h-4 text-purple-400" />}
                        {svc.serviceKey === 'startup-delay' && <Clock className="w-4 h-4 text-amber-400" />}
                        {svc.serviceKey === 'startup-batch' && <Sparkles className="w-4 h-4 text-rose-400" />}
                        {svc.serviceKey === 'startup-undo-all' && <ShieldAlert className="w-4 h-4 text-rose-400" />}
                      </div>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase bg-[#050e1f] text-slate-400 border border-slate-700">
                        {svc.category}
                      </span>
                    </div>
                    <div className="font-semibold text-xs text-white group-hover:text-cyan-300 transition">
                      {svc.name}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {svc.subtitle}
                    </p>
                  </div>

                  <div className="pt-3 flex items-center justify-between text-[10px] font-mono text-cyan-400">
                    <span>Open Workspace</span>
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          )}

          {/* Docked Live Process & Telemetry Inspector — non-overlapping */}

        </main>
      </div>

      {/* 4. Sticky Action Dock Footer */}
      <footer className="shrink-0 bg-[#061124] border-t border-slate-800/80 z-30">
        {/* Reserved telemetry slot — docked above the action bar so it can never
            cover the program table, the selected-item dossier, or the staged decisions. */}
        <div className="px-6 pt-2.5">
          <LiveProcessInspector
            activeProcessName={isArabic ? 'محرك مراقبة إقلاع ويندوز وتحليل السجلات الحية' : 'KNOuX Windows Boot Engine Telemetry Inspector'}
            activeProcessCategory="BOOT_CONTROL"
            progressPercent={100}
            isExecuting={true}
            isArabic={isArabic}
            bounded
            maxHeightClassName="max-h-[200px]"
            defaultMinimized
            fillWidth
          />
        </div>

        <div className="h-14 px-6 flex items-center justify-between">
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-cyan-300">{checkedIds.size}</span>
            <span className="text-slate-400">items selected</span>
          </div>
          <span className="text-slate-700">•</span>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Staged Boot Savings:</span>
            <span className="font-mono font-bold text-emerald-400">
              +{((totalStagedSavingsMs) / 1000).toFixed(2)}s
            </span>
          </div>
          <span className="text-slate-700">•</span>
          <div className="flex items-center gap-1.5 text-slate-400">
            <span>Staged Changes:</span>
            <span className="font-mono text-amber-400 font-bold">{stagedCount}</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setCheckedIds(new Set());
              showToast('Selection cleared');
            }}
            className="px-3 py-1.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            Clear Selection
          </button>

          <button
            onClick={() => setActiveWorkspaceKey('startup-batch')}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#0a1d3f] hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5 transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Batch Optimize</span>
          </button>

          <button
            onClick={() => setActiveWorkspaceKey('startup-undo-all')}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 flex items-center gap-1.5 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Revert All</span>
          </button>

          <button
            onClick={() => {
              showToast(`Committed ${stagedCount} changes to Staged Boot Journal (Pre-boot verified)`);
            }}
            className="px-4 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-md shadow-cyan-500/20 flex items-center gap-2 transition"
          >
            <span>Stage Selected Changes</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        </div>
      </footer>

      {activeWorkspaceKey && (
        <StartupWorkspaces
          serviceKey={activeWorkspaceKey}
          onClose={() => setActiveWorkspaceKey(null)}
          isArabic={isArabic}
        />
      )}

    </div>
  );
}
