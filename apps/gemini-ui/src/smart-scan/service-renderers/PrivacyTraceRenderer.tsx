/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * SCAN-06 — Privacy Trace Check Renderer
 */

import React from 'react';
import { Shield, Lock } from 'lucide-react';

export interface PrivacyTraceRendererProps {
  isArabic?: boolean;
}

export const PrivacyTraceRenderer: React.FC<PrivacyTraceRendererProps> = ({ isArabic = false }) => {
  return (
    <div className="space-y-4 text-slate-100 font-sans">
      <div className="flex items-center gap-2.5 border-b border-[#143058] pb-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-500 to-cyan-400 flex items-center justify-center text-white shadow-md">
          <Shield className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-extrabold text-sm text-white">
            {isArabic ? 'فحص آثار الخصوصية والسجلات' : 'Privacy Traces & Tracking Tokens Inspector'}
          </h3>
          <p className="text-[11px] text-slate-400">
            {isArabic ? 'سجلات المتصفح، الكوكيز والملفات الأخيرة المستعملة' : 'Analyzes browser tracking cookies, MRU recent files and clipboard caches'}
          </p>
        </div>
      </div>

      <div className="bg-[#091a38] p-3 rounded-xl border border-[#133059] text-xs space-y-2">
        <div className="flex justify-between font-bold text-white">
          <span>Identified Privacy Items:</span>
          <span className="text-teal-300 font-mono">327 Traces (across 6 browsers)</span>
        </div>
      </div>
    </div>
  );
};
