/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  HardDrive,
  Database,
  PieChart,
  AlertTriangle,
  Server,
  Folder,
  FileCode,
  FileArchive,
  Film,
  Music,
  Camera,
  Search,
  Settings,
  HelpCircle,
  Minus,
  Square,
  X,
  ChevronRight,
  MoreVertical,
  Plus,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  LayoutGrid,
  Scale,
  Copy,
  FolderTree,
  Shapes,
  ScanLine,
  Boxes,
  Activity,
  Sparkles,
  LineChart,
  Usb,
  Download,
  Languages,
  Home,
  CheckCircle2,
  Disc,
  Disc3,
  Layers,
  BarChart3,
  RotateCcw
} from 'lucide-react';

import {
  INITIAL_STORAGE_METRICS,
  INITIAL_VOLUMES,
  INITIAL_TREEMAP_DATA,
  INITIAL_LARGEST_ITEMS,
  STORAGE_SERVICES_CATALOG,
  VolumeItem,
  TreemapNode,
  LargestFileItem
} from '../lib/storage-inventory';
import { StorageWorkspaces } from '../components/storage/StorageWorkspaces';
import { useNavigation } from '../context/NavigationContext';
import { KNOuXTitleBar, KNOuXSidebar } from '../components/shell/KNOuXShellComponents';
import '../storage.css';

interface StoragePageProps {
  onNavigateSection?: (section: string) => void;
}

export function StoragePage({ onNavigateSection }: StoragePageProps) {
  const { navigateTo, isActive, isArabic, toggleLocale } = useNavigation();
  // State
  const [selectedVolumeId, setSelectedVolumeId] = useState<string>('vol-c');
  const [activeTab, setActiveTab] = useState<'treemap' | 'large' | 'types' | 'age' | 'folders'>('treemap');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeServiceModal, setActiveServiceModal] = useState<string | null>(null);
  const [treemapZoomNode, setTreemapZoomNode] = useState<string | null>(null);
  const [selectedTreemapItem, setSelectedTreemapItem] = useState<string>('Windows (93.6 GB)');

  const selectedVolume = INITIAL_VOLUMES.find(v => v.id === selectedVolumeId) || INITIAL_VOLUMES[0];

  return (
    <div
      dir={isArabic ? 'rtl' : 'ltr'}
      className="storage-viewport bg-[#050e1f] text-slate-100 flex flex-col h-screen select-none relative overflow-hidden font-sans"
    >
      {/* 1. Windows Chrome / Top Navigation */}
      <KNOuXTitleBar
        sectionName={isArabic ? 'أطلس التخزين' : 'Storage'}
        sectionSubtitle={isArabic ? 'أطلس الأحجام والملفات' : 'The Volume Atlas'}
        onNavigateHome={() => (onNavigateSection ? onNavigateSection('home') : navigateTo('home'))}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder={isArabic ? 'البحث عن مجلدات، ملفات، أو وحدات تخزين...' : 'Search folders, files, or volumes... (Ctrl+K)'}
        isArabic={isArabic}
        onToggleArabic={toggleLocale}
      />

      {/* Main Body Shell: Sidebar + Content Canvas */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Cosmic horizon background */}
        <div className="storage-hero-horizon" />

        {/* 2. Sidebar Navigation (Left) */}
        <KNOuXSidebar
          activeSection="storage"
          onNavigate={(sec) => (onNavigateSection ? onNavigateSection(sec) : navigateTo(sec))}
          isArabic={isArabic}
        />

        {/* 3. Main Scrollable Canvas (Hero + Top Strip + Volume Bays + Analysis + Inspector + Services) */}
        <main className="flex-1 overflow-y-auto storage-scrollbar p-5 space-y-4">
          {/* Hero Section */}
          <div className="flex items-start justify-between relative z-10 pb-1">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
                <span>{isArabic ? 'أطلس التخزين والمساحة' : 'The Volume Atlas'}</span>
              </h1>
              <p className="text-xs text-slate-300 mt-0.5">
                {isArabic ? 'شاهد أين تذهب كل بايت قابلة للقياس.' : 'See where every measurable byte goes.'}
              </p>
            </div>

            {/* Breadcrumb / Phase Indicators on top right */}
            <div className="flex items-center gap-4 text-[11px] font-mono tracking-widest text-slate-400 uppercase">
              <span className="hover:text-slate-200 cursor-pointer">{isArabic ? 'استكشاف' : 'EXPLORE'}</span>
              <span className="text-slate-600">/</span>
              <span className="hover:text-slate-200 cursor-pointer">{isArabic ? 'قياس' : 'MEASURE'}</span>
              <span className="text-slate-600">/</span>
              <span className="hover:text-slate-200 cursor-pointer">{isArabic ? 'فهم' : 'UNDERSTAND'}</span>
              <span className="text-slate-600">/</span>
              <span className="text-cyan-400 font-bold border-b border-cyan-400 pb-0.5 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block animate-pulse" />
                {isArabic ? 'استعادة' : 'RECLAIM'}
              </span>
            </div>
          </div>

          {/* 4. Top Measurement Strip (5 Cards) */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {/* 1. Connected Volumes */}
            <div className="p-3.5 rounded-xl bg-[#091838]/85 border border-slate-700/60 flex items-center gap-3 shadow-lg shadow-black/20">
              <div className="p-2.5 rounded-xl bg-cyan-950/70 border border-cyan-500/40 text-cyan-300">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xl font-extrabold font-mono text-white leading-none">3</div>
                <div className="text-[11px] text-slate-400 mt-1 font-medium">Connected Volumes</div>
              </div>
            </div>

            {/* 2. Measured Capacity */}
            <div className="p-3.5 rounded-xl bg-[#091838]/85 border border-slate-700/60 flex items-center gap-3 shadow-lg shadow-black/20">
              <div className="p-2.5 rounded-xl bg-blue-950/70 border border-blue-500/40 text-blue-300">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xl font-extrabold font-mono text-white leading-none">3.72 TB</div>
                <div className="text-[11px] text-slate-400 mt-1 font-medium">Measured Capacity</div>
              </div>
            </div>

            {/* 3. Available Space */}
            <div className="p-3.5 rounded-xl bg-[#091838]/85 border border-slate-700/60 flex items-center gap-3 shadow-lg shadow-black/20">
              <div className="p-2.5 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-400">
                <PieChart className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xl font-extrabold font-mono text-white leading-none">1.28 TB</div>
                <div className="text-[11px] text-slate-400 mt-1 font-medium">Available Space</div>
              </div>
            </div>

            {/* 4. Low-Space Volumes */}
            <div className="p-3.5 rounded-xl bg-[#091838]/85 border border-rose-500/40 flex items-center gap-3 shadow-lg shadow-rose-950/20">
              <div className="p-2.5 rounded-xl bg-rose-950/70 border border-rose-500/50 text-rose-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xl font-extrabold font-mono text-rose-300 leading-none">1</div>
                <div className="text-[11px] text-rose-300/80 mt-1 font-medium">Low-Space Volumes</div>
              </div>
            </div>

            {/* 5. Physical Drives */}
            <div className="p-3.5 rounded-xl bg-[#091838]/85 border border-slate-700/60 flex items-center gap-3 shadow-lg shadow-black/20">
              <div className="p-2.5 rounded-xl bg-purple-950/70 border border-purple-500/40 text-purple-300">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xl font-extrabold font-mono text-white leading-none">2</div>
                <div className="text-[11px] text-slate-400 mt-1 font-medium">Physical Drives</div>
              </div>
            </div>
          </div>

          {/* 5. Main Volume Bays (3 Columns) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {INITIAL_VOLUMES.map((vol) => {
              const isSelected = vol.id === selectedVolumeId;
              return (
                <div
                  key={vol.id}
                  onClick={() => setSelectedVolumeId(vol.id)}
                  className={`volume-bay p-4 rounded-2xl cursor-pointer relative transition-all ${
                    isSelected ? 'volume-bay-selected' : ''
                  }`}
                >
                  {/* Top line: Drive Badge, Label, and Free space indicator */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-[#0e1d3d] border border-cyan-500/30 text-cyan-300">
                        <HardDrive className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-lg font-bold font-mono text-white">{vol.letter}</span>
                          <span className="text-xs font-semibold text-slate-300">{vol.name}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">{vol.filesystem}</div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-extrabold font-mono text-white">
                        {vol.freeDisplay} <span className="text-xs text-slate-400 font-normal">free</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">of {vol.totalDisplay}</div>
                    </div>
                  </div>

                  {/* Meter Bar */}
                  <div className="mt-3.5 space-y-1.5">
                    <div className="w-full bg-[#050f24] rounded-full h-2.5 overflow-hidden border border-slate-700/60 p-[1px]">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          vol.isLowSpace
                            ? 'bg-gradient-to-r from-blue-500 via-cyan-400 to-rose-500'
                            : 'bg-gradient-to-r from-blue-600 to-cyan-400'
                        }`}
                        style={{ width: `${vol.usedPercent}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full inline-block ${vol.isLowSpace ? 'bg-rose-400' : 'bg-cyan-400'}`} />
                        Used {vol.usedDisplay} ({vol.usedPercent}%)
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                        Free {vol.freeDisplay} ({vol.freePercent}%)
                      </span>
                    </div>
                  </div>

                  {/* Actions in Drive Card */}
                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveServiceModal('storage-treemap');
                      }}
                      className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 ${
                        isSelected
                          ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-900/40'
                          : 'bg-[#091c3d] hover:bg-slate-800 text-slate-200 border border-slate-700'
                      }`}
                    >
                      <span>{isArabic ? 'تصفح هذا القرص' : 'Walk This Volume'}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveServiceModal('storage-top-folders');
                      }}
                      className="py-1.5 px-3 rounded-lg text-xs font-medium bg-[#08152e] hover:bg-slate-800 border border-slate-700 text-slate-300 flex items-center gap-1.5 transition"
                    >
                      <Folder className="w-3.5 h-3.5 text-amber-400" />
                      <span>{isArabic ? 'المجلد' : 'Explore Folder'}</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveServiceModal('storage-disks');
                      }}
                      className="p-1.5 rounded-lg bg-[#08152e] hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 transition"
                      title="Volume Options"
                    >
                      <MoreVertical className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 6. Lower Analysis Workspace (Left 2/3) + Volume Inspector (Right 1/3) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left 8 Cols: Space Map Treemap & Largest Items */}
            <div className="lg:col-span-8 flex flex-col bg-[#071329] border border-slate-700/60 rounded-2xl p-4 shadow-xl">
              {/* Tab Bar Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setActiveTab('treemap')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      activeTab === 'treemap'
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>Space Map</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('large')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      activeTab === 'large'
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                    }`}
                  >
                    Large Files
                  </button>
                  <button
                    onClick={() => setActiveTab('types')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      activeTab === 'types'
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                    }`}
                  >
                    File Types
                  </button>
                  <button
                    onClick={() => setActiveTab('age')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      activeTab === 'age'
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                    }`}
                  >
                    Age Distribution
                  </button>
                  <button
                    onClick={() => setActiveTab('folders')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      activeTab === 'folders'
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                    }`}
                  >
                    Folders
                  </button>
                </div>

                {/* Breadcrumb path & nav buttons */}
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <button className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200" title="Zoom in">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <button className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200" title="Zoom out">
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <button className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200" title="Back">
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </button>
                  <button className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200" title="Forward">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200" title="Parent folder">
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#091a3a] border border-slate-700/60 font-mono text-[11px] text-slate-200 ml-1">
                    <Folder className="w-3.5 h-3.5 text-amber-400" />
                    <span>C: &gt; Users &gt; Alex &gt; Documents</span>
                  </div>
                </div>
              </div>

              {/* Main Content Split: Treemap (Left) + Largest Items in This Folder (Right) */}
              <div className="mt-3 grid grid-cols-1 md:grid-cols-12 gap-3 flex-1 min-h-[300px]">
                {/* 1. Treemap Visualization (7 Columns) */}
                <div className="storage-treemap md:col-span-7 flex flex-col gap-1.5 bg-[#030a16] p-2 rounded-xl border border-slate-800">
                  <div className="flex-1 flex gap-1.5 min-h-[260px]">
                    {/* Left Column of Treemap: Windows block */}
                    <div
                      onClick={() => setSelectedTreemapItem('Windows (93.6 GB)')}
                      className="flex-[4] bg-blue-700 hover:bg-blue-600 rounded-lg p-2.5 flex flex-col justify-between cursor-pointer border border-blue-500/60 transition shadow-inner"
                    >
                      <div className="font-extrabold text-xs text-white">Windows</div>
                      <div className="text-[11px] font-mono text-blue-200">93.6 GB</div>
                      <div className="mt-2 grid grid-cols-2 gap-1 opacity-70">
                        <div className="bg-blue-800/80 rounded p-1 text-[9px] font-mono">Sys32 31G</div>
                        <div className="bg-blue-900/80 rounded p-1 text-[9px] font-mono">WinSxS 24G</div>
                      </div>
                    </div>

                    {/* Middle Column: Users & ProgramData */}
                    <div className="flex-[3] flex flex-col gap-1.5">
                      {/* Users Block */}
                      <div
                        onClick={() => setSelectedTreemapItem('Users (76.2 GB)')}
                        className="flex-1 bg-purple-700 hover:bg-purple-600 rounded-lg p-2 flex flex-col justify-between cursor-pointer border border-purple-500/60 transition"
                      >
                        <div>
                          <div className="font-bold text-xs text-white">Users</div>
                          <div className="text-[10px] font-mono text-purple-200">76.2 GB</div>
                        </div>
                        <div className="space-y-1 mt-1">
                          <div className="bg-purple-800/90 rounded p-1 border border-purple-400/30">
                            <div className="font-semibold text-[10px] text-white">Alex</div>
                            <div className="text-[9px] font-mono text-purple-200">58.4 GB</div>
                          </div>
                          <div className="bg-purple-900/90 rounded p-1 text-[9px] font-mono text-purple-300">
                            Public 12.1 GB
                          </div>
                        </div>
                      </div>

                      {/* ProgramData Block */}
                      <div
                        onClick={() => setSelectedTreemapItem('ProgramData (28.1 GB)')}
                        className="h-16 bg-red-600 hover:bg-red-500 rounded-lg p-1.5 cursor-pointer border border-red-400/60 transition flex flex-col justify-between"
                      >
                        <div className="font-bold text-[11px] text-white">ProgramData</div>
                        <div className="text-[10px] font-mono text-red-200">28.1 GB</div>
                      </div>
                    </div>

                    {/* Right Column: Program Files, pagefile, hiberfil, Other */}
                    <div className="flex-[3] flex flex-col gap-1.5">
                      {/* Program Files */}
                      <div
                        onClick={() => setSelectedTreemapItem('Program Files (62.9 GB)')}
                        className="flex-[2] bg-emerald-700 hover:bg-emerald-600 rounded-lg p-2 cursor-pointer border border-emerald-500/60 transition flex flex-col justify-between"
                      >
                        <div className="font-bold text-xs text-white">Program Files</div>
                        <div className="text-[10px] font-mono text-emerald-200">62.9 GB</div>
                      </div>

                      {/* Program Files x86 */}
                      <div
                        onClick={() => setSelectedTreemapItem('Program Files (x86) (34.7 GB)')}
                        className="flex-1 bg-amber-600 hover:bg-amber-500 rounded-lg p-1.5 cursor-pointer border border-amber-400/60 transition flex flex-col justify-between"
                      >
                        <div className="font-bold text-[10px] text-white">Program Files (x86)</div>
                        <div className="text-[9px] font-mono text-amber-200">34.7 GB</div>
                      </div>

                      {/* Split bottom: pagefile, hiberfil, other */}
                      <div className="flex gap-1 h-14">
                        <div
                          onClick={() => setSelectedTreemapItem('pagefile.sys (16.0 GB)')}
                          className="flex-1 bg-lime-700 hover:bg-lime-600 rounded p-1 cursor-pointer border border-lime-500/50 flex flex-col justify-between"
                        >
                          <span className="text-[8px] font-mono text-white leading-tight">pagefile</span>
                          <span className="text-[8px] font-mono text-lime-200">16.0 GB</span>
                        </div>
                        <div
                          onClick={() => setSelectedTreemapItem('hiberfil.sys (12.6 GB)')}
                          className="flex-1 bg-cyan-700 hover:bg-cyan-600 rounded p-1 cursor-pointer border border-cyan-400/50 flex flex-col justify-between"
                        >
                          <span className="text-[8px] font-mono text-white leading-tight">hiberfil</span>
                          <span className="text-[8px] font-mono text-cyan-200">12.6 GB</span>
                        </div>
                        <div
                          onClick={() => setSelectedTreemapItem('Other Unindexed (54.1 GB)')}
                          className="flex-[1.2] bg-slate-700 hover:bg-slate-600 rounded p-1 cursor-pointer border border-slate-500/50 flex flex-col justify-between"
                        >
                          <span className="text-[8px] font-mono text-white leading-tight">Other</span>
                          <span className="text-[8px] font-mono text-slate-300">54.1 GB</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between px-1">
                    <span>Active Node: <strong className="text-cyan-300 font-semibold">{selectedTreemapItem}</strong></span>
                    <span>Click tile to isolate</span>
                  </div>
                </div>

                {/* 2. Largest Items in This Folder Ledger (5 Columns) */}
                <div className="md:col-span-5 flex flex-col bg-[#050f22] border border-slate-800 rounded-xl p-3">
                  <div className="pb-2 border-b border-slate-800">
                    <h3 className="text-xs font-bold text-white tracking-wide">
                      {isArabic ? 'أكبر العناصر في هذا المجلد' : 'Largest Items in This Folder'}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      {isArabic ? 'تعرف على الملفات والمجلدات الأكثر استهلاكاً.' : 'See which files and folders take up the most space.'}
                    </p>
                  </div>

                  <div className="flex-1 overflow-y-auto storage-scrollbar mt-2 max-h-64">
                    <table className="w-full text-left text-xs">
                      <thead className="text-[10px] font-mono text-slate-500 uppercase tracking-wider pb-1">
                        <tr>
                          <th className="py-1">Name</th>
                          <th className="py-1">Size</th>
                          <th className="py-1 text-right">Type</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-mono">
                        {INITIAL_LARGEST_ITEMS.map((item) => (
                          <tr
                            key={item.id}
                            className="hover:bg-slate-800/50 transition cursor-pointer group"
                            onClick={() => setSelectedTreemapItem(`${item.name} (${item.size})`)}
                          >
                            <td className="py-1.5 pr-2 font-medium text-slate-200 flex items-center gap-1.5 truncate max-w-[130px]">
                              {renderItemIcon(item.iconType)}
                              <span className="truncate group-hover:text-cyan-300">{item.name}</span>
                            </td>
                            <td className="py-1.5 pr-2 text-cyan-300 font-bold whitespace-nowrap">{item.size}</td>
                            <td className="py-1.5 text-right text-slate-400 text-[10px] whitespace-nowrap">{item.type}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Right 4 Cols: Volume Inspector & Analysis Workflow */}
            <div className="lg:col-span-4 flex flex-col gap-3">
              {/* Volume Inspector Card */}
              <div className="bg-[#071329] border border-slate-700/60 rounded-2xl p-4 shadow-xl space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <h3 className="text-sm font-bold text-white tracking-wide">
                    {isArabic ? 'فاحص وحدة التخزين' : 'Volume Inspector'}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-950 text-emerald-300 border border-emerald-700">
                    Selected
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-cyan-950/70 border border-cyan-500/40 text-cyan-300">
                    <HardDrive className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-base font-bold font-mono text-white leading-none">
                      {selectedVolume.letter}\
                    </div>
                    <div className="text-xs text-slate-400 mt-1">{selectedVolume.name}</div>
                  </div>
                </div>

                {/* Specs Grid */}
                <div className="space-y-1.5 text-xs pt-1 border-t border-slate-800">
                  <div className="flex justify-between py-0.5">
                    <span className="text-slate-400">File System</span>
                    <span className="font-mono text-slate-200 font-semibold">{selectedVolume.filesystem}</span>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span className="text-slate-400">Label</span>
                    <span className="font-mono text-slate-200">{selectedVolume.name}</span>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span className="text-slate-400">Physical Device</span>
                    <span className="font-mono text-slate-300 text-[11px] truncate max-w-[170px]" title={selectedVolume.physicalDevice}>
                      {selectedVolume.physicalDevice}
                    </span>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span className="text-slate-400">Used Space</span>
                    <span className="font-mono text-slate-200">{selectedVolume.usedDisplay} ({selectedVolume.usedPercent}%)</span>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span className="text-slate-400">Free Space</span>
                    <span className="font-mono text-emerald-400 font-semibold">{selectedVolume.freeDisplay} ({selectedVolume.freePercent}%)</span>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span className="text-slate-400">Capacity</span>
                    <span className="font-mono text-slate-200">{selectedVolume.totalDisplay}</span>
                  </div>

                  {/* Dual Bar */}
                  <div className="py-1">
                    <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden flex">
                      <div className="bg-rose-500 h-full" style={{ width: `${selectedVolume.usedPercent}%` }} />
                      <div className="bg-emerald-400 h-full" style={{ width: `${selectedVolume.freePercent}%` }} />
                    </div>
                    <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1">
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block" /> Used {selectedVolume.usedDisplay}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" /> Free {selectedVolume.freeDisplay}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between py-0.5 pt-2 border-t border-slate-800">
                    <span className="text-slate-400">Measured Folder Size</span>
                    <span className="font-mono text-slate-200">{selectedVolume.totalDisplay}</span>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span className="text-slate-400">Content Breakdown</span>
                    <span className="font-mono text-slate-300 text-[11px]">
                      {selectedVolume.filesCount.toLocaleString()} files, {selectedVolume.foldersCount.toLocaleString()} folders
                    </span>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span className="text-slate-400">Scan Source</span>
                    <span className="text-slate-300">{selectedVolume.scanSource}</span>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span className="text-slate-400">Scan Timestamp</span>
                    <span className="font-mono text-slate-400 text-[11px]">{selectedVolume.scanTimestamp}</span>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span className="text-slate-400">Metadata Limitations</span>
                    <span className="text-amber-400/90 text-[10px] text-right truncate max-w-[160px]" title={selectedVolume.metadataLimitations}>
                      {selectedVolume.metadataLimitations}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 pt-1.5 border-t border-slate-800">
                    <span className="text-slate-400">Action Availability</span>
                    <span className="text-emerald-400 font-medium text-[11px] flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                      All analysis actions available
                    </span>
                  </div>
                </div>
              </div>

              {/* Analysis Workflow Timeline (5 Steps) */}
              <div className="bg-[#071329] border border-slate-700/60 rounded-2xl p-4 shadow-xl">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                  {isArabic ? 'مراحل سير عمل التحليل' : 'Analysis Workflow'}
                </h4>
                <div className="relative flex justify-between items-center text-center">
                  <div className="step-connector-line" />

                  {/* Step 1 */}
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-mono text-xs font-bold flex items-center justify-center border-2 border-[#071329] shadow-md shadow-blue-500/40">
                      1
                    </div>
                    <span className="text-[10px] font-semibold text-slate-200 mt-1">Choose</span>
                    <span className="text-[8px] text-slate-400">Root</span>
                  </div>

                  {/* Step 2 */}
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="w-7 h-7 rounded-full bg-cyan-600 text-white font-mono text-xs font-bold flex items-center justify-center border-2 border-[#071329] shadow-md shadow-cyan-500/40">
                      2
                    </div>
                    <span className="text-[10px] font-semibold text-slate-200 mt-1">Measure</span>
                    <span className="text-[8px] text-slate-400">Scan files</span>
                  </div>

                  {/* Step 3 */}
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-mono text-xs font-bold flex items-center justify-center border-2 border-[#071329] shadow-md shadow-indigo-500/40">
                      3
                    </div>
                    <span className="text-[10px] font-semibold text-slate-200 mt-1">Classify</span>
                    <span className="text-[8px] text-slate-400">Analyze</span>
                  </div>

                  {/* Step 4 */}
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="w-7 h-7 rounded-full bg-purple-600 text-white font-mono text-xs font-bold flex items-center justify-center border-2 border-[#071329] shadow-md shadow-purple-500/40">
                      4
                    </div>
                    <span className="text-[10px] font-semibold text-slate-200 mt-1">Explore</span>
                    <span className="text-[8px] text-slate-400">Results</span>
                  </div>

                  {/* Step 5 */}
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-mono text-xs font-bold flex items-center justify-center border-2 border-[#071329] shadow-md shadow-emerald-500/40">
                      5
                    </div>
                    <span className="text-[10px] font-semibold text-slate-200 mt-1">Export</span>
                    <span className="text-[8px] text-slate-400">Report</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 7. Storage Analysis Services (12 Services Strip) */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {isArabic ? 'خدمات تحليل واستكشاف التخزين' : 'Storage Analysis Services'}
              </h3>
              <span className="text-[11px] text-slate-500">
                {isArabic ? '12 خدمة متخصصة · انقر لمعاينة بيئة العمل' : '12 specialized in-app tools · Click to open workspace'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
              {STORAGE_SERVICES_CATALOG.map((srv) => (
                <div
                  key={srv.id}
                  onClick={() => setActiveServiceModal(srv.serviceKey)}
                  className="p-3 rounded-xl bg-[#08152e] hover:bg-[#0c1f44] border border-slate-700/60 hover:border-cyan-500/50 cursor-pointer transition shadow-md group flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-700/70 text-cyan-400 group-hover:text-cyan-300 group-hover:border-cyan-500/40 transition">
                      {renderServiceCatalogIcon(srv.serviceKey)}
                    </div>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-900/80 text-slate-400 border border-slate-800">
                      {srv.tag}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-200 group-hover:text-white leading-tight">
                      {srv.name}
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                      {srv.subtitle}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>

      {/* 8. Sticky Action Footer */}
      <footer className="h-14 bg-[#050f24] border-t border-slate-800/90 px-5 flex items-center justify-between z-30 shrink-0">
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>
            {isArabic
              ? 'جاهز لتحليل، استكشاف، واستعادة المساحة على وحدات التخزين الخاصة بك.'
              : 'Ready to analyze, explore, and reclaim space on your volumes.'}
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setActiveServiceModal('storage-disks')}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/40 flex items-center gap-2 transition"
          >
            <Search className="w-4 h-4" />
            <span>{isArabic ? 'فحص وحدة التخزين' : 'Inspect Volume'}</span>
          </button>

          <button
            onClick={() => setActiveServiceModal('storage-top-folders')}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#091838] hover:bg-slate-800 border border-slate-700 text-slate-200 flex items-center gap-1.5 transition"
          >
            <Folder className="w-4 h-4 text-amber-400" />
            <span>{isArabic ? 'استكشاف الملفات' : 'Explore Files'}</span>
          </button>

          <button
            onClick={() => setActiveServiceModal('storage-duplicates')}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#091838] hover:bg-slate-800 border border-slate-700 text-slate-200 flex items-center gap-1.5 transition"
          >
            <Copy className="w-4 h-4 text-cyan-400" />
            <span>{isArabic ? 'مراجعة المكررات' : 'Review Duplicates'}</span>
          </button>

          <button
            onClick={() => setActiveServiceModal('storage-large-files')}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#091838] hover:bg-slate-800 border border-slate-700 text-slate-200 flex items-center gap-1.5 transition"
          >
            <Scale className="w-4 h-4 text-purple-400" />
            <span>{isArabic ? 'عرض الملفات الكبيرة' : 'View Large Files'}</span>
          </button>

          <button
            onClick={() => setActiveServiceModal('storage-scan-overview')}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#091838] hover:bg-slate-800 border border-slate-700 text-slate-200 flex items-center gap-1.5 transition"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>{isArabic ? 'تصدير تقرير المساحة' : 'Export Space Report'}</span>
          </button>
        </div>
      </footer>

      {activeServiceModal && (
        <StorageWorkspaces
          serviceKey={activeServiceModal}
          onClose={() => setActiveServiceModal(null)}
          isArabic={isArabic}
        />
      )}

    </div>
  );
}

function renderItemIcon(iconType: string) {
  switch (iconType) {
    case 'disk-image':
      return <Disc className="w-3.5 h-3.5 text-cyan-400 shrink-0" />;
    case 'vhd':
      return <Disc3 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
    case 'archive':
      return <FileArchive className="w-3.5 h-3.5 text-purple-400 shrink-0" />;
    case 'music':
      return <Music className="w-3.5 h-3.5 text-pink-400 shrink-0" />;
    case 'camera':
      return <Camera className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
    default:
      return <Folder className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
  }
}

function renderServiceCatalogIcon(key: string) {
  switch (key) {
    case 'storage-disks':
      return <PieChart className="w-4 h-4" />;
    case 'storage-large-files':
      return <Scale className="w-4 h-4" />;
    case 'storage-duplicates':
      return <Copy className="w-4 h-4" />;
    case 'storage-treemap':
      return <LayoutGrid className="w-4 h-4" />;
    case 'storage-top-folders':
      return <FolderTree className="w-4 h-4" />;
    case 'storage-filetypes':
      return <Shapes className="w-4 h-4" />;
    case 'storage-scan-overview':
      return <ScanLine className="w-4 h-4" />;
    case 'storage-fragmentation':
      return <Boxes className="w-4 h-4" />;
    case 'storage-smart':
      return <Activity className="w-4 h-4" />;
    case 'storage-reclaim':
      return <Sparkles className="w-4 h-4" />;
    case 'storage-history':
      return <LineChart className="w-4 h-4" />;
    case 'storage-removable':
      return <Usb className="w-4 h-4" />;
    default:
      return <Database className="w-4 h-4" />;
  }
}
