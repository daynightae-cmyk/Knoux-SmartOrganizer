/**
 * KNOuX SmartOrganizer — Execution Monitor Workspace (Stage 7)
 */

import React, { useState, useEffect } from 'react';
import {
  Activity,
  CheckCircle,
  Pause,
  Play,
  RotateCcw,
  ShieldCheck,
  ArrowRight,
  HardDrive,
  FileCheck,
} from 'lucide-react';
import { useStudio } from '../context';

export function ExecutionMonitor() {
  const { setActiveStageId, operationMode, locale } = useStudio();

  const [isRunning, setIsRunning] = useState(true);
  const [progressPercent, setProgressPercent] = useState(42);
  const [processedCount, setProcessedCount] = useState(1363);
  const totalCount = 3246;
  const [currentFile, setCurrentFile] = useState('E:\\Media\\ocean-sunset.jpg');

  // Simulated tick for demo progression
  useEffect(() => {
    if (!isRunning || progressPercent >= 100) return;
    const interval = setInterval(() => {
      setProgressPercent((prev) => {
        if (prev >= 100) return 100;
        return Math.min(100, prev + 2);
      });
      setProcessedCount((prev) => Math.min(totalCount, prev + 65));
    }, 400);

    return () => clearInterval(interval);
  }, [isRunning, progressPercent]);

  return (
    <div className="flex-1 px-6 py-2 overflow-y-auto studio-scrollbar select-none">
      <div className="max-w-5xl mx-auto space-y-4">
        {/* Banner */}
        <div className="studio-glass-panel rounded-xl p-5 border border-[#132c52] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <Activity className="w-4 h-4 animate-pulse" />
              <span>{locale === 'en' ? 'Secured Transaction Engine' : 'محرك العمليات المحمي'}</span>
            </div>
            <h2 className="text-xl font-bold text-white">
              {progressPercent >= 100
                ? locale === 'en'
                  ? 'Organization Completed Successfully'
                  : 'اكتملت عملية التنظيم بنجاح'
                : locale === 'en'
                ? 'Executing Plan in Progress...'
                : 'جاري تنفيذ خطة التنظيم...'}
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              {locale === 'en'
                ? 'All operations are atomic and logged to the journal ledger. If interrupted, the state will be rollbacked cleanly.'
                : 'جميع العمليات ذرية ومسجلة في دفتر السجل. في حال التوقف، سيتم استرجاع الحالة نظيفة.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {progressPercent < 100 ? (
              <button
                onClick={() => setIsRunning(!isRunning)}
                className="px-4 py-2 rounded-lg bg-[#0e2447] hover:bg-[#153463] text-cyan-300 border border-[#2476ff]/50 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {isRunning ? (
                  <>
                    <Pause className="w-3.5 h-3.5" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    <span>Resume</span>
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={() => setActiveStageId(8)} // Stage 8 History & Undo
                className="px-4 py-2 rounded-lg bg-[#2476ff] hover:bg-[#3282ff] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-[0_0_12px_rgba(36,118,255,0.5)] cursor-pointer"
              >
                <span>{locale === 'en' ? 'Open History & Journal' : 'فتح السجل والتراجع'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Progress Card */}
        <div className="studio-glass-panel rounded-xl p-5 border border-[#132c52] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-white font-mono">{progressPercent}%</span>
              <span className="text-xs text-slate-400">
                ({processedCount.toLocaleString()} / {totalCount.toLocaleString()} files)
              </span>
            </div>

            <div className="text-xs font-mono text-cyan-300 flex items-center gap-3">
              <span>Transfer Rate: 168.4 MB/s</span>
              <span>•</span>
              <span>ETA: {progressPercent >= 100 ? '0s' : '14s'}</span>
            </div>
          </div>

          {/* Glowing Progress bar */}
          <div className="w-full h-3 rounded-full bg-[#050e1a] overflow-hidden p-0.5 border border-[#102747]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#2476ff] via-[#26c6ff] to-[#713bff] shadow-[0_0_15px_#26c6ff] transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Current file log stream */}
          <div className="p-3 rounded-lg bg-[#050e1c] border border-[#102747] font-mono text-xs text-slate-300 flex items-center justify-between">
            <span className="text-slate-500 text-[10px] uppercase font-bold">Current Processing:</span>
            <span className="text-cyan-300 truncate max-w-lg">{currentFile}</span>
            <span className="text-emerald-400 text-[10px] font-bold">VERIFIED HASH</span>
          </div>
        </div>
      </div>
    </div>
  );
}
