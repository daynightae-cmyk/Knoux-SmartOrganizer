/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * SCAN-05 — Junk Cleaner Renderer
 */

import React from 'react';
import { Trash2, ExternalLink, ShieldCheck } from 'lucide-react';

export interface JunkCleanerRendererProps {
  isArabic?: boolean;
  onNavigateToWorkspace?: (ws: string) => void;
}

export const JunkCleanerRenderer: React.FC<JunkCleanerRendererProps> = ({ isArabic = false, onNavigateToWorkspace }) => {
  return (
    <div className="space-y-4 text-slate-100 font-sans">
      <div className="flex items-center justify-between border-b border-[#143058] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center text-white shadow-md">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-white">
              {isArabic ? 'منظف المخلفات المؤقتة والكاش' : 'Junk & System Cache Cleaner'}
            </h3>
            <p className="text-[11px] text-slate-400">
              {isArabic ? 'تنظيف آمن لملفات المؤقت وسجلات النظام وسلة المهملات' : 'Non-destructive purging of temp hives, WER logs and leftover caches'}
            </p>
          </div>
        </div>

        {onNavigateToWorkspace && (
          <button
            onClick={() => onNavigateToWorkspace('cleanup')}
            className="px-3 py-1.5 rounded-xl bg-rose-600/30 hover:bg-rose-600/50 border border-rose-400/40 text-xs font-bold text-rose-200 transition cursor-pointer flex items-center gap-1.5"
          >
            <span>Cleanup Lab</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="bg-[#091a38] p-3 rounded-xl border border-[#133059] text-xs space-y-2">
        <div className="flex justify-between font-bold text-white">
          <span>Safe Reclaimable Junk:</span>
          <span className="text-rose-300 font-mono">12.6 GB (1,243 Items)</span>
        </div>
      </div>
    </div>
  );
};
