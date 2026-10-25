/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * KNOuX AI Assistant Chatbot Copilot
 * Supports OpenRouter and OpenAI API Key configuration with instant activation.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  MessageSquare,
  X,
  Minimize2,
  Send,
  Key,
  CheckCircle2,
  Settings,
  Shield,
  Zap,
  Bot,
  User,
  HelpCircle,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
}

interface KNOuXAssistantChatProps {
  currentSection?: string;
  locale?: 'en' | 'ar';
}

export const KNOuXAssistantChat: React.FC<KNOuXAssistantChatProps> = ({
  currentSection = 'home',
  locale = 'en',
}) => {
  const isAr = locale === 'ar';
  const [isOpen, setIsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // API Key & Provider State
  const [provider, setProvider] = useState<'openrouter' | 'openai'>('openrouter');
  const [apiKey, setApiKey] = useState<string>('');
  const [isKeySaved, setIsKeySaved] = useState<boolean>(false);

  // Chat State
  const [inputMessage, setInputMessage] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'ai',
      text: isAr
        ? 'مرحباً بك! أنا مساعد الذكاء الاصطناعي الخاص بـ KNOuX SmartOrganizer. أدخل مفتاح OpenRouter أو OpenAI في الإعدادات لتفعيل المساعد الذكي فوراً.'
        : 'Hello! I am your KNOuX AI Copilot. Enter your OpenRouter or OpenAI API key in settings to activate full AI assistance instantly.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load saved API key on mount
  useEffect(() => {
    const savedKey = localStorage.getItem('knoux_ai_api_key');
    const savedProvider = localStorage.getItem('knoux_ai_provider') as 'openrouter' | 'openai';
    if (savedKey) {
      setApiKey(savedKey);
      setIsKeySaved(true);
    }
    if (savedProvider) {
      setProvider(savedProvider);
    }
  }, []);

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim()) {
      localStorage.setItem('knoux_ai_api_key', apiKey.trim());
      localStorage.setItem('knoux_ai_provider', provider);
      setIsKeySaved(true);
      setIsSettingsOpen(false);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: 'ai',
          text: isAr
            ? 'تم حفظ المفتاح بنجاح! تم تفعيل النموذج الذكي فوراً. كيف يمكنني مساعدتك اليوم؟'
            : 'API key saved successfully! Model activated instantly. How can I assist your system today?',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  };

  const handleClearKey = () => {
    localStorage.removeItem('knoux_ai_api_key');
    setApiKey('');
    setIsKeySaved(false);
  };

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() || isGenerating) return;

    const userText = inputMessage.trim();
    setInputMessage('');

    const newMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, newMsg]);
    setIsGenerating(true);

    try {
      let aiResponseText = '';

      if (isKeySaved && apiKey) {
        // Real API Call to OpenRouter or OpenAI
        const endpoint =
          provider === 'openrouter'
            ? 'https://openrouter.ai/api/v1/chat/completions'
            : 'https://api.openai.com/v1/chat/completions';

        const modelName =
          provider === 'openrouter' ? 'anthropic/claude-3.5-sonnet' : 'gpt-4o-mini';

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey.trim()}`,
            ...(provider === 'openrouter' && {
              'HTTP-Referer': window.location.origin,
              'X-Title': 'KNOuX SmartOrganizer AI Copilot',
            }),
          },
          body: JSON.stringify({
            model: modelName,
            messages: [
              {
                role: 'system',
                content:
                  'You are KNOuX AI Copilot, an expert Windows system organizer and diagnostic assistant embedded inside KNOuX SmartOrganizer. Help the user manage apps, files, storage, cleanup, startup, and services.',
              },
              { role: 'user', content: userText },
            ],
            temperature: 0.7,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          aiResponseText =
            data.choices?.[0]?.message?.content ||
            (isAr ? 'تم استلام الرد بنجاح.' : 'Response received successfully.');
        } else {
          const errData = await res.json().catch(() => ({}));
          aiResponseText = isAr
            ? `خطأ في الاتصال بالخدمة (${res.status}): ${errData.error?.message || 'تحقق من صحة المفتاح.'}`
            : `API Error (${res.status}): ${errData.error?.message || 'Please check your API key.'}`;
        }
      } else {
        // Intelligent Simulated Assistant Response when key is not provided yet
        await new Promise((r) => setTimeout(r, 1200));
        aiResponseText = isAr
          ? `ملاحظة: لم تقم بإدخال مفتاح الـ API بعد. لإجابات ذكية حقيقية عبر الإنترنت، يرجى النقر على أيقونة الإعدادات (⚙️) أعلاه وإدخال مفتاح ${provider === 'openrouter' ? 'OpenRouter' : 'OpenAI Code Console v2'}. وفي الوقت الحالي، إليك إرشادات نظام KNOuX: القسم الحالي النشط هو "${currentSection}". يمكنك فحص المخلفات أو تنظيم الملفات بكل سهولة!`
          : `Note: You have not entered an API key yet. For live AI responses, click the settings icon (⚙️) above and enter your ${provider === 'openrouter' ? 'OpenRouter' : 'OpenAI Code Console v2'} key. Currently, your active section is "${currentSection}". You can run smart scans, organize files, and optimize storage anytime!`;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: aiResponseText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: isAr ? `حدث خطأ أثناء الاتصال: ${err.message}` : `Connection error: ${err.message}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      {/* Floating Trigger Button in Bottom Right */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 text-white flex items-center justify-center shadow-[0_0_25px_rgba(37,99,235,0.7)] border border-cyan-300/50 hover:scale-105 active:scale-95 transition-all cursor-pointer group"
          title="Open KNOuX AI Copilot"
        >
          <Sparkles className="w-5 h-5 text-white animate-pulse" />
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#050c1b]" />
        </button>
      )}

      {/* Chat Window Modal / Floating Panel */}
      {isOpen && (
        <div
          dir={isAr ? 'rtl' : 'ltr'}
          className="fixed bottom-6 right-6 z-50 w-[380px] sm:w-[420px] h-[560px] bg-[#040a16] border border-[#1b3f70] rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden text-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-300 font-sans"
        >
          {/* Header Bar */}
          <div className="px-4 py-3 bg-[#061226] border-b border-[#0f2444] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center shadow-[0_0_12px_rgba(37,99,235,0.6)]">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white tracking-wide">KNOuX AI Copilot</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold uppercase border ${
                      isKeySaved
                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50'
                        : 'bg-amber-950/80 text-amber-300 border-amber-500/50'
                    }`}
                  >
                    {isKeySaved ? (isAr ? 'نشط' : 'Active') : (isAr ? 'يحتاج مفتاح' : 'Needs Key')}
                  </span>
                </div>
                <div className="text-[10px] text-cyan-400 font-mono">
                  {provider === 'openrouter' ? 'OpenRouter API' : 'OpenAI Code Console v2'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsSettingsOpen((prev) => !prev)}
                className="p-1.5 rounded-lg bg-[#081730] hover:bg-[#11274f] text-slate-300 hover:text-white border border-[#183661] transition cursor-pointer"
                title="API Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg bg-[#081730] hover:bg-rose-950 hover:text-rose-300 text-slate-400 border border-[#183661] transition cursor-pointer"
                title="Minimize"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Settings Drawer (API Key Input) */}
          {isSettingsOpen && (
            <div className="p-3.5 bg-[#071328] border-b border-[#15325d] animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
                  <Key className="w-3.5 h-3.5" />
                  <span>{isAr ? 'إعدادات مفتاح الـ API' : 'AI Provider & Key Setup'}</span>
                </div>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <form onSubmit={handleSaveKey} className="space-y-2.5 text-xs">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">
                    {isAr ? 'اختر المزود (Provider)' : 'Select AI Provider'}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setProvider('openrouter')}
                      className={`p-1.5 rounded-lg border text-center font-semibold transition cursor-pointer ${
                        provider === 'openrouter'
                          ? 'border-cyan-400 bg-cyan-950/40 text-cyan-200'
                          : 'border-slate-800 bg-slate-900/60 text-slate-400'
                      }`}
                    >
                      OpenRouter
                    </button>
                    <button
                      type="button"
                      onClick={() => setProvider('openai')}
                      className={`p-1.5 rounded-lg border text-center font-semibold transition cursor-pointer ${
                        provider === 'openai'
                          ? 'border-cyan-400 bg-cyan-950/40 text-cyan-200'
                          : 'border-slate-800 bg-slate-900/60 text-slate-400'
                      }`}
                    >
                      OpenAI Console v2
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-slate-300 font-medium block mb-1">
                    {isAr ? 'أدخل مفتاح الـ API (API Key)' : 'Enter API Key'}
                  </label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={
                      provider === 'openrouter' ? 'sk-or-v1-...' : 'sk-proj-...'
                    }
                    className="w-full bg-[#040a16] border border-[#1b3f70] rounded-lg px-3 py-1.5 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400 font-mono text-xs"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  {isKeySaved ? (
                    <button
                      type="button"
                      onClick={handleClearKey}
                      className="text-rose-400 hover:underline text-[11px]"
                    >
                      {isAr ? 'حذف المفتاح المحفوظ' : 'Remove Saved Key'}
                    </button>
                  ) : (
                    <span className="text-[10px] text-slate-400">
                      {isAr ? 'يتفعل النموذج فوراً عند الحفظ' : 'Activates instantly upon save'}
                    </span>
                  )}
                  <button
                    type="submit"
                    className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs cursor-pointer shadow-md"
                  >
                    {isAr ? 'حفظ وتفعيل' : 'Save & Activate'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Messages List */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3 knx-custom-scrollbar bg-[#050e1f]">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-cyan-950 border border-cyan-500/40 text-cyan-300'
                  }`}
                >
                  {msg.sender === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                </div>

                <div
                  className={`max-w-[78%] p-3 rounded-2xl text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-none shadow-md'
                      : 'bg-[#08162e] border border-[#17345f] text-slate-200 rounded-tl-none shadow-inner'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.text}</div>
                  <div
                    className={`text-[9px] mt-1 text-right ${
                      msg.sender === 'user' ? 'text-blue-200' : 'text-slate-500'
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            ))}

            {isGenerating && (
              <div className="flex gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-cyan-950 border border-cyan-500/40 text-cyan-300 flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="p-3 rounded-2xl bg-[#08162e] border border-[#17345f] text-slate-300 rounded-tl-none flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                  <span className="text-xs">{isAr ? 'جاري التفكير...' : 'Thinking...'}</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestion Pills */}
          <div className="px-3 py-1.5 bg-[#061226] border-t border-[#0f2444] flex items-center gap-1.5 overflow-x-auto knx-custom-scrollbar shrink-0">
            <button
              onClick={() => setInputMessage(isAr ? 'كيف أنظف مخلفات النظام بأمان؟' : 'How can I safely clean junk files?')}
              className="px-2.5 py-1 rounded-full bg-[#091833] hover:bg-[#12274f] text-[10px] text-cyan-300 border border-[#173766] whitespace-nowrap transition cursor-pointer"
            >
              {isAr ? '🧹 تنظيف المخلفات' : '🧹 Clean Junk Files'}
            </button>
            <button
              onClick={() => setInputMessage(isAr ? 'ما هي التطبيقات التي تعمل عند بدء التشغيل؟' : 'Check startup apps optimization')}
              className="px-2.5 py-1 rounded-full bg-[#091833] hover:bg-[#12274f] text-[10px] text-cyan-300 border border-[#173766] whitespace-nowrap transition cursor-pointer"
            >
              {isAr ? '🚀 بدء التشغيل' : '🚀 Startup Apps'}
            </button>
            <button
              onClick={() => setInputMessage(isAr ? 'تحليل حالة التخزين' : 'Analyze storage volumes')}
              className="px-2.5 py-1 rounded-full bg-[#091833] hover:bg-[#12274f] text-[10px] text-cyan-300 border border-[#173766] whitespace-nowrap transition cursor-pointer"
            >
              {isAr ? '💾 مساحة التخزين' : '💾 Storage Analysis'}
            </button>
          </div>

          {/* Input Footer */}
          <form
            onSubmit={handleSendMessage}
            className="p-3 bg-[#040a16] border-t border-[#0f2444] flex items-center gap-2 shrink-0"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={isAr ? 'اطلب مساعدة من مساعد KNOuX الذكي...' : 'Ask KNOuX AI Copilot anything...'}
              className="flex-1 bg-[#071328] border border-[#173766] rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isGenerating}
              className="w-9 h-9 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white flex items-center justify-center shadow-md transition cursor-pointer shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default KNOuXAssistantChat;
