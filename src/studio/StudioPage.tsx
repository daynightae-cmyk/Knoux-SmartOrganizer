import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../state/store';
import { CATEGORY_ORDER, describeError, studioCopy } from './copy';
import {
  StudioContext,
  type BasketAll,
  type BasketCategory,
  type BasketCategoryInfo,
  type BasketFile,
  type BasketItem,
  type CategoryDestinationChoice,
  type DestinationChoice,
  type ExecutionLive,
  type FocusedFile,
  type InsightState,
  type LibraryFilters,
  type ScanRunning,
  type StudioContextValue,
  type StudioSurface
} from './context';
import { StudioBanners, StudioHero, StudioStage, SurfaceRail } from './panels';
import { StudioCommandCenter } from './StudioCommandCenter';
import type {
  DestinationAuthorization,
  ExecutionResult,
  FileInfo,
  JournalOperation,
  OrganizationMode,
  OrganizationPlan,
  PageResult,
  PlanRequest,
  PlanSelection,
  ScanSummary,
  Source,
  StudioBridge,
  StudioCategoryKey,
  StudioView,
  CollisionPolicy
} from './types';
import './styles/studio.css';

const DEFAULT_FILTERS: LibraryFilters = {
  search: '',
  category: 'all',
  ext: '',
  size: 'any',
  date: 'any',
  sort: 'name',
  desc: false,
  offset: 0,
  limit: 48
};

const EMPTY_INSIGHT: InsightState = { loading: false, largeCount: 0, largeBytes: 0, largestName: null };

export default function StudioPage() {
  const { locale } = useStore();
  const t = studioCopy[locale];
  const bridge = typeof window !== 'undefined' ? window.knouxStudio : undefined;
  if (!bridge) {
    return (
      <div className="st-root st-root--unavailable">
        <div className="st-unavailable">
          <strong>{t.bridgeUnavailable}</strong>
          <p>{t.bridgeHint}</p>
        </div>
      </div>
    );
  }
  return <StudioWorkspace bridge={bridge} locale={locale} />;
}

function StudioWorkspace({ bridge, locale }: { bridge: StudioBridge; locale: 'ar' | 'en' }) {
  const t = studioCopy[locale];

  const [surface, setSurface] = useState<StudioSurface>('sources');
  const [sources, setSources] = useState<Source[]>([]);
  const [saved, setSaved] = useState<Record<string, ScanSummary>>({});
  const [sourcesLoading, setSourcesLoading] = useState(true);
  const [activeSourceId, setActiveSourceIdState] = useState<string | null>(null);
  const [scanRunning, setScanRunning] = useState<ScanRunning | null>(null);
  const scanOperation = useRef<{ sourceId: string; operationId: string } | null>(null);

  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const [filters, setFilters] = useState<LibraryFilters>(DEFAULT_FILTERS);
  const [page, setPage] = useState<PageResult | null>(null);
  const [pageLoading, setPageLoading] = useState(false);
  const queryGeneration = useRef(0);

  const [view, setView] = useState<StudioView>('grid');
  const [focused, setFocused] = useState<FocusedFile | null>(null);
  const [basket, setBasket] = useState<BasketItem[]>([]);

  const [destinations, setDestinations] = useState<DestinationAuthorization[]>([]);
  const [destination, setDestinationState] = useState<DestinationChoice | null>(null);

  const [mode, setMode] = useState<OrganizationMode>('copy');
  const [structure, setStructure] = useState<'categorized' | 'flat'>('categorized');
  const [collisionPolicy, setCollisionPolicy] = useState<CollisionPolicy>('review');
  const [folderNames, setFolderNames] = useState<Record<string, string>>({});
  const [categoryDestinations, setCategoryDestinations] = useState<Partial<Record<StudioCategoryKey, CategoryDestinationChoice>>>({});
  const [planBuilding, setPlanBuilding] = useState(false);
  const [plan, setPlan] = useState<OrganizationPlan | null>(null);

  const [executing, setExecuting] = useState(false);
  const [executionLive, setExecutionLive] = useState<ExecutionLive | null>(null);
  const [lastExecution, setLastExecution] = useState<ExecutionResult | null>(null);

  const [history, setHistory] = useState<JournalOperation[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [insight, setInsight] = useState<InsightState>(EMPTY_INSIGHT);

  const activeSource = useMemo(() => sources.find((source) => source.id === activeSourceId) ?? null, [sources, activeSourceId]);
  const inventory = activeSourceId ? saved[activeSourceId] ?? null : null;
  const inventoryId = inventory?.inventoryId ?? null;

  const notify = useCallback((message: string) => {
    setNotice(message);
    setError('');
  }, []);

  const dismissBanner = useCallback(() => {
    setNotice('');
    setError('');
  }, []);

  const goto = useCallback((next: StudioSurface) => {
    setSurface(next);
    window.requestAnimationFrame(() => {
      document.getElementById('studio-stage')?.scrollIntoView({ block: 'nearest' });
    });
  }, []);

  const setActiveSourceId = useCallback((id: string) => {
    setActiveSourceIdState(id);
    setPage(null);
    setError('');
  }, []);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const records = await bridge.listHistory();
      setHistory(records);
    } catch (cause) {
      const detail = describeError(cause, locale);
      setError(`${t.errorTitle}: ${detail.message}`);
    } finally {
      setHistoryLoading(false);
    }
  }, [bridge, locale, t.errorTitle]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [sourceList, destinationList] = await Promise.all([
          bridge.listSources(),
          bridge.listDestinations()
        ]);
        if (!alive) return;
        setSources(sourceList);
        const seeded: Record<string, ScanSummary> = {};
        for (const source of sourceList) {
          if (source.inventory) seeded[source.id] = source.inventory;
        }
        setSaved((previous) => ({ ...seeded, ...previous }));
        setDestinations(destinationList);
        setActiveSourceIdState((previous) => previous ?? sourceList[0]?.id ?? null);
      } catch (cause) {
        if (!alive) return;
        const detail = describeError(cause, locale);
        setError(`${t.errorTitle}: ${detail.message}`);
      } finally {
        if (alive) setSourcesLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [bridge, locale, t.errorTitle]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(''), 4800);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    const remove = bridge.onEvent((event) => {
      if (event.type === 'scan') {
        const current = scanOperation.current;
        if (current && event.operationId === current.operationId) {
          setScanRunning((previous) => previous && previous.operationId === current.operationId
            ? {
                ...previous,
                files: Number(event.files ?? previous.files) || 0,
                folders: Number(event.folders ?? previous.folders) || 0,
                bytes: Number(event.bytes ?? previous.bytes) || 0
              }
            : previous);
        }
        return;
      }
      if (event.type !== 'execution') return;
      const terminal = ['completed', 'partial', 'cancelled', 'failed'].includes(event.phase);
      setExecutionLive((previous) => {
        const base: ExecutionLive = previous && previous.operationId === event.operationId
          ? previous
          : {
              operationId: event.operationId,
              planId: event.planId ?? null,
              phase: 'started',
              processed: 0,
              total: 0,
              bytes: 0,
              totalBytes: 0,
              completed: 0,
              failed: 0,
              cancelled: 0,
              currentName: null,
              message: null
            };
        return {
          ...base,
          operationId: event.operationId,
          planId: event.planId ?? base.planId,
          phase: event.phase,
          processed: Number(event.processed ?? (terminal && event.summary && 'totalFiles' in event.summary ? event.summary.completedFiles + event.summary.failedFiles + event.summary.cancelledFiles : base.processed)) || 0,
          total: Number(event.total ?? event.totalFiles ?? base.total) || 0,
          bytes: Number(event.bytes ?? base.bytes) || 0,
          totalBytes: Number(event.totalBytes ?? base.totalBytes) || 0,
          completed: Number(event.completed ?? base.completed) || 0,
          failed: Number(event.failed ?? base.failed) || 0,
          cancelled: Number(event.cancelled ?? base.cancelled) || 0,
          currentName: event.currentName ?? (terminal ? null : base.currentName),
          message: event.message ?? base.message,
          summary: event.summary && 'totalFiles' in event.summary ? event.summary : base.summary
        };
      });
      if (terminal) void loadHistory();
    });
    return remove;
  }, [bridge, loadHistory]);

  useEffect(() => {
    setFilters(DEFAULT_FILTERS);
    setPage(null);
  }, [activeSourceId]);

  useEffect(() => {
    if (!inventoryId) {
      setPage(null);
      setPageLoading(false);
      return;
    }
    const generation = ++queryGeneration.current;
    setPageLoading(true);
    const timer = window.setTimeout(() => {
      const now = Date.now();
      let minBytes: number | undefined;
      let maxBytes: number | undefined;
      if (filters.size === 'tiny') maxBytes = 1024 * 1024 - 1;
      if (filters.size === 'small') { minBytes = 1024 * 1024; maxBytes = 50 * 1024 * 1024; }
      if (filters.size === 'medium') { minBytes = 50 * 1024 * 1024; maxBytes = 500 * 1024 * 1024; }
      if (filters.size === 'large') minBytes = 500 * 1024 * 1024;
      if (filters.size === 'from50') minBytes = 50 * 1024 * 1024;
      let modifiedAfter: number | undefined;
      if (filters.date === 'week') modifiedAfter = now - 7 * 86400000;
      if (filters.date === 'month') modifiedAfter = now - 30 * 86400000;
      if (filters.date === 'year') modifiedAfter = now - 365 * 86400000;
      bridge.query({
        inventoryId,
        category: filters.category,
        search: filters.search,
        sort: filters.sort,
        desc: filters.desc,
        offset: filters.offset,
        limit: filters.limit,
        extensions: filters.ext ? [filters.ext] : [],
        minBytes,
        maxBytes,
        modifiedAfter
      }).then((result) => {
        if (generation === queryGeneration.current) {
          setPage(result);
          setPageLoading(false);
        }
      }).catch((cause) => {
        if (generation !== queryGeneration.current) return;
        const detail = describeError(cause, locale);
        setError(`${t.errorTitle}: ${detail.message}`);
        setPage(null);
        setPageLoading(false);
        if (detail.code === 'STUDIO_INDEX_NOT_FOUND' || detail.code === 'STUDIO_INDEX_EXPIRED') {
          queryGeneration.current += 1;
        }
      });
    }, 180);
    return () => { window.clearTimeout(timer); queryGeneration.current += 1; };
  }, [bridge, inventoryId, filters, locale, t.errorTitle]);

  useEffect(() => {
    if (!inventoryId) {
      setInsight(EMPTY_INSIGHT);
      return;
    }
    let alive = true;
    setInsight((previous) => ({ ...previous, loading: true }));
    Promise.all([
      bridge.query({ inventoryId, minBytes: 50 * 1024 * 1024, limit: 1, sort: 'size', desc: true }),
      bridge.query({ inventoryId, limit: 1, sort: 'size', desc: true })
    ]).then(([large, largest]) => {
      if (!alive) return;
      setInsight({
        loading: false,
        largeCount: large.total,
        largeBytes: large.bytes,
        largestName: largest.rows[0]?.name ?? null
      });
    }).catch(() => {
      if (alive) setInsight(EMPTY_INSIGHT);
    });
    return () => { alive = false; };
  }, [bridge, inventoryId]);

  const beginScan = useCallback(async (sourceId: string) => {
    if (scanOperation.current) return;
    const operationId = crypto.randomUUID();
    scanOperation.current = { sourceId, operationId };
    setScanRunning({ sourceId, operationId, files: 0, folders: 0, bytes: 0 });
    setError('');
    try {
      const result = await bridge.scan({ sourceId, operationId });
      if ('cancelled' in result && result.cancelled === true) {
        setNotice(t.scanCancelledNotice);
        return;
      }
      if (!('inventoryId' in result)) throw new Error('Invalid scan result');
      const summary = result as ScanSummary;
      setSaved((previous) => ({ ...previous, [sourceId]: summary }));
      setSources((previous) => previous.map((source) => source.id === sourceId ? { ...source, inventory: summary } : source));
      setBasket((previous) => previous.filter((item) => item.sourceId !== sourceId));
      setFocused((previous) => previous?.source.id === sourceId ? null : previous);
      setPlan(null);
      setNotice(summary.partial ? t.scanPartialNotice : t.sourceIndexedNow);
      setSurface('library');
    } catch (cause) {
      const detail = describeError(cause, locale);
      setError(`${t.errorTitle}: ${detail.message}`);
    } finally {
      if (scanOperation.current?.operationId === operationId) scanOperation.current = null;
      setScanRunning(null);
    }
  }, [bridge, locale, t]);

  const pickSource = useCallback(async () => {
    try {
      const picked = await bridge.pickSource();
      if (!picked) return;
      setSources((previous) => previous.some((source) => source.id === picked.id) ? previous : [...previous, picked]);
      setActiveSourceIdState(picked.id);
      setSurface('library');
      if (!saved[picked.id] && !picked.inventory) await beginScan(picked.id);
    } catch (cause) {
      const detail = describeError(cause, locale);
      setError(`${t.errorTitle}: ${detail.message}`);
    }
  }, [beginScan, bridge, locale, saved, t.errorTitle]);

  const cancelScan = useCallback(async () => {
    if (!scanRunning) return;
    try {
      await bridge.cancel(scanRunning.operationId);
    } catch (cause) {
      const detail = describeError(cause, locale);
      setError(`${t.errorTitle}: ${detail.message}`);
    }
  }, [bridge, locale, scanRunning, t.errorTitle]);

  const removeSource = useCallback(async (sourceId: string) => {
    try {
      if (scanRunning?.sourceId === sourceId) {
        await bridge.cancel(scanRunning.operationId).catch(() => false);
      }
      await bridge.removeSource(sourceId);
      setSources((previous) => previous.filter((source) => source.id !== sourceId));
      setSaved((previous) => {
        const next = { ...previous };
        delete next[sourceId];
        return next;
      });
      setBasket((previous) => previous.filter((item) => item.sourceId !== sourceId));
      setFocused((previous) => previous?.source.id === sourceId ? null : previous);
      setPlan(null);
      setActiveSourceIdState((previous) => {
        if (previous !== sourceId) return previous;
        return sources.find((source) => source.id !== sourceId)?.id ?? null;
      });
      setNotice(t.sourceRemoved);
    } catch (cause) {
      const detail = describeError(cause, locale);
      setError(`${t.errorTitle}: ${detail.message}`);
    }
  }, [bridge, locale, scanRunning, sources, t.errorTitle, t.sourceRemoved]);

  const updateFilters = useCallback((patch: Partial<LibraryFilters>) => {
    setFilters((previous) => ({
      ...previous,
      ...patch,
      offset: Object.prototype.hasOwnProperty.call(patch, 'offset') ? patch.offset ?? 0 : 0
    }));
  }, []);

  const resetFilters = useCallback(() => setFilters(DEFAULT_FILTERS), []);

  const focusFile = useCallback((source: Source, file: FileInfo) => {
    setFocused({ source, file });
    setSurface('details');
  }, []);

  const isFileCovered = useCallback((inventoryIdValue: string, category: StudioCategoryKey) => (
    basket.some((item) => item.inventoryId === inventoryIdValue
      && (item.kind === 'all' || (item.kind === 'category' && item.category === category)))
  ), [basket]);

  const isFileSelected = useCallback((inventoryIdValue: string, file: FileInfo) => {
    if (basket.some((item) => item.kind === 'file' && item.inventoryId === inventoryIdValue && item.file.id === file.id)) return true;
    return isFileCovered(inventoryIdValue, file.category);
  }, [basket, isFileCovered]);

  const toggleFile = useCallback((source: Source, file: FileInfo) => {
    const index = saved[source.id];
    if (!index) {
      notify(t.notScanned);
      return;
    }
    const key = `f:${index.inventoryId}:${file.id}`;
    if (isFileCovered(index.inventoryId, file.category)) {
      notify(t.inPlan);
      return;
    }
    setBasket((previous) => {
      if (previous.some((item) => item.key === key)) return previous.filter((item) => item.key !== key);
      const item: BasketFile = {
        kind: 'file',
        key,
        sourceId: source.id,
        sourceName: source.name,
        inventoryId: index.inventoryId,
        file
      };
      return [...previous, item];
    });
  }, [isFileCovered, notify, saved, t.inPlan]);

  const addCategory = useCallback((source: Source, category: StudioCategoryKey) => {
    const index = saved[source.id];
    const stat = index?.categories.find((entry) => entry.key === category);
    if (!index || !stat) {
      notify(t.noFiles);
      return;
    }
    if (basket.some((item) => item.inventoryId === index.inventoryId && item.kind === 'all')) {
      notify(t.groupAlready);
      return;
    }
    if (basket.some((item) => item.inventoryId === index.inventoryId && item.kind === 'category' && item.category === category)) {
      notify(t.groupAlready);
      return;
    }
    const item: BasketCategory = {
      kind: 'category',
      key: `c:${index.inventoryId}:${category}`,
      sourceId: source.id,
      sourceName: source.name,
      inventoryId: index.inventoryId,
      category,
      count: stat.count,
      bytes: stat.bytes
    };
    setBasket((previous) => [
      ...previous.filter((entry) => !(entry.inventoryId === index.inventoryId && entry.kind === 'file' && entry.file.category === category)),
      item
    ]);
    notify(t.groupAdded);
  }, [basket, notify, saved, t]);

  const addAll = useCallback((source: Source) => {
    const index = saved[source.id];
    if (!index) {
      notify(t.notScanned);
      return;
    }
    if (basket.some((item) => item.inventoryId === index.inventoryId && item.kind === 'all')) {
      notify(t.groupAlready);
      return;
    }
    const item: BasketAll = {
      kind: 'all',
      key: `a:${index.inventoryId}`,
      sourceId: source.id,
      sourceName: source.name,
      inventoryId: index.inventoryId,
      count: index.totalFiles,
      bytes: index.totalBytes,
      categories: index.categories
    };
    setBasket((previous) => [
      ...previous.filter((entry) => entry.inventoryId !== index.inventoryId),
      item
    ]);
    notify(t.groupAdded);
  }, [basket, notify, saved, t.groupAlready, t.groupAdded, t.notScanned]);

  const removeBasketItem = useCallback((key: string) => {
    setBasket((previous) => previous.filter((item) => item.key !== key));
  }, []);

  const clearBasket = useCallback(() => {
    setBasket([]);
    notify(t.basketCleared);
  }, [notify, t.basketCleared]);

  const basketCategories = useMemo<BasketCategoryInfo[]>(() => {
    const map = new Map<StudioCategoryKey, { count: number; bytes: number; sources: Set<string> }>();
    const allInventory = new Set<string>();
    const categoryGroups = new Set<string>();
    for (const item of basket) {
      if (item.kind === 'all') allInventory.add(item.inventoryId);
      if (item.kind === 'category') categoryGroups.add(`${item.inventoryId}:${item.category}`);
    }
    const add = (category: StudioCategoryKey, count: number, bytes: number, sourceId: string) => {
      const current = map.get(category) ?? { count: 0, bytes: 0, sources: new Set<string>() };
      current.count += count;
      current.bytes += bytes;
      current.sources.add(sourceId);
      map.set(category, current);
    };
    for (const item of basket) {
      if (item.kind === 'all') {
        for (const stat of item.categories) add(stat.key, stat.count, stat.bytes, item.sourceId);
      } else if (item.kind === 'category') {
        add(item.category, item.count, item.bytes, item.sourceId);
      } else if (!allInventory.has(item.inventoryId) && !categoryGroups.has(`${item.inventoryId}:${item.file.category}`)) {
        add(item.file.category, 1, item.file.size, item.sourceId);
      }
    }
    return CATEGORY_ORDER
      .filter((category) => map.has(category))
      .map((category) => {
        const value = map.get(category)!;
        return { category, count: value.count, bytes: value.bytes, sources: value.sources.size };
      });
  }, [basket]);

  const basketCount = useMemo(() => basketCategories.reduce((sum, entry) => sum + entry.count, 0), [basketCategories]);

  const setDestination = useCallback((choice: DestinationChoice | null) => {
    setDestinationState(choice);
    if (choice) notify(t.destinationSelected);
  }, [notify, t.destinationSelected]);

  const addDestinationRoot = useCallback(async () => {
    try {
      const grant = await bridge.pickDestination();
      if (!grant) return null;
      setDestinations((previous) => previous.some((item) => item.id === grant.id) ? previous : [...previous, grant]);
      return grant;
    } catch (cause) {
      const detail = describeError(cause, locale);
      setError(`${t.errorTitle}: ${detail.message}`);
      return null;
    }
  }, [bridge, locale, t.errorTitle]);

  const setFolderName = useCallback((category: StudioCategoryKey, name: string) => {
    setFolderNames((previous) => ({ ...previous, [category]: name }));
  }, []);

  const setCategoryDestination = useCallback((category: StudioCategoryKey, choice: CategoryDestinationChoice | null) => {
    setCategoryDestinations((previous) => {
      const next = { ...previous };
      if (choice) next[category] = choice;
      else delete next[category];
      return next;
    });
  }, []);

  const settingsSignature = useMemo(() => JSON.stringify({
    mode,
    structure,
    collisionPolicy,
    destination,
    basket: basket.map((item) => item.key),
    categories: basketCategories.map((entry) => entry.category),
    folderNames,
    categoryDestinations
  }), [mode, structure, collisionPolicy, destination, basket, basketCategories, folderNames, categoryDestinations]);

  useEffect(() => {
    setPlan(null);
  }, [settingsSignature]);

  const buildPlan = useCallback(async () => {
    if (!basketCategories.length) {
      setError(t.needSelection);
      return false;
    }
    if (mode !== 'virtual' && !destination) {
      setError(t.needDestination);
      return false;
    }
    setPlanBuilding(true);
    setError('');
    try {
      const allInventory = new Set(basket.filter((item) => item.kind === 'all').map((item) => item.inventoryId));
      const categorySelections = new Set<string>();
      const fileIds = new Map<string, Set<number>>();
      const selections: PlanSelection[] = [];
      for (const item of basket) {
        if (item.kind === 'all') {
          selections.push({ inventoryId: item.inventoryId, all: true });
        } else if (item.kind === 'category') {
          const key = `${item.inventoryId}:${item.category}`;
          if (allInventory.has(item.inventoryId) || categorySelections.has(key)) continue;
          categorySelections.add(key);
          selections.push({ inventoryId: item.inventoryId, category: item.category });
        } else if (!allInventory.has(item.inventoryId) && !categorySelections.has(`${item.inventoryId}:${item.file.category}`)) {
          const set = fileIds.get(item.inventoryId) ?? new Set<number>();
          set.add(item.file.id);
          fileIds.set(item.inventoryId, set);
        }
      }
      for (const [inventoryIdValue, ids] of fileIds) {
        if (!ids.size) continue;
        selections.push({ inventoryId: inventoryIdValue, fileIds: Array.from(ids) });
      }
      if (!selections.length) {
        setError(t.needSelection);
        return false;
      }
      const names: Record<string, string> = {};
      if (structure === 'categorized' || mode === 'virtual') {
        for (const entry of basketCategories) {
          const value = folderNames[entry.category];
          if (value) names[entry.category] = value;
        }
      }
      const overrides: Record<string, { destinationId: string; relativePath: string }> = {};
      if (mode !== 'virtual') {
        for (const entry of basketCategories) {
          const choice = categoryDestinations[entry.category];
          if (choice) overrides[entry.category] = { destinationId: choice.destinationId, relativePath: choice.relativePath };
        }
      }
      const request: PlanRequest = {
        selections,
        operation: mode,
        destination: mode === 'virtual' || !destination
          ? undefined
          : { destinationId: destination.destinationId, relativePath: destination.relativePath },
        structure,
        categoryFolderNames: names,
        categoryDestinations: overrides,
        collisionPolicy
      };
      const built = await bridge.buildPlan(request);
      setPlan(built);
      setSurface('review');
      setNotice(t.planBuilt);
      return true;
    } catch (cause) {
      const detail = describeError(cause, locale);
      setError(`${t.errorTitle}: ${detail.message}`);
      return false;
    } finally {
      setPlanBuilding(false);
    }
  }, [basket, basketCategories, bridge, categoryDestinations, collisionPolicy, destination, folderNames, locale, mode, structure, t]);

  const discardPlan = useCallback(() => setPlan(null), []);

  const executePlan = useCallback(async (approvedPlan: OrganizationPlan) => {
    if (executing) return;
    setExecuting(true);
    setError('');
    try {
      const result = await bridge.executePlan({
        planId: approvedPlan.planId,
        planHash: approvedPlan.planHash,
        approved: true,
        operation: approvedPlan.operation,
        destinationSummary: approvedPlan.destinationSummary
      });
      setLastExecution(result);
      setPlan(null);
      setExecutionLive((previous) => {
        if (previous && previous.operationId === result.journalId) {
          return { ...previous, phase: result.summary.status, processed: result.summary.totalFiles, summary: result.summary };
        }
        return {
          operationId: result.journalId,
          planId: approvedPlan.planId,
          phase: result.summary.status,
          processed: result.summary.completedFiles + result.summary.failedFiles + result.summary.cancelledFiles,
          total: result.summary.totalFiles,
          bytes: 0,
          totalBytes: result.summary.totalBytes,
          completed: result.summary.completedFiles,
          failed: result.summary.failedFiles,
          cancelled: result.summary.cancelledFiles,
          currentName: null,
          message: null,
          summary: result.summary
        };
      });
      setNotice(result.mode === 'virtual' ? t.virtualCompleted : t.executionDone);
      setSurface('execution');
      await loadHistory();
    } catch (cause) {
      const detail = describeError(cause, locale);
      setError(`${t.errorTitle}: ${detail.message}`);
      if (['STUDIO_PLAN_STALE', 'STUDIO_PLAN_USED', 'STUDIO_PLAN_TAMPERED', 'STUDIO_PLAN_NOT_FOUND', 'STUDIO_PLAN_HAS_COLLISIONS'].includes(detail.code)) {
        setPlan(null);
      }
      if (detail.code === 'STUDIO_PLAN_STALE') setNotice(t.planStaleNotice);
      if (detail.code === 'STUDIO_PLAN_USED') setNotice(t.planUsedNotice);
    } finally {
      setExecuting(false);
    }
  }, [bridge, executing, loadHistory, locale, t]);

  const cancelExecution = useCallback(async () => {
    if (!executionLive) return;
    try {
      await bridge.cancelExecution({ operationId: executionLive.operationId });
      notify(t.cancelling);
    } catch (cause) {
      const detail = describeError(cause, locale);
      setError(`${t.errorTitle}: ${detail.message}`);
    }
  }, [bridge, executionLive, locale, notify, t.cancelling, t.errorTitle]);

  const value: StudioContextValue = {
    bridge,
    locale,
    t,
    surface,
    goto,
    sources,
    saved,
    sourcesLoading,
    activeSourceId,
    setActiveSourceId,
    activeSource,
    inventory,
    scanRunning,
    pickSource,
    beginScan,
    cancelScan,
    removeSource,
    notice,
    error,
    dismissBanner,
    notify,
    filters,
    updateFilters,
    resetFilters,
    page,
    pageLoading,
    view,
    setView,
    focused,
    focusFile,
    basket,
    basketCount,
    basketCategories,
    toggleFile,
    addCategory,
    addAll,
    removeBasketItem,
    clearBasket,
    isFileSelected,
    isFileCovered,
    destinations,
    addDestinationRoot,
    destination,
    setDestination,
    mode,
    setMode,
    structure,
    setStructure,
    collisionPolicy,
    setCollisionPolicy,
    folderNames,
    setFolderName,
    categoryDestinations,
    setCategoryDestination,
    buildPlan,
    planBuilding,
    plan,
    discardPlan,
    executePlan,
    executing,
    executionLive,
    lastExecution,
    cancelExecution,
    history,
    historyLoading,
    loadHistory,
    insight
  };

  return (
    <StudioContext.Provider value={value}>
      <div className="st-root">
        <StudioHero />
        <StudioBanners />
        {surface === 'sources' && <StudioCommandCenter />}
        <div className="st-shell">
          <SurfaceRail />
          <div className="st-stage" id="studio-stage" tabIndex={-1}>
            <StudioStage />
          </div>
        </div>
      </div>
    </StudioContext.Provider>
  );
}
