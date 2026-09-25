import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { AppSettings, OperationEvent, OperationRecord, ToolDefinition, ToolResult } from '@shared/contracts';
import { dictionaries, direction, type Locale } from '../locales';
import { canRunTool, isActivePhase } from '../lib/guards';
import type { PageId } from '../lib/pages';
import { pageIds } from '../lib/pages';
import type { ActiveOperation, AppInfo, AutomationSchedule } from './types';

export type Translate = (key: string) => string;

interface Store {
  tools: ToolDefinition[];
  settings: AppSettings | null;
  appInfo: AppInfo | null;
  history: OperationRecord[];
  automations: AutomationSchedule[];
  health: Record<string, unknown> | null;
  page: PageId;
  selectedId: string | null;
  query: string;
  event: OperationEvent | null;
  result: ToolResult | null;
  notice: string;
  booted: boolean;
  bootError: string;
  operationOpen: boolean;
  paletteOpen: boolean;
  sidebarCollapsed: boolean;
  active: ActiveOperation | null;
  locale: Locale;
  t: Translate;
  setPage: (page: PageId) => void;
  setSelectedId: (id: string | null) => void;
  setQuery: (query: string) => void;
  setNotice: (notice: string) => void;
  setOperationOpen: (open: boolean) => void;
  setPaletteOpen: (open: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  openTool: (tool: ToolDefinition) => void;
  run: (tool: ToolDefinition, override?: Record<string, unknown>, silent?: boolean) => Promise<ToolResult | null>;
  runById: (toolId: string, override?: Record<string, unknown>, silent?: boolean) => Promise<ToolResult | null>;
  cancel: () => Promise<void>;
  update: (patch: Partial<AppSettings>) => Promise<void>;
  refreshAutomations: () => Promise<void>;
  folder: string;
  file: string;
  chooseFolder: () => Promise<string | null>;
  chooseFile: () => Promise<string | null>;
}

const StoreContext = createContext<Store | null>(null);

function translate(locale: Locale, key: string): string {
  return dictionaries[locale][key] || dictionaries.en[key] || key;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [tools, setTools] = useState<ToolDefinition[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null);
  const [page, setPageState] = useState<PageId>('home');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [event, setEvent] = useState<OperationEvent | null>(null);
  const [result, setResult] = useState<ToolResult | null>(null);
  const [history, setHistory] = useState<OperationRecord[]>([]);
  const [automations, setAutomations] = useState<AutomationSchedule[]>([]);
  const [health, setHealth] = useState<Record<string, unknown> | null>(null);
  const [operationOpen, setOperationOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [notice, setNotice] = useState('');
  const [booted, setBooted] = useState(false);
  const [bootError, setBootError] = useState('');
  const [folder, setFolder] = useState('');
  const [file, setFile] = useState('');
  const startedAt = useRef(Date.now());
  const noticeTimer = useRef<number | undefined>(undefined);

  const locale: Locale = settings?.localization.locale || 'ar';
  const t = useCallback<Translate>((key: string) => translate(locale, key), [locale]);

  const flash = useCallback((message: string) => {
    setNotice(message);
    window.clearTimeout(noticeTimer.current);
    if (message) noticeTimer.current = window.setTimeout(() => setNotice(''), 4000);
  }, []);

  useEffect(() => {
    const appearance = settings?.appearance;
    const theme = appearance?.theme === 'system'
      ? (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
      : appearance?.theme || 'dark';
    document.documentElement.lang = locale;
    document.documentElement.dir = direction(locale);
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.density = appearance?.density || 'comfortable';
    document.documentElement.dataset.accent = appearance?.accent || 'violet';
    document.documentElement.dataset.motion = appearance?.reduceMotion || !appearance?.animations ? 'reduced' : 'full';
    document.documentElement.dataset.transparency = appearance?.transparency ? 'on' : 'off';
    document.documentElement.style.setProperty('--font-scale', String(appearance?.fontScale || 1));
  }, [locale, settings]);

  const setPage = useCallback((next: PageId) => {
    setPageState(next);
    setQuery('');
  }, []);

  const openTool = useCallback((tool: ToolDefinition) => {
    setSelectedId(tool.id);
    if (tool.category === 'scan') setPageState('scan');
    else if ((pageIds as Set<string>).has(tool.category)) setPageState(tool.category as PageId);
  }, []);

  const run = useCallback(async (tool: ToolDefinition, override: Record<string, unknown> = {}, silent = false): Promise<ToolResult | null> => {
    if (!canRunTool(tool)) {
      flash(tool.availability.reason || translate(locale, 'tools.unavailable'));
      return null;
    }
    setSelectedId(tool.id);
    setResult(null);
    if (!silent) setOperationOpen(true);
    startedAt.current = Date.now();
    try {
      const completed = await window.knoux.runTool({ toolId: tool.id, inputs: override });
      setResult(completed);
      if (tool.id === 'system-health' && completed.success) setHealth(completed.summary);
      return completed;
    } catch (error) {
      flash(String((error as Error)?.message || error));
      return null;
    }
  }, [flash, locale]);

  const runById = useCallback(async (toolId: string, override: Record<string, unknown> = {}, silent = false) => {
    const tool = tools.find(item => item.id === toolId) ?? null;
    if (!tool) {
      flash(`${translate(locale, 'tools.unavailable')}: ${toolId}`);
      return null;
    }
    return run(tool, override, silent);
  }, [tools, run, flash, locale]);

  const cancel = useCallback(async () => {
    if (!event) return;
    try {
      await window.knoux.cancelOperation(event.operationId);
    } catch (error) {
      flash(String((error as Error)?.message || error));
    }
  }, [event, flash]);

  const update = useCallback(async (patch: Partial<AppSettings>) => {
    const next = await window.knoux.updateSettings(patch);
    setSettings(next);
    flash(translate(next.localization.locale, 'settings.saved'));
  }, [flash]);

  const refreshAutomations = useCallback(async () => {
    setAutomations(await window.knoux.listAutomations());
  }, []);

  const chooseFolder = useCallback(async () => {
    const chosen = await window.knoux.chooseFolder();
    if (chosen) setFolder(chosen);
    return chosen;
  }, []);
  const chooseFile = useCallback(async () => {
    const chosen = await window.knoux.chooseFile();
    if (chosen) setFile(chosen);
    return chosen;
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      window.knoux.listTools(),
      window.knoux.getSettings(),
      window.knoux.listHistory(),
      window.knoux.appInfo(),
      window.knoux.listAutomations()
    ]).then(([toolList, appSettings, records, info, schedules]) => {
      if (cancelled) return;
      setTools(toolList);
      setSettings(appSettings);
      setHistory(records);
      setAppInfo(info);
      setAutomations(schedules);
      if (appSettings.general.restorePreviousPage && typeof appSettings.window.lastPage === 'string' && (pageIds as Set<string>).has(appSettings.window.lastPage)) {
        setPageState(appSettings.window.lastPage as PageId);
      }
      setBooted(true);
      const healthTool = toolList.find(tool => tool.id === 'system-health');
      if (healthTool?.availability.available) {
        window.knoux.runTool({ toolId: 'system-health', inputs: {} })
          .then(completed => { if (!cancelled && completed.success) setHealth(completed.summary); })
          .catch(() => {});
      }
    }).catch(error => {
      if (cancelled) return;
      setBootError(String((error as Error)?.message || error));
      setBooted(true);
    });
    const removeSettings = window.knoux.onSettingsChanged(next => setSettings(next));
    const removeOperation = window.knoux.onOperationEvent(next => {
      setEvent(next);
      if (next.result) {
        setResult(next.result);
        setHistory(records => [
          { ...next.result!, action: next.toolId, durationMs: Date.now() - new Date(next.result!.startedAt).getTime(), undoAvailable: Boolean(next.result!.undoMetadata) },
          ...records.filter(item => item.operationId !== next.operationId)
        ]);
        if (next.toolId === 'system-health' && next.result.success) setHealth(next.result.summary);
      }
      if (isActivePhase(next.phase)) setOperationOpen(true);
    });
    return () => { cancelled = true; removeSettings(); removeOperation(); };
  }, []);

  useEffect(() => {
    if (settings?.general.restorePreviousPage && settings.window.lastPage !== page) {
      window.knoux.updateSettings({ window: { ...settings.window, lastPage: page } })
        .then(setSettings)
        .catch(() => {});
    }
  }, [page, settings]);

  const active: ActiveOperation | null = useMemo(() => {
    if (!event || !isActivePhase(event.phase)) return null;
    return { event, elapsedMs: Date.now() - startedAt.current };
  }, [event]);

  const value: Store = {
    tools, settings, appInfo, history, automations, health, page, selectedId, query,
    event, result, notice, booted, bootError, operationOpen, paletteOpen, sidebarCollapsed,
    active, locale, t, setPage, setSelectedId, setQuery, setNotice: flash,
    setOperationOpen, setPaletteOpen, setSidebarCollapsed, openTool, run, runById,
    cancel, update, refreshAutomations, folder, file, chooseFolder, chooseFile
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const store = useContext(StoreContext);
  if (!store) throw new Error('StoreProvider is missing.');
  return store;
}
