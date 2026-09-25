import {
  Activity, AppWindow, BatteryCharging, CalendarClock, Cpu, FolderOpen, HardDrive, History,
  LayoutDashboard, Network, Rocket, ScanSearch, Server, Settings, ShieldPlus, Trash2
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Locale } from '../locales';

export type PageId =
  | 'home' | 'scan' | 'storage' | 'files' | 'applications' | 'cleanup' | 'startup'
  | 'system' | 'repair' | 'services' | 'network' | 'hardware' | 'automation' | 'history' | 'settings';

export type GroupId = 'home' | 'organize' | 'optimize' | 'care' | 'automation' | 'system';

export interface PageDef {
  id: PageId;
  nameKey: string;
  icon: LucideIcon;
  group: GroupId;
}

const page = (id: PageId, nameKey: string, icon: LucideIcon, group: GroupId): PageDef => ({ id, nameKey, icon, group });

export const pageGroups: Array<{ id: GroupId; nameKey: string; pages: PageDef[] }> = [
  { id: 'home', nameKey: 'nav.group.home', pages: [
    page('home', 'nav.home', LayoutDashboard, 'home'),
    page('scan', 'nav.scan', ScanSearch, 'home')
  ] },
  { id: 'organize', nameKey: 'nav.group.organize', pages: [
    page('storage', 'nav.storage', HardDrive, 'organize'),
    page('files', 'nav.files', FolderOpen, 'organize'),
    page('applications', 'nav.apps', AppWindow, 'organize')
  ] },
  { id: 'optimize', nameKey: 'nav.group.optimize', pages: [
    page('cleanup', 'nav.cleanup', Trash2, 'optimize'),
    page('startup', 'nav.startup', Rocket, 'optimize'),
    page('system', 'nav.system', Activity, 'optimize')
  ] },
  { id: 'care', nameKey: 'nav.group.care', pages: [
    page('repair', 'nav.repair', ShieldPlus, 'care'),
    page('services', 'nav.services', Server, 'care'),
    page('network', 'nav.network', Network, 'care'),
    page('hardware', 'nav.hardware', BatteryCharging, 'care')
  ] },
  { id: 'automation', nameKey: 'nav.group.automation', pages: [
    page('automation', 'nav.automation', CalendarClock, 'automation'),
    page('history', 'nav.history', History, 'automation')
  ] },
  { id: 'system', nameKey: 'nav.group.system', pages: [
    page('settings', 'nav.settings', Settings, 'system')
  ] }
];

// hardware page owns battery-status + hardware-inventory; keep Cpu icon semantics for nav
export const pages: PageDef[] = pageGroups.flatMap(group => group.pages);
pages.forEach(item => { if (item.id === 'hardware') item.icon = Cpu; });

export const pageIds = new Set<string>(pages.map(item => item.id));

export function pageDef(id: string): PageDef | undefined {
  return pages.find(item => item.id === id);
}

/** Page title translation key: categories use the tools catalogue title. */
export function pageTitleKey(id: PageId): string {
  if (id === 'home') return 'home.title';
  if (id === 'history') return 'history.title';
  if (id === 'settings') return 'settings.title';
  if (id === 'automation') return 'nav.automation';
  return 'tools.title';
}

export function isCatalogPage(id: PageId): boolean {
  return !['home', 'scan', 'automation', 'history', 'settings'].includes(id);
}

export function pageSubtitleKey(id: PageId): string | null {
  if (id === 'home') return 'home.subtitle';
  if (id === 'history') return 'history.subtitle';
  if (id === 'settings') return 'settings.subtitle';
  if (id === 'automation') return 'automation.subtitle';
  if (id === 'scan') return 'smartScan.subtitle';
  return null;
}

export const localeLabel = (locale: Locale) => (locale === 'ar' ? 'EN' : 'ع');
