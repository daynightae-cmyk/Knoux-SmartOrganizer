/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { NavigationProvider, useNavigation, type AppSection } from './context/NavigationContext';
import { StudioProvider } from './studio/context';
import { StudioPage } from './studio/StudioPage';
import { HomePage } from './pages/HomePage';
import { ApplicationsPage } from './pages/ApplicationsPage';
import { FilesPage } from './pages/FilesPage';
import { StoragePage } from './pages/StoragePage';
import { CleanupPage } from './pages/CleanupPage';
import { StartupPage } from './pages/StartupPage';
import { SystemPage } from './pages/SystemPage';
import { RepairPage } from './pages/RepairPage';
import { ServicesPage } from './pages/ServicesPage';
import { AutomationPage } from './pages/AutomationPage';
import { SmartScanPage } from './pages/SmartScanPage';
import { SettingsPage } from './pages/SettingsPage';
import { GoogleWorkspaceHub } from './components/workspace/GoogleWorkspaceHub';

import { KNOuXTitleBar, KNOuXSidebar } from './components/shell/KNOuXShellComponents';
import { KNOuXAssistantChat } from './components/chat/KNOuXAssistantChat';
import { ApiKeySetupModal } from './components/chat/ApiKeySetupModal';

import './studio/styles/studio.css';
import './studio/styles/command-center.css';
import './applications-ref02.css';
import './files.css';
import './storage.css';
import './cleanup.css';
import './startup.css';
import './system.css';
import './repair.css';
import './services.css';
import './automation.css';
import './home-command-center.css';

export type { AppSection };

function AppContent() {
  const { currentSection, navigateTo, isActive } = useNavigation();
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [locale, setLocale] = useState<'en' | 'ar'>('en');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const savedKey = localStorage.getItem('knoux_ai_api_key');
    if (!savedKey) {
      setIsApiKeyModalOpen(true);
    }
  }, []);

  const handleSaveApiKey = (key: string, provider: 'openrouter' | 'openai' | 'anthropic') => {
    localStorage.setItem('knoux_ai_api_key', key);
    localStorage.setItem('knoux_ai_provider', provider);
    setIsApiKeyModalOpen(false);
  };

  const isAr = locale === 'ar';

  const sectionTitles: Record<string, { en: string; ar: string }> = {
    home: { en: 'Home', ar: 'الرئيسية' },
    smart_scan: { en: 'Smart Scan', ar: 'الفحص الذكي' },
    scan: { en: 'Smart Scan', ar: 'الفحص الذكي' },
    studio: { en: 'Organization Studio', ar: 'استوديو التنظيم' },
    applications: { en: 'Applications', ar: 'التطبيقات' },
    files: { en: 'Files', ar: 'الملفات الذكية' },
    storage: { en: 'Storage', ar: 'أطلس التخزين' },
    cleanup: { en: 'Cleanup', ar: 'معمل التنظيف' },
    startup: { en: 'Startup', ar: 'بدء التشغيل' },
    system: { en: 'System', ar: 'نبض النظام' },
    repair: { en: 'Repair', ar: 'معمل الإصلاح' },
    services: { en: 'Services', ar: 'خدمات ويندوز' },
    automation: { en: 'Automation', ar: 'أتمتة العمليات' },
    workspace: { en: 'Google Workspace', ar: 'خدمات Google' },
    settings: { en: 'Settings', ar: 'الإعدادات' },
  };

  const currentMeta = sectionTitles[currentSection] || { en: 'Workspace', ar: 'مساحة العمل' };

  // Active workspace injector into shared workspace container
  const renderActiveWorkspace = () => {
    switch (currentSection) {
      case 'settings':
        return <SettingsPage onNavigateSection={navigateTo} />;
      case 'smart_scan':
        return <SmartScanPage onNavigateSection={navigateTo} />;
      case 'workspace':
        return <GoogleWorkspaceHub locale={isAr ? 'ar' : 'en'} />;
      case 'automation':
        return <AutomationPage onNavigateSection={navigateTo} />;
      case 'services':
        return <ServicesPage onNavigateSection={navigateTo} />;
      case 'repair':
        return <RepairPage onNavigateSection={navigateTo} />;
      case 'system':
        return <SystemPage onNavigateSection={navigateTo} />;
      case 'startup':
        return <StartupPage onNavigateSection={navigateTo} />;
      case 'cleanup':
        return <CleanupPage onNavigateSection={navigateTo} />;
      case 'storage':
        return <StoragePage onNavigateSection={navigateTo} />;
      case 'files':
        return <FilesPage onNavigateSection={navigateTo} />;
      case 'applications':
        return <ApplicationsPage onNavigateSection={navigateTo} />;
      case 'studio':
        return (
          <StudioProvider>
            <StudioPage onNavigate={navigateTo} />
          </StudioProvider>
        );
      case 'home':
      default:
        return <HomePage onNavigateSection={navigateTo} onNavigate={navigateTo} />;
    }
  };

  return (
    <>
      {renderActiveWorkspace()}
      <KNOuXAssistantChat currentSection={currentSection} locale={isAr ? 'ar' : 'en'} />
      <ApiKeySetupModal
        isOpen={isApiKeyModalOpen}
        onSave={handleSaveApiKey}
        onSkip={() => setIsApiKeyModalOpen(false)}
        locale={isAr ? 'ar' : 'en'}
      />
    </>
  );
}

export default function App() {
  return (
    <NavigationProvider initialSection="home">
      <AppContent />
    </NavigationProvider>
  );
}
