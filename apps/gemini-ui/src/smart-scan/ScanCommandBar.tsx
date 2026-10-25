/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * KNOuX SmartOrganizer — Scan Fixed Bottom Desktop Command Bar
 */

import React from 'react';
import { Target, Download, Sparkles } from 'lucide-react';

export interface ScanCommandBarProps {
  selectedCount: number;
  totalSizeGB: string;
  onReviewSelection: () => void;
  onExportReport: () => void;
  onCancel: () => void;
  onRunSmartCleanup: () => void;
  isArabic?: boolean;
}

export const ScanCommandBar: React.FC<ScanCommandBarProps> = ({
  selectedCount,
  totalSizeGB,
  onReviewSelection,
  onExportReport,
  onCancel,
  onRunSmartCleanup,
  isArabic = false,
}) => {
  return (
    <div className="sticky bottom-0 bg-[#061226]/95 border border-[#11294a] backdrop-blur-md rounded-2xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-[0_0_20px_rgba(0,0,0,0.6)] z-30 shrink-0">
      {/* Left Selection Aggregation Status */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shrink-0">
          <Target className="w-4 h-4" />
        </div>
        <div>
          <div className="text-xs font-black text-white">
            {selectedCount.toLocaleString()} {isArabic ? 'عنصر محدد' : 'items selected'}
            <span className="text-cyan-300 ml-2 font-mono font-bold">({totalSizeGB} GB)</span>
          </div>
          <div className="text-[10px] text-slate-400">
            {isArabic ? 'جاهز للتنظيف والاستعادة الآمنة' : 'Ready for safe optimization and cleanup'}
          </div>
        </div>
      </div>

      {/* Right Command Actions */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={onReviewSelection}
          className="px-3 py-1.5 rounded-xl bg-[#0c1f3d] hover:bg-[#132c52] border border-[#173866] text-xs text-slate-200 font-bold transition cursor-pointer"
        >
          {isArabic ? 'مراجعة المحدد' : 'Review Selection'}
        </button>
        <button
          onClick={onExportReport}
          className="px-3 py-1.5 rounded-xl bg-[#0c1f3d] hover:bg-[#132c52] border border-[#173866] text-xs text-slate-200 font-bold transition cursor-pointer flex items-center gap-1.5"
        >
          <Download className="w-3.5 h-3.5 text-cyan-400" />
          <span>{isArabic ? 'تصدير التقرير' : 'Export Report'}</span>
        </button>
        <button
          onClick={onCancel}
          className="px-3 py-1.5 rounded-xl bg-[#0c1f3d] hover:bg-[#132c52] border border-[#173866] text-xs text-slate-400 font-bold transition cursor-pointer"
        >
          {isArabic ? 'إلغاء' : 'Cancel'}
        </button>
        <button
          onClick={onRunSmartCleanup}
          className="px-5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-500 hover:from-blue-500 hover:to-cyan-400 text-white text-xs font-black shadow-[0_0_20px_rgba(37,99,235,0.7)] border border-cyan-300/50 transition duration-200 cursor-pointer flex items-center gap-2 transform hover:scale-[1.02]"
        >
          <Sparkles className="w-4 h-4 text-white animate-bounce" />
          <span>{isArabic ? 'تشغيل التنظيف الذكي ←' : 'Run Smart Cleanup →'}</span>
        </button>
      </div>
    </div>
  );
};
