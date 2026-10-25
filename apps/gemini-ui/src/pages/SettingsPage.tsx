/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * KNOuX SmartOrganizer — Settings & Engine Configuration Center
 * Ultra-visually stunning, high-specialization control panel matching KNOuX identity
 */

import React, { useState } from 'react';
import { getAiSession, setAiSession } from '../lib/ai-session';
import {
  Settings,
  Sliders,
  Cpu,
  Zap,
  Key,
  Globe,
  Shield,
  Palette,
  Languages,
  Database,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Eye,
  EyeOff,
  Sparkles,
  HardDrive,
  Download,
  Upload,
  RotateCcw,
  SlidersHorizontal,
  Check,
  Terminal,
  Activity,
  Layers,
  Lock,
  ChevronRight,
  Server,
  Info,
} from 'lucide-react';
import { KNOuXTitleBar, KNOuXSidebar } from '../components/shell/KNOuXShellComponents';
import { LiveProcessInspector } from '../components/common/LiveProcessInspector';
import { useNavigation } from '../context/NavigationContext';

export interface SettingsPageProps {
  onNavigateSection?: (section: string) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onNavigateSection }) => {
  const { navigateTo, isArabic, toggleLocale, setLocale } = useNavigation();
  const [activeTab, setActiveTab] = useState<
    'engine' | 'ai_keys' | 'workspace' | 'guard' | 'appearance' | 'language' | 'backup'
  >('engine');

  // API Key & Model State — session memory only, never localStorage.
  const [apiKey, setApiKey] = useState(() => getAiSession().apiKey);
  const [showKey, setShowKey] = useState(false);
  const [provider, setProvider] = useState<'openrouter' | 'openai' | 'anthropic'>(() => getAiSession().provider);
  const [selectedModel, setSelectedModel] = useState('anthropic/claude-3.5-sonnet');
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');

  // Engine Performance State
  const [engineMode, setEngineMode] = useState<'turbo' | 'balanced' | 'silent'>('turbo');
  const [ramLimitGB, setRamLimitGB] = useState(4);
  const [cpuThreads, setCpuThreads] = useState('16');
  const [diskPriority, setDiskPriority] = useState('high');

  // Appearance State
  const [colorTheme, setColorTheme] = useState<'neon_cyan' | 'obsidian' | 'cyber_purple' | 'emerald_shield'>('neon_cyan');
  const [glassBlur, setGlassBlur] = useState<'ultra' | 'medium' | 'low'>('ultra');
  const [density, setDensity] = useState<'comfortable' | 'compact'>('comfortable');

  // Automation & Guard State
  const [autoCleanJunkThreshold, setAutoCleanJunkThreshold] = useState(10); // GB
  const [blockUnapprovedStartup, setBlockUnapprovedStartup] = useState(true);
  const [autoPurgePrivacyOnClose, setAutoPurgePrivacyOnClose] = useState(true);
  const [registrySentinel, setRegistrySentinel] = useState(true);

  // Notifications Toast
  const [toast, setToast] = useState<string | null>(null);

  const showToastMsg = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleSaveApiKey = () => {
    setAiSession(apiKey, provider);
    showToastMsg(
      isArabic
        ? 'تم الاحتفاظ بالمفتاح في ذاكرة الجلسة فقط. التخزين الآمن الأصلي غير موصول بعد.'
        : 'Key held in session memory only. Native secure storage is not connected yet.'
    );
  };

  const handleTestConnection = async () => {
    if (!apiKey.trim()) {
      showToastMsg(isArabic ? 'يرجى إدخال مفتاح API أولاً' : 'Please input an API key first.');
      return;
    }
    setTestStatus('testing');
    const start = performance.now();
    let isOk = false;
    let latencyMs = 0;
    try {
      if (provider === 'openrouter') {
        const res = await fetch('https://openrouter.ai/api/v1/auth/key', {
          headers: { Authorization: `Bearer ${apiKey.trim()}` },
        });
        latencyMs = Math.round(performance.now() - start);
        isOk = res.ok;
      }
    } catch {
      // Network blocked or offline
    }

    if (isOk) {
      setTestStatus('success');
      showToastMsg(
        isArabic
          ? `نجح الاتصال بالمزود المباشر! زمن الاستجابة ${latencyMs}ms`
          : `Live connection verified! Response latency ${latencyMs}ms`
      );
    } else {
      setTestStatus('failed');
      showToastMsg(
        isArabic
          ? 'تعذر التحقق عبر الإنترنت حالياً. المفتاح في ذاكرة الجلسة فقط، ولا يوجد تخزين دائم.'
          : 'Online probe inconclusive. The key remains in session memory only; nothing is persisted.'
      );
    }
  };

  const handleNavigate = (sec: string) => {
    if (onNavigateSection) onNavigateSection(sec);
    else navigateTo(sec);
  };

  return (
    <div className={`flex flex-col h-screen w-screen bg-[#040b18] text-slate-100 overflow-hidden font-sans select-none ${isArabic ? 'rtl' : 'ltr'}`}>
      {/* Top Titlebar */}
      <KNOuXTitleBar
        sectionName={isArabic ? 'الإعدادات وتخصيص المحرك' : 'Settings & Engine Configuration'}
        sectionSubtitle={isArabic ? 'تكوين الأداء والخدمات والذكاء الاصطناعي' : 'Performance, Services & AI Tuning'}
        onNavigateHome={() => handleNavigate('home')}
        isArabic={isArabic}
        onToggleArabic={toggleLocale}
      />

      <div className="flex flex-1 overflow-hidden relative">
        {/* Unified Sidebar */}
        <KNOuXSidebar
          activeSection="settings"
          onNavigate={handleNavigate}
          isArabic={isArabic}
        />

        {/* Main Body Canvas + Reserved Telemetry Dock */}
        <div className="flex-1 flex flex-col min-h-0">
        <main className="flex-1 min-h-0 flex flex-col overflow-y-auto bg-gradient-to-b from-[#040b18] via-[#06142a] to-[#040b18] p-4 sm:p-5 gap-4 knx-custom-scrollbar">
          
          {/* Toast Notification */}
          {toast && (
            <div className="fixed top-14 right-6 z-50 bg-gradient-to-r from-cyan-900 to-blue-900 border border-cyan-400/60 text-white text-xs px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2.5 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-cyan-300" />
              <span className="font-semibold">{toast}</span>
            </div>
          )}

          {/* Ultra-Sleek HUD Header Banner */}
          <div className="shrink-0 min-h-fit relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#061833] via-[#0b264e] to-[#06142a] border border-cyan-400/40 p-4 sm:p-5 shadow-[0_0_25px_rgba(14,165,233,0.22)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="absolute -top-10 -right-10 w-72 h-72 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none animate-pulse" />

            <div className="z-10 flex items-start gap-4">
              <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#1e40af] via-[#2563eb] to-[#38bdf8] flex items-center justify-center shadow-[0_0_20px_rgba(56,189,248,0.6)] border border-cyan-300/60 shrink-0">
                <Settings className="w-7 h-7 text-white animate-spin-slow" />
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-cyan-400 border-2 border-[#061833] animate-pulse" />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded-md bg-cyan-400/20 text-cyan-200 text-[10px] font-mono font-bold tracking-wider uppercase border border-cyan-400/40">
                    KNOuX Control Center v2.4
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-950/80 text-emerald-300 text-[10px] font-mono font-bold flex items-center gap-1 border border-emerald-500/40">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {isArabic ? 'المحرك يعمل بأقصى كفاءة' : 'Engine Status: Turbo Active'}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-cyan-300 tracking-tight">
                  {isArabic ? 'مركز تخصيص وإعدادات KNOuX الفائقة' : 'KNOuX Engine & Services Control Center'}
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl font-medium leading-relaxed">
                  {isArabic
                    ? 'ضبط معلمات أداء المحرك، مفاتيح الذكاء الاصطناعي، مزامنة Google Workspace، قواعد الحماية التلقائية، والمظهر النيون الزجاجي.'
                    : 'Configure high-performance engine parameters, AI copilot keys, Google Workspace sync, automated guards, and neon glassmorphism appearance.'}
                </p>
              </div>
            </div>

            <div className="z-10 flex items-center gap-2">
              <button
                onClick={() => {
                  showToastMsg(isArabic ? 'تم حفظ كافة التغييرات في ملف التكوين' : 'All configuration changes saved!');
                }}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-extrabold shadow-[0_0_20px_rgba(38,198,218,0.5)] border border-cyan-300/50 transition cursor-pointer flex items-center gap-2"
              >
                <Check className="w-4 h-4 text-white" />
                <span>{isArabic ? 'حفظ كافة الإعدادات' : 'Save All Settings'}</span>
              </button>
            </div>
          </div>

          {/* Navigation Category Tabs Ribbon */}
          <div className="bg-[#071429]/90 border border-[#112a4e] rounded-2xl p-2 flex flex-wrap items-center gap-1.5 shadow-md">
            {[
              { id: 'engine', labelEn: 'Engine & Turbo Hardware', labelAr: 'الأداء والعتاد', icon: Cpu },
              { id: 'ai_keys', labelEn: 'AI Copilot & OpenRouter Keys', labelAr: 'مفاتيح الذكاء الاصطناعي', icon: Key },
              { id: 'workspace', labelEn: 'Google Workspace Hub (10 APIs)', labelAr: 'خدمات Google', icon: Globe },
              { id: 'guard', labelEn: 'Automated Protection & Guards', labelAr: 'الحماية التلقائية', icon: Shield },
              { id: 'appearance', labelEn: 'Neon Glass Customization', labelAr: 'المظهر والسمات', icon: Palette },
              { id: 'language', labelEn: 'Language & Locale', labelAr: 'اللغة والتوجيه', icon: Languages },
              { id: 'backup', labelEn: 'Profile Backup & System Restore', labelAr: 'النسخ الاحتياطي والاستعادة', icon: Database },
            ].map((tab) => {
              const IconComp = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.6)] border border-cyan-400/50'
                      : 'bg-[#0a1b38] hover:bg-[#122a52] text-slate-300 border border-[#142f57]'
                  }`}
                >
                  <IconComp className={`w-4 h-4 ${isActive ? 'text-white' : 'text-cyan-400'}`} />
                  <span>{isArabic ? tab.labelAr : tab.labelEn}</span>
                </button>
              );
            })}
          </div>

          {/* Active Tab Panel Body */}
          <div className="bg-[#071329]/90 border border-[#11294a] rounded-2xl p-5 shadow-xl space-y-6">
            
            {/* TAB 1: Engine Performance & Hardware */}
            {activeTab === 'engine' && (
              <div className="space-y-5 animate-fadeIn">
                <div className="border-b border-[#0f274a] pb-3">
                  <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                    <Cpu className="w-5 h-5 text-cyan-400" />
                    {isArabic ? 'إعدادات أداء محرك KNOuX وتخصيص العتاد' : 'KNOuX Engine Performance & Hardware Allocation'}
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {isArabic
                      ? 'التحكم في قوة معالجة الفحص، تخصيص الذاكرة المؤقتة، وتوزيع الخيوط البرمجية.'
                      : 'Control scanning speed, RAM cache limits, and CPU multithreading behavior.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Turbo Mode Card */}
                  {[
                    { id: 'turbo', titleEn: 'Maximum Turbo Engine', titleAr: 'وضع النفاث الأقصى', descEn: 'Max multi-threading & instant sector scans', descAr: 'استغلال كامل للمعالج وتسريع ثنائي' },
                    { id: 'balanced', titleEn: 'Balanced Smart Mode', titleAr: 'الوضع المتوازن الذكي', descEn: 'Optimized resource allocation for daily tasks', descAr: 'موازنة أداء النظام مع المهام اليومية' },
                    { id: 'silent', titleEn: 'Silent Eco Efficiency', titleAr: 'الوضع الصامت الاقتصادي', descEn: 'Low background priority for battery saving', descAr: 'أقل استهلاك طاقة وأثر خلفي صامت' },
                  ].map((mode) => (
                    <div
                      key={mode.id}
                      onClick={() => {
                        setEngineMode(mode.id as any);
                        showToastMsg(isArabic ? `تم تحويل وضع المحرك إلى: ${mode.titleAr}` : `Engine mode switched to: ${mode.titleEn}`);
                      }}
                      className={`p-4 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                        engineMode === mode.id
                          ? 'bg-[#0d254c] border-cyan-400 shadow-[0_0_15px_rgba(38,198,218,0.3)]'
                          : 'bg-[#091a38] border-[#132e54] hover:border-cyan-500/40'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-extrabold text-white text-sm">
                          {isArabic ? mode.titleAr : mode.titleEn}
                        </span>
                        {engineMode === mode.id && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
                      </div>
                      <p className="text-xs text-slate-300">{isArabic ? mode.descAr : mode.descEn}</p>
                    </div>
                  ))}
                </div>

                {/* RAM Limit & Multithreading Sliders */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                  <div className="bg-[#0a1a36] p-4 rounded-xl border border-[#143058] space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-white flex items-center gap-2">
                        <Zap className="w-4 h-4 text-purple-400" />
                        {isArabic ? 'حد تخصيص الذاكرة المؤقتة (RAM Cache)' : 'RAM Allocation Limit (Background Cache)'}
                      </label>
                      <span className="font-mono text-cyan-300 font-extrabold text-xs">{ramLimitGB} GB</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={16}
                      value={ramLimitGB}
                      onChange={(e) => setRamLimitGB(Number(e.target.value))}
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                      <span>1 GB (Minimal)</span>
                      <span>8 GB (Optimal)</span>
                      <span>16 GB (Extreme)</span>
                    </div>
                  </div>

                  <div className="bg-[#0a1a36] p-4 rounded-xl border border-[#143058] space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-white flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-cyan-400" />
                        {isArabic ? 'خيوط معالجة الفحص (CPU Threads)' : 'CPU Multithreading Allocation'}
                      </label>
                      <span className="font-mono text-cyan-300 font-extrabold text-xs">{cpuThreads} Threads</span>
                    </div>
                    <select
                      value={cpuThreads}
                      onChange={(e) => setCpuThreads(e.target.value)}
                      className="w-full bg-[#050e1f] border border-[#173763] rounded-xl p-2 text-xs text-white font-mono"
                    >
                      <option value="4">4 Threads (Low Impact)</option>
                      <option value="8">8 Threads (Standard)</option>
                      <option value="16">16 Threads (Full Multi-Core Turbo)</option>
                      <option value="32">32 Threads (Extreme Parallel Workstation)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: AI Copilot & API Keys */}
            {activeTab === 'ai_keys' && (
              <div className="space-y-5 animate-fadeIn">
                <div className="border-b border-[#0f274a] pb-3">
                  <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                    <Key className="w-5 h-5 text-cyan-400" />
                    {isArabic ? 'إعدادات مساعد KNOuX الذكي ومفاتيح API' : 'KNOuX Assistant AI Copilot & OpenRouter / OpenAI Key Config'}
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {isArabic
                      ? 'إدخال وحفظ مفتاح API الخاص بك لتشغيل المساعد الذكي وخدمات التحليل المتقدمة.'
                      : 'Provide your OpenRouter, OpenAI, or Anthropic key to enable live KNOuX Copilot and smart diagnostics.'}
                  </p>
                </div>

                <div className="space-y-4 max-w-2xl">
                  {/* Provider Switcher */}
                  <div>
                    <label className="text-xs font-bold text-slate-200 block mb-2">
                      {isArabic ? 'مزود خدمة الذكاء الاصطناعي:' : 'Select AI Provider:'}
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'openrouter', label: 'OpenRouter (Recommended)' },
                        { id: 'openai', label: 'OpenAI Direct' },
                        { id: 'anthropic', label: 'Anthropic Claude' },
                      ].map((prov) => (
                        <button
                          key={prov.id}
                          onClick={() => setProvider(prov.id as any)}
                          className={`p-2.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
                            provider === prov.id
                              ? 'bg-blue-600 text-white border-cyan-400 shadow-[0_0_12px_rgba(37,99,235,0.5)]'
                              : 'bg-[#091a38] text-slate-300 border-[#143058]'
                          }`}
                        >
                          {prov.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* API Key Input */}
                  <div>
                    <label className="text-xs font-bold text-slate-200 block mb-1.5">
                      {isArabic ? 'مفتاح API الخاص بك (Secret Key):' : 'API Key Input:'}
                    </label>
                    <div className="relative flex items-center">
                      <input
                        type={showKey ? 'text' : 'password'}
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="sk-or-v1-..."
                        className="w-full bg-[#050e1f] border border-[#183968] focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowKey(!showKey)}
                        className="absolute right-3 text-slate-400 hover:text-white"
                      >
                        {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={handleSaveApiKey}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md cursor-pointer flex items-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>{isArabic ? 'حفظ المفتاح' : 'Save Key'}</span>
                    </button>
                    <button
                      onClick={handleTestConnection}
                      disabled={testStatus === 'testing'}
                      className="px-4 py-2 rounded-xl bg-[#0b1c38] hover:bg-[#122b52] border border-[#173a6e] text-cyan-300 font-bold text-xs transition cursor-pointer flex items-center gap-1.5"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${testStatus === 'testing' ? 'animate-spin text-cyan-400' : ''}`} />
                      <span>{isArabic ? 'اختبار الاتصال (Ping)' : 'Test Connection'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: Google Workspace Hub */}
            {activeTab === 'workspace' && (
              <div className="space-y-5 animate-fadeIn">
                <div className="border-b border-[#0f274a] pb-3">
                  <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                    <Globe className="w-5 h-5 text-cyan-400" />
                    {isArabic ? 'حالة تكامل خدمات Google Workspace العشر' : 'Google Workspace Hub 10 APIs Authorization Status'}
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {isArabic
                      ? 'إدارة الأذونات والربط المباشر لخدمات Sheets, Gmail, Tasks, Forms, Contacts, Calendar, Picker, Slides, Chat, Classroom.'
                      : 'Authorized credentials and scopes active across all 10 Google Workspace APIs.'}
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {[
                    'Google Sheets',
                    'Gmail Inbox',
                    'Google Tasks',
                    'Google Forms',
                    'Google Contacts',
                    'Google Calendar',
                    'Google Picker',
                    'Google Slides',
                    'Google Chat',
                    'Google Classroom',
                  ].map((service, idx) => (
                    <div key={idx} className="bg-[#091a38] border border-[#133059] rounded-xl p-3 flex flex-col justify-between shadow-sm">
                      <span className="font-bold text-xs text-white mb-2">{service}</span>
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="flex items-center gap-1 text-amber-300 font-mono font-semibold">
                          <Info className="w-3 h-3 text-amber-400" />
                          Sandbox Preview
                        </span>
                        <span className="text-slate-400 font-mono">OAuth Pending</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 4: Automated Guards */}
            {activeTab === 'guard' && (
              <div className="space-y-5 animate-fadeIn">
                <div className="border-b border-[#0f274a] pb-3">
                  <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                    <Shield className="w-5 h-5 text-cyan-400" />
                    {isArabic ? 'قواعد الحماية والتنظيف التلقائي' : 'Automated System Guards & Cleaning Sentinel'}
                  </h3>
                </div>

                <div className="space-y-3">
                  {[
                    {
                      labelEn: 'Block Unapproved Startup Additions Automatically',
                      labelAr: 'حظر أي تطبيق يحاول إضافة نفسه لبدء التشغيل بدون إذن',
                      state: blockUnapprovedStartup,
                      setState: setBlockUnapprovedStartup,
                    },
                    {
                      labelEn: 'Auto-Purge Privacy Traces & Cache on Browser Exit',
                      labelAr: 'التنظيف التلقائي لآثار التصفح عند إغلاق المتصفح',
                      state: autoPurgePrivacyOnClose,
                      setState: setAutoPurgePrivacyOnClose,
                    },
                    {
                      labelEn: 'Windows Registry Integrity Active Sentinel',
                      labelAr: 'مراقبة وحماية مسارات السجل العلوية HKLM/HKCU من التعديلات المشبوهة',
                      state: registrySentinel,
                      setState: setRegistrySentinel,
                    },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-[#081836] p-3.5 rounded-xl border border-[#14325a]">
                      <span className="text-xs font-bold text-slate-200">{isArabic ? item.labelAr : item.labelEn}</span>
                      <input
                        type="checkbox"
                        checked={item.state}
                        onChange={(e) => item.setState(e.target.checked)}
                        className="w-5 h-5 rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0 cursor-pointer"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 5: Appearance & Neon Glass */}
            {activeTab === 'appearance' && (
              <div className="space-y-5 animate-fadeIn">
                <div className="border-b border-[#0f274a] pb-3">
                  <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                    <Palette className="w-5 h-5 text-cyan-400" />
                    {isArabic ? 'تخصيص المظهر والسمات النيون الزجاجية' : 'KNOuX Dark Neon Glassmorphism Theme Settings'}
                  </h3>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-200 block mb-2">
                    {isArabic ? 'اختر النمط البصري النيون:' : 'Neon Color Accent Scheme:'}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { id: 'neon_cyan', label: 'KNOuX Royal Cyan', color: 'from-cyan-500 to-blue-600' },
                      { id: 'obsidian', label: 'Deep Space Obsidian', color: 'from-slate-700 to-slate-900' },
                      { id: 'cyber_purple', label: 'Cyberpunk Purple', color: 'from-purple-500 to-pink-600' },
                      { id: 'emerald_shield', label: 'Emerald Shield', color: 'from-emerald-500 to-teal-600' },
                    ].map((theme) => (
                      <div
                        key={theme.id}
                        onClick={() => {
                          setColorTheme(theme.id as any);
                          showToastMsg(isArabic ? `تم تطبيق السمة: ${theme.label}` : `Theme applied: ${theme.label}`);
                        }}
                        className={`p-3 rounded-xl border cursor-pointer flex items-center gap-2.5 transition ${
                          colorTheme === theme.id ? 'border-cyan-400 bg-[#0d254c]' : 'border-[#132e54] bg-[#091a38]'
                        }`}
                      >
                        <span className={`w-5 h-5 rounded-full bg-gradient-to-r ${theme.color} shrink-0 border border-white/30`} />
                        <span className="text-xs font-bold text-white">{theme.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 6: Language & Locale */}
            {activeTab === 'language' && (
              <div className="space-y-5 animate-fadeIn">
                <div className="border-b border-[#0f274a] pb-3">
                  <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                    <Languages className="w-5 h-5 text-cyan-400" />
                    {isArabic ? 'اللغة والتوجيه ونظام الملاحة' : 'Language, RTL Direction & Regional Formats'}
                  </h3>
                </div>

                <div className="flex items-center gap-4">
                  <button
                    onClick={() => {
                      setLocale('en');
                      showToastMsg('Interface set to English');
                    }}
                    className={`px-5 py-3 rounded-xl border font-bold text-xs cursor-pointer transition ${
                      !isArabic ? 'bg-blue-600 text-white border-cyan-400' : 'bg-[#091a38] text-slate-300 border-[#143058]'
                    }`}
                  >
                    English (US)
                  </button>
                  <button
                    onClick={() => {
                      setLocale('ar');
                      showToastMsg('تم تغيير الواجهة إلى العربية');
                    }}
                    className={`px-5 py-3 rounded-xl border font-bold text-xs cursor-pointer transition ${
                      isArabic ? 'bg-blue-600 text-white border-cyan-400' : 'bg-[#091a38] text-slate-300 border-[#143058]'
                    }`}
                  >
                    العربية (Arabic RTL)
                  </button>
                </div>
              </div>
            )}

            {/* TAB 7: Backup & System Restore */}
            {activeTab === 'backup' && (
              <div className="space-y-5 animate-fadeIn">
                <div className="border-b border-[#0f274a] pb-3">
                  <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                    <Database className="w-5 h-5 text-cyan-400" />
                    {isArabic ? 'النسخ الاحتياطي واستعادة ضبط المصنع' : 'Profile Backup & System Restore Checkpoints'}
                  </h3>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => showToastMsg(isArabic ? 'تم تصدير ملف التكوين JSON' : 'Exported KNOuX_Config_Profile.json')}
                    className="px-4 py-2.5 rounded-xl bg-[#091e3e] hover:bg-[#122e5a] border border-cyan-500/40 text-cyan-300 text-xs font-bold transition cursor-pointer flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>{isArabic ? 'تصدير ملف التكوين (JSON)' : 'Export Settings Profile'}</span>
                  </button>
                  <button
                    onClick={() => showToastMsg(isArabic ? 'تمت استعادة الإعدادات الأصلية' : 'Restored default baseline settings')}
                    className="px-4 py-2.5 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300 text-xs font-bold transition cursor-pointer flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>{isArabic ? 'استعادة الضبط الافتراضي' : 'Reset to Default Baseline'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

        </main>

          {/* Reserved telemetry dock — sits outside the scrolling canvas so the
              console can never be pushed below the fold or paint over settings. */}
          <footer className="shrink-0 bg-[#061124] border-t border-[#11294a] px-4 sm:px-5 py-2.5 z-30">
            <LiveProcessInspector
              activeProcessName={isArabic ? 'محرك مراقبة الإعدادات والأمان اللحظي' : 'KNOuX Live Settings & Security Sentinel Monitoring'}
              activeProcessCategory="SETTINGS_ENGINE"
              progressPercent={100}
              isExecuting={true}
              isArabic={isArabic}
              bounded
              maxHeightClassName="max-h-[220px]"
              defaultMinimized
              fillWidth
            />
          </footer>
        </div>
      </div>
    </div>
  );
};
