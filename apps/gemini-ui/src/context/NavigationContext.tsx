/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * KNOuX SmartOrganizer — Central Navigation Context & Hook
 * Provides shared state for active workspace section, normalization of aliases,
 * breadcrumbs, history, and accurate highlight detection for all sidebars and top bars.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';

export type AppTheme = 'dark' | 'light';

export type AppSection =
  | 'home'
  | 'smart_scan'
  | 'studio'
  | 'workspace'
  | 'applications'
  | 'files'
  | 'storage'
  | 'cleanup'
  | 'startup'
  | 'system'
  | 'repair'
  | 'services'
  | 'automation'
  | 'settings';

export interface SectionMeta {
  id: AppSection;
  labelEn: string;
  labelAr: string;
  category: 'core' | 'storage_files' | 'performance_system' | 'maintenance_ops';
  badge?: string;
  iconName: string;
}

export const SECTIONS_DIRECTORY: SectionMeta[] = [
  { id: 'home', labelEn: 'Home', labelAr: 'الرئيسية', category: 'core', iconName: 'Home' },
  { id: 'smart_scan', labelEn: 'Smart Scan', labelAr: 'الفحص الذكي', category: 'core', badge: 'AI', iconName: 'Target' },
  { id: 'studio', labelEn: 'Smart Organization Studio', labelAr: 'استوديو التنظيم الذكي', category: 'storage_files', badge: '9 Stages', iconName: 'FolderTree' },
  { id: 'workspace', labelEn: 'Google Workspace Hub', labelAr: 'مركز خدمات Google', category: 'core', badge: '10 APIs', iconName: 'Globe' },
  { id: 'applications', labelEn: 'Applications', labelAr: 'إدارة التطبيقات', category: 'core', badge: '358 Apps', iconName: 'Box' },
  { id: 'files', labelEn: 'Files & Instant Find', labelAr: 'الملفات والفهرسة الفورية', category: 'storage_files', iconName: 'FileText' },
  { id: 'storage', labelEn: 'Storage Atlas', labelAr: 'أطلس التخزين', category: 'storage_files', badge: '3 Volumes', iconName: 'HardDrive' },
  { id: 'cleanup', labelEn: 'Junk Cleanup & Scan', labelAr: 'تنظيف المخلفات والفحص', category: 'maintenance_ops', badge: '48.6 GB', iconName: 'Trash2' },
  { id: 'startup', labelEn: 'Startup & Boot Control', labelAr: 'التحكم في بدء التشغيل', category: 'performance_system', badge: '8.4s Saved', iconName: 'Rocket' },
  { id: 'system', labelEn: 'System Live Pulse', labelAr: 'نبض ومراقبة النظام الحي', category: 'performance_system', badge: 'Live', iconName: 'Activity' },
  { id: 'repair', labelEn: 'Repair Lab', labelAr: 'مختبر الصيانة والإنعاش', category: 'maintenance_ops', iconName: 'Wrench' },
  { id: 'services', labelEn: 'Windows Services', labelAr: 'خدمات ويندوز والمهام', category: 'performance_system', iconName: 'Settings2' },
  { id: 'automation', labelEn: 'Automation Studio', labelAr: 'استوديو الأتمتة المتقدم', category: 'performance_system', badge: '12 Active', iconName: 'Zap' },
  { id: 'settings', labelEn: 'Settings & Control', labelAr: 'الإعدادات والضبط', category: 'core', iconName: 'Settings' },
];

export function tryNormalizeSection(raw: string | undefined | null): AppSection | null {
  if (!raw) return null;
  const s = raw.toLowerCase().trim();

  // Exact canonical matches
  if (s === 'home') return 'home';
  if (
    s === 'smart_scan' ||
    s === 'smart-scan' ||
    s === 'smartscan' ||
    s === 'scan' ||
    s.includes('smart_scan') ||
    s.includes('smartscan') ||
    s.includes('quick_scan') ||
    s.includes('deep_scan')
  ) {
    return 'smart_scan';
  }
  if (s === 'studio') return 'studio';
  if (s === 'applications' || s === 'apps') return 'applications';
  if (s === 'files') return 'files';
  if (s === 'storage') return 'storage';
  if (s === 'cleanup') return 'cleanup';
  if (s === 'startup') return 'startup';
  if (s === 'system') return 'system';
  if (s === 'repair') return 'repair';
  if (s === 'services') return 'services';
  if (s === 'automation') return 'automation';
  if (s === 'settings' || s === 'config') return 'settings';
  if (
    s === 'workspace' ||
    s.includes('google') ||
    s.includes('sheet') ||
    s.includes('gmail') ||
    s.includes('calendar') ||
    s.includes('drive') ||
    s.includes('tasks') ||
    s.includes('chat') ||
    s.includes('classroom') ||
    s.includes('slides') ||
    s.includes('forms') ||
    s.includes('contacts')
  ) {
    return 'workspace';
  }

  // Explicit non-section targets that should never match home or any workspace
  if (s === 'help' || s === 'about' || s === 'license') {
    return null;
  }

  // Aliases & Domain Service mappings
  if (s.includes('organ') || s.includes('studio') || s.includes('collection') || s.includes('rule') || s.includes('composer')) {
    return 'studio';
  }
  if (s.includes('uninstaller') || s.includes('installer') || s.includes('manage')) {
    return 'applications';
  }
  if (s.includes('find') || s.includes('explorer') || s.includes('document')) {
    return 'files';
  }
  if (s.includes('atlas') || s.includes('volume') || s.includes('disk') || s.includes('treemap')) {
    return 'storage';
  }
  if (s.includes('scan') || s.includes('clean') || s.includes('junk') || s.includes('temp') || s.includes('recycle')) {
    return 'cleanup';
  }
  if (s.includes('boot') || s.includes('start') || s.includes('autorun')) {
    return 'startup';
  }
  if (s.includes('pulse') || s.includes('health') || s.includes('perf') || s.includes('gauge')) {
    return 'system';
  }
  if (s.includes('fix') || s.includes('repair') || s.includes('maintenance') || s.includes('restore') || s.includes('sfc') || s.includes('dism')) {
    return 'repair';
  }
  if (s.includes('service') || s.includes('daemon') || s.includes('scheduler')) {
    return 'services';
  }
  if (s.includes('auto') || s.includes('bot') || s.includes('trigger') || s.includes('workflow')) {
    return 'automation';
  }

  return null;
}

/**
 * Normalizes any section identifier or alias to the canonical AppSection.
 * Handles synonyms used across legacy menus, breadcrumbs, and natural language routes.
 */
export function normalizeSection(raw: string | undefined | null): AppSection {
  return tryNormalizeSection(raw) || 'home';
}

export interface NavigationContextValue {
  currentSection: AppSection;
  navigateTo: (section: string) => void;
  isActive: (section: string) => boolean;
  history: AppSection[];
  goBack: () => void;
  sectionMeta: SectionMeta;
  locale: 'en' | 'ar';
  isArabic: boolean;
  setLocale: (locale: 'en' | 'ar') => void;
  toggleLocale: () => void;
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  toggleTheme: () => void;
}

const NavigationContext = createContext<NavigationContextValue | null>(null);

export interface NavigationProviderProps {
  children: ReactNode;
  initialSection?: string;
  initialLocale?: 'en' | 'ar';
  onSectionChange?: (section: AppSection) => void;
  onLocaleChange?: (locale: 'en' | 'ar') => void;
}

export const NavigationProvider: React.FC<NavigationProviderProps> = ({
  children,
  initialSection = 'home',
  initialLocale,
  onSectionChange,
  onLocaleChange,
}) => {
  const [currentSection, setCurrentSection] = useState<AppSection>(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash.replace(/^#\/?/, '');
      const parsed = tryNormalizeSection(hash);
      if (parsed) return parsed;
    }
    return normalizeSection(initialSection);
  });

  const [history, setHistory] = useState<AppSection[]>([currentSection]);

  const [locale, setLocaleState] = useState<'en' | 'ar'>(() => {
    if (initialLocale) return initialLocale;
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('knoux_locale');
      if (saved === 'ar' || saved === 'en') return saved;
    }
    return 'en';
  });

  const isArabic = locale === 'ar';

  /**
   * Global appearance. Persisted across routes so switching to light on Home
   * does not strand a flag on screens that had no theme control of their own.
   */
  const [theme, setThemeState] = useState<AppTheme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('knoux_theme');
      if (saved === 'light' || saved === 'dark') return saved;
    }
    return 'dark';
  });

  const setTheme = useCallback((newTheme: AppTheme) => {
    setThemeState(newTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('knoux_theme', newTheme);
      if (newTheme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
      } else {
        document.documentElement.removeAttribute('data-theme');
      }
      document.documentElement.style.colorScheme = newTheme;
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  }, [theme, setTheme]);

  const setLocale = useCallback(
    (newLocale: 'en' | 'ar') => {
      setLocaleState(newLocale);
      if (typeof window !== 'undefined') {
        localStorage.setItem('knoux_locale', newLocale);
        document.documentElement.setAttribute('dir', newLocale === 'ar' ? 'rtl' : 'ltr');
        document.documentElement.setAttribute('lang', newLocale);
      }
      if (onLocaleChange) {
        onLocaleChange(newLocale);
      }
    },
    [onLocaleChange]
  );

  const toggleLocale = useCallback(() => {
    setLocale(locale === 'ar' ? 'en' : 'ar');
  }, [locale, setLocale]);

  // Keep DOM dir and lang attributes synchronized on mount and change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.setAttribute('dir', isArabic ? 'rtl' : 'ltr');
      document.documentElement.setAttribute('lang', locale);
    }
  }, [locale, isArabic]);

  // Keep the theme attribute synchronized on first mount as well as on change.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (theme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  // Listen to hash changes in browser
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleHashChange = () => {
      const hash = window.location.hash.replace(/^#\/?/, '');
      const parsed = tryNormalizeSection(hash);
      if (parsed && parsed !== currentSection) {
        setCurrentSection(parsed);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [currentSection]);

  const navigateTo = useCallback(
    (target: string) => {
      const normalized = normalizeSection(target);
      setCurrentSection((prev) => {
        if (prev === normalized) return prev;
        return normalized;
      });
      if (typeof window !== 'undefined') {
        window.location.hash = normalized;
      }
      setHistory((prev) => {
        if (prev[prev.length - 1] === normalized) return prev;
        return [...prev, normalized];
      });
      if (onSectionChange) {
        onSectionChange(normalized);
      }
    },
    [onSectionChange]
  );

  const goBack = useCallback(() => {
    setHistory((prev) => {
      if (prev.length <= 1) {
        setCurrentSection('home');
        if (typeof window !== 'undefined') window.location.hash = 'home';
        return ['home'];
      }
      const newHistory = prev.slice(0, -1);
      const previous = newHistory[newHistory.length - 1] || 'home';
      setCurrentSection(previous);
      if (typeof window !== 'undefined') window.location.hash = previous;
      if (onSectionChange) onSectionChange(previous);
      return newHistory;
    });
  }, [onSectionChange]);

  const isActive = useCallback(
    (section: string) => {
      if (!section) return false;
      const target = tryNormalizeSection(section);
      if (!target) return false;
      return target === currentSection;
    },
    [currentSection]
  );

  const sectionMeta = useMemo(() => {
    return SECTIONS_DIRECTORY.find((s) => s.id === currentSection) || SECTIONS_DIRECTORY[0];
  }, [currentSection]);

  const value = useMemo(
    () => ({
      currentSection,
      navigateTo,
      isActive,
      history,
      goBack,
      sectionMeta,
      locale,
      isArabic,
      setLocale,
      toggleLocale,
      theme,
      setTheme,
      toggleTheme,
    }),
    [
      currentSection,
      navigateTo,
      isActive,
      history,
      goBack,
      sectionMeta,
      locale,
      isArabic,
      setLocale,
      toggleLocale,
      theme,
      setTheme,
      toggleTheme,
    ]
  );

  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>;
};

export function useNavigation(): NavigationContextValue {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a <NavigationProvider>');
  }
  return context;
}
