/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * KNOuX SmartOrganizer — Unified Windows Desktop Shell Components
 * Authoritative Logo, Header Chrome, and 13-Section Sidebar
 */

import React from 'react';
import {
  Home,
  Target,
  FolderOpen,
  Box,
  FileText,
  HardDrive,
  Trash2,
  Rocket,
  Activity,
  Wrench,
  Settings2,
  Zap,
  Settings,
  Search,
  Bell,
  Minus,
  Square,
  X,
  Languages,
  CheckCircle2,
  Globe,
} from 'lucide-react';

export interface KNOuXLogoProps {
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  showText?: boolean;
  className?: string;
}

/**
 * Canonical KNOuX Logo Emblem
 * Vibrant royal-to-cyan gradient shield with bold white 'K'
 */
export const KNOuXLogo: React.FC<KNOuXLogoProps> = ({
  size = 'sm',
  onClick,
  showText = true,
  className = '',
}) => {
  const isSm = size === 'sm';
  const isLg = size === 'lg';

  const badgeClass = isSm
    ? 'w-6 h-6 rounded-md shadow-[0_0_12px_rgba(37,99,235,0.8)]'
    : isLg
    ? 'w-9 h-9 rounded-xl shadow-[0_0_18px_rgba(37,99,235,0.7)]'
    : 'w-7 h-7 rounded-lg shadow-[0_0_14px_rgba(37,99,235,0.75)]';

  const textKClass = isSm ? 'text-xs font-black' : isLg ? 'text-base font-black' : 'text-sm font-black';

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-2.5 select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      <div
        className={`${badgeClass} bg-gradient-to-tr from-[#1d4ed8] via-[#2563eb] to-[#38bdf8] flex items-center justify-center shrink-0 border border-cyan-400/30`}
      >
        <span className={`${textKClass} text-white leading-none tracking-tight`}>K</span>
      </div>
      {showText && (
        <div className="leading-tight">
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-white tracking-wide text-xs">KNOuX</span>
            <span className="font-medium text-slate-400 text-xs">SmartOrganizer</span>
          </div>
        </div>
      )}
    </div>
  );
};

export interface KNOuXSidebarItem {
  id: string;
  labelEn: string;
  labelAr: string;
  icon: React.ElementType;
  target: string;
  badge?: string;
}

export const CANONICAL_SECTIONS: KNOuXSidebarItem[] = [
  { id: 'home', labelEn: 'Home', labelAr: 'الرئيسية', icon: Home, target: 'home' },
  { id: 'smart_scan', labelEn: 'Smart Scan', labelAr: 'الفحص الذكي', icon: Target, target: 'smart_scan', badge: 'AI' },
  { id: 'studio', labelEn: 'Organization Studio', labelAr: 'استوديو التنظيم', icon: FolderOpen, target: 'studio' },
  { id: 'workspace', labelEn: 'Google Workspace', labelAr: 'خدمات Google', icon: Globe, target: 'workspace', badge: '1P' },
  { id: 'applications', labelEn: 'Applications', labelAr: 'إدارة التطبيقات', icon: Box, target: 'applications' },
  { id: 'files', labelEn: 'Files', labelAr: 'الملفات الذكية', icon: FileText, target: 'files' },
  { id: 'storage', labelEn: 'Storage', labelAr: 'أطلس التخزين', icon: HardDrive, target: 'storage' },
  { id: 'cleanup', labelEn: 'Cleanup', labelAr: 'معمل التنظيف', icon: Trash2, target: 'cleanup' },
  { id: 'startup', labelEn: 'Startup', labelAr: 'بدء التشغيل', icon: Rocket, target: 'startup' },
  { id: 'system', labelEn: 'System', labelAr: 'نبض النظام', icon: Activity, target: 'system' },
  { id: 'repair', labelEn: 'Repair', labelAr: 'معمل الإصلاح', icon: Wrench, target: 'repair' },
  { id: 'services', labelEn: 'Services', labelAr: 'خدمات ويندوز', icon: Settings2, target: 'services' },
  { id: 'automation', labelEn: 'Automation', labelAr: 'أتمتة العمليات', icon: Zap, target: 'automation' },
  { id: 'settings', labelEn: 'Settings', labelAr: 'الإعدادات', icon: Settings, target: 'settings' },
];

export interface KNOuXSidebarProps {
  activeSection: string;
  onNavigate: (section: string) => void;
  isArabic?: boolean;
  className?: string;
}

/**
 * Standard Left Navigation Sidebar
 * Enforces unified 13 sections with glowing active pill, top brand card, and bottom status
 */
export const KNOuXSidebar: React.FC<KNOuXSidebarProps> = ({
  activeSection,
  onNavigate,
  isArabic = false,
  className = '',
}) => {
  return (
    <aside
      className={`w-56 shrink-0 bg-[#050e1f] border-r border-[#0e223d] flex flex-col justify-between select-none h-full overflow-hidden z-20 ${className}`}
    >
      <div className="flex flex-col h-full overflow-hidden">
        {/* Top Brand Card */}
        <div
          onClick={() => onNavigate('home')}
          className="p-3.5 pb-2.5 flex items-center gap-3 border-b border-[#0e223d]/70 cursor-pointer hover:bg-[#07152b] transition-colors"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1e40af] via-[#2563eb] to-[#38bdf8] flex items-center justify-center shadow-[0_0_16px_rgba(37,99,235,0.7)] shrink-0 border border-cyan-400/40">
            <span className="text-base font-black text-white">K</span>
          </div>
          <div className="leading-tight">
            <div className="text-sm font-bold text-white tracking-wide">KNOuX</div>
            <div className="text-[11px] text-cyan-400 font-medium">SmartOrganizer</div>
          </div>
        </div>

        {/* Navigation List — All 13 items */}
        <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5 knx-custom-scrollbar">
          {CANONICAL_SECTIONS.map((item) => {
            const Icon = item.icon;
            const isItemActive =
              activeSection === item.id ||
              (activeSection === 'home' && item.id === 'home');

            const label = isArabic ? item.labelAr : item.labelEn;

            if (isItemActive) {
              return (
                <div
                  key={item.id}
                  onClick={() => onNavigate(item.target)}
                  className="relative flex items-center gap-2.5 px-3 py-2 rounded-xl bg-blue-600 text-white font-semibold text-xs shadow-[0_0_16px_rgba(37,99,235,0.6)] border border-cyan-400/50 cursor-pointer transition-all"
                >
                  <Icon className="w-4 h-4 text-white shrink-0" />
                  <span className="truncate flex-1">{label}</span>
                  {item.badge && (
                    <span className="px-1.5 py-0.2 rounded-full bg-cyan-400/25 text-[9px] font-mono text-cyan-200 uppercase font-bold border border-cyan-400/30">
                      {item.badge}
                    </span>
                  )}
                </div>
              );
            }

            return (
              <div
                key={item.id}
                onClick={() => onNavigate(item.target)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-[#0a182d] text-xs font-medium transition-colors cursor-pointer group"
              >
                <Icon className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 shrink-0 transition-colors" />
                <span className="truncate flex-1">{label}</span>
                {item.badge && (
                  <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[9px] font-mono text-slate-400 group-hover:text-cyan-300 uppercase">
                    {item.badge}
                  </span>
                )}
              </div>
            );
          })}
        </nav>

        {/* Bottom Engine Health / Status Card */}
        <div className="p-2.5 border-t border-[#0e223d]/70 bg-[#040b18]">
          <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_#10b981]" />
              {isArabic ? 'النظام متصل وآمن' : 'System Guard Active'}
            </span>
            <span className="font-mono text-slate-500">v2.4.0</span>
          </div>
          <div className="text-[10px] text-slate-400 truncate">
            {isArabic ? 'أبعاد Shell متوافقة' : 'Windows Desktop Shell'}
          </div>
        </div>
      </div>
    </aside>
  );
};

export interface KNOuXTitleBarProps {
  sectionName?: string;
  sectionSubtitle?: string;
  onNavigateHome?: () => void;
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;
  isArabic?: boolean;
  onToggleArabic?: () => void;
  onOpenNotifications?: () => void;
  onOpenSettings?: () => void;
}

/**
 * Standard Windows Desktop Top Titlebar Chrome
 */
export const KNOuXTitleBar: React.FC<KNOuXTitleBarProps> = ({
  sectionName,
  sectionSubtitle,
  onNavigateHome,
  searchQuery = '',
  onSearchChange,
  searchPlaceholder,
  isArabic = false,
  onToggleArabic,
  onOpenNotifications,
  onOpenSettings,
}) => {
  return (
    <header className="h-10 bg-[#040915] border-b border-[#0d213d] flex items-center justify-between px-3 text-xs select-none z-40 shrink-0">
      {/* Left: Brand Identity + Breadcrumb */}
      <div className="flex items-center gap-3 shrink-0">
        <KNOuXLogo size="sm" onClick={onNavigateHome} />
        {sectionName && (
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-400 border-l border-[#0d213d] pl-3">
            <span className="text-slate-400">{sectionName}</span>
            {sectionSubtitle && (
              <>
                <span className="text-slate-600">/</span>
                <span className="text-cyan-300 font-medium">{sectionSubtitle}</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Center: Global Search Pill */}
      <div className="relative flex items-center w-72 md:w-96 lg:w-[440px] px-3 py-1 rounded-full bg-[#081329] border border-[#17325c] hover:border-cyan-500/60 transition-all mx-3 shadow-inner">
        <Search className="w-3.5 h-3.5 text-cyan-400 shrink-0 mr-2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
          placeholder={
            searchPlaceholder ||
            (isArabic
              ? 'ابحث في الملفات، التطبيقات، الإعدادات (Ctrl+K)...'
              : 'Search files, apps, settings, or ask KNOuX... (Ctrl+K)')
          }
          className="bg-transparent border-none text-[11px] text-slate-200 placeholder-slate-400 focus:outline-none flex-1 truncate"
        />
        <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-[#0d213d] text-[9px] font-mono text-cyan-300 border border-[#1b3f70] shrink-0 ml-1">
          Ctrl + K
        </kbd>
      </div>

      {/* Right Controls: Language, Notifications, Settings, Windows buttons */}
      <div className="flex items-center gap-2 shrink-0">
        {onToggleArabic && (
          <button
            onClick={onToggleArabic}
            title="Toggle Arabic / English"
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#0a1a38] hover:bg-[#122b54] border border-[#1a3860] text-[11px] text-cyan-300 transition cursor-pointer"
          >
            <Languages className="w-3 h-3" />
            <span className="font-mono">{isArabic ? 'English' : 'العربية'}</span>
          </button>
        )}

        <button
          onClick={onOpenNotifications}
          className="relative p-1.5 rounded-lg hover:bg-[#122b54] text-slate-300 hover:text-white transition-colors cursor-pointer"
          title="Notifications"
        >
          <Bell className="w-3.5 h-3.5 text-slate-300" />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 shadow-[0_0_6px_#ef4444]" />
        </button>

        <button
          onClick={onOpenSettings}
          className="p-1.5 rounded-lg hover:bg-[#122b54] text-slate-300 hover:text-white transition-colors cursor-pointer"
          title="Settings"
        >
          <Settings className="w-3.5 h-3.5 text-slate-300" />
        </button>

        {/* Windows Standard Controls */}
        <div className="flex items-center ml-1 border-l border-[#0e223d] pl-2 gap-1 text-slate-400">
          <button
            className="w-6 h-6 flex items-center justify-center hover:text-white hover:bg-[#122b4e] rounded transition-colors"
            title="Minimize"
          >
            <Minus className="w-3 h-3" />
          </button>
          <button
            className="w-6 h-6 flex items-center justify-center hover:text-white hover:bg-[#122b4e] rounded transition-colors"
            title="Maximize"
          >
            <Square className="w-2.5 h-2.5" />
          </button>
          <button
            className="w-6 h-6 flex items-center justify-center hover:text-white hover:bg-rose-600 rounded transition-colors"
            title="Close"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>
    </header>
  );
};
