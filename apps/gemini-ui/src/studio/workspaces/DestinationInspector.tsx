/**
 * KNOuX SmartOrganizer — Destination Inspector Workspace (Stage 5)
 */

import React, { useState } from 'react';
import {
  Folder,
  HardDrive,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Compass,
} from 'lucide-react';
import { useStudio } from '../context';

export function DestinationInspector() {
  const {
    destinationPath,
    setDestinationPath,
    operationMode,
    setOperationMode,
    setActiveStageId,
    locale,
  } = useStudio();

  const [drives] = useState([
    {
      mount: 'D:\\',
      label: 'Fast Storage SSD',
      totalGb: 2048,
      freeGb: 1420,
      isWritable: true,
      fs: 'NTFS',
    },
    {
      mount: 'E:\\',
      label: 'Media Archive HDD',
      totalGb: 4096,
      freeGb: 890,
      isWritable: true,
      fs: 'NTFS',
    },
    {
      mount: 'C:\\',
      label: 'System OS NVMe',
      totalGb: 1024,
      freeGb: 240,
      isWritable: true,
      fs: 'NTFS',
    },
  ]);

  return (
    <div className="flex-1 px-6 py-2 overflow-y-auto studio-scrollbar select-none">
      <div className="max-w-5xl mx-auto space-y-4">
        {/* Banner */}
        <div className="studio-glass-panel rounded-xl p-5 border border-[#132c52] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <Folder className="w-4 h-4" />
              <span>{locale === 'en' ? 'Target Output Volume' : 'وحدة التخزين والوجهة المستهدفة'}</span>
            </div>
            <h2 className="text-xl font-bold text-white">
              {locale === 'en' ? 'Destination & Storage Strategy' : 'استراتيجية الوجهة والتخزين'}
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              {locale === 'en'
                ? 'Select and verify destination storage volume with automatic headroom calculation, drive health verification, and zero-collision isolation.'
                : 'حدد وتحقق من وحدة التخزين المستهدفة مع حساب المساحة الحرة والتأكد من أمان المسار.'}
            </p>
          </div>

          <button
            onClick={() => setActiveStageId(6)}
            className="px-4 py-2 rounded-lg bg-[#2476ff] hover:bg-[#3282ff] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-[0_0_12px_rgba(36,118,255,0.4)] cursor-pointer"
          >
            <span>{locale === 'en' ? 'Proceed to Plan Review' : 'الانتقال إلى مراجعة الخطة'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Path configuration input */}
        <div className="studio-glass-panel rounded-xl p-4 border border-[#132c52] space-y-3">
          <h3 className="text-xs font-bold text-white flex items-center gap-2">
            <Folder className="w-4 h-4 text-cyan-400" />
            <span>{locale === 'en' ? 'Target Output Path' : 'مسار المجلد المستهدف'}</span>
          </h3>

          <div className="flex gap-2">
            <input
              type="text"
              value={destinationPath}
              onChange={(e) => setDestinationPath(e.target.value)}
              className="flex-1 bg-[#061226] border border-[#173766] rounded-lg px-3 py-2 text-xs text-white font-mono outline-none focus:border-[#2476ff]"
            />
          </div>

          {/* Preset common destination suggestions */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] text-slate-500">Presets:</span>
            {[
              'D:\\Organized\\Images\\',
              'D:\\Organized\\Documents\\',
              'E:\\Media\\Organized_Archive\\',
            ].map((p, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setDestinationPath(p)}
                className="px-2 py-0.5 rounded bg-[#091a33] hover:bg-[#122e57] text-[11px] font-mono text-cyan-300 border border-[#142e56] transition-colors cursor-pointer"
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Available Drives Space Headroom */}
        <div className="studio-glass-panel rounded-xl p-4 border border-[#132c52] space-y-3">
          <h3 className="text-xs font-bold text-white flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-cyan-400" />
            <span>{locale === 'en' ? 'Storage Volume Capacity & Health' : 'سعة وحالة وحدات التخزين المتوفرة'}</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {drives.map((drive, idx) => {
              const usedGb = drive.totalGb - drive.freeGb;
              const usedPercent = Math.round((usedGb / drive.totalGb) * 100);

              return (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-[#08182f] border border-[#142e56] space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white font-mono">{drive.mount}</span>
                    <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      {drive.fs} Writable
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-400">{drive.label}</div>

                  {/* Progress bar */}
                  <div className="w-full h-2 rounded-full bg-[#050e1a] overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#2476ff] to-[#26c6ff]"
                      style={{ width: `${usedPercent}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>{drive.freeGb} GB free</span>
                    <span>{drive.totalGb} GB total</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Operation Mode Detailed Switcher */}
        <div className="studio-glass-panel rounded-xl p-4 border border-[#132c52] space-y-3">
          <h3 className="text-xs font-bold text-white flex items-center gap-2">
            <Compass className="w-4 h-4 text-cyan-400" />
            <span>{locale === 'en' ? 'Execution Mode & Isolation' : 'وضع التنفيذ والعزل'}</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              {
                id: 'copy' as const,
                title: 'Copy Files',
                desc: 'Duplicates files into organized destination. Originals remain 100% untouched. Best for safety.',
              },
              {
                id: 'move' as const,
                title: 'Move Files',
                desc: 'Relocates files to destination. Saves space instantly. Rollback available via history journal.',
              },
              {
                id: 'virtual' as const,
                title: 'Virtual Organization',
                desc: 'Generates structured Windows shortcuts (.lnk) or symlinks without altering physical bits.',
              },
            ].map((mode) => (
              <div
                key={mode.id}
                onClick={() => setOperationMode(mode.id)}
                className={`p-3 rounded-lg border transition-all cursor-pointer ${
                  operationMode === mode.id
                    ? 'bg-[#122e5a] border-[#2476ff] shadow-[0_0_12px_rgba(36,118,255,0.4)]'
                    : 'bg-[#08182f] hover:bg-[#0c203b] border-[#142e56]'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <input
                    type="radio"
                    name="modeSelect"
                    checked={operationMode === mode.id}
                    onChange={() => setOperationMode(mode.id)}
                    className="accent-[#2476ff]"
                  />
                  <span className="text-xs font-bold text-white">{mode.title}</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">{mode.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
