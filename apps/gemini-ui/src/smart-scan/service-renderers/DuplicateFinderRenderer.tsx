/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * SCAN-03 — Duplicate Finder Renderer
 */

import React from 'react';
import { Copy, Layers, ExternalLink } from 'lucide-react';

export interface DuplicateFinderRendererProps {
  isArabic?: boolean;
  onNavigateToWorkspace?: (ws: string) => void;
}

export const DuplicateFinderRenderer: React.FC<DuplicateFinderRendererProps> = ({
  isArabic = false,
  onNavigateToWorkspace,
}) => {
  return (
    <div className="space-y-4 text-slate-100 font-sans">
      <div className="flex items-center justify-between border-b border-[#143058] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-teal-400 flex items-center justify-center text-white shadow-md">
            <Copy className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-white">
              {isArabic ? 'مكتشف المكررات والمقارنة البصرية' : 'Duplicate Finder & Hash Matching'}
            </h3>
            <p className="text-[11px] text-slate-400">
              {isArabic ? 'مقارنة الملفات المتطابقة في المحتوى والهاش SHA-256' : 'Exact SHA-256 hash comparison & visual similarity analysis'}
            </p>
          </div>
        </div>

        {onNavigateToWorkspace && (
          <button
            onClick={() => onNavigateToWorkspace('storage')}
            className="px-3 py-1.5 rounded-xl bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-400/40 text-xs font-bold text-cyan-200 transition cursor-pointer flex items-center gap-1.5"
          >
            <span>Storage Atlas</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="bg-[#091a38] p-3 rounded-xl border border-[#133059] text-xs space-y-2">
        <div className="flex justify-between text-slate-200 font-bold">
          <span>Identified Clusters:</span>
          <span className="text-cyan-300 font-mono">216 Groups (4.3 GB Reclaimable)</span>
        </div>
        <p className="text-[11px] text-slate-400">
          KNOuX compares exact binary hashes. Safety rules require user confirmation before moving candidate copies.
        </p>
      </div>
    </div>
  );
};
