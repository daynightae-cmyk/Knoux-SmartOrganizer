/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * KNOuX SmartOrganizer — Home Command Center Upper Section
 * Region A: Hero & Master Command Search with Earth Horizon Scene
 * Region B: 6 KPI Cards (System Health, Indexed Files, Space Reclaimable, Active Automations, Apps Monitored, Services Healthy)
 * Region C: Today's Command Deck (4x2 Illustrated Tiles with 3D Tech Geometry)
 */

import React, { useState } from 'react';
import {
  Search,
  Shield,
  FileText,
  HardDrive,
  Zap,
  Grid,
  Settings2,
  SlidersHorizontal,
  ChevronRight,
  FolderOpen,
  Box,
  Trash2,
  Rocket,
  Activity,
  Wrench,
  Check,
  RotateCcw,
  X,
  ExternalLink,
} from 'lucide-react';
import {
  DeckTile,
  KpiMetric,
  PageId,
  INITIAL_DECK_TILES,
  INITIAL_KPIS,
} from '../../lib/home-ui';
import { EarthHorizonScene } from './EarthHorizonScene';

// 3D Isometric Technical Visuals for each Command Deck card
const renderDeckBackgroundGraphic = (id: string) => {
  switch (id) {
    case 'tile-scan':
      // Blue isometric scanning cubes
      return (
        <svg className="knx-tile-art" viewBox="0 0 100 80" fill="none">
          <path d="M 50 15 L 75 30 L 50 45 L 25 30 Z" stroke="#38bdf8" strokeWidth="1" strokeOpacity="0.35" fill="rgba(56, 189, 248, 0.05)" />
          <path d="M 25 30 L 25 50 L 50 65 L 50 45 Z" stroke="#38bdf8" strokeWidth="1" strokeOpacity="0.25" fill="rgba(56, 189, 248, 0.02)" />
          <path d="M 75 30 L 75 50 L 50 65 L 50 45 Z" stroke="#38bdf8" strokeWidth="1" strokeOpacity="0.3" fill="rgba(56, 189, 248, 0.08)" />
          {/* Secondary smaller cube */}
          <path d="M 65 35 L 85 46 L 65 58 L 45 46 Z" stroke="#0284c7" strokeWidth="0.8" strokeOpacity="0.3" fill="none" />
          <circle cx="50" cy="30" r="1.5" fill="#38bdf8" opacity="0.8" />
          <line x1="20" y1="20" x2="80" y2="55" stroke="#38bdf8" strokeWidth="0.6" strokeDasharray="2 3" strokeOpacity="0.4" />
        </svg>
      );
    case 'tile-studio':
      // Teal stacked files/folders isometric
      return (
        <svg className="knx-tile-art" viewBox="0 0 100 80" fill="none">
          <path d="M 40 20 L 75 22 L 85 45 L 50 43 Z" stroke="#2dd4bf" strokeWidth="1" strokeOpacity="0.3" fill="rgba(45, 212, 191, 0.04)" />
          <path d="M 35 28 L 70 30 L 80 53 L 45 51 Z" stroke="#2dd4bf" strokeWidth="1" strokeOpacity="0.4" fill="rgba(45, 212, 191, 0.06)" />
          <path d="M 30 36 L 65 38 L 75 61 L 40 59 Z" stroke="#2dd4bf" strokeWidth="1.2" strokeOpacity="0.5" fill="rgba(45, 212, 191, 0.08)" />
          <line x1="42" y1="45" x2="62" y2="46" stroke="#2dd4bf" strokeWidth="0.8" strokeOpacity="0.4" />
          <line x1="40" y1="49" x2="58" y2="50" stroke="#2dd4bf" strokeWidth="0.8" strokeOpacity="0.4" />
        </svg>
      );
    case 'tile-apps':
      // Violet 3D floating application cube
      return (
        <svg className="knx-tile-art" viewBox="0 0 100 80" fill="none">
          <polygon points="50,18 78,32 50,46 22,32" stroke="#a78bfa" strokeWidth="1.2" strokeOpacity="0.45" fill="rgba(167, 139, 250, 0.08)" />
          <polygon points="22,32 50,46 50,72 22,58" stroke="#a78bfa" strokeWidth="1" strokeOpacity="0.35" fill="rgba(167, 139, 250, 0.03)" />
          <polygon points="78,32 50,46 50,72 78,58" stroke="#a78bfa" strokeWidth="1" strokeOpacity="0.4" fill="rgba(167, 139, 250, 0.05)" />
          {/* Inner core cube */}
          <polygon points="50,26 64,33 50,40 36,33" stroke="#c084fc" strokeWidth="0.8" strokeOpacity="0.6" fill="rgba(192, 132, 252, 0.15)" />
        </svg>
      );
    case 'tile-storage':
      // Amber storage rack server chassis
      return (
        <svg className="knx-tile-art" viewBox="0 0 100 80" fill="none">
          <rect x="35" y="18" width="45" height="12" rx="2" stroke="#fbbf24" strokeWidth="1" strokeOpacity="0.4" fill="rgba(251, 191, 36, 0.05)" />
          <rect x="35" y="34" width="45" height="12" rx="2" stroke="#fbbf24" strokeWidth="1" strokeOpacity="0.4" fill="rgba(251, 191, 36, 0.05)" />
          <rect x="35" y="50" width="45" height="12" rx="2" stroke="#fbbf24" strokeWidth="1" strokeOpacity="0.4" fill="rgba(251, 191, 36, 0.05)" />
          <circle cx="42" cy="24" r="1.5" fill="#fbbf24" opacity="0.8" />
          <circle cx="42" cy="40" r="1.5" fill="#fbbf24" opacity="0.8" />
          <circle cx="42" cy="56" r="1.5" fill="#fbbf24" opacity="0.8" />
          <line x1="48" y1="24" x2="72" y2="24" stroke="#fbbf24" strokeWidth="0.8" strokeOpacity="0.3" />
          <line x1="48" y1="40" x2="72" y2="40" stroke="#fbbf24" strokeWidth="0.8" strokeOpacity="0.3" />
          <line x1="48" y1="56" x2="72" y2="56" stroke="#fbbf24" strokeWidth="0.8" strokeOpacity="0.3" />
        </svg>
      );
    case 'tile-cleanup':
      // Orange cleaning node / workstation
      return (
        <svg className="knx-tile-art" viewBox="0 0 100 80" fill="none">
          <ellipse cx="60" cy="55" rx="25" ry="12" stroke="#fb923c" strokeWidth="1" strokeOpacity="0.3" fill="rgba(251, 146, 60, 0.04)" />
          <line x1="60" y1="18" x2="60" y2="48" stroke="#fb923c" strokeWidth="1.2" strokeOpacity="0.45" />
          <path d="M 45 46 Q 60 40 75 46" stroke="#fb923c" strokeWidth="1.2" strokeOpacity="0.5" />
          <line x1="45" y1="46" x2="40" y2="58" stroke="#fb923c" strokeWidth="0.8" strokeOpacity="0.35" />
          <line x1="75" y1="46" x2="80" y2="58" stroke="#fb923c" strokeWidth="0.8" strokeOpacity="0.35" />
          <circle cx="60" cy="18" r="2" fill="#fb923c" opacity="0.9" />
        </svg>
      );
    case 'tile-startup':
      // Purple perspective mesh terrain / trajectory
      return (
        <svg className="knx-tile-art" viewBox="0 0 100 80" fill="none">
          <path d="M 25 65 L 50 25 L 75 65" stroke="#c084fc" strokeWidth="1" strokeOpacity="0.4" fill="rgba(192, 132, 252, 0.05)" />
          <line x1="30" y1="55" x2="70" y2="55" stroke="#c084fc" strokeWidth="0.8" strokeOpacity="0.35" />
          <line x1="37" y1="45" x2="63" y2="45" stroke="#c084fc" strokeWidth="0.8" strokeOpacity="0.35" />
          <line x1="44" y1="35" x2="56" y2="35" stroke="#c084fc" strokeWidth="0.8" strokeOpacity="0.35" />
          <circle cx="50" cy="22" r="2" fill="#c084fc" opacity="0.9" />
        </svg>
      );
    case 'tile-system':
      // Cyan 3D waveform grid
      return (
        <svg className="knx-tile-art" viewBox="0 0 100 80" fill="none">
          <path d="M 20 45 Q 35 25 50 45 T 80 45" stroke="#22d3ee" strokeWidth="1.5" strokeOpacity="0.55" fill="none" />
          <path d="M 25 52 Q 40 35 55 52 T 85 52" stroke="#22d3ee" strokeWidth="1" strokeOpacity="0.3" fill="none" />
          <path d="M 15 38 Q 30 18 45 38 T 75 38" stroke="#22d3ee" strokeWidth="0.8" strokeOpacity="0.2" fill="none" />
          <line x1="20" y1="60" x2="80" y2="60" stroke="#22d3ee" strokeWidth="0.6" strokeDasharray="3 3" strokeOpacity="0.3" />
        </svg>
      );
    case 'tile-repair':
      // Coral repair geometric lattice
      return (
        <svg className="knx-tile-art" viewBox="0 0 100 80" fill="none">
          <circle cx="55" cy="40" r="18" stroke="#fb7185" strokeWidth="1" strokeOpacity="0.4" strokeDasharray="4 2" fill="rgba(251, 113, 133, 0.04)" />
          <circle cx="55" cy="40" r="8" stroke="#fb7185" strokeWidth="1.2" strokeOpacity="0.5" fill="none" />
          <line x1="30" y1="40" x2="80" y2="40" stroke="#fb7185" strokeWidth="0.8" strokeOpacity="0.35" />
          <line x1="55" y1="15" x2="55" y2="65" stroke="#fb7185" strokeWidth="0.8" strokeOpacity="0.35" />
        </svg>
      );
    default:
      return null;
  }
};

const renderIcon = (name: string, className = 'w-4 h-4') => {
  switch (name) {
    case 'scan':
      return <Search className={className} />;
    case 'folder':
      return <FolderOpen className={className} />;
    case 'cube':
      return <Box className={className} />;
    case 'disk':
      return <HardDrive className={className} />;
    case 'broom':
      return <Trash2 className={className} />;
    case 'rocket':
      return <Rocket className={className} />;
    case 'waveform':
      return <Activity className={className} />;
    case 'wrench':
      return <Wrench className={className} />;
    case 'shield':
      return <Shield className={className} />;
    case 'files':
      return <FileText className={className} />;
    case 'database':
      return <HardDrive className={className} />;
    case 'zap':
      return <Zap className={className} />;
    case 'grid':
      return <Grid className={className} />;
    case 'settings':
      return <Settings2 className={className} />;
    default:
      return <Search className={className} />;
  }
};

export interface HomeCommandDeckProps {
  locale?: string;
  onNavigate: (page: PageId | string) => void;
}

export const HomeCommandDeck: React.FC<HomeCommandDeckProps> = ({
  locale = 'en',
  onNavigate,
}) => {
  const isAr = locale === 'ar';
  const [deckTiles, setDeckTiles] = useState<DeckTile[]>(INITIAL_DECK_TILES);
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);

  const handleTileToggle = (id: string) => {
    setDeckTiles((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isVisible: !t.isVisible } : t))
    );
  };

  const handleResetTiles = () => {
    setDeckTiles(INITIAL_DECK_TILES);
  };

  return (
    <>
      {/* REGION C: TODAY'S COMMAND DECK */}
      <section className="knx-deck-panel" aria-label="Today's Command Deck">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide">
              {isAr ? 'لوحة الأوامر المباشرة' : "Today's Command Deck"}
            </h2>
            <p className="text-[11px] text-slate-400">
              {isAr
                ? 'وصول فوري وشامل لجميع أدوات النظام الأساسية.'
                : 'Launch core tools and start organizing your digital world.'}
            </p>
          </div>

          <button
            onClick={() => setIsCustomizeOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#0a162c] hover:bg-[#112447] text-slate-300 hover:text-white border border-[#17325c] transition-colors text-[11px] font-medium cursor-pointer"
            title={isAr ? 'تخصيص البطاقات' : 'Customize tiles'}
          >
            <SlidersHorizontal className="w-3 h-3 text-slate-400" />
            <span>{isAr ? 'تخصيص' : 'Customize'}</span>
          </button>
        </div>

        {/* 4x2 GRID OF 8 CARDS */}
        <div className="grid grid-cols-4 gap-2.5">
          {deckTiles
            .filter((t) => t.isVisible)
            .map((tile) => {
              // Accent color mapping
              const accentMap: Record<DeckTile['accent'], { border: string; bg: string; iconBg: string; text: string; glow: string }> = {
                azure: { border: 'border-sky-500/30 hover:border-sky-400/60', bg: 'bg-[#061226]/90', iconBg: 'bg-sky-500/15 border-sky-400/40 text-sky-400', text: 'text-sky-300', glow: 'shadow-[0_0_12px_rgba(56,189,248,0.15)]' },
                teal: { border: 'border-teal-500/30 hover:border-teal-400/60', bg: 'bg-[#04171d]/90', iconBg: 'bg-teal-500/15 border-teal-400/40 text-teal-400', text: 'text-teal-300', glow: 'shadow-[0_0_12px_rgba(45,212,191,0.15)]' },
                violet: { border: 'border-purple-500/30 hover:border-purple-400/60', bg: 'bg-[#0f0e26]/90', iconBg: 'bg-purple-500/15 border-purple-400/40 text-purple-400', text: 'text-purple-300', glow: 'shadow-[0_0_12px_rgba(168,85,247,0.15)]' },
                amber: { border: 'border-amber-500/30 hover:border-amber-400/60', bg: 'bg-[#181305]/90', iconBg: 'bg-amber-500/15 border-amber-400/40 text-amber-400', text: 'text-amber-300', glow: 'shadow-[0_0_12px_rgba(251,191,36,0.15)]' },
                orange: { border: 'border-orange-500/30 hover:border-orange-400/60', bg: 'bg-[#191008]/90', iconBg: 'bg-orange-500/15 border-orange-400/40 text-orange-400', text: 'text-orange-300', glow: 'shadow-[0_0_12px_rgba(251,146,60,0.15)]' },
                purple: { border: 'border-fuchsia-500/30 hover:border-fuchsia-400/60', bg: 'bg-[#160824]/90', iconBg: 'bg-fuchsia-500/15 border-fuchsia-400/40 text-fuchsia-400', text: 'text-fuchsia-300', glow: 'shadow-[0_0_12px_rgba(217,70,239,0.15)]' },
                cyan: { border: 'border-cyan-500/30 hover:border-cyan-400/60', bg: 'bg-[#041624]/90', iconBg: 'bg-cyan-500/15 border-cyan-400/40 text-cyan-400', text: 'text-cyan-300', glow: 'shadow-[0_0_12px_rgba(34,211,238,0.15)]' },
                coral: { border: 'border-rose-500/30 hover:border-rose-400/60', bg: 'bg-[#1c0812]/90', iconBg: 'bg-rose-500/15 border-rose-400/40 text-rose-400', text: 'text-rose-300', glow: 'shadow-[0_0_12px_rgba(251,113,133,0.15)]' },
              };

              const style = accentMap[tile.accent];

              return (
                <div
                  key={tile.id}
                  onClick={() => onNavigate(tile.targetPage)}
                  className={`relative p-3 rounded-xl border ${style.border} ${style.bg} ${style.glow} hover:brightness-110 cursor-pointer transition-all flex flex-col justify-between overflow-hidden group min-h-[72px]`}
                >
                  {/* Subtle 3D technical illustration on right side */}
                  <div className="absolute right-0 top-0 bottom-0 w-24 pointer-events-none opacity-40 group-hover:opacity-70 transition-opacity">
                    {renderDeckBackgroundGraphic(tile.id)}
                  </div>

                  {/* Icon and chevron */}
                  <div className="flex items-center justify-between relative z-10">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${style.iconBg} shadow-sm`}>
                      {renderIcon(tile.icon, 'w-4 h-4')}
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                  </div>

                  {/* Title and subtitle */}
                  <div className="relative z-10 mt-2">
                    <div className="text-xs font-bold text-white group-hover:text-cyan-200 transition-colors">
                      {isAr ? tile.titleAr : tile.title}
                    </div>
                    <div className="text-[10.5px] text-slate-400 truncate">
                      {isAr ? tile.subtitleAr : tile.subtitle}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </section>

      {/* CUSTOMIZE DECK MODAL */}
      {isCustomizeOpen && (
        <div className="knx-modal-backdrop" onClick={() => setIsCustomizeOpen(false)}>
          <div
            className="knx-modal-card max-w-md"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
                <h3 className="font-bold text-sm text-white">
                  {isAr ? 'تخصيص بطاقات لوحة الأوامر' : "Customize Today's Command Deck"}
                </h3>
              </div>
              <button
                className="text-slate-400 hover:text-white p-1 rounded"
                onClick={() => setIsCustomizeOpen(false)}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400 my-2">
              {isAr
                ? 'قم بتبديل ظهور البطاقات لتناسب نمط عملك اليومي.'
                : 'Toggle visible tiles to tailor your command workspace.'}
            </p>

            <div className="grid grid-cols-2 gap-2 my-2 max-h-60 overflow-y-auto pr-1">
              {deckTiles.map((tile) => (
                <div
                  key={tile.id}
                  className={`p-2 rounded-lg border flex items-center justify-between cursor-pointer transition ${
                    tile.isVisible
                      ? 'bg-slate-800/80 border-cyan-500/40 text-slate-200'
                      : 'bg-slate-900/40 border-slate-800 text-slate-500'
                  }`}
                  onClick={() => handleTileToggle(tile.id)}
                >
                  <div className="flex items-center gap-2">
                    {renderIcon(tile.icon, 'w-3.5 h-3.5')}
                    <span className="text-xs font-semibold">
                      {isAr ? tile.titleAr : tile.title}
                    </span>
                  </div>
                  {tile.isVisible && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2.5 border-t border-slate-700 text-xs">
              <button
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1.5"
                onClick={handleResetTiles}
              >
                <RotateCcw className="w-3 h-3" />
                <span>{isAr ? 'استعادة الافتراضي' : 'Reset to Default'}</span>
              </button>
              <button
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold"
                onClick={() => setIsCustomizeOpen(false)}
              >
                {isAr ? 'تم وحفظ' : 'Done & Apply'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export interface HomeCommandCenterProps {
  locale?: string;
  onNavigate: (page: PageId | string) => void;
  onOpenPalette?: () => void;
  renderDeck?: boolean;
}

export const HomeCommandCenter: React.FC<HomeCommandCenterProps> = ({
  locale = 'en',
  onNavigate,
  onOpenPalette,
  renderDeck = true,
}) => {
  const isAr = locale === 'ar';
  const [kpis] = useState<KpiMetric[]>(INITIAL_KPIS);
  const [searchDraft, setSearchDraft] = useState('');

  return (
    <div className="flex flex-col gap-3 relative z-10 shrink-0">
      {/* REGION A: HERO BANNER WITH ATMOSPHERIC EARTH HORIZON */}
      <section className="relative min-h-[96px] pt-1 pb-1 flex flex-col justify-between overflow-hidden" aria-label="Hero Command Center">
        {/* Full-width curved Earth Horizon scene across the top */}
        <EarthHorizonScene isAr={isAr} />

        {/* Top Header Row inside Hero: Title, Subtitle, and Right Tagline */}
        <div className="flex items-start justify-between relative z-10">
          <div>
            <h1 className="text-2xl sm:text-[27px] font-extrabold text-white tracking-tight leading-tight">
              {isAr ? 'مركز قيادة KNOuX الذكي' : 'Home Command Center'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300/90 mt-0.5">
              {isAr
                ? 'نظامك بالكامل في مكان واحد. منظم، محسّن، وتحت سيطرتك المطلقة.'
                : 'Your complete system. Organized, optimized, in control.'}
            </p>
          </div>

          {/* Right vertical tagline matching screenshot exactly */}
          <div className="knx-hero-tagline hidden sm:flex shrink-0 flex-col items-end text-right rtl:text-left text-[11px] leading-tight font-medium text-cyan-300/90 pe-2">
            <div>{isAr ? 'تنظيم' : 'Organize'}</div>
            <div>{isAr ? 'تحسين' : 'Optimize'}</div>
            <div>{isAr ? 'صيانة' : 'Maintain'}</div>
            <div className="text-[10.5px] text-slate-400 pt-0.5 whitespace-nowrap">
              {isAr ? 'كل ذلك في مكان واحد.' : 'All in one place.'}
            </div>
          </div>
        </div>

        {/* Master Command Search Bar matching screenshot */}
        <div
          onClick={() => onOpenPalette && onOpenPalette()}
          className="relative z-10 mt-2 flex items-center w-full px-3.5 py-2 rounded-xl bg-[#081226]/85 border border-[#17325c] hover:border-cyan-500/60 shadow-lg cursor-pointer transition-all group backdrop-blur-sm"
        >
          <Search className="w-4 h-4 text-cyan-400 shrink-0 mr-2.5 group-hover:scale-105 transition-transform" />
          <input
            type="text"
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            placeholder={
              isAr
                ? 'ابحث عن ملفات، تطبيقات، إعدادات، أو نفذ إجراء فورياً...'
                : 'Search for files, applications, settings, or run a command...'
            }
            className="bg-transparent border-none outline-none text-slate-200 placeholder-slate-400 text-xs sm:text-sm w-full cursor-pointer"
            onFocus={() => onOpenPalette && onOpenPalette()}
          />
          <kbd className="px-2 py-0.5 rounded bg-[#0d213d] text-[10px] font-mono text-cyan-300 border border-[#1b3f70] shrink-0 ml-2">
            Ctrl + K
          </kbd>
        </div>
      </section>

      {/* REGION B: SIX HORIZONTAL KPI CARDS MATCHING SCREENSHOT EXACTLY */}
      <section className="grid grid-cols-6 gap-2.5" aria-label="Key Performance Indicators">
        {kpis.map((kpi) => {
          return (
            <div
              key={kpi.id}
              onClick={() => onNavigate(kpi.targetPage)}
              className="p-2.5 rounded-xl bg-[#071329]/80 border border-[#152e50] hover:border-cyan-500/50 hover:bg-[#0a1a36] transition-all cursor-pointer flex flex-col justify-between group shadow-sm min-h-[72px]"
            >
              {/* Header row with Icon, title, and badge/sparkline */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center border shadow-sm"
                    style={{
                      borderColor: `${kpi.color}40`,
                      backgroundColor: `${kpi.color}15`,
                      color: kpi.color,
                    }}
                  >
                    {renderIcon(kpi.icon, 'w-3.5 h-3.5')}
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold text-slate-300 group-hover:text-white transition-colors truncate">
                      {isAr ? kpi.titleAr : kpi.title}
                    </div>
                    {kpi.badge && (
                      <span className="text-[10px] font-medium text-emerald-400 flex items-center gap-1">
                        {kpi.badge}
                      </span>
                    )}
                  </div>
                </div>

                {/* Sparkline curve or 7 vertical microbars */}
                {kpi.id === 'kpi-health' ? (
                  <svg className="w-12 h-6" viewBox="0 0 50 20" fill="none">
                    <path
                      d="M 2 16 Q 14 18 24 10 T 40 8 T 48 3"
                      stroke="#10b981"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                    />
                  </svg>
                ) : (
                  <div className="flex items-end gap-0.5 h-5 pr-1">
                    <span className="w-1 rounded-sm bg-cyan-400/40" style={{ height: '35%', backgroundColor: kpi.color, opacity: 0.4 }} />
                    <span className="w-1 rounded-sm bg-cyan-400/50" style={{ height: '55%', backgroundColor: kpi.color, opacity: 0.6 }} />
                    <span className="w-1 rounded-sm bg-cyan-400/60" style={{ height: '45%', backgroundColor: kpi.color, opacity: 0.5 }} />
                    <span className="w-1 rounded-sm bg-cyan-400/70" style={{ height: '70%', backgroundColor: kpi.color, opacity: 0.75 }} />
                    <span className="w-1 rounded-sm bg-cyan-400/80" style={{ height: '60%', backgroundColor: kpi.color, opacity: 0.7 }} />
                    <span className="w-1 rounded-sm bg-cyan-400/90" style={{ height: '85%', backgroundColor: kpi.color, opacity: 0.9 }} />
                    <span className="w-1 rounded-sm bg-cyan-400" style={{ height: '100%', backgroundColor: kpi.color, opacity: 1 }} />
                  </div>
                )}
              </div>

              {/* Metric Value & Subtext */}
              <div className="mt-1">
                <div dir="ltr" className="text-base sm:text-lg font-black text-white tracking-tight flex items-baseline justify-end gap-1">
                  <span>{kpi.value}</span>
                  {kpi.id === 'kpi-health' && <span className="text-xs font-normal text-slate-400">/ 100</span>}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  {isAr ? kpi.subtextAr : kpi.subtext}
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* REGION C: TODAY'S COMMAND DECK (IF INCLUDED DIRECTLY) */}
      {renderDeck && (
        <HomeCommandDeck locale={locale} onNavigate={onNavigate} />
      )}
    </div>
  );
};
