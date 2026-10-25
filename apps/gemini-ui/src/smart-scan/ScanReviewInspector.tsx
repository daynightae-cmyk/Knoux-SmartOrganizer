/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * KNOuX SmartOrganizer — Scan Review Right Inspector Panel
 */

import React from 'react';
import { Info, X, ShieldCheck, Check } from 'lucide-react';
import { ScanResultItem } from './smartScan.types';

export interface ScanReviewInspectorProps {
  selectedItem: ScanResultItem;
  onClose?: () => void;
  onTogglePathCheck?: (itemId: string, pathId: string) => void;
  isArabic?: boolean;
}

export const ScanReviewInspector: React.FC<ScanReviewInspectorProps> = ({
  selectedItem,
  onClose,
  onTogglePathCheck,
  isArabic = false,
}) => {
  return (
    <div className="bg-[#071329]/90 border border-[#11294a] rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between gap-3 shadow-lg h-full overflow-y-auto knx-custom-scrollbar">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#0f2545] pb-2 mb-3">
          <h3 className="text-xs font-extrabold text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-cyan-400" />
            {isArabic ? 'مراجعة التفاصيل' : 'Scan Review'}
          </h3>
          {onClose && (
            <button onClick={onClose} className="text-slate-400 hover:text-white transition cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Selected Item Card */}
        <div className="bg-[#0c203f] p-3 rounded-xl border border-cyan-500/30 mb-3">
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-white text-xs sm:text-sm truncate">
              {isArabic ? selectedItem.nameAr : selectedItem.nameEn}
            </h4>
            <span className="px-2 py-0.5 rounded-full bg-purple-900/60 text-purple-300 text-[9px] font-bold border border-purple-500/40 shrink-0 ml-1">
              {isArabic ? selectedItem.categoryLabelAr : selectedItem.categoryLabelEn}
            </span>
          </div>
          <p className="text-[11px] text-slate-300 mt-1">
            {isArabic ? selectedItem.descriptionAr : selectedItem.descriptionEn}
          </p>
          <div className="text-xs font-mono font-bold text-cyan-300 mt-2">
            {selectedItem.itemCount.toLocaleString()} {isArabic ? 'عنصر' : 'items'} | {selectedItem.sizeGB > 0 ? `${selectedItem.sizeGB} GB` : ''}
          </div>
        </div>

        {/* Impact & Safety Metrics */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-[#0b1b36] p-2.5 rounded-xl border border-[#142e54]">
            <span className="text-[10px] text-slate-400 block mb-0.5 font-medium">
              {isArabic ? 'التأثير المتوقع' : 'Estimated Impact'}
            </span>
            <div className="font-extrabold text-cyan-300 text-xs truncate">
              {selectedItem.sizeGB > 0 ? `${selectedItem.sizeGB} GB` : 'High'}
            </div>
            <span className="text-[9px] text-slate-400">Can be safely reclaimed</span>
          </div>
          <div className="bg-[#0b1b36] p-2.5 rounded-xl border border-[#142e54]">
            <span className="text-[10px] text-slate-400 block mb-0.5 font-medium">
              {isArabic ? 'مستوى الأمان' : 'Safety Level'}
            </span>
            <div className="flex items-center gap-1 font-extrabold text-emerald-400 text-xs">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{isArabic ? 'آمن' : 'Safe'}</span>
            </div>
            <span className="text-[9px] text-slate-400">No important files</span>
          </div>
        </div>

        {/* Description Paragraph */}
        <p className="text-[11px] text-slate-300 bg-[#091830] p-2.5 rounded-xl border border-[#112747] leading-relaxed mb-3">
          {isArabic ? selectedItem.detailedDescriptionAr : selectedItem.detailedDescriptionEn}
        </p>

        {/* Preview Top Items with Checkboxes */}
        <div>
          <div className="flex items-center justify-between text-xs font-bold text-slate-200 mb-1.5">
            <span>{isArabic ? 'معاينة المسارات (أهم العناصر)' : 'Preview (Top Items)'}</span>
            <span className="text-[10px] text-cyan-400 hover:underline cursor-pointer">
              {isArabic ? 'عرض الكل' : 'View All'}
            </span>
          </div>
          <div className="space-y-1.5 max-h-40 overflow-y-auto knx-custom-scrollbar">
            {selectedItem.pathsPreview.map((p) => (
              <div key={p.id} className="flex items-center justify-between text-[10px] bg-[#08152b] p-1.5 rounded-lg border border-[#0f2442]">
                <div className="flex items-center gap-1.5 overflow-hidden">
                  <input
                    type="checkbox"
                    checked={p.selected}
                    onChange={() => onTogglePathCheck && onTogglePathCheck(selectedItem.id, p.id)}
                    className="rounded bg-slate-800 border-slate-600 text-cyan-500 focus:ring-0 cursor-pointer"
                  />
                  <span className="font-mono text-slate-300 truncate">{p.path}</span>
                </div>
                <span className="font-mono text-cyan-300 font-bold ml-1 shrink-0">{p.sizeDisplay}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
