/**
 * KNOuX SmartOrganizer — Organization Rule Builder Workspace (Stage 4)
 */

import React, { useState } from 'react';
import {
  FileCode,
  Layers,
  Sparkles,
  ArrowRight,
  Code2,
  CheckCircle,
  FolderTree,
  AlertCircle,
} from 'lucide-react';
import { useStudio } from '../context';

export function OrganizationRuleBuilder() {
  const {
    namingRule,
    setNamingRule,
    groupingRule,
    setGroupingRule,
    setActiveStageId,
    locale,
  } = useStudio();

  const [patternInput, setPatternInput] = useState('{YYYY}-{MM}-{DD}_{original}');
  const [folderPattern, setFolderPattern] = useState('YYYY \\ MM \\ DD');

  const tokenList = [
    '{original}',
    '{YYYY}',
    '{MM}',
    '{DD}',
    '{category}',
    '{increment}',
    '{resolution}',
  ];

  const insertToken = (token: string) => {
    setPatternInput((prev) => `${prev}_${token}`);
  };

  return (
    <div className="flex-1 px-6 py-2 overflow-y-auto studio-scrollbar select-none">
      <div className="max-w-5xl mx-auto space-y-4">
        {/* Banner */}
        <div className="studio-glass-panel rounded-xl p-5 border border-[#132c52] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <Code2 className="w-4 h-4" />
              <span>{locale === 'en' ? 'Local Draft & Rule Studio' : 'استوديو القواعد وصياغة النماذج'}</span>
            </div>
            <h2 className="text-xl font-bold text-white">
              {locale === 'en' ? 'Organization Rule Builder' : 'منشئ قواعد التنظيم المتقدم'}
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              {locale === 'en'
                ? 'Configure deterministic renaming templates and folder hierarchy structures. Rules are verified locally against existing schemas before committing.'
                : 'اضبط نماذج إعادة التسمية وهياكل المجلدات الحتمية. يتم التحقق من القواعد محلياً ضد المخطط قبل الاعتماد.'}
            </p>
          </div>

          <button
            onClick={() => setActiveStageId(5)}
            className="px-4 py-2 rounded-lg bg-[#2476ff] hover:bg-[#3282ff] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-[0_0_12px_rgba(36,118,255,0.4)] cursor-pointer"
          >
            <span>{locale === 'en' ? 'Proceed to Destinations' : 'الانتقال إلى الوجهات'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Section 1: Naming Pattern */}
          <div className="studio-glass-panel rounded-xl p-4 border border-[#132c52] space-y-3">
            <h3 className="text-xs font-bold text-white flex items-center gap-2">
              <FileCode className="w-4 h-4 text-cyan-400" />
              <span>{locale === 'en' ? 'File Naming Pattern' : 'نمط تسمية الملفات'}</span>
            </h3>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">
                {locale === 'en' ? 'Pattern Tokens Template:' : 'قالب الرموز المتغيرة:'}
              </label>
              <input
                type="text"
                value={patternInput}
                onChange={(e) => setPatternInput(e.target.value)}
                className="w-full bg-[#061226] border border-[#173766] rounded-lg px-3 py-2 text-xs text-cyan-300 font-mono outline-none focus:border-[#2476ff]"
              />
            </div>

            {/* Clickable token chips */}
            <div>
              <span className="text-[10px] text-slate-500 block mb-1.5">
                {locale === 'en' ? 'Click to append token:' : 'انقر لإضافة رمز:'}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {tokenList.map((token, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => insertToken(token)}
                    className="px-2 py-0.5 rounded bg-[#0b1c36] hover:bg-[#14325e] text-[10px] font-mono text-cyan-300 border border-[#1b3f70] transition-colors cursor-pointer"
                  >
                    + {token}
                  </button>
                ))}
              </div>
            </div>

            {/* Duplicate handling */}
            <div className="pt-2 border-t border-[#0e223d]">
              <label className="text-[11px] text-slate-400 block mb-1.5">
                {locale === 'en' ? 'Collision Resolution Strategy:' : 'استراتيجية حل التكرار:'}
              </label>
              <select
                value={namingRule.duplicateHandling}
                onChange={(e) =>
                  setNamingRule((prev) => ({
                    ...prev,
                    duplicateHandling: e.target.value as any,
                  }))
                }
                className="w-full bg-[#061226] border border-[#173766] rounded-lg px-3 py-2 text-xs text-slate-200 outline-none cursor-pointer"
              >
                <option value="add_date">Add timestamp (YYYY-MM-DD)</option>
                <option value="add_increment">Add increment index (001, 002)</option>
                <option value="skip">Skip file on conflict</option>
              </select>
            </div>
          </div>

          {/* Section 2: Folder Hierarchy Structure */}
          <div className="studio-glass-panel rounded-xl p-4 border border-[#132c52] space-y-3">
            <h3 className="text-xs font-bold text-white flex items-center gap-2">
              <FolderTree className="w-4 h-4 text-cyan-400" />
              <span>{locale === 'en' ? 'Folder Hierarchy Structure' : 'هيكل المجلدات المستهدفة'}</span>
            </h3>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">
                {locale === 'en' ? 'Subfolder Structure Format:' : 'تنسيق هيكل المجلدات الفرعية:'}
              </label>
              <input
                type="text"
                value={folderPattern}
                onChange={(e) => setFolderPattern(e.target.value)}
                className="w-full bg-[#061226] border border-[#173766] rounded-lg px-3 py-2 text-xs text-cyan-300 font-mono outline-none focus:border-[#2476ff]"
              />
            </div>

            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] text-slate-500 block">
                {locale === 'en' ? 'Preset Hierarchy Schemes:' : 'مخططات جاهزة شائعة:'}
              </span>
              {[
                { label: 'Chronological (YYYY \\ MM \\ DD)', value: 'YYYY \\ MM \\ DD' },
                { label: 'Category & Year ({category} \\ YYYY)', value: '{category} \\ YYYY' },
                { label: 'Flat root with prefix tags', value: 'Flat' },
              ].map((scheme, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setFolderPattern(scheme.value)}
                  className="w-full text-left px-2.5 py-1.5 rounded bg-[#091a33] hover:bg-[#122e57] text-xs text-slate-300 border border-[#142e56] transition-colors cursor-pointer flex items-center justify-between"
                >
                  <span>{scheme.label}</span>
                  <span className="text-[10px] font-mono text-cyan-400">{scheme.value}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Live Transformation Preview Card */}
        <div className="studio-glass-panel rounded-xl p-4 border border-[#132c52] space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-white">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>{locale === 'en' ? 'Deterministic Live Preview' : 'المعاينة الحية الفورية'}</span>
          </div>

          <div className="p-3 rounded-lg bg-[#050e1c] border border-[#102747] font-mono text-xs space-y-1.5">
            <div className="flex items-center justify-between text-slate-400">
              <span>Source Original:</span>
              <span className="text-slate-300">C:\Users\Alex\Desktop\mountain-lake.jpg</span>
            </div>
            <div className="flex items-center justify-between text-cyan-300 font-bold">
              <span>Calculated Output:</span>
              <span>D:\Organized\Images\2025\04\26\2025-04-26_mountain-lake.jpg</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
