/**
 * KNOuX SmartOrganizer — Renderer Families Part 1 (Families 1 to 6)
 * 1. Ledger+Dossier
 * 2. Search Console
 * 3. Identity Dossier
 * 4. Visual Rule Builder
 * 5. Staging + Impact Review
 * 6. File Ledger+Preview
 */

import React, { useState } from 'react';
import {
  Search,
  Filter,
  CheckCircle2,
  ShieldCheck,
  ShieldAlert,
  Sliders,
  Folder,
  FileText,
  File,
  ChevronRight,
  ArrowRight,
  Check,
  X,
  Copy,
  Layers,
  Sparkles,
  Grid,
  List,
  Calendar,
  Zap,
  Info,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { ServiceVisualDescriptor } from '../../lib/service-ui-renderers';

interface RendererProps {
  descriptor: ServiceVisualDescriptor;
  locale?: 'en' | 'ar';
}

// =========================================================================
// FAMILY 1: Ledger+Dossier
// Dense multi-column register + right dossier inspector
// =========================================================================
export const LedgerDossierRenderer: React.FC<RendererProps> = ({ descriptor, locale = 'en' }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedIdx, setSelectedIdx] = useState(0);

  const mockRows = [
    { id: '1', name: 'SystemCore.dll', publisher: 'Microsoft Corporation', size: '14.2 MB', status: 'Verified', date: '2025-04-12' },
    { id: '2', name: 'KNOuXAgent.exe', publisher: 'KNOuX Software Labs', size: '38.6 MB', status: 'Signed', date: '2025-04-18' },
    { id: '3', name: 'Win32ServiceHost.exe', publisher: 'Microsoft Corporation', size: '2.4 MB', status: 'Verified', date: '2025-03-29' },
    { id: '4', name: 'GraphicsDriver.sys', publisher: 'NVIDIA Corp', size: '128.5 MB', status: 'WHQL', date: '2025-04-01' },
    { id: '5', name: 'NetworkStack.dll', publisher: 'Realtek Semiconductor', size: '8.1 MB', status: 'Verified', date: '2025-02-14' },
    { id: '6', name: 'StorageAtlas.exe', publisher: 'KNOuX Software Labs', size: '19.4 MB', status: 'Signed', date: '2025-04-20' },
  ];

  const filtered = mockRows.filter(
    (r) =>
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.publisher.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedItem = filtered[selectedIdx] || mockRows[0];

  return (
    <div className="flex flex-col lg:flex-row h-full gap-3 overflow-hidden text-xs">
      {/* Left Register */}
      <div className="flex-1 flex flex-col bg-[#061226] border border-[#132c52] rounded-xl overflow-hidden">
        {/* Filter bar */}
        <div className="p-2.5 border-b border-[#0f2444] bg-[#040a16] flex items-center justify-between gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search register entries..."
              className="w-full bg-[#081528] border border-[#142e56] rounded-md pl-8 pr-3 py-1 text-slate-200 placeholder-slate-500 outline-none focus:border-cyan-500"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-cyan-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-[#081528] border border-[#142e56] rounded-md px-2 py-1 text-slate-300 outline-none"
            >
              <option value="all">All Categories</option>
              <option value="verified">Verified Only</option>
              <option value="system">System Components</option>
            </select>
          </div>
        </div>

        {/* Table Rows */}
        <div className="flex-1 overflow-y-auto p-1.5 space-y-1">
          {filtered.map((row, idx) => (
            <div
              key={row.id}
              onClick={() => setSelectedIdx(idx)}
              className={`p-2.5 rounded-lg border transition cursor-pointer flex items-center justify-between ${
                selectedIdx === idx
                  ? 'bg-blue-950/70 border-cyan-400 text-white shadow-[0_0_10px_rgba(38,198,255,0.3)]'
                  : 'bg-[#07152b] border-[#132c52] hover:bg-[#0c1f3c] text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
                <div>
                  <div className="font-bold">{row.name}</div>
                  <div className="text-[10px] text-slate-400">{row.publisher}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 font-mono text-[11px]">
                <span className="text-slate-400">{row.size}</span>
                <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700/50 text-[9.5px]">
                  {row.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Dossier Inspector */}
      <div className="w-full lg:w-80 shrink-0 bg-[#050e1f] border border-[#132c52] rounded-xl p-3 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 pb-2 border-b border-[#0f2444] text-cyan-300 font-bold">
            <Info className="w-4 h-4" />
            <span>Target Dossier Inspector</span>
          </div>

          <div className="py-3 space-y-2.5">
            <div className="p-2.5 rounded-lg bg-[#081528] border border-[#142e56]">
              <div className="text-[10px] text-slate-400 uppercase font-mono">Selected Identity</div>
              <div className="text-sm font-bold text-white mt-0.5">{selectedItem.name}</div>
              <div className="text-[11px] text-cyan-400 mt-0.5">{selectedItem.publisher}</div>
            </div>

            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between py-1 border-b border-[#0e223d]">
                <span className="text-slate-400">File Footprint:</span>
                <span className="text-white font-mono">{selectedItem.size}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#0e223d]">
                <span className="text-slate-400">Authenticode Status:</span>
                <span className="text-emerald-400 font-semibold">{selectedItem.status}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#0e223d]">
                <span className="text-slate-400">Record Date:</span>
                <span className="text-slate-300 font-mono">{selectedItem.date}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#0e223d]">
                <span className="text-slate-400">Risk Class:</span>
                <span className="text-cyan-300 uppercase font-mono">{descriptor.riskClass}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-[#0f2444] text-[10px] text-slate-400 flex items-center justify-between">
          <span>{descriptor.signatureVisual}</span>
          <span className="text-emerald-400 font-bold">SAFE PREVIEW</span>
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// FAMILY 2: Search Console
// Query hero bar + debounced facets + result stream
// =========================================================================
export const SearchConsoleRenderer: React.FC<RendererProps> = ({ descriptor }) => {
  const [query, setQuery] = useState('system');
  const [fuzzyMode, setFuzzyMode] = useState(false);

  const results = [
    { title: 'System32 / drivers / etc / hosts', scope: 'Windows System Path', match: '98%' },
    { title: 'KNOuX SmartScan Registry Keys', scope: 'HKLM\\Software\\KNOuX', match: '95%' },
    { title: 'Microsoft Edge App Manifest', scope: 'AppX Manifest Registry', match: '89%' },
    { title: 'Windows Event Log Channel - System', scope: 'EvtLog Channel', match: '84%' },
  ];

  return (
    <div className="flex flex-col h-full gap-3 text-xs overflow-hidden">
      {/* Search Hero */}
      <div className="p-3 bg-gradient-to-r from-[#071836] to-[#050e1f] border border-[#142e56] rounded-xl flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-cyan-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type query to scan across Windows registers, manifests, and indexes..."
            className="w-full bg-[#040a16] border border-[#1d427b] rounded-lg pl-9 pr-4 py-2 text-white font-medium outline-none focus:border-cyan-400 text-xs"
          />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setFuzzyMode(!fuzzyMode)}
            className={`px-3 py-1.5 rounded-lg border text-xs transition font-semibold cursor-pointer ${
              fuzzyMode
                ? 'bg-cyan-950 text-cyan-300 border-cyan-400 shadow-[0_0_8px_#22d3ee]'
                : 'bg-[#081528] text-slate-400 border-[#142e56]'
            }`}
          >
            Fuzzy Match: {fuzzyMode ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* Facet Filters & Results Stream */}
      <div className="flex-1 flex flex-col bg-[#061226] border border-[#132c52] rounded-xl p-3 overflow-hidden">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#0f2444] text-[11px] text-slate-400">
          <span>Search Results for "{query}" — 4 matches found in 0.2ms</span>
          <span className="text-cyan-400 font-mono">Scope: Windows System Registry + File Index</span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {results.map((res, i) => (
            <div
              key={i}
              className="p-3 rounded-lg bg-[#08162d] border border-[#142e56] hover:border-cyan-500/60 transition flex items-center justify-between"
            >
              <div>
                <div className="font-bold text-white text-xs">{res.title}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{res.scope}</div>
              </div>
              <span className="px-2.5 py-1 rounded bg-cyan-950 text-cyan-300 border border-cyan-700/50 font-mono text-[10px]">
                {res.match} match
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// FAMILY 3: Identity Dossier
// Certificate chain + trust badges + provenance
// =========================================================================
export const IdentityDossierRenderer: React.FC<RendererProps> = ({ descriptor }) => {
  const [activeTab, setActiveTab] = useState<'cert' | 'attributes' | 'provenance'>('cert');

  return (
    <div className="flex flex-col h-full gap-3 text-xs overflow-hidden">
      {/* Target Identity Banner */}
      <div className="p-3.5 bg-gradient-to-r from-[#091f42] via-[#06152e] to-[#040a16] border border-[#163866] rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-400 flex items-center justify-center text-white font-black text-base shadow-[0_0_12px_rgba(34,211,238,0.5)] shrink-0">
            K
          </div>
          <div>
            <div className="text-sm font-bold text-white">Target Binary: KNOuXCoreServices.dll</div>
            <div className="text-[11px] text-emerald-400 font-medium">
              Verified Publisher: KNOuX Software Corporation (DigiCert Trusted CA)
            </div>
          </div>
        </div>
        <span className="px-3 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/50 font-mono text-[10px] uppercase tracking-wider font-bold">
          Authenticode Valid
        </span>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#0f2444] pb-2">
        <button
          onClick={() => setActiveTab('cert')}
          className={`px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer ${
            activeTab === 'cert'
              ? 'bg-blue-600 text-white border-cyan-400 shadow'
              : 'bg-[#081528] text-slate-400 border-[#142e56]'
          }`}
        >
          Certificate Chain
        </button>
        <button
          onClick={() => setActiveTab('attributes')}
          className={`px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer ${
            activeTab === 'attributes'
              ? 'bg-blue-600 text-white border-cyan-400 shadow'
              : 'bg-[#081528] text-slate-400 border-[#142e56]'
          }`}
        >
          Binary Attributes
        </button>
        <button
          onClick={() => setActiveTab('provenance')}
          className={`px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer ${
            activeTab === 'provenance'
              ? 'bg-blue-600 text-white border-cyan-400 shadow'
              : 'bg-[#081528] text-slate-400 border-[#142e56]'
          }`}
        >
          Provenance & Web Origin
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 bg-[#061226] border border-[#132c52] rounded-xl p-3.5 overflow-y-auto space-y-3">
        {activeTab === 'cert' && (
          <div className="space-y-2.5">
            <div className="p-2.5 rounded-lg bg-[#08162d] border border-[#142e56] flex items-center justify-between">
              <div>
                <div className="font-bold text-white">Root CA: DigiCert Trusted Root G4</div>
                <div className="text-[10px] text-slate-400">Valid until 2038-01-15 • SHA-256 Fingerprint</div>
              </div>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>

            <div className="ml-4 p-2.5 rounded-lg bg-[#08162d] border border-[#142e56] flex items-center justify-between">
              <div>
                <div className="font-bold text-white">Intermediate: DigiCert Code Signing 2025 CA</div>
                <div className="text-[10px] text-slate-400">Issued to KNOuX Software Corp</div>
              </div>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>

            <div className="ml-8 p-2.5 rounded-lg bg-blue-950/60 border border-cyan-500/50 flex items-center justify-between">
              <div>
                <div className="font-bold text-cyan-200">End Entity: KNOuX Official Release Binary</div>
                <div className="text-[10px] text-slate-300 font-mono">Thumbprint: 94A1F854D481180F3965EBE1</div>
              </div>
              <ShieldCheck className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
        )}

        {activeTab === 'attributes' && (
          <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
            <div className="p-2 rounded bg-[#081528] border border-[#142e56]">
              <span className="text-slate-400 block">File Version:</span>
              <span className="text-white font-bold">2.4.1.2025</span>
            </div>
            <div className="p-2 rounded bg-[#081528] border border-[#142e56]">
              <span className="text-slate-400 block">Architecture:</span>
              <span className="text-white font-bold">x64 (64-bit Windows)</span>
            </div>
            <div className="p-2 rounded bg-[#081528] border border-[#142e56]">
              <span className="text-slate-400 block">SHA-256 Digest:</span>
              <span className="text-cyan-300 truncate block">e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855</span>
            </div>
            <div className="p-2 rounded bg-[#081528] border border-[#142e56]">
              <span className="text-slate-400 block">Subsystem:</span>
              <span className="text-white font-bold">Windows GUI (0x0002)</span>
            </div>
          </div>
        )}

        {activeTab === 'provenance' && (
          <div className="space-y-2 text-xs">
            <div className="p-2.5 rounded bg-[#081528] border border-[#142e56]">
              <div className="font-bold text-slate-300">Zone Identifier (Mark of the Web):</div>
              <div className="text-[11px] text-emerald-400 font-mono mt-0.5">ZoneId=3 (Internet / Trusted Download)</div>
            </div>
            <div className="p-2.5 rounded bg-[#081528] border border-[#142e56]">
              <div className="font-bold text-slate-300">Download Source URL:</div>
              <div className="text-[11px] text-cyan-300 font-mono mt-0.5 truncate">https://releases.knoux.org/v2.4/KNOuXCoreServices.dll</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// =========================================================================
// FAMILY 4: Visual Rule Builder
// Source lanes -> category rule lanes -> destination mapping
// =========================================================================
export const VisualRuleBuilderRenderer: React.FC<RendererProps> = ({ descriptor }) => {
  const [rules, setRules] = useState([
    { id: 1, pattern: '*.pdf, *.docx', category: 'Documents', target: 'C:\\Users\\Alex\\Documents\\Organized' },
    { id: 2, pattern: '*.jpg, *.png, *.svg', category: 'Images & Visuals', target: 'C:\\Users\\Alex\\Pictures\\Organized' },
    { id: 3, pattern: '*.zip, *.7z, *.tar', category: 'Archives', target: 'C:\\Users\\Alex\\Downloads\\Archives' },
  ]);

  return (
    <div className="flex flex-col h-full gap-3 text-xs overflow-hidden">
      {/* Header Info */}
      <div className="p-3 bg-[#07162d] border border-[#132c52] rounded-xl flex items-center justify-between">
        <div>
          <div className="font-bold text-white text-xs">Visual Rule Builder & Automation Canvas</div>
          <div className="text-[10px] text-slate-400">Map file extensions, naming patterns, and attributes to target lanes</div>
        </div>
        <button className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold cursor-pointer text-xs">
          + Add New Rule Lane
        </button>
      </div>

      {/* Lanes Canvas */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3 overflow-y-auto">
        {/* Source Column */}
        <div className="bg-[#050e1f] border border-[#132c52] rounded-xl p-3 space-y-2">
          <div className="font-bold text-cyan-300 pb-2 border-b border-[#0f2444] uppercase tracking-wider text-[10px]">
            1. Source Scope
          </div>
          <div className="p-2 rounded bg-[#081528] border border-[#142e56] text-slate-200">
            <div className="font-semibold">Target Path:</div>
            <div className="text-[10px] text-cyan-400 font-mono truncate">C:\Users\Alex\Downloads</div>
          </div>
          <div className="text-[10px] text-slate-400">Monitored items: 142 unorganized files</div>
        </div>

        {/* Rule Category Lanes */}
        <div className="bg-[#050e1f] border border-[#132c52] rounded-xl p-3 space-y-2">
          <div className="font-bold text-purple-300 pb-2 border-b border-[#0f2444] uppercase tracking-wider text-[10px]">
            2. Category Rule Lanes
          </div>
          {rules.map((rule) => (
            <div key={rule.id} className="p-2.5 rounded bg-[#08162d] border border-[#142e56] space-y-1">
              <div className="font-bold text-white text-xs flex justify-between">
                <span>{rule.category}</span>
                <span className="text-[10px] text-purple-400 font-mono">{rule.pattern}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Destination Mapping */}
        <div className="bg-[#050e1f] border border-[#132c52] rounded-xl p-3 space-y-2">
          <div className="font-bold text-emerald-300 pb-2 border-b border-[#0f2444] uppercase tracking-wider text-[10px]">
            3. Proposed Destination
          </div>
          {rules.map((rule) => (
            <div key={rule.id} className="p-2.5 rounded bg-[#08162d] border border-[#142e56]">
              <div className="text-[10px] text-slate-400">Destination Folder:</div>
              <div className="text-[10.5px] font-mono text-emerald-300 truncate">{rule.target}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// FAMILY 5: Staging + Impact Review
// Staging basket + before/after diff + dependency check
// =========================================================================
export const StagingImpactReviewRenderer: React.FC<RendererProps> = ({ descriptor }) => {
  const [confirmedRisk, setConfirmedRisk] = useState(false);

  return (
    <div className="flex flex-col h-full gap-3 text-xs overflow-hidden">
      {/* Staging Header */}
      <div className="p-3.5 bg-gradient-to-r from-amber-950/40 via-[#07152b] to-[#040a16] border border-amber-500/40 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
          <div>
            <div className="font-bold text-white text-xs">Staging & Impact Risk Review Dock</div>
            <div className="text-[10px] text-amber-300">
              3 items staged for modification. Review dependencies and acknowledge risk before staging proposal.
            </div>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded bg-amber-950 text-amber-200 border border-amber-500/50 font-mono text-[10px] uppercase font-bold">
          Staged Change
        </span>
      </div>

      {/* Diff & Impact Grid */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3 overflow-hidden">
        {/* Before / After Diff */}
        <div className="bg-[#061226] border border-[#132c52] rounded-xl p-3 flex flex-col">
          <div className="font-bold text-cyan-300 pb-2 border-b border-[#0f2444] text-xs">
            Before / Proposed State Diff
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 mt-2">
            <div className="p-2.5 rounded bg-[#081528] border border-[#142e56]">
              <div className="text-[10px] text-red-400 line-through">CURRENT: Startup State = Enabled (HKCU Run)</div>
              <div className="text-[10px] text-emerald-400 font-bold mt-1">PROPOSED: Startup State = Disabled (Vault Guard)</div>
            </div>
            <div className="p-2.5 rounded bg-[#081528] border border-[#142e56]">
              <div className="text-[10px] text-red-400 line-through">CURRENT: Temp Cache = 1.8 GB on C:\Drive</div>
              <div className="text-[10px] text-emerald-400 font-bold mt-1">PROPOSED: Quarantined to Safety Vault</div>
            </div>
          </div>
        </div>

        {/* Prerequisites & Conflict Check */}
        <div className="bg-[#061226] border border-[#132c52] rounded-xl p-3 flex flex-col justify-between">
          <div>
            <div className="font-bold text-purple-300 pb-2 border-b border-[#0f2444] text-xs">
              Prerequisites & System Safety Check
            </div>

            <div className="space-y-2 mt-2">
              <div className="flex items-center justify-between p-2 rounded bg-[#081528] border border-[#142e56]">
                <span className="text-slate-300">System Restore Point Creation:</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Ready
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-[#081528] border border-[#142e56]">
                <span className="text-slate-300">Administrator Privileges:</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Verified
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-[#081528] border border-[#142e56]">
                <span className="text-slate-300">System File Conflict Risk:</span>
                <span className="text-cyan-300 font-bold">Zero Conflicts Detected</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#0f2444] space-y-2">
            <label className="flex items-center gap-2 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={confirmedRisk}
                onChange={(e) => setConfirmedRisk(e.target.checked)}
                className="rounded bg-[#081528] border-slate-700 text-cyan-400"
              />
              <span>I acknowledge the staged proposal requirements and risk limits</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// FAMILY 6: File Ledger+Preview
// Dense file list + document / image thumbnail preview
// =========================================================================
export const FileLedgerPreviewRenderer: React.FC<RendererProps> = ({ descriptor }) => {
  const [selectedIdx, setSelectedIdx] = useState(0);

  const files = [
    { name: 'FinancialReport_2025.pdf', size: '4.2 MB', type: 'PDF Document', date: '2025-04-10' },
    { name: 'SystemArchitecture_Diagram.svg', size: '890 KB', type: 'Vector Image', date: '2025-04-14' },
    { name: 'KNOuX_Backup_Archive.zip', size: '142.8 MB', type: 'Zip Archive', date: '2025-04-18' },
    { name: 'DatabaseSchema_V2.sql', size: '1.1 MB', type: 'SQL Script', date: '2025-03-22' },
  ];

  const current = files[selectedIdx];

  return (
    <div className="flex flex-col lg:flex-row h-full gap-3 text-xs overflow-hidden">
      {/* File Ledger */}
      <div className="flex-1 bg-[#061226] border border-[#132c52] rounded-xl p-3 flex flex-col overflow-hidden">
        <div className="font-bold text-white text-xs pb-2 border-b border-[#0f2444] flex justify-between items-center">
          <span>File Ledger Register</span>
          <span className="text-cyan-400 text-[10px] font-mono">4 items</span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-1.5 mt-2">
          {files.map((file, i) => (
            <div
              key={i}
              onClick={() => setSelectedIdx(i)}
              className={`p-2.5 rounded-lg border cursor-pointer transition flex items-center justify-between ${
                selectedIdx === i
                  ? 'bg-blue-950/70 border-cyan-400 text-white'
                  : 'bg-[#08162d] border-[#142e56] text-slate-300 hover:bg-[#0c1f3c]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <File className="w-4 h-4 text-cyan-400 shrink-0" />
                <div>
                  <div className="font-bold">{file.name}</div>
                  <div className="text-[10px] text-slate-400">{file.type}</div>
                </div>
              </div>
              <div className="text-right font-mono text-[11px]">
                <div>{file.size}</div>
                <div className="text-[9.5px] text-slate-400">{file.date}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Selected File Preview Box */}
      <div className="w-full lg:w-80 bg-[#050e1f] border border-[#132c52] rounded-xl p-3 flex flex-col justify-between shrink-0">
        <div>
          <div className="font-bold text-cyan-300 pb-2 border-b border-[#0f2444] text-xs">
            File Document Preview
          </div>

          <div className="py-3 space-y-3">
            <div className="w-full h-32 rounded-lg bg-[#081528] border border-[#142e56] flex flex-col items-center justify-center p-3 text-center">
              <FileText className="w-10 h-10 text-cyan-400 mb-2 animate-pulse" />
              <div className="font-bold text-white text-xs truncate max-w-full">{current.name}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">{current.type} • {current.size}</div>
            </div>

            <div className="space-y-1 font-mono text-[10.5px]">
              <div className="flex justify-between py-1 border-b border-[#0e223d]">
                <span className="text-slate-400">File Type:</span>
                <span className="text-white">{current.type}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#0e223d]">
                <span className="text-slate-400">Last Modified:</span>
                <span className="text-white">{current.date}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-[#0f2444] text-[10px] text-slate-400 flex justify-between">
          <span>{descriptor.signatureVisual}</span>
          <span className="text-emerald-400 font-bold">Safe File Preview</span>
        </div>
      </div>
    </div>
  );
};
