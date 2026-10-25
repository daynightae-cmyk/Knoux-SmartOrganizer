/**
 * KNOuX SmartOrganizer — Renderer Families Part 3 (Families 13 to 18)
 * 13. Service Dependency Graph
 * 14. Safe Diagnostics Console
 * 15. Repair Journal
 * 16. Network Topology
 * 17. Device Atlas
 * 18. Schedule Node Flow
 */

import React, { useState } from 'react';
import {
  GitBranch,
  Terminal,
  History,
  Globe,
  Cpu,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Zap,
  ShieldCheck,
  Wifi,
  HardDrive,
  Monitor,
  Volume2,
  Battery,
  Clock,
  ArrowRight,
  Play,
} from 'lucide-react';
import { ServiceVisualDescriptor } from '../../lib/service-ui-renderers';

interface RendererProps {
  descriptor: ServiceVisualDescriptor;
  locale?: 'en' | 'ar';
}

// =========================================================================
// FAMILY 13: Service Dependency Graph
// Directed dependency graph + node inspector
// =========================================================================
export const ServiceDependencyGraphRenderer: React.FC<RendererProps> = ({ descriptor }) => {
  const [selectedNode, setSelectedNode] = useState('RPC Endpoint Mapper');

  return (
    <div className="flex flex-col h-full gap-3 text-xs overflow-hidden">
      {/* Node Graph Header */}
      <div className="p-3 bg-[#07162d] border border-[#132c52] rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <GitBranch className="w-5 h-5 text-cyan-400 shrink-0" />
          <div>
            <div className="font-bold text-white text-xs">Service Dependency Network Map</div>
            <div className="text-[10px] text-slate-400">Interactive directional graph showing upstream and downstream services</div>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40 font-mono text-[10px]">
          12 Connected Services
        </span>
      </div>

      {/* Graph Visual Canvas */}
      <div className="flex-1 bg-[#040a16] border border-[#132c52] rounded-xl p-4 flex flex-col items-center justify-center relative overflow-hidden">
        {/* Nodes */}
        <div className="flex flex-wrap items-center justify-center gap-6 z-10">
          <div
            onClick={() => setSelectedNode('DCOM Server Process Launcher')}
            className={`p-3 rounded-xl border cursor-pointer transition ${
              selectedNode === 'DCOM Server Process Launcher'
                ? 'bg-blue-900 border-cyan-400 shadow-[0_0_12px_#22d3ee]'
                : 'bg-[#08162d] border-[#142e56] hover:border-cyan-500/60'
            }`}
          >
            <div className="font-bold text-white">DCOM Server Process Launcher</div>
            <div className="text-[10px] text-slate-400">Core Prerequisite</div>
          </div>

          <ArrowRight className="w-5 h-5 text-cyan-400 animate-pulse" />

          <div
            onClick={() => setSelectedNode('RPC Endpoint Mapper')}
            className={`p-3 rounded-xl border cursor-pointer transition ${
              selectedNode === 'RPC Endpoint Mapper'
                ? 'bg-blue-900 border-cyan-400 shadow-[0_0_12px_#22d3ee]'
                : 'bg-[#08162d] border-[#142e56] hover:border-cyan-500/60'
            }`}
          >
            <div className="font-bold text-white">RPC Endpoint Mapper (RpcSs)</div>
            <div className="text-[10px] text-cyan-300">Selected Node</div>
          </div>

          <ArrowRight className="w-5 h-5 text-cyan-400 animate-pulse" />

          <div
            onClick={() => setSelectedNode('Windows Management Instrumentation')}
            className={`p-3 rounded-xl border cursor-pointer transition ${
              selectedNode === 'Windows Management Instrumentation'
                ? 'bg-blue-900 border-cyan-400 shadow-[0_0_12px_#22d3ee]'
                : 'bg-[#08162d] border-[#142e56] hover:border-cyan-500/60'
            }`}
          >
            <div className="font-bold text-white">WMI Service (Winmgmt)</div>
            <div className="text-[10px] text-slate-400">Dependent Service</div>
          </div>
        </div>

        <div className="mt-6 p-2 rounded bg-[#081528] border border-[#142e56] text-slate-300 font-mono text-[10.5px]">
          Selected: <span className="text-cyan-300 font-bold">{selectedNode}</span> — Status: <span className="text-emerald-400">Running</span>
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// FAMILY 14: Safe Diagnostics Console
// Multi-step diagnostic check + terminal transcript preview
// =========================================================================
export const SafeDiagnosticsConsoleRenderer: React.FC<RendererProps> = ({ descriptor }) => {
  const [copied, setCopied] = useState(false);

  const commandText = 'DISM.exe /Online /Cleanup-Image /ScanHealth';

  const handleCopy = () => {
    navigator.clipboard.writeText(commandText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full gap-3 text-xs overflow-hidden">
      {/* Console Header */}
      <div className="p-3 bg-[#07162d] border border-[#132c52] rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Terminal className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <div className="font-bold text-white text-xs">Safe Diagnostics Terminal Console</div>
            <div className="text-[10px] text-slate-400">Read-only diagnostic step execution and command preview</div>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-mono text-[10px]">
          Read-Only Mode
        </span>
      </div>

      {/* Embedded Terminal Box */}
      <div className="flex-1 bg-[#030812] border border-[#0d213d] rounded-xl p-3 flex flex-col font-mono text-[11px] overflow-hidden">
        <div className="flex items-center justify-between pb-2 border-b border-[#0f2444] text-[10px] text-slate-400">
          <span>Command Draft: {commandText}</span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#081528] text-cyan-300 border border-[#142e56] hover:bg-[#0c1f3c] cursor-pointer"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Copied' : 'Copy Command'}</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1 text-slate-300">
          <div className="text-cyan-400">&gt; Executing Diagnostic Check: {descriptor.labelEn}...</div>
          <div className="text-slate-400">[Step 1/4] Checking Administrator Privileges... [PASS]</div>
          <div className="text-slate-400">[Step 2/4] Verifying Windows Component Store servicing state... [PASS]</div>
          <div className="text-slate-400">[Step 3/4] Scanning System File Manifests... [PASS]</div>
          <div className="text-emerald-400 font-bold">[Step 4/4] Diagnostic Complete: Zero Corruption Detected.</div>
          <div className="text-slate-500 text-[10px] mt-2">
            * Note: Safe Preview Mode active. No system files were modified during this diagnostic scan.
          </div>
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// FAMILY 15: Repair Journal
// Event-and-history timeline of repair actions + audit trail
// =========================================================================
export const RepairJournalRenderer: React.FC<RendererProps> = ({ descriptor }) => {
  const history = [
    { date: '2025-04-20 14:32', tool: 'DISM ScanHealth', status: 'Completed', result: 'No corruption detected' },
    { date: '2025-04-18 09:15', tool: 'SFC VerifyOnly', status: 'Completed', result: '378 system files verified' },
    { date: '2025-04-12 18:40', tool: 'DNS Resolver Flush', status: 'Completed', result: 'DNS cache cleared' },
  ];

  return (
    <div className="flex flex-col h-full gap-3 text-xs overflow-hidden">
      {/* Journal Banner */}
      <div className="p-3 bg-[#07162d] border border-[#132c52] rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <History className="w-5 h-5 text-cyan-400 shrink-0" />
          <div>
            <div className="font-bold text-white text-xs">System Repair & Action Audit Journal</div>
            <div className="text-[10px] text-slate-400">Chronological history of diagnostics, repairs, and undo checkpoints</div>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40 font-mono text-[10px]">
          3 Events Recorded
        </span>
      </div>

      {/* History List */}
      <div className="flex-1 bg-[#061226] border border-[#132c52] rounded-xl p-3 overflow-y-auto space-y-2 font-mono text-[11px]">
        {history.map((item, i) => (
          <div key={i} className="p-3 rounded-lg bg-[#08162d] border border-[#142e56] flex items-center justify-between">
            <div>
              <div className="font-bold text-white text-xs">{item.tool}</div>
              <div className="text-[10px] text-slate-400">{item.result}</div>
            </div>
            <div className="text-right">
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-[9.5px]">
                {item.status}
              </span>
              <div className="text-[9.5px] text-slate-400 mt-1">{item.date}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// =========================================================================
// FAMILY 16: Network Topology
// Node-and-edge network map showing adapters, local nodes, sockets
// =========================================================================
export const NetworkTopologyRenderer: React.FC<RendererProps> = ({ descriptor }) => {
  return (
    <div className="flex flex-col h-full gap-3 text-xs overflow-hidden">
      {/* Network Topology Banner */}
      <div className="p-3 bg-[#07162d] border border-[#132c52] rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Globe className="w-5 h-5 text-cyan-400 shrink-0" />
          <div>
            <div className="font-bold text-white text-xs">LAN Network Topology & Socket Map</div>
            <div className="text-[10px] text-slate-400">Observed routers, local nodes, and active network interfaces</div>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40 font-mono text-[10px]">
          4 Active Nodes
        </span>
      </div>

      {/* Network Topology Canvas */}
      <div className="flex-1 bg-[#040a16] border border-[#132c52] rounded-xl p-4 flex flex-col items-center justify-center space-y-4">
        <div className="p-3 rounded-xl bg-blue-950 border border-cyan-400 text-center shadow-[0_0_12px_#22d3ee]">
          <div className="font-bold text-white">Default Gateway (Router)</div>
          <div className="text-[10px] text-cyan-300 font-mono">192.168.1.1 (MAC: 00-11-22-33-44-55)</div>
        </div>

        <div className="w-0.5 h-6 bg-cyan-400 animate-pulse" />

        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-[#08162d] border border-[#142e56] text-center">
            <div className="font-bold text-white">Local Host (KNOuX Workstation)</div>
            <div className="text-[10px] text-slate-400 font-mono">192.168.1.105 (Ethernet 10G)</div>
          </div>

          <div className="p-3 rounded-xl bg-[#08162d] border border-[#142e56] text-center">
            <div className="font-bold text-white">DNS Resolver Target</div>
            <div className="text-[10px] text-slate-400 font-mono">1.1.1.1 (Cloudflare DNS)</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// FAMILY 17: Device Atlas
// Hardware rack (CPU, GPU, RAM, Storage, Battery, USB)
// =========================================================================
export const DeviceAtlasRenderer: React.FC<RendererProps> = ({ descriptor }) => {
  return (
    <div className="flex flex-col h-full gap-3 text-xs overflow-hidden">
      {/* Hardware Rack Banner */}
      <div className="p-3 bg-[#07162d] border border-[#132c52] rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Cpu className="w-5 h-5 text-cyan-400 shrink-0" />
          <div>
            <div className="font-bold text-white text-xs">Device Hardware Atlas & Sensor Grid</div>
            <div className="text-[10px] text-slate-400">Detailed component breakdown for processor, graphics, memory, and sensors</div>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40 font-mono text-[10px]">
          Hardware Verified
        </span>
      </div>

      {/* Grid Rack */}
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 overflow-y-auto p-1">
        <div className="p-3 rounded-xl bg-[#061226] border border-[#132c52]">
          <div className="font-bold text-white flex items-center gap-2 mb-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span>Processor (CPU)</span>
          </div>
          <div className="space-y-1 font-mono text-[10.5px]">
            <div className="text-slate-300 font-bold">13th Gen Intel(R) Core(TM) i7-13700K</div>
            <div className="text-slate-400">16 Cores (8P + 8E) • 24 Threads • 3.40 GHz</div>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-[#061226] border border-[#132c52]">
          <div className="font-bold text-white flex items-center gap-2 mb-2">
            <Monitor className="w-4 h-4 text-purple-400" />
            <span>Graphics (GPU)</span>
          </div>
          <div className="space-y-1 font-mono text-[10.5px]">
            <div className="text-slate-300 font-bold">NVIDIA GeForce RTX 4080</div>
            <div className="text-slate-400">16 GB GDDR6X VRAM • Driver 551.86</div>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-[#061226] border border-[#132c52]">
          <div className="font-bold text-white flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-emerald-400" />
            <span>Memory (RAM)</span>
          </div>
          <div className="space-y-1 font-mono text-[10.5px]">
            <div className="text-slate-300 font-bold">32.0 GB DDR5 RAM</div>
            <div className="text-slate-400">2 x 16 GB DIMM • 6000 MHz Dual-Channel</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// FAMILY 18: Schedule Node Flow
// Workflow canvas (Trigger -> Condition -> Action -> Notification)
// =========================================================================
export const ScheduleNodeFlowRenderer: React.FC<RendererProps> = ({ descriptor }) => {
  return (
    <div className="flex flex-col h-full gap-3 text-xs overflow-hidden">
      {/* Workflow Header */}
      <div className="p-3 bg-[#07162d] border border-[#132c52] rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-blue-400 shrink-0" />
          <div>
            <div className="font-bold text-white text-xs">Automated Schedule & Node Flow Canvas</div>
            <div className="text-[10px] text-slate-400">Visual automation node pipeline with schedule triggers and conditions</div>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded bg-blue-950 text-blue-300 border border-blue-500/40 font-mono text-[10px]">
          Draft Active
        </span>
      </div>

      {/* Node Flow Canvas */}
      <div className="flex-1 bg-[#040a16] border border-[#132c52] rounded-xl p-4 flex items-center justify-center gap-3 overflow-x-auto">
        {/* Node 1: Trigger */}
        <div className="p-3 rounded-xl bg-[#08162d] border border-blue-500/50 text-center min-w-[140px]">
          <div className="text-[10px] text-blue-400 font-mono uppercase font-bold">1. Trigger</div>
          <div className="font-bold text-white mt-1">Daily Cadence</div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">Every day at 03:00 AM</div>
        </div>

        <ArrowRight className="w-4 h-4 text-slate-500 shrink-0" />

        {/* Node 2: Safety Gate */}
        <div className="p-3 rounded-xl bg-[#08162d] border border-purple-500/50 text-center min-w-[140px]">
          <div className="text-[10px] text-purple-400 font-mono uppercase font-bold">2. Safety Gate</div>
          <div className="font-bold text-white mt-1">Quiet Hours Check</div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">No user activity gate</div>
        </div>

        <ArrowRight className="w-4 h-4 text-slate-500 shrink-0" />

        {/* Node 3: Action */}
        <div className="p-3 rounded-xl bg-[#08162d] border border-emerald-500/50 text-center min-w-[140px]">
          <div className="text-[10px] text-emerald-400 font-mono uppercase font-bold">3. Action</div>
          <div className="font-bold text-white mt-1">Run Smart Scan</div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">KNOuX Diagnostic Suite</div>
        </div>

        <ArrowRight className="w-4 h-4 text-slate-500 shrink-0" />

        {/* Node 4: Report */}
        <div className="p-3 rounded-xl bg-[#08162d] border border-cyan-500/50 text-center min-w-[140px]">
          <div className="text-[10px] text-cyan-400 font-mono uppercase font-bold">4. Report</div>
          <div className="font-bold text-white mt-1">Store Audit Log</div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">Save summary PDF</div>
        </div>
      </div>
    </div>
  );
};
