/**
 * KNOuX SmartOrganizer — Renderer Families Part 2 (Families 7 to 12)
 * 7. Volume Bays
 * 8. Zoomable Treemap
 * 9. Candidate Safety Ledger
 * 10. Boot Register
 * 11. Live Pulse Charts
 * 12. Service Commander Ledger
 */

import React, { useState } from 'react';
import {
  HardDrive,
  Database,
  ShieldCheck,
  Rocket,
  Activity,
  Settings2,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Clock,
  Check,
  TrendingUp,
  Sliders,
  Cpu,
  RefreshCw,
  Search,
  Filter,
} from 'lucide-react';
import { ServiceVisualDescriptor } from '../../lib/service-ui-renderers';

interface RendererProps {
  descriptor: ServiceVisualDescriptor;
  locale?: 'en' | 'ar';
}

// =========================================================================
// FAMILY 7: Volume Bays
// 3D-styled volume cards C:/D:/E: with capacity meters
// =========================================================================
export const VolumeBaysRenderer: React.FC<RendererProps> = ({ descriptor }) => {
  const [selectedBay, setSelectedBay] = useState('C');

  const volumes = [
    { letter: 'C', label: 'Local System Drive', used: '284 GB', total: '512 GB', percent: 55, type: 'NVMe SSD', role: 'System OS' },
    { letter: 'D', label: 'Data & Workspaces', used: '620 GB', total: '1024 GB', percent: 60, type: 'SATA SSD', role: 'Data Vault' },
    { letter: 'E', label: 'External Backup USB', used: '120 GB', total: '2000 GB', percent: 6, type: 'USB 3.2 HDD', role: 'Removable' },
  ];

  const current = volumes.find((v) => v.letter === selectedBay) || volumes[0];

  return (
    <div className="flex flex-col lg:flex-row h-full gap-3 text-xs overflow-hidden">
      {/* Volume Cards */}
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3 overflow-y-auto">
        {volumes.map((vol) => (
          <div
            key={vol.letter}
            onClick={() => setSelectedBay(vol.letter)}
            className={`p-3.5 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
              selectedBay === vol.letter
                ? 'bg-gradient-to-b from-[#092248] to-[#051126] border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.4)]'
                : 'bg-[#061226] border-[#132c52] hover:bg-[#081833]'
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-600/30 border border-blue-400/50 flex items-center justify-center text-cyan-300 font-black text-sm">
                    {vol.letter}:
                  </div>
                  <div>
                    <div className="font-bold text-white text-xs">{vol.label}</div>
                    <div className="text-[10px] text-slate-400">{vol.type}</div>
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-1">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-slate-300">{vol.used} used</span>
                  <span className="text-slate-400">{vol.total}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#040a16] overflow-hidden border border-[#122e5a]">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full"
                    style={{ width: `${vol.percent}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 pt-2 border-t border-[#0f2444] text-[10px] font-mono text-cyan-300 flex justify-between">
              <span>{vol.role}</span>
              <span>{vol.percent}% Capacity</span>
            </div>
          </div>
        ))}
      </div>

      {/* Side Volume Inspector */}
      <div className="w-full lg:w-80 bg-[#050e1f] border border-[#132c52] rounded-xl p-3 shrink-0 flex flex-col justify-between">
        <div>
          <div className="font-bold text-cyan-300 pb-2 border-b border-[#0f2444] text-xs">
            Volume Inspector — ({current.letter}:)
          </div>

          <div className="py-3 space-y-2 font-mono text-[11px]">
            <div className="flex justify-between py-1 border-b border-[#0e223d]">
              <span className="text-slate-400">FileSystem:</span>
              <span className="text-white">NTFS Journaled</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#0e223d]">
              <span className="text-slate-400">Total Volume Size:</span>
              <span className="text-white">{current.total}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#0e223d]">
              <span className="text-slate-400">Allocated Used:</span>
              <span className="text-cyan-300 font-bold">{current.used}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#0e223d]">
              <span className="text-slate-400">S.M.A.R.T. Health:</span>
              <span className="text-emerald-400 font-bold">100% OK</span>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-[#0f2444] text-[10px] text-slate-400 flex justify-between">
          <span>{descriptor.signatureVisual}</span>
          <span className="text-emerald-400 font-bold">Volume Synchronized</span>
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// FAMILY 8: Zoomable Treemap
// Proportional color blocks + breadcrumbs + folder detail
// =========================================================================
export const ZoomableTreemapRenderer: React.FC<RendererProps> = ({ descriptor }) => {
  return (
    <div className="flex flex-col h-full gap-3 text-xs overflow-hidden">
      {/* Treemap Breadcrumb */}
      <div className="p-2.5 bg-[#07162d] border border-[#132c52] rounded-xl flex items-center justify-between text-slate-300">
        <div className="flex items-center gap-2 font-mono">
          <span className="text-cyan-400 font-bold">Root Drive C:</span>
          <span>/</span>
          <span>Program Files</span>
          <span>/</span>
          <span className="text-white font-bold">Software Footprint</span>
        </div>
        <span className="text-slate-400 text-[10px]">Click block to drill down</span>
      </div>

      {/* Proportional Grid Blocks */}
      <div className="flex-1 grid grid-cols-4 grid-rows-3 gap-2 p-2 bg-[#040a16] border border-[#132c52] rounded-xl">
        <div className="col-span-2 row-span-2 p-3 bg-blue-900/60 border border-blue-400/50 rounded-lg flex flex-col justify-between hover:border-cyan-300 transition cursor-pointer">
          <div className="font-bold text-white text-sm">Productivity Apps</div>
          <div className="font-mono text-cyan-300 text-xs font-bold">21.8 GB (45%)</div>
        </div>

        <div className="col-span-2 row-span-1 p-2.5 bg-purple-900/60 border border-purple-400/50 rounded-lg flex flex-col justify-between hover:border-purple-300 transition cursor-pointer">
          <div className="font-bold text-white">Developer Tools</div>
          <div className="font-mono text-purple-300 text-xs font-bold">12.1 GB (25%)</div>
        </div>

        <div className="col-span-1 row-span-2 p-2.5 bg-teal-900/60 border border-teal-400/50 rounded-lg flex flex-col justify-between hover:border-teal-300 transition cursor-pointer">
          <div className="font-bold text-white text-xs">Media Files</div>
          <div className="font-mono text-teal-300 text-xs">7.2 GB</div>
        </div>

        <div className="col-span-1 row-span-1 p-2 bg-amber-900/60 border border-amber-400/50 rounded-lg flex flex-col justify-between hover:border-amber-300 transition cursor-pointer">
          <div className="font-bold text-white text-xs">System Cache</div>
          <div className="font-mono text-amber-300 text-xs">4.2 GB</div>
        </div>

        <div className="col-span-2 row-span-1 p-2 bg-slate-800/80 border border-slate-600/50 rounded-lg flex justify-between items-center hover:border-slate-400 transition cursor-pointer">
          <div className="font-bold text-slate-200">Other Small Folders</div>
          <div className="font-mono text-slate-300">3.3 GB</div>
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// FAMILY 9: Candidate Safety Ledger
// Risk-classified list (Safe/Notice/Caution) + safety wizard
// =========================================================================
export const CandidateSafetyLedgerRenderer: React.FC<RendererProps> = ({ descriptor }) => {
  const candidates = [
    { name: 'Windows Temp Cache (%TEMP%)', risk: 'Safe', size: '1.2 GB', desc: 'Temporary application cache files safe for deletion.' },
    { name: 'Orphaned AppData Folders', risk: 'Notice', size: '480 MB', desc: 'Residual settings from uninstalled software.' },
    { name: 'Downloaded Update Installers', risk: 'Safe', size: '2.1 GB', desc: 'Cached Windows update packages.' },
    { name: 'System Memory Dump Files', risk: 'Caution', size: '650 MB', desc: 'Crash dumps; review before purging.' },
  ];

  return (
    <div className="flex flex-col h-full gap-3 text-xs overflow-hidden">
      {/* Risk Distribution Bar */}
      <div className="p-3 bg-[#07152b] border border-[#132c52] rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <div className="font-bold text-white text-xs">Candidate Risk & Safety Classifier</div>
            <div className="text-[10px] text-slate-400">Categorized by system impact and recovery protection</div>
          </div>
        </div>
        <div className="flex items-center gap-2 font-mono text-[10px]">
          <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40">3.3 GB Safe</span>
          <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/40">480 MB Notice</span>
          <span className="px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-500/40">650 MB Caution</span>
        </div>
      </div>

      {/* Candidate List */}
      <div className="flex-1 bg-[#061226] border border-[#132c52] rounded-xl p-3 overflow-y-auto space-y-2">
        {candidates.map((cand, i) => (
          <div key={i} className="p-3 rounded-lg bg-[#08162d] border border-[#142e56] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <input type="checkbox" defaultChecked={cand.risk === 'Safe'} className="rounded bg-[#040a16] border-slate-700 text-cyan-400" />
              <div>
                <div className="font-bold text-white text-xs">{cand.name}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{cand.desc}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 font-mono text-[11px]">
              <span className="text-white font-bold">{cand.size}</span>
              <span
                className={`px-2 py-0.5 rounded text-[9.5px] font-bold ${
                  cand.risk === 'Safe'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                    : cand.risk === 'Notice'
                    ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                    : 'bg-red-950 text-red-300 border border-red-500/40'
                }`}
              >
                {cand.risk}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// =========================================================================
// FAMILY 10: Boot Register
// Startup sequence strip + autorun items + impact badges
// =========================================================================
export const BootRegisterRenderer: React.FC<RendererProps> = ({ descriptor }) => {
  const autoruns = [
    { name: 'Microsoft Edge Update', source: 'HKCU Run', impact: 'Medium', enabled: true },
    { name: 'Discord Update Agent', source: 'HKCU Run', impact: 'High', enabled: true },
    { name: 'OneDrive Sync Client', source: 'Startup Folder', impact: 'High', enabled: true },
    { name: 'KNOuX SmartScan Agent', source: 'Scheduled Task', impact: 'Low', enabled: true },
    { name: 'Adobe Creative Cloud', source: 'HKLM Run', impact: 'High', enabled: false },
  ];

  return (
    <div className="flex flex-col h-full gap-3 text-xs overflow-hidden">
      {/* Boot Timeline Banner */}
      <div className="p-3 bg-[#07162d] border border-[#132c52] rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Rocket className="w-5 h-5 text-purple-400 shrink-0" />
          <div>
            <div className="font-bold text-white text-xs">Windows Startup Sequence Register</div>
            <div className="text-[10px] text-slate-400">Autorun registry keys, scheduled tasks, and startup folder items</div>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded bg-purple-950 text-purple-300 border border-purple-500/40 font-mono text-[10px]">
          5 Autoruns Active
        </span>
      </div>

      {/* Autorun Items */}
      <div className="flex-1 bg-[#061226] border border-[#132c52] rounded-xl p-3 overflow-y-auto space-y-2">
        {autoruns.map((item, i) => (
          <div key={i} className="p-2.5 rounded-lg bg-[#08162d] border border-[#142e56] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <input type="checkbox" defaultChecked={item.enabled} className="rounded bg-[#040a16] border-slate-700 text-purple-400" />
              <div>
                <div className="font-bold text-white text-xs">{item.name}</div>
                <div className="text-[10px] text-slate-400 font-mono">Location: {item.source}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 font-mono text-[10.5px]">
              <span className="text-slate-300">Boot Impact:</span>
              <span
                className={`px-2 py-0.5 rounded font-bold ${
                  item.impact === 'High'
                    ? 'bg-red-950 text-red-300 border border-red-500/40'
                    : item.impact === 'Medium'
                    ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                    : 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                }`}
              >
                {item.impact}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// =========================================================================
// FAMILY 11: Live Pulse Charts
// Gauges + time-series charts (CPU, Memory, Disk, Network)
// =========================================================================
export const LivePulseChartsRenderer: React.FC<RendererProps> = ({ descriptor }) => {
  return (
    <div className="flex flex-col h-full gap-3 text-xs overflow-hidden">
      {/* Top Instruments */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3 bg-[#07152b] border border-[#132c52] rounded-xl flex items-center gap-3">
          <Activity className="w-5 h-5 text-cyan-400 shrink-0" />
          <div>
            <div className="text-[10px] text-slate-400">CPU Usage</div>
            <div className="text-base font-black text-white font-mono">14.2 %</div>
          </div>
        </div>
        <div className="p-3 bg-[#07152b] border border-[#132c52] rounded-xl flex items-center gap-3">
          <Zap className="w-5 h-5 text-purple-400 shrink-0" />
          <div>
            <div className="text-[10px] text-slate-400">RAM Committed</div>
            <div className="text-base font-black text-white font-mono">8.4 / 16 GB</div>
          </div>
        </div>
        <div className="p-3 bg-[#07152b] border border-[#132c52] rounded-xl flex items-center gap-3">
          <HardDrive className="w-5 h-5 text-amber-400 shrink-0" />
          <div>
            <div className="text-[10px] text-slate-400">Disk I/O Rate</div>
            <div className="text-base font-black text-white font-mono">1.2 MB/s</div>
          </div>
        </div>
        <div className="p-3 bg-[#07152b] border border-[#132c52] rounded-xl flex items-center gap-3">
          <TrendingUp className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <div className="text-[10px] text-slate-400">Network Throughput</div>
            <div className="text-base font-black text-white font-mono">340 KB/s</div>
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="flex-1 bg-[#050e1f] border border-[#132c52] rounded-xl p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between pb-2 border-b border-[#0f2444] text-[11px]">
          <span className="font-bold text-white">Live System Telemetry Chart</span>
          <span className="text-cyan-400 font-mono">Interval: 1s Live Sampling</span>
        </div>

        {/* Waveform placeholder graphic */}
        <div className="flex-1 flex items-end gap-1 my-3 px-2 py-4 bg-[#030812] border border-[#0d213d] rounded-lg overflow-hidden">
          {[12, 18, 25, 14, 30, 45, 22, 19, 15, 28, 35, 50, 40, 28, 20, 16, 24, 38, 42, 30, 22, 18, 25].map(
            (val, idx) => (
              <div
                key={idx}
                className="flex-1 bg-gradient-to-t from-blue-600 to-cyan-400 rounded-t transition-all duration-300 hover:opacity-80"
                style={{ height: `${val}%` }}
              />
            )
          )}
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
          <span>60 Seconds History</span>
          <span className="text-emerald-400">● Live Stream Active</span>
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// FAMILY 12: Service Commander Ledger
// Windows SCM Table (Service Name, Display Name, PID, Status, Startup Type)
// =========================================================================
export const ServiceCommanderLedgerRenderer: React.FC<RendererProps> = ({ descriptor }) => {
  const services = [
    { name: 'wuauserv', display: 'Windows Update', pid: '2418', status: 'Running', type: 'Automatic (Delayed)' },
    { name: 'BITS', display: 'Background Intelligent Transfer', pid: '3120', status: 'Running', type: 'Manual' },
    { name: 'Spooler', display: 'Print Spooler', pid: '-', status: 'Stopped', type: 'Automatic' },
    { name: 'WinDefend', display: 'Windows Defender Antivirus', pid: '1042', status: 'Running', type: 'Automatic' },
    { name: 'EventLog', display: 'Windows Event Log', pid: '840', status: 'Running', type: 'Automatic' },
  ];

  return (
    <div className="flex flex-col h-full gap-3 text-xs overflow-hidden">
      {/* SCM Header */}
      <div className="p-3 bg-[#07162d] border border-[#132c52] rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Settings2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <div className="font-bold text-white text-xs">Windows Service Control Manager (SCM) Ledger</div>
            <div className="text-[10px] text-slate-400">View and manage local background system services</div>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-mono text-[10px]">
          232 Services Indexed
        </span>
      </div>

      {/* SCM Table */}
      <div className="flex-1 bg-[#061226] border border-[#132c52] rounded-xl p-3 overflow-y-auto space-y-1.5 font-mono text-[11px]">
        {services.map((svc, i) => (
          <div key={i} className="p-2.5 rounded-lg bg-[#08162d] border border-[#142e56] flex items-center justify-between">
            <div>
              <div className="font-bold text-white text-xs">{svc.display} ({svc.name})</div>
              <div className="text-[10px] text-slate-400">PID: {svc.pid} • Startup: {svc.type}</div>
            </div>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                svc.status === 'Running'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              {svc.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
