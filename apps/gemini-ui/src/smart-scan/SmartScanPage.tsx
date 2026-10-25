/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * KNOuX SmartOrganizer — Smart Scan Master Workspace
 * Master reference implementation matching image_51a1aa50.png pixel-for-pixel
 */

import React, { useState } from 'react';
import { Sparkles, CheckCircle2, Settings, X, Info } from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';
import { KNOuXTitleBar, KNOuXSidebar } from '../components/shell/KNOuXShellComponents';
import { LiveProcessInspector } from '../components/common/LiveProcessInspector';
import { SmartScanHero } from './SmartScanHero';
import { ScanMetrics } from './ScanMetrics';
import { ScanServices } from './ScanServices';
import { ScanResults } from './ScanResults';
import { FindingsBreakdown } from './FindingsBreakdown';
import { RecentScans } from './RecentScans';
import { ScanReviewInspector } from './ScanReviewInspector';
import { ScanCommandBar } from './ScanCommandBar';
import { ScanServiceWorkspace } from './ScanServiceWorkspace';

import {
  KPI_METRICS_FIXTURE,
  SCAN_SERVICES_FIXTURE,
  SCAN_RESULTS_FIXTURE,
  BREAKDOWN_CATEGORIES_FIXTURE,
  RECENT_SCANS_FIXTURE,
} from './smartScan.fixtures';

import { ScanResultItem, ScanServiceMeta } from './smartScan.types';
import './smartScan.css';

export interface SmartScanPageProps {
  onNavigateSection?: (section: string) => void;
}

export const SmartScanPage: React.FC<SmartScanPageProps> = ({ onNavigateSection }) => {
  const { navigateTo, isArabic: globalArabic, toggleLocale } = useNavigation();
  const [localArabic, setLocalArabic] = useState<boolean | null>(null);
  const isArabic = localArabic !== null ? localArabic : globalArabic;
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [selectedResultId, setSelectedResultId] = useState<string>('temp_files');
  const [results, setResults] = useState<ScanResultItem[]>(SCAN_RESULTS_FIXTURE);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Active Service Workspace modal state
  const [activeServiceWorkspace, setActiveServiceWorkspace] = useState<ScanServiceMeta | null>(null);

  // Custom scan & Cleanup modals
  const [isCustomScanOpen, setIsCustomScanOpen] = useState(false);
  const [isCleanupModalOpen, setIsCleanupModalOpen] = useState(false);
  const [cleanProgress, setCleanProgress] = useState(0);
  const [isCleanDone, setIsCleanDone] = useState(false);

  const handleNavigate = (sec: string) => {
    if (onNavigateSection) {
      onNavigateSection(sec);
    }
  };

  const toggleItemCheck = (id: string) => {
    setResults((prev) =>
      prev.map((r) => (r.id === id ? { ...r, selected: !r.selected } : r))
    );
  };

  const toggleCheckAll = (checked: boolean) => {
    setResults((prev) => prev.map((r) => ({ ...r, selected: checked })));
  };

  const togglePathCheck = (itemId: string, pathId: string) => {
    setResults((prev) =>
      prev.map((r) => {
        if (r.id === itemId) {
          return {
            ...r,
            pathsPreview: r.pathsPreview.map((p) =>
              p.id === pathId ? { ...p, selected: !p.selected } : p
            ),
          };
        }
        return r;
      })
    );
  };

  // Filtered results
  const filteredResults = results.filter((item) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'junk') return item.category === 'junk';
    if (activeFilter === 'duplicates') return item.category === 'duplicates';
    if (activeFilter === 'large') return item.category === 'large';
    if (activeFilter === 'privacy') return item.category === 'privacy';
    if (activeFilter === 'other') return item.category === 'system' || item.category === 'other';
    return true;
  });

  const selectedItems = results.filter((r) => r.selected);
  const totalSelectedCount = selectedItems.reduce((acc, r) => acc + r.itemCount, 0);
  const totalSelectedSizeGB = selectedItems
    .reduce((acc, r) => acc + r.sizeGB, 0)
    .toFixed(1);

  const activeSelectedItem =
    results.find((r) => r.id === selectedResultId) || results[0];

  const handleRunSmartCleanup = () => {
    setIsCleanupModalOpen(true);
    setCleanProgress(0);
    setIsCleanDone(false);

    const interval = setInterval(() => {
      setCleanProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsCleanDone(true);
          return 100;
        }
        return prev + 10;
      });
    }, 120);
  };

  return (
    <div className={`smart-scan-viewport text-slate-100 font-sans select-none ${isArabic ? 'rtl' : 'ltr'}`}>
      {/* Top Titlebar */}
      <KNOuXTitleBar
        sectionName={isArabic ? 'الفحص الذكي' : 'Smart Scan'}
        sectionSubtitle={isArabic ? 'تحليل شامل وسريع للمنظومة' : 'Comprehensive System Diagnostics'}
        onNavigateHome={() => handleNavigate('home')}
        isArabic={isArabic}
        onToggleArabic={() => {
          toggleLocale();
          setLocalArabic(!isArabic);
        }}
        onOpenSettings={() => handleNavigate('settings')}
      />

      {/* Toast Feedback */}
      {toastMessage && (
        <div className="absolute top-12 right-6 z-50 px-4 py-2 rounded-xl bg-cyan-950/95 border border-cyan-400 text-cyan-200 text-xs shadow-2xl flex items-center gap-2 animate-fade-in backdrop-blur-md">
          <Info className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden relative">
        {/* Unified Sidebar */}
        <KNOuXSidebar
          activeSection="smart_scan"
          onNavigate={handleNavigate}
          isArabic={isArabic}
        />

        {/* Main Center Canvas + Fixed Bottom Dock */}
        <div className="flex-1 flex flex-col min-h-0">

        {/* Main Center Canvas — Zero Page Scroll Layout */}
        <main className="flex-1 flex flex-col overflow-y-auto bg-gradient-to-b from-[#040b18] via-[#06142a] to-[#040b18] p-3 gap-3 knx-custom-scrollbar min-h-0">
          
          {/* A. Hero Banner */}
          <SmartScanHero isArabic={isArabic} />

          {/* B. 6 KPI Cards Bar */}
          <ScanMetrics metrics={KPI_METRICS_FIXTURE} isArabic={isArabic} />

          {/* C. 10 Scan Services Command Deck */}
          <ScanServices
            services={SCAN_SERVICES_FIXTURE}
            activeServiceId={activeServiceWorkspace?.id}
            onSelectService={(srv) => setActiveServiceWorkspace(srv)}
            onOpenCustomScan={() => setIsCustomScanOpen(true)}
            isArabic={isArabic}
          />

          {/* D. Main Results + Findings Breakdown + Scan Review Inspector Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 lg:grid-rows-1 gap-3 flex-1 min-h-[260px]">
            {/* Left Column (6 Cols): Main Scan Results Table */}
            <div className="lg:col-span-6 h-full min-h-0">
              <ScanResults
                results={filteredResults}
                selectedId={selectedResultId}
                activeFilter={activeFilter}
                onFilterChange={setActiveFilter}
                onSelectRow={setSelectedResultId}
                onToggleItemCheck={toggleItemCheck}
                onToggleCheckAll={toggleCheckAll}
                isArabic={isArabic}
              />
            </div>

            {/* Center Column (3 Cols): Findings Breakdown & Recent Scans */}
            <div className="lg:col-span-3 flex flex-col gap-3 h-full min-h-0 overflow-y-auto knx-custom-scrollbar pr-0.5">
              <FindingsBreakdown
                categories={BREAKDOWN_CATEGORIES_FIXTURE}
                totalReclaimableGB={48.6}
                isArabic={isArabic}
              />
              <RecentScans records={RECENT_SCANS_FIXTURE} isArabic={isArabic} />
            </div>

            {/* Right Column (3 Cols): Scan Review Inspector Panel */}
            <div className="lg:col-span-3 h-full min-h-0">
              <ScanReviewInspector
                selectedItem={activeSelectedItem}
                onTogglePathCheck={togglePathCheck}
                isArabic={isArabic}
              />
            </div>
          </div>
        </main>

          {/* Fixed Bottom Dock — telemetry console + primary command bar.
              Kept outside the scrolling canvas so neither can ever paint over
              the other or over the results grid. */}
          <div className="shrink-0 flex flex-col gap-2 px-3 sm:px-4 pb-3 pt-2 bg-[#050e1f]/90 border-t border-[#11294a] backdrop-blur-md z-30">
            {/* E. Live Process Inspector Console — collapsed to a telemetry chip by
                default; expanding it grows the dock and shrinks the canvas. */}
            <LiveProcessInspector
              activeProcessName={isArabic ? 'محرك الفحص الذكي المباشر بوضع المراقبة' : 'KNOuX Smart Scan Live Engine Telemetry'}
              activeProcessCategory="SCAN_ENGINE"
              progressPercent={100}
              isExecuting={true}
              isArabic={isArabic}
              bounded
              maxHeightClassName="max-h-[240px]"
              defaultMinimized
              fillWidth
            />

            {/* F. Primary Command Bar */}
            <ScanCommandBar
              selectedCount={totalSelectedCount}
              totalSizeGB={totalSelectedSizeGB}
              onReviewSelection={() => setActiveFilter('all')}
              onExportReport={() =>
                showToast(isArabic ? 'تم تصدير ملخص تقرير الفحص بنجاح.' : 'Scan report preview summary exported successfully.')
              }
              onCancel={() => handleNavigate('home')}
              onRunSmartCleanup={handleRunSmartCleanup}
              isArabic={isArabic}
            />
          </div>
        </div>
      </div>

      {/* Service Workspace Modal */}
      {activeServiceWorkspace && (
        <ScanServiceWorkspace
          service={activeServiceWorkspace}
          onClose={() => setActiveServiceWorkspace(null)}
          onNavigateToWorkspace={handleNavigate}
          isArabic={isArabic}
        />
      )}

      {/* Custom Scan Modal */}
      {isCustomScanOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#08172e] border border-cyan-500/40 rounded-2xl w-full max-w-md p-5 shadow-2xl text-slate-100 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[#122e54] pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-cyan-400" />
                {isArabic ? 'إعدادات الفحص المخصص' : 'Custom Scan Options'}
              </h3>
              <button onClick={() => setIsCustomScanOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2 text-xs">
              {[
                { label: 'System Temp & Cache Files', checked: true },
                { label: 'Web Browsers History & Cookies', checked: true },
                { label: 'Duplicate Media & Photo Finder', checked: true },
                { label: 'Windows Registry Cleanup', checked: false },
                { label: 'Startup Boot Performance Scan', checked: true },
              ].map((opt, i) => (
                <label key={i} className="flex items-center justify-between p-2 rounded-xl bg-[#0d213e] border border-[#16345e] cursor-pointer">
                  <span className="font-medium text-slate-200">{opt.label}</span>
                  <input type="checkbox" defaultChecked={opt.checked} className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0" />
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-2 border-t border-[#122e54] pt-3">
              <button onClick={() => setIsCustomScanOpen(false)} className="px-4 py-1.5 rounded-xl bg-blue-600 text-xs font-bold text-white">
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Smart Cleanup Progress Modal */}
      {isCleanupModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#08172e] border border-cyan-400/50 rounded-2xl w-full max-w-md p-6 shadow-2xl text-slate-100 flex flex-col gap-4 items-center text-center">
            {!isCleanDone ? (
              <>
                <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-300 shadow-[0_0_20px_rgba(38,198,218,0.5)]">
                  <Sparkles className="w-7 h-7 animate-spin" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-white">
                    {isArabic ? 'جاري تنفيذ التنظيف الذكي...' : 'Running Smart Cleanup...'}
                  </h3>
                  <p className="text-xs text-slate-300 mt-1">
                    {isArabic ? 'تفرّغ الذاكرة وتطهير الملفات المؤقتة' : 'Staging files for cleanup and freeing disk space'}
                  </p>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-cyan-500/30">
                  <div className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full transition-all duration-300" style={{ width: `${cleanProgress}%` }} />
                </div>
                <span className="font-mono text-xs text-cyan-300 font-bold">{cleanProgress}%</span>
              </>
            ) : (
              <>
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.5)]">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-white">
                    {isArabic ? 'تم إعداد شواخص التنظيف بنجاح' : 'Cleanup Staged Successfully!'}
                  </h3>
                  <p className="text-xs text-emerald-300 mt-1 font-semibold">
                    {isArabic ? 'تم حجز 48.6 GB في قائمة الاستعادة الآمنة' : 'Reclaimed 48.6 GB in safe staging queue'}
                  </p>
                </div>
                <button
                  onClick={() => setIsCleanupModalOpen(false)}
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-bold text-xs cursor-pointer shadow-lg"
                >
                  Done
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
