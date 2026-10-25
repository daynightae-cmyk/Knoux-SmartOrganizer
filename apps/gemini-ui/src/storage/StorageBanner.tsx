import React from 'react';
import { AlertTriangle, FolderPlus, Loader2, RefreshCw, ShieldCheck, Ban } from 'lucide-react';
import { formatStorageBytes } from './useStorageNative';
import type { StorageAnalysis, StorageVolume, StudioSource } from '../../shared/native-contracts';

interface StorageBannerProps {
  isArabic: boolean;
  available: boolean;
  volumes: StorageVolume[];
  source: StudioSource | null;
  sources: StudioSource[];
  analysis: StorageAnalysis | null;
  volumesError: string | null;
  error: string | null;
  warnings: string[];
  scanning: boolean;
  progress: { files: number; folders: number; bytes: number } | null;
  onChoose: () => void;
  onRescan: () => void;
  onCancel: () => void;
  onSelectSource: (sourceId: string) => void;
  onRefreshVolumes: () => void;
}

export function StorageBanner({
  isArabic,
  available,
  volumes,
  source,
  sources,
  analysis,
  volumesError,
  error,
  warnings,
  scanning,
  progress,
  onChoose,
  onRescan,
  onCancel,
  onSelectSource,
  onRefreshVolumes,
}: StorageBannerProps) {
  const measuredVolumes = volumes.length > 0;
  const measuredAnalysis = Boolean(analysis);
  const tone = volumesError || error ? 'rose' : measuredAnalysis ? 'emerald' : measuredVolumes ? 'sky' : 'amber';
  const toneClass =
    tone === 'rose'
      ? 'border-rose-500/40 bg-rose-950/20 text-rose-200'
      : tone === 'emerald'
      ? 'border-emerald-500/35 bg-emerald-950/20 text-emerald-200'
      : tone === 'sky'
      ? 'border-cyan-500/35 bg-cyan-950/20 text-cyan-200'
      : 'border-amber-500/40 bg-amber-950/20 text-amber-200';
  const totalCapacity = volumes.reduce((sum, volume) => sum + volume.totalBytes, 0);
  const totalFree = volumes.reduce((sum, volume) => sum + volume.freeBytes, 0);

  return (
    <div
      data-testid="storage-native-banner"
      className={`relative z-10 rounded-lg border px-3 py-1.5 text-[10px] flex flex-wrap items-center gap-x-3 gap-y-1 select-none ${toneClass}`}
    >
      <span className="flex items-center gap-1.5 font-semibold">
        {volumesError || error ? <AlertTriangle className="w-3.5 h-3.5" /> : measuredAnalysis ? <ShieldCheck className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
        {volumesError || error
          ? (isArabic ? 'خطأ في مزود التخزين' : 'Storage provider error')
          : measuredAnalysis
          ? (isArabic ? 'أطلس مقيس — للقراءة فقط' : 'Measured atlas — read-only')
          : measuredVolumes
          ? (isArabic ? 'أحجام مقيسة — نطاق التحليل غير مصرح' : 'Volumes measured — no authorized analysis scope')
          : available
          ? (isArabic ? 'جسر التخزين جاهز — مصرّح بمجلد' : 'Storage bridge ready — authorize a folder')
          : (isArabic ? 'بيانات تصميم تجريبية — ليست لهذا الجهاز' : 'Design fixture preview — not this device')}
      </span>

      {measuredVolumes && (
        <span className="font-mono text-slate-200">
          {volumes.length} {isArabic ? 'وحدة' : 'volumes'} · {formatStorageBytes(totalCapacity)} · {formatStorageBytes(totalFree)} {isArabic ? 'متاحة' : 'free'}
        </span>
      )}

      {source && (
        <label className="flex items-center gap-1.5">
          <span className="text-slate-400">{isArabic ? 'نطاق التحليل:' : 'Analysis scope:'}</span>
          {sources.length > 1 ? (
            <select
              value={source.id}
              onChange={(event) => onSelectSource(event.target.value)}
              className="bg-transparent border border-current/30 rounded px-1 py-0.5 font-mono text-current"
            >
              {sources.map((entry) => (
                <option key={entry.id} value={entry.id} className="bg-[#07152b] text-slate-200">
                  {entry.label}
                </option>
              ))}
            </select>
          ) : (
            <span className="font-mono text-cyan-200">{source.label}</span>
          )}
        </label>
      )}

      {analysis && (
        <span className="font-mono text-slate-400">
          {analysis.totals.files.toLocaleString()} {isArabic ? 'ملف' : 'files'} · {formatStorageBytes(analysis.totals.bytes)} · {isArabic ? 'لا يغطي كامل وحدة التخزين' : 'not a whole-volume scan'}
        </span>
      )}

      {scanning && (
        <span className="flex items-center gap-1.5 text-cyan-200">
          <Loader2 className="w-3 h-3 animate-spin" />
          {progress
            ? `${progress.files.toLocaleString()} ${isArabic ? 'ملف' : 'files'} · ${progress.folders.toLocaleString()} ${isArabic ? 'مجلد' : 'folders'}`
            : (isArabic ? 'جارٍ فهرسة النطاق…' : 'Indexing scope…')}
          <button onClick={onCancel} className="underline hover:text-white cursor-pointer">{isArabic ? 'إلغاء' : 'cancel'}</button>
        </span>
      )}

      {(volumesError || error) && <span className="max-w-[420px] truncate" title={volumesError || error || undefined}>{volumesError || error}</span>}
      {warnings.slice(0, 2).map((warning) => (
        <span key={warning} className="flex items-center gap-1 text-amber-300/90 max-w-[360px] truncate" title={warning}>
          <Ban className="w-3 h-3 shrink-0" />
          {warning}
        </span>
      ))}

      <span className="ml-auto flex items-center gap-1.5">
        {available ? (
          <>
            <button
              onClick={onChoose}
              disabled={scanning}
              className="px-2 py-0.5 rounded border border-current/30 hover:border-current flex items-center gap-1 disabled:opacity-50 cursor-pointer"
            >
              <FolderPlus className="w-3 h-3" />
              {isArabic ? 'مجلد التحليل' : 'Analysis folder'}
            </button>
            <button
              onClick={onRescan}
              disabled={scanning || !source}
              className="px-2 py-0.5 rounded border border-current/30 hover:border-current flex items-center gap-1 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 ${scanning ? 'animate-spin' : ''}`} />
              {isArabic ? 'إعادة فحص' : 'Rescan'}
            </button>
            <button
              onClick={onRefreshVolumes}
              className="px-2 py-0.5 rounded border border-current/30 hover:border-current flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              {isArabic ? 'تحديث الوحدات' : 'Volumes'}
            </button>
          </>
        ) : (
          <span>{isArabic ? 'افتح عميل Electron لقياس الأجهزة.' : 'Open the Electron client to measure devices.'}</span>
        )}
        <span className="font-mono text-slate-400">
          {isArabic ? 'لا تنظيف أو إلغاء تجزئة هنا' : 'No cleanup or defrag here'}
        </span>
      </span>
    </div>
  );
}
