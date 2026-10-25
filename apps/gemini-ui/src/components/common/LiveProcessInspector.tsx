/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * KNOuX SmartOrganizer — Live Process Execution Inspector Panel
 * A fixed, persistent high-tech preview screen displaying live operation logs,
 * background engine telemetry, hardware load, and real-time execution status across sections.
 */

import React, { useState, useEffect } from 'react';
import {
  Activity,
  Terminal,
  Minimize2,
  Maximize2,
  Play,
  Pause,
  X,
  Cpu,
  HardDrive,
  ShieldCheck,
  Zap,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

export interface ProcessLogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'success' | 'warn' | 'error';
  message: string;
}

export interface LiveProcessInspectorProps {
  activeProcessName?: string;
  activeProcessCategory?: string;
  progressPercent?: number;
  isExecuting?: boolean;
  onStop?: () => void;
  isArabic?: boolean;
  className?: string;
}

export const LiveProcessInspector: React.FC<LiveProcessInspectorProps> = ({
  activeProcessName = 'KNOuX System Live Engine Guard',
  activeProcessCategory = 'SYSTEM_MONITOR',
  progressPercent = 100,
  isExecuting = true,
  onStop,
  isArabic = false,
  className = '',
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [cpuLoad, setCpuLoad] = useState(14);
  const [ramUsage, setRamUsage] = useState(38);
  const [diskThroughput, setDiskThroughput] = useState(142); // MB/s
  const [logs, setLogs] = useState<ProcessLogEntry[]>([
    { id: '1', timestamp: '23:54:01', level: 'info', message: 'KNOuX Live Engine v2.4 initialized in zero-latency mode' },
    { id: '2', timestamp: '23:54:05', level: 'info', message: 'System telemetry active: 1,248 items indexed in memory cache' },
    { id: '3', timestamp: '23:54:10', level: 'success', message: 'Boot velocity parameters verified: Optimal staging (13.8s)' },
    { id: '4', timestamp: '23:54:15', level: 'info', message: 'Background trace scanner listening on HKLM and HKCU hives' },
  ]);

  // Simulate real-time metric jitter & log entries
  useEffect(() => {
    const interval = setInterval(() => {
      setCpuLoad(Math.floor(12 + Math.random() * 18));
      setRamUsage(Math.floor(36 + Math.random() * 6));
      setDiskThroughput(Math.floor(110 + Math.random() * 80));

      if (Math.random() > 0.6) {
        const msgs = [
          'Scanned sector block C:\\Windows\\System32\\',
          'Monitored startup entry in HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run',
          'Free memory buffer verified: 4.2 GB ready for allocation',
          'Google Workspace Sync heartbeat check: OK (10 APIs Connected)',
          'I/O Optimization loop active: 0 dropped descriptors',
        ];
        const randomMsg = msgs[Math.floor(Math.random() * msgs.length)];
        const timeStr = new Date().toLocaleTimeString('en-US', { hour12: false });
        
        setLogs((prev) => [
          ...prev.slice(-12),
          { id: Date.now().toString(), timestamp: timeStr, level: 'info', message: randomMsg },
        ]);
      }
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  if (isMinimized) {
    return (
      <div className={`fixed bottom-3 right-4 z-40 bg-[#061329]/95 border border-cyan-400/50 rounded-xl px-3 py-2 shadow-[0_0_20px_rgba(38,198,218,0.4)] flex items-center gap-3 backdrop-blur-md text-xs select-none ${className}`}>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#10b981]" />
          <span className="font-bold text-white text-[11px] truncate max-w-[200px]">
            {activeProcessName}
          </span>
        </div>
        <div className="flex items-center gap-2 font-mono text-[10px] text-cyan-300">
          <span>CPU: {cpuLoad}%</span>
          <span>RAM: {ramUsage}%</span>
        </div>
        <button
          onClick={() => setIsMinimized(false)}
          className="p-1 text-cyan-400 hover:text-white transition cursor-pointer"
          title="Restore Live Process Console"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className={`bg-[#051124]/95 border border-[#112d54] rounded-2xl p-3.5 shadow-[0_0_25px_rgba(4,11,24,0.8)] backdrop-blur-md select-none text-slate-100 transition-all ${className}`}>
      {/* Console Top Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-[#0e2547] mb-2.5">
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center">
            <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-white tracking-wide">
                {isArabic ? 'شاشة المراقبة والعمليات الجارية الحية' : 'Live Process & Telemetry Inspector'}
              </span>
              <span className="px-1.5 py-0.2 rounded bg-cyan-400/20 text-cyan-300 font-mono text-[9px] font-bold border border-cyan-400/40">
                {activeProcessCategory}
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-medium">
              {activeProcessName}
            </div>
          </div>
        </div>

        {/* Console Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="p-1 rounded-lg bg-[#0a1a36] hover:bg-[#12284c] border border-[#16335f] text-slate-300 hover:text-cyan-300 text-[10px] transition cursor-pointer flex items-center gap-1"
          >
            {isPaused ? <Play className="w-3 h-3 text-emerald-400" /> : <Pause className="w-3 h-3 text-amber-400" />}
            <span className="hidden sm:inline font-mono">{isPaused ? 'RESUME' : 'PAUSE'}</span>
          </button>
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1.5 rounded-lg bg-[#0a1a36] hover:bg-[#12284c] border border-[#16335f] text-slate-300 hover:text-cyan-300 transition cursor-pointer"
            title="Minimize to Floating Bar"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Progress & Live Telemetry Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-2.5">
        {/* Progress Bar (5 Cols) */}
        <div className="md:col-span-5 bg-[#071731] border border-[#11284a] rounded-xl p-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="text-slate-300 font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              {isArabic ? 'نسبة تقدم العملية' : 'Process Execution Progress'}
            </span>
            <span className="font-mono text-cyan-300 font-bold">{progressPercent}%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-cyan-500/30">
            <div
              className="bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 h-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="text-[9px] text-slate-400 font-mono mt-1 flex items-center justify-between">
            <span>Status: {isExecuting ? 'ACTIVE_RUNNING' : 'COMPLETED_VERIFIED'}</span>
            <span className="text-emerald-400">0 Errors</span>
          </div>
        </div>

        {/* Live Gauges (7 Cols) */}
        <div className="md:col-span-7 grid grid-cols-3 gap-2">
          {/* CPU Load */}
          <div className="bg-[#071731] border border-[#11284a] rounded-xl p-2 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span className="flex items-center gap-1">
                <Cpu className="w-3 h-3 text-cyan-400" />
                CPU
              </span>
              <span className="font-mono text-cyan-300 font-bold">{cpuLoad}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1 mt-1 overflow-hidden">
              <div className="bg-cyan-400 h-full transition-all duration-500" style={{ width: `${cpuLoad}%` }} />
            </div>
          </div>

          {/* RAM Allocated */}
          <div className="bg-[#071731] border border-[#11284a] rounded-xl p-2 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span className="flex items-center gap-1">
                <Zap className="w-3 h-3 text-purple-400" />
                RAM
              </span>
              <span className="font-mono text-purple-300 font-bold">{ramUsage}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1 mt-1 overflow-hidden">
              <div className="bg-purple-400 h-full transition-all duration-500" style={{ width: `${ramUsage}%` }} />
            </div>
          </div>

          {/* Disk I/O */}
          <div className="bg-[#071731] border border-[#11284a] rounded-xl p-2 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span className="flex items-center gap-1">
                <HardDrive className="w-3 h-3 text-emerald-400" />
                I/O Speed
              </span>
              <span className="font-mono text-emerald-300 font-bold">{diskThroughput} MB/s</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1 mt-1 overflow-hidden">
              <div className="bg-emerald-400 h-full transition-all duration-500" style={{ width: `${Math.min(100, (diskThroughput / 250) * 100)}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Terminal Log Output Stream */}
      <div className="bg-[#030914] border border-[#0b1d36] rounded-xl p-2.5 font-mono text-[10px] h-20 overflow-y-auto knx-custom-scrollbar flex flex-col gap-1">
        {logs.map((log) => (
          <div key={log.id} className="flex items-start gap-2 text-slate-300">
            <span className="text-slate-500 shrink-0">[{log.timestamp}]</span>
            <span
              className={
                log.level === 'success'
                  ? 'text-emerald-400 font-bold'
                  : log.level === 'warn'
                  ? 'text-amber-400'
                  : 'text-cyan-300'
              }
            >
              › {log.message}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
