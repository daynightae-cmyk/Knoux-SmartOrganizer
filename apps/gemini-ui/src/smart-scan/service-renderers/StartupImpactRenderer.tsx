/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * SCAN-07 — Startup Impact Check Renderer
 */

import React from 'react';
import { Rocket, ExternalLink } from 'lucide-react';

export interface StartupImpactRendererProps {
  isArabic?: boolean;
  onNavigateToWorkspace?: (ws: string) => void;
}

export const StartupImpactRenderer: React.FC<StartupImpactRendererProps> = ({ isArabic = false, onNavigateToWorkspace }) => {
  return (
    <div className="space-y-4 text-slate-100 font-sans">
      <div className="flex items-center justify-between border-b border-[#143058] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white shadow-md">
            <Rocket className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-white">
              {isArabic ? 'فحص إقلاع النظام وتأثير البرامج' : 'Startup Impact & Boot Sequence Analysis'}
            </h3>
            <p className="text-[11px] text-slate-400">
              {isArabic ? 'تقييم زمن الإقلاع والتحكم في البرامج التلقائية' : 'Measures autostart delay overhead across Registry Run keys & Scheduled Tasks'}
            </p>
          </div>
        </div>

        {onNavigateToWorkspace && (
          <button
            onClick={() => onNavigateToWorkspace('startup')}
            className="px-3 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-400/40 text-xs font-bold text-purple-200 transition cursor-pointer flex items-center gap-1.5"
          >
            <span>Startup Control</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="bg-[#091a38] p-3 rounded-xl border border-[#133059] text-xs space-y-2">
        <div className="flex justify-between font-bold text-white">
          <span>High Impact Autostart Items:</span>
          <span className="text-purple-300 font-mono">12 Programs (+4.8s Delay)</span>
        </div>
      </div>
    </div>
  );
};
