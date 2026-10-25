/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * KNOuX SmartOrganizer — REF-00 Home Command Center Main Page
 */

import React, { useState, useEffect } from 'react';
import '../home-command-center.css';
import { HomeCommandCenter, HomeCommandDeck } from '../components/home/HomeCommandCenter';
import { HomeDashboardPanels } from '../components/home/HomeDashboardPanels';
import { PageId } from '../lib/home-ui';
import { useNavigation } from '../context/NavigationContext';
import { KNOuXTitleBar, KNOuXSidebar } from '../components/shell/KNOuXShellComponents';
import {
  Search,
  ChevronRight,
  X,
  Bell,
  Settings,
  CheckCircle2,
  Info,
} from 'lucide-react';

interface HomePageProps {
  onNavigateSection?: (section: string) => void;
  onNavigate?: (section: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onNavigateSection,
  onNavigate,
}) => {
  const { currentSection, navigateTo: contextNavigateTo, isActive } = useNavigation();
  const [locale, setLocale] = useState<'en' | 'ar'>('en');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [paletteSearch, setPaletteSearch] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [headerSearch, setHeaderSearch] = useState('');

  const navigateTo = (page: PageId | string) => {
    contextNavigateTo(page);
    if (onNavigateSection) {
      onNavigateSection(page);
    } else if (onNavigate) {
      onNavigate(page);
    }
  };

  // Keyboard shortcut listener for Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsPaletteOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsPaletteOpen(false);
        setIsSettingsOpen(false);
        setIsNotificationsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Sync theme with HTML data-theme attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-page', 'home');
  }, [theme]);

  const isAr = locale === 'ar';

  const SEARCH_ITEMS = [
    { id: 'home', label: isAr ? 'الرئيسية' : 'Home', target: 'home' },
    { id: 'scan', label: isAr ? 'الفحص الذكي' : 'Smart Scan', target: 'smart_scan' },
    { id: 'studio', label: isAr ? 'استوديو التنظيم' : 'Organization Studio', target: 'studio' },
    { id: 'workspace', label: isAr ? 'خدمات Google' : 'Google Workspace', target: 'workspace' },
    { id: 'applications', label: isAr ? 'التطبيقات' : 'Applications', target: 'applications' },
    { id: 'files', label: isAr ? 'الملفات' : 'Files', target: 'files' },
    { id: 'storage', label: isAr ? 'التخزين' : 'Storage', target: 'storage' },
    { id: 'cleanup', label: isAr ? 'تنظيف المخلفات' : 'Cleanup', target: 'cleanup' },
    { id: 'startup', label: isAr ? 'بدء التشغيل' : 'Startup', target: 'startup' },
    { id: 'system', label: isAr ? 'نبض النظام' : 'System', target: 'system' },
    { id: 'repair', label: isAr ? 'مختبر الصيانة' : 'Repair', target: 'repair' },
    { id: 'services', label: isAr ? 'خدمات ويندوز' : 'Services', target: 'services' },
    { id: 'automation', label: isAr ? 'استوديو الأتمتة' : 'Automation', target: 'automation' },
  ];

  const filteredSections = SEARCH_ITEMS.filter((sec) =>
    sec.label.toLowerCase().includes(paletteSearch.toLowerCase()) ||
    sec.id.toLowerCase().includes(paletteSearch.toLowerCase())
  );

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      className="w-screen h-screen flex flex-col bg-[#050a15] text-slate-100 overflow-hidden font-sans select-none relative"
      style={{
        fontFamily: isAr
          ? "'Tajawal', -apple-system, BlinkMacSystemFont, sans-serif"
          : "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* Universal Desktop TitleBar */}
      <KNOuXTitleBar
        sectionName={isAr ? 'الرئيسية' : 'Home'}
        sectionSubtitle={isAr ? 'مركز القيادة الرئيسي' : 'Main Command Center'}
        onNavigateHome={() => navigateTo('home')}
        searchQuery={headerSearch}
        onSearchChange={setHeaderSearch}
        isArabic={isAr}
        onToggleArabic={() => setLocale(isAr ? 'en' : 'ar')}
        onOpenNotifications={() => setIsNotificationsOpen((prev) => !prev)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Content Layout with Sidebar */}
      <div className="flex flex-1 min-h-0 overflow-hidden relative">
        <KNOuXSidebar
          activeSection="home"
          onNavigate={(sec) => navigateTo(sec)}
          isArabic={isAr}
        />

        <main className="flex-1 h-full min-h-0 flex flex-col overflow-hidden bg-gradient-to-b from-[#050c1b] via-[#050a15] to-[#030710] px-4 py-2.5 gap-3">
          {/* REGION A & B: HERO & 6 KPIS IN ONE SINGLE ROW ACROSS TOP */}
          <HomeCommandCenter
            locale={locale}
            onNavigate={navigateTo}
            onOpenPalette={() => setIsPaletteOpen(true)}
            renderDeck={false}
          />

          {/* REGIONS C + D, E, F, G, H, I: CANONICAL TWO-COLUMN DASHBOARD */}
          <HomeDashboardPanels
            locale={locale}
            onNavigate={navigateTo}
            commandDeckNode={
              <HomeCommandDeck
                locale={locale}
                onNavigate={navigateTo}
              />
            }
          />
        </main>
      </div>

      {/* COMMAND PALETTE MODAL (Ctrl + K) */}
      {isPaletteOpen && (
        <div className="knx-modal-backdrop" onClick={() => setIsPaletteOpen(false)}>
          <div
            className="knx-modal-card max-w-lg"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center gap-2 pb-2.5 border-b border-slate-700">
              <Search className="w-4 h-4 text-cyan-400 shrink-0" />
              <input
                type="text"
                value={paletteSearch}
                onChange={(e) => setPaletteSearch(e.target.value)}
                autoFocus
                placeholder={
                  isAr
                    ? 'اكتب اسم القسم أو الإجراء للانتقال الفوري...'
                    : 'Type a workspace, service, or tool name...'
                }
                className="bg-transparent border-none outline-none text-white text-sm w-full placeholder-slate-500"
              />
              <button
                className="text-slate-400 hover:text-white p-1"
                onClick={() => setIsPaletteOpen(false)}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-2">
              {isAr ? 'الأقسام ومساحات العمل المتاحة' : 'Workspaces & Specialized Tools'}
            </div>

            <div className="flex flex-col gap-1 max-h-72 overflow-y-auto pr-1 mt-1">
              {filteredSections.map((sec) => {
                return (
                  <div
                    key={sec.id}
                    onClick={() => {
                      setIsPaletteOpen(false);
                      navigateTo(sec.target);
                    }}
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-800/80 cursor-pointer border border-transparent hover:border-slate-700 transition"
                  >
                    <span className="text-sm font-medium text-slate-200">{sec.label}</span>
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-2.5 border-t border-slate-800 text-[11px] text-slate-500">
              <span>{isAr ? 'اضغط Enter للتنقل' : 'Press Enter or click to navigate'}</span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">Esc to close</kbd>
            </div>
          </div>
        </div>
      )}

      {/* SETTINGS MODAL */}
      {isSettingsOpen && (
        <div className="knx-modal-backdrop" onClick={() => setIsSettingsOpen(false)}>
          <div
            className="knx-modal-card max-w-md"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-white text-sm">
                  {isAr ? 'إعدادات النظام العامة' : 'KNOuX SmartOrganizer Settings'}
                </span>
              </div>
              <button
                className="text-slate-400 hover:text-white p-1"
                onClick={() => setIsSettingsOpen(false)}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 py-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1.5">
                  {isAr ? 'لغة الواجهة (Language)' : 'Interface Language'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setLocale('en')}
                    className={`p-2 rounded-lg border text-center transition cursor-pointer ${
                      locale === 'en'
                        ? 'border-cyan-400 bg-cyan-950/40 text-cyan-200 font-bold'
                        : 'border-slate-800 bg-slate-900/60 text-slate-400'
                    }`}
                  >
                    English (LTR)
                  </button>
                  <button
                    onClick={() => setLocale('ar')}
                    className={`p-2 rounded-lg border text-center transition cursor-pointer ${
                      locale === 'ar'
                        ? 'border-cyan-400 bg-cyan-950/40 text-cyan-200 font-bold'
                        : 'border-slate-800 bg-slate-900/60 text-slate-400'
                    }`}
                  >
                    العربية (RTL)
                  </button>
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1.5">
                  {isAr ? 'المظهر والسمة (Theme)' : 'Color Theme'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setTheme('dark')}
                    className={`p-2 rounded-lg border flex items-center justify-center gap-2 transition cursor-pointer ${
                      theme === 'dark'
                        ? 'border-cyan-400 bg-cyan-950/40 text-cyan-200 font-bold'
                        : 'border-slate-800 bg-slate-900/60 text-slate-400'
                    }`}
                  >
                    <span>Deep Navy Dark</span>
                  </button>
                  <button
                    onClick={() => setTheme('light')}
                    className={`p-2 rounded-lg border flex items-center justify-center gap-2 transition cursor-pointer ${
                      theme === 'light'
                        ? 'border-cyan-400 bg-cyan-950/40 text-cyan-200 font-bold'
                        : 'border-slate-800 bg-slate-900/60 text-slate-400'
                    }`}
                  >
                    <span>Light Workstation</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs cursor-pointer"
              >
                {isAr ? 'حفظ وإغلاق' : 'Save & Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NOTIFICATIONS POPOVER */}
      {isNotificationsOpen && (
        <div
          className="fixed top-12 right-12 z-50 w-80 bg-[#081224] border border-[#1b3f70] rounded-xl shadow-2xl p-3 animate-in fade-in slide-in-from-top-2"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Bell className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-xs font-bold text-white">
                {isAr ? 'مركز الإشعارات' : 'System Notifications'}
              </span>
            </div>
            <button
              onClick={() => setIsNotificationsOpen(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2 mt-2 max-h-60 overflow-y-auto">
            <div className="p-2 rounded-lg bg-[#0b1b36] border border-[#163666]">
              <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-semibold">
                <CheckCircle2 className="w-3 h-3" />
                <span>{isAr ? 'اكتمل الفحص الذكي' : 'Smart Scan Completed'}</span>
              </div>
              <div className="text-[10px] text-slate-300 mt-0.5">
                {isAr ? 'تم اكتشاف 48.6 جيجابايت قابلة للاستعادة بأمان.' : '48.6 GB reclaimable safely detected.'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
