/**
 * KNOuX SmartOrganizer — Studio Main Page Shell
 * Section 01: Smart Organization Studio
 * Reference composition: REF-01_Smart_Organization_Studio.png (1672x941 native)
 */

import React, { useState } from 'react';
import { useStudio } from './context';
import {
  WindowsTitleBar,
  GlobalSidebar,
  CinematicHeader,
  TelemetryStrip,
  HorizontalStagesBar,
  StickyFooter,
} from './parts';
import { StudioModals } from './modals';
import { StudioCommandCenter } from './StudioCommandCenter';

// Workspaces for each of the 9 stages
import { SourceGrantWorkspace } from './workspaces/SourceGrantWorkspace';
import { VisualLibraryWorkspace } from './workspaces/VisualLibraryWorkspace';
import { CollectionComposer } from './workspaces/CollectionComposer';
import { OrganizationRuleBuilder } from './workspaces/OrganizationRuleBuilder';
import { DestinationInspector } from './workspaces/DestinationInspector';
import { PlanReviewWorkspace } from './workspaces/PlanReviewWorkspace';
import { ExecutionMonitor } from './workspaces/ExecutionMonitor';
import { HistoryUndoInspector } from './workspaces/HistoryUndoInspector';
import { SuggestionsReview } from './workspaces/SuggestionsReview';

export function StudioPage({ onNavigate }: { onNavigate?: (section: string) => void }) {
  const { activeStageId, locale } = useStudio();
  const [dpiScale, setDpiScale] = useState<'100%' | '125%' | '150%'>('100%');

  const renderActiveWorkspace = () => {
    switch (activeStageId) {
      case 1:
        return <SourceGrantWorkspace />;
      case 2:
        return <VisualLibraryWorkspace />;
      case 3:
        return <CollectionComposer />;
      case 4:
        return <OrganizationRuleBuilder />;
      case 5:
        return <DestinationInspector />;
      case 6:
        return <PlanReviewWorkspace />;
      case 7:
        return <ExecutionMonitor />;
      case 8:
        return <HistoryUndoInspector />;
      case 9:
        return <SuggestionsReview />;
      default:
        return <VisualLibraryWorkspace />;
    }
  };

  const scaleClass =
    dpiScale === '125%'
      ? 'scale-90 origin-top-left w-[111.1%] h-[111.1%]'
      : dpiScale === '150%'
      ? 'scale-75 origin-top-left w-[133.3%] h-[133.3%]'
      : 'w-full h-full';

  return (
    <div
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
      className="w-screen h-screen flex flex-col bg-[#050d1d] text-slate-100 overflow-hidden font-sans select-none relative"
      style={{
        fontFamily:
          locale === 'ar'
            ? "'Tajawal', system-ui, sans-serif"
            : "'Plus Jakarta Sans', system-ui, sans-serif",
      }}
    >
      <StudioCommandCenter />
      <StudioModals />

      {/* 00 — Thin Windows Title Bar */}
      <WindowsTitleBar />

      {/* Main App Container */}
      <div className={`flex flex-1 min-h-0 overflow-hidden ${scaleClass}`}>
        {/* Global Left Navigation Sidebar */}
        <GlobalSidebar onNavigate={onNavigate} />

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#061226] relative overflow-hidden">
          {/* Top Atmospheric Header Area */}
          <div className="shrink-0 bg-gradient-to-b from-[#08172e] to-[#061226] border-b border-[#0f2444] pb-1">
            {/* 01 — Cinematic Planet Header */}
            <CinematicHeader />

            {/* 02 — Authorization Telemetry Strip */}
            <TelemetryStrip />

            {/* 03 — Nine Horizontal Stages */}
            <HorizontalStagesBar />
          </div>

          {/* Dynamic Workspace Container (Active Stage 1-9) */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
            {renderActiveWorkspace()}
          </div>

          {/* 08 — Sticky Footer (hosts the DPI preview switch in its center slot) */}
          <StickyFooter
            dpiControl={
              <div className="hidden md:flex items-center gap-1 bg-[#091a33]/90 border border-[#173663] px-1.5 py-0.5 rounded text-[10px] text-slate-400">
                <span>DPI:</span>
                {(['100%', '125%', '150%'] as const).map((scale) => (
                  <button
                    key={scale}
                    onClick={() => setDpiScale(scale)}
                    className={`px-1 py-0.5 rounded cursor-pointer ${
                      dpiScale === scale ? 'bg-[#2476ff] text-white font-bold' : 'hover:text-white'
                    }`}
                  >
                    {scale}
                  </button>
                ))}
              </div>
            }
          />
        </main>
      </div>
    </div>
  );
}
