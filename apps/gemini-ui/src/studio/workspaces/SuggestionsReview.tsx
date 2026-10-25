/**
 * KNOuX SmartOrganizer — Suggestions Review Workspace (Stage 9)
 */

import React from 'react';
import {
  Sparkles,
  Check,
  X,
  HardDrive,
  ArrowRight,
  ShieldAlert,
  Zap,
} from 'lucide-react';
import { useStudio } from '../context';

export function SuggestionsReview() {
  const { suggestions, dismissSuggestion, setActiveStageId, native, locale } = useStudio();

  return (
    <div className="flex-1 px-6 py-2 overflow-y-auto studio-scrollbar select-none">
      <div className="max-w-5xl mx-auto space-y-4">
        {/* Banner */}
        <div className="studio-glass-panel rounded-xl p-5 border border-[#132c52] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>{locale === 'en' ? 'Intelligent Analysis Engine' : 'محرك التحليل الذكي'}</span>
            </div>
            <h2 className="text-xl font-bold text-white">
              {locale === 'en' ? 'Smart Optimization Suggestions' : 'مقترحات التحسين والتنظيم الذكية'}
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              {locale === 'en'
                ? 'Category-derived suggestions from the measured index. They are not AI analysis and do not claim reclaimable space; review a read-only plan before any approved execution.'
                : 'مقترحات مشتقة من الفئات المقيسة. ليست تحليل ذكاء اصطناعي ولا تدعي مساحة قابلة للاستعادة؛ راجع خطة للقراءة فقط قبل أي تنفيذ معتمد.'}
            </p>
          </div>

          <button
            onClick={() => setActiveStageId(2)} // Back to Stage 2: Visual Library
            className="px-4 py-2 rounded-lg bg-[#2476ff] hover:bg-[#3282ff] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-[0_0_12px_rgba(36,118,255,0.4)] cursor-pointer"
          >
            <span>{locale === 'en' ? 'Return to Visual Library' : 'العودة للمكتبة المرئية'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Suggestions list */}
        <div className="space-y-3">
          {suggestions.length === 0 ? (
            <div className="studio-glass-panel rounded-xl p-8 text-center border border-[#132c52]">
              <Sparkles className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
              <div className="text-sm font-bold text-white">
                {locale === 'en' ? 'All suggestions reviewed!' : 'تمت مراجعة جميع المقترحات!'}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {locale === 'en' ? 'Your file system matches optimal organization criteria.' : 'نظام ملفاتك يطابق أفضل معايير الترتيب.'}
              </p>
            </div>
          ) : (
            suggestions.map((sug) => (
              <div
                key={sug.id}
                className="studio-glass-panel rounded-xl p-4 border border-[#132c52] hover:border-[#1e457e] transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-[#0e274d] border border-cyan-500/40 flex items-center justify-center shrink-0 text-cyan-300 shadow-[0_0_10px_rgba(38,198,255,0.25)]">
                    <Zap className="w-5 h-5 text-cyan-400" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-bold text-white">
                        {locale === 'en' ? sug.titleEn : sug.titleAr}
                      </h3>
                      <span className="px-1.5 py-0.5 rounded bg-cyan-950/80 text-[9px] font-mono font-bold text-cyan-300 border border-cyan-600/40">
                        {native.mode === 'measured' ? (locale === 'en' ? 'Rule-based' : 'قاعدة مقيسة') : `${sug.confidenceScore}% ${locale === 'en' ? 'fixture confidence' : 'ثقة تجريبية'}`}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      {locale === 'en' ? sug.descriptionEn : sug.descriptionAr}
                    </p>

                    <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400 mt-1.5">
                      <span>Impact: {sug.impactFilesCount.toLocaleString()} files</span>
                      {sug.savedSpaceFormatted && (
                        <>
                          <span>•</span>
                          <span className="text-emerald-400 font-bold">
                            Recoverable: {sug.savedSpaceFormatted}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Approve & Dismiss buttons */}
                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  <button
                    onClick={() => dismissSuggestion(sug.id)}
                    className="px-3 py-1.5 rounded-lg bg-[#0a182d] hover:bg-[#122b4e] text-slate-400 hover:text-slate-200 text-xs font-medium border border-[#173663] transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>{locale === 'en' ? 'Dismiss' : 'تجاهل'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveStageId(4); // Load into Rule Builder
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-[#2476ff] hover:bg-[#3282ff] text-white text-xs font-semibold border border-cyan-400/50 shadow-[0_0_12px_rgba(36,118,255,0.4)] flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{locale === 'en' ? 'Open Rule Builder' : 'فتح منشئ القواعد'}</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
