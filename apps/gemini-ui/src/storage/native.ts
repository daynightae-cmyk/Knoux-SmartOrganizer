/**
 * Typed renderer access to the read-only Storage backend.
 * Sources and scan progress are shared with the authorized Files inventory.
 */
import {
  NATIVE_CONTRACT_VERSION,
  type NativeEnvelope,
  type StorageAnalysis,
  type StorageDuplicateResult,
  type StorageHistoryResult,
  type StorageShellApi,
  type StorageVolumesResult,
} from '../../shared/native-contracts';

declare global {
  interface Window {
    knouxStorageV1?: StorageShellApi;
  }
}

export function getStorageShell(): StorageShellApi | null {
  if (typeof window === 'undefined') return null;
  const candidate = window.knouxStorageV1;
  if (!candidate || candidate.contractVersion !== NATIVE_CONTRACT_VERSION) return null;
  return candidate;
}

function assertEnvelope<T>(envelope: NativeEnvelope<T> | undefined, capability: string): NativeEnvelope<T> {
  if (!envelope || envelope.contractVersion !== NATIVE_CONTRACT_VERSION || envelope.capability !== capability) {
    throw new Error(`The Storage ${capability} response did not match contract v${NATIVE_CONTRACT_VERSION}.`);
  }
  return envelope;
}

export async function loadStorageVolumes(): Promise<NativeEnvelope<StorageVolumesResult> | null> {
  const api = getStorageShell();
  if (!api) return null;
  return assertEnvelope(await api.volumes(), 'storage.volumes');
}

export async function loadStorageHistory(): Promise<NativeEnvelope<StorageHistoryResult> | null> {
  const api = getStorageShell();
  if (!api) return null;
  return assertEnvelope(await api.history(), 'storage.history');
}

export async function loadStorageAnalysis(sourceId: string): Promise<NativeEnvelope<StorageAnalysis> | null> {
  const api = getStorageShell();
  if (!api) return null;
  return assertEnvelope(await api.analysis(sourceId), 'storage.analysis');
}

export async function verifyStorageDuplicates(sourceId: string): Promise<NativeEnvelope<StorageDuplicateResult> | null> {
  const api = getStorageShell();
  if (!api) return null;
  return assertEnvelope(await api.verifyDuplicates(sourceId), 'storage.duplicates.verify');
}
