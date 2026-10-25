/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  FlaskConical,
  Search,
  Settings,
  HelpCircle,
  Bell,
  Minus,
  Square,
  X,
  Languages,
  Home,
  Rocket,
  Gauge,
  LayoutGrid,
  ShieldCheck,
  BarChart3,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Coins,
  ShieldAlert,
  RotateCcw,
  Layers,
  Trash2,
  Sparkles,
  DownloadCloud,
  Globe,
  FileCode2,
  Clock,
  FileSpreadsheet,
  Check,
  ChevronRight,
  MoreVertical,
  SlidersHorizontal,
  Save,
  Info,
  Folder,
  Zap
} from 'lucide-react';

import {
  INITIAL_CLEANUP_METRICS,
  CATEGORY_BREAKDOWN_BAR,
  CLEANUP_CANDIDATES_FIXTURE,
  CLEANUP_SERVICES_CATALOG,
  CleanupCandidate,
  SafetyLevel
} from '../lib/cleanup-inventory';
import { CleanupWorkspaces } from '../components/cleanup/CleanupWorkspaces';
import { useNavigation } from '../context/NavigationContext';
import { KNOuXTitleBar, KNOuXSidebar } from '../components/shell/KNOuXShellComponents';
import '../cleanup.css';

interface CleanupPageProps {
  onNavigateSection?: (section: string) => void;
}

export function CleanupPage({ onNavigateSection }: CleanupPageProps) {
  const { navigateTo, isActive, isArabic, toggleLocale } = useNavigation();
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>('cand-1');
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set(['cand-1', 'cand-2', 'cand-3'])); // 3 selected
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  const [activeServiceModal, setActiveServiceModal] = useState<string | null>(null);

  const selectedCandidate =
    CLEANUP_CANDIDATES_FIXTURE.find(c => c.id === selectedCandidateId) || CLEANUP_CANDIDATES_FIXTURE[0];

  const handleToggleCheck = (id: string) => {
    setCheckedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (checkedIds.size === CLEANUP_CANDIDATES_FIXTURE.length) {
      setCheckedIds(new Set());
    } else {
      setCheckedIds(new Set(CLEANUP_CANDIDATES_FIXTURE.map(c => c.id)));
    }
  };

  const filteredCandidates = CLEANUP_CANDIDATES_FIXTURE.filter(cand => {
    if (activeCategoryFilter !== 'all' && cand.category !== activeCategoryFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        cand.name.toLowerCase().includes(q) ||
        cand.path.toLowerCase().includes(q) ||
        cand.source.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div
      dir={isArabic ? 'rtl' : 'ltr'}
      className="cleanup-viewport bg-[#040b18] text-slate-100 flex flex-col h-screen select-none relative overflow-hidden font-sans"
    >
      {/* 1. Windows Chrome / Top Navigation */}
      <KNOuXTitleBar
        sectionName={isArabic ? 'معمل التنظيف' : 'Cleanup'}
        sectionSubtitle={isArabic ? 'غرفة الفحص العميق' : 'Clean Room'}
        onNavigateHome={() => (onNavigateSection ? onNavigateSection('home') : navigateTo('home'))}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder={isArabic ? 'البحث عن ملفات، تطبيقات، أو خيارات التنظيف...' : 'Search files, apps, or cleanup options... (Ctrl+K)'}
        isArabic={isArabic}
        onToggleArabic={toggleLocale}
      />

      {/* Main Body Shell: Sidebar + Content Canvas */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Futuristic laboratory scanning ring element */}
        <div className="cleanup-hero-ring" />

        {/* 2. Sidebar Navigation (Left) */}
        <KNOuXSidebar
          activeSection="cleanup"
          onNavigate={(sec) => (onNavigateSection ? onNavigateSection(sec) : navigateTo(sec))}
          isArabic={isArabic}
        />

        {/* 3. Main Scrollable Canvas */}
        <main className="flex-1 overflow-y-auto cleanup-scrollbar p-5 space-y-4">
          {/* Hero Section */}
          <div className="flex items-center gap-4 relative z-10 pb-1">
            <div className="p-3.5 rounded-2xl bg-purple-950/70 border border-purple-500/40 text-purple-300 shadow-lg shadow-purple-900/30">
              <FlaskConical className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-white">
                {isArabic ? 'معمل التنظيف الذكي' : 'Clean Room'}
              </h1>
              <p className="text-xs text-slate-300 mt-0.5">
                {isArabic
                  ? 'افهم بدقة ما يمكن تنظيفه قبل تغيير أي ملف في النظام.'
                  : 'Understand what can be cleaned before changing anything.'}
              </p>
            </div>
          </div>

          {/* 4. Top Summary Strip (4 Cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* 1. Scan Coverage */}
            <div className="p-3.5 rounded-xl bg-[#091838]/85 border border-slate-700/60 flex items-center gap-3 shadow-lg shadow-black/20">
              <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-800"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-cyan-400"
                    strokeDasharray="92, 100"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="absolute font-mono font-bold text-xs text-cyan-300">92%</span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white">Scan Coverage</span>
                  <Info className="w-3 h-3 text-slate-500" />
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5 font-mono">1,842,651 items analyzed</div>
                <div className="text-[10px] text-cyan-400 font-medium">Minimal areas remaining</div>
              </div>
            </div>

            {/* 2. Candidate Files */}
            <div className="p-3.5 rounded-xl bg-[#091838]/85 border border-slate-700/60 flex items-center gap-3 shadow-lg shadow-black/20">
              <div className="p-2.5 rounded-xl bg-blue-950/70 border border-blue-500/40 text-blue-300">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xl font-extrabold font-mono text-white leading-none">24,893</div>
                <div className="text-xs font-semibold text-slate-200 mt-1">Candidate Files</div>
                <div className="text-[10px] text-slate-400">across 7 categories</div>
              </div>
            </div>

            {/* 3. Potential Space Recovery */}
            <div className="p-3.5 rounded-xl bg-[#091838]/85 border border-slate-700/60 flex items-center gap-3 shadow-lg shadow-black/20">
              <div className="p-2.5 rounded-xl bg-amber-950/70 border border-amber-500/40 text-amber-300">
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xl font-extrabold font-mono text-amber-300 leading-none">8.46 GB</div>
                <div className="text-xs font-semibold text-slate-200 mt-1">Potential Space Recovery</div>
                <div className="text-[10px] text-slate-400">Estimated reclaimable space</div>
              </div>
            </div>

            {/* 4. Items Requiring Review */}
            <div className="p-3.5 rounded-xl bg-[#091838]/85 border border-rose-500/40 flex items-center gap-3 shadow-lg shadow-rose-950/20">
              <div className="p-2.5 rounded-xl bg-rose-950/70 border border-rose-500/50 text-rose-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xl font-extrabold font-mono text-rose-300 leading-none">317</div>
                <div className="text-xs font-semibold text-rose-200 mt-1">Items Requiring Review</div>
                <div className="text-[10px] text-rose-300/80">May affect apps or system behavior</div>
              </div>
            </div>
          </div>

          {/* 5. Main Content Split: Left Workspace (8 cols) + Right Inspector (4 cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left 8 Cols: Cleanup Candidates & 12 Services */}
            <div className="lg:col-span-8 space-y-4">
              {/* Cleanup Candidates Section */}
              <div className="bg-[#071329] border border-slate-700/60 rounded-2xl p-4 shadow-xl space-y-3">
                <h3 className="text-sm font-bold text-white tracking-wide">
                  {isArabic ? 'العناصر المرشحة للتنظيف' : 'Cleanup Candidates'}
                </h3>

                {/* Filter Pills with Counts */}
                <div className="flex flex-wrap items-center gap-1.5 pb-2">
                  <button
                    onClick={() => setActiveCategoryFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition ${
                      activeCategoryFilter === 'all'
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-900/40'
                        : 'bg-[#091838] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>All Candidates</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-purple-950 text-purple-200">24,893</span>
                  </button>

                  <button
                    onClick={() => setActiveCategoryFilter('temporary')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${
                      activeCategoryFilter === 'temporary'
                        ? 'bg-purple-600 text-white'
                        : 'bg-[#091838] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>Temporary Files</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-slate-800 text-slate-300">8,412</span>
                  </button>

                  <button
                    onClick={() => setActiveCategoryFilter('residues')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${
                      activeCategoryFilter === 'residues'
                        ? 'bg-purple-600 text-white'
                        : 'bg-[#091838] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>Application Residues</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-slate-800 text-slate-300">4,231</span>
                  </button>

                  <button
                    onClick={() => setActiveCategoryFilter('logs')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${
                      activeCategoryFilter === 'logs'
                        ? 'bg-purple-600 text-white'
                        : 'bg-[#091838] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>System Logs</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-slate-800 text-slate-300">3,987</span>
                  </button>

                  <button
                    onClick={() => setActiveCategoryFilter('browser')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${
                      activeCategoryFilter === 'browser'
                        ? 'bg-purple-600 text-white'
                        : 'bg-[#091838] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>Browser Cache</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-slate-800 text-slate-300">5,210</span>
                  </button>

                  <button
                    onClick={() => setActiveCategoryFilter('downloads')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${
                      activeCategoryFilter === 'downloads'
                        ? 'bg-purple-600 text-white'
                        : 'bg-[#091838] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>Downloads</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-slate-800 text-slate-300">2,619</span>
                  </button>

                  <button
                    onClick={() => setActiveCategoryFilter('recycle')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${
                      activeCategoryFilter === 'recycle'
                        ? 'bg-purple-600 text-white'
                        : 'bg-[#091838] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>Recycle Bin</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-slate-800 text-slate-300">434</span>
                  </button>
                </div>

                {/* Thin Colored Category Breakdown Bar */}
                <div className="space-y-1.5 pt-1">
                  <div className="w-full h-3 rounded-full overflow-hidden flex bg-slate-900 border border-slate-700/60 p-[1px]">
                    {CATEGORY_BREAKDOWN_BAR.map((seg) => (
                      <div
                        key={seg.id}
                        className="breakdown-segment first:rounded-l-full last:rounded-r-full"
                        style={{ width: `${seg.percentage}%`, backgroundColor: seg.color }}
                        title={`${seg.label}: ${seg.percentage}% (${seg.sizeDisplay})`}
                      />
                    ))}
                  </div>

                  {/* Legends under bar */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] font-mono text-slate-400">
                    {CATEGORY_BREAKDOWN_BAR.map((seg) => (
                      <span key={seg.id} className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: seg.color }} />
                        <span>{seg.label}</span>
                        <strong className="text-slate-200">{seg.percentage}% ({seg.sizeDisplay})</strong>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Candidates Table Ledger — scrolls horizontally inside its own
                    tile at compact desktop widths so no Inspect control is cut off. */}
                <div className="rounded-xl border border-slate-700/70 overflow-x-auto bg-[#050f22] mt-3 knx-custom-scrollbar">
                  <table className="w-full min-w-[820px] text-left text-xs">
                    <thead className="bg-[#0b1c3a] text-slate-400 text-[10px] font-mono uppercase tracking-wider">
                      <tr>
                        <th className="px-3 py-2.5 w-8">
                          <input
                            type="checkbox"
                            checked={checkedIds.size === CLEANUP_CANDIDATES_FIXTURE.length}
                            onChange={handleSelectAll}
                            className="rounded bg-slate-900 border-slate-700 text-purple-600 focus:ring-purple-500 w-3.5 h-3.5"
                          />
                        </th>
                        <th className="px-3 py-2.5">Name / Path</th>
                        <th className="px-3 py-2.5">Source</th>
                        <th className="px-3 py-2.5">Age ▾</th>
                        <th className="px-3 py-2.5">Size ▾</th>
                        <th className="px-3 py-2.5">Safety</th>
                        <th className="px-3 py-2.5 text-right">Inspect</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/70 font-mono">
                      {filteredCandidates.map((cand) => {
                        const isChecked = checkedIds.has(cand.id);
                        const isSelected = cand.id === selectedCandidateId;
                        return (
                          <tr
                            key={cand.id}
                            onClick={() => setSelectedCandidateId(cand.id)}
                            className={`cursor-pointer transition ${
                              isSelected
                                ? 'bg-purple-950/40 border-l-2 border-purple-500'
                                : 'hover:bg-slate-800/40'
                            }`}
                          >
                            <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleToggleCheck(cand.id)}
                                className="rounded bg-slate-900 border-slate-700 text-purple-600 focus:ring-purple-500 w-3.5 h-3.5"
                              />
                            </td>
                            <td className="px-3 py-3">
                              <div className="flex items-center gap-2">
                                {renderCandidateIcon(cand.sourceIcon)}
                                <div>
                                  <div className="font-semibold text-slate-200 text-xs font-sans">
                                    {cand.name}
                                  </div>
                                  <div className="text-[10px] text-slate-400 truncate max-w-xs">
                                    {cand.path}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-3 font-sans text-xs text-slate-300 whitespace-nowrap">
                              {cand.source}
                            </td>
                            <td className="px-3 py-3 text-slate-400 whitespace-nowrap">
                              {cand.ageDisplay}
                            </td>
                            <td className="px-3 py-3 font-bold text-cyan-300 whitespace-nowrap">
                              {cand.sizeDisplay}
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap">
                              {renderSafetyBadge(cand.safety, cand.safetyLabel)}
                            </td>
                            <td className="px-3 py-3 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedCandidateId(cand.id);
                                  }}
                                  className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
                                  title="Inspect"
                                >
                                  <Search className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
                                  title="Options"
                                >
                                  <MoreVertical className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Cleanup Services Strip (12 Cards in 4x3 Grid) */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    {isArabic ? 'خدمات معمل التنظيف' : 'Cleanup Services'}
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    {isArabic ? '12 خدمة متخصصة · انقر لمعاينة بيئة العمل' : '12 specialized in-app tools · Click to open workspace'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                  {CLEANUP_SERVICES_CATALOG.map((srv) => (
                    <div
                      key={srv.id}
                      onClick={() => setActiveServiceModal(srv.serviceKey)}
                      className="p-3 rounded-xl bg-[#08152e] hover:bg-[#0c1f44] border border-slate-700/60 hover:border-purple-500/50 cursor-pointer transition shadow-md group flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-2 rounded-lg bg-slate-900 border border-slate-700 text-purple-400 group-hover:text-purple-300 transition shrink-0">
                          {renderServiceCatalogIcon(srv.serviceKey)}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-200 group-hover:text-white truncate">
                            {srv.name}
                          </h4>
                          <p className="text-[10px] text-slate-400 truncate">
                            {srv.subtitle}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-purple-300 shrink-0 ml-1" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right 4 Cols: Cleanup Preview & Safety Review Inspector */}
            <div className="lg:col-span-4 bg-[#071329] border border-slate-700/60 rounded-2xl p-4 shadow-xl flex flex-col justify-between space-y-4">
              <div className="space-y-4">
                {/* Header */}
                <div className="pb-2 border-b border-slate-800">
                  <h3 className="text-sm font-bold text-white tracking-wide">
                    {isArabic ? 'معاينة التنظيف ومراجعة الأمان' : 'Cleanup Preview & Safety Review'}
                  </h3>
                </div>

                {/* Active Item Card */}
                <div className="p-3 rounded-xl bg-[#091a3a] border border-slate-700/60 flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                    <Folder className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-white truncate">
                      {selectedCandidate.name}
                    </h4>
                    <p className="text-[10px] font-mono text-slate-400 truncate">
                      {selectedCandidate.path}
                    </p>
                  </div>
                </div>

                {/* Attributes List */}
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Selected Scope</span>
                    <span className="font-mono font-semibold text-slate-200">
                      {selectedCandidate.itemCount} files · {selectedCandidate.sizeDisplay}
                    </span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Proposed Action</span>
                    <span className="text-slate-300 font-mono text-[11px]">
                      Delete (move to system recycle)
                    </span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Recoverability</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-700">
                      Easily recoverable (via browser rebuild)
                    </span>
                  </div>

                  <div className="py-1 border-b border-slate-800/60">
                    <span className="text-slate-400 block mb-1">User Impact</span>
                    <span className="text-slate-300 text-[11px] leading-relaxed block">
                      {selectedCandidate.userImpact}
                    </span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Permission Required</span>
                    <span className="text-slate-300 text-[11px]">
                      {selectedCandidate.permissionRequired}
                    </span>
                  </div>
                </div>

                {/* Review Checkpoints */}
                <div className="space-y-1.5 pt-1">
                  <h5 className="text-xs font-semibold text-slate-200">Review Checkpoints</h5>
                  <div className="space-y-1.5 text-xs">
                    {selectedCandidate.checkpoints.map((cp, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-emerald-300 text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{cp}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Unsupported Actions */}
                <div className="p-2.5 rounded-lg bg-blue-950/30 border border-blue-800/40 flex items-start gap-2 text-xs text-slate-300">
                  <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <div className="text-[11px]">
                    <strong className="text-blue-300">Unsupported Actions: </strong>
                    No unsupported actions detected in this selection.
                  </div>
                </div>

                {/* 8-Step Vertical Sequence */}
                <div className="relative pt-2 pl-6 pr-2 space-y-2.5 text-xs">
                  <div className="vertical-sequence-line" />

                  <div className="relative flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-purple-600 text-white font-mono text-[10px] font-bold flex items-center justify-center border-2 border-[#071329] shadow-md shadow-purple-500/40 z-10">
                      1
                    </div>
                    <div>
                      <span className="font-bold text-white text-xs">Inspect</span>
                      <span className="text-[10px] text-slate-400 block">Analyze selected items</span>
                    </div>
                  </div>

                  <div className="relative flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 font-mono text-[10px] font-bold flex items-center justify-center border-2 border-[#071329] z-10">
                      2
                    </div>
                    <div>
                      <span className="font-semibold text-slate-300 text-xs">Classify</span>
                      <span className="text-[10px] text-slate-500 block">Determine safety & impact</span>
                    </div>
                  </div>

                  <div className="relative flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 font-mono text-[10px] font-bold flex items-center justify-center border-2 border-[#071329] z-10">
                      3
                    </div>
                    <div>
                      <span className="font-semibold text-slate-300 text-xs">Select</span>
                      <span className="text-[10px] text-slate-500 block">Choose what to clean</span>
                    </div>
                  </div>

                  <div className="relative flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 font-mono text-[10px] font-bold flex items-center justify-center border-2 border-[#071329] z-10">
                      4
                    </div>
                    <div>
                      <span className="font-semibold text-slate-300 text-xs">Review Risk</span>
                      <span className="text-[10px] text-slate-500 block">Check impact & recoverability</span>
                    </div>
                  </div>

                  <div className="relative flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 font-mono text-[10px] font-bold flex items-center justify-center border-2 border-[#071329] z-10">
                      5
                    </div>
                    <div>
                      <span className="font-semibold text-slate-300 text-xs">Approve</span>
                      <span className="text-[10px] text-slate-500 block">Confirm and proceed</span>
                    </div>
                  </div>

                  <div className="relative flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 font-mono text-[10px] font-bold flex items-center justify-center border-2 border-[#071329] z-10">
                      6
                    </div>
                    <div>
                      <span className="font-semibold text-slate-300 text-xs">Execute</span>
                      <span className="text-[10px] text-slate-500 block">Perform cleanup (preview)</span>
                    </div>
                  </div>

                  <div className="relative flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 font-mono text-[10px] font-bold flex items-center justify-center border-2 border-[#071329] z-10">
                      7
                    </div>
                    <div>
                      <span className="font-semibold text-slate-300 text-xs">Verify</span>
                      <span className="text-[10px] text-slate-500 block">Confirm results</span>
                    </div>
                  </div>

                  <div className="relative flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 font-mono text-[10px] font-bold flex items-center justify-center border-2 border-[#071329] z-10">
                      8
                    </div>
                    <div>
                      <span className="font-semibold text-slate-300 text-xs">Recovery</span>
                      <span className="text-[10px] text-slate-500 block">Undo if needed</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Execute Cleanup Button (Disabled Preview State) */}
              <div className="pt-3 border-t border-slate-800 text-center">
                <button
                  disabled
                  className="w-full py-2.5 rounded-xl text-xs font-bold bg-slate-800 text-slate-500 border border-slate-700/60 cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <span>▶ Execute Cleanup (Preview Only)</span>
                </button>
                <p className="text-[10px] text-slate-500 mt-1.5">
                  Execution is disabled. Review selected items to proceed.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* 8. Sticky Action Dock (Bottom) */}
      <footer className="h-14 bg-[#050e20] border-t border-slate-800/90 px-5 flex items-center justify-between z-30 shrink-0">
        <div className="flex items-center gap-2 text-xs text-slate-300 font-mono">
          <span className="font-bold text-white">{checkedIds.size} items selected</span>
          <span className="text-slate-500">·</span>
          <span className="text-cyan-300 font-bold">2.87 GB</span>
          <span className="text-slate-500">·</span>
          <span className="flex items-center gap-1.5 text-amber-300">
            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
            (317 items require review)
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setActiveServiceModal('cleanup-temp-preview')}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/40 flex items-center gap-2 transition"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isArabic ? 'مراجعة العناصر المحددة' : 'Review Selected Items'} →</span>
          </button>

          <button
            onClick={() => setActiveServiceModal('cleanup-reports')}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#091838] hover:bg-slate-800 border border-slate-700 text-slate-200 flex items-center gap-1.5 transition"
          >
            <Save className="w-4 h-4 text-slate-400" />
            <span>{isArabic ? 'حفظ التقرير' : 'Save Report'}</span>
          </button>

          <button
            onClick={() => setActiveServiceModal('cleanup-estimate')}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#091838] hover:bg-slate-800 border border-slate-700 text-slate-200 flex items-center gap-1.5 transition"
          >
            <SlidersHorizontal className="w-4 h-4 text-slate-400" />
            <span>{isArabic ? 'ضبط النطاق' : 'Adjust Scope'}</span>
          </button>

          <button
            onClick={() => setCheckedIds(new Set())}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-950/40 hover:bg-rose-900/50 border border-rose-700/60 text-rose-300 flex items-center gap-1.5 transition"
          >
            <X className="w-4 h-4" />
            <span>{isArabic ? 'إلغاء التحديد' : 'Cancel Selection'}</span>
          </button>
        </div>
      </footer>

      {activeServiceModal && (
        <CleanupWorkspaces
          serviceKey={activeServiceModal}
          onClose={() => setActiveServiceModal(null)}
          isArabic={isArabic}
        />
      )}

    </div>
  );
}

function renderCandidateIcon(type: string) {
  switch (type) {
    case 'chrome':
      return <Globe className="w-4 h-4 text-amber-400 shrink-0" />;
    case 'windows':
      return <DownloadCloud className="w-4 h-4 text-blue-400 shrink-0" />;
    case 'teams':
      return <Layers className="w-4 h-4 text-purple-400 shrink-0" />;
    case 'adobe':
      return <FileCode2 className="w-4 h-4 text-red-400 shrink-0" />;
    case 'download':
      return <Folder className="w-4 h-4 text-blue-400 shrink-0" />;
    case 'recycle':
      return <Trash2 className="w-4 h-4 text-emerald-400 shrink-0" />;
    default:
      return <FileText className="w-4 h-4 text-slate-400 shrink-0" />;
  }
}

function renderSafetyBadge(safety: SafetyLevel, label: string) {
  switch (safety) {
    case 'safe':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/70 text-emerald-300 border border-emerald-700/60">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          {label}
        </span>
      );
    case 'review-recommended':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-950/70 text-amber-300 border border-amber-700/60">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          {label}
        </span>
      );
    case 'review-required':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-950/70 text-rose-300 border border-rose-700/60">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
          {label}
        </span>
      );
  }
}

function renderServiceCatalogIcon(key: string) {
  switch (key) {
    case 'cleanup-temp-preview':
      return <FileText className="w-4 h-4" />;
    case 'cleanup-temp-quarantine':
      return <ShieldAlert className="w-4 h-4" />;
    case 'cleanup-temp-undo':
      return <RotateCcw className="w-4 h-4" />;
    case 'cleanup-quarantine-list':
      return <Layers className="w-4 h-4" />;
    case 'cleanup-estimate':
      return <Coins className="w-4 h-4" />;
    case 'cleanup-recycle':
      return <Trash2 className="w-4 h-4" />;
    case 'cleanup-unused':
      return <Sparkles className="w-4 h-4" />;
    case 'cleanup-update-cache':
      return <DownloadCloud className="w-4 h-4" />;
    case 'cleanup-browser-cache':
      return <Globe className="w-4 h-4" />;
    case 'cleanup-logs':
      return <FileCode2 className="w-4 h-4" />;
    case 'cleanup-schedule':
      return <Clock className="w-4 h-4" />;
    case 'cleanup-reports':
      return <FileSpreadsheet className="w-4 h-4" />;
    default:
      return <FileText className="w-4 h-4" />;
  }
}
