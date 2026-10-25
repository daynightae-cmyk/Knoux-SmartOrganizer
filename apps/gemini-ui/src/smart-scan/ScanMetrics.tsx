/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * KNOuX SmartOrganizer — Scan Metrics (6 KPI Cards Bar)
 */

import React from 'react';
import { Target, FileStack, AlertTriangle, HardDrive, Shield, Activity } from 'lucide-react';
import { KpiMetric } from './smartScan.types';

export interface ScanMetricsProps {
  metrics: KpiMetric[];
  isArabic?: boolean;
}

export const ScanMetrics: React.FC<ScanMetricsProps> = ({ metrics, isArabic = false }) => {
  return (
    <div className="scan-metrics grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 shrink-0">
      {metrics.map((m) => {
        const isCoverage = m.id === 'coverage';
        const isFiles = m.id === 'files';
        const isIssues = m.id === 'issues';
        const isSpace = m.id === 'space';
        const isPrivacy = m.id === 'privacy';
        const isHealth = m.id === 'health';

        return (
          <div
            key={m.id}
            className={`scan-metric-card bg-[#07152b]/90 border rounded-xl p-3 flex flex-col justify-between transition-all shadow-md ${
              isCoverage
                ? 'border-[#132c4f] hover:border-cyan-500/50'
                : isFiles
                ? 'border-[#132c4f] hover:border-blue-500/50'
                : isIssues
                ? 'border-[#132c4f] hover:border-rose-500/50'
                : isSpace
                ? 'border-[#132c4f] hover:border-purple-500/50'
                : isPrivacy
                ? 'border-[#132c4f] hover:border-teal-500/50'
                : 'border-[#132c4f] hover:border-emerald-500/50'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-medium text-slate-300 truncate">
                {isArabic ? m.labelAr : m.labelEn}
              </span>
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border ${
                  isCoverage
                    ? 'bg-cyan-500/15 text-cyan-400 border-cyan-400/30'
                    : isFiles
                    ? 'bg-blue-500/15 text-blue-400 border-blue-400/30'
                    : isIssues
                    ? 'bg-rose-500/15 text-rose-400 border-rose-400/30'
                    : isSpace
                    ? 'bg-purple-500/15 text-purple-400 border-purple-400/30'
                    : isPrivacy
                    ? 'bg-teal-500/15 text-teal-400 border-teal-400/30'
                    : 'bg-emerald-500/15 text-emerald-400 border-emerald-400/30'
                }`}
              >
                {isCoverage && <Target className="w-3.5 h-3.5" />}
                {isFiles && <FileStack className="w-3.5 h-3.5" />}
                {isIssues && <AlertTriangle className="w-3.5 h-3.5" />}
                {isSpace && <HardDrive className="w-3.5 h-3.5" />}
                {isPrivacy && <Shield className="w-3.5 h-3.5" />}
                {isHealth && <Activity className="w-3.5 h-3.5" />}
              </div>
            </div>

            <div
              className={`text-xl font-black font-mono tracking-tight ${
                isIssues
                  ? 'text-rose-300'
                  : isSpace
                  ? 'text-purple-300'
                  : isPrivacy
                  ? 'text-teal-300'
                  : isHealth
                  ? 'text-emerald-400'
                  : 'text-white'
              }`}
            >
              {m.value}
            </div>

            <div className="flex items-center justify-between text-[10px] mt-1 font-medium">
              <span
                className={
                  isIssues
                    ? 'text-rose-400'
                    : isSpace
                    ? 'text-purple-300'
                    : isPrivacy
                    ? 'text-teal-300'
                    : isHealth
                    ? 'text-emerald-300'
                    : 'text-cyan-300'
                }
              >
                {isArabic ? m.subtextAr : m.subtextEn}
              </span>
              {isHealth ? (
                <svg className="w-8 h-3 text-emerald-400 shrink-0" viewBox="0 0 40 12" fill="none">
                  <path d="M0 10 L10 8 L20 4 L30 6 L40 1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              ) : (
                <div className="flex items-end gap-0.5 h-3 shrink-0">
                  <span className="w-1 h-1.5 bg-cyan-400 rounded-xs" />
                  <span className="w-1 h-2 bg-cyan-400 rounded-xs" />
                  <span className="w-1 h-3 bg-cyan-400 rounded-xs" />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
