/**
 * Typed renderer access to the read-only Studio backend.
 *
 * The browser preview has no grant, no inventory and no mutation. Nothing in
 * this module invents a source, a thumbnail or a successful plan.
 */
import {
  NATIVE_CONTRACT_VERSION,
  type NativeEnvelope,
  type StudioPreviewHistoryEntry,
  type StudioPlanPreview,
  type StudioProgressEvent,
  type StudioQueryResult,
  type StudioShellApi,
  type StudioSource,
} from '../../shared/native-contracts';

declare global {
  interface Window {
    knouxStudioV1?: StudioShellApi;
  }
}

export function getStudioShell(): StudioShellApi | null {
  if (typeof window === 'undefined') return null;
  const candidate = window.knouxStudioV1;
  if (!candidate || candidate.contractVersion !== NATIVE_CONTRACT_VERSION) return null;
  return candidate;
}

function assertEnvelope<T>(envelope: NativeEnvelope<T> | undefined, capability: string): NativeEnvelope<T> {
  if (!envelope || envelope.contractVersion !== NATIVE_CONTRACT_VERSION || envelope.capability !== capability) {
    throw new Error(`The Studio ${capability} response did not match contract v${NATIVE_CONTRACT_VERSION}.`);
  }
  return envelope;
}

export async function listStudioSources(): Promise<NativeEnvelope<StudioSource[]> | null> {
  const api = getStudioShell();
  if (!api) return null;
  return assertEnvelope(await api.listSources(), 'studio.sources');
}

export async function chooseStudioSource(): Promise<NativeEnvelope<StudioSource | null> | null> {
  const api = getStudioShell();
  if (!api) return null;
  return assertEnvelope(await api.chooseSource(), 'studio.source.choose');
}

export async function removeStudioSource(sourceId: string): Promise<NativeEnvelope<{ removed: boolean }> | null> {
  const api = getStudioShell();
  if (!api) return null;
  return assertEnvelope(await api.removeSource(sourceId), 'studio.source.remove');
}

export async function scanStudioSource(sourceId: string): Promise<NativeEnvelope<StudioSource> | null> {
  const api = getStudioShell();
  if (!api) return null;
  return assertEnvelope(await api.scanSource(sourceId), 'studio.inventory.scan');
}

export async function cancelStudioScan(sourceId: string): Promise<void> {
  await getStudioShell()?.cancelScan(sourceId);
}

export async function queryStudioInventory(request: {
  sourceId: string;
  category?: string;
  categories?: string[];
  search?: string;
  sort?: 'name' | 'size' | 'modified' | 'type';
  desc?: boolean;
  offset?: number;
  limit?: number;
}): Promise<NativeEnvelope<StudioQueryResult> | null> {
  const api = getStudioShell();
  if (!api) return null;
  return assertEnvelope(await api.query(request), 'studio.inventory.query');
}

export async function loadStudioThumbnails(
  sourceId: string,
  fileIds: number[]
): Promise<NativeEnvelope<Record<string, { thumbnail: string | null; reason?: string }>> | null> {
  const api = getStudioShell();
  if (!api) return null;
  return assertEnvelope(await api.thumbnails(sourceId, fileIds), 'studio.thumbnails');
}

export async function chooseStudioDestination(): Promise<NativeEnvelope<{ id: string; path: string } | null> | null> {
  const api = getStudioShell();
  if (!api) return null;
  return assertEnvelope(await api.chooseDestination(), 'studio.destination.choose');
}

export async function previewStudioPlan(request: Parameters<StudioShellApi['previewPlan']>[0]): Promise<NativeEnvelope<StudioPlanPreview> | null> {
  const api = getStudioShell();
  if (!api) return null;
  return assertEnvelope(await api.previewPlan(request), 'studio.plan.preview');
}

export async function loadStudioPreviewHistory(): Promise<NativeEnvelope<StudioPreviewHistoryEntry[]> | null> {
  const api = getStudioShell();
  if (!api) return null;
  return assertEnvelope(await api.previewHistory(), 'studio.preview.history');
}

export function subscribeStudioEvents(callback: (event: StudioProgressEvent) => void): () => void {
  return getStudioShell()?.onEvent(callback) || (() => {});
}
