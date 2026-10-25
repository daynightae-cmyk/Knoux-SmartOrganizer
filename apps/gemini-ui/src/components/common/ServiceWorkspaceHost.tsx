/**
 * KNOuX SmartOrganizer — Master Service Workspace Host
 * Universal workspace container for any of the 132 canonical service IDs across 11 worlds.
 */

import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Info,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Download,
  FileCheck,
  Zap,
  Lock,
} from 'lucide-react';

import {
  getServiceDescriptor,
  ServiceVisualDescriptor,
  RendererFamily,
} from '../../lib/service-ui-renderers';

import {
  LedgerDossierRenderer,
  SearchConsoleRenderer,
  IdentityDossierRenderer,
  VisualRuleBuilderRenderer,
  StagingImpactReviewRenderer,
  FileLedgerPreviewRenderer,
} from '../renderers/FamilyRenderersOne';

import {
  VolumeBaysRenderer,
  ZoomableTreemapRenderer,
  CandidateSafetyLedgerRenderer,
  BootRegisterRenderer,
  LivePulseChartsRenderer,
  ServiceCommanderLedgerRenderer,
} from '../renderers/FamilyRenderersTwo';

import {
  ServiceDependencyGraphRenderer,
  SafeDiagnosticsConsoleRenderer,
  RepairJournalRenderer,
  NetworkTopologyRenderer,
  DeviceAtlasRenderer,
  ScheduleNodeFlowRenderer,
} from '../renderers/FamilyRenderersThree';

interface ServiceWorkspaceHostProps {
  serviceId: string;
  onClose: () => void;
  locale?: 'en' | 'ar';
}

export const ServiceWorkspaceHost: React.FC<ServiceWorkspaceHostProps> = ({
  serviceId,
  onClose,
  locale = 'en',
}) => {
  const descriptor: ServiceVisualDescriptor = getServiceDescriptor(serviceId);
  const [activeToast, setActiveToast] = useState<string | null>(null);

  const isAr = locale === 'ar';

  const triggerDraftNotice = (actionMsg: string) => {
    setActiveToast(actionMsg);
    setTimeout(() => setActiveToast(null), 3500);
  };

  // Render specific family view
  const renderFamilyView = (family: RendererFamily) => {
    switch (family) {
      case 'Ledger+Dossier':
        return <LedgerDossierRenderer descriptor={descriptor} locale={locale} />;
      case 'Search Console':
        return <SearchConsoleRenderer descriptor={descriptor} locale={locale} />;
      case 'Identity Dossier':
        return <IdentityDossierRenderer descriptor={descriptor} locale={locale} />;
      case 'Visual Rule Builder':
        return <VisualRuleBuilderRenderer descriptor={descriptor} locale={locale} />;
      case 'Staging + Impact Review':
        return <StagingImpactReviewRenderer descriptor={descriptor} locale={locale} />;
      case 'File Ledger+Preview':
        return <FileLedgerPreviewRenderer descriptor={descriptor} locale={locale} />;
      case 'Volume Bays':
        return <VolumeBaysRenderer descriptor={descriptor} locale={locale} />;
      case 'Zoomable Treemap':
        return <ZoomableTreemapRenderer descriptor={descriptor} locale={locale} />;
      case 'Candidate Safety Ledger':
        return <CandidateSafetyLedgerRenderer descriptor={descriptor} locale={locale} />;
      case 'Boot Register':
        return <BootRegisterRenderer descriptor={descriptor} locale={locale} />;
      case 'Live Pulse Charts':
        return <LivePulseChartsRenderer descriptor={descriptor} locale={locale} />;
      case 'Service Commander Ledger':
        return <ServiceCommanderLedgerRenderer descriptor={descriptor} locale={locale} />;
      case 'Service Dependency Graph':
        return <ServiceDependencyGraphRenderer descriptor={descriptor} locale={locale} />;
      case 'Safe Diagnostics Console':
        return <SafeDiagnosticsConsoleRenderer descriptor={descriptor} locale={locale} />;
      case 'Repair Journal':
        return <RepairJournalRenderer descriptor={descriptor} locale={locale} />;
      case 'Network Topology':
        return <NetworkTopologyRenderer descriptor={descriptor} locale={locale} />;
      case 'Device Atlas':
        return <DeviceAtlasRenderer descriptor={descriptor} locale={locale} />;
      case 'Schedule Node Flow':
        return <ScheduleNodeFlowRenderer descriptor={descriptor} locale={locale} />;
      default:
        return <LedgerDossierRenderer descriptor={descriptor} locale={locale} />;
    }
  };

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md select-none font-sans"
    >
      <div className="w-full h-full max-w-6xl max-h-[92vh] bg-[#040a16] border border-[#1b3f70] rounded-2xl shadow-2xl flex flex-col overflow-hidden relative text-slate-100">
        {/* Active Toast */}
        {activeToast && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-cyan-950/90 border border-cyan-400 text-cyan-200 text-xs shadow-2xl animate-bounce flex items-center gap-2">
            <Info className="w-4 h-4 text-cyan-400" />
            <span>{activeToast}</span>
          </div>
        )}

        {/* 01 — TOP TITLE & NAVIGATION BAR */}
        <header className="px-4 py-3 bg-[#061226] border-b border-[#0f2444] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-[#081528] hover:bg-[#0d213d] border border-[#142e56] text-slate-300 hover:text-white transition cursor-pointer"
              title="Return to World Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div>
              <div className="flex items-center gap-2 text-[10.5px] font-mono text-cyan-400">
                <span className="uppercase">{isAr ? descriptor.worldLabelAr : descriptor.worldLabelEn}</span>
                <span>/</span>
                <span className="text-slate-400">{descriptor.serviceId}</span>
              </div>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-wide leading-tight">
                {isAr ? descriptor.labelAr : descriptor.labelEn}
              </h2>
            </div>
          </div>

          {/* Center Mandatory Safety Indicator Banner */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/50 text-[10.5px] font-mono text-cyan-300">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#22d3ee]" />
            <span className="font-bold tracking-wider uppercase">DESIGN PREVIEW • NOT CONNECTED • NO WINDOWS CHANGES</span>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            {/* Risk Class Badge */}
            <span
              className={`px-2.5 py-1 rounded-full font-mono text-[10px] font-bold uppercase border ${
                descriptor.riskClass === 'read-only'
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50'
                  : descriptor.riskClass === 'staged-change'
                  ? 'bg-amber-950/80 text-amber-300 border-amber-500/50'
                  : 'bg-red-950/80 text-red-300 border-red-500/50'
              }`}
            >
              {descriptor.riskClass}
            </span>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-[#081528] hover:bg-rose-950 hover:text-rose-300 border border-[#142e56] text-slate-400 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* 02 — SECONDARY CONFIGURATION & FAMILY RIBBON */}
        <div className="px-4 py-2 bg-[#050e1f] border-b border-[#0f2444] flex items-center justify-between text-xs shrink-0 select-none">
          <div className="flex items-center gap-2 text-[11px] text-slate-300">
            <span className="font-semibold text-slate-400">Renderer Family:</span>
            <span className="px-2 py-0.5 rounded bg-blue-950/80 text-cyan-300 border border-blue-500/40 font-mono font-bold">
              {descriptor.family}
            </span>
          </div>

          <div className="flex items-center gap-2 font-mono text-[10.5px] text-slate-400">
            <span>Mode: {descriptor.previewMode}</span>
            <span>•</span>
            <span>Native Execution: Disabled</span>
          </div>
        </div>

        {/* 03 — CENTRAL WORKSPACE VIEW (RENDERER FAMILY) */}
        <div className="flex-1 p-3 sm:p-4 min-h-0 overflow-hidden bg-gradient-to-b from-[#050c1b] via-[#050a15] to-[#030710]">
          {renderFamilyView(descriptor.family)}
        </div>

        {/* 04 — BOTTOM STAGING DOCK & SAFETY CONTROLS */}
        <footer className="px-4 py-2.5 bg-[#050e1f] border-t border-[#0f2444] flex items-center justify-between text-xs shrink-0 select-none">
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>Phase Two Native Connection Required for Execution</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => triggerDraftNotice('Draft configuration reset to baseline.')}
              className="px-3 py-1.5 rounded-lg bg-[#081528] hover:bg-[#0e213e] text-slate-300 border border-[#142e56] font-medium text-xs cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Draft</span>
            </button>

            <button
              onClick={() => triggerDraftNotice('Exported preview report summary as JSON draft.')}
              className="px-3 py-1.5 rounded-lg bg-[#081528] hover:bg-[#0e213e] text-cyan-300 border border-[#142e56] font-medium text-xs cursor-pointer flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Report</span>
            </button>

            <button
              onClick={() => triggerDraftNotice('Draft proposal plan validated. Real execution requires Phase Two.')}
              className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-[0_0_12px_rgba(37,99,235,0.6)] cursor-pointer flex items-center gap-1.5"
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>Review Draft Plan</span>
            </button>

            <button
              disabled
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 text-slate-500 border border-slate-700 font-semibold text-xs opacity-60 cursor-not-allowed flex items-center gap-1.5"
              title="Execution disabled in Design Preview Mode"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Execute Action (Disabled)</span>
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};
