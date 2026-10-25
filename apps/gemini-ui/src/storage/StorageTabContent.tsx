import React from 'react';
import type { StorageAnalysis } from '../../shared/native-contracts';
import { formatStorageBytes } from './useStorageNative';

export type StorageTabKey = 'treemap' | 'large' | 'types' | 'age' | 'folders';

interface StorageTabContentProps {
  tab: Exclude<StorageTabKey, 'treemap'>;
  analysis: StorageAnalysis;
  isArabic: boolean;
  searchQuery: string;
}

const PALETTE = ['#3b82f6', '#a855f7', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#84cc16', '#64748b'];

export function StorageTabContent({ tab, analysis, isArabic, searchQuery }: StorageTabContentProps) {
  const query = searchQuery.trim().toLowerCase();
  const scope = (
    <div className="text-[10px] text-slate-500 font-mono truncate" title={analysis.coverage.scope}>
      {isArabic ? 'النطاق:' : 'Scope:'} {analysis.coverage.scope} · {isArabic ? 'مجلد مصرح به فقط' : 'authorized folder only'}
    </div>
  );

  if (tab === 'large') {
    const rows = analysis.largest.filter((item) => !query || item.name.toLowerCase().includes(query));
    const max = Math.max(1, ...rows.map((item) => item.size));
    return (
      <div className="space-y-2">
        {scope}
        {rows.length ? rows.map((item, index) => (
          <div key={item.id} className="p-2 rounded-lg bg-[#050f22] border border-slate-800">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="text-slate-200 truncate" title={item.relative}>{index + 1}. {item.name}</span>
              <span className="font-mono text-cyan-300 shrink-0">{formatStorageBytes(item.size)}</span>
            </div>
            <div className="mt-1 h-1.5 rounded bg-[#0a1c38] overflow-hidden">
              <div className="h-full rounded bg-gradient-to-r from-[#2476ff] to-[#26c6ff]" style={{ width: `${Math.max(2, (item.size / max) * 100)}%` }} />
            </div>
            <div className="mt-1 text-[9px] text-slate-500 font-mono truncate">{item.relative}</div>
          </div>
        )) : (
          <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-700 rounded-lg">{isArabic ? 'لا توجد ملفات مطابقة.' : 'No matching files.'}</div>
        )}
      </div>
    );
  }

  if (tab === 'types') {
    const rows = analysis.extensions.filter((item) => !query || item.ext.includes(query)).slice(0, 16);
    const total = analysis.totals.files || 1;
    return (
      <div className="space-y-2">
        {scope}
        {rows.map((item, index) => (
          <div key={item.ext}>
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-200">{item.ext === '(none)' ? (isArabic ? 'بلا امتداد' : 'No extension') : `.${item.ext}`}</span>
              <span className="text-slate-400">{item.count.toLocaleString()} · {formatStorageBytes(item.bytes)}</span>
            </div>
            <div className="mt-1 h-2 rounded bg-[#0a1c38] overflow-hidden">
              <div className="h-full" style={{ width: `${Math.max(2, (item.count / total) * 100)}%`, backgroundColor: PALETTE[index % PALETTE.length] }} />
            </div>
          </div>
        ))}
        {!rows.length && <div className="text-xs text-slate-400 p-4 text-center">{isArabic ? 'لا توجد امتدادات مطابقة.' : 'No matching extensions.'}</div>}
      </div>
    );
  }

  if (tab === 'age') {
    const total = analysis.ages.reduce((sum, item) => sum + item.count, 0) || 1;
    return (
      <div className="space-y-2">
        {scope}
        {analysis.ages.map((item, index) => (
          <div key={item.key}>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-200">{item.label}</span>
              <span className="font-mono text-slate-400">{item.count.toLocaleString()} · {formatStorageBytes(item.bytes)}</span>
            </div>
            <div className="mt-1 h-2 rounded bg-[#0a1c38] overflow-hidden">
              <div className="h-full" style={{ width: `${Math.max(0, (item.count / total) * 100)}%`, backgroundColor: PALETTE[index % PALETTE.length] }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const folders = analysis.folders.filter((folder) => !query || folder.name.toLowerCase().includes(query) || folder.relative.toLowerCase().includes(query));
  const max = Math.max(1, ...folders.map((folder) => folder.sizeBytes));
  return (
    <div className="space-y-2">
      {scope}
      {folders.map((folder, index) => (
        <div key={folder.id} className="p-2 rounded-lg bg-[#050f22] border border-slate-800">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="text-slate-200 truncate">{index + 1}. {folder.name}</span>
            <span className="font-mono text-cyan-300 shrink-0">{formatStorageBytes(folder.sizeBytes)}</span>
          </div>
          <div className="mt-1 h-1.5 rounded bg-[#0a1c38] overflow-hidden">
            <div className="h-full rounded bg-gradient-to-r from-[#7c3aed] to-[#26c6ff]" style={{ width: `${Math.max(2, (folder.sizeBytes / max) * 100)}%` }} />
          </div>
          <div className="mt-1 flex flex-wrap gap-x-2 text-[9px] text-slate-500 font-mono">
            <span>{folder.files.toLocaleString()} {isArabic ? 'ملف' : 'files'}</span>
            {folder.children.slice(0, 3).map((child) => (
              <span key={child.id}>· {child.name} {formatStorageBytes(child.sizeBytes)}</span>
            ))}
          </div>
        </div>
      ))}
      {!folders.length && <div className="text-xs text-slate-400 p-4 text-center">{isArabic ? 'لا توجد مجلدات مطابقة.' : 'No matching folders.'}</div>}
    </div>
  );
}
