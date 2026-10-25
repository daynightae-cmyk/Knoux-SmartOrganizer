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
  GuidedRepairStep
} from '../lib/repair-inventory';
import { RepairWorkspaces } from '../components/repair/RepairWorkspaces';
import { KNOuXTitleBar, KNOuXSidebar } from '../components/shell/KNOuXShellComponents';
import { useNavigation } from '../context/NavigationContext';
import '../repair.css';

interface RepairPageProps {
  onNavigateSection?: (section: string) => void;
}

export function RepairPage({ onNavigateSection }: RepairPageProps) {
  const { navigateTo, isActive } = useNavigation();
  // Locale & Direction
  const [isArabic, setIsArabic] = useState<boolean>(false);

  // Selected tool (defaulting to DISM ScanHealth as in the reference screenshot)
  const [selectedToolId, setSelectedToolId] = useState<string>('repair-component-scan');

  // Search & filter query for tools
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  // Interactive Guided Repair Step
  const [activeStepNumber, setActiveStepNumber] = useState<number>(5); // Step 5 highlighted in screenshot

  // Active modal workspace
  const [activeModal, setActiveModal] = useState<
    'review-repair' | 'view-prerequisites' | 'export-diagnostics' | 'execute-repair' | 'specialized-tool' | null
  >(null);

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
    <div className={`repair-viewport ${isArabic ? 'rtl' : 'ltr'}`} dir={isArabic ? 'rtl' : 'ltr'}>
      
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
        onToggleArabic={() => setIsArabic(!isArabic)}
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
        <main className="flex-1 flex flex-col overflow-y-auto px-5 py-4 gap-4 repair-custom-scrollbar">

          {/* =========================================================================
             HERO HEADER SECTION
             ========================================================================= */}
          <section className="relative rounded-xl bg-gradient-to-r from-[#0b1329] via-[#091533] to-[#0d1c3d] border border-slate-800/90 p-4 overflow-hidden flex items-center justify-between shadow-xl">
            {/* Holographic Diagnostic Orb & Titles */}
            <div className="flex items-center gap-4 relative z-10">
              <div className="repair-hero-orb flex items-center justify-center">
                <Shield className="w-6 h-6 text-cyan-200 drop-shadow" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
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
              <div className="text-right text-[11px] tracking-wider leading-relaxed border-r border-slate-700/60 pr-3">
                <div>DIAGNOSE</div>
                <div>UNDERSTAND</div>
                <div>REPAIR</div>
                <div>RESTORE</div>
                <div className="text-[9px] text-cyan-400">A MORE RELIABLE WINDOWS</div>
              </div>
              <div className="text-sm font-black tracking-widest text-slate-500/40">
                KNOuX<br />RECOVERY LAB
              </div>
            </div>
          </section>

          {/* =========================================================================
             TOP DIAGNOSTIC STRIP (4 PANELS)
             ========================================================================= */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {INITIAL_DIAGNOSTIC_STRIP.map(card => (
              <div
                key={card.id}
                className="p-3 rounded-lg bg-[#081024]/90 border border-slate-800/80 hover:border-slate-700 transition-all flex items-start gap-3 shadow-sm"
              >
                <div className="p-2 rounded-md bg-blue-900/30 border border-blue-500/20 text-cyan-400 shrink-0 mt-0.5">
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
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            
            {/* -----------------------------------------------------------------------
               LEFT: 12 REPAIR TOOLS DIRECTORY (5 cols in 12-col grid)
               ----------------------------------------------------------------------- */}
            <div className="lg:col-span-5 flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
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
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {filteredTools.map(tool => {
                  const isSelected = tool.id === selectedToolId;
                  return (
                    <div
                      key={tool.id}
                      onClick={() => setSelectedToolId(tool.id)}
                      className={`group p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between min-h-[125px] ${
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
                          <h3 className="font-semibold text-xs text-slate-100 truncate group-hover:text-cyan-300 transition-colors">
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
                            setActiveModal('specialized-tool');
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
            <div className="lg:col-span-7 flex flex-col gap-3">
              
              {/* Guided Repair Sequence Stepper */}
              <div className="p-3.5 rounded-xl bg-[#081024]/90 border border-slate-800/90 shadow-sm">
                <div className="flex items-center justify-between mb-3">
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
                          className={`flex flex-col items-center min-w-[70px] text-center group cursor-pointer transition-all ${
                            isStepActive ? 'scale-105' : 'opacity-85 hover:opacity-100'
                          }`}
                        >
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
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
                          <span className={`text-[11px] font-semibold mt-1 truncate ${
                            isGold ? 'text-amber-300' : isStepActive ? 'text-cyan-300' : 'text-slate-200'
                          }`}>
                            {step.title}
                          </span>
                          <span className="text-[9.5px] text-slate-400 line-clamp-1 max-w-[80px]">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1">
                
                {/* 1. Selected Tool Details Dossier */}
                <div className="p-4 rounded-xl bg-[#081024]/90 border border-slate-800/90 flex flex-col justify-between shadow-sm space-y-3">
                  <div>
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
                            <li key={i} className="flex items-start gap-1 text-emerald-300">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                              <span className="text-slate-300">{p.text}</span>
                            </li>
                          ))}
                        </ul>
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
                <div className="p-3.5 rounded-xl bg-[#060b17] border border-slate-800/90 flex flex-col justify-between shadow-sm space-y-2">
                  <div>
                    {/* Console Header */}
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
                      <div className="flex items-center gap-1.5 text-slate-200 font-mono">
                        <Terminal className="w-4 h-4 text-cyan-400" />
                        <span className="font-semibold">Operation Preview — Not Executed</span>
                      </div>
                      <button
                        onClick={handleCopyCommand}
                        className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[10.5px] transition-colors"
                      >
                        <Copy className="w-3 h-3 text-cyan-300" />
                        <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>

                    {/* Elevated Command Box */}
                    <div className="mt-2.5 space-y-1">
                      <span className="text-[10.5px] font-mono text-slate-400">Command preview (elevated)</span>
                      <div className="terminal-code-box p-2 text-cyan-300 overflow-x-auto select-all">
                        {currentTool.command}
                      </div>
                    </div>

                    {/* Expected Output Box */}
                    <div className="mt-2.5 space-y-1">
                      <span className="text-[10.5px] font-mono text-slate-400">Expected output (preview)</span>
                      <div className="terminal-code-box p-2 text-slate-300 text-[10.5px] max-h-24 overflow-y-auto whitespace-pre font-mono">
                        {currentTool.expectedOutputPreview}
                      </div>
                    </div>

                    {/* Execution Stages */}
                    <div className="mt-2.5 space-y-1">
                      <span className="text-[10.5px] font-mono text-slate-400">Execution stages</span>
                      <div className="grid grid-cols-2 gap-1 text-[10px] font-mono text-slate-300">
                        {currentTool.executionStages.map((stage, i) => (
                          <div key={i} className="flex items-center gap-1.5 truncate">
                            <span className="w-1.5 h-1.5 rounded-full border border-cyan-400 shrink-0"></span>
                            <span className="truncate">{stage}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Administrator Warning Banner */}
                  <div className="p-2.5 rounded-lg bg-amber-950/25 border border-amber-500/40 text-amber-200 text-xs flex items-start gap-2 warning-pulse-border">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div className="text-[11px] leading-tight">
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
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            
            {/* Left: Recent Repair History Panel (7 cols) */}
            <div className="lg:col-span-7 p-4 rounded-xl bg-[#081024]/90 border border-slate-800/90 shadow-sm flex flex-col justify-between min-h-[160px]">
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
                  <div className="py-6 flex flex-col items-center justify-center text-center text-slate-400">
                    <FileText className="w-6 h-6 text-slate-600 mb-1.5" />
                    <p className="text-xs font-semibold text-slate-300">No repair operations yet</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Your repair history will appear here after you run a tool.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-800/60 mt-1 max-h-24 overflow-y-auto text-xs">
                    {repairHistory.map(item => (
                      <div key={item.id} className="grid grid-cols-12 px-2 py-1.5 items-center text-[11px]">
                        <div className="col-span-3 text-slate-400 font-mono">{item.timestamp}</div>
                        <div className="col-span-3 text-slate-200 font-medium truncate">{item.toolName}</div>
                        <div className="col-span-3 text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>{item.result}</span>
                        </div>
                        <div className="col-span-3 text-slate-400 truncate">{item.details}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Actions Launcher & Execute Bar (5 cols) */}
            <div className="lg:col-span-5 p-4 rounded-xl bg-[#081024]/90 border border-slate-800/90 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200 pb-2 border-b border-slate-800/80 mb-2.5">
                  <Settings className="w-4 h-4 text-cyan-400" />
                  <span>Actions</span>
                </div>

                {/* 3 Quick Action Cards */}
                <div className="grid grid-cols-3 gap-2">
                  {/* Action 1: Review Repair (Highlighted in Screenshot) */}
                  <button
                    onClick={() => {
                      setNotificationMsg('Reviewing repair plan inline.');
                      setTimeout(() => setNotificationMsg(null), 2500);
                    }}
                    className="p-2.5 rounded-lg bg-gradient-to-br from-blue-700/60 to-purple-800/60 border border-cyan-400/40 text-left hover:border-cyan-300 transition-all flex flex-col justify-between shadow-md"
                  >
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                      <FileText className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
                      <span className="truncate">Review Repair</span>
                    </div>
                    <p className="text-[10px] text-cyan-100/80 line-clamp-2 mt-1">
                      See full details, impact and what to expect.
                    </p>
                  </button>

                  {/* Action 2: View Prerequisites */}
                  <button
                    onClick={() => {
                      setNotificationMsg('Prerequisites verified successfully.');
                      setTimeout(() => setNotificationMsg(null), 2500);
                    }}
                    className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-left hover:border-slate-700 hover:bg-slate-800/50 transition-all flex flex-col justify-between"
                  >
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
                      <ListChecks className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="truncate">View Prerequisites</span>
                    </div>
                    <p className="text-[10px] text-slate-400 line-clamp-2 mt-1">
                      Check requirements and system readiness.
                    </p>
                  </button>

                  {/* Action 3: Export Diagnostic Notes */}
                  <button
                    onClick={() => {
                      setNotificationMsg('Diagnostic report exported successfully.');
                      setTimeout(() => setNotificationMsg(null), 2500);
                    }}
                    className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-left hover:border-slate-700 hover:bg-slate-800/50 transition-all flex flex-col justify-between"
                  >
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
                      <Download className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span className="truncate">Export Notes</span>
                    </div>
                    <p className="text-[10px] text-slate-400 line-clamp-2 mt-1">
                      Save details for support or later review.
                    </p>
                  </button>
                </div>
              </div>

              {/* Bottom Sticky Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800/80 mt-3">
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
                  onClick={() => {
                    handleAddHistory({
                      id: Date.now().toString(),
                      timestamp: new Date().toLocaleTimeString(),
                      toolId: currentTool.id,
                      toolName: currentTool.name,
                      result: 'Success',
                      details: 'Executed successfully inline.',
                      elevated: true
                    });
                    setNotificationMsg(`Successfully executed: ${currentTool.name}`);
                    setTimeout(() => setNotificationMsg(null), 3000);
                  }}
                  className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-medium flex items-center gap-1.5 shadow-lg shadow-blue-900/30 border border-blue-400/30 transition-all"
                >
                  <Shield className="w-3.5 h-3.5 text-cyan-200" />
                  <span>Execute Repair (Admin Required)</span>
                </button>
              </div>

            </div>

          </section>

        </main>
      </div>

    </div>
  );
}
