/**
 * KNOuX SmartOrganizer — Application Dossier & Live Operation Preview (Right Inspector)
 * Matches REF-02 Right Column Inspector
 */

import React, { useState } from 'react';
import {
  Pin,
  ShieldCheck,
  ExternalLink,
  Play,
  Trash2,
  Wrench,
  Shuffle,
  RotateCw,
  FolderOpen,
  CheckCircle,
  AlertTriangle,
  Download,
  ShieldAlert,
  Clock,
  Terminal,
} from 'lucide-react';
import { InstalledAppItem } from '../../lib/app-inventory';
import { AppIcon } from './AppIcon';

interface ApplicationDossierProps {
  app: InstalledAppItem;
  onTriggerAction: (actionName: string) => void;
  locale: 'en' | 'ar';
}

export function ApplicationDossier({
  app,
  onTriggerAction,
  locale,
}: ApplicationDossierProps) {
  const [isPinned, setIsPinned] = useState(true);

  return (
    <div className="w-80 xl:w-96 shrink-0 flex flex-col gap-2.5 select-none overflow-y-auto app-scrollbar">
      {/* Card 1: Application Dossier */}
      <div className="app-card-surface rounded-xl p-3.5 border border-[#132c52] space-y-3">
        {/* Header with Title and Pin */}
        <div className="flex items-center justify-between pb-2 border-b border-[#0f2545]">
          <div className="flex items-center gap-2">
            <span className="text-cyan-400 font-bold text-xs flex items-center gap-1.5">
              <span>[❖]</span> {locale === 'en' ? 'Application Dossier' : 'ملف التطبيق'}
            </span>
          </div>

          <button
            onClick={() => setIsPinned(!isPinned)}
            className={`p-1 rounded transition-colors cursor-pointer ${
              isPinned ? 'text-cyan-400' : 'text-slate-500 hover:text-slate-300'
            }`}
            title={isPinned ? 'Pinned' : 'Unpin'}
          >
            <Pin className="w-3.5 h-3.5 rotate-45" />
          </button>
        </div>

        {/* Big Application Header */}
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#071324] border border-cyan-500/30 p-1 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(36,118,255,0.25)]">
            <AppIcon name={app.name} className="w-10 h-10" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-1">
              <h3 className="text-sm font-bold text-white truncate" title={app.name}>
                {app.name}
              </h3>
              <span className="px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-[9px] font-semibold flex items-center gap-1 shrink-0">
                <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" />
                <span>Trusted Publisher</span>
              </span>
            </div>

            <div className="text-xs text-slate-400 truncate mt-0.5">
              {app.publisher}
            </div>
          </div>
        </div>

        {/* Metadata Specs Table */}
        <div className="space-y-1.5 text-[11px] pt-1">
          <div className="flex items-start justify-between py-0.5">
            <span className="text-slate-400">Version</span>
            <span className="font-mono text-slate-200 text-right truncate max-w-[190px]">
              {app.version} (Official Build)
            </span>
          </div>

          <div className="flex items-start justify-between py-0.5">
            <span className="text-slate-400">Install Scope</span>
            <span className="text-slate-200 text-right">{app.scope}</span>
          </div>

          <div className="flex items-start justify-between py-0.5">
            <span className="text-slate-400">Source</span>
            <span className="text-slate-200 text-right">{app.source}</span>
          </div>

          <div className="flex items-start justify-between py-0.5">
            <span className="text-slate-400 shrink-0">Install Location</span>
            <span className="font-mono text-cyan-300 text-[10px] text-right truncate max-w-[180px]" title={app.installLocation}>
              {app.installLocation}
            </span>
          </div>

          {/* Digital signature slot */}
          <div className="flex items-center justify-between py-0.5 bg-[#07152b] p-1.5 rounded border border-[#11294d]">
            <span className="text-slate-400 text-[10px]">Digital Signature</span>
            <div className="flex items-center gap-1 text-[10px] text-emerald-300">
              <CheckCircle className="w-3 h-3 text-emerald-400" />
              <span className="truncate max-w-[140px]">Digitally signed by {app.publisher.split(' ')[0]}</span>
              <button
                onClick={() => onTriggerAction('ViewSignature')}
                className="ml-1 px-1.5 py-0.2 rounded bg-[#0d223f] text-cyan-300 hover:text-white border border-[#1e467d] text-[9px]"
              >
                View
              </button>
            </div>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={() => onTriggerAction('Open')}
            className="app-tactile-btn py-2 rounded-lg bg-gradient-to-r from-[#2476ff] to-[#1c5fdb] hover:from-[#3282ff] hover:to-[#226cf0] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-[0_0_14px_rgba(36,118,255,0.5)] border border-cyan-400/50 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>Open Application</span>
          </button>

          <button
            onClick={() => onTriggerAction('Uninstall')}
            className="app-tactile-btn py-2 rounded-lg bg-[#140d18] hover:bg-[#221329] text-red-300 hover:text-red-200 text-xs font-semibold flex items-center justify-center gap-1.5 border border-red-500/50 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-400" />
            <span>Uninstall Review</span>
          </button>
        </div>

        {/* Secondary Action Grid (4 buttons) */}
        <div className="grid grid-cols-4 gap-1.5">
          <button
            onClick={() => onTriggerAction('Repair')}
            className="app-tactile-btn py-1.5 rounded bg-[#0a182d] hover:bg-[#122c50] text-slate-300 hover:text-white text-[10px] font-medium border border-[#173866] flex items-center justify-center gap-1 cursor-pointer"
          >
            <Wrench className="w-3 h-3 text-amber-400" />
            <span>Repair</span>
          </button>

          <button
            onClick={() => onTriggerAction('Modify')}
            className="app-tactile-btn py-1.5 rounded bg-[#0a182d] hover:bg-[#122c50] text-slate-300 hover:text-white text-[10px] font-medium border border-[#173866] flex items-center justify-center gap-1 cursor-pointer"
          >
            <Shuffle className="w-3 h-3 text-purple-400" />
            <span>Modify</span>
          </button>

          <button
            onClick={() => onTriggerAction('Update')}
            className="app-tactile-btn py-1.5 rounded bg-[#0a182d] hover:bg-[#122c50] text-slate-300 hover:text-white text-[10px] font-medium border border-[#173866] flex items-center justify-center gap-1 cursor-pointer"
          >
            <RotateCw className="w-3 h-3 text-cyan-400" />
            <span>Update Check</span>
          </button>

          <button
            onClick={() => onTriggerAction('Reveal')}
            className="app-tactile-btn py-1.5 rounded bg-[#0a182d] hover:bg-[#122c50] text-slate-300 hover:text-white text-[10px] font-medium border border-[#173866] flex items-center justify-center gap-1 cursor-pointer"
          >
            <FolderOpen className="w-3 h-3 text-slate-400" />
            <span>Reveal Location</span>
          </button>
        </div>

        {/* Recent Verified History */}
        <div className="pt-2 border-t border-[#0f2545] space-y-1.5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>{locale === 'en' ? 'Recent Verified History' : 'السجل الموثق الأخير'}</span>
            </span>
            <button
              onClick={() => onTriggerAction('History')}
              className="text-[10px] text-cyan-400 hover:underline font-normal cursor-pointer"
            >
              View All
            </button>
          </div>

          <div className="space-y-1 text-[10px] font-mono">
            {app.history.map((h, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between py-0.5 text-slate-400"
              >
                <span>{h.date}</span>
                <span className="text-slate-300 truncate max-w-[130px]">{h.event}</span>
                <span className="text-emerald-400 flex items-center gap-0.5 font-sans font-bold">
                  ✓ Verified
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Card 2: Live Operation Preview */}
      <div className="app-card-surface rounded-xl p-3.5 border border-[#132c52] space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-[#0f2545]">
          <div className="flex items-center gap-2">
            <Play className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400" />
            <h4 className="text-xs font-bold text-white tracking-wide">
              {locale === 'en' ? 'Live Operation Preview' : 'معاينة العملية الحية'}
            </h4>
          </div>

          <span className="px-2 py-0.5 rounded-full bg-[#1e1338] border border-purple-500/50 text-purple-300 text-[9px] font-mono font-semibold">
            UI Preview — Engine integration pending
          </span>
        </div>

        {/* Target Details */}
        <div className="flex items-start gap-3 p-2 rounded-lg bg-[#07152b] border border-[#11294d]">
          <div className="w-8 h-8 rounded-lg bg-[#0e2447] border border-cyan-500/30 flex items-center justify-center text-cyan-300 shrink-0">
            <Download className="w-4 h-4 text-cyan-400" />
          </div>

          <div className="min-w-0 text-[11px] space-y-0.5">
            <div>
              <span className="text-slate-400">Operation: </span>
              <span className="font-semibold text-white">Update Application</span>
            </div>
            <div className="truncate">
              <span className="text-slate-400">Target: </span>
              <span className="font-semibold text-cyan-200">
                {app.name} ({app.version} → 124.0.2478.32)
              </span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-amber-300">
              <ShieldAlert className="w-3 h-3 text-amber-400" />
              <span>Requires administrator privileges</span>
            </div>
          </div>
        </div>

        {/* Two-Column Area: Proposed Steps & Event Log Preview */}
        <div className="grid grid-cols-2 gap-2 text-[10px]">
          {/* Proposed Steps */}
          <div className="p-2 rounded-lg bg-[#050e1a] border border-[#0f223f] space-y-1">
            <div className="font-bold text-slate-300 mb-1 text-[10px]">Proposed Steps</div>
            <ol className="list-decimal list-inside space-y-0.5 text-slate-400 leading-tight">
              <li>Validate digital signature and source integrity</li>
              <li>Create system restore point (recommended)</li>
              <li>Download and verify updated package</li>
              <li>Close running processes (if required)</li>
              <li>Install update and verify installation</li>
              <li>Perform post-installation health check</li>
            </ol>
          </div>

          {/* Event Log Preview */}
          <div className="p-2 rounded-lg bg-[#050e1a] border border-[#0f223f] space-y-1 font-mono">
            <div className="font-bold text-slate-300 mb-1 text-[10px]">Event Log (Preview)</div>
            <div className="space-y-0.5 text-slate-400 text-[9px] leading-tight">
              <div>[10:24:01] Initializing operation...</div>
              <div>[10:24:01] Checking installation...</div>
              <div>[10:24:01] Validating signature...</div>
              <div>[10:24:01] Preparing download...</div>
              <div className="text-purple-300">[10:24:01] Engine integration pending...</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
