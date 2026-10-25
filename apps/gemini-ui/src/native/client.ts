/**
 * Typed renderer access to the Electron native platform.
 *
 * The browser preview must not pretend the bridge exists. Every helper returns
 * null / throws a typed failure when the preload handshake or contract version
 * is absent.
 */
import {
  NATIVE_CONTRACT_VERSION,
  type BridgeStatusData,
  type FolderChoiceData,
  type NativeEnvelope,
  type NativeShellApi,
  type ServicesSummaryData,
  type SystemSummaryData,
} from '../../shared/native-contracts';

declare global {
  interface Window {
    knouxShell?: NativeShellApi;
  }
}

export function getNativeShell(): NativeShellApi | null {
  if (typeof window === 'undefined') return null;
  const candidate = window.knouxShell;
  if (!candidate || candidate.contractVersion !== NATIVE_CONTRACT_VERSION) return null;
  return candidate;
}

export function hasNativeShell(): boolean {
  return Boolean(getNativeShell());
}

function assertEnvelope<T>(envelope: NativeEnvelope<T> | undefined, capability: string): NativeEnvelope<T> {
  if (!envelope || envelope.contractVersion !== NATIVE_CONTRACT_VERSION || envelope.capability !== capability) {
    throw new Error(`The native ${capability} response did not match the v${NATIVE_CONTRACT_VERSION} contract.`);
  }
  return envelope;
}

export async function readBridgeStatus(): Promise<NativeEnvelope<BridgeStatusData> | null> {
  const api = getNativeShell();
  if (!api) return null;
  return assertEnvelope(await api.getStatus(), 'bridge.status');
}

export async function readSystemSummary(): Promise<NativeEnvelope<SystemSummaryData> | null> {
  const api = getNativeShell();
  if (!api) return null;
  return assertEnvelope(await api.getSystemSummary(), 'system.summary');
}

export async function readServicesSummary(): Promise<NativeEnvelope<ServicesSummaryData> | null> {
  const api = getNativeShell();
  if (!api) return null;
  return assertEnvelope(await api.getServicesSummary(), 'services.summary');
}

export async function chooseFolder(): Promise<NativeEnvelope<FolderChoiceData> | null> {
  const api = getNativeShell();
  if (!api) return null;
  return assertEnvelope(await api.chooseFolder(), 'folder.choose');
}

export async function controlNativeWindow(action: 'minimize' | 'maximize' | 'close'): Promise<void> {
  await getNativeShell()?.windowControl(action);
}
