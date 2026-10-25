/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * SCAN-04 — Large Files Review Renderer
 */

import React from 'react';
import { HardDrive, ExternalLink } from 'lucide-react';

export interface LargeFilesRendererProps {
  isArabic?: boolean;
  onNavigateToWorkspace?: (ws: string) => void;
}

export const LargeFilesRenderer: React.FC<LargeFilesRendererProps> = ({ isArabic = false, onNavigateToWorkspace }) => {
  return (
    <div className="space-y-4 text-slate-100 font-sans">
      <div className="flex items-center justify-between border-b border-[#143058] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-white shadow-md">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-white">
              {isArabic ? 'مراجعة الملفات الضخمة' : 'Large Files & Treemap Review'}
            </h3>
            <p className="text-[11px] text-slate-400">
              {isArabic ? 'تصنيف واستعراض أكبر الملفات حسماً للمساحة' : 'Identifies high-capacity video renders, installers and virtual disk images'}
            </p>
          </div>
        </div>

        {onNavigateToWorkspace && (
          <button
            onClick={() => onNavigateToWorkspace('storage')}
            className="px-3 py-1.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-400/40 text-xs font-bold text-emerald-200 transition cursor-pointer flex items-center gap-1.5"
          >
            <span>Storage Atlas</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="bg-[#091a38] p-3 rounded-xl border border-[#133059] text-xs space-y-2">
        <div className="flex justify-between font-bold text-white">
          <span>Files &gt; 500 MB:</span>
          <span className="text-emerald-300 font-mono">187 Items (16.6 GB Total)</span>
        </div>
      </div>
    </div>
  );
};
