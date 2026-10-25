/**
 * KNOuX SmartOrganizer — Plan Review Workspace (Stage 6)
 */

import React, { useState } from 'react';
import {
  FileCheck2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  FileText,
  FolderTree,
  Play,
  RotateCcw,
} from 'lucide-react';
import { useStudio } from '../context';

export function PlanReviewWorkspace() {
  const {
    files,
    destinationPath,
    operationMode,
    conflicts,
    setActiveStageId,
    locale,
  } = useStudio();

  const [activeTab, setActiveTab] = useState<'all' | 'conflicts'>('all');

  return (
    <div className="flex-1 px-6 py-2 overflow-y-auto studio-scrollbar select-none">
      <div className="max-w-5xl mx-auto space-y-4">
        {/* Banner */}
        <div className="studio-glass-panel rounded-xl p-5 border border-[#132c52] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <FileCheck2 className="w-4 h-4" />
              <span>{locale === 'en' ? 'Secured Plan Validation' : 'التحقق الآمن من الخطة'}</span>
            </div>
            <h2 className="text-xl font-bold text-white">
              {locale === 'en' ? 'Organization Plan Review & Dry Run' : 'مراجعة خطة التنظيم والمحاكاة التجريبية'}
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              {locale === 'en'
                ? 'Review complete before/after path changes, conflict mitigation, and disk footprint before triggering system operation.'
                : 'راجع مسارات النقل والتسمية وحلول التعارضات وحجم التخزين قبل اعتماد تنفيذ الخطة.'}
            </p>
          </div>

          <button
            onClick={() => setActiveStageId(7)} // Advance to Stage 7 Execution
            className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-[#2476ff] to-[#1a5bc9] hover:from-[#3582ff] hover:to-[#226cf0] text-white text-xs font-bold flex items-center gap-2 shadow-[0_0_18px_rgba(36,118,255,0.7)] border border-cyan-400/60 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>{locale === 'en' ? 'Execute Approved Plan' : 'تنفيذ الخطة المعتمدة'}</span>
          </button>
        </div>

        {/* Verification Checklist */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-[#08182f] border border-[#142e56] flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <div className="text-xs font-bold text-white">Destination Ready</div>
              <div className="text-[10px] text-slate-400 font-mono">{destinationPath}</div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[#08182f] border border-[#142e56] flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <div className="text-xs font-bold text-white">Operation Mode</div>
              <div className="text-[10px] text-slate-400 uppercase font-mono">{operationMode} files</div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-600/40 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <div className="text-xs font-bold text-amber-300">Conflict Guard Active</div>
              <div className="text-[10px] text-slate-400">12 duplicate names auto-resolved</div>
            </div>
          </div>
        </div>

        {/* Before / After Table */}
        <div className="studio-glass-panel rounded-xl p-4 border border-[#132c52] space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#0f2545]">
            <h3 className="text-xs font-bold text-white flex items-center gap-2">
              <FolderTree className="w-4 h-4 text-cyan-400" />
              <span>{locale === 'en' ? 'Itemized Path Transformations (First 12 of 3,246)' : 'المسارات المنقولة التفصيلية'}</span>
            </h3>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                  activeTab === 'all'
                    ? 'bg-[#153664] text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All Transformations
              </button>
              <button
                onClick={() => setActiveTab('conflicts')}
                className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                  activeTab === 'conflicts'
                    ? 'bg-amber-950/60 text-amber-300 border border-amber-600/50'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Conflicts Only (12)
              </button>
            </div>
          </div>

          <div className="space-y-1.5 font-mono text-xs">
            {files.map((file, idx) => (
              <div
                key={file.id}
                className="p-2.5 rounded-lg bg-[#07152b] border border-[#122b50] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] text-slate-500">Source:</div>
                  <div className="text-slate-300 truncate">{file.sourcePath}</div>
                </div>

                <ArrowRight className="w-4 h-4 text-cyan-400 shrink-0 hidden sm:block" />

                <div className="min-w-0 flex-1">
                  <div className="text-[10px] text-cyan-400 font-semibold">Planned Destination:</div>
                  <div className="text-cyan-200 truncate">
                    {destinationPath}2025\04\26\{file.name}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="px-2 py-0.5 rounded bg-[#0a1f3d] text-[10px] text-slate-400">
                    {file.sizeFormatted}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
