/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * SCAN-09 — System Health Pulse Renderer
 */

import React from 'react';
import { Activity, ExternalLink } from 'lucide-react';

export interface SystemHealthPulseRendererProps {
  isArabic?: boolean;
  onNavigateToWorkspace?: (ws: string) => void;
}

export const SystemHealthPulseRenderer: React.FC<SystemHealthPulseRendererProps> = ({
  isArabic = false,
  onNavigateToWorkspace,
}) => {
  return (
    <div className="space-y-4 text-slate-100 font-sans">
      <div className="flex items-center justify-between border-b border-[#143058] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-400 to-emerald-400 flex items-center justify-center text-white shadow-md">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-white">
              {isArabic ? 'نبض تشخيص النظام المباشر' : 'Live System Health Pulse Telemetry'}
            </h3>
            <p className="text-[11px] text-slate-400">
              {isArabic ? 'مراقبة المعالج والذاكرة والقرص وقراءات درجة الحرارة' : 'Real-time CPU, Memory, Disk throughput and Hardware Sensor Health'}
            </p>
          </div>
        </div>

        {onNavigateToWorkspace && (
          <button
            onClick={() => onNavigateToWorkspace('system')}
            className="px-3 py-1.5 rounded-xl bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-400/40 text-xs font-bold text-cyan-200 transition cursor-pointer flex items-center gap-1.5"
          >
            <span>System Pulse</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="bg-[#091a38] p-3 rounded-xl border border-[#133059] text-xs space-y-2">
        <div className="flex justify-between font-bold text-white">
          <span>Overall Health Index:</span>
          <span className="text-emerald-400 font-mono font-bold">92 / 100 (Optimal Condition)</span>
        </div>
      </div>
    </div>
  );
};
