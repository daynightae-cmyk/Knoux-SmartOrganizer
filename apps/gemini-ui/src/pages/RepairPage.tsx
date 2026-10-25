/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Wrench,
  Search,
  Bell,
  Minus,
  Square,
  X,
  Languages,
  Home,
  Layers,
  Sparkles,
  Zap,
  Shield,
  Eye,
  Info,
  Settings,
  HelpCircle,
  Cpu,
  FileText,
  Globe,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Terminal,
  Copy,
  Download,
  ListChecks,
  Play,
  RotateCcw,
  CheckSquare,
  Sliders,
  Cloud,
  Network as NetworkIcon,
  ChevronRight,
  HardDrive
} from 'lucide-react';

import {
  REPAIR_TOOLS_CATALOG,
  INITIAL_DIAGNOSTIC_STRIP,
  GUIDED_REPAIR_STEPS,
  RepairToolMeta,
  RepairHistoryItem,
  RepairDiagnosticStripItem,
  GuidedRepairStep,
  resolveRepairWorkspaceId
} from '../lib/repair-inventory';
import { RepairWorkspaces } from '../components/repair/RepairWorkspaces';
import { DesignPreviewModal } from '../components/common/DesignPreviewModal';
import { KNOuXTitleBar, KNOuXSidebar } from '../components/shell/KNOuXShellComponents';
import { useNavigation } from '../context/NavigationContext';
import '../repair.css';

interface RepairPageProps {
  onNavigateSection?: (section: string) => void;
}

export function RepairPage({ onNavigateSection }: RepairPageProps) {
  const { navigateTo, isActive, isArabic, toggleLocale } = useNavigation();
  // Selected tool (defaulting to DISM ScanHealth as in the reference screenshot)
  const [selectedToolId, setSelectedToolId] = useState<string>('repair-component-scan');

  // Search & filter query for tools
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  // Interactive Guided Repair Step
  const [activeStepNumber, setActiveStepNumber] = useState<number>(5); // Step 5 highlighted in screenshot

  // Active modal workspace
  const [activeModal, setActiveModal] = useState<
    'review-repair' | 'view-prerequisites' | 'export-diagnostics' | 'execute-repair' | null
  >(null);

  // Specialized service workspace (ServiceWorkspaceHost) for the selected tool
  const [activeServiceWorkspace, setActiveServiceWorkspace] = useState<string | null>(null);

  // Copy feedback toast
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  // Repair History Ledger (defaults to honest empty state as shown in screenshot)
  const [repairHistory, setRepairHistory] = useState<RepairHistoryItem[]>([]);

  // Find currently selected tool
  const currentTool = useMemo(() => {
    return REPAIR_TOOLS_CATALOG.find(t => t.id === selectedToolId) || REPAIR_TOOLS_CATALOG[1];
  }, [selectedToolId]);

  // Filtered repair tools list
  const filteredTools = useMemo(() => {
    return REPAIR_TOOLS_CATALOG.filter(t => {
      const matchesSearch =
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.command.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.shortDescription.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'All' || t.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, categoryFilter]);

  const handleCopyCommand = () => {
    navigator.clipboard?.writeText(currentTool.command);
    setCopiedCode(true);
    setNotificationMsg('Command copied to clipboard');
    setTimeout(() => {
      setCopiedCode(false);
      setNotificationMsg(null);
    }, 2200);
  };

  const handleAddHistory = (entry: RepairHistoryItem) => {
    setRepairHistory(prev => [entry, ...prev]);
    setNotificationMsg(`Operation logged: ${entry.toolName}`);
    setTimeout(() => setNotificationMsg(null), 3000);
  };

  // Build the exportable diagnostic-notes draft from the current tool metadata.
  // Everything here is design-fixture content — no live system data is included.
  const buildDiagnosticNotes = (): string => {
    const lines = [
      `KNOuX SmartOrganizer — Diagnostic Notes (DESIGN PREVIEW)`,
      `Tool        : ${currentTool.name}`,
      `Command     : ${currentTool.command}`,
      `Category    : ${currentTool.category}`,
      `Privilege   : ${currentTool.privilegeRequirement.level}`,
      `Risk        : ${currentTool.riskAssessment.level}`,
      `Duration    : ${currentTool.durationEstimate}`,
      `Captured    : ${new Date().toLocaleString()}`,
      '',
      'Prerequisites (design checklist — not probed on this machine):',
      ...currentTool.prerequisites.map(p => `  - ${p.text}`),
      '',
      'Expected output (preview text):',
      currentTool.expectedOutputPreview,
      '',
      'NOTE: This file was produced from the design fixture. No repair command was',
      'executed and no system state was read.',
    ];
    return lines.join('\n');
  };

  // Render tool card icon based on iconType
  const renderToolIcon = (iconType: string, isSelected: boolean) => {
    const iconClass = `w-5 h-5 ${isSelected ? 'text-cyan-300' : 'text-blue-400'}`;
    switch (iconType) {
      case 'dism-check':
        return <Layers className={iconClass} />;
      case 'dism-scan':
        return <FileText className={iconClass} />;
      case 'dism-restore':
        return <RotateCcw className={iconClass} />;
      case 'sfc-verify':
        return <Sliders className={iconClass} />;
      case 'sfc-scan':
        return <Shield className={iconClass} />;
      case 'dns-flush':
        return <Cloud className={iconClass} />;
      case 'winsock-reset':
        return <Globe className={iconClass} />;
      case 'tcpip-reset':
        return <NetworkIcon className={iconClass} />;
      case 'repair-history':
        return <Clock className={iconClass} />;
      case 'troubleshooters':
        return <Wrench className={iconClass} />;
      case 'restore-point':
        return <HardDrive className={iconClass} />;
      case 'update-repair':
        return <RotateCcw className={iconClass} />;
      default:
        return <Wrench className={iconClass} />;
    }
  };

  return (
    <div className={`repair-viewport ${isArabic ? 'rtl' : 'ltr'} h-screen overflow-hidden`} dir={isArabic ? 'rtl' : 'ltr'}>
      
      {/* =========================================================================
         TOP CHROME TITLEBAR
         ========================================================================= */}
      <KNOuXTitleBar
        sectionName={isArabic ? "معمل الإصلاح" : "Repair"}
        sectionSubtitle={isArabic ? "معمل الاسترداد" : "Recovery Lab"}
        onNavigateHome={() => (onNavigateSection ? onNavigateSection("home") : navigateTo("home"))}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder={isArabic ? "البحث عن الأدوات والإعدادات والمساعدة... (Ctrl+K)" : "Search tools, settings, or help... (Ctrl+K)"}
        isArabic={isArabic}
        onToggleArabic={toggleLocale}
      />

      {/* Toast Notification */}
      {notificationMsg && (
        <div className="fixed top-12 right-6 z-50 px-3.5 py-1.5 rounded-lg bg-cyan-950/90 border border-cyan-400/40 text-cyan-200 text-xs shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
          {notificationMsg}
        </div>
      )}

      {/* =========================================================================
         MAIN APPLICATION LAYOUT (SIDEBAR + CONTENT)
         ========================================================================= */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Navigation Sidebar */}
        <KNOuXSidebar
          activeSection="repair"
          onNavigate={(sec) => (onNavigateSection ? onNavigateSection(sec) : navigateTo(sec))}
          isArabic={isArabic}
        />

        {/* Content Viewport */}
        <main className="flex-1 flex flex-col overflow-hidden px-5 py-3 gap-3 repair-custom-scrollbar">

          {/* =========================================================================
             HERO HEADER SECTION
             ========================================================================= */}
          <section className="relative shrink-0 rounded-xl bg-gradient-to-r from-[#0b1329] via-[#091533] to-[#0d1c3d] border border-slate-800/90 p-3 [@media(max-height:880px)]:p-2.5 overflow-hidden flex items-center justify-between shadow-xl">
            {/* Holographic Diagnostic Orb & Titles */}
            <div className="flex items-center gap-3 relative z-10">
              <div className="repair-hero-orb flex items-center justify-center">
                <Shield className="w-6 h-6 text-cyan-200 drop-shadow" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
                  <span className="text-slate-100">Recovery</span>
                  <span className="bg-gradient-to-r from-purple-400 via-indigo-300 to-cyan-300 bg-clip-text text-transparent">
                    Lab
                  </span>
                </h1>
                <p className="text-xs text-slate-300/90 mt-0.5">
                  {isArabic
                    ? 'تشخيص مشكلات ويندوز وفهم كل عملية إصلاح قبل تفويض تنفيذها.'
                    : 'Diagnose Windows problems. Understand each repair before authorizing it.'}
                </p>
              </div>
            </div>

            {/* Right: Technical Blueprint Watermark */}
            <div className="recovery-blueprint-watermark hidden lg:flex items-center gap-4 text-slate-400">
              <div className="text-right text-[9px] tracking-wider leading-[1.2] border-r border-slate-700/60 pr-3 [@media(max-height:880px)]:hidden">
                <div>DIAGNOSE</div>
                <div>UNDERSTAND</div>
                <div>REPAIR</div>
                <div>RESTORE</div>
                <div className="text-[8px] text-cyan-400">A MORE RELIABLE WINDOWS</div>
              </div>
              <div className="text-sm font-black tracking-widest text-slate-500/40">
                KNOuX<br />RECOVERY LAB
              </div>
            </div>
          </section>

          {/* =========================================================================
             TOP DIAGNOSTIC STRIP (4 PANELS)
             ========================================================================= */}
          <section className="shrink-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {INITIAL_DIAGNOSTIC_STRIP.map(card => (
              <div
                key={card.id}
                className="p-2.5 [@media(max-height:880px)]:p-2 rounded-lg bg-[#081024]/90 border border-slate-800/80 hover:border-slate-700 transition-all flex items-start gap-2.5 shadow-sm"
              >
                <div className="p-1.5 rounded-md bg-blue-900/30 border border-blue-500/20 text-cyan-400 shrink-0 mt-0.5">
                  {card.icon === 'cpu' && <Cpu className="w-4 h-4" />}
                  {card.icon === 'file-check' && <FileText className="w-4 h-4" />}
                  {card.icon === 'network' && <Globe className="w-4 h-4" />}
                  {card.icon === 'journal' && <BookOpen className="w-4 h-4" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-slate-200 truncate">{card.title}</div>
                  
                  {card.id === 'system-components' && (
                    <div className="text-[11px] font-mono text-slate-400 my-0.5">
                      {card.statsOrSummary}
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 text-[11px] text-slate-300 mt-0.5">
                    {card.statusType === 'audit' ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    )}
                    <span className={card.statusType === 'audit' ? 'text-amber-300' : 'text-emerald-400 font-medium'}>
                      {card.id === 'repair-journal' ? card.statsOrSummary : card.statusText}
                    </span>
                  </div>

                  {card.lastCheckText && (
                    <div className="text-[10px] text-slate-500 mt-0.5">{card.lastCheckText}</div>
                  )}
                  {card.id === 'network-config' && (
                    <div className="text-[10px] text-slate-400 mt-0.5">DNS, Winsock and TCP/IP nominal</div>
                  )}
                  {card.id === 'repair-journal' && (
                    <div className="text-[10px] text-slate-400 mt-0.5">{card.statusText}</div>
                  )}
                </div>
              </div>
            ))}
          </section>

          {/* =========================================================================
             MAIN MIDDLE REGION: 12 REPAIR TOOLS (LEFT) & GUIDED REPAIR/CONSOLE (RIGHT)
             ========================================================================= */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 min-h-0">
            
            {/* -----------------------------------------------------------------------
               LEFT: 12 REPAIR TOOLS DIRECTORY (5 cols in 12-col grid)
               ----------------------------------------------------------------------- */}
            <div className="lg:col-span-5 flex flex-col gap-2 min-h-0">
              <div className="flex items-center justify-between shrink-0">
                <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <span>Repair Tools</span>
                  <span className="text-xs text-slate-400 font-normal">({filteredTools.length})</span>
                </h2>
                <div className="flex items-center gap-1 text-[11px] text-slate-400">
                  <span>Category:</span>
                  <select
                    value={categoryFilter}
                    onChange={e => setCategoryFilter(e.target.value)}
                    className="bg-[#0b1329] border border-slate-800 rounded px-1.5 py-0.5 text-slate-300 focus:outline-none"
                  >
                    <option value="All">All</option>
                    <option value="Component Store">Component Store</option>
                    <option value="System Files">System Files</option>
                    <option value="Network Stack">Network Stack</option>
                    <option value="System Recovery">System Recovery</option>
                  </select>
                </div>
              </div>

              {/* 3x4 Grid of Repair Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 2xl:grid-cols-4 gap-2 overflow-y-auto min-h-0 flex-1 pr-1 repair-custom-scrollbar content-start">
                {filteredTools.map(tool => {
                  const isSelected = tool.id === selectedToolId;
                  return (
                    <div
                      key={tool.id}
                      onClick={() => setSelectedToolId(tool.id)}
                      className={`group p-2.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between min-h-[118px] ${
                        isSelected
                          ? 'repair-card-active'
                          : 'bg-[#081024]/70 border-slate-800/80 hover:border-slate-700 hover:bg-[#0b1633]'
                      }`}
                    >
                      <div>
                        {/* Tool Icon & Title */}
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className={`p-1.5 rounded-lg border ${
                            isSelected
                              ? 'bg-cyan-950/60 border-cyan-400/40 text-cyan-300'
                              : 'bg-slate-900/80 border-slate-800 text-blue-400'
                          }`}>
                            {renderToolIcon(tool.iconType, isSelected)}
                          </div>
                          <h3 className="font-semibold text-xs text-slate-100 line-clamp-2 leading-tight min-w-0 group-hover:text-cyan-300 transition-colors">
                            {tool.title}
                          </h3>
                        </div>

                        {/* Short Description */}
                        <p className="text-[10.5px] text-slate-400 line-clamp-2 leading-tight">
                          {tool.shortDescription}
                        </p>
                      </div>

                      {/* Footer: Status Dot + Preview Button */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-800/50 mt-2">
                        <div className="flex items-center gap-1.5 text-[10.5px]">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              tool.status === 'View Only' ? 'bg-slate-500' : 'bg-emerald-400'
                            }`}
                          ></span>
                          <span className={tool.status === 'View Only' ? 'text-slate-400' : 'text-emerald-400'}>
                            {tool.status}
                          </span>
                        </div>

                        <button
                          onClick={e => {
                            e.stopPropagation();
                            setSelectedToolId(tool.id);
                            setActiveServiceWorkspace(resolveRepairWorkspaceId(tool));
                          }}
                          className={`text-[10.5px] flex items-center gap-0.5 font-medium transition-colors ${
                            isSelected ? 'text-cyan-300 hover:text-white' : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <span>Preview</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* -----------------------------------------------------------------------
               RIGHT: GUIDED REPAIR STEPPER & PREVIEW PANELS (7 cols in 12-col grid)
               ----------------------------------------------------------------------- */}
            <div className="lg:col-span-7 flex flex-col gap-3 min-h-0">
              
              {/* Guided Repair Sequence Stepper */}
              <div className="shrink-0 p-3 [@media(max-height:880px)]:p-2.5 rounded-xl bg-[#081024]/90 border border-slate-800/90 shadow-sm">
                <div className="flex items-center justify-between mb-2.5">
                  <h3 className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    <span>Guided Repair Sequence</span>
                  </h3>
                  <span className="text-[10.5px] text-slate-400">Step {activeStepNumber} of 7 Selected</span>
                </div>

                <div className="flex items-center justify-between gap-1 overflow-x-auto pb-1">
                  {GUIDED_REPAIR_STEPS.map((step, idx) => {
                    const isStepActive = step.number === activeStepNumber;
                    const isGold = step.highlightColor === 'gold';
                    return (
                      <React.Fragment key={step.id}>
                        <button
                          onClick={() => setActiveStepNumber(step.number)}
                          className={`flex flex-col items-center min-w-[78px] text-center group cursor-pointer transition-all ${
                            isStepActive ? 'scale-105' : 'opacity-85 hover:opacity-100'
                          }`}
                        >
                          <div
                            className={`repair-step-circle w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                              isGold
                                ? 'bg-amber-500 text-black shadow-[0_0_12px_rgba(245,158,11,0.5)] ring-2 ring-amber-400/40'
                                : step.number === 1
                                ? 'bg-blue-600 text-white shadow-[0_0_10px_rgba(59,130,246,0.5)]'
                                : isStepActive
                                ? 'bg-cyan-500 text-black shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                                : 'bg-slate-800 border border-slate-700 text-slate-300'
                            }`}
                          >
                            {step.number}
                          </div>
                          <span className={`repair-step-title text-[11px] font-semibold mt-1 leading-tight ${
                            isGold ? 'text-amber-300' : isStepActive ? 'text-cyan-300' : 'text-slate-200'
                          }`}>
                            {step.title}
                          </span>
                          <span className="repair-step-subtitle text-[9.5px] text-slate-400 line-clamp-2 [@media(max-height:880px)]:line-clamp-1 leading-tight">
                            {step.subtitle}
                          </span>
                        </button>

                        {idx < GUIDED_REPAIR_STEPS.length - 1 && (
                          <div className={`step-connecting-line ${idx < activeStepNumber ? 'active' : ''}`} />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>

              {/* Split Center Row: Tool Dossier (Left) & Operation Preview Console (Right) */}
              <div className="grid grid-cols-1 md:grid-cols-2 grid-rows-1 gap-3 flex-1 min-h-0">
                
                {/* 1. Selected Tool Details Dossier */}
                <div className="p-3 rounded-xl bg-[#081024]/90 border border-slate-800/90 flex flex-col shadow-sm space-y-3 min-h-0 overflow-hidden">
                  <div className="flex-1 min-h-0 overflow-y-auto repair-custom-scrollbar pr-1 space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-blue-950/60 border border-blue-500/30 text-cyan-300">
                          {renderToolIcon(currentTool.iconType, true)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm text-slate-100">{currentTool.name}</h3>
                          <p className="text-[11px] text-slate-400">{currentTool.shortDescription}</p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-[10.5px] font-medium shrink-0 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        {currentTool.statusBadgeText}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed mb-3">
                      {currentTool.fullDescription}
                    </p>

                    {/* 4 Quadrants Matrix */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      
                      {/* What it does */}
                      <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
                        <h4 className="font-semibold text-slate-200 text-[11px] mb-1">What it does</h4>
                        <ul className="text-[10px] text-slate-300 space-y-1">
                          {currentTool.whatItDoes.map((item, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="text-cyan-400 shrink-0">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Privilege requirement */}
                      <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
                        <h4 className="font-semibold text-amber-300 text-[11px] mb-1 flex items-center gap-1">
                          <Shield className="w-3.5 h-3.5 text-amber-400" />
                          Privilege requirement
                        </h4>
                        <p className="text-[10.5px] font-medium text-slate-200">
                          {currentTool.privilegeRequirement.level}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {currentTool.privilegeRequirement.description}
                        </p>
                      </div>

                      {/* Prerequisites */}
                      <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
                        <h4 className="font-semibold text-slate-200 text-[11px] mb-1">Prerequisites</h4>
                        <ul className="text-[10px] text-slate-300 space-y-1">
                          {currentTool.prerequisites.map((p, i) => (
                            <li key={i} className="flex items-start gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                              <span className="text-slate-300">{p.text}</span>
                            </li>
                          ))}
                        </ul>
                        <p className="text-[9px] text-slate-500 mt-1 leading-tight">
                          Design checklist — not probed on this machine.
                        </p>
                      </div>

                      {/* Potential impact / risk */}
                      <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
                        <h4 className="font-semibold text-amber-300 text-[11px] mb-1 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                          Potential impact / risk
                        </h4>
                        <p className="text-[10.5px] font-medium text-amber-200">
                          {currentTool.riskAssessment.level}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {currentTool.riskAssessment.description}
                        </p>
                      </div>

                    </div>
                  </div>
                </div>

                {/* 2. Operation Preview Console — Not Executed */}
                <div className="p-3 rounded-xl bg-[#060b17] border border-amber-500/40 flex flex-col gap-1.5 shadow-sm min-h-0 overflow-hidden">
                    {/* Console Header */}
                    <div className="shrink-0 flex items-center justify-between gap-1.5 pb-2 border-b border-slate-800 text-xs">
                      <div className="flex items-center gap-1.5 text-amber-200 font-mono">
                        <Terminal className="w-4 h-4 text-amber-400" />
                        <span className="font-semibold text-[11px] [@media(max-height:880px)]:text-[10px] leading-tight">Operation Preview — Not Executed</span>
                      </div>
                      <button
                        onClick={handleCopyCommand}
                        className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[10.5px] transition-colors shrink-0 whitespace-nowrap"
                      >
                        <Copy className="w-3 h-3 text-cyan-300" />
                        <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>

                    {/* Elevated Command Box — always pinned, never scrolled out of view */}
                    <div className="shrink-0 space-y-1">
                      <span className="text-[10.5px] font-mono text-slate-400">Command preview (elevated)</span>
                      <div className="terminal-code-box p-2 text-cyan-300 text-[10.5px] [@media(max-height:880px)]:text-[9.5px] overflow-x-auto select-all">
                        {currentTool.command}
                      </div>
                    </div>

                    <div className="flex-1 min-h-0 overflow-y-auto repair-custom-scrollbar pr-1 space-y-1.5">
                      {/* Expected Output Box */}
                      <div className="space-y-1">
                        <span className="text-[10.5px] font-mono text-slate-400">Expected output (preview)</span>
                        <div className="terminal-code-box p-2 text-slate-300 text-[10.5px] max-h-16 overflow-y-auto whitespace-pre-wrap break-words font-mono">
                          {currentTool.expectedOutputPreview}
                        </div>
                      </div>

                      {/* Execution Stages */}
                      <div className="space-y-1">
                        <span className="text-[10.5px] font-mono text-slate-400">Execution stages</span>
                        <div className="grid grid-cols-1 gap-1 text-[10px] font-mono text-slate-300">
                          {currentTool.executionStages.map((stage, i) => (
                            <div key={i} className="flex items-center gap-1.5 truncate">
                              <span className="w-1.5 h-1.5 rounded-full border border-cyan-400 shrink-0"></span>
                              <span className="truncate">{stage}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                  {/* Administrator Warning Banner — always visible */}
                  <div className="shrink-0 p-2.5 [@media(max-height:880px)]:p-2 rounded-lg bg-amber-950/25 border border-amber-500/40 text-amber-200 text-xs flex items-start gap-2 warning-pulse-border">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div className="text-[11px] [@media(max-height:880px)]:text-[10px] leading-tight">
                      <span className="font-semibold text-amber-300">This operation requires administrator privileges.</span>
                      <p className="text-amber-200/80 mt-0.5">
                        You will be prompted for elevation before execution.
                      </p>
                    </div>
                  </div>
                </div>

              </div>

            </div>

          </section>

          {/* =========================================================================
             BOTTOM OPERATIONAL ROW: RECENT REPAIR HISTORY (LEFT) & ACTIONS (RIGHT)
             ========================================================================= */}
          <section className="shrink-0 grid grid-cols-1 lg:grid-cols-12 gap-3">
            
            {/* Left: Recent Repair History Panel (7 cols) */}
            <div className="lg:col-span-7 p-3 rounded-xl bg-[#081024]/90 border border-slate-800/90 shadow-sm flex flex-col justify-between min-h-[140px]">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 mb-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                    <Clock className="w-4 h-4 text-blue-400" />
                    <span>Recent Repair History</span>
                  </div>
                  <span className="text-[10.5px] text-slate-500">
                    {repairHistory.length === 0 ? 'Empty Session Ledger' : `${repairHistory.length} Recorded`}
                  </span>
                </div>

                {/* Table Header */}
                <div className="grid grid-cols-12 text-[10.5px] font-medium text-slate-400 px-2 py-1 bg-slate-900/60 rounded">
                  <div className="col-span-3">Date & Time</div>
                  <div className="col-span-3">Tool</div>
                  <div className="col-span-3">Result</div>
                  <div className="col-span-3">Details</div>
                </div>

                {/* Rows or Honest Empty State */}
                {repairHistory.length === 0 ? (
                  <div className="py-4 [@media(max-height:880px)]:py-2 flex flex-col items-center justify-center text-center text-slate-400">
                    <FileText className="w-6 h-6 text-slate-600 mb-1.5" />
                    <p className="text-xs font-semibold text-slate-300">No repair operations yet</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Design-preview simulations you record will appear here. Native repair execution requires the Phase Two connection.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-800/60 mt-1 max-h-24 overflow-y-auto text-xs">
                    {repairHistory.map(item => (
                      <div key={item.id} className="grid grid-cols-12 px-2 py-1.5 items-center text-[11px]">
                        <div className="col-span-3 text-slate-400 font-mono">{item.timestamp}</div>
                        <div className="col-span-3 text-slate-200 font-medium truncate">{item.toolName}</div>
                        <div
                          className={`col-span-3 flex items-center gap-1 ${
                            item.result === 'Simulated' ? 'text-cyan-300' : 'text-emerald-400'
                          }`}
                        >
                          {item.result === 'Simulated' ? (
                            <Info className="w-3 h-3 text-cyan-300 shrink-0" />
                          ) : (
                            <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                          )}
                          <span className="truncate">{item.result}</span>
                        </div>
                        <div className="col-span-3 text-slate-400 truncate">{item.details}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Actions Launcher & Execute Bar (5 cols) */}
            <div className="lg:col-span-5 p-3 rounded-xl bg-[#081024]/90 border border-slate-800/90 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200 pb-2 border-b border-slate-800/80 mb-2">
                  <Settings className="w-4 h-4 text-cyan-400" />
                  <span>Actions</span>
                </div>

                {/* 3 Quick Action Cards */}
                <div className="grid grid-cols-3 gap-2">
                  {/* Action 1: Review Repair (Highlighted in Screenshot) */}
                  <button
                    onClick={() => setActiveModal('review-repair')}
                    className="p-2.5 rounded-lg bg-gradient-to-br from-blue-700/60 to-purple-800/60 border border-cyan-400/40 text-left hover:border-cyan-300 transition-all flex flex-col justify-between shadow-md"
                  >
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                      <FileText className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
                      <span className="truncate">Review Repair</span>
                    </div>
                    <p className="text-[10px] text-cyan-100/80 line-clamp-2 [@media(max-height:880px)]:hidden mt-1">
                      See full details, impact and what to expect.
                    </p>
                  </button>

                  {/* Action 2: View Prerequisites */}
                  <button
                    onClick={() => setActiveModal('view-prerequisites')}
                    className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-left hover:border-slate-700 hover:bg-slate-800/50 transition-all flex flex-col justify-between"
                  >
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
                      <ListChecks className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="line-clamp-2 leading-tight">View Prerequisites</span>
                    </div>
                    <p className="text-[10px] text-slate-400 line-clamp-2 [@media(max-height:880px)]:hidden mt-1">
                      Check requirements and system readiness.
                    </p>
                  </button>

                  {/* Action 3: Export Diagnostic Notes */}
                  <button
                    onClick={() => setActiveModal('export-diagnostics')}
                    className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-left hover:border-slate-700 hover:bg-slate-800/50 transition-all flex flex-col justify-between"
                  >
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
                      <Download className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span className="truncate">Export Notes</span>
                    </div>
                    <p className="text-[10px] text-slate-400 line-clamp-2 [@media(max-height:880px)]:hidden mt-1">
                      Save details for support or later review.
                    </p>
                  </button>
                </div>
              </div>

              {/* Bottom Sticky Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2.5 border-t border-slate-800/80 mt-2.5">
                <button
                  onClick={() => {
                    setSelectedToolId('repair-component-scan');
                    setNotificationMsg('Selection reset');
                    setTimeout(() => setNotificationMsg(null), 1800);
                  }}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Cancel</span>
                </button>

                <button
                  onClick={() => setActiveModal('execute-repair')}
                  className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-medium flex items-center gap-1.5 shadow-lg shadow-blue-900/30 border border-blue-400/30 transition-all"
                >
                  <Shield className="w-3.5 h-3.5 text-cyan-200" />
                  <span>Review Execution (Admin Required)</span>
                </button>
              </div>

            </div>

          </section>

        </main>
      </div>

      {/* =========================================================================
         MODAL LAYER — design previews and the specialized repair workspace
         ========================================================================= */}

      {/* Review Repair — the full dossier for the selected tool */}
      <DesignPreviewModal
        open={activeModal === 'review-repair'}
        title={currentTool.title}
        subtitle={currentTool.name}
        worldLabel="Repair / Diagnostics"
        icon={<div className="w-8 h-8 rounded-lg bg-blue-950/60 border border-blue-500/40 flex items-center justify-center text-cyan-300 shrink-0"><FileText className="w-4 h-4" /></div>}
        isArabic={isArabic}
        cancelLabel={isArabic ? 'إغلاق' : 'Close'}
        onClose={() => setActiveModal(null)}
        fields={[
          { label: isArabic ? 'الأمر' : 'Command', value: currentTool.command, tone: 'cyan' },
          { label: isArabic ? 'الصلاحية' : 'Privilege', value: currentTool.privilegeRequirement.level, tone: 'amber' },
          { label: isArabic ? 'مستوى المخاطرة' : 'Risk', value: currentTool.riskAssessment.level, tone: currentTool.riskAssessment.isDestructive ? 'rose' : 'amber' },
          { label: isArabic ? 'المدة المقدّرة' : 'Duration', value: currentTool.durationEstimate, tone: 'muted' },
        ]}
        notice={
          isArabic
            ? 'هذه معاينة تصميمية. لم يتم تنفيذ أي أمر نظام ولا تم رفع أي أذونات.'
            : 'This is a design preview. No system command is executed and nothing is elevated.'
        }
      >
        <div className="space-y-3">
          <p className="text-[11.5px] text-slate-300 leading-relaxed">{currentTool.fullDescription}</p>

          <div className="rounded-xl bg-[#050e1f] border border-slate-800/80 p-3">
            <h4 className="font-semibold text-slate-200 text-[11px] mb-1.5">What it does</h4>
            <ul className="text-[10.5px] text-slate-300 space-y-1">
              {currentTool.whatItDoes.map((item, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-cyan-400 shrink-0">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl bg-[#050e1f] border border-slate-800/80 p-3">
            <h4 className="font-semibold text-slate-200 text-[11px] mb-1.5">Expected output (preview)</h4>
            <div className="terminal-code-box p-2 text-slate-300 text-[10px] max-h-32 overflow-y-auto whitespace-pre font-mono">
              {currentTool.expectedOutputPreview}
            </div>
          </div>
        </div>
      </DesignPreviewModal>

      {/* View Prerequisites — honest about what is and is not verified */}
      <DesignPreviewModal
        open={activeModal === 'view-prerequisites'}
        title={isArabic ? 'المتطلبات المسبقة' : 'Prerequisites'}
        subtitle={currentTool.name}
        worldLabel="Repair / Diagnostics"
        icon={<div className="w-8 h-8 rounded-lg bg-emerald-900/50 border border-emerald-500/50 flex items-center justify-center text-emerald-300 shrink-0"><ListChecks className="w-4 h-4" /></div>}
        isArabic={isArabic}
        cancelLabel={isArabic ? 'إغلاق' : 'Close'}
        onClose={() => setActiveModal(null)}
        fields={[
          { label: isArabic ? 'متطلب الصلاحية' : 'Privilege level', value: currentTool.privilegeRequirement.level, tone: 'amber' },
          {
            label: isArabic ? 'حالة التحقق' : 'Verification state',
            value: isArabic ? 'لم يتم التحقق (نموذج تصميم)' : 'Not verified (design fixture)',
            tone: 'rose',
          },
        ]}
        notice={
          isArabic
            ? 'قائمة المتطلبات أدناه هي نموذج تصميم مرجعي. لم يتم فحص نظامك، ولا يمكن تأكيد وجود المتطلبات فعليًا قبل المرحلة الثانية.'
            : 'The checklist below is a reference design fixture. Your machine has not been probed, so none of these requirements can be confirmed before Phase Two.'
        }
      >
        <ul className="space-y-1.5">
          {currentTool.prerequisites.map((p, i) => (
            <li
              key={i}
              className="flex items-start gap-2 p-2 rounded-lg bg-[#050e1f] border border-slate-800/80 text-[11px] text-slate-300"
            >
              <HelpCircle className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
              <span className="min-w-0 flex-1">{p.text}</span>
              <span className="px-1.5 py-0.5 rounded-full bg-slate-800/80 border border-slate-700 text-[9px] text-slate-400 shrink-0">
                {isArabic ? 'غير محقّق' : 'Unchecked'}
              </span>
            </li>
          ))}
        </ul>
      </DesignPreviewModal>

      {/* Export Diagnostic Notes — an honest, copyable draft (no fake file export) */}
      <DesignPreviewModal
        open={activeModal === 'export-diagnostics'}
        title={isArabic ? 'تصدير ملاحظات التشخيص' : 'Export Diagnostic Notes'}
        subtitle={currentTool.name}
        worldLabel="Repair / Diagnostics"
        icon={<div className="w-8 h-8 rounded-lg bg-blue-900/50 border border-blue-500/40 flex items-center justify-center text-cyan-300 shrink-0"><Download className="w-4 h-4" /></div>}
        isArabic={isArabic}
        cancelLabel={isArabic ? 'إغلاق' : 'Close'}
        confirmLabel={isArabic ? 'نسخ الملاحظات' : 'Copy Notes'}
        onConfirm={() => {
          const notes = buildDiagnosticNotes();
          if (navigator.clipboard?.writeText) {
            navigator.clipboard.writeText(notes).then(
              () => {
                setNotificationMsg('Diagnostic notes copied to clipboard (design preview).');
                setTimeout(() => setNotificationMsg(null), 3000);
              },
              () => {
                setNotificationMsg('Clipboard unavailable — select the text and copy manually.');
                setTimeout(() => setNotificationMsg(null), 3000);
              }
            );
          } else {
            setNotificationMsg('Clipboard unavailable — select the text and copy manually.');
            setTimeout(() => setNotificationMsg(null), 3000);
          }
        }}
        onClose={() => setActiveModal(null)}
        notice={
          isArabic
            ? 'لا يتم إنشاء ملفات على القرص في هذه المرحلة. زر النسخ ينسخ الملاحظات إلى الحافظة فقط.'
            : 'No file is written to disk in this phase. The copy action places the notes on the clipboard only.'
        }
      >
        <div className="rounded-xl bg-[#050e1f] border border-slate-800/80 p-3">
          <h4 className="font-semibold text-slate-200 text-[11px] mb-1.5">Notes draft</h4>
          <pre className="text-[10px] text-slate-300 whitespace-pre-wrap font-mono leading-relaxed max-h-52 overflow-y-auto">
            {buildDiagnosticNotes()}
          </pre>
        </div>
      </DesignPreviewModal>

      {/* Execution review — no native execution, simulation entry only */}
      <DesignPreviewModal
        open={activeModal === 'execute-repair'}
        title={isArabic ? 'مراجعة التنفيذ' : 'Review Execution'}
        subtitle={currentTool.name}
        worldLabel="Repair / Diagnostics"
        icon={<div className="w-8 h-8 rounded-lg bg-amber-900/50 border border-amber-500/50 flex items-center justify-center text-amber-300 shrink-0"><Shield className="w-4 h-4" /></div>}
        isArabic={isArabic}
        cancelLabel={isArabic ? 'إلغاء' : 'Cancel'}
        confirmLabel={isArabic ? 'تسجيل محاكاة (معاينة)' : 'Record Simulation (Preview)'}
        onConfirm={() => {
          handleAddHistory({
            id: Date.now().toString(),
            timestamp: new Date().toLocaleTimeString(),
            toolId: currentTool.id,
            toolName: currentTool.name,
            result: 'Simulated',
            details: 'Design-preview simulation recorded — no system command was executed.',
            elevated: false
          });
          setNotificationMsg(`Simulation recorded for ${currentTool.name} — no command executed.`);
          setTimeout(() => setNotificationMsg(null), 3500);
          setActiveModal(null);
        }}
        onClose={() => setActiveModal(null)}
        fields={[
          { label: isArabic ? 'الأمر' : 'Command', value: currentTool.command, tone: 'cyan' },
          { label: isArabic ? 'الصلاحية' : 'Privilege', value: currentTool.privilegeRequirement.level, tone: 'amber' },
          { label: isArabic ? 'المخاطرة' : 'Risk', value: currentTool.riskAssessment.level, tone: currentTool.riskAssessment.isDestructive ? 'rose' : 'amber' },
          { label: isArabic ? 'تنفيذ أصلي' : 'Native Execution', value: isArabic ? 'معطّل' : 'Disabled', tone: 'rose' },
        ]}
        notice={
          isArabic
            ? 'التنفيذ الأصلي غير متاح في مرحلة المعاينة. الإجراء المتاح فقط هو تسجيل محاكاة في سجل الجلسة.'
            : 'Native execution is unavailable during the preview phase. The only available action is recording a simulation in the session ledger.'
        }
      />

      {/* Specialized repair workspace (Preview button on each tool card) */}
      {activeServiceWorkspace && (
        <RepairWorkspaces
          serviceKey={activeServiceWorkspace}
          onClose={() => setActiveServiceWorkspace(null)}
          isArabic={isArabic}
        />
      )}

    </div>
  );
}
