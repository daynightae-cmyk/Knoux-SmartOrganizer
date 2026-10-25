/**
 * Typed renderer access to the read-only Files backend.
 *
 * Browser previews have no grant, inventory, metadata, hash or shell action.
 * Scan progress is shared with the Studio read-only event channel.
 */
import {
  NATIVE_CONTRACT_VERSION,
  type FilesEmptyFoldersResult,
  type FilesHashResult,
  type FilesMetadata,
  type FilesOverview,
  type FilesQueryRequest,
  type FilesShellApi,
  type NativeEnvelope,
  type StudioProgressEvent,
  type StudioQueryResult,
  type StudioSource,
  type StudioShellApi,
} from '../../shared/native-contracts';

declare global {
  interface Window {
    knouxFilesV1?: FilesShellApi;
    knouxStudioV1?: StudioShellApi;
  }
}

export function getFilesShell(): FilesShellApi | null {
  if (typeof window === 'undefined') return null;
  const candidate = window.knouxFilesV1;
  if (!candidate || candidate.contractVersion !== NATIVE_CONTRACT_VERSION) return null;
  return candidate;
}

function assertEnvelope<T>(envelope: NativeEnvelope<T> | undefined, capability: string): NativeEnvelope<T> {
  if (!envelope || envelope.contractVersion !== NATIVE_CONTRACT_VERSION || envelope.capability !== capability) {
    throw new Error(`The Files ${capability} response did not match contract v${NATIVE_CONTRACT_VERSION}.`);
  }
  return envelope;
}

export async function listFilesSources(): Promise<NativeEnvelope<StudioSource[]> | null> {
  const api = getFilesShell();
  if (!api) return null;
  return assertEnvelope(await api.listSources(), 'files.sources');
}

export async function chooseFilesSource(): Promise<NativeEnvelope<StudioSource | null> | null> {
  const api = getFilesShell();
  if (!api) return null;
  return assertEnvelope(await api.chooseSource(), 'files.source.choose');
}

export async function scanFilesSource(sourceId: string): Promise<NativeEnvelope<StudioSource> | null> {
  const api = getFilesShell();
  if (!api) return null;
  return assertEnvelope(await api.scanSource(sourceId), 'files.inventory.scan');
}

export async function cancelFilesScan(sourceId: string): Promise<void> {
  await getFilesShell()?.cancelScan(sourceId);
}

export async function queryFilesInventory(request: FilesQueryRequest): Promise<NativeEnvelope<StudioQueryResult & { unsupported?: string }> | null> {
  const api = getFilesShell();
  if (!api) return null;
  return assertEnvelope(await api.query(request), 'files.inventory.query');
}

export async function loadFilesThumbnails(
  sourceId: string,
  fileIds: number[]
): Promise<NativeEnvelope<Record<string, { thumbnail: string | null; reason?: string }>> | null> {
  const api = getFilesShell();
  if (!api) return null;
  return assertEnvelope(await api.thumbnails(sourceId, fileIds), 'files.thumbnails');
}

export async function loadFilesOverview(sourceId: string): Promise<NativeEnvelope<FilesOverview> | null> {
  const api = getFilesShell();
  if (!api) return null;
  return assertEnvelope(await api.overview(sourceId), 'files.overview');
}

export async function loadFileMetadata(sourceId: string, fileId: number): Promise<NativeEnvelope<FilesMetadata> | null> {
  const api = getFilesShell();
  if (!api) return null;
  return assertEnvelope(await api.metadata(sourceId, fileId), 'files.metadata');
}

export async function hashFile(sourceId: string, fileId: number): Promise<NativeEnvelope<FilesHashResult> | null> {
  const api = getFilesShell();
  if (!api) return null;
  return assertEnvelope(await api.hash(sourceId, fileId, 'sha256'), 'files.hash');
}

export async function loadEmptyFolders(sourceId: string, limit = 200): Promise<NativeEnvelope<FilesEmptyFoldersResult> | null> {
  const api = getFilesShell();
  if (!api) return null;
  return assertEnvelope(await api.emptyFolders(sourceId, limit), 'files.emptyFolders');
}

export async function openIndexedFile(sourceId: string, fileId: number): Promise<NativeEnvelope<{ opened: boolean; fileId: number; requestedPath: string }> | null> {
  const api = getFilesShell();
  if (!api) return null;
  return assertEnvelope(await api.open(sourceId, fileId), 'files.open');
}

export async function revealIndexedFile(sourceId: string, fileId: number): Promise<NativeEnvelope<{ requested: boolean; fileId: number; requestedPath: string }> | null> {
  const api = getFilesShell();
  if (!api) return null;
  return assertEnvelope(await api.reveal(sourceId, fileId), 'files.reveal');
}

export function subscribeFilesProgress(callback: (event: StudioProgressEvent) => void): () => void {
  const studio = typeof window !== 'undefined' ? window.knouxStudioV1 : null;
  if (!studio || studio.contractVersion !== NATIVE_CONTRACT_VERSION) return () => {};
  return studio.onEvent(callback);
}
