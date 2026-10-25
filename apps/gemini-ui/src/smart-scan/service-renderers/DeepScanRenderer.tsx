/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * SCAN-02 — Deep Scan Renderer
 */

import React, { useState } from 'react';
import { Search, HardDrive, Filter, CheckCircle2, ShieldAlert } from 'lucide-react';

export interface DeepScanRendererProps {
  isArabic?: boolean;
}

export const DeepScanRenderer: React.FC<DeepScanRendererProps> = ({ isArabic = false }) => {
  const [scanDepth, setScanDepth] = useState<'Thorough' | 'Extreme' | 'Exhaustive'>('Thorough');

  return (
    <div className="space-y-4 text-slate-100 font-sans">
      <div className="flex items-center gap-2.5 border-b border-[#143058] pb-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-blue-500 flex items-center justify-center text-white shadow-md">
          <Search className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-extrabold text-sm text-white">
            {isArabic ? 'مركز الفحص الشامل والعميق' : 'Deep System Analysis Workspace'}
          </h3>
          <p className="text-[11px] text-slate-400">
            {isArabic ? 'فحص كامل لكافة القطاعات والملفات المخفية وحزم البيانات' : 'Exhaustive sector analysis across all mounted volumes and registry hives'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {['Thorough', 'Extreme', 'Exhaustive'].map((d) => (
          <button
            key={d}
            onClick={() => setScanDepth(d as any)}
            className={`p-2.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
              scanDepth === d ? 'bg-indigo-600 text-white border-cyan-400' : 'bg-[#091a38] text-slate-300 border-[#133059]'
            }`}
          >
            {d} Depth
          </button>
        ))}
      </div>

      <div className="bg-[#091a38] p-3 rounded-xl border border-[#133059] space-y-2 text-xs">
        <div className="flex justify-between font-bold text-slate-200">
          <span>Target Drives:</span>
          <span className="text-cyan-300 font-mono">C:\ (NVMe SSD) & D:\ (Data Atlas)</span>
        </div>
        <div className="flex justify-between text-slate-400">
          <span>Scan Rule Engine:</span>
          <span className="text-emerald-400 font-mono">All 238,429 Indexed File Nodes</span>
        </div>
      </div>
    </div>
  );
};
