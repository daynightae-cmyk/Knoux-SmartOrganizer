/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * SCAN-01 — Quick Scan Renderer
 */

import React, { useState, useEffect } from 'react';
import { Zap, Play, Pause, RotateCcw, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

export interface QuickScanRendererProps {
  isArabic?: boolean;
  onClose?: () => void;
}

export const QuickScanRenderer: React.FC<QuickScanRendererProps> = ({ isArabic = false, onClose }) => {
  const [stage, setStage] = useState<'Initialize' | 'Discover' | 'Analyze' | 'Classify' | 'Review'>('Initialize');
  const [progress, setProgress] = useState(0);
  const [isRunning, setIsRunning] = useState(true);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setIsRunning(false);
          setStage('Review');
          return 100;
        }
        const next = prev + 5;
        if (next < 25) setStage('Initialize');
        else if (next < 50) setStage('Discover');
        else if (next < 75) setStage('Analyze');
        else if (next < 95) setStage('Classify');
        else setStage('Review');
        return next;
      });
    }, 150);
    return () => clearInterval(interval);
  }, [isRunning]);

  return (
    <div className="space-y-4 text-slate-100 font-sans">
      <div className="flex items-center justify-between border-b border-[#143058] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-500 to-cyan-400 flex items-center justify-center text-white shadow-md">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm text-white">
                {isArabic ? 'مركز الفحص السريع' : 'Quick Scan Control Center'}
              </h3>
              <span className="px-1.5 py-0.2 rounded bg-cyan-400/20 text-cyan-300 font-mono text-[9px] font-bold border border-cyan-400/40">
                SIMULATION FIXTURE
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {isArabic ? 'فحص المناطق الجوهرية والملفات الأكثر استهلاكاً' : 'Scans essential system areas, active temp hives & memory buffers'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setProgress(0);
              setIsRunning(true);
              setStage('Initialize');
            }}
            className="px-3 py-1.5 rounded-lg bg-[#0b1c38] hover:bg-[#122b52] border border-[#173a6e] text-xs font-bold text-cyan-300 transition flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restart</span>
          </button>
        </div>
      </div>

      {/* Progress & Lifecycle Stages */}
      <div className="bg-[#091a38] border border-[#133059] rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            Stage: <span className="text-cyan-300 font-mono">{stage}</span>
          </span>
          <span className="font-mono text-cyan-300 font-bold">{progress}%</span>
        </div>

        <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden border border-cyan-500/30">
          <div
            className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="grid grid-cols-5 gap-1 text-[10px] text-center font-mono font-bold">
          {['Initialize', 'Discover', 'Analyze', 'Classify', 'Review'].map((stg) => (
            <span
              key={stg}
              className={`p-1 rounded ${
                stage === stg ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50' : 'text-slate-500'
              }`}
            >
              {stg}
            </span>
          ))}
        </div>
      </div>

      {/* Checklist Scope */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-[#071731] p-2.5 rounded-lg border border-[#11284a] flex items-center justify-between">
          <span>Windows System Temp (C:\Windows\Temp)</span>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
        </div>
        <div className="bg-[#071731] p-2.5 rounded-lg border border-[#11284a] flex items-center justify-between">
          <span>Browser Active Cache (Chrome / Edge)</span>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
        </div>
      </div>
    </div>
  );
};
