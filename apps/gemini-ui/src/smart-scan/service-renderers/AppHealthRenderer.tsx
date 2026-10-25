/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * SCAN-08 — App Health Review Renderer
 */

import React from 'react';
import { Grid, ExternalLink } from 'lucide-react';

export interface AppHealthRendererProps {
  isArabic?: boolean;
  onNavigateToWorkspace?: (ws: string) => void;
}

export const AppHealthRenderer: React.FC<AppHealthRendererProps> = ({ isArabic = false, onNavigateToWorkspace }) => {
  return (
    <div className="space-y-4 text-slate-100 font-sans">
      <div className="flex items-center justify-between border-b border-[#143058] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-md">
            <Grid className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-white">
              {isArabic ? 'مراجعة صحة البرامج والتطبيقات' : 'Application Health & Unused Software Audit'}
            </h3>
            <p className="text-[11px] text-slate-400">
              {isArabic ? 'تقييم 358 تطبيقاً مثبتة وكشف بقايا البرامج' : 'Audits 358 installed software packages, outdated versions & orphaned folders'}
            </p>
          </div>
        </div>

        {onNavigateToWorkspace && (
          <button
            onClick={() => onNavigateToWorkspace('applications')}
            className="px-3 py-1.5 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 border border-blue-400/40 text-xs font-bold text-blue-200 transition cursor-pointer flex items-center gap-1.5"
          >
            <span>Applications Hub</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="bg-[#091a38] p-3 rounded-xl border border-[#133059] text-xs space-y-2">
        <div className="flex justify-between font-bold text-white">
          <span>Unused App Candidates:</span>
          <span className="text-cyan-300 font-mono">14 Software (8.2 GB Total)</span>
        </div>
      </div>
    </div>
  );
};
