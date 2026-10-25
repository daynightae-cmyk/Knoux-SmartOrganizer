/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * KNOuX SmartOrganizer — Recent Scans List Widget
 */

import React from 'react';
import { Clock, CheckCircle2 } from 'lucide-react';
import { RecentScanRecord } from './smartScan.types';

export interface RecentScansProps {
  records: RecentScanRecord[];
  isArabic?: boolean;
}

export const RecentScans: React.FC<RecentScansProps> = ({ records, isArabic = false }) => {
  return (
    <div className="bg-[#071329]/80 border border-[#11294a] rounded-2xl p-3 flex flex-col gap-2 shadow-lg">
      <div className="flex items-center justify-between text-xs font-bold text-white mb-1">
        <span className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          {isArabic ? 'الفحوصات الأخيرة' : 'Recent Scans'}
        </span>
        <span className="text-[10px] text-cyan-400 hover:underline cursor-pointer">
          {isArabic ? 'عرض الكل' : 'View All'}
        </span>
      </div>

      <div className="space-y-1.5">
        {records.map((rec) => (
          <div
            key={rec.id}
            className="flex items-center justify-between text-[11px] bg-[#0b1a33] p-2 rounded-xl border border-[#122c54]"
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <div className="truncate">
                <div className="font-bold text-white truncate">{isArabic ? rec.titleAr : rec.titleEn}</div>
                <div className="text-[9px] text-slate-400 font-mono">
                  {rec.itemCount.toLocaleString()} items | {rec.sizeGB} GB
                </div>
              </div>
            </div>
            <span className="text-[9px] text-slate-400 font-mono shrink-0 ml-1">
              {isArabic ? rec.timeDisplayAr : rec.timeDisplayEn}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
