/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * KNOuX SmartOrganizer — Findings Breakdown Doughnut Chart Visualization
 */

import React from 'react';
import { Activity } from 'lucide-react';
import { BreakdownCategory } from './smartScan.types';

export interface FindingsBreakdownProps {
  categories: BreakdownCategory[];
  totalReclaimableGB?: number;
  isArabic?: boolean;
}

export const FindingsBreakdown: React.FC<FindingsBreakdownProps> = ({
  categories,
  totalReclaimableGB = 48.6,
  isArabic = false,
}) => {
  return (
    <div className="bg-[#071329]/80 border border-[#11294a] rounded-2xl p-3.5 flex flex-col justify-between gap-3 shadow-lg">
      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-extrabold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            {isArabic ? 'تفصيل النتائج' : 'Findings Breakdown'}
          </h3>
          <span className="text-[10px] text-slate-400 font-mono">By Category</span>
        </div>

        {/* SVG Donut Chart */}
        <div className="relative flex flex-col items-center justify-center my-2.5">
          <svg className="w-32 h-32 sm:w-36 sm:h-36 transform -rotate-90" viewBox="0 0 36 36">
            {/* Background Ring */}
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="#0f2647"
              strokeWidth="3.8"
            />
            {/* Donut Segment 1 - Temp files 26% */}
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 15.1 11"
              fill="none"
              stroke="#2563eb"
              strokeWidth="3.8"
            />
            {/* Donut Segment 2 - Large files 34% */}
            <path
              d="M33.1 13.0845 a 15.9155 15.9155 0 0 1 -18 20.8"
              fill="none"
              stroke="#ec4899"
              strokeWidth="3.8"
            />
            {/* Donut Segment 3 - Browser cache 14% */}
            <path
              d="M15.1 33.8845 a 15.9155 15.9155 0 0 1 -13 -10"
              fill="none"
              stroke="#a855f7"
              strokeWidth="3.8"
            />
            {/* Donut Segment 4 - Duplicates 9% */}
            <path
              d="M2.1 23.8845 a 15.9155 15.9155 0 0 1 2.8 -12"
              fill="none"
              stroke="#f59e0b"
              strokeWidth="3.8"
            />
            {/* Donut Segment 5 - Privacy & Residue */}
            <path
              d="M4.9 11.8845 a 15.9155 15.9155 0 0 1 13.1 -9.8"
              fill="none"
              stroke="#06b6d4"
              strokeWidth="3.8"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="text-sm sm:text-base font-black text-white">{totalReclaimableGB} GB</span>
            <span className="text-[10px] text-cyan-300 font-semibold">
              {isArabic ? 'قابل للاستعادة' : 'Reclaimable'}
            </span>
          </div>
        </div>

        {/* Donut Legend List */}
        <div className="space-y-1 text-[11px] border-t border-[#0e223d] pt-2.5">
          {categories.map((c, i) => (
            <div key={i} className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-1.5 truncate">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: c.colorHex }} />
                <span className="truncate">{isArabic ? c.labelAr : c.labelEn}</span>
              </span>
              <span className="font-mono text-slate-300 font-medium shrink-0 ml-1">
                {c.sizeGB} GB ({c.percentage}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
