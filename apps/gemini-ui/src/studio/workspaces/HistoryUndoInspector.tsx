/**
 * KNOuX SmartOrganizer — History & Undo Inspector Workspace (Stage 8)
 */

import React, { useState } from 'react';
import {
  RotateCcw,
  CheckCircle2,
  FileCheck,
  AlertCircle,
  Clock,
  HardDrive,
  ShieldAlert,
  ArrowRight,
  Database,
} from 'lucide-react';
import { useStudio } from '../context';

export function HistoryUndoInspector() {
  const { historyJournal, revertJournalEntry, setActiveStageId, locale } = useStudio();
  const [revertingId, setRevertingId] = useState<string | null>(null);

  const handleRevert = (id: string) => {
    setRevertingId(id);
    setTimeout(() => {
      revertJournalEntry(id);
      setRevertingId(null);
    }, 600);
  };

  return (
    <div className="flex-1 px-6 py-2 overflow-y-auto studio-scrollbar select-none">
      <div className="max-w-5xl mx-auto space-y-4">
        {/* Banner */}
        <div className="studio-glass-panel rounded-xl p-5 border border-[#132c52] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <RotateCcw className="w-4 h-4" />
              <span>{locale === 'en' ? 'Verified Journal & Rollback' : 'سجل العمليات الموثق والتراجع'}</span>
            </div>
            <h2 className="text-xl font-bold text-white">
              {locale === 'en' ? 'History & Rollback Journal' : 'سجل العمليات التاريخي والتراجع الآمن'}
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              {locale === 'en'
                ? 'Immutable transaction ledger tracking all past organization batches. Execute full 1-click reversal back to initial folder states.'
                : 'دفتر أستاذ غير قابل للتعديل يوثق جميع دفعات التنظيم السابقة، مع إمكانية التراجع الكامل بضغطة واحدة.'}
            </p>
          </div>

          <button
            onClick={() => setActiveStageId(9)} // Suggestions
            className="px-4 py-2 rounded-lg bg-[#2476ff] hover:bg-[#3282ff] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-[0_0_12px_rgba(36,118,255,0.4)] cursor-pointer"
          >
            <span>{locale === 'en' ? 'View AI Suggestions' : 'عرض المقترحات الذكية'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Ledger Entries List */}
        <div className="space-y-3">
          {historyJournal.map((entry) => (
            <div
              key={entry.id}
              className="studio-glass-panel rounded-xl p-4 border border-[#132c52] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${
                    entry.status === 'completed'
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400'
                      : 'bg-amber-950/40 border-amber-500/40 text-amber-400'
                  }`}
                >
                  {entry.status === 'completed' ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <RotateCcw className="w-5 h-5" />
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-cyan-300">
                      {entry.id}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {entry.timestamp}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase font-mono ${
                        entry.status === 'completed'
                          ? 'bg-emerald-900/60 text-emerald-300'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {entry.status}
                    </span>
                  </div>

                  <div className="text-xs text-white font-medium mt-1">
                    {locale === 'en' ? entry.summaryEn : entry.summaryAr}
                  </div>

                  <div className="text-[11px] text-slate-400 font-mono mt-1 flex items-center gap-3">
                    <span>{entry.filesProcessed.toLocaleString()} files</span>
                    <span>•</span>
                    <span className="text-cyan-300">{entry.totalSizeFormatted}</span>
                    <span>•</span>
                    <span>Destination: {entry.destinationPath}</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div>
                {entry.canUndo ? (
                  <button
                    onClick={() => handleRevert(entry.id)}
                    disabled={revertingId === entry.id}
                    className="px-3.5 py-1.5 rounded-lg bg-amber-950/40 hover:bg-amber-900/50 text-amber-300 border border-amber-600/50 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${revertingId === entry.id ? 'animate-spin' : ''}`} />
                    <span>{revertingId === entry.id ? 'Reverting...' : 'Undo & Revert'}</span>
                  </button>
                ) : (
                  <span className="text-xs text-slate-500 font-mono">Rollback Inactive</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
