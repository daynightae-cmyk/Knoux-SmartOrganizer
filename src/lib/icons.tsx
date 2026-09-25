import {
  Activity, AppWindow, BatteryCharging, Cable, CalendarClock, CircleOff, Copy, Cpu, Download,
  FileCheck2, FileCog, FileStack, Fingerprint, FolderCog, FolderInput, FolderOpen, FolderSearch2,
  HardDrive, History, LayoutDashboard, ListTree, Network, Rocket, Router, ScanSearch,
  Settings, Server, ShieldCheck, ShieldPlus, SlidersHorizontal, Trash2, TriangleAlert,
  Undo2, Wrench
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const toolIcons: Record<string, LucideIcon> = {
  Activity, AppWindow, BatteryCharging, Cable, CircleOff, Copy, Cpu, Download, FileCheck2,
  FileCog, FileStack, Fingerprint, FolderCog, FolderInput, FolderOpen, FolderSearch2, HardDrive,
  ListTree, Network, Rocket, Router, ScanSearch, Server, ShieldCheck, ShieldPlus,
  SlidersHorizontal, Trash2, TriangleAlert, Undo2, Wrench
};

export function toolIcon(name: string | undefined): LucideIcon {
  return (name && toolIcons[name]) || Wrench;
}

export const pageIcons: Record<string, LucideIcon> = {
  home: LayoutDashboard,
  scan: ScanSearch,
  storage: HardDrive,
  files: FolderOpen,
  applications: AppWindow,
  cleanup: Trash2,
  startup: Rocket,
  system: Activity,
  repair: ShieldPlus,
  services: Server,
  network: Network,
  hardware: Cpu,
  automation: CalendarClock,
  history: History,
  settings: Settings
};

export function pageIcon(page: string): LucideIcon {
  return pageIcons[page] || Wrench;
}
