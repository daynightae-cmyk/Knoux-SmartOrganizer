/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * KNOuX SmartOrganizer — Unified Windows Desktop Shell Components
 * Authoritative Logo, Header Chrome, and 13-Section Sidebar
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { normalizeSection, useNavigation } from '../../context/NavigationContext';
import { NativeBridgePanel } from '../../native/NativeBridgePanel';
import { controlNativeWindow, getNativeShell, readBridgeStatus } from '../../native/client';
import type { BridgeStatusData } from '../../../shared/native-contracts';
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
  Sparkles,
  Sun,
  Moon,
} from 'lucide-react';

/**
 * Custom event used by the shared shell chrome to request the global
 * KNOuX Assistant panel. Keeping the trigger inside the titlebar (a reserved
 * chrome slot) means the assistant can never float over page content,
 * footer action bars, or table rows.
 */
export const KNOUX_ASSISTANT_TOGGLE_EVENT = 'knoux:toggle-assistant';

export const requestAssistantToggle = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(KNOUX_ASSISTANT_TOGGLE_EVENT));
  }
};

/**
 * True only when a real native window bridge is present. The Vite browser
 * preview has no Electron shell yet (that is the next, separately verified
 * mission), so window buttons must not pretend to minimize/maximize/close.
 */
export const hasNativeWindowBridge = (): boolean => {
  if (typeof window === 'undefined') return false;
  const w = window as unknown as Record<string, unknown>;
  return Boolean(w.knouxShell || w.electronAPI || w.knoUXNative);
};

const NATIVE_PENDING_NOTE = ' — native window bridge pending (preview only)';

/**
 * Shared props for the three Windows caption buttons, so every screen chrome
 * reports the same honest state instead of exposing dead clicks.
 */
export const windowControlProps = (kind: 'minimize' | 'maximize' | 'close') => {
  const native = hasNativeWindowBridge();
  const label = kind === 'minimize' ? 'Minimize' : kind === 'maximize' ? 'Maximize' : 'Close';
  return {
    disabled: !native,
    'aria-disabled': !native,
    title: native ? label : `${label}${NATIVE_PENDING_NOTE}`,
    'aria-label': native ? label : `${label}${NATIVE_PENDING_NOTE}`,
  };
};

export interface KNOuXNotificationEntry {
  id: string;
  title: string;
  body: string;
  tone: 'info' | 'warn';
}

/**
 * Honest, non-fabricated notices for the visual phase. These describe the real
 * state of the build; they are not simulated system alerts.
 */
export const SHELL_NOTIFICATIONS: KNOuXNotificationEntry[] = [
  {
    id: 'native-pending',
    title: 'Section engines remain preview-only',
    body: 'The read-only platform bridge can read machine/service summaries. Cleanup, repair, startup, file writes and AI actions remain staged previews.',
    tone: 'warn',
  },
  {
    id: 'fixture-data',
    title: 'Design fixture data',
    body: 'Counts, sizes and paths shown across KNOuX screens are isolated demo fixtures, not a live scan.',
    tone: 'info',
  },
  {
    id: 'window-controls',
    title: 'Window controls follow the native bridge',
    body: 'Minimize, maximize and close are enabled only inside the Electron client; the browser preview keeps them disabled.',
    tone: 'info',
  },
];

export interface KNOuXAssistantTriggerProps {
  className?: string;
  title?: string;
}

/**
 * Reserved chrome slot for the KNOuX AI Copilot launcher.
 */
export const KNOuXAssistantTrigger: React.FC<KNOuXAssistantTriggerProps> = ({
  className = '',
  title = 'Open KNOuX AI Copilot',
}) => (
  <button
    onClick={requestAssistantToggle}
    className={`relative p-1.5 rounded-lg hover:bg-[#122b54] text-slate-300 hover:text-white transition-colors cursor-pointer ${className}`}
    title={title}
    aria-label={title}
  >
    <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
    <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_5px_#10b981]" />
  </button>
);

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
  const normalizedActive = normalizeSection(activeSection);
  const [nativeStatus, setNativeStatus] = useState<BridgeStatusData | null>(null);
  const [nativePanelOpen, setNativePanelOpen] = useState(false);

  useEffect(() => {
    const api = getNativeShell();
    if (!api) return;
    let active = true;
    void readBridgeStatus()
      .then((envelope) => {
        if (active && envelope?.data?.bridge === 'ready') setNativeStatus(envelope.data);
      })
      .catch(() => {
        // Keep the honest browser-preview state if the handshake fails.
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <>
    <aside
      className={`w-56 shrink-0 bg-[#050e1f] border-r rtl:border-r-0 rtl:border-l border-[#0e223d] flex flex-col justify-between select-none h-full overflow-hidden z-20 ${className}`}
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

        {/* Navigation List — All 14 items */}
        <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5 knx-custom-scrollbar">
          {CANONICAL_SECTIONS.map((item) => {
            const Icon = item.icon;
            const isItemActive = normalizedActive === item.id;

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
          {nativeStatus ? (
            <button
              type="button"
              data-testid="native-bridge-status"
              onClick={() => setNativePanelOpen(true)}
              className="w-full text-start rounded-lg px-1.5 py-1 -mx-1.5 hover:bg-[#0a182d] transition-colors cursor-pointer"
              title={isArabic ? 'فتح تفاصيل جسر النظام للقراءة فقط' : 'Open read-only native bridge details'}
            >
              <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                <span className={`flex items-center gap-1.5 font-medium ${nativeStatus.providerMode === 'fixture' ? 'text-amber-300' : 'text-emerald-300'}`}>
                  <span
                    className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                      nativeStatus.providerMode === 'fixture'
                        ? 'bg-amber-400 shadow-[0_0_6px_#f59e0b]'
                        : 'bg-emerald-400 shadow-[0_0_6px_#10b981]'
                    }`}
                  />
                  {nativeStatus.providerMode === 'fixture'
                    ? isArabic
                      ? 'جسر تجريبي (تطوير)'
                      : 'Fixture bridge (dev)'
                    : isArabic
                    ? 'جسر أصلي v1 · قراءة فقط'
                    : 'Native bridge v1 · read-only'}
                </span>
                <span className="font-mono text-slate-500">v2.4.0</span>
              </div>
              <div className="text-[10px] text-slate-400 truncate">
                {nativeStatus.providerMode === 'fixture'
                  ? isArabic
                    ? 'بيانات تطوير غير مقاسة'
                    : 'Development data — not measured'
                  : isArabic
                  ? 'ملخص الجهاز والخدمات متاح'
                  : 'Measured machine + service summaries'}
              </div>
            </button>
          ) : (
            <>
              <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                <span className="flex items-center gap-1.5 text-cyan-300 font-medium" title="Native Windows engines are not connected in the browser preview.">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_6px_#22d3ee]" />
                  {isArabic ? 'معاينة مرئية — المحرك غير متصل' : 'Visual preview — engine not connected'}
                </span>
                <span className="font-mono text-slate-500">v2.4.0</span>
              </div>
              <div className="text-[10px] text-slate-400 truncate">
                {isArabic ? 'هيكل سطح مكتب ويندوز (معاينة)' : 'Windows Desktop Shell (preview)'}
              </div>
            </>
          )}
        </div>
      </div>
    </aside>
    <NativeBridgePanel
      open={nativePanelOpen}
      onClose={() => setNativePanelOpen(false)}
      isArabic={isArabic}
    />
    </>
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
 *
 * The command field is real on every screen: pages that own filtering pass
 * `searchQuery`/`onSearchChange` and keep their existing behaviour, while pages
 * that do not get the shell's own section finder (Ctrl/⌘+K, arrow keys, Enter,
 * Escape) so the advertised shortcut is never a fake placeholder.
 */
export const KNOuXTitleBar: React.FC<KNOuXTitleBarProps> = ({
  sectionName,
  sectionSubtitle,
  onNavigateHome,
  searchQuery,
  onSearchChange,
  searchPlaceholder,
  isArabic = false,
  onToggleArabic,
  onOpenNotifications,
  onOpenSettings,
}) => {
  const nav = useNavigation();
  const pageOwnsSearch = typeof onSearchChange === 'function';

  const [shellQuery, setShellQuery] = useState('');
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifSeen, setNotifSeen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const query = pageOwnsSearch ? searchQuery ?? '' : shellQuery;

  const sectionMatches = useMemo(() => {
    if (pageOwnsSearch) return [];
    const needle = query.trim().toLowerCase();
    if (!needle) return [];
    return CANONICAL_SECTIONS.filter((s) => {
      const ar = s.labelAr.toLowerCase();
      return (
        s.labelEn.toLowerCase().includes(needle) ||
        ar.includes(needle) ||
        s.target.includes(needle) ||
        s.id.includes(needle)
      );
    }).slice(0, 7);
  }, [query, pageOwnsSearch]);

  useEffect(() => {
    if (activeIndex >= sectionMatches.length) setActiveIndex(0);
  }, [sectionMatches.length, activeIndex]);

  // Ctrl / ⌘ + K focuses the command field anywhere in the shell; Escape backs out.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
        if (!pageOwnsSearch) setPaletteOpen(inputRef.current?.value.trim().length ? true : false);
        return;
      }
      if (e.key === 'Escape') {
        setPaletteOpen(false);
        setNotifOpen(false);
        if (document.activeElement === inputRef.current) inputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pageOwnsSearch]);

  const goToSection = (target: string) => {
    nav.navigateTo(target);
    setShellQuery('');
    setPaletteOpen(false);
    inputRef.current?.blur();
  };

  const handleQueryChange = (value: string) => {
    if (pageOwnsSearch) {
      onSearchChange?.(value);
      return;
    }
    setShellQuery(value);
    setPaletteOpen(value.trim().length > 0);
    setActiveIndex(0);
  };

  const handleQueryKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (pageOwnsSearch) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setPaletteOpen(true);
      setActiveIndex((i) => Math.min(i + 1, Math.max(sectionMatches.length - 1, 0)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const pick = sectionMatches[activeIndex] || sectionMatches[0];
      if (pick) goToSection(pick.target);
    }
  };

  const openNotifications = () => {
    setNotifSeen(true);
    if (onOpenNotifications) {
      onOpenNotifications();
      return;
    }
    setNotifOpen((prev) => !prev);
  };

  const openSettings = () => {
    if (onOpenSettings) {
      onOpenSettings();
      return;
    }
    nav.navigateTo('settings');
  };

  const goHome = () => {
    if (onNavigateHome) {
      onNavigateHome();
      return;
    }
    nav.navigateTo('home');
  };

  return (
    <header className="knoux-titlebar h-10 bg-[#040915] border-b border-[#0d213d] flex items-center justify-between px-3 text-xs select-none z-40 shrink-0">
      {/* Left: Brand Identity + Breadcrumb */}
      <div className="flex items-center gap-3 shrink-0">
        <KNOuXLogo size="sm" onClick={goHome} />
        {sectionName && (
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-400 border-l rtl:border-l-0 rtl:border-r border-[#0d213d] pl-3 rtl:pl-0 rtl:pr-3">
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
        <Search className="w-3.5 h-3.5 text-cyan-400 shrink-0 mr-2 rtl:mr-0 rtl:ml-2" />
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={paletteOpen}
          aria-controls="knoux-command-results"
          aria-autocomplete="list"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          onKeyDown={handleQueryKeyDown}
          onFocus={() => !pageOwnsSearch && shellQuery.trim() && setPaletteOpen(true)}
          placeholder={
            searchPlaceholder ||
            (isArabic
              ? 'ابحث في الملفات، التطبيقات، الإعدادات (Ctrl+K)...'
              : 'Search files, apps, settings, or ask KNOuX... (Ctrl+K)')
          }
          className="bg-transparent border-none text-[11px] text-slate-200 placeholder-slate-400 focus:outline-none flex-1 truncate"
        />
        <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-[#0d213d] text-[9px] font-mono text-cyan-300 border border-[#1b3f70] shrink-0 ml-1 rtl:ml-0 rtl:mr-1">
          Ctrl + K
        </kbd>

        {/* Shell section finder — only for pages that do not own the field. */}
        {!pageOwnsSearch && paletteOpen && (
          <div
            id="knoux-command-results"
            role="listbox"
            className="absolute top-[calc(100%+8px)] start-0 w-full rounded-xl bg-[#061226]/98 border border-[#1b3f70] shadow-[0_18px_45px_rgba(0,0,0,0.75)] backdrop-blur-md overflow-hidden z-50"
          >
            {sectionMatches.length > 0 ? (
              <>
                <div className="px-3 py-1.5 text-[9px] font-mono uppercase tracking-wider text-slate-500 border-b border-[#12294a]">
                  {isArabic ? 'الانتقال إلى قسم' : 'Jump to section'}
                </div>
                {sectionMatches.map((s, i) => {
                  const Icon = s.icon;
                  return (
                    <button
                      key={s.id}
                      role="option"
                      aria-selected={i === activeIndex}
                      onMouseEnter={() => setActiveIndex(i)}
                      onClick={() => goToSection(s.target)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-left rtl:text-right transition-colors cursor-pointer ${
                        i === activeIndex ? 'bg-[#0f2a52] text-white' : 'text-slate-300 hover:bg-[#0b1e3c]'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span className="text-[11px] font-medium truncate flex-1">
                        {isArabic ? s.labelAr : s.labelEn}
                      </span>
                      <span className="font-mono text-[9px] text-slate-500 shrink-0">/{s.target}</span>
                    </button>
                  );
                })}
              </>
            ) : (
              <div className="px-3 py-3 text-[11px] text-slate-400">
                {isArabic
                  ? `لا يوجد قسم مطابق لـ «${query.trim()}» — جرّب اسم القسم أو المسار.`
                  : `No KNOuX section matches “${query.trim()}” — try a section name or route.`}
              </div>
            )}
            <div className="px-3 py-1.5 text-[9px] text-slate-500 font-mono border-t border-[#12294a] flex items-center justify-between">
              <span>↑ ↓ select · Enter open · Esc close</span>
              <span>{isArabic ? 'تصفح الأقسام' : 'Section navigator'}</span>
            </div>
          </div>
        )}
      </div>

      {/* Right Controls: Language, Notifications, Assistant, Settings, Windows buttons */}
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
          onClick={nav.toggleTheme}
          aria-pressed={nav.theme === 'light'}
          title={
            nav.theme === 'light'
              ? isArabic
                ? 'التبديل إلى الوضع الداكن'
                : 'Switch to dark theme'
              : isArabic
              ? 'التبديل إلى الوضع الفاتح'
              : 'Switch to light theme'
          }
          aria-label={
            nav.theme === 'light'
              ? isArabic
                ? 'التبديل إلى الوضع الداكن'
                : 'Switch to dark theme'
              : isArabic
              ? 'التبديل إلى الوضع الفاتح'
              : 'Switch to light theme'
          }
          className="p-1.5 rounded-lg bg-[#0a1a38] hover:bg-[#122b54] border border-[#1a3860] text-cyan-300 hover:text-white transition-colors cursor-pointer"
        >
          {nav.theme === 'light' ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
        </button>

        <div className="relative">
          <button
            onClick={openNotifications}
            aria-expanded={notifOpen}
            className="relative p-1.5 rounded-lg hover:bg-[#122b54] text-slate-300 hover:text-white transition-colors cursor-pointer"
            title={onOpenNotifications ? 'Notifications' : 'Phase status notices'}
            aria-label={onOpenNotifications ? 'Notifications' : 'Phase status notices'}
          >
            <Bell className="w-3.5 h-3.5 text-slate-300" />
            {!notifSeen && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 shadow-[0_0_6px_#ef4444]" />
            )}
          </button>

          {!onOpenNotifications && notifOpen && (
            <div className="absolute top-[calc(100%+10px)] end-0 w-[330px] rounded-xl bg-[#061226]/98 border border-[#1b3f70] shadow-[0_18px_45px_rgba(0,0,0,0.75)] backdrop-blur-md overflow-hidden z-50">
              <div className="px-3 py-2 flex items-center justify-between border-b border-[#12294a]">
                <span className="text-[11px] font-bold text-white">
                  {isArabic ? 'تنبيهات المرحلة الحالية' : 'Current phase notices'}
                </span>
                <span className="font-mono text-[9px] text-cyan-300">{SHELL_NOTIFICATIONS.length}</span>
              </div>
              <div className="max-h-[280px] overflow-y-auto knx-custom-scrollbar">
                {SHELL_NOTIFICATIONS.map((n) => (
                  <div key={n.id} className="px-3 py-2 border-b border-[#0e223d] last:border-b-0">
                    <div className="flex items-start gap-2">
                      <span
                        className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${
                          n.tone === 'warn' ? 'bg-amber-400' : 'bg-cyan-400'
                        }`}
                      />
                      <div className="min-w-0">
                        <div className="text-[11px] font-semibold text-slate-100">{n.title}</div>
                        <div className="text-[10px] text-slate-400 leading-relaxed mt-0.5">{n.body}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-3 py-2 flex items-center justify-between bg-[#040d1c] border-t border-[#12294a]">
                <button
                  onClick={() => {
                    setNotifOpen(false);
                    nav.navigateTo('settings');
                  }}
                  className="text-[10px] text-cyan-300 hover:text-white font-medium cursor-pointer"
                >
                  {isArabic ? 'فتح الإعدادات' : 'Open Settings'}
                </button>
                <button
                  onClick={() => setNotifOpen(false)}
                  className="text-[10px] text-slate-400 hover:text-white font-medium cursor-pointer"
                >
                  {isArabic ? 'إغلاق' : 'Dismiss'}
                </button>
              </div>
            </div>
          )}
        </div>

        <KNOuXAssistantTrigger />

        <button
          onClick={openSettings}
          className="p-1.5 rounded-lg hover:bg-[#122b54] text-slate-300 hover:text-white transition-colors cursor-pointer"
          title="Settings"
          aria-label="Settings"
        >
          <Settings className="w-3.5 h-3.5 text-slate-300" />
        </button>

        {/* Windows Standard Controls */}
        <div className="flex items-center ml-1 rtl:ml-0 rtl:mr-1 border-l rtl:border-l-0 rtl:border-r border-[#0e223d] pl-2 rtl:pl-0 rtl:pr-2 gap-1 text-slate-400">
          <button
            {...windowControlProps('minimize')}
            onClick={() => void controlNativeWindow('minimize')}
            className="w-6 h-6 flex items-center justify-center hover:text-white hover:bg-[#122b4e] rounded transition-colors disabled:opacity-45 disabled:hover:bg-transparent disabled:hover:text-slate-400 disabled:cursor-not-allowed"
          >
            <Minus className="w-3 h-3" />
          </button>
          <button
            {...windowControlProps('maximize')}
            onClick={() => void controlNativeWindow('maximize')}
            className="w-6 h-6 flex items-center justify-center hover:text-white hover:bg-[#122b4e] rounded transition-colors disabled:opacity-45 disabled:hover:bg-transparent disabled:hover:text-slate-400 disabled:cursor-not-allowed"
          >
            <Square className="w-2.5 h-2.5" />
          </button>
          <button
            {...windowControlProps('close')}
            onClick={() => void controlNativeWindow('close')}
            className="w-6 h-6 flex items-center justify-center hover:text-white hover:bg-rose-600 rounded transition-colors disabled:opacity-45 disabled:hover:bg-transparent disabled:hover:text-slate-400 disabled:cursor-not-allowed"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>
    </header>
  );
};
