/**
 * KNOuX SmartOrganizer — Source Grant Workspace (Stage 1)
 *
 * In the Electron client the source is selected with the native folder picker
 * and indexed read-only. Browser preview keeps a clearly labelled fixture
 * scenario so the approved Studio composition remains reviewable.
 */

import React, { useState } from 'react';
import {
  Folder,
  Plus,
  ShieldCheck,
  HardDrive,
  RefreshCw,
  Trash2,
  FolderPlus,
  CheckCircle,
  FileSearch,
  AlertTriangle,
  Loader2,
  Ban,
} from 'lucide-react';
import { useStudio } from '../context';

export function SourceGrantWorkspace() {
  const {
    authorizedSources,
    addAuthorizedSource,
    addNativeSource,
    removeAuthorizedSource,
    refreshSources,
    scanActiveSource,
    cancelActiveScan,
    setActiveStageId,
    inventory,
    native,
    locale,
  } = useStudio();

  const [inputPath, setInputPath] = useState('');
  const quickAddSuggestions = [
    'C:\\Users\\Alex\\Downloads',
    'C:\\Users\\Alex\\Documents',
    'C:\\Users\\Alex\\Pictures\\Camera',
    'D:\\Work\\Archives',
  ];

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputPath.trim()) {
      addAuthorizedSource(inputPath.trim());
      setInputPath('');
    }
  };

  return (
    <div className="flex-1 px-6 py-2 overflow-y-auto studio-scrollbar select-none">
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="studio-glass-panel rounded-xl p-5 border border-[#132c52] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-[#2476ff]/20 to-transparent blur-2xl pointer-events-none" />
          <div className="relative z-10">
            <div className="flex flex-wrap items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>{locale === 'en' ? 'Controlled Authorization Protocol' : 'بروتوكول التفويض المحمي'}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold border ${
                  native.mode === 'measured'
                    ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                    : 'bg-amber-950/60 text-amber-300 border-amber-500/40'
                }`}
              >
                {native.mode === 'measured'
                  ? locale === 'en'
                    ? 'NATIVE READ-ONLY'
                    : 'أصلي للقراءة فقط'
                  : locale === 'en'
                  ? 'FIXTURE PREVIEW'
                  : 'معاينة تجريبية'}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white">
              {locale === 'en' ? 'Manage Authorized Local Folders' : 'إدارة المجلدات المحلية المصرح بها'}
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl mt-1 leading-relaxed">
              {locale === 'en'
                ? 'Only explicitly granted folders are enumerated. The scanner reads directory entries and metadata, skips links/reparse points, and never opens file contents. Listing and preview planning are read-only.'
                : 'تُفهرس المجلدات المصرح بها فقط. يقرأ الماسح بيانات الأسماء والوصف فقط، يتجاوز الروابط، ولا يفتح محتوى الملفات. الفهرسة والتخطيط للقراءة فقط.'}
            </p>
          </div>
        </div>

        <div className="studio-glass-panel rounded-xl p-4 border border-[#132c52]">
          <h3 className="text-xs font-bold text-white mb-3 flex items-center gap-2">
            <FolderPlus className="w-4 h-4 text-cyan-400" />
            <span>{locale === 'en' ? 'Grant Access to New Folder' : 'منح إذن لمجلد جديد'}</span>
          </h3>

          {native.available ? (
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => void addNativeSource()}
                disabled={native.scanning}
                className="px-4 py-2 rounded-lg bg-[#2476ff] hover:bg-[#3282ff] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-[0_0_12px_rgba(36,118,255,0.4)] cursor-pointer"
              >
                <Folder className="w-4 h-4" />
                <span>{locale === 'en' ? 'Browse native folder…' : 'اختيار مجلد أصلي…'}</span>
              </button>
              <span className="text-[11px] text-slate-400">
                {locale === 'en'
                  ? 'The Windows picker is the only way to grant a source; no typed or renderer-supplied path is accepted.'
                  : 'منتقي ويندوز هو الطريقة الوحيدة للتصريح بالمصدر؛ لا يُقبل مسار مكتوب أو مُرسل من الواجهة.'}
              </span>
            </div>
          ) : (
            <>
              <form onSubmit={handleAdd} className="flex gap-2">
                <input
                  type="text"
                  value={inputPath}
                  onChange={(e) => setInputPath(e.target.value)}
                  placeholder="Fixture scenario path (browser preview only)"
                  className="flex-1 bg-[#061226] border border-[#173766] rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-[#2476ff] font-mono"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#2476ff] hover:bg-[#3282ff] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>{locale === 'en' ? 'Add fixture' : 'إضافة تجريبية'}</span>
                </button>
              </form>
              <div className="mt-3 flex items-center gap-2 flex-wrap text-xs">
                <span className="text-[11px] text-amber-300/90">
                  {locale === 'en' ? 'Design fixtures — not filesystem evidence.' : 'بيانات تصميم — ليست دليلًا من نظام الملفات.'}
                </span>
                {quickAddSuggestions.map((path, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => addAuthorizedSource(path)}
                    className="px-2 py-1 rounded bg-[#091a33] hover:bg-[#122e57] text-[11px] font-mono text-cyan-300 border border-[#142e56] transition-colors cursor-pointer"
                  >
                    + {path}
                  </button>
                ))}
              </div>
            </>
          )}

          {native.scanning && (
            <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-cyan-300">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>
                {locale === 'en' ? 'Indexing metadata…' : 'جارٍ فهرسة البيانات الوصفية…'}{' '}
                {native.progress
                  ? `${native.progress.files.toLocaleString()} files · ${native.progress.folders.toLocaleString()} folders`
                  : ''}
              </span>
              <button
                onClick={() => void cancelActiveScan()}
                className="px-2 py-0.5 rounded bg-rose-950/40 border border-rose-700 text-rose-300 text-[10px] cursor-pointer"
              >
                {locale === 'en' ? 'Cancel' : 'إلغاء'}
              </button>
            </div>
          )}
          {native.error && (
            <div className="mt-3 flex items-start gap-2 text-[11px] text-rose-300">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{native.error}</span>
            </div>
          )}
          {native.warnings.length > 0 && (
            <div className="mt-2 text-[10px] text-amber-300/90 space-y-0.5">
              {native.warnings.slice(0, 4).map((warning) => (
                <div key={warning} className="flex items-start gap-1.5">
                  <Ban className="w-3 h-3 shrink-0 mt-0.5" />
                  <span>{warning}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="studio-glass-panel rounded-xl p-4 border border-[#132c52]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-bold text-white">
                {locale === 'en' ? 'Currently Authorized Sources' : 'المصادر المصرح بها حالياً'} ({authorizedSources.length})
              </h3>
            </div>
            <button
              onClick={() => (native.available ? void scanActiveSource() : refreshSources())}
              disabled={native.scanning}
              className="px-2.5 py-1 rounded bg-[#0b1c36] hover:bg-[#14325e] disabled:opacity-50 text-cyan-300 border border-[#1b3f70] text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 ${native.scanning ? 'animate-spin' : ''}`} />
              <span>{native.available ? (locale === 'en' ? 'Re-scan active source' : 'إعادة فحص المصدر النشط') : (locale === 'en' ? 'Refresh fixtures' : 'تحديث التجريبي')}</span>
            </button>
          </div>

          <div className="space-y-2">
            {authorizedSources.map((source) => (
              <div
                key={source.id}
                className="p-3 rounded-lg bg-[#08182f] border border-[#142e56] flex items-center justify-between"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-[#0e274d] border border-cyan-500/30 flex items-center justify-center shrink-0">
                    <Folder className="w-4 h-4 text-amber-400 fill-amber-400/20" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate font-mono">{source.path}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5 flex flex-wrap items-center gap-3">
                      <span>{source.fileCount.toLocaleString()} files</span>
                      <span>•</span>
                      <span className="text-cyan-300 font-mono">{source.sizeGb} GB</span>
                      <span>•</span>
                      <span className={source.status === 'permission_required' ? 'text-rose-300' : 'text-slate-400'}>
                        {source.status === 'scanning' ? (locale === 'en' ? 'Indexing…' : 'جارٍ الفهرسة…') : source.status === 'offline' ? (locale === 'en' ? 'Offline' : 'غير متصل') : source.status === 'permission_required' ? (locale === 'en' ? 'Access denied' : 'صلاحية مرفوضة') : locale === 'en' ? 'Read-only index' : 'فهرس للقراءة فقط'}
                      </span>
                      {source.lastScanned && (
                        <>
                          <span>•</span>
                          <span className="text-slate-500 font-mono">{source.lastScanned}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveStageId(2)}
                    disabled={source.fileCount === 0}
                    className="px-2.5 py-1 rounded bg-[#102747] hover:bg-[#193c6e] disabled:opacity-50 text-cyan-200 text-xs font-medium border border-[#2476ff]/40 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <FileSearch className="w-3 h-3" />
                    <span>{locale === 'en' ? 'Inspect in Library' : 'معاينة في المكتبة'}</span>
                  </button>
                  <button
                    onClick={() => removeAuthorizedSource(source.id)}
                    className="p-1.5 rounded text-slate-500 hover:text-red-400 hover:bg-red-950/40 transition-colors cursor-pointer"
                    title={locale === 'en' ? 'Revoke authorization' : 'إلغاء التصريح'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
            {authorizedSources.length === 0 && (
              <div className="p-4 text-center text-xs text-slate-400 border border-dashed border-[#1a3d6d] rounded-lg">
                {native.mode === 'measured'
                  ? locale === 'en'
                    ? 'No measured source remains. Choose a native folder above.'
                    : 'لا يوجد مصدر مقيس. اختر مجلدًا أصليًا أعلاه.'
                  : locale === 'en'
                  ? 'Fixture preview only. Add a native folder in Electron to measure this device.'
                  : 'معاينة تجريبية فقط. أضف مجلدًا أصليًا في Electron لقياس هذا الجهاز.'}
              </div>
            )}
          </div>
        </div>

        <div className="text-[10px] text-slate-500 flex items-center gap-2">
          <CheckCircle className="w-3 h-3 text-emerald-400" />
          <span>
            {locale === 'en'
              ? `${inventory.totalFiles.toLocaleString()} indexed files · ${inventory.totalFolders.toLocaleString()} folders · no file contents read · no mutation capability exposed.`
              : `${inventory.totalFiles.toLocaleString()} ملفًا مفهرسًا · ${inventory.totalFolders.toLocaleString()} مجلدًا · لم يُقرأ محتوى الملفات · لا قدرة تعديل مكشوفة.`}
          </span>
        </div>
      </div>
    </div>
  );
}
