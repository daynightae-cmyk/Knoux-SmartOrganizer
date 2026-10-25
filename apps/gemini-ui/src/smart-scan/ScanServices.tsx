/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * KNOuX SmartOrganizer — Scan Services Command Deck (10 Service Tiles)
 */

import React from 'react';
import {
  Zap,
  Search,
  Copy,
  HardDrive,
  Trash2,
  Shield,
  Rocket,
  Grid,
  Activity,
  Lightbulb,
  Settings,
  ChevronRight,
  Layers,
} from 'lucide-react';
import { ScanServiceMeta } from './smartScan.types';

export interface ScanServicesProps {
  services: ScanServiceMeta[];
  activeServiceId?: string | null;
  onSelectService: (service: ScanServiceMeta) => void;
  onOpenCustomScan: () => void;
  isArabic?: boolean;
}

export const ScanServices: React.FC<ScanServicesProps> = ({
  services,
  activeServiceId,
  onSelectService,
  onOpenCustomScan,
  isArabic = false,
}) => {
  const getIcon = (name: string) => {
    switch (name) {
      case 'Zap':
        return Zap;
      case 'Search':
        return Search;
      case 'Copy':
        return Copy;
      case 'HardDrive':
        return HardDrive;
      case 'Trash2':
        return Trash2;
      case 'Shield':
        return Shield;
      case 'Rocket':
        return Rocket;
      case 'Grid':
        return Grid;
      case 'Activity':
        return Activity;
      case 'Lightbulb':
      default:
        return Lightbulb;
    }
  };

  return (
    <section className="bg-[#071329]/80 border border-[#11294a] rounded-2xl p-3.5 sm:p-4 flex flex-col gap-3 shadow-lg shrink-0">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            {isArabic ? 'خدمات الفحص' : 'Scan Services'}
          </h2>
          <p className="text-[11px] text-slate-300 mt-0.5 font-medium">
            {isArabic
              ? 'اختر نوع الفحص أو شغل تحليلاً كاملاً. كل خدمة تستهدف منطقة محددة في نظامك.'
              : 'Choose a scan type or run a complete analysis. Each service targets a specific area of your system.'}
          </p>
        </div>

        <button
          onClick={onOpenCustomScan}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0e213d] hover:bg-[#163158] border border-cyan-500/30 text-xs text-cyan-300 font-bold transition cursor-pointer shadow-sm shrink-0"
        >
          <Settings className="w-3.5 h-3.5 text-cyan-400" />
          <span>{isArabic ? 'فحص مخصص' : 'Custom Scan'}</span>
        </button>
      </div>

      {/* 10 Service Cards Grid (2 rows x 5 cols on lg screens) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {services.map((srv) => {
          const IconComp = getIcon(srv.iconName);
          const isSelected = activeServiceId === srv.id;
          const title = isArabic ? srv.titleAr : srv.titleEn;
          const sub = isArabic ? srv.subtextAr : srv.subtextEn;

          return (
            <div
              key={srv.id}
              onClick={() => onSelectService(srv)}
              className={`group relative bg-[#091a38]/80 hover:bg-[#0f2852] border rounded-xl p-2.5 flex items-center justify-between gap-2 transition-all duration-200 cursor-pointer shadow-sm ${
                isSelected
                  ? 'border-cyan-400/80 bg-[#0e2850] shadow-[0_0_15px_rgba(38,198,218,0.3)]'
                  : 'border-[#14325a] hover:border-cyan-400/60 hover:shadow-[0_0_12px_rgba(38,198,218,0.2)]'
              }`}
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div
                  className={`w-8 h-8 rounded-lg bg-gradient-to-br ${srv.accentGradient} flex items-center justify-center shrink-0 shadow-md text-white border border-white/20 group-hover:scale-105 transition-transform`}
                >
                  <IconComp className="w-4 h-4 text-white" />
                </div>
                <div className="truncate">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-white truncate group-hover:text-cyan-200">
                      {title}
                    </span>
                    {srv.badge && (
                      <span className="px-1 py-0.2 rounded bg-cyan-400/20 text-[9px] font-bold text-cyan-300 border border-cyan-400/40">
                        {srv.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 truncate block">
                    {sub}
                  </span>
                </div>
              </div>
              <ChevronRight className={`w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 transition-transform ${isArabic ? 'rotate-180' : ''}`} />
            </div>
          );
        })}
      </div>
    </section>
  );
};
