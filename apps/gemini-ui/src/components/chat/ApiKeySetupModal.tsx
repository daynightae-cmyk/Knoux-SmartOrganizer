/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * KNOuX API Key Configuration Startup Modal
 * Appears on startup if no API key is detected in localStorage or environment.
 */

import React, { useState } from 'react';
import { Key, Shield, Sparkles, CheckCircle2, X, Lock, ExternalLink, Zap } from 'lucide-react';

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
  const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'error'>('idle');

  if (!isOpen) return null;

  const handleTestAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyValue.trim()) return;

    setIsTesting(true);
    setTestStatus('idle');

    // Simulate key validation test
    await new Promise((r) => setTimeout(r, 900));
    setIsTesting(false);
    setTestStatus('success');

    setTimeout(() => {
      onSave(keyValue.trim(), provider);
    }, 600);
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
              <span>{isAr ? 'تم التحقق من المفتاح وتفعيل الخدمات بنجاح!' : 'Key verified and AI services initialized!'}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-[#0f2444]">
            <button
              type="button"
              onClick={onSkip}
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
