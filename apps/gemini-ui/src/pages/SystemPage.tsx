/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Activity,
  Search,
  Bell,
  Minus,
  Square,
  X,
  Languages,
  Home,
  LayoutGrid,
  CheckSquare,
  Zap,
  Folder,
  Shield,
  Wifi,
  Palette,
  Wrench,
  Settings,
  HelpCircle,
  Cpu,
  HardDrive,
  RefreshCw,
  BarChart2,
  Monitor,
  Heart,
  AlertTriangle,
  ListFilter,
  ShieldCheck,
  Clock,
  BarChart3,
  Cog,
  FileText,
  PieChart,
  PlayCircle,
  Network,
  RotateCcw,
  Upload,
  CheckCircle2,
  ChevronDown,
  Layers,
  ChevronRight,
  Sparkles
} from 'lucide-react';

import {
  INITIAL_TELEMETRY_SOURCE,
  INITIAL_INSTRUMENT_METRICS,
  INITIAL_SYSTEM_INFO,
  SAMPLE_SYSTEM_INFO_ACTIVE,
  INITIAL_SERVICES_CATALOG,
  SAMPLE_PROCESS_FIXTURES,
  TelemetrySourceMeta,
  InstrumentMetric,
  SystemInfoData,
  RunningProcessItem,
  SystemServiceMeta
} from '../lib/system-inventory';
import { SystemWorkspaces } from '../components/system/SystemWorkspaces';
import { useNavigation } from '../context/NavigationContext';
import { KNOuXTitleBar, KNOuXSidebar } from '../components/shell/KNOuXShellComponents';
import '../system.css';

interface SystemPageProps {
  onNavigateSection?: (section: string) => void;
}

export function SystemPage({ onNavigateSection }: SystemPageProps) {
  const { navigateTo, isActive, isArabic, toggleLocale } = useNavigation();
  // UI states
  const [activeWorkspaceKey, setActiveWorkspaceKey] = useState<string | null>(null);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  // Telemetry simulation toggle (Awaiting live sample vs Sample streaming preview)
  const [isStreamingSample, setIsStreamingSample] = useState<boolean>(false);

  // Performance timeline selected resource tab & interval
  const [timelineTab, setTimelineTab] = useState<'CPU' | 'Memory' | 'Disk' | 'Network'>('CPU');
  const [timelineInterval, setTimelineInterval] = useState<string>('60 seconds');

  // Live Service Preview Config
  const [selectedService, setSelectedService] = useState<string>('Windows Update (wuauserv)');
  const [selectedDataSource, setSelectedDataSource] = useState<string>('Windows Service Controller');
  const [samplingInterval, setSamplingInterval] = useState<string>('10 seconds');
  const [visibleMetrics, setVisibleMetrics] = useState<Record<string, boolean>>({
    serviceStatus: true,
    cpuUsage: true,
    memoryUsage: true,
    diskActivity: true,
    networkActivity: true
  });
  const [isServiceCollecting, setIsServiceCollecting] = useState<boolean>(false);

  // Process Ledger Filter & Display
  const [processSearch, setProcessSearch] = useState<string>('');
  const [processStatusFilter, setProcessStatusFilter] = useState<string>('All');
  const [processUserFilter, setProcessUserFilter] = useState<string>('All');
  const [showProcessSampleList, setShowProcessSampleList] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setNotificationMsg(msg);
    setTimeout(() => setNotificationMsg(null), 3000);
  };

  const handleToggleMetric = (key: string) => {
    setVisibleMetrics((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Instruments data based on live preview state
  const instrumentMetrics = useMemo<InstrumentMetric[]>(() => {
    if (!isStreamingSample) {
      return INITIAL_INSTRUMENT_METRICS;
    }
    return [
      {
        ...INITIAL_INSTRUMENT_METRICS[0],
        gaugeValue: '18%',
        gaugeStatus: 'Streaming sample',
        footerStats: [
          { label: 'Base Speed', value: '3.00 GHz' },
          { label: 'Cores', value: '24' },
          { label: 'Logical', value: '32' }
        ]
      },
      {
        ...INITIAL_INSTRUMENT_METRICS[1],
        gaugeValue: '38%',
        gaugeStatus: 'Streaming sample',
        footerStats: [
          { label: 'Total', value: '64.0 GB' },
          { label: 'In Use', value: '24.3 GB' },
          { label: 'Available', value: '39.7 GB' }
        ]
      },
      {
        ...INITIAL_INSTRUMENT_METRICS[2],
        gaugeValue: '4%',
        gaugeStatus: 'Streaming sample',
        footerStats: [
          { label: 'Read Rate', value: '14.2 MB/s' },
          { label: 'Write Rate', value: '8.6 MB/s' },
          { label: 'Active Time', value: '6%' }
        ]
      },
      {
        ...INITIAL_INSTRUMENT_METRICS[3],
        gaugeValue: '12%',
        gaugeStatus: 'Streaming sample',
        footerStats: [
          { label: 'Download', value: '42.8 Mbps' },
          { label: 'Upload', value: '6.4 Mbps' },
          { label: 'Total', value: '1.8 GB' }
        ]
      }
    ];
  }, [isStreamingSample]);

  // System info data based on live preview state
  const systemInfo = isStreamingSample ? SAMPLE_SYSTEM_INFO_ACTIVE : INITIAL_SYSTEM_INFO;

  // Filtered processes
  const filteredProcesses = useMemo(() => {
    if (!showProcessSampleList) return [];
    return SAMPLE_PROCESS_FIXTURES.filter((p) => {
      if (processStatusFilter !== 'All' && p.status !== processStatusFilter) return false;
      if (processUserFilter !== 'All' && !p.user.includes(processUserFilter)) return false;
      if (processSearch.trim()) {
        const q = processSearch.toLowerCase();
        return p.name.toLowerCase().includes(q) || String(p.pid).includes(q) || p.user.toLowerCase().includes(q);
      }
      return true;
    });
  }, [showProcessSampleList, processStatusFilter, processUserFilter, processSearch]);

  const renderServiceIcon = (iconName: string) => {
    switch (iconName) {
      case 'Heart': return <Heart className="w-4 h-4 text-rose-400" />;
      case 'AlertTriangle': return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case 'ListFilter': return <ListFilter className="w-4 h-4 text-cyan-400" />;
      case 'ShieldCheck': return <ShieldCheck className="w-4 h-4 text-emerald-400" />;
      case 'Clock': return <Clock className="w-4 h-4 text-purple-400" />;
      case 'BarChart3': return <BarChart3 className="w-4 h-4 text-amber-400" />;
      case 'Cog': return <Cog className="w-4 h-4 text-cyan-400" />;
      case 'FileText': return <FileText className="w-4 h-4 text-blue-400" />;
      case 'PieChart': return <PieChart className="w-4 h-4 text-teal-400" />;
      case 'PlayCircle': return <PlayCircle className="w-4 h-4 text-emerald-400" />;
      case 'Network': return <Network className="w-4 h-4 text-purple-400" />;
      case 'Activity': return <Activity className="w-4 h-4 text-cyan-400" />;
      default: return <Activity className="w-4 h-4 text-cyan-400" />;
    }
  };

  return (
    <div
      dir={isArabic ? 'rtl' : 'ltr'}
      className="system-viewport bg-[#040a16] text-slate-100 flex flex-col h-screen select-none relative overflow-hidden"
    >
      {/* 1. Window Frame & Titlebar Chrome */}
      <KNOuXTitleBar
        sectionName={isArabic ? "نبض النظام" : "System"}
        sectionSubtitle={isArabic ? "المؤشرات الحية" : "Live Pulse"}
        onNavigateHome={() => (onNavigateSection ? onNavigateSection("home") : navigateTo("home"))}
        searchPlaceholder={isArabic ? "البحث عن ميزات، عمليات، أو إعدادات... (Ctrl+K)" : "Search features, processes, or settings... (Ctrl+K)"}
        isArabic={isArabic}
        onToggleArabic={toggleLocale}
      />

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* 2. Left Global Navigation Sidebar */}
        <KNOuXSidebar
          activeSection="system"
          onNavigate={(sec) => (onNavigateSection ? onNavigateSection(sec) : navigateTo(sec))}
          isArabic={isArabic}
        />

        {/* 3. Main Center Canvas */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0">
        <main className="flex-1 flex flex-col min-h-0 overflow-y-auto system-custom-scrollbar p-4 gap-2.5">
          
          {/* Toast Notification */}
          {notificationMsg && (
            <div className="fixed top-12 right-6 z-40 bg-gradient-to-r from-purple-900 via-indigo-900 to-cyan-900 border border-cyan-500/50 text-white text-xs px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-cyan-300" />
              <span>{notificationMsg}</span>
            </div>
          )}

          {/* Hero Header Section */}
          <div className="system-hero relative flex flex-col md:flex-row md:items-center justify-between gap-3 pt-0.5 pb-1">
            
            {/* Cybernetic Waveform Background Graphic in Hero */}
            <svg className="system-observatory-wave" viewBox="0 0 580 110" fill="none">
              <path
                d="M10 60 C80 15, 140 105, 220 50 C300 -5, 360 95, 440 45 C500 10, 550 70, 580 50"
                stroke="url(#hero-wave-grad)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d="M10 50 C70 85, 150 15, 230 75 C310 135, 380 25, 460 70 C520 105, 560 30, 580 55"
                stroke="url(#hero-wave-grad-2)"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                opacity="0.6"
              />
              <defs>
                <linearGradient id="hero-wave-grad" x1="0" y1="0" x2="580" y2="0" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#a855f7" />
                  <stop offset="0.5" stopColor="#06b6d4" />
                  <stop offset="1" stopColor="#3b82f6" />
                </linearGradient>
                <linearGradient id="hero-wave-grad-2" x1="0" y1="0" x2="580" y2="0" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#3b82f6" />
                  <stop offset="0.5" stopColor="#a855f7" />
                  <stop offset="1" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
            </svg>

            {/* Left: Titles */}
            <div className="relative z-10">
              <div className="text-[10px] font-mono tracking-widest text-cyan-400 uppercase font-semibold">
                SYSTEM OBSERVATORY
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight mt-0.5 flex items-baseline gap-2">
                <span>Live</span>
                <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Pulse
                </span>
              </h1>
              <p className="text-[11px] text-slate-300 mt-0.5 max-w-xl">
                {isArabic
                  ? 'بيئة ويندوز الخاصة بك، مرصودة ومراقبة بذكاء فائق ودقة متناهية.'
                  : 'Your Windows environment, intelligently observed.'}
              </p>
            </div>

            {/* Right: Telemetry Source Status Card */}
            <div
              onClick={() => {
                setIsStreamingSample(!isStreamingSample);
                showToast(
                  !isStreamingSample
                    ? 'Sample telemetry connected: Windows Performance Counters streaming'
                    : 'Awaiting live sample state restored (honest empty baseline)'
                );
              }}
              className="relative z-10 px-4 py-2.5 rounded-xl bg-[#061226]/90 border border-cyan-500/30 hover:border-cyan-400 cursor-pointer transition shadow-lg flex items-center gap-3.5 group"
              title="Click to toggle sample data stream vs honest awaiting state"
            >
              <div className="relative w-8 h-8 rounded-full border border-cyan-500/40 flex items-center justify-center shrink-0">
                <div className="radar-sweep-reticle absolute inset-0 rounded-full border-t border-cyan-400" />
                <div className={`w-2 h-2 rounded-full ${isStreamingSample ? 'bg-emerald-400 animate-pulse' : 'bg-cyan-400'}`} />
              </div>

              <div>
                <div className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">
                  Telemetry Source
                </div>
                <div className="text-xs font-semibold text-white flex items-center gap-1.5 mt-0.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${isStreamingSample ? 'bg-emerald-400' : 'bg-emerald-500'}`} />
                  <span>Windows Performance Counters</span>
                </div>
                <div className="text-[10px] text-cyan-300 font-mono">
                  {isStreamingSample ? 'Status: Active Streaming' : 'Status: Awaiting data...'}
                </div>
              </div>
            </div>
          </div>

          {/* 4. Upper Main Area: Four Large Dashboard Instruments */}
          <div className="system-instrument-grid grid grid-cols-2 lg:grid-cols-4 gap-3">
            {instrumentMetrics.map((inst) => (
              <div
                key={inst.id}
                onClick={() => setActiveWorkspaceKey(`system-perf`)}
                className="system-instrument-card p-3 rounded-2xl bg-[#071329] border border-slate-800/90 hover:border-cyan-500/40 cursor-pointer transition shadow-md flex flex-col justify-between group"
              >
                {/* Header */}
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-[#0c1f3f] border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                    {inst.id === 'cpu' && <Cpu className="w-4 h-4" />}
                    {inst.id === 'memory' && <Layers className="w-4 h-4 text-purple-400" />}
                    {inst.id === 'disk' && <HardDrive className="w-4 h-4 text-emerald-400" />}
                    {inst.id === 'network' && <Wifi className="w-4 h-4 text-cyan-400" />}
                  </div>
                  <div>
                    <div className="font-bold text-xs text-white group-hover:text-cyan-300 transition">{inst.title}</div>
                    <div className="text-[10px] text-slate-400">{inst.subtitle}</div>
                  </div>
                </div>

                {/* Circular Gauge + Sparkline + Inline Footer Stats (REF-07 proportions) */}
                <div className="flex items-center gap-3">
                  {/* Circular Radial Gauge */}
                  <div className="system-gauge relative w-[74px] h-[74px] flex items-center justify-center shrink-0">
                    <svg className="system-gauge-svg w-[74px] h-[74px]" viewBox="0 0 80 80">
                      <circle cx="40" cy="40" r="32" stroke="#0e2347" strokeWidth="6" fill="none" />
                      <circle
                        cx="40"
                        cy="40"
                        r="32"
                        stroke={inst.sparklineColor}
                        strokeWidth="6"
                        strokeLinecap="round"
                        fill="none"
                        strokeDasharray="201"
                        strokeDashoffset={isStreamingSample ? '135' : '190'}
                        className="gauge-svg-circle"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className="font-mono font-black text-sm text-white">{inst.gaugeValue}</span>
                      <span className="text-[8px] text-slate-400 font-sans leading-tight">
                        {isStreamingSample ? 'Active' : 'Awaiting\nsample'}
                      </span>
                    </div>
                  </div>

                  {/* Mini Sparkline Waveform + Footer Measurement Stats */}
                  <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                    <div className="h-10 flex items-end">
                      <svg className="w-full h-10" viewBox="0 0 100 40" preserveAspectRatio="none">
                        <path
                          d={`M 0 35 ${inst.sparklinePoints.map((p, idx) => `L ${(idx / (inst.sparklinePoints.length - 1)) * 100} ${40 - (p / 80) * 35}`).join(' ')}`}
                          stroke={inst.sparklineColor}
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          fill="none"
                        />
                      </svg>
                    </div>

                    <div className="grid grid-cols-3 gap-1 text-[10px] font-mono">
                      {inst.footerStats.map((st, i) => (
                        <div key={i} className="text-center">
                          <div className="text-slate-500 text-[9px]">{st.label}</div>
                          <div className="text-slate-300 font-semibold">{st.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

{/* 5. Reference Grid (REF-07): Timeline (6) | System Information (3) | Live Service Preview (3, rows 1-2) | Ledger + 12 Diagnostics (9, row 2) */}
          <div className="system-workspace-grid grid grid-cols-1 xl:grid-cols-12 xl:grid-rows-[auto_1fr] gap-3 flex-1 min-h-0">

            {/* 5.1 Performance Timeline — cols 1-6, row 1 */}
            <section className="system-timeline-panel xl:col-span-6 xl:self-stretch p-4 rounded-2xl bg-[#071329] border border-slate-800 shadow-md flex flex-col min-h-0">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-cyan-400" />
                  <div>
                    <h3 className="font-bold text-xs text-white">Performance Timeline</h3>
                    <div className="text-[10px] text-slate-400">Live system resource usage over time.</div>
                  </div>
                </div>

                {/* Tabs & Interval */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-[#050e1f] p-0.5 rounded-lg border border-slate-800 text-[10px] font-mono">
                    {(['CPU', 'Memory', 'Disk', 'Network'] as const).map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setTimelineTab(tab)}
                        className={`px-2 py-0.5 rounded transition ${
                          timelineTab === tab
                            ? 'bg-purple-600 text-white font-bold'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>

                  <select
                    value={timelineInterval}
                    onChange={(e) => setTimelineInterval(e.target.value)}
                    aria-label="Timeline sampling interval"
                    className="bg-[#050e1f] border border-slate-800 rounded px-1.5 py-0.5 text-[10px] font-mono text-slate-300"
                  >
                    <option value="30 seconds">30 seconds</option>
                    <option value="60 seconds">60 seconds</option>
                    <option value="5 minutes">5 minutes</option>
                  </select>
                </div>
              </div>

              {/* Timeline Chart Grid Canvas */}
              <div className="system-timeline-canvas flex-1 min-h-[136px] w-full bg-[#050e1f] rounded-xl border border-slate-800/80 p-3 relative flex flex-col justify-between overflow-hidden">
                {/* Calibrated Y-axis lines */}
                {[100, 75, 50, 25, 0].map((val) => (
                  <div key={val} className="w-full flex items-center text-[9px] font-mono text-slate-600">
                    <span className="w-6 shrink-0">{val}%</span>
                    <div className="flex-1 border-b border-dashed border-slate-800 ms-1" />
                  </div>
                ))}

                {/* Center Awaiting State or Live Curve */}
                {isStreamingSample ? (
                  <div className="absolute inset-0 pt-4 px-10 pb-6 flex items-center">
                    <svg className="w-full h-full" viewBox="0 0 300 100" preserveAspectRatio="none">
                      <path
                        d="M0 80 Q50 30, 100 65 T200 40 T300 60"
                        stroke="#a855f7"
                        strokeWidth="2"
                        fill="none"
                      />
                    </svg>
                  </div>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                    <BarChart3 className="w-6 h-6 text-slate-600 mb-1" />
                    <div className="text-xs font-semibold text-slate-300">Awaiting performance data...</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      System data will appear here once collection begins.
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsStreamingSample(true);
                        showToast('Sample performance stream active');
                      }}
                      className="mt-2 px-2.5 py-1 rounded bg-[#091833] hover:bg-slate-800 text-[10px] font-mono text-cyan-300 border border-slate-700"
                    >
                      Initiate Sample Collection
                    </button>
                  </div>
                )}

                {/* X-axis Timestamps */}
                <div className="w-full flex items-center justify-between text-[9px] font-mono text-slate-600 pt-1 border-t border-slate-800">
                  <span>15:27</span>
                  <span>15:28</span>
                  <span>15:29</span>
                  <span>15:30</span>
                  <span>15:31</span>
                  <span>15:32</span>
                </div>
              </div>
            </section>

            {/* 5.2 System Information — cols 7-9, row 1 */}
            <section className="system-info-panel xl:col-span-3 p-3 rounded-2xl bg-[#071329] border border-slate-800 shadow-md flex flex-col min-h-0">
              <div className="flex items-center gap-2 mb-2">
                <Monitor className="w-4 h-4 text-cyan-400" />
                <div>
                  <h3 className="font-bold text-xs text-white">System Information</h3>
                  <div className="text-[10px] text-slate-400">Key details about your Windows environment.</div>
                </div>
              </div>

              {/* Key-Value List */}
              <div className="space-y-0 text-[11px] font-mono">
                <div className="flex items-center justify-between gap-2 py-[1px] border-b border-slate-800/60">
                  <span className="flex items-center gap-1.5 text-slate-400 font-sans min-w-0">
                    <Monitor className="w-3 h-3 text-slate-600 shrink-0" />
                    <span className="truncate">Windows Version</span>
                  </span>
                  <span className="font-semibold text-slate-100 text-end truncate">{systemInfo.windowsVersion}</span>
                </div>
                <div className="flex items-center justify-between gap-2 py-[1px] border-b border-slate-800/60">
                  <span className="flex items-center gap-1.5 text-slate-400 font-sans min-w-0">
                    <ChevronDown className="w-3 h-3 text-slate-600 shrink-0" />
                    <span className="truncate">Version / Build</span>
                  </span>
                  <span className="text-cyan-300 text-end truncate">{systemInfo.versionBuild}</span>
                </div>
                <div className="flex items-center justify-between gap-2 py-[1px] border-b border-slate-800/60">
                  <span className="flex items-center gap-1.5 text-slate-400 font-sans min-w-0">
                    <HardDrive className="w-3 h-3 text-slate-600 shrink-0" />
                    <span className="truncate">System Manufacturer</span>
                  </span>
                  <span className="text-slate-300 text-end truncate">{systemInfo.systemManufacturer}</span>
                </div>
                <div className="flex items-center justify-between gap-2 py-[1px] border-b border-slate-800/60">
                  <span className="flex items-center gap-1.5 text-slate-400 font-sans min-w-0">
                    <Cpu className="w-3 h-3 text-slate-600 shrink-0" />
                    <span className="truncate">System Model</span>
                  </span>
                  <span className="text-slate-300 text-end truncate">{systemInfo.systemModel}</span>
                </div>
                <div className="flex items-center justify-between gap-2 py-[1px] border-b border-slate-800/60">
                  <span className="flex items-center gap-1.5 text-slate-400 font-sans min-w-0">
                    <Zap className="w-3 h-3 text-slate-600 shrink-0" />
                    <span className="truncate">Processor</span>
                  </span>
                  <span className="text-slate-300 text-end truncate" title={systemInfo.processor}>
                    {systemInfo.processor}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 py-[1px] border-b border-slate-800/60">
                  <span className="flex items-center gap-1.5 text-slate-400 font-sans min-w-0">
                    <Layers className="w-3 h-3 text-slate-600 shrink-0" />
                    <span className="truncate">Installed RAM</span>
                  </span>
                  <span className="text-slate-100 text-end truncate">{systemInfo.installedRam}</span>
                </div>
                <div className="flex items-center justify-between gap-2 py-[1px] border-b border-slate-800/60">
                  <span className="flex items-center gap-1.5 text-slate-400 font-sans min-w-0">
                    <Clock className="w-3 h-3 text-slate-600 shrink-0" />
                    <span className="truncate">Uptime</span>
                  </span>
                  <span className="text-emerald-400 font-bold text-end truncate">{systemInfo.uptime}</span>
                </div>
                <div className="flex items-center justify-between gap-2 py-[1px] border-b border-slate-800/60">
                  <span className="flex items-center gap-1.5 text-slate-400 font-sans min-w-0">
                    <ListFilter className="w-3 h-3 text-slate-600 shrink-0" />
                    <span className="truncate">Process Count</span>
                  </span>
                  <span className="text-slate-200 text-end truncate">{systemInfo.processCount}</span>
                </div>
                <div className="flex items-center justify-between gap-2 py-0.5">
                  <span className="flex items-center gap-1.5 text-slate-400 font-sans min-w-0">
                    <Activity className="w-3 h-3 text-slate-600 shrink-0" />
                    <span className="truncate">Last Read</span>
                  </span>
                  <span className="text-slate-400 text-[10px] text-end truncate">{systemInfo.lastRead}</span>
                </div>
              </div>
            </section>

            {/* 5.3 Live Service Preview Inspector — cols 10-12, rows 1-2 (full-height rail) */}
            <section className="system-live-panel xl:col-span-3 xl:row-span-2 xl:self-stretch p-4 rounded-2xl bg-[#071329] border border-cyan-500/25 shadow-md flex flex-col gap-2 min-h-0 overflow-hidden">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-purple-400" />
                <div>
                  <h3 className="font-bold text-xs text-white">Live Service Preview</h3>
                  <div className="text-[10px] text-slate-400">Inspect a Windows service in real time.</div>
                </div>
              </div>

              {/* Form Selectors */}
              <div className="space-y-1.5 text-xs">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5" htmlFor="sys-svc-select">Service</label>
                  <select
                    id="sys-svc-select"
                    value={selectedService}
                    onChange={(e) => setSelectedService(e.target.value)}
                    className="w-full bg-[#050e1f] border border-slate-700/80 rounded-lg p-1 text-[11px] text-slate-200"
                  >
                    <option value="Windows Update (wuauserv)">Windows Update (wuauserv)</option>
                    <option value="DCOM Server (DcomLaunch)">DCOM Server (DcomLaunch)</option>
                    <option value="Windows Defender (WinDefend)">Windows Defender (WinDefend)</option>
                    <option value="Background Transfer (BITS)">Background Transfer (BITS)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5" htmlFor="sys-src-select">Data Source</label>
                  <select
                    id="sys-src-select"
                    value={selectedDataSource}
                    onChange={(e) => setSelectedDataSource(e.target.value)}
                    className="w-full bg-[#050e1f] border border-slate-700/80 rounded-lg p-1 text-[11px] text-slate-200"
                  >
                    <option value="Windows Service Controller">Windows Service Controller</option>
                    <option value="ETW Kernel Trace Provider">ETW Kernel Trace Provider</option>
                  </select>
                </div>

                <div className="flex items-center justify-between gap-2 text-[11px]">
                  <span className="text-slate-400">Permissions:</span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950/80 text-emerald-300 border border-emerald-800 flex items-center gap-1 font-mono shrink-0">
                    <Shield className="w-3 h-3" /> Standard User (Limited)
                  </span>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5" htmlFor="sys-int-select">Sampling Interval</label>
                  <select
                    id="sys-int-select"
                    value={samplingInterval}
                    onChange={(e) => setSamplingInterval(e.target.value)}
                    className="w-full bg-[#050e1f] border border-slate-700/80 rounded-lg p-1 text-[11px] text-slate-200"
                  >
                    <option value="5 seconds">5 seconds</option>
                    <option value="10 seconds">10 seconds</option>
                    <option value="30 seconds">30 seconds</option>
                  </select>
                </div>

                {/* Visible Metrics Checkboxes */}
                <div className="pt-1.5 border-t border-slate-800 space-y-0.5">
                  <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold block">Visible Metrics</span>
                  {[
                    { key: 'serviceStatus', label: 'Service Status' },
                    { key: 'cpuUsage', label: 'CPU Usage' },
                    { key: 'memoryUsage', label: 'Memory Usage' },
                    { key: 'diskActivity', label: 'Disk Activity' },
                    { key: 'networkActivity', label: 'Network Activity' }
                  ].map((m) => (
                    <label key={m.key} className="flex items-center gap-2 text-[11px] text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={visibleMetrics[m.key]}
                        onChange={() => handleToggleMetric(m.key)}
                        className="w-3.5 h-3.5 rounded accent-purple-500"
                      />
                      <span>{m.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Preview Container: Awaiting Telemetry State / Honest Sample Fixture */}
              <div className="p-2.5 rounded-xl bg-[#050e1f] border border-slate-800/80 text-center flex-1 flex flex-col justify-center min-h-0">
                {isServiceCollecting ? (
                  <>
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-300">Sample fixture active</span>
                    </div>
                    <div className="text-[11px] font-semibold text-slate-200">{selectedService}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {samplingInterval} sampling · {selectedDataSource}
                    </div>
                    <div className="mt-1.5 flex flex-wrap justify-center gap-1">
                      {[
                        { key: 'serviceStatus', label: 'Status' },
                        { key: 'cpuUsage', label: 'CPU' },
                        { key: 'memoryUsage', label: 'Memory' },
                        { key: 'diskActivity', label: 'Disk' },
                        { key: 'networkActivity', label: 'Network' }
                      ].filter((m) => visibleMetrics[m.key]).map((m) => (
                        <span key={m.key} className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-[#091833] border border-slate-800 text-slate-400">
                          {m.label}: --
                        </span>
                      ))}
                    </div>
                    <div className="text-[9px] text-slate-600 mt-1.5">
                      Design fixture — no native Windows counters are connected in this phase.
                    </div>
                  </>
                ) : (
                  <>
                    <BarChart3 className="w-4 h-4 text-slate-600 mx-auto mb-0.5" />
                    <div className="text-[11px] font-semibold text-slate-300">Awaiting Windows telemetry...</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Select a service and start data collection to view live metrics here.
                    </div>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setIsServiceCollecting(!isServiceCollecting);
                    showToast(
                      !isServiceCollecting
                        ? `Live metric observation begun for ${selectedService}`
                        : `Service data collection paused`
                    );
                  }}
                  className={`mt-2 w-full py-1 rounded text-xs font-semibold transition ${
                    isServiceCollecting
                      ? 'bg-rose-600/80 hover:bg-rose-600 text-white'
                      : 'bg-purple-600 hover:bg-purple-500 text-white'
                  }`}
                >
                  {isServiceCollecting ? 'Stop Collection' : 'Start Collection (Safe Preview)'}
                </button>
              </div>
            </section>

            {/* 5.4 Lower region — cols 1-9, row 2 */}
            <div className="xl:col-span-9 min-w-0 min-h-0 flex flex-col gap-3">

              {/* Process Ledger */}
              <section className="system-ledger-panel p-3.5 rounded-2xl bg-[#071329] border border-slate-800 shadow-md flex flex-col flex-1 min-h-[118px] overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <ListFilter className="w-4 h-4 text-cyan-400" />
                    <div>
                      <h3 className="font-bold text-xs text-white">Process Ledger</h3>
                      <div className="text-[10px] text-slate-400">Live list of running processes and resource usage.</div>
                    </div>
                  </div>

                  {/* Filters toolbar (inline with header, REF-07) */}
                  <div className="flex items-center gap-2 text-xs">
                    <input
                      type="text"
                      placeholder="Search processes..."
                      aria-label="Search processes"
                      value={processSearch}
                      onChange={(e) => setProcessSearch(e.target.value)}
                      className="w-[132px] bg-[#050e1f] border border-slate-800 rounded px-2 py-1 text-[11px] text-slate-200 placeholder-slate-500"
                    />
                    <select
                      value={processStatusFilter}
                      aria-label="Filter processes by status"
                      onChange={(e) => setProcessStatusFilter(e.target.value)}
                      className="bg-[#050e1f] border border-slate-800 rounded px-1.5 py-1 text-[10px] font-mono text-slate-300"
                    >
                      <option value="All">Status: All</option>
                      <option value="Running">Running</option>
                      <option value="Suspended">Suspended</option>
                    </select>
                    <select
                      value={processUserFilter}
                      aria-label="Filter processes by user"
                      onChange={(e) => setProcessUserFilter(e.target.value)}
                      className="bg-[#050e1f] border border-slate-800 rounded px-1.5 py-1 text-[10px] font-mono text-slate-300"
                    >
                      <option value="All">User: All</option>
                      <option value="SYSTEM">SYSTEM</option>
                      <option value="User">User</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        setShowProcessSampleList(!showProcessSampleList);
                        showToast(!showProcessSampleList ? 'Process sample ledger loaded' : 'Process ledger cleared to honest awaiting state');
                      }}
                      className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-cyan-300 transition shrink-0"
                      title="Refresh process list"
                      aria-label="Refresh process list"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${showProcessSampleList ? 'text-cyan-400' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Table Ledger or Awaiting State (bounded internal scroller) */}
                <div className="border border-slate-800/80 rounded-xl overflow-hidden bg-[#050e1f] flex-1 min-h-[44px] max-h-[260px] overflow-y-auto knx-custom-scrollbar">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#071329] text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800 sticky top-0 z-10">
                      <tr>
                        <th className="p-2.5">Process Name</th>
                        <th className="p-2.5">PID</th>
                        <th className="p-2.5">CPU</th>
                        <th className="p-2.5">Memory</th>
                        <th className="p-2.5">User</th>
                        <th className="p-2.5 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {showProcessSampleList ? (
                        filteredProcesses.map((p) => (
                          <tr key={p.pid} className="border-b border-slate-800/40 hover:bg-[#0c1f40] transition text-[11px] font-mono">
                            <td className="p-2.5 font-sans font-medium text-slate-200">{p.name}</td>
                            <td className="p-2.5 text-cyan-300">{p.pid}</td>
                            <td className="p-2.5 text-slate-300">{p.cpu}</td>
                            <td className="p-2.5 text-slate-300">{p.memory}</td>
                            <td className="p-2.5 text-slate-400 text-[10px]">{p.user}</td>
                            <td className="p-2.5 text-right">
                              <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-800">
                                {p.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="p-2.5 text-center">
                            <div className="flex flex-wrap items-center justify-center gap-2">
                              <Cog className="w-4 h-4 text-slate-600 animate-spin-slow shrink-0" />
                              <span className="text-[11px] font-semibold text-slate-300">Awaiting process data...</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setShowProcessSampleList(true);
                                  showToast('Sample process inventory loaded');
                                }}
                                className="px-2.5 py-1 rounded bg-[#091833] hover:bg-slate-800 text-[10px] text-cyan-300 border border-slate-700"
                              >
                                Inspect Process Sample (Safe)
                              </button>
                            </div>
                            <div className="text-[10px] text-slate-500 mt-1">
                              Process information will appear here once collection begins.
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* System Services & Diagnostics (12 Domain Tools) */}
              <section className="system-diagnostics-panel p-3.5 rounded-2xl bg-[#071329] border border-slate-800 shadow-md flex flex-col shrink-0">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <LayoutGrid className="w-4 h-4 text-cyan-400" />
                    <div>
                      <h3 className="font-bold text-xs text-white">System Services &amp; Diagnostics</h3>
                      <div className="text-[10px] text-slate-400">Explore system health, events, services, and more.</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800 shrink-0">
                    12 tools available
                  </span>
                </div>

                {/* 12 Service Cards (4 cols x 3 rows) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1.5">
                  {INITIAL_SERVICES_CATALOG.map((svc) => (
                    <button
                      key={svc.id}
                      type="button"
                      onClick={() => setActiveWorkspaceKey(svc.serviceKey)}
                      className="flex items-center gap-2 text-start py-1 px-1.5 rounded-xl bg-[#050e1f] border border-slate-800/90 hover:border-cyan-500/50 hover:bg-[#091833] cursor-pointer transition group"
                    >
                      <div className="w-6 h-6 rounded-lg bg-[#071329] border border-slate-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                        {renderServiceIcon(svc.iconName)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-[11px] leading-tight text-slate-200 group-hover:text-cyan-300 transition truncate">
                          {svc.name}
                        </div>
                        <div className="system-tool-sub text-[10px] leading-tight text-slate-400 truncate">
                          {svc.subtitle}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            </div>

          </div>
        </main>

          {/* 7. Bottom Command Rail (REF-07 — pinned at the bottom of the content column, never outside the viewport) */}
          <div className="flex items-center justify-end gap-2 shrink-0 px-4 pb-3 pt-1 bg-gradient-to-t from-[#030710] via-[#030710]/80 to-transparent">
            <button
              onClick={() => {
                setIsStreamingSample(true);
                setShowProcessSampleList(true);
                showToast('Refreshed all Windows performance and process telemetry.');
              }}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-purple-950/60 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Data</span>
            </button>

            <button
              onClick={() => {
                setShowProcessSampleList(true);
                setActiveWorkspaceKey('system-processes');
              }}
              className="px-3.5 py-1.5 rounded-xl bg-[#091833] hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span>Inspect Processes</span>
            </button>

            <button
              onClick={() => setActiveWorkspaceKey('system-events')}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#091833] hover:bg-slate-800 border border-slate-700 text-slate-300 flex items-center gap-1.5 transition"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>View Events</span>
            </button>

            <button
              onClick={() => {
                showToast('Exported system live telemetry diagnostics package: KNOuX_Pulse_20261024.json');
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#091833] hover:bg-slate-800 border border-slate-700 text-slate-300 flex items-center gap-1.5 transition"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Export Diagnostics</span>
            </button>

            <button
              onClick={() => setActiveWorkspaceKey('system-perf')}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#091833] hover:bg-slate-800 border border-slate-700 text-slate-300 flex items-center gap-1.5 transition"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Settings</span>
            </button>
          </div>
        </div>
      </div>

      {/* 8. Service Workspace Overlay (12 diagnostics tools + KPI instruments) */}
      {activeWorkspaceKey && (
        <SystemWorkspaces
          serviceKey={activeWorkspaceKey}
          onClose={() => setActiveWorkspaceKey(null)}
          isArabic={isArabic}
        />
      )}

    </div>
  );
}
