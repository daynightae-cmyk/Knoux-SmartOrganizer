/**
 * KNOuX SmartOrganizer — Collection Composer Workspace (Stage 3)
 */

import React, { useState } from 'react';
import {
  Layers,
  Plus,
  Tag,
  Calendar,
  Sparkles,
  Trash2,
  Filter,
  ArrowRight,
  FolderArchive,
} from 'lucide-react';
import { useStudio } from '../context';
import { StudioCollection } from '../types';

export function CollectionComposer() {
  const { collections, setActiveStageId, native, locale } = useStudio();
  const [collectionList, setCollectionList] = useState<StudioCollection[]>(collections);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [selectedRuleTag, setSelectedRuleTag] = useState('tag: custom');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollectionName.trim()) return;
    const newCol: StudioCollection = {
      id: `col-${Date.now()}`,
      name: newCollectionName.trim(),
      fileCount: native.mode === 'measured' ? 0 : Math.floor(Math.random() * 200) + 15,
      totalSizeFormatted: native.mode === 'measured' ? 'Not measured' : `${(Math.random() * 8 + 1).toFixed(1)} GB`,
      color: '#3b82f6',
      ruleTag: selectedRuleTag,
      createdDate: new Date().toISOString().split('T')[0],
    };
    setCollectionList((prev) => [newCol, ...prev]);
    setNewCollectionName('');
  };

  const handleDelete = (id: string) => {
    setCollectionList((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div className="flex-1 px-6 py-2 overflow-y-auto studio-scrollbar select-none">
      <div className="max-w-5xl mx-auto space-y-4">
        {/* Banner */}
        <div className="studio-glass-panel rounded-xl p-5 border border-[#132c52] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <Layers className="w-4 h-4" />
              <span>{locale === 'en' ? 'Smart Collections & Sets' : 'المجموعات الذكية والحزم'}</span>
            </div>
            <h2 className="text-xl font-bold text-white">
              {locale === 'en' ? 'Curated Collections Workspace' : 'مساحة عمل تجميع المجموعات'}
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              {locale === 'en'
                ? 'Save and curate multi-source groupings using semantic tags, metadata thresholds, and project markers before routing to destinations.'
                : 'احفظ ورتّب المجموعات متعدّدة المصادر باستخدام وسوم دلالية وقواعد ذكية قبل إرسالها للوجهة النهائية.'}
            </p>
          </div>

          <button
            onClick={() => setActiveStageId(4)}
            className="px-4 py-2 rounded-lg bg-[#2476ff] hover:bg-[#3282ff] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-[0_0_12px_rgba(36,118,255,0.4)] cursor-pointer"
          >
            <span>{locale === 'en' ? 'Proceed to Rule Builder' : 'الانتقال إلى منشئ القواعد'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Quick Create Collection */}
        <div className="studio-glass-panel rounded-xl p-4 border border-[#132c52]">
          <h3 className="text-xs font-bold text-white mb-3 flex items-center gap-2">
            <Plus className="w-4 h-4 text-cyan-400" />
            <span>{locale === 'en' ? 'Create Dynamic Collection' : 'إنشاء مجموعة ديناميكية جديدة'}</span>
          </h3>

          <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              placeholder="e.g. 4K Wallpapers 2025 or Client Video Sequences"
              className="flex-1 bg-[#061226] border border-[#173766] rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-[#2476ff]"
            />
            <select
              value={selectedRuleTag}
              onChange={(e) => setSelectedRuleTag(e.target.value)}
              className="bg-[#091a33] text-slate-300 border border-[#173766] rounded-lg px-3 py-2 text-xs outline-none cursor-pointer"
            >
              <option value="tag: high-res">Rule: High Resolution (4K and above)</option>
              <option value="tag: recent">Rule: Modified within 30 days</option>
              <option value="tag: uncompressed">Rule: Lossless Audio / RAW</option>
              <option value="tag: custom">Rule: Manual File Selection Basket</option>
            </select>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[#122e57] hover:bg-[#1a417a] text-cyan-300 border border-[#2476ff]/60 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-cyan-400" />
              <span>{locale === 'en' ? 'Add Collection' : 'إضافة المجموعة'}</span>
            </button>
          </form>
        </div>

        {/* Collections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {collectionList.map((col) => (
            <div
              key={col.id}
              className="p-3.5 rounded-xl bg-[#08182f] border border-[#142e56] hover:border-[#1e457e] transition-all flex items-start justify-between group"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border"
                  style={{
                    backgroundColor: 'rgba(36, 118, 255, 0.15)',
                    borderColor: 'rgba(36, 118, 255, 0.4)',
                    color: col.color,
                  }}
                >
                  <FolderArchive className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                    {col.name}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                    {col.fileCount} files &nbsp;|&nbsp; {col.totalSizeFormatted}
                  </div>
                  <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#0b1d38] border border-[#1b3d6e] text-[10px] text-cyan-300 font-mono">
                    <Tag className="w-3 h-3 text-cyan-400" />
                    <span>{col.ruleTag}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setActiveStageId(2)}
                  className="px-2.5 py-1 rounded bg-[#0c1f3b] hover:bg-[#153463] text-cyan-300 text-[11px] border border-[#1b3f70] transition-colors cursor-pointer"
                >
                  {locale === 'en' ? 'Open Library' : 'فتح المكتبة'}
                </button>
                <button
                  onClick={() => handleDelete(col.id)}
                  className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-950/40 transition-colors cursor-pointer"
                  title="Remove collection"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
