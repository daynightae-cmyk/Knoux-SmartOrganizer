/**
 * KNOuX SmartOrganizer — Application Command Surface (Left-Center Main Register)
 * Matches REF-02 Installed Applications table, toolbar, and controls
 */

import React, { useState, useMemo } from 'react';
import {
  Search,
  ChevronDown,
  RefreshCw,
  List,
  Grid,
  Menu,
  Plus,
  Trash2,
  Wrench,
  Shuffle,
  RotateCw,
  Play,
  Info,
  Layers,
  Settings,
  MoreHorizontal,
  Check,
  ArrowUpDown,
  Filter,
} from 'lucide-react';
import { InstalledAppItem, TabFilter } from '../../lib/app-inventory';
import { AppIcon } from './AppIcon';

interface ApplicationCommandSurfaceProps {
  apps: InstalledAppItem[];
  selectedApp: InstalledAppItem;
  onSelectApp: (app: InstalledAppItem) => void;
  checkedAppIds: Set<string>;
  onToggleCheckApp: (id: string) => void;
  onToggleCheckAll: () => void;
  onRefreshInventory: () => void;
  onTriggerAction: (actionName: string) => void;
  locale: 'en' | 'ar';
}

export function ApplicationCommandSurface({
  apps,
  selectedApp,
  onSelectApp,
  checkedAppIds,
  onToggleCheckApp,
  onToggleCheckAll,
  onRefreshInventory,
  onTriggerAction,
  locale,
}: ApplicationCommandSurfaceProps) {
  const [activeTab, setActiveTab] = useState<TabFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPublisher, setSelectedPublisher] = useState('All');
  const [sortBy, setSortBy] = useState<'name_asc' | 'size_desc' | 'date_desc'>('name_asc');
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'compact'>('list');

  // Filtered and sorted applications
  const filteredApps = useMemo(() => {
    let result = apps.filter((app) => {
      // Tab filter
      if (activeTab === 'desktop' && app.isPackaged) return false;
      if (activeTab === 'packaged' && !app.isPackaged) return false;
      if (activeTab === 'recent' && !app.isRecent) return false;
      if (activeTab === 'large' && !app.isLarge) return false;

      // Publisher filter
      if (selectedPublisher !== 'All' && !app.publisher.toLowerCase().includes(selectedPublisher.toLowerCase())) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          app.name.toLowerCase().includes(q) ||
          app.publisher.toLowerCase().includes(q) ||
          app.version.toLowerCase().includes(q)
        );
      }

      return true;
    });

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
      if (sortBy === 'size_desc') return b.sizeBytes - a.sizeBytes;
      if (sortBy === 'date_desc') return b.installedOn.localeCompare(a.installedOn);
      return 0;
    });

    return result;
  }, [apps, activeTab, searchQuery, selectedPublisher, sortBy]);

  const allChecked = filteredApps.length > 0 && filteredApps.every((a) => checkedAppIds.has(a.id));

  return (
    <div className="flex-1 flex flex-col min-w-0 select-none">
      {/* 1. Header with Title & Hamburger */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#0f2545]">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-white tracking-wide">
            {locale === 'en' ? 'Installed Applications' : 'التطبيقات المثبتة'}{' '}
            <span className="text-slate-400 font-normal font-mono">({apps.length})</span>
          </h2>
        </div>

        <button className="p-1 rounded text-slate-400 hover:text-white hover:bg-[#0f2442] transition-colors cursor-pointer">
          <Menu className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Search & Controls Bar */}
      <div className="space-y-2 mb-2.5">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search input */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={locale === 'en' ? 'Search installed applications...' : 'ابحث عن التطبيقات المثبتة...'}
              className="w-full bg-[#08172c] border border-[#142e56] rounded-md pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-[#2476ff] transition-colors"
            />
          </div>

          {/* Publisher dropdown */}
          <div className="relative">
            <select
              value={selectedPublisher}
              onChange={(e) => setSelectedPublisher(e.target.value)}
              className="bg-[#08172c] text-slate-300 hover:text-white border border-[#142e56] rounded-md px-2.5 py-1.5 text-xs font-medium cursor-pointer appearance-none pr-7 outline-none focus:border-[#2476ff]"
            >
              <option value="All">All Publishers</option>
              <option value="Microsoft">Microsoft Corporation</option>
              <option value="Google">Google LLC</option>
              <option value="Adobe">Adobe Inc.</option>
              <option value="Discord">Discord Inc.</option>
              <option value="Spotify">Spotify AB</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2 pointer-events-none" />
          </div>

          {/* Sort dropdown */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-[#08172c] text-slate-300 hover:text-white border border-[#142e56] rounded-md px-2.5 py-1.5 text-xs font-medium cursor-pointer appearance-none pr-7 outline-none focus:border-[#2476ff]"
            >
              <option value="name_asc">Sort by: Name (A → Z)</option>
              <option value="size_desc">Sort by: Size (Largest)</option>
              <option value="date_desc">Sort by: Date (Newest)</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2 pointer-events-none" />
          </div>

          {/* Refresh inventory button */}
          <button
            onClick={onRefreshInventory}
            className="px-2.5 py-1.5 rounded-md bg-[#0a1b32] hover:bg-[#122e54] text-cyan-300 border border-[#1b3f70] text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3 h-3 text-cyan-400" />
            <span>{locale === 'en' ? 'Refresh Inventory' : 'تحديث المخزون'}</span>
          </button>
        </div>

        {/* Segmented Filter Pills & View switchers */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 bg-[#061224] p-0.5 rounded-lg border border-[#112647] overflow-x-auto app-scrollbar">
            {[
              { id: 'all' as TabFilter, label: 'All (358)' },
              { id: 'desktop' as TabFilter, label: 'Desktop (289)' },
              { id: 'packaged' as TabFilter, label: 'Packaged (69)' },
              { id: 'recent' as TabFilter, label: 'Recent (14)' },
              { id: 'large' as TabFilter, label: 'Large (21)' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-[#1b4cb3] text-white shadow-[0_0_10px_rgba(36,118,255,0.6)] font-semibold border border-cyan-400/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#0c1e38]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* View mode toggle icons */}
          <div className="flex items-center bg-[#071529] p-0.5 rounded-md border border-[#142e56]">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1 rounded text-xs transition-colors cursor-pointer ${
                viewMode === 'list' ? 'bg-[#173866] text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="List view"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1 rounded text-xs transition-colors cursor-pointer ${
                viewMode === 'grid' ? 'bg-[#173866] text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Grid view"
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('compact')}
              className={`p-1 rounded text-xs transition-colors cursor-pointer ${
                viewMode === 'compact' ? 'bg-[#173866] text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Compact view"
            >
              <Menu className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Standout Horizontal Action Toolbar */}
      <div className="flex items-center gap-1.5 mb-2.5 p-1 rounded-lg bg-[#061427] border border-[#142e56] overflow-x-auto app-scrollbar">
        {/* + Install */}
        <button
          onClick={() => onTriggerAction('Install')}
          className="app-tactile-btn px-3 py-1.5 rounded-md bg-gradient-to-r from-[#2476ff] to-[#1c5fdb] hover:from-[#3582ff] hover:to-[#226cf0] text-white text-xs font-semibold flex items-center gap-1.5 shadow-[0_0_12px_rgba(36,118,255,0.4)] border border-cyan-400/50 cursor-pointer shrink-0"
        >
          <Plus className="w-3.5 h-3.5 stroke-[3]" />
          <span>Install</span>
        </button>

        {/* Uninstall */}
        <button
          onClick={() => onTriggerAction('Uninstall')}
          className="app-tactile-btn px-3 py-1.5 rounded-md bg-[#130d17] hover:bg-[#201325] text-red-300 hover:text-red-200 text-xs font-semibold flex items-center gap-1.5 border border-red-500/50 cursor-pointer shrink-0"
        >
          <Trash2 className="w-3.5 h-3.5 text-red-400" />
          <span>Uninstall</span>
        </button>

        {/* Repair */}
        <button
          onClick={() => onTriggerAction('Repair')}
          className="app-tactile-btn px-3 py-1.5 rounded-md bg-[#181308] hover:bg-[#271f0c] text-amber-300 hover:text-amber-200 text-xs font-semibold flex items-center gap-1.5 border border-amber-500/50 cursor-pointer shrink-0"
        >
          <Wrench className="w-3.5 h-3.5 text-amber-400" />
          <span>Repair</span>
        </button>

        {/* Modify */}
        <button
          onClick={() => onTriggerAction('Modify')}
          className="app-tactile-btn px-3 py-1.5 rounded-md bg-[#150e24] hover:bg-[#22163a] text-purple-300 hover:text-purple-200 text-xs font-semibold flex items-center gap-1.5 border border-purple-500/50 cursor-pointer shrink-0"
        >
          <Shuffle className="w-3.5 h-3.5 text-purple-400" />
          <span>Modify</span>
        </button>

        {/* Update */}
        <button
          onClick={() => onTriggerAction('Update')}
          className="app-tactile-btn px-3 py-1.5 rounded-md bg-[#0a233f] hover:bg-[#12335c] text-cyan-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 border border-cyan-500/50 cursor-pointer shrink-0"
        >
          <RotateCw className="w-3.5 h-3.5 text-cyan-400" />
          <span>Update</span>
        </button>

        {/* Open */}
        <button
          onClick={() => onTriggerAction('Open')}
          className="app-tactile-btn px-3 py-1.5 rounded-md bg-[#0a2318] hover:bg-[#113524] text-emerald-300 hover:text-emerald-200 text-xs font-semibold flex items-center gap-1.5 border border-emerald-500/50 cursor-pointer shrink-0"
        >
          <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
          <span>Open</span>
        </button>

        {/* Details */}
        <button
          onClick={() => onTriggerAction('Details')}
          className="app-tactile-btn px-3 py-1.5 rounded-md bg-[#0a182e] hover:bg-[#122b4e] text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1.5 border border-[#1b3f70] cursor-pointer shrink-0"
        >
          <Info className="w-3.5 h-3.5 text-slate-400" />
          <span>Details</span>
        </button>

        {/* Batch Actions */}
        <div className="relative shrink-0">
          <button
            onClick={() => onTriggerAction('Batch')}
            className="app-tactile-btn px-3 py-1.5 rounded-md bg-[#08162b] hover:bg-[#10274a] text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1.5 border border-[#153461] cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <span>Batch Actions</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>
        </div>
      </div>

      {/* 4. Dense Applications Table */}
      <div className="flex-1 bg-[#061226] rounded-xl border border-[#132c52] overflow-hidden flex flex-col min-h-0 shadow-inner">
        {/* Table Header */}
        <div className="h-8 bg-[#091a33] border-b border-[#132c52] px-3 flex items-center text-[11px] font-semibold text-slate-400 select-none">
          {/* Checkbox */}
          <div className="w-8 shrink-0 flex items-center">
            <div
              onClick={onToggleCheckAll}
              className={`w-3.5 h-3.5 rounded flex items-center justify-center border cursor-pointer ${
                allChecked
                  ? 'bg-[#2476ff] border-[#26c6ff] text-white'
                  : 'bg-transparent border-slate-600 hover:border-slate-400'
              }`}
            >
              {allChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
            </div>
          </div>

          <div className="flex-1 min-w-[140px] flex items-center gap-1">
            <span>Name</span>
            <ArrowUpDown className="w-3 h-3 text-slate-500" />
          </div>

          <div className="w-36 hidden sm:block">Publisher</div>
          <div className="w-28 hidden md:block">Version</div>
          <div className="w-24 hidden lg:block">Installed On</div>
          <div className="w-20 text-right pr-2">Size</div>
          <div className="w-24 text-center">Actions</div>
        </div>

        {/* Table Body */}
        <div className="flex-1 overflow-y-auto app-scrollbar divide-y divide-[#0c1f3b]">
          {filteredApps.map((app) => {
            const isSelected = selectedApp.id === app.id;
            const isChecked = checkedAppIds.has(app.id);

            return (
              <div
                key={app.id}
                onClick={() => onSelectApp(app)}
                className={`h-9 px-3 flex items-center text-xs transition-colors cursor-pointer ${
                  isSelected
                    ? 'app-row-selected'
                    : 'hover:bg-[#091a32] text-slate-200'
                }`}
              >
                {/* Checkbox */}
                <div
                  className="w-8 shrink-0 flex items-center"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleCheckApp(app.id);
                  }}
                >
                  <div
                    className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-all ${
                      isChecked
                        ? 'bg-[#2476ff] border-[#26c6ff] text-white shadow-[0_0_6px_#26c6ff]'
                        : 'bg-transparent border-slate-600 hover:border-slate-400'
                    }`}
                  >
                    {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                  </div>
                </div>

                {/* Icon & Name */}
                <div className="flex-1 min-w-[140px] flex items-center gap-2 truncate pr-2">
                  <AppIcon name={app.name} className="w-4 h-4 shrink-0" />
                  <span className={`truncate font-medium ${isSelected ? 'text-white font-bold' : 'text-slate-200'}`}>
                    {app.name}
                  </span>
                </div>

                {/* Publisher */}
                <div className="w-36 text-slate-400 truncate text-[11px] hidden sm:block">
                  {app.publisher}
                </div>

                {/* Version */}
                <div className="w-28 text-slate-400 font-mono text-[11px] truncate hidden md:block">
                  {app.version}
                </div>

                {/* Installed On */}
                <div className="w-24 text-slate-400 font-mono text-[11px] truncate hidden lg:block">
                  {app.installedOn}
                </div>

                {/* Size */}
                <div className="w-20 text-right pr-2 text-slate-300 font-mono text-[11px] font-medium">
                  {app.sizeFormatted}
                </div>

                {/* Row Quick Action Buttons */}
                <div
                  className="w-24 flex items-center justify-center gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => onTriggerAction('Open')}
                    className="p-1 rounded text-slate-400 hover:text-emerald-400 hover:bg-[#0c2438] transition-colors"
                    title="Open application"
                  >
                    <Play className="w-3 h-3 fill-current" />
                  </button>
                  <button
                    onClick={() => onTriggerAction('Modify')}
                    className="p-1 rounded text-slate-400 hover:text-cyan-400 hover:bg-[#0c2438] transition-colors"
                    title="Manage / Modify"
                  >
                    <Settings className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => onTriggerAction('Details')}
                    className="p-1 rounded text-slate-400 hover:text-white hover:bg-[#0c2438] transition-colors"
                    title="More actions"
                  >
                    <MoreHorizontal className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
