/**
 * KNOuX SmartOrganizer — Applications Software Command Center Page
 * Mandatory Target: REF-02_Applications_Software_Command.png (1672x941 native)
 */

import React, { useState } from 'react';
import {
  Search,
  Bell,
  Settings,
  Shield,
  Minus,
  Square,
  X,
  Home,
  LayoutGrid,
  RefreshCw,
  Wrench,
  Gauge,
  HardDrive,
  FolderTree,
  Zap,
  Sliders,
  Lock,
  Cpu,
  Bot,
  Crown,
  Building2,
  Clock,
  Trash2,
  Sparkles,
  Database,
  Package,
  Link,
  CheckCircle2,
  AlertCircle,
  FileText,
  ChevronRight,
  ChevronLeft,
  Share2,
} from 'lucide-react';

import {
  DOMAIN_SERVICES_META,
  DomainServiceKey,
  INITIAL_METRICS,
  INSTALLED_APPLICATIONS_FIXTURE,
  InstalledAppItem,
} from '../lib/app-inventory';
import { ApplicationCommandSurface } from '../components/app/ApplicationCommandSurface';
import { ApplicationDossier } from '../components/app/ApplicationDossier';
import { ServiceWorkspacesModal } from '../components/app/ServiceWorkspaces';
import { useNavigation } from '../context/NavigationContext';
import { KNOuXTitleBar, KNOuXSidebar } from '../components/shell/KNOuXShellComponents';
import '../applications-ref02.css';

interface ApplicationsPageProps {
  onNavigateSection?: (section: string) => void;
}

export function ApplicationsPage({ onNavigateSection }: ApplicationsPageProps) {
  const { navigateTo, isActive, locale, isArabic, toggleLocale, setLocale } = useNavigation();
  const [apps, setApps] = useState<InstalledAppItem[]>(INSTALLED_APPLICATIONS_FIXTURE);
  const [selectedApp, setSelectedApp] = useState<InstalledAppItem>(INSTALLED_APPLICATIONS_FIXTURE[0]);
  const [checkedAppIds, setCheckedAppIds] = useState<Set<string>>(new Set(['app-edge']));
  const [activeServiceModal, setActiveServiceModal] = useState<DomainServiceKey | null>(null);
  const [activeActionNotification, setActiveActionNotification] = useState<string | null>(null);

  // Toggle single app selection
  const handleToggleCheckApp = (id: string) => {
    setCheckedAppIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Toggle all visible apps selection
  const handleToggleCheckAll = () => {
    if (checkedAppIds.size === apps.length) {
      setCheckedAppIds(new Set());
    } else {
      setCheckedAppIds(new Set(apps.map((a) => a.id)));
    }
  };

  const handleRefreshInventory = () => {
    setActiveActionNotification('Inventory refreshed from Windows Registry & MSI database.');
    setTimeout(() => setActiveActionNotification(null), 3000);
  };

  const handleTriggerAction = (actionName: string) => {
    setActiveActionNotification(`[${actionName}] Action verified on ${selectedApp.name}. Engine integration pending.`);
    setTimeout(() => setActiveActionNotification(null), 3500);
  };

  // Resolve service icon
  const renderServiceIcon = (iconName: string, className = 'w-4 h-4') => {
    switch (iconName) {
      case 'LayoutGrid': return <LayoutGrid className={className} />;
      case 'ShieldCheck': return <Shield className={className} />;
      case 'Search': return <Search className={className} />;
      case 'Building2': return <Building2 className={className} />;
      case 'Clock': return <Clock className={className} />;
      case 'Trash2': return <Trash2 className={className} />;
      case 'Sparkles': return <Sparkles className={className} />;
      case 'RefreshCw': return <RefreshCw className={className} />;
      case 'Database': return <Database className={className} />;
      case 'Package': return <Package className={className} />;
      case 'Link': return <Link className={className} />;
      case 'Zap': return <Zap className={className} />;
      default: return <Sparkles className={className} />;
    }
  };

  // Compute staged selection aggregate size
  const selectedAppsList = apps.filter((a) => checkedAppIds.has(a.id));
  const selectedTotalBytes = selectedAppsList.reduce((acc, a) => acc + a.sizeBytes, 0);
  const selectedSizeFormatted =
    selectedTotalBytes > 1024 * 1024 * 1024
      ? `${(selectedTotalBytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
      : `${(selectedTotalBytes / (1024 * 1024)).toFixed(0)} MB`;

  return (
    <div
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
      className="w-screen h-screen flex flex-col bg-[#040a14] text-slate-100 overflow-hidden font-sans select-none relative"
      style={{
        fontFamily:
          locale === 'ar'
            ? "'Tajawal', system-ui, sans-serif"
            : "'Plus Jakarta Sans', system-ui, sans-serif",
      }}
    >
      {/* 00 — Thin Windows Title Bar & Global Header Chrome */}
      <KNOuXTitleBar
        sectionName={locale === 'ar' ? 'التطبيقات' : 'Applications'}
        sectionSubtitle={locale === 'ar' ? 'مركز قيادة البرمجيات' : 'Software Command Center'}
        onNavigateHome={() => (onNavigateSection ? onNavigateSection('home') : navigateTo('home'))}
        searchPlaceholder={locale === 'ar' ? 'ابحث عن التطبيقات والناشرين... (Ctrl+K)' : 'Search apps, publishers, features... (Ctrl+K)'}
        isArabic={locale === 'ar'}
        onToggleArabic={toggleLocale}
      />

      {/* Main Body Shell */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left Global Navigation Sidebar */}
        <KNOuXSidebar
          activeSection="applications"
          onNavigate={(sec) => (onNavigateSection ? onNavigateSection(sec) : navigateTo(sec))}
          isArabic={locale === 'ar'}
        />

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#061226] relative overflow-hidden">
          {/* Action Notification Toast */}
          {activeActionNotification && (
            <div className="absolute top-3 right-6 z-50 px-3.5 py-2 rounded-lg bg-cyan-950/90 border border-cyan-400 text-cyan-200 text-xs shadow-xl animate-fade-in flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              <span>{activeActionNotification}</span>
            </div>
          )}

          {/* 1. Hero Header Area with Atmospheric Planet Arc */}
          <div className="relative pt-3 pb-2 px-6 shrink-0 bg-gradient-to-b from-[#08172e] to-[#061226] border-b border-[#0f2444] select-none overflow-hidden">
            <div className="absolute inset-0 app-hero-arc pointer-events-none" />
            <div className="app-arc-line" />

            <div className="relative z-10 flex items-start justify-between">
              <div>
                {/* Breadcrumb */}
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-0.5">
                  <ChevronLeft className="w-3 h-3" />
                  <ChevronRight className="w-3 h-3" />
                  <span>{locale === 'en' ? 'Applications' : 'التطبيقات'}</span>
                </div>

                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">
                  {locale === 'en' ? 'Software Command' : 'مركز قيادة البرمجيات'}
                </h1>
                <p className="text-xs text-slate-300 mt-0.5 font-normal">
                  {locale === 'en'
                    ? 'Discover, install, manage, repair and maintain your Windows applications.'
                    : 'استكشف وثبّت وأدر وأصلح برامج ويندوز الخاصة بك بدقة وأمان.'}
                </p>
              </div>

              {/* Tagline on Far Right */}
              <div className="text-right hidden sm:block">
                <div className="text-xs font-semibold text-slate-300">
                  {locale === 'en' ? 'Your Apps. A Cleaner, Smarter Windows.' : 'تطبيقاتك. نظام ويندوز أنظف وأذكى.'}
                </div>
                <div className="text-[10px] text-cyan-400/90 mt-0.5 font-medium tracking-wide">
                  Organize &nbsp;•&nbsp; Maintain &nbsp;•&nbsp; Keep Control
                </div>
              </div>
            </div>

            {/* 2. Coverage Ribbon (5 Horizontal Metric Cards) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 mt-3">
              {/* Card 1: Installed Apps */}
              <div className="app-card-surface rounded-xl p-3 border border-[#132c52] flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-950/80 border border-blue-500/50 flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(36,118,255,0.35)]">
                  <LayoutGrid className="w-4 h-4 text-blue-400" />
                </div>
                <div className="min-w-0">
                  <div className="text-base font-black text-white font-mono leading-none">
                    {INITIAL_METRICS.installedAppsCount}
                  </div>
                  <div className="text-[11px] font-semibold text-slate-300 mt-1 truncate">
                    {locale === 'en' ? 'Installed Apps' : 'التطبيقات المثبتة'}
                  </div>
                  <div className="text-[9px] text-emerald-400 font-mono mt-0.5">
                    {INITIAL_METRICS.installedAppsChange}
                  </div>
                </div>
              </div>

              {/* Card 2: Publishers */}
              <div className="app-card-surface rounded-xl p-3 border border-[#132c52] flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-purple-950/80 border border-purple-500/50 flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(168,85,247,0.35)]">
                  <Building2 className="w-4 h-4 text-purple-400" />
                </div>
                <div className="min-w-0">
                  <div className="text-base font-black text-white font-mono leading-none">
                    {INITIAL_METRICS.publishersCount}
                  </div>
                  <div className="text-[11px] font-semibold text-slate-300 mt-1 truncate">
                    {locale === 'en' ? 'Publishers' : 'الناشرون'}
                  </div>
                  <div className="text-[9px] text-slate-400 mt-0.5 truncate">
                    {INITIAL_METRICS.publishersSubtitle}
                  </div>
                </div>
              </div>

              {/* Card 3: Available Maintenance Actions */}
              <div className="app-card-surface rounded-xl p-3 border border-[#132c52] flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-950/80 border border-amber-500/50 flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(245,158,11,0.35)]">
                  <Wrench className="w-4 h-4 text-amber-400" />
                </div>
                <div className="min-w-0">
                  <div className="text-base font-black text-white font-mono leading-none">
                    {INITIAL_METRICS.availableMaintenanceCount}
                  </div>
                  <div className="text-[11px] font-semibold text-slate-300 mt-1 truncate">
                    {locale === 'en' ? 'Available Maintenance Actions' : 'إجراءات الصيانة المتاحة'}
                  </div>
                  <div className="text-[9px] text-amber-300 font-mono mt-0.5 truncate">
                    {INITIAL_METRICS.maintenanceBreakdown}
                  </div>
                </div>
              </div>

              {/* Card 4: Pending Updates */}
              <div className="app-card-surface rounded-xl p-3 border border-[#132c52] flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-red-950/80 border border-red-500/50 flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(239,68,68,0.35)]">
                  <RefreshCw className="w-4 h-4 text-red-400" />
                </div>
                <div className="min-w-0">
                  <div className="text-base font-black text-white font-mono leading-none">
                    {INITIAL_METRICS.pendingUpdatesCount}
                  </div>
                  <div className="text-[11px] font-semibold text-slate-300 mt-1 truncate">
                    {locale === 'en' ? 'Pending Updates' : 'تحديثات معلقة'}
                  </div>
                  <div className="text-[9px] text-red-300 font-mono mt-0.5 truncate">
                    {INITIAL_METRICS.pendingUpdatesBreakdown}
                  </div>
                </div>
              </div>

              {/* Card 5: Software Storage */}
              <div className="app-card-surface rounded-xl p-3 border border-[#132c52] flex items-center gap-3 col-span-2 sm:col-span-1">
                <div className="w-9 h-9 rounded-lg bg-emerald-950/80 border border-emerald-500/50 flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(16,185,129,0.35)]">
                  <Database className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <div className="text-base font-black text-white font-mono leading-none">
                    {INITIAL_METRICS.softwareStorageFormatted}
                  </div>
                  <div className="text-[11px] font-semibold text-slate-300 mt-1 truncate">
                    {locale === 'en' ? 'Software Storage' : 'حجم التخزين'}
                  </div>
                  <div className="text-[9px] text-emerald-400 font-mono mt-0.5 truncate">
                    {INITIAL_METRICS.storagePercentageOfDrive}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Main Center Content: Table Register & Right Dossier */}
          <div className="flex-1 flex gap-3 px-6 py-2.5 min-h-0 overflow-hidden">
            {/* Left-Center Main Register */}
            <ApplicationCommandSurface
              apps={apps}
              selectedApp={selectedApp}
              onSelectApp={setSelectedApp}
              checkedAppIds={checkedAppIds}
              onToggleCheckApp={handleToggleCheckApp}
              onToggleCheckAll={handleToggleCheckAll}
              onRefreshInventory={handleRefreshInventory}
              onTriggerAction={handleTriggerAction}
              locale={locale}
            />

            {/* Right Dossier Inspector */}
            <ApplicationDossier
              app={selectedApp}
              onTriggerAction={handleTriggerAction}
              locale={locale}
            />
          </div>

          {/* 5. Conditional Batch Selection Bar — kept in the normal flow directly above the
               service palette so it can never occlude the palette cards. */}
          {checkedAppIds.size > 0 && (
            <div className="mx-6 mb-1.5 shrink-0 p-2.5 rounded-xl bg-[#091a33]/95 border border-[#2476ff]/70 shadow-[0_0_25px_rgba(36,118,255,0.4)] backdrop-blur-md flex items-center justify-between gap-3 text-xs animate-slide-up">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-[#2476ff] text-white flex items-center justify-center font-bold text-xs">
                  {checkedAppIds.size}
                </div>
                <div>
                  <span className="font-bold text-white">
                    {checkedAppIds.size} {checkedAppIds.size === 1 ? 'application' : 'applications'} selected
                  </span>
                  <span className="text-slate-400 text-[11px] ml-2">
                    ({selectedSizeFormatted} aggregate footprint)
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleTriggerAction('Batch Uninstall')}
                  className="px-3 py-1.5 rounded-md bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-500/50 text-xs font-semibold cursor-pointer"
                >
                  Batch Uninstall Review
                </button>
                <button
                  onClick={() => handleTriggerAction('Batch Update')}
                  className="px-3 py-1.5 rounded-md bg-[#0e274d] hover:bg-[#163c75] text-cyan-200 border border-[#2476ff]/60 text-xs font-semibold cursor-pointer"
                >
                  Batch Update Check
                </button>
                <button
                  onClick={() => handleTriggerAction('Export CSV')}
                  className="px-3 py-1.5 rounded-md bg-[#071325] hover:bg-[#0c1f38] text-slate-300 border border-[#142e56] text-xs cursor-pointer"
                >
                  Export Inventory
                </button>
                <button
                  onClick={() => setCheckedAppIds(new Set())}
                  className="px-2.5 py-1.5 rounded-md text-slate-400 hover:text-white text-xs cursor-pointer"
                >
                  Deselect All
                </button>
              </div>
            </div>
          )}

{/* 4. Bottom 12 Domain Service Cards */}
          <div className="px-6 py-2 bg-[#050e1d] border-t border-[#0e223d] shrink-0 select-none">
            <div className="flex items-center justify-between pb-1 mb-1.5">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                {locale === 'en' ? 'Application Management Services' : 'خدمات إدارة البرمجيات'}
              </span>
              <span className="text-[10px] text-slate-500">
                {locale === 'en' ? 'Click card to open service workspace' : 'انقر على البطاقة لفتح مساحة العمل'}
              </span>
            </div>

            {/* 2 rows × 6 cols matrix of 12 complete domain service cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
              {DOMAIN_SERVICES_META.map((service) => (
                <button
                  key={service.key}
                  onClick={() => setActiveServiceModal(service.key)}
                  className="p-2 rounded-lg bg-[#07152b] hover:bg-[#0c1f3c] border border-[#132c52] hover:border-[#1d427b] text-left transition-all cursor-pointer flex items-center gap-2 group"
                >
                  <div
                    className="w-7 h-7 rounded-md flex items-center justify-center shrink-0 border"
                    style={{
                      backgroundColor: 'rgba(15, 33, 60, 0.6)',
                      borderColor: 'rgba(36, 118, 255, 0.3)',
                      color: service.color,
                    }}
                  >
                    {renderServiceIcon(service.iconName, 'w-3.5 h-3.5')}
                  </div>

                  <div className="min-w-0">
                    <div className="text-[11px] font-bold text-slate-200 group-hover:text-cyan-300 truncate transition-colors">
                      {locale === 'en' ? service.labelEn : service.labelAr}
                    </div>
                    <div className="text-[9px] text-slate-400 truncate">
                      {locale === 'en' ? service.descEn : service.descAr}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          
        </main>
      </div>

      {activeServiceModal && (
        <ServiceWorkspacesModal
          serviceKey={activeServiceModal}
          onClose={() => setActiveServiceModal(null)}
          locale={locale}
        />
      )}

    </div>
  );
}
