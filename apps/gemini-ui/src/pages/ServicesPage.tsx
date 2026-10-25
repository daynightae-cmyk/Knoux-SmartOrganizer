/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Cog,
  Search,
  Minus,
  Square,
  X,
  Languages,
  Database,
  Play,
  PlayCircle,
  Square as StopSquare,
  Slash,
  Shield,
  ShieldAlert,
  ShieldCheck,
  RotateCcw,
  Clock,
  Layers,
  FileText,
  Activity,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  Terminal,
  Settings,
  HelpCircle,
  Folder,
  Sliders,
  HardDrive,
  Calendar,
  Lock,
  List,
  Check,
  Eye,
  BarChart2,
  Home,
  Zap,
  ArrowRight
} from 'lucide-react';

import {
  SERVICE_COMMANDER_METRICS,
  SERVICE_NAVIGATION_CARDS,
  INITIAL_SERVICES_REGISTER,
  INITIAL_ACTIVITY_LOGS,
  INITIAL_DEPENDENCY_GRAPH_NODES,
  WindowsServiceItem,
  RecentServiceActivityRecord,
  StartupType,
  ServiceStatus,
  DependencyGraphNode
} from '../lib/services-inventory';
import { ServicesWorkspaces } from '../components/services/ServicesWorkspaces';
import { DesignPreviewModal } from '../components/common/DesignPreviewModal';
import { KNOuXTitleBar, KNOuXSidebar } from '../components/shell/KNOuXShellComponents';
import { useNavigation } from '../context/NavigationContext';
import '../services.css';

interface ServicesPageProps {
  onNavigateSection?: (section: string) => void;
}

export function ServicesPage({ onNavigateSection }: ServicesPageProps) {
  const { navigateTo, isActive, isArabic, toggleLocale } = useNavigation();
  // Selected service (defaulting to WinDefend as shown in reference screenshot)
  const [selectedServiceName, setSelectedServiceName] = useState<string>('WinDefend');

  // Filter state
  const [activeFilterKey, setActiveFilterKey] = useState<
    'all' | 'running' | 'stopped' | 'automatic' | 'manual' | 'disabled' | 'protected'
  >('all');

  // Search filter
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Live state of services register
  const [servicesList, setServicesList] = useState<WindowsServiceItem[]>(INITIAL_SERVICES_REGISTER);

  // Recent activity logs
  const [activityLogs, setActivityLogs] = useState<RecentServiceActivityRecord[]>(INITIAL_ACTIVITY_LOGS);

  // Active modal
  const [activeModal, setActiveModal] = useState<
    'review-change' | 'change-startup-type' | 'specialized-card' | 'activity-view-all' | null
  >(null);
  const [activeCardKey, setActiveCardKey] = useState<string | null>(null);
  const [activeServiceWorkspace, setActiveServiceWorkspace] = useState<string | null>(null);
  const [startupTypeDraft, setStartupTypeDraft] = useState<StartupType | null>(null);

  // Proposed operation for the selected service
  const [proposedAction, setProposedAction] = useState<{
    type: 'Start' | 'Stop' | 'Restart' | 'ChangeStartup';
    newStatus?: ServiceStatus;
    newStartupType?: StartupType;
  } | null>({
    type: 'Stop',
    newStatus: 'Stopped',
    newStartupType: 'Manual'
  });

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Find currently selected service
  const currentService = useMemo(() => {
    return (
      servicesList.find(s => s.name === selectedServiceName) ||
      servicesList.find(s => s.name === 'WinDefend') ||
      servicesList[0]
    );
  }, [servicesList, selectedServiceName]);

  // Filtered services
  const filteredServices = useMemo(() => {
    return servicesList.filter(s => {
      // Filter tab
      if (activeFilterKey === 'running' && s.status !== 'Running') return false;
      if (activeFilterKey === 'stopped' && s.status !== 'Stopped') return false;
      if (activeFilterKey === 'automatic' && !s.startupType.startsWith('Automatic')) return false;
      if (activeFilterKey === 'manual' && s.startupType !== 'Manual') return false;
      if (activeFilterKey === 'disabled' && s.startupType !== 'Disabled') return false;
      if (activeFilterKey === 'protected' && !s.isProtected) return false;

      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = s.name.toLowerCase().includes(q);
        const matchesDisplay = s.displayName.toLowerCase().includes(q);
        const matchesDesc = s.description.toLowerCase().includes(q);
        return matchesName || matchesDisplay || matchesDesc;
      }
      return true;
    });
  }, [servicesList, activeFilterKey, searchQuery]);

  // Dependency graph nodes for the selected service
  const dependencyNodes = useMemo(() => {
    if (INITIAL_DEPENDENCY_GRAPH_NODES[currentService.name]) {
      return INITIAL_DEPENDENCY_GRAPH_NODES[currentService.name];
    }
    // Dynamic fallback for any service
    const nodes: DependencyGraphNode[] = [
      { id: currentService.name, name: currentService.name, role: 'selected', status: currentService.status }
    ];
    currentService.dependencies.forEach(dep => {
      nodes.push({ id: dep, name: dep, role: 'dependency', status: 'Running' });
    });
    currentService.dependents.forEach(dep => {
      nodes.push({ id: dep, name: dep, role: 'dependent', status: 'Running' });
    });
    return nodes;
  }, [currentService]);

  const handleApplyChange = (
    updated: Partial<WindowsServiceItem>,
    newActivityLog: RecentServiceActivityRecord
  ) => {
    setServicesList(prev =>
      prev.map(item => (item.name === currentService.name ? { ...item, ...updated } : item))
    );
    setActivityLogs(prev => [newActivityLog, ...prev]);
    setToastMessage(`Updated ${currentService.name}: ${newActivityLog.details}`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSelectCard = (card: typeof SERVICE_NAVIGATION_CARDS[0]) => {
    setActiveCardKey(card.title);
    setActiveModal('specialized-card');
    setActiveServiceWorkspace(card.serviceKey);
  };

  const handleQuickAction = (
    serviceItem: WindowsServiceItem,
    action: 'Start' | 'Stop' | 'Restart',
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    setSelectedServiceName(serviceItem.name);
    if (action === 'Start') {
      setProposedAction({ type: 'Start', newStatus: 'Running' });
    } else if (action === 'Stop') {
      setProposedAction({ type: 'Stop', newStatus: 'Stopped' });
    } else if (action === 'Restart') {
      setProposedAction({ type: 'Restart', newStatus: 'Running' });
    }
    setActiveModal('review-change');
  };

  return (
    <div className={`services-viewport ${isArabic ? 'rtl' : 'ltr'} h-screen overflow-hidden`} dir={isArabic ? 'rtl' : 'ltr'}>
      
      {/* =========================================================================
         TOP CHROME TITLEBAR
         ========================================================================= */}
      <KNOuXTitleBar
        sectionName={isArabic ? "خدمات ويندوز" : "Services"}
        sectionSubtitle={isArabic ? "مركز تحكم الخدمات" : "Windows Services Commander"}
        onNavigateHome={() => (onNavigateSection ? onNavigateSection("home") : navigateTo("home"))}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder={isArabic ? "البحث في خدمات ويندوز... (Ctrl+K)" : "Search Windows services... (Ctrl+K)"}
        isArabic={isArabic}
        onToggleArabic={toggleLocale}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-12 right-6 z-50 px-3.5 py-1.5 rounded-lg bg-cyan-950/90 border border-cyan-400/40 text-cyan-200 text-xs shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
          {toastMessage}
        </div>
      )}

      {/* =========================================================================
         MAIN APPLICATION LAYOUT (SIDEBAR + CONTENT)
         ========================================================================= */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Navigation Sidebar */}
        <KNOuXSidebar
          activeSection="services"
          onNavigate={(sec) => (onNavigateSection ? onNavigateSection(sec) : navigateTo(sec))}
          isArabic={isArabic}
        />

        {/* Content Viewport */}
        <main className="flex-1 flex flex-col min-h-0 overflow-y-auto px-5 py-2.5 gap-2.5 services-custom-scrollbar">

          {/* =========================================================================
             HERO HEADER SECTION
             ========================================================================= */}
          <section className="relative rounded-xl bg-gradient-to-r from-[#0b1329] via-[#091533] to-[#0d1c3d] border border-slate-800/90 p-3 overflow-hidden flex items-center justify-between shadow-xl">
            {/* Holographic Glowing Gear & Titles */}
            <div className="flex items-center gap-3.5 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600/40 via-indigo-600/40 to-cyan-500/30 border border-purple-500/40 flex items-center justify-center text-cyan-300 shadow-[0_0_20px_rgba(168,85,247,0.35)] shrink-0">
                <Cog className="w-5 h-5 animate-spin [animation-duration:15s]" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-100">
                  Service Commander
                </h1>
                <p className="text-xs text-slate-300/90 mt-0.5">
                  {isArabic
                    ? 'فحص خدمات ويندوز، الاعتماديات، سياسات بدء التشغيل، والإجراءات الخاضعة للرقابة.'
                    : 'Inspect Windows services, dependencies, startup policies and controlled actions.'}
                </p>
              </div>
            </div>

            {/* Right: Technical Circuit Watermark */}
            <div className="services-circuit-watermark hidden lg:flex items-center gap-4 text-slate-400">
              <div className="text-right text-[11px] tracking-wider leading-relaxed border-r border-slate-700/60 pr-3">
                <div>SERVICES</div>
                <div>STABILITY</div>
                <div>CONTROL</div>
                <div>VISIBILITY</div>
              </div>
            </div>
          </section>

          {/* =========================================================================
             TOP STATUS RIBBON (6 METRICS CARDS)
             ========================================================================= */}
          <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {SERVICE_COMMANDER_METRICS.map(card => {
              const isSelected = activeFilterKey === card.filterKey;
              return (
                <button
                  key={card.id}
                  onClick={() => setActiveFilterKey(card.filterKey)}
                  className={`p-2 rounded-lg border text-left transition-all flex items-center gap-3 ${
                    isSelected
                      ? 'bg-[#0e1d3d] border-cyan-400/80 shadow-[0_0_14px_rgba(56,189,248,0.25)]'
                      : 'bg-[#081024]/80 border-slate-800/80 hover:border-slate-700 hover:bg-[#0b1633]'
                  }`}
                >
                  <div className="p-1.5 rounded-lg bg-slate-900/90 border border-slate-800 shrink-0">
                    {card.icon === 'database' && <Database className="w-4 h-4 text-blue-400" />}
                    {card.icon === 'play' && <PlayCircle className="w-4 h-4 text-emerald-400" />}
                    {card.icon === 'stop' && <StopSquare className="w-4 h-4 text-slate-400" />}
                    {card.icon === 'gear' && <Cog className="w-4 h-4 text-cyan-400" />}
                    {card.icon === 'file' && <FileText className="w-4 h-4 text-indigo-400" />}
                    {card.icon === 'slash' && <Slash className="w-4 h-4 text-rose-400" />}
                  </div>
                  <div>
                    <span className="text-[10.5px] text-slate-400 block truncate">{card.title}</span>
                    <span className="text-[17px] font-bold text-slate-100 font-mono leading-none mt-0.5 block">
                      {card.count}
                    </span>
                  </div>
                </button>
              );
            })}
          </section>

          {/* =========================================================================
             MAIN MIDDLE REGION: SERVICE REGISTER & MATRIX (LEFT) + INSPECTOR (RIGHT)
             ========================================================================= */}
          <section className="grid grid-cols-1 lg:grid-cols-12 grid-rows-1 gap-2.5 flex-1 min-h-0">

            {/* -----------------------------------------------------------------------
               LEFT: SEGMENTED FILTERS, REGISTER TABLE, 12 CARDS & HISTORY (7.5 cols)
               ----------------------------------------------------------------------- */}
            <div className="lg:col-span-8 flex flex-col gap-2.5 min-h-0">

              {/* Segmented Filter Tabs Bar */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-xs shrink-0">
                <button
                  onClick={() => setActiveFilterKey('all')}
                  className={`px-3 py-1 rounded-lg border font-medium flex items-center gap-1.5 transition-all ${
                    activeFilterKey === 'all'
                      ? 'bg-blue-600 text-white border-blue-400 shadow-sm'
                      : 'bg-[#081024] text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>All (271)</span>
                </button>

                <button
                  onClick={() => setActiveFilterKey('running')}
                  className={`px-3 py-1 rounded-lg border font-medium flex items-center gap-1.5 transition-all ${
                    activeFilterKey === 'running'
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500 shadow-sm'
                      : 'bg-[#081024] text-slate-400 border-slate-800 hover:text-emerald-400'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span>Running (189)</span>
                </button>

                <button
                  onClick={() => setActiveFilterKey('stopped')}
                  className={`px-3 py-1 rounded-lg border font-medium flex items-center gap-1.5 transition-all ${
                    activeFilterKey === 'stopped'
                      ? 'bg-slate-800 text-slate-200 border-slate-600 shadow-sm'
                      : 'bg-[#081024] text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                  <span>Stopped (82)</span>
                </button>

                <button
                  onClick={() => setActiveFilterKey('automatic')}
                  className={`px-3 py-1 rounded-lg border font-medium flex items-center gap-1.5 transition-all ${
                    activeFilterKey === 'automatic'
                      ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500 shadow-sm'
                      : 'bg-[#081024] text-slate-400 border-slate-800 hover:text-cyan-400'
                  }`}
                >
                  <Cog className="w-3 h-3" />
                  <span>Automatic (122)</span>
                </button>

                <button
                  onClick={() => setActiveFilterKey('manual')}
                  className={`px-3 py-1 rounded-lg border font-medium flex items-center gap-1.5 transition-all ${
                    activeFilterKey === 'manual'
                      ? 'bg-indigo-950/80 text-indigo-300 border-indigo-500 shadow-sm'
                      : 'bg-[#081024] text-slate-400 border-slate-800 hover:text-indigo-400'
                  }`}
                >
                  <FileText className="w-3 h-3" />
                  <span>Manual (98)</span>
                </button>

                <button
                  onClick={() => setActiveFilterKey('disabled')}
                  className={`px-3 py-1 rounded-lg border font-medium flex items-center gap-1.5 transition-all ${
                    activeFilterKey === 'disabled'
                      ? 'bg-rose-950/80 text-rose-300 border-rose-500 shadow-sm'
                      : 'bg-[#081024] text-slate-400 border-slate-800 hover:text-rose-400'
                  }`}
                >
                  <Slash className="w-3 h-3" />
                  <span>Disabled (51)</span>
                </button>

                <button
                  onClick={() => setActiveFilterKey('protected')}
                  className={`px-3 py-1 rounded-lg border font-medium flex items-center gap-1.5 transition-all ${
                    activeFilterKey === 'protected'
                      ? 'bg-amber-950/80 text-amber-300 border-amber-500 shadow-sm'
                      : 'bg-[#081024] text-slate-400 border-slate-800 hover:text-amber-400'
                  }`}
                >
                  <Shield className="w-3 h-3 text-amber-400" />
                  <span>Protected (28)</span>
                </button>
              </div>

              {/* Native Service Register Table */}
              <div className="rounded-xl bg-[#081024]/90 border border-slate-800/90 shadow-sm overflow-hidden flex flex-col flex-1 min-h-[96px]">
                <div className="overflow-auto flex-1 min-h-0 services-custom-scrollbar">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#0b142b] border-b border-slate-800/80 sticky top-0 z-10 text-[11px] text-slate-400">
                      <tr>
                        <th className="py-1.5 px-3 font-semibold">Service Name</th>
                        <th className="py-1.5 px-3 font-semibold">Display Name</th>
                        <th className="py-1.5 px-3 font-semibold">Current Status</th>
                        <th className="py-1.5 px-3 font-semibold">Startup Type</th>
                        <th className="py-1.5 px-3 font-semibold">Account</th>
                        <th className="py-1.5 px-3 font-semibold">Dependencies</th>
                        <th className="py-1.5 px-3 font-semibold text-right">Available Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {filteredServices.map(service => {
                        const isSelected = service.name === currentService.name;
                        return (
                          <tr
                            key={service.name}
                            onClick={() => setSelectedServiceName(service.name)}
                            className={`cursor-pointer transition-all ${
                              isSelected
                                ? 'service-row-active'
                                : 'hover:bg-slate-800/40 text-slate-300'
                            }`}
                          >
                            {/* Service Name */}
                            <td className="py-1.5 px-3 font-mono text-[11.5px] text-slate-100 flex items-center gap-2">
                              <Cog className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-cyan-300' : 'text-slate-500'}`} />
                              <span className="font-semibold">{service.name}</span>
                            </td>

                            {/* Display Name */}
                            <td className="py-1.5 px-3 text-slate-300 truncate max-w-[150px]">
                              {service.displayName}
                            </td>

                            {/* Current Status */}
                            <td className="py-1.5 px-3">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    service.status === 'Running' ? 'bg-emerald-400' : 'bg-slate-500'
                                  }`}
                                />
                                <span
                                  className={
                                    service.status === 'Running' ? 'text-emerald-400 font-medium' : 'text-slate-400'
                                  }
                                >
                                  {service.status}
                                </span>
                              </div>
                            </td>

                            {/* Startup Type */}
                            <td className="py-1.5 px-3 text-slate-300 text-[11px]">
                              {service.startupType}
                            </td>

                            {/* Account */}
                            <td className="py-1.5 px-3 text-slate-400 text-[11px]">
                              {service.account}
                            </td>

                            {/* Dependencies */}
                            <td className="py-1.5 px-3 text-slate-400 font-mono text-[10.5px]">
                              {service.dependencies.length > 0 ? service.dependencies.join(', ') : 'N/A'}
                            </td>

                            {/* Available Actions Buttons */}
                            <td className="py-1.5 px-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                {service.status === 'Running' ? (
                                  <button
                                    onClick={e => handleQuickAction(service, 'Stop', e)}
                                    title="Stop Service"
                                    className="p-1 rounded bg-slate-800/80 hover:bg-rose-900/50 hover:text-rose-300 text-slate-400 transition-colors"
                                  >
                                    <StopSquare className="w-3 h-3" />
                                  </button>
                                ) : (
                                  <button
                                    onClick={e => handleQuickAction(service, 'Start', e)}
                                    title="Start Service"
                                    className="p-1 rounded bg-slate-800/80 hover:bg-emerald-900/50 hover:text-emerald-300 text-slate-400 transition-colors"
                                  >
                                    <Play className="w-3 h-3" />
                                  </button>
                                )}

                                <button
                                  onClick={e => handleQuickAction(service, 'Restart', e)}
                                  title="Restart Service"
                                  className="p-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
                                >
                                  <RotateCcw className="w-3 h-3" />
                                </button>

                                {service.isProtected ? (
                                  <button
                                    onClick={e => {
                                      e.stopPropagation();
                                      setSelectedServiceName(service.name);
                                      setActiveCardKey('Protected Services');
                                      setActiveModal('specialized-card');
                                    }}
                                    title="Protected Service"
                                    className="p-1 rounded bg-amber-950/60 border border-amber-600/40 text-amber-300"
                                  >
                                    <Shield className="w-3 h-3" />
                                  </button>
                                ) : (
                                  <button
                                    onClick={e => {
                                      e.stopPropagation();
                                      setSelectedServiceName(service.name);
                                      setActiveModal('change-startup-type');
                                    }}
                                    title="Configure Startup Policy"
                                    className="p-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
                                  >
                                    <Settings className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Twelve Service Navigation Cards (4 cols × 3 rows) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 shrink-0">
                {SERVICE_NAVIGATION_CARDS.map(card => (
                  <button
                    key={card.id}
                    onClick={() => handleSelectCard(card)}
                    className="p-1.5 rounded-lg bg-[#081024]/85 border border-slate-800/80 hover:border-slate-700 hover:bg-[#0b1633] text-left transition-all flex flex-col justify-between min-h-[46px] group"
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-1.5">
                        <div className="p-1 rounded bg-slate-900 border border-slate-800 text-cyan-400">
                          {card.iconType === 'register' && <List className="w-3 h-3" />}
                          {card.iconType === 'control' && <Play className="w-3 h-3 text-emerald-400" />}
                          {card.iconType === 'undo' && <RotateCcw className="w-3 h-3 text-purple-400" />}
                          {card.iconType === 'dependencies' && <Layers className="w-3 h-3 text-blue-400" />}
                          {card.iconType === 'protected' && <Shield className="w-3 h-3 text-amber-400" />}
                          {card.iconType === 'search' && <Search className="w-3 h-3 text-cyan-400" />}
                          {card.iconType === 'startup-report' && <FileText className="w-3 h-3 text-indigo-400" />}
                          {card.iconType === 'state-history' && <Clock className="w-3 h-3 text-slate-400" />}
                          {card.iconType === 'dependents' && <Layers className="w-3 h-3 text-pink-400" />}
                          {card.iconType === 'diagnose' && <Activity className="w-3 h-3 text-rose-400" />}
                          {card.iconType === 'config' && <Cog className="w-3 h-3 text-cyan-400" />}
                          {card.iconType === 'perf' && <BarChart2 className="w-3 h-3 text-emerald-400" />}
                        </div>
                        <span className="font-semibold text-slate-100 text-[11px] truncate group-hover:text-cyan-300">
                          {card.title}
                        </span>
                      </div>
                      <ChevronRight className="w-3 h-3 text-slate-500 group-hover:text-slate-300" />
                    </div>
                    <p className="text-[10px] text-slate-400 line-clamp-1 mt-1 leading-tight">
                      {card.subtitle}
                    </p>
                  </button>
                ))}
              </div>

              {/* Bottom: Recent Service Activity */}
              <div className="p-3 rounded-xl bg-[#081024]/90 border border-slate-800/90 shadow-sm flex flex-col justify-between shrink-0">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/80 mb-1.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                    <Clock className="w-3.5 h-3.5 text-blue-400" />
                    <span>Recent Service Activity</span>
                  </div>
                  <button
                    onClick={() => setActiveModal('activity-view-all')}
                    className="text-[10.5px] text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
                  >
                    View All
                  </button>
                </div>

                <div className="overflow-x-auto overflow-y-auto services-custom-scrollbar">
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 bg-[#081024] z-10">
                      <tr className="text-[10.5px] text-slate-400 border-b border-slate-800/60 pb-1">
                        <th className="py-1 px-2 font-medium">Timestamp</th>
                        <th className="py-1 px-2 font-medium">Service Name</th>
                        <th className="py-1 px-2 font-medium">Action</th>
                        <th className="py-1 px-2 font-medium">Previous State</th>
                        <th className="py-1 px-2 font-medium">New State</th>
                        <th className="py-1 px-2 font-medium">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40 text-[11px]">
                      {activityLogs.slice(0, 5).map((log, idx) => (
                        <tr
                          key={log.id}
                          className={`text-slate-300 hover:bg-slate-900/40 ${
                            idx === 3 ? 'services-activity-row-4' : idx === 4 ? 'services-activity-row-5' : ''
                          }`}
                        >
                          <td className="py-1 px-2 font-mono text-slate-400 whitespace-nowrap">{log.timestamp}</td>
                          <td className="py-1 px-2 font-semibold text-slate-200 whitespace-nowrap">{log.serviceName}</td>
                          <td className="py-1 px-2">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-medium whitespace-nowrap ${
                                log.action === 'Started'
                                  ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                                  : log.action === 'Stopped'
                                  ? 'bg-rose-950/60 text-rose-400 border border-rose-800/40'
                                  : 'bg-cyan-950/60 text-cyan-300 border border-cyan-800/40'
                              }`}
                            >
                              {log.action}
                            </span>
                          </td>
                          <td className="py-1 px-2 text-slate-400 whitespace-nowrap">{log.previousState}</td>
                          <td className="py-1 px-2 text-slate-200 whitespace-nowrap">{log.newState}</td>
                          <td className="py-1 px-2 text-slate-400 truncate max-w-[150px]">{log.details}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* -----------------------------------------------------------------------
               RIGHT: INSPECTOR COLUMN (SERVICE DOSSIER, GRAPH & OPERATION PREVIEW) (4 cols)
               ----------------------------------------------------------------------- */}
            <div className="lg:col-span-4 flex flex-col gap-2.5 min-h-0 overflow-hidden">

              {/* Search Services (name or display name) */}
              <div className="relative shrink-0">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search services (name or display name)..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-[#081024] border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
                />
              </div>

              {/* Service Dossier */}
              <div className="p-3 rounded-xl bg-[#081024]/90 border border-slate-800/90 shadow-sm flex flex-col flex-1 min-h-[88px] overflow-hidden">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/80 shrink-0">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-purple-400" />
                    <h3 className="font-semibold text-xs text-slate-100">Service Dossier</h3>
                  </div>
                  {currentService.isProtected && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-950/60 border border-amber-500/40 text-amber-300 text-[10px] font-semibold flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      Protected Service
                    </span>
                  )}
                </div>

                {/* Metadata List */}
                <div className="flex-1 min-h-0 overflow-y-auto services-custom-scrollbar grid grid-cols-1 2xl:grid-cols-2 gap-x-4 gap-y-0.5 text-[11px] pr-1 mt-1.5">
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-slate-400 text-[11px] shrink-0">Service Name:</span>
                    <span className="font-mono text-slate-200 font-semibold truncate">{currentService.name}</span>
                  </div>

                  <div className="flex justify-between items-center gap-2">
                    <span className="text-slate-400 text-[11px] shrink-0">Display Name:</span>
                    <span className="text-slate-200 font-medium truncate" title={currentService.displayName}>
                      {currentService.displayName}
                    </span>
                  </div>

                  <div className="flex justify-between items-center gap-2">
                    <span className="text-slate-400 text-[11px] shrink-0">Current Status:</span>
                    <span className="flex items-center gap-1.5 font-medium">
                      <span className={`w-2 h-2 rounded-full ${currentService.status === 'Running' ? 'bg-emerald-400' : 'bg-slate-400'}`} />
                      <span className={currentService.status === 'Running' ? 'text-emerald-400' : 'text-slate-400'}>
                        {currentService.status}
                      </span>
                    </span>
                  </div>

                  <div className="flex justify-between items-center gap-2">
                    <span className="text-slate-400 text-[11px] shrink-0">Startup Type:</span>
                    <span className="text-slate-200 font-semibold">{currentService.startupType}</span>
                  </div>

                  <div className="col-span-full pt-0.5">
                    <span className="text-slate-400 text-[11px] block mb-0.5">Executable Path:</span>
                    <div className="p-1.5 rounded bg-black/50 border border-slate-800 text-[10.5px] font-mono text-cyan-300 break-all select-all">
                      {currentService.executablePath}
                    </div>
                  </div>

                  <div className="flex justify-between items-center gap-2">
                    <span className="text-slate-400 text-[11px] shrink-0">Dependencies:</span>
                    <span className="text-slate-200 font-mono text-[11px] truncate">
                      {currentService.dependencies.length > 0 ? currentService.dependencies.join(', ') : 'None'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center gap-2">
                    <span className="text-slate-400 text-[11px] shrink-0">Dependents:</span>
                    <span className="text-slate-200 font-mono text-[11px] truncate">
                      {currentService.dependents.length > 0 ? currentService.dependents.join(', ') : 'None'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center gap-2">
                    <span className="text-slate-400 text-[11px] shrink-0">Service Account:</span>
                    <span className="text-slate-200 truncate">{currentService.account}</span>
                  </div>

                  <div className="flex justify-between items-center gap-2">
                    <span className="text-slate-400 text-[11px] shrink-0">Management Rights:</span>
                    <span className="text-slate-200 truncate">{currentService.managementRights}</span>
                  </div>

                  {currentService.protectionRestrictions && (
                    <div className="col-span-full flex justify-between items-center gap-2 pt-0.5 border-t border-slate-800/60">
                      <span className="text-slate-400 text-[11px] shrink-0">Protection Restrictions:</span>
                      <span className="text-amber-300 font-medium text-[11px] truncate">{currentService.protectionRestrictions}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Dependency Graph Diagram */}
              <div className="p-3 rounded-xl bg-[#081024]/90 border border-slate-800/90 shadow-sm space-y-2 shrink-0">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/80 shrink-0">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200 whitespace-nowrap">
                    <Layers className="w-4 h-4 text-cyan-400" />
                    <span>Dependency Graph</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[9px] whitespace-nowrap">
                    <span className="flex items-center gap-1 text-blue-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400" /> Dependency
                    </span>
                    <span className="flex items-center gap-1 text-pink-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-pink-400" /> Dependent
                    </span>
                    <span className="flex items-center gap-1 text-purple-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400" /> Selected
                    </span>
                  </div>
                </div>

                {/* Graph Canvas */}
                <div className="relative min-h-[clamp(52px,8vh,112px)] rounded-lg bg-[#060b17] border border-slate-800/80 p-1.5 flex flex-col items-center justify-between">
                  {/* Top: Dependency (e.g. RPCSS) */}
                  <div className="flex justify-center">
                    {dependencyNodes.find(n => n.name === 'RPCSS' || (n.role === 'dependency' && n.name !== 'EventLog' && n.name !== 'BFE')) && (
                      <div className="dep-node dep-node-dependency">
                        {dependencyNodes.find(n => n.name === 'RPCSS' || n.role === 'dependency')?.name}
                      </div>
                    )}
                  </div>

                  {/* Middle Row: Left Dependency, Center Selected, Right Dependency */}
                  <div className="flex items-center justify-between w-full px-2 my-1">
                    {/* Left Node */}
                    <div className="w-24 text-left">
                      {dependencyNodes.find(n => n.name === 'EventLog' || n.name === 'NSI' || n.name === 'HTTP') ? (
                        <div className="dep-node dep-node-dependency text-[10.5px]">
                          {dependencyNodes.find(n => n.name === 'EventLog' || n.name === 'NSI' || n.name === 'HTTP')?.name}
                        </div>
                      ) : (
                        <div className="w-16" />
                      )}
                    </div>

                    {/* Center Selected Node */}
                    <div className="dep-node dep-node-selected text-xs px-4 py-1.5">
                      {currentService.name}
                    </div>

                    {/* Right Node */}
                    <div className="w-24 text-right">
                      {dependencyNodes.find(n => n.name === 'BFE' || n.name === 'Tcpip' || n.name === 'WinHTTP') ? (
                        <div className="dep-node dep-node-dependency text-[10.5px]">
                          {dependencyNodes.find(n => n.name === 'BFE' || n.name === 'Tcpip' || n.name === 'WinHTTP')?.name}
                        </div>
                      ) : (
                        <div className="w-16" />
                      )}
                    </div>
                  </div>

                  {/* Bottom: Dependent (e.g. WdFilter or Fax) */}
                  <div className="flex justify-center">
                    {dependencyNodes.find(n => n.role === 'dependent') ? (
                      <div className="dep-node dep-node-dependent text-[10.5px]">
                        {dependencyNodes.find(n => n.role === 'dependent')?.name}
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-500 italic">No Downstream Dependents</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Service Operation Preview */}
              <div className="p-3 rounded-xl bg-[#081024]/90 border border-slate-800/90 shadow-sm space-y-1.5 shrink-0">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200 pb-1.5 border-b border-slate-800/80 shrink-0">
                  <Terminal className="w-4 h-4 text-cyan-400" />
                  <span>Service Operation Preview</span>
                </div>

                {/* State Transition */}
                <div className="p-1.5 rounded-lg bg-[#060b17] border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400">Current State:</span>
                    <p className="font-semibold text-emerald-400">
                      ● {currentService.status} ({currentService.startupType})
                    </p>
                  </div>

                  <ArrowRight className="w-4 h-4 text-cyan-400 shrink-0" />

                  <div>
                    <span className="text-[10px] text-slate-400">Proposed State:</span>
                    <p className="font-semibold text-slate-300">
                      ● {proposedAction?.newStatus || 'Stopped'} ({proposedAction?.newStartupType || 'Manual'})
                    </p>
                  </div>
                </div>

                {/* Checklist fields */}
                <div className="space-y-0.5 text-[10.5px]">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Prerequisites:</span>
                    <span className="text-slate-300">None</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Affected Dependents:</span>
                    <span className="text-slate-300">{currentService.dependents.length > 0 ? currentService.dependents.join(', ') : 'None'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Administrator Required:</span>
                    <span className="text-amber-300 font-semibold flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Yes
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Confirmation Step:</span>
                    <span className="text-amber-300 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> User confirmation required
                    </span>
                  </div>
                  <div className="flex justify-between pt-0.5">
                    <span className="text-slate-400">Event Stream (preview):</span>
                    <span className="text-slate-300">Will log to Windows Event Log (System)</span>
                  </div>
                </div>

                {/* Primary Action Buttons */}
                <div className="grid grid-cols-4 gap-1.5 pt-0.5">
                  <button
                    disabled={currentService.status === 'Running'}
                    onClick={() => {
                      setProposedAction({ type: 'Start', newStatus: 'Running' });
                      setActiveModal('review-change');
                    }}
                    className={`py-1 px-2 rounded-lg border text-xs font-medium flex items-center justify-center gap-1 whitespace-nowrap transition-all ${
                      currentService.status === 'Running'
                        ? 'bg-slate-900/40 border-slate-800 text-slate-600 cursor-not-allowed'
                        : 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/70'
                    }`}
                  >
                    <Play className="w-3 h-3" />
                    <span>Start</span>
                  </button>

                  <button
                    disabled={currentService.status === 'Stopped'}
                    onClick={() => {
                      setProposedAction({ type: 'Stop', newStatus: 'Stopped' });
                      setActiveModal('review-change');
                    }}
                    className={`py-1 px-2 rounded-lg border text-xs font-medium flex items-center justify-center gap-1 whitespace-nowrap transition-all ${
                      currentService.status === 'Stopped'
                        ? 'bg-slate-900/40 border-slate-800 text-slate-600 cursor-not-allowed'
                        : 'bg-rose-950/70 border-rose-500/60 text-rose-200 hover:bg-rose-900/80'
                    }`}
                  >
                    <StopSquare className="w-3 h-3" />
                    <span>Stop</span>
                  </button>

                  <button
                    onClick={() => {
                      setProposedAction({ type: 'Restart', newStatus: 'Running' });
                      setActiveModal('review-change');
                    }}
                    className="py-1 px-2 rounded-lg bg-slate-900/80 border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-medium flex items-center justify-center gap-1 whitespace-nowrap transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Restart</span>
                  </button>

                  <button
                    onClick={() => {
                      setStartupTypeDraft(currentService.startupType);
                      setActiveModal('change-startup-type');
                    }}
                    title={isArabic ? 'تغيير نوع بدء التشغيل' : 'Change Startup Type'}
                    className="services-compact-btn py-1 px-2 rounded-lg bg-slate-900/80 border border-slate-700 hover:bg-slate-800 text-slate-300 font-medium flex items-center justify-center gap-0.5 transition-colors"
                  >
                    <span>{isArabic ? 'بدء التشغيل' : 'Startup'}</span>
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </div>

                {/* Sticky Action Footer */}
                <div className="pt-0.5 flex items-center gap-2">
                  <button
                    onClick={() => setActiveModal('review-change')}
                    className="flex-1 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-medium text-xs shadow-md transition-all text-center"
                  >
                    Review Change
                  </button>

                  <button
                    onClick={() => {
                      setSelectedServiceName('WinDefend');
                      setToastMessage('Reset selection to default');
                      setTimeout(() => setToastMessage(null), 1800);
                    }}
                    className="px-4 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>

            </div>

          </section>

        </main>
      </div>

      <DesignPreviewModal
        open={activeModal === 'review-change'}
        title={isArabic ? 'مراجعة تغيير الخدمة' : 'Review Service Change'}
        subtitle={currentService.displayName}
        worldLabel={isArabic ? 'الخدمات' : 'Windows Services'}
        isArabic={isArabic}
        onClose={() => setActiveModal(null)}
        fields={[
          { label: isArabic ? 'الخدمة' : 'Service', value: currentService.name, tone: 'cyan' },
          { label: isArabic ? 'الحالة الحالية' : 'Current State', value: currentService.status },
          { label: isArabic ? 'الحالة المقترحة' : 'Proposed State', value: proposedAction?.newStatus ?? currentService.status, tone: 'emerald' },
          { label: isArabic ? 'نوع البدء' : 'Startup Type', value: proposedAction?.newStartupType ?? currentService.startupType },
          { label: isArabic ? 'الحساب' : 'Account', value: currentService.account, tone: 'muted' },
          { label: isArabic ? 'متطلب مدير النظام' : 'Administrator Required', value: 'Yes', tone: 'amber' },
          { label: isArabic ? 'سجل الأحداث (معاينة)' : 'Event Stream (preview)', value: 'Windows Event Log (System)', tone: 'muted' },
        ]}
        notice={
          isArabic
            ? 'يؤثر هذا الإجراء على نموذج الجلسة المحلية فقط. لا يتم تطبيقه على ويندوز في هذه المرحلة.'
            : 'This action applies to the local session fixture only. No Windows service is mutated in this phase.'
        }
        confirmLabel={isArabic ? 'تطبيق على المعاينة' : 'Apply to Session Preview'}
        onConfirm={() => {
          handleApplyChange(
            {
              status: proposedAction?.newStatus ?? currentService.status,
              startupType: proposedAction?.newStartupType ?? currentService.startupType,
            },
            {
              id: 'act-' + Date.now(),
              timestamp: 'now',
              serviceName: currentService.name,
              action:
                proposedAction?.type === 'ChangeStartup'
                  ? 'Startup Type Changed'
                  : proposedAction?.type === 'Restart'
                    ? 'Restarted'
                    : proposedAction?.type === 'Stop'
                      ? 'Stopped'
                      : 'Started',
              previousState: currentService.status + ' (' + currentService.startupType + ')',
              newState:
                (proposedAction?.newStatus ?? currentService.status) +
                ' (' +
                (proposedAction?.newStartupType ?? currentService.startupType) +
                ')',
              details: 'Session preview applied for ' + currentService.name + '.',
              user: 'KNOuX Preview Session',
            }
          );
          setActiveModal(null);
        }}
      />

      <DesignPreviewModal
        open={activeModal === 'change-startup-type'}
        title={isArabic ? 'تغيير نوع البدء' : 'Change Startup Type'}
        subtitle={currentService.displayName}
        worldLabel={isArabic ? 'الخدمات' : 'Windows Services'}
        isArabic={isArabic}
        onClose={() => setActiveModal(null)}
        fields={[
          { label: isArabic ? 'الخدمة' : 'Service', value: currentService.name, tone: 'cyan' },
          { label: isArabic ? 'نوع البدء الحالي' : 'Current Startup Type', value: currentService.startupType },
        ]}
        notice={
          isArabic
            ? 'اختر نوع البدء المراد تطبيقه على نموذج المعاينة المحلي.'
            : 'Choose the startup type to apply to the local preview fixture.'
        }
        confirmLabel={isArabic ? 'تطبيق على المعاينة' : 'Apply to Session Preview'}
        confirmDisabled={!startupTypeDraft}
        onConfirm={() => {
          if (!startupTypeDraft) return;
          setProposedAction({
            type: 'ChangeStartup',
            newStatus: currentService.status,
            newStartupType: startupTypeDraft,
          });
          setActiveModal(null);
        }}
      >
        <div className="grid grid-cols-2 gap-2">
          {(['Automatic', 'Automatic (Delayed)', 'Manual', 'Disabled'] as StartupType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setStartupTypeDraft(t)}
              className={
                'px-2.5 py-1.5 rounded-lg border text-[11px] font-medium transition ' +
                (startupTypeDraft === t
                  ? 'bg-cyan-950/70 border-cyan-500/60 text-cyan-200'
                  : 'bg-[#050e1f] border-slate-800 text-slate-300 hover:border-slate-700')
              }
            >
              {t}
            </button>
          ))}
        </div>
      </DesignPreviewModal>

      <DesignPreviewModal
        open={activeModal === 'activity-view-all'}
        title={isArabic ? 'كل نشاط الخدمات' : 'All Service Activity'}
        subtitle={isArabic ? 'سجل المعاينة المحلي' : 'Local preview journal'}
        worldLabel={isArabic ? 'الخدمات' : 'Windows Services'}
        isArabic={isArabic}
        onClose={() => setActiveModal(null)}
        notice={
          isArabic
            ? 'سجل مصمم داخل التطبيق. لا يحتوي على أحداث ويندوز حقيقية.'
            : 'Application-local journal. These entries are design fixtures, not real Windows events.'
        }
      >
        <div className="rounded-xl border border-slate-800/80 overflow-hidden">
          <table className="w-full text-left text-[11px]">
            <thead className="bg-[#071329] text-slate-400 font-mono uppercase text-[10px]">
              <tr>
                <th className="p-2">{isArabic ? 'الوقت' : 'Timestamp'}</th>
                <th className="p-2">{isArabic ? 'الخدمة' : 'Service'}</th>
                <th className="p-2">{isArabic ? 'الإجراء' : 'Action'}</th>
                <th className="p-2">{isArabic ? 'الحالة الجديدة' : 'New State'}</th>
              </tr>
            </thead>
            <tbody>
              {activityLogs.map((log) => (
                <tr key={log.id} className="border-b border-slate-800/50 font-mono">
                  <td className="p-2 text-slate-400">{log.timestamp}</td>
                  <td className="p-2 text-slate-200">{log.serviceName}</td>
                  <td className="p-2 text-cyan-300">{log.action}</td>
                  <td className="p-2 text-emerald-300">{log.newState}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DesignPreviewModal>

      {activeServiceWorkspace && (
        <ServicesWorkspaces
          serviceKey={activeServiceWorkspace}
          onClose={() => setActiveServiceWorkspace(null)}
          isArabic={isArabic}
        />
      )}

    </div>
  );
}
