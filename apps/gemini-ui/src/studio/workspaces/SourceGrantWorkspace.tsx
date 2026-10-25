/**
 * KNOuX SmartOrganizer — Source Grant Workspace (Stage 1)
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
  AlertCircle,
  CheckCircle,
  FileSearch,
} from 'lucide-react';
import { useStudio } from '../context';

export function SourceGrantWorkspace() {
  const {
    authorizedSources,
    addAuthorizedSource,
    removeAuthorizedSource,
    refreshSources,
    setActiveStageId,
    locale,
  } = useStudio();

  const [inputPath, setInputPath] = useState('');
  const [quickAddSuggestions] = useState([
    'C:\\Users\\Alex\\Downloads',
    'C:\\Users\\Alex\\Documents',
    'C:\\Users\\Alex\\Pictures\\Camera',
    'D:\\Work\\Archives',
  ]);

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
        {/* Onboarding Banner */}
        <div className="studio-glass-panel rounded-xl p-5 border border-[#132c52] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-[#2476ff]/20 to-transparent blur-2xl pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>{locale === 'en' ? 'Controlled Authorization Protocol' : 'بروتوكول التفويض المحمي'}</span>
            </div>
            <h2 className="text-xl font-bold text-white">
              {locale === 'en' ? 'Manage Authorized Local Folders' : 'إدارة المجلدات المحلية المصرح بها'}
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl mt-1 leading-relaxed">
              {locale === 'en'
                ? 'KNOuX operates under strict zero-spill boundaries. Only explicitly granted folders are scanned, analyzed, and organized. No arbitrary background filesystem traversal is permitted.'
                : 'يعمل KNOuX وفق حدود حماية صارمة. يتم فحص وتنظيم المجلدات المصرح بها صراحة فقط دون أي قراءة عشوائية لنظام الملفات.'}
            </p>
          </div>
        </div>

        {/* Add New Authorized Path */}
        <div className="studio-glass-panel rounded-xl p-4 border border-[#132c52]">
          <h3 className="text-xs font-bold text-white mb-3 flex items-center gap-2">
            <FolderPlus className="w-4 h-4 text-cyan-400" />
            <span>{locale === 'en' ? 'Grant Access to New Folder' : 'منح إذن لمجلد جديد'}</span>
          </h3>

          <form onSubmit={handleAdd} className="flex gap-2">
            <input
              type="text"
              value={inputPath}
              onChange={(e) => setInputPath(e.target.value)}
              placeholder="e.g. D:\Projects\RawFootage or C:\Users\Alex\Pictures"
              className="flex-1 bg-[#061226] border border-[#173766] rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-[#2476ff] font-mono"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[#2476ff] hover:bg-[#3282ff] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-[0_0_12px_rgba(36,118,255,0.4)] cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{locale === 'en' ? 'Authorize & Index' : 'تفويض وفهرسة'}</span>
            </button>
          </form>

          {/* Quick presets */}
          <div className="mt-3 flex items-center gap-2 flex-wrap text-xs">
            <span className="text-[11px] text-slate-500">
              {locale === 'en' ? 'Common system paths:' : 'مسارات شائعة:'}
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
        </div>

        {/* Currently Authorized List */}
        <div className="studio-glass-panel rounded-xl p-4 border border-[#132c52]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-bold text-white">
                {locale === 'en' ? 'Currently Authorized Sources' : 'المصادر المصرح بها حالياً'} ({authorizedSources.length})
              </h3>
            </div>
            <button
              onClick={refreshSources}
              className="px-2.5 py-1 rounded bg-[#0b1c36] hover:bg-[#14325e] text-cyan-300 border border-[#1b3f70] text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>{locale === 'en' ? 'Re-scan All' : 'إعادة فحص الكل'}</span>
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
                    <div className="text-xs font-bold text-white truncate font-mono">
                      {source.path}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-3">
                      <span>{source.fileCount.toLocaleString()} files</span>
                      <span>•</span>
                      <span className="text-cyan-300 font-mono">{source.sizeGb} GB</span>
                      <span>•</span>
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        {source.isWritable ? 'Writable' : 'Read-only'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveStageId(2)}
                    className="px-2.5 py-1 rounded bg-[#102747] hover:bg-[#193c6e] text-cyan-200 text-xs font-medium border border-[#2476ff]/40 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <FileSearch className="w-3 h-3" />
                    <span>{locale === 'en' ? 'Inspect in Library' : 'معاينة في المكتبة'}</span>
                  </button>
                  <button
                    onClick={() => removeAuthorizedSource(source.id)}
                    className="p-1.5 rounded text-slate-500 hover:text-red-400 hover:bg-red-950/40 transition-colors cursor-pointer"
                    title="Revoke authorization"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
