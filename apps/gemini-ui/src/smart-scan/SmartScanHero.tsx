/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * KNOuX SmartOrganizer — Smart Scan Hero Section
 * Fully un-squished, pristine, shrink-0 header matching image_51a1aa50.png
 */

import React from 'react';
import { Target } from 'lucide-react';

export interface SmartScanHeroProps {
  isArabic?: boolean;
}

export const SmartScanHero: React.FC<SmartScanHeroProps> = ({ isArabic = false }) => {
  return (
    <div className="shrink-0 min-h-fit relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#061833] via-[#0b264e] to-[#06142a] border border-cyan-400/40 p-4 sm:p-5 shadow-[0_0_25px_rgba(14,165,233,0.22)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      {/* Planetary Horizon Ambient Glow */}
      <div className="absolute -top-10 -right-10 w-80 h-80 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="z-10 flex items-center gap-3.5">
        {/* Glowing HUD Icon Emblem */}
        <div className="relative w-12 h-12 rounded-xl bg-gradient-to-tr from-[#1e40af] via-[#2563eb] to-[#38bdf8] flex items-center justify-center shadow-[0_0_18px_rgba(56,189,248,0.6)] border border-cyan-300/60 shrink-0">
          <Target className="w-6 h-6 text-white animate-pulse" />
          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-cyan-400 border-2 border-[#061833] animate-ping" />
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2 mb-0.5">
            <span className="px-2 py-0.5 rounded bg-cyan-400/20 text-cyan-200 text-[10px] font-mono font-bold tracking-wider uppercase border border-cyan-400/40">
              KNOuX AI Engine v2.4
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 text-[10px] font-mono font-bold flex items-center gap-1 border border-emerald-500/40">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {isArabic ? 'حماية فائقة مفعلة' : 'Zero-Threat Guard Active'}
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-cyan-300 tracking-tight leading-snug">
            {isArabic ? 'الفحص الذكي' : 'Smart Scan'}
          </h1>
          <p className="text-xs text-slate-300 max-w-2xl font-medium leading-relaxed">
            {isArabic
              ? 'تحليل جهازك، اكتشاف المخلفات، المخاطر، الملفات المكررة وفرص تحسين الأداء.'
              : 'Analyze your device, detect clutter, risks, duplicates, and optimization opportunities.'}
          </p>
        </div>
      </div>

      <div className="z-10 text-right md:text-end bg-cyan-950/40 px-3.5 py-2 rounded-xl border border-cyan-500/20 shrink-0">
        <span className="text-[11px] font-semibold text-cyan-300 tracking-wide block leading-tight">
          {isArabic ? (
            <>
              افحص بذكاء.<br />غدًا أنظف وأسرع وأكثر أمانًا.
            </>
          ) : (
            <>
              Scan smarter.<br />A cleaner, faster,<br />safer tomorrow.
            </>
          )}
        </span>
      </div>
    </div>
  );
};
