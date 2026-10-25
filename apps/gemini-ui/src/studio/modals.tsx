/**
 * KNOuX SmartOrganizer — Studio Interactive Modals & Drawers
 */

import React, { useState } from 'react';
import {
  X,
  FolderPlus,
  Folder,
  Sliders,
  AlertTriangle,
  FileText,
  Check,
  RefreshCw,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';
import { useStudio } from './context';

export function StudioModals() {
  const {
    activeModal,
    closeModal,
    addAuthorizedSource,
    destinationPath,
    setDestinationPath,
    conflicts,
    categories,
    simulateZeroSources,
    simulateScanningState,
    simulatePermissionError,
    resetToDefaultScreenshotFixture,
    locale,
  } = useStudio();

  const [newPath, setNewPath] = useState('');
  const [tempDest, setTempDest] = useState(destinationPath);

  if (!activeModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm select-none">
      {/* 1. Add Folder Modal */}
      {activeModal === 'add_folder' && (
        <div className="studio-glass-panel rounded-xl max-w-md w-full border border-[#1b3f70] shadow-2xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#142e56]">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <FolderPlus className="w-4 h-4 text-cyan-400" />
              <span>{locale === 'en' ? 'Authorize Local Folder' : 'تصريح مجلد محلي جديد'}</span>
            </div>
            <button onClick={closeModal} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-slate-300 font-medium block">
              {locale === 'en' ? 'Folder Path (System Absolute):' : 'مسار المجلد المطلق:'}
            </label>
            <input
              type="text"
              value={newPath}
              onChange={(e) => setNewPath(e.target.value)}
              placeholder="e.g. C:\Users\Alex\Downloads"
              className="w-full bg-[#061226] border border-[#173766] rounded-lg px-3 py-2 text-xs text-white font-mono outline-none focus:border-[#2476ff]"
              autoFocus
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={closeModal}
              className="px-3 py-1.5 rounded-lg bg-transparent hover:bg-[#0c1f38] text-slate-400 hover:text-white text-xs"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (newPath.trim()) {
                  addAuthorizedSource(newPath.trim());
                  closeModal();
                }
              }}
              className="px-4 py-1.5 rounded-lg bg-[#2476ff] hover:bg-[#3282ff] text-white text-xs font-semibold"
            >
              Grant & Index
            </button>
          </div>
        </div>
      )}

      {/* 2. Change Destination Modal */}
      {activeModal === 'change_destination' && (
        <div className="studio-glass-panel rounded-xl max-w-md w-full border border-[#1b3f70] shadow-2xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#142e56]">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <Folder className="w-4 h-4 text-cyan-400" />
              <span>{locale === 'en' ? 'Change Output Destination' : 'تغيير مجلد الوجهة'}</span>
            </div>
            <button onClick={closeModal} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-slate-300 font-medium block">
              {locale === 'en' ? 'Destination Root Path:' : 'مسار جذر الوجهة:'}
            </label>
            <input
              type="text"
              value={tempDest}
              onChange={(e) => setTempDest(e.target.value)}
              className="w-full bg-[#061226] border border-[#173766] rounded-lg px-3 py-2 text-xs text-white font-mono outline-none focus:border-[#2476ff]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={closeModal}
              className="px-3 py-1.5 rounded-lg bg-transparent hover:bg-[#0c1f38] text-slate-400 hover:text-white text-xs"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setDestinationPath(tempDest);
                closeModal();
              }}
              className="px-4 py-1.5 rounded-lg bg-[#2476ff] hover:bg-[#3282ff] text-white text-xs font-semibold"
            >
              Save Destination
            </button>
          </div>
        </div>
      )}

      {/* 3. Conflict Details Modal */}
      {activeModal === 'conflict_details' && (
        <div className="studio-glass-panel rounded-xl max-w-lg w-full border border-[#1b3f70] shadow-2xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#142e56]">
            <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>{locale === 'en' ? 'Potential Conflicts Inspector' : 'فحص التعارضات المحتملة'}</span>
            </div>
            <button onClick={closeModal} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            {conflicts.map((conf) => (
              <div
                key={conf.id}
                className="p-3 rounded-lg bg-[#08182f] border border-[#142e56] space-y-1"
              >
                <div className="text-xs font-bold text-white flex items-center justify-between">
                  <span>{conf.titleEn}</span>
                  <span className="text-[10px] text-cyan-400 font-mono">
                    {conf.affectedCount} items
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {conf.descriptionEn}
                </p>
                <div className="text-[10px] text-emerald-400 font-mono pt-1">
                  Strategy: {conf.resolutionStrategy.replace('_', ' ').toUpperCase()}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={closeModal}
              className="px-4 py-1.5 rounded-lg bg-[#2476ff] text-white text-xs font-semibold"
            >
              Acknowledge & Close
            </button>
          </div>
        </div>
      )}

      {/* 4. Edit Categories Modal */}
      {activeModal === 'edit_categories' && (
        <div className="studio-glass-panel rounded-xl max-w-xl w-full border border-[#1b3f70] shadow-2xl p-5 space-y-4 max-h-[85vh] flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-[#142e56]">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span>{locale === 'en' ? 'Configure Categories & Mappings' : 'تعديل التصنيفات وامتدادات الملفات'}</span>
            </div>
            <button onClick={closeModal} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto studio-scrollbar space-y-2 pr-1">
            {categories.map((c) => (
              <div
                key={c.key}
                className="p-2.5 rounded-lg bg-[#07152b] border border-[#122b50] flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-white">{c.labelEn}</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                    Ext: {c.defaultExtensions.join(', ')}
                  </div>
                </div>
                <span className="text-xs text-cyan-300 font-mono font-bold">
                  {c.fileCount.toLocaleString()} files
                </span>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-2 border-t border-[#142e56]">
            <button
              onClick={closeModal}
              className="px-4 py-1.5 rounded-lg bg-[#2476ff] text-white text-xs font-semibold"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* 5. Command Center / Dev Scenarios Drawer */}
      {activeModal === 'command_center' && (
        <div className="studio-glass-panel rounded-xl max-w-md w-full border border-[#2476ff]/60 shadow-[0_0_30px_rgba(36,118,255,0.35)] p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#142e56]">
            <div className="flex items-center gap-2 text-cyan-300 font-bold text-sm">
              <Sparkles className="w-4 h-4" />
              <span>Studio Test Scenarios & State Fixtures</span>
            </div>
            <button onClick={closeModal} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-slate-300">
            Verify every edge state mandated in prompt specification Section 4 & 8:
          </p>

          <div className="space-y-2">
            <button
              onClick={() => {
                resetToDefaultScreenshotFixture();
                closeModal();
              }}
              className="w-full text-left p-2.5 rounded-lg bg-[#0b1c36] hover:bg-[#153463] border border-[#2476ff]/50 text-xs text-cyan-200 font-semibold transition-colors flex items-center justify-between"
            >
              <span>1. Reference Screenshot State (100% Target)</span>
              <span className="text-[10px] bg-cyan-900/60 px-1.5 py-0.5 rounded text-cyan-300 font-mono">
                REF-01
              </span>
            </button>

            <button
              onClick={() => {
                simulateZeroSources();
                closeModal();
              }}
              className="w-full text-left p-2.5 rounded-lg bg-[#091a33] hover:bg-[#122e57] border border-[#142e56] text-xs text-slate-300 transition-colors flex items-center justify-between"
            >
              <span>2. Zero Sources Onboarding State</span>
              <span className="text-[10px] text-slate-500 font-mono">0 Folders</span>
            </button>

            <button
              onClick={() => {
                simulateScanningState();
                closeModal();
              }}
              className="w-full text-left p-2.5 rounded-lg bg-[#091a33] hover:bg-[#122e57] border border-[#142e56] text-xs text-slate-300 transition-colors flex items-center justify-between"
            >
              <span>3. Background Scanning In-Progress</span>
              <span className="text-[10px] text-slate-500 font-mono">Telemetry</span>
            </button>

            <button
              onClick={() => {
                simulatePermissionError();
                closeModal();
              }}
              className="w-full text-left p-2.5 rounded-lg bg-[#091a33] hover:bg-[#122e57] border border-[#142e56] text-xs text-slate-300 transition-colors flex items-center justify-between"
            >
              <span>4. Permission Denied / Read-Only Warning</span>
              <span className="text-[10px] text-amber-400 font-mono">Lock</span>
            </button>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={closeModal}
              className="px-3 py-1.5 rounded-lg bg-transparent text-slate-400 hover:text-white text-xs"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
