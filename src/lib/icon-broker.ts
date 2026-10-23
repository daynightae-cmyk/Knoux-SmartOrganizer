/**
 * Icon broker.
 *
 * The native icon provider is a main-process capability exposed as
 * `window.knoux.appIcons({ ids })`. This module is the only place the renderer
 * talks to it: it batches the ids that scrolled into view, deduplicates them,
 * caches whatever the provider returns, and degrades to a publisher-derived
 * monogram the moment the channel is missing, fails, or reports nothing.
 *
 * The renderer never sends a path and never asks Windows to run a program.
 */

export type IconStatus = 'ready' | 'unavailable' | 'unknown-app';

export interface IconEntry {
  status: IconStatus;
  source?: string;
  dataUrl?: string;
  pixels?: number;
  reason?: string;
}

type IconBridge = (request: { ids: string[] }) => Promise<unknown>;

const MAX_PER_REQUEST = 24;
const BATCH_DELAY_MS = 70;
const FAILURE_COOLDOWN_MS = 20000;

const cache = new Map<string, IconEntry>();
const listeners = new Map<string, Set<() => void>>();
const versionListeners = new Set<() => void>();
const queue = new Set<string>();

let timer: number | undefined;
let inFlight = 0;
let bridge: IconBridge | null = null;
let bridgeResolved = false;
let cooldownUntil = 0;

function resolveBridge(): IconBridge | null {
  if (bridgeResolved) return bridge;
  bridgeResolved = true;
  const candidate = (window as { knoux?: { appIcons?: unknown } }).knoux?.appIcons;
  bridge = typeof candidate === 'function' ? (candidate as IconBridge) : null;
  return bridge;
}

/** True when the native icon channel exists; false in a browser or an older build. */
export function iconsSupported(): boolean {
  return resolveBridge() !== null;
}

function notify(id: string): void {
  listeners.get(id)?.forEach(listener => listener());
  versionListeners.forEach(listener => listener());
}

export function getIcon(id: string): IconEntry | undefined {
  return cache.get(id);
}

export function subscribeIcon(id: string, listener: () => void): () => void {
  const set = listeners.get(id) ?? new Set<() => void>();
  set.add(listener);
  listeners.set(id, set);
  return () => {
    set.delete(listener);
    if (!set.size) listeners.delete(id);
  };
}

/** Normalises whatever shape the provider answers with into id → entry. */
function toEntries(payload: unknown, ids: string[]): Map<string, IconEntry> {
  const out = new Map<string, IconEntry>();
  const rows: Array<Record<string, unknown>> = [];
  if (Array.isArray(payload)) {
    for (const row of payload) if (row && typeof row === 'object') rows.push(row as Record<string, unknown>);
  } else if (payload && typeof payload === 'object') {
    for (const [key, value] of Object.entries(payload as Record<string, unknown>)) {
      if (value && typeof value === 'object') rows.push({ id: key, ...(value as Record<string, unknown>) });
    }
  }
  for (const row of rows) {
    const id = typeof row.id === 'string' ? row.id : '';
    if (!id) continue;
    const status: IconStatus = row.status === 'ready' ? 'ready' : row.status === 'unknown-app' ? 'unknown-app' : 'unavailable';
    out.set(id, {
      status,
      source: typeof row.source === 'string' ? row.source : undefined,
      dataUrl: status === 'ready' && typeof row.dataUrl === 'string' ? row.dataUrl : undefined,
      pixels: Number.isFinite(Number(row.pixels)) ? Number(row.pixels) : undefined,
      reason: typeof row.reason === 'string' ? row.reason : undefined
    });
  }
  // An id the provider never answered for is a permanent unavailable, so a
  // dropped row can never turn into an endless retry loop.
  for (const id of ids) if (!out.has(id)) out.set(id, { status: 'unavailable', reason: 'no-answer' });
  return out;
}

async function flush(): Promise<void> {
  timer = undefined;
  const api = resolveBridge();
  if (!api) { queue.clear(); return; }
  if (Date.now() < cooldownUntil) { queue.clear(); return; }
  const batch = [...queue].slice(0, MAX_PER_REQUEST);
  batch.forEach(id => queue.delete(id));
  if (!batch.length) return;
  inFlight += 1;
  try {
    const entries = toEntries(await api({ ids: batch }), batch);
    for (const [id, entry] of entries) {
      const previous = cache.get(id);
      if (previous?.status === 'ready' && entry.status !== 'ready') continue;
      cache.set(id, entry);
      notify(id);
    }
  } catch {
    cooldownUntil = Date.now() + FAILURE_COOLDOWN_MS;
    for (const id of batch) {
      if (cache.has(id)) continue;
      cache.set(id, { status: 'unavailable', reason: 'channel-failed' });
      notify(id);
    }
  } finally {
    inFlight -= 1;
    if (queue.size) scheduleTimer();
  }
}

function scheduleTimer(): void {
  if (timer !== undefined) return;
  timer = window.setTimeout(() => { void flush(); }, BATCH_DELAY_MS);
}

/** Ask for a set of ids; they are coalesced into one bounded batch. */
export function requestIcons(ids: string[]): void {
  if (!resolveBridge()) return;
  let added = false;
  for (const id of ids) {
    if (!id || cache.has(id) || queue.has(id)) continue;
    queue.add(id);
    added = true;
  }
  if (added) scheduleTimer();
}

export function subscribeToActivity(listener: () => void): () => void {
  versionListeners.add(listener);
  return () => versionListeners.delete(listener);
}

/** Any work left in the queue or in flight — used by the world's busy state. */
export function iconsBusy(): boolean {
  return inFlight > 0 || queue.size > 0;
}

export function iconCacheSize(): number {
  return cache.size;
}

/** Drops cached entries so a re-read inventory re-requests ids that changed. */
export function resetIconCache(): void {
  cache.clear();
  queue.clear();
  if (timer !== undefined) { window.clearTimeout(timer); timer = undefined; }
  versionListeners.forEach(listener => listener());
}
