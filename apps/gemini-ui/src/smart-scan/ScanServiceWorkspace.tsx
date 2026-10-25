/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * KNOuX SmartOrganizer — Scan Service Workspace Container
 */

import React from 'react';
import { X, ExternalLink } from 'lucide-react';
import { ScanServiceMeta } from './smartScan.types';
import { QuickScanRenderer } from './service-renderers/QuickScanRenderer';
import { DeepScanRenderer } from './service-renderers/DeepScanRenderer';
import { DuplicateFinderRenderer } from './service-renderers/DuplicateFinderRenderer';
import { LargeFilesRenderer } from './service-renderers/LargeFilesRenderer';
import { JunkCleanerRenderer } from './service-renderers/JunkCleanerRenderer';
import { PrivacyTraceRenderer } from './service-renderers/PrivacyTraceRenderer';
import { StartupImpactRenderer } from './service-renderers/StartupImpactRenderer';
import { AppHealthRenderer } from './service-renderers/AppHealthRenderer';
import { SystemHealthPulseRenderer } from './service-renderers/SystemHealthPulseRenderer';
import { SmartRecommendationsRenderer } from './service-renderers/SmartRecommendationsRenderer';

export interface ScanServiceWorkspaceProps {
  service: ScanServiceMeta;
  onClose: () => void;
  onNavigateToWorkspace?: (ws: string) => void;
  isArabic?: boolean;
}

export const ScanServiceWorkspace: React.FC<ScanServiceWorkspaceProps> = ({
  service,
  onClose,
  onNavigateToWorkspace,
  isArabic = false,
}) => {
  const renderRenderer = () => {
    switch (service.id) {
      case 'quick_scan':
        return <QuickScanRenderer isArabic={isArabic} onClose={onClose} />;
      case 'deep_scan':
        return <DeepScanRenderer isArabic={isArabic} />;
      case 'duplicate_finder':
        return <DuplicateFinderRenderer isArabic={isArabic} onNavigateToWorkspace={onNavigateToWorkspace} />;
      case 'large_files_review':
        return <LargeFilesRenderer isArabic={isArabic} onNavigateToWorkspace={onNavigateToWorkspace} />;
      case 'junk_cleaner':
        return <JunkCleanerRenderer isArabic={isArabic} onNavigateToWorkspace={onNavigateToWorkspace} />;
      case 'privacy_trace_check':
        return <PrivacyTraceRenderer isArabic={isArabic} />;
      case 'startup_impact_check':
        return <StartupImpactRenderer isArabic={isArabic} onNavigateToWorkspace={onNavigateToWorkspace} />;
      case 'app_health_review':
        return <AppHealthRenderer isArabic={isArabic} onNavigateToWorkspace={onNavigateToWorkspace} />;
      case 'system_health_pulse':
        return <SystemHealthPulseRenderer isArabic={isArabic} onNavigateToWorkspace={onNavigateToWorkspace} />;
      case 'smart_recommendations':
      default:
        return <SmartRecommendationsRenderer isArabic={isArabic} />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#081830] border border-cyan-400/50 rounded-2xl w-full max-w-2xl p-5 shadow-2xl text-slate-100 flex flex-col gap-4 relative animate-fadeIn">
        {/* Header Close */}
        <div className="flex items-center justify-between border-b border-[#122e54] pb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-cyan-300 uppercase">
              SCAN SERVICE CONFIGURATION & PREVIEW
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-[#0b1d38] hover:bg-rose-900/60 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Renderer Content */}
        <div className="py-1">{renderRenderer()}</div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-[#122e54] pt-3 text-xs">
          <span className="text-[10px] text-slate-400 font-mono">
            Preview State: Read-Only Simulation · Windows System Protected
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition cursor-pointer"
          >
            {isArabic ? 'إغلاق' : 'Close Workspace'}
          </button>
        </div>
      </div>
    </div>
  );
};
