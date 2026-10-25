/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * KNOuX API Key Configuration Startup Modal
 * Appears on startup if no API key is detected in localStorage or environment.
 */

import React, { useState } from 'react';
import { Key, Shield, Sparkles, CheckCircle2, X, Lock, ExternalLink, Zap, AlertTriangle, Info } from 'lucide-react';

interface ApiKeySetupModalProps {
  isOpen: boolean;
  onSave: (key: string, provider: 'openrouter' | 'openai' | 'anthropic') => void;
  onSkip: () => void;
  locale?: 'en' | 'ar';
}

export const ApiKeySetupModal: React.FC<ApiKeySetupModalProps> = ({
  isOpen,
  onSave,
  onSkip,
  locale = 'en',
}) => {
  const isAr = locale === 'ar';
  const [provider, setProvider] = useState<'openrouter' | 'openai' | 'anthropic'>('openrouter');
  const [keyValue, setKeyValue] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'warning' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');

  if (!isOpen) return null;

  const handleSkip = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('knoux_ai_modal_skipped', 'true');
    }
    onSkip();
  };

  const handleTestAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKey = keyValue.trim();
    if (!cleanKey) return;

    setIsTesting(true);
    setTestStatus('idle');
    setStatusMessage('');

    // Format validation
    let formatValid = false;
    if (provider === 'openrouter') {
      formatValid = cleanKey.startsWith('sk-or-') || cleanKey.length >= 24;
    } else if (provider === 'openai') {
      formatValid = cleanKey.startsWith('sk-') && cleanKey.length >= 24;
    } else if (provider === 'anthropic') {
      formatValid = cleanKey.startsWith('sk-ant-') || cleanKey.length >= 24;
    }

    if (!formatValid) {
      setIsTesting(false);
      setTestStatus('error');
      setStatusMessage(
        isAr
          ? 'تنسيق المفتاح يبدو غير صالح للمزود المختار. يرجى التحقق من المفتاح.'
          : `Key format appears unusual for ${provider}. Please verify prefix and token structure.`
      );
      return;
    }

    // Honest network verification probe
    let verifiedLive = false;
    try {
      if (provider === 'openrouter') {
        const res = await fetch('https://openrouter.ai/api/v1/auth/key', {
          headers: { Authorization: `Bearer ${cleanKey}` },
        });
        if (res.ok) {
          verifiedLive = true;
        }
      }
    } catch {
      // Offline / CORS / blocked — not an error, we report transparently
    }

    setIsTesting(false);
    if (verifiedLive) {
      setTestStatus('success');
      setStatusMessage(
        isAr
          ? 'تم التحقق من المفتاح وتأكيد صلاحيته عبر الاتصال المباشر!'
          : 'Key verified and confirmed active via provider API!'
      );
    } else {
      setTestStatus('warning');
      setStatusMessage(
        isAr
          ? 'تم حفظ المفتاح محلياً في المتصفح. سيتم التحقق الفعلي أثناء تنفيذ أول استعلام.'
          : 'Key saved locally. Live endpoint verification will take place during first query.'
      );
    }

    setTimeout(() => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('knoux_ai_modal_skipped', 'true');
      }
      onSave(cleanKey, provider);
    }, 1000);
  };

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none font-sans animate-in fade-in duration-200"
    >
      <div className="w-full max-w-md bg-[#040a16] border border-[#1b3f70] rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden relative text-slate-100">
        
        {/* Top Glow & Header */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400" />
        
        <div className="p-5 pb-4 border-b border-[#0f2444] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.7)] border border-cyan-400/40 shrink-0">
              <Key className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">
                {isAr ? 'تكوين مفتاح الذكاء الاصطناعي' : 'API Key Configuration'}
              </h2>
              <p className="text-xs text-cyan-400 font-mono">
                {isAr ? 'مطلوب لتشغيل المساعد الذكي وخدمات الـ AI' : 'Required to initialize KNOuX AI Copilot'}
              </p>
            </div>
          </div>

          <button
            onClick={onSkip}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Skip for now"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleTestAndSave} className="p-5 space-y-4 text-xs">
          <div className="p-3 rounded-xl bg-[#08152c] border border-[#15325e] text-slate-300 text-[11px] leading-relaxed flex items-start gap-2.5">
            <Shield className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              {isAr
                ? 'يرجى إدخال مفتاح الـ API (مثل مفتاح OpenRouter، OpenAI Code Console v2، أو Anthropic) لتفعيل المساعد الذكي فوراً في النظام.'
                : 'Please input your API key securely (OpenRouter, OpenAI Code Console v2, or Anthropic ANTHROPIC_API_KEY) to initialize AI services immediately.'}
            </div>
          </div>

          <div>
            <label className="text-slate-300 font-semibold block mb-1.5">
              {isAr ? 'اختر المزود (AI Provider)' : 'Select AI Provider'}
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setProvider('openrouter')}
                className={`p-2 rounded-xl border text-center font-bold text-xs transition cursor-pointer ${
                  provider === 'openrouter'
                    ? 'border-cyan-400 bg-cyan-950/50 text-cyan-200 shadow-[0_0_12px_rgba(34,211,238,0.2)]'
                    : 'border-slate-800 bg-[#061124] text-slate-400'
                }`}
              >
                OpenRouter
              </button>
              <button
                type="button"
                onClick={() => setProvider('openai')}
                className={`p-2 rounded-xl border text-center font-bold text-xs transition cursor-pointer ${
                  provider === 'openai'
                    ? 'border-cyan-400 bg-cyan-950/50 text-cyan-200 shadow-[0_0_12px_rgba(34,211,238,0.2)]'
                    : 'border-slate-800 bg-[#061124] text-slate-400'
                }`}
              >
                OpenAI v2
              </button>
              <button
                type="button"
                onClick={() => setProvider('anthropic')}
                className={`p-2 rounded-xl border text-center font-bold text-xs transition cursor-pointer ${
                  provider === 'anthropic'
                    ? 'border-cyan-400 bg-cyan-950/50 text-cyan-200 shadow-[0_0_12px_rgba(34,211,238,0.2)]'
                    : 'border-slate-800 bg-[#061124] text-slate-400'
                }`}
              >
                Anthropic
              </button>
            </div>
          </div>

          <div>
            <label className="text-slate-300 font-semibold block mb-1.5">
              {isAr ? 'مفتاح المصادقة (API Key / Token)' : 'API Key / Token Value'}
            </label>
            <div className="relative">
              <input
                type="password"
                required
                autoFocus
                value={keyValue}
                onChange={(e) => setKeyValue(e.target.value)}
                placeholder={
                  provider === 'openrouter'
                    ? 'sk-or-v1-...'
                    : provider === 'openai'
                    ? 'sk-proj-...'
                    : 'oc_sk_9319a6b122ca_...'
                }
                className="w-full bg-[#071328] border border-[#1b3f70] rounded-xl px-3.5 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400 font-mono text-xs shadow-inner"
              />
              <Lock className="absolute right-3.5 top-3 w-4 h-4 text-slate-500 pointer-events-none" />
            </div>
          </div>

          {testStatus === 'success' && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-semibold animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {testStatus === 'warning' && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-950/80 border border-amber-500/50 text-amber-300 text-xs font-semibold animate-in fade-in">
              <Info className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {testStatus === 'error' && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs font-semibold animate-in fade-in">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Security storage boundary note */}
          <div className="text-[10px] text-slate-400 leading-normal bg-[#061021] p-2.5 rounded-lg border border-[#0d213d]">
            <span className="text-cyan-400 font-bold">{isAr ? 'بيئة التخزين: ' : 'Storage Boundary: '}</span>
            {isAr
              ? 'يتم حفظ المفتاح محلياً في ذاكرة التخزين المؤقت للمتصفح. عند تشغيل المحرك المكتبي الأصلي، يتم الترحيل تلقائياً لمستودع تشفير Windows DPAPI.'
              : 'Keys are stored locally in the browser runtime session. Native workstation execution bridges directly to Windows DPAPI encryption.'}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-[#0f2444]">
            <button
              type="button"
              onClick={handleSkip}
              className="text-slate-400 hover:text-slate-200 text-xs font-medium cursor-pointer"
            >
              {isAr ? 'تخطي مؤقتاً (وضع غير متصل)' : 'Skip for now (Offline Mode)'}
            </button>

            <button
              type="submit"
              disabled={!keyValue.trim() || isTesting}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs shadow-[0_0_16px_rgba(37,99,235,0.6)] border border-cyan-400/40 flex items-center gap-2 cursor-pointer transition-all"
            >
              {isTesting ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                  <span>{isAr ? 'جاري التحقق...' : 'Verifying...'}</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5 text-cyan-200" />
                  <span>{isAr ? 'حفظ وتفعيل فوري' : 'Save & Initialize AI'}</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default ApiKeySetupModal;
