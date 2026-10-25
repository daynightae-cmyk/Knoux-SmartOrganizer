/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * KNOuX SmartOrganizer — Scan Results Table Workspace
 */

import React from 'react';
import { Filter } from 'lucide-react';
import { ScanResultItem } from './smartScan.types';

export interface ScanResultsProps {
  results: ScanResultItem[];
  selectedId: string;
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  onSelectRow: (id: string) => void;
  onToggleItemCheck: (id: string) => void;
  onToggleCheckAll: (checked: boolean) => void;
  isArabic?: boolean;
}

export const ScanResults: React.FC<ScanResultsProps> = ({
  results,
  selectedId,
  activeFilter,
  onFilterChange,
  onSelectRow,
  onToggleItemCheck,
  onToggleCheckAll,
  isArabic = false,
}) => {
  const allChecked = results.length > 0 && results.every((r) => r.selected);

  const filterTabs = [
    { id: 'all', labelEn: 'All (1,248)', labelAr: 'الكل (1,248)' },
    { id: 'junk', labelEn: 'Junk Files (482)', labelAr: 'مخلفات (482)' },
    { id: 'duplicates', labelEn: 'Duplicates (216)', labelAr: 'مكررات (216)' },
    { id: 'large', labelEn: 'Large Files (187)', labelAr: 'كبيرة (187)' },
    { id: 'privacy', labelEn: 'Privacy (327)', labelAr: 'خصوصية (327)' },
    { id: 'other', labelEn: 'Other (36)', labelAr: 'أخرى (36)' },
  ];

  return (
    <div className="scan-results-panel bg-[#071329]/80 border border-[#11294a] rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between shadow-lg h-full overflow-hidden">
      <div className="flex flex-col h-full overflow-hidden">
        {/* Table Title & Filter Tabs */}
        <div className="scan-results-head flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-2.5 border-b border-[#0f2545] shrink-0">
          <div>
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <Filter className="w-4 h-4 text-cyan-400" />
              {isArabic ? 'نتائج الفحص' : 'Scan Results'}
            </h3>
            <p className="text-[11px] text-slate-300 font-medium">
              {isArabic ? '1,248 عنصرًا مكتشفًا (48.6 GB)' : '1,248 items detected (48.6 GB)'}
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1">
            {filterTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onFilterChange(tab.id)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                  activeFilter === tab.id
                    ? 'bg-blue-600 text-white shadow-[0_0_10px_rgba(37,99,235,0.5)] border border-cyan-400/40'
                    : 'bg-[#0b1b36] hover:bg-[#12284c] text-slate-300 border border-[#142e54]'
                }`}
              >
                {isArabic ? tab.labelAr : tab.labelEn}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Data Table Container */}
        <div className="scan-results-table flex-1 overflow-x-auto overflow-y-auto knx-custom-scrollbar min-h-0">
          <table className="w-full text-left rtl:text-right text-xs border-collapse">
            <thead className="sticky top-0 bg-[#071329] z-10 border-b border-[#0f2545] text-[10px] text-slate-400 uppercase font-semibold">
              <tr>
                <th className="p-2 w-8 text-center">
                  <input
                    type="checkbox"
                    checked={allChecked}
                    onChange={(e) => onToggleCheckAll(e.target.checked)}
                    className="rounded bg-[#0c1f3d] border-slate-600 text-cyan-500 focus:ring-0 cursor-pointer"
                  />
                </th>
                <th className="p-2">{isArabic ? 'الاسم' : 'Name'}</th>
                <th className="p-2">{isArabic ? 'الفئة' : 'Category'}</th>
                <th className="p-2 text-right">{isArabic ? 'العناصر' : 'Items'}</th>
                <th className="p-2 text-right">{isArabic ? 'الحجم' : 'Size'}</th>
                <th className="p-2 text-center">{isArabic ? 'التأثير' : 'Impact'}</th>
                <th className="p-2 text-center">{isArabic ? 'الحالة' : 'Status'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#0c1d38]">
              {results.map((row) => {
                const isSelected = selectedId === row.id;
                return (
                  <tr
                    key={row.id}
                    onClick={() => onSelectRow(row.id)}
                    className={`group hover:bg-[#0c203f] transition-colors cursor-pointer ${
                      isSelected ? 'bg-[#0d254b] border-l-2 border-cyan-400' : ''
                    }`}
                  >
                    <td className="p-2 text-center" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={row.selected}
                        onChange={() => onToggleItemCheck(row.id)}
                        className="rounded bg-[#0c1f3d] border-slate-600 text-cyan-500 focus:ring-0 cursor-pointer"
                      />
                    </td>
                    <td className="p-2">
                      <div className="font-bold text-white group-hover:text-cyan-200">
                        {isArabic ? row.nameAr : row.nameEn}
                      </div>
                      <div className="scan-row-desc text-[10px] text-slate-400 truncate max-w-[190px]">
                        {isArabic ? row.descriptionAr : row.descriptionEn}
                      </div>
                    </td>
                    <td className="p-2 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                          row.category === 'junk'
                            ? 'bg-purple-950/60 text-purple-300 border-purple-500/40'
                            : row.category === 'duplicates'
                            ? 'bg-cyan-950/60 text-cyan-300 border-cyan-500/40'
                            : row.category === 'large'
                            ? 'bg-blue-950/60 text-blue-300 border-blue-500/40'
                            : row.category === 'privacy'
                            ? 'bg-teal-950/60 text-teal-300 border-teal-500/40'
                            : 'bg-indigo-950/60 text-indigo-300 border-indigo-500/40'
                        }`}
                      >
                        {isArabic ? row.categoryLabelAr : row.categoryLabelEn}
                      </span>
                    </td>
                    <td className="p-2 text-right font-mono text-slate-300">
                      {row.itemCount.toLocaleString()}
                    </td>
                    <td className="p-2 text-right font-mono font-bold text-white">
                      {row.sizeGB > 0 ? `${row.sizeGB} GB` : '-'}
                    </td>
                    <td className="p-2 text-center">
                      <div className="flex justify-center items-center gap-0.5">
                        <span
                          className={`w-3 h-1 rounded-xs ${
                            row.impactLevel === 'high' || row.impactLevel === 'medium'
                              ? 'bg-rose-500'
                              : 'bg-emerald-500'
                          }`}
                        />
                        <span
                          className={`w-3 h-1 rounded-xs ${
                            row.impactLevel === 'high'
                              ? 'bg-rose-500'
                              : row.impactLevel === 'medium'
                              ? 'bg-amber-500'
                              : 'bg-slate-700'
                          }`}
                        />
                        <span
                          className={`w-3 h-1 rounded-xs ${
                            row.impactLevel === 'high' ? 'bg-rose-500' : 'bg-slate-700'
                          }`}
                        />
                      </div>
                    </td>
                    <td className="p-2 text-center whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                          row.status === 'safe'
                            ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                            : row.status === 'review'
                            ? 'bg-amber-950/60 text-amber-300 border-amber-500/40'
                            : 'bg-rose-950/60 text-rose-300 border-rose-500/40'
                        }`}
                      >
                        {isArabic ? row.statusLabelAr : row.statusLabelEn}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
