/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * SCAN-10 — Smart Recommendations Renderer
 */

import React from 'react';
import { Lightbulb, Sparkles, CheckCircle2 } from 'lucide-react';

export interface SmartRecommendationsRendererProps {
  isArabic?: boolean;
}

export const SmartRecommendationsRenderer: React.FC<SmartRecommendationsRendererProps> = ({ isArabic = false }) => {
  return (
    <div className="space-y-4 text-slate-100 font-sans">
      <div className="flex items-center gap-2.5 border-b border-[#143058] pb-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-md">
          <Lightbulb className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-extrabold text-sm text-white">
              {isArabic ? 'توصيات الذكاء الاصطناعي المخصصة' : 'Smart AI Recommendations Workbench'}
            </h3>
            <span className="px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 font-mono text-[9px] font-bold border border-amber-400/40">
              AI INSIGHTS
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            {isArabic ? 'تحليلات ذكية ومقترحات تحسين مخصصة بناءً على نمط استخدام الجهاز' : 'Prioritized optimization tasks generated from system usage patterns'}
          </p>
        </div>
      </div>

      <div className="bg-[#091a38] p-3 rounded-xl border border-[#133059] text-xs space-y-2">
        <div className="flex items-center gap-2 text-amber-300 font-bold">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Top Recommendation: Stagger startup delay for 3 heaviest background apps (+2.1s gain)</span>
        </div>
      </div>
    </div>
  );
};
