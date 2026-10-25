/**
 * Read-only native state for the Volume Atlas.
 *
 * Volumes are measured independently of file scans. Folder/treemap/duplicate
 * intelligence requires an explicitly authorized source from the Files/Studio
 * inventory and is always labelled with its real scan scope.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  StorageAnalysis,
  StorageCapacityPoint,
  StorageDuplicateResult,
  StorageVolume,
  StudioProgressEvent,
  StudioSource,
} from '../../shared/native-contracts';
import {
  chooseFilesSource,
  cancelFilesScan,
  scanFilesSource,
  subscribeFilesProgress,
  listFilesSources,
} from '../files/native';
import { loadStorageAnalysis, loadStorageVolumes, verifyStorageDuplicates, getStorageShell } from './native';

export function formatStorageBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  let value = bytes;
  let index = 0;
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }
  return `${value.toFixed(index <= 1 ? 0 : 1)} ${units[index]}`;
}

export function useStorageNative() {
  const [available, setAvailable] = useState(false);
  const [volumes, setVolumes] = useState<StorageVolume[]>([]);
  const [history, setHistory] = useState<StorageCapacityPoint[]>([]);
  const [volumesLoading, setVolumesLoading] = useState(false);
  const [volumesError, setVolumesError] = useState<string | null>(null);
  const [volumesWarnings, setVolumesWarnings] = useState<string[]>([]);
  const [sources, setSources] = useState<StudioSource[]>([]);
  const [source, setSource] = useState<StudioSource | null>(null);
  const [analysis, setAnalysis] = useState<StorageAnalysis | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState<{ files: number; folders: number; bytes: number } | null>(null);
  const [duplicates, setDuplicates] = useState<StorageDuplicateResult | null>(null);
  const [verifying, setVerifying] = useState(false);
  const sourceRef = useRef<StudioSource | null>(null);

  const setActiveSource = useCallback((next: StudioSource | null) => {
    sourceRef.current = next;
    setSource(next);
    if (!next) {
      setAnalysis(null);
      setDuplicates(null);
    }
  }, []);

  const loadVolumes = useCallback(async () => {
    if (!getStorageShell()) return;
    setVolumesLoading(true);
    try {
      const envelope = await loadStorageVolumes();
      if (!envelope || envelope.status !== 'complete' || !envelope.data) {
        setVolumesError(envelope?.error?.message || 'The measured volume provider did not return data.');
        return;
      }
      setVolumes(envelope.data.volumes);
      setHistory(envelope.data.history);
      setVolumesWarnings(envelope.data.warnings);
      setVolumesError(null);
    } catch (providerError) {
      setVolumesError(providerError instanceof Error ? providerError.message : 'Storage volumes could not be read.');
    } finally {
      setVolumesLoading(false);
    }
  }, []);

  const loadAnalysis = useCallback(async (nextSource: StudioSource) => {
    setAnalysisLoading(true);
    try {
      const envelope = await loadStorageAnalysis(nextSource.id);
      if (!envelope || envelope.status !== 'complete' || !envelope.data) {
        setAnalysis(null);
        setError(envelope?.error?.message || 'The storage analysis could not be read.');
        return;
      }
      setAnalysis(envelope.data);
      setDuplicates(null);
      setError(null);
    } catch (analysisError) {
      setAnalysis(null);
      setError(analysisError instanceof Error ? analysisError.message : 'The storage analysis failed.');
    } finally {
      setAnalysisLoading(false);
    }
  }, []);

  const chooseSource = useCallback(async () => {
    setError(null);
    const chosen = await chooseFilesSource();
    if (!chosen) return;
    if (chosen.status !== 'complete' || !chosen.data) {
      if (chosen.status !== 'cancelled') setError(chosen.error?.message || 'The storage scope could not be authorized.');
      return;
    }
    const next = chosen.data;
    setSources((prev) => [next, ...prev.filter((entry) => entry.id !== next.id)]);
    setScanning(true);
    setProgress(null);
    try {
      const scanned = await scanFilesSource(next.id);
      if (!scanned || scanned.status !== 'complete' || !scanned.data) {
        setError(scanned?.error?.message || 'The authorized scope could not be indexed.');
        return;
      }
      setSources((prev) => prev.map((entry) => (entry.id === next.id ? scanned.data as StudioSource : entry)));
      setActiveSource(scanned.data);
      await loadAnalysis(scanned.data);
      await loadVolumes();
    } finally {
      setScanning(false);
    }
  }, [loadAnalysis, loadVolumes, setActiveSource]);

  const rescan = useCallback(async () => {
    const current = sourceRef.current;
    if (!current) return;
    setScanning(true);
    setError(null);
    setProgress(null);
    try {
      const scanned = await scanFilesSource(current.id);
      if (!scanned || scanned.status !== 'complete' || !scanned.data) {
        setError(scanned?.error?.message || 'The authorized scope could not be re-indexed.');
        return;
      }
      setSources((prev) => prev.map((entry) => (entry.id === current.id ? scanned.data as StudioSource : entry)));
      setActiveSource(scanned.data);
      await loadAnalysis(scanned.data);
      await loadVolumes();
    } finally {
      setScanning(false);
    }
  }, [loadAnalysis, loadVolumes, setActiveSource]);

  const cancelScan = useCallback(async () => {
    const current = sourceRef.current;
    if (current) await cancelFilesScan(current.id);
  }, []);

  const verifyDuplicates = useCallback(async () => {
    const current = sourceRef.current;
    if (!current) return;
    setVerifying(true);
    setError(null);
    try {
      const envelope = await verifyStorageDuplicates(current.id);
      if (!envelope || envelope.status !== 'complete' || !envelope.data) {
        setError(envelope?.error?.message || 'Duplicate verification failed.');
        return;
      }
      setDuplicates(envelope.data);
    } finally {
      setVerifying(false);
    }
  }, []);

  const selectSource = useCallback(async (sourceId: string) => {
    const next = sources.find((entry) => entry.id === sourceId) || null;
    if (!next) return;
    setActiveSource(next);
    await loadAnalysis(next);
  }, [loadAnalysis, setActiveSource, sources]);

  useEffect(() => {
    if (!getStorageShell()) return;
    setAvailable(true);
    let active = true;
    const unsubscribe = subscribeFilesProgress((event: StudioProgressEvent) => {
      if (!active) return;
      if (event.type === 'scan-progress') {
        setProgress({ files: event.files || 0, folders: event.folders || 0, bytes: event.bytes || 0 });
      }
      if (event.type === 'scan-failed') setError(event.message || 'The scope scan failed.');
    });
    void loadVolumes();
    void (async () => {
      const listed = await listFilesSources();
      if (!active) return;
      if (listed?.status === 'complete' && Array.isArray(listed.data)) {
        setSources(listed.data);
        const ready = listed.data.find((entry) => entry.status === 'ready' || entry.status === 'partial');
        if (ready) {
          setActiveSource(ready);
          await loadAnalysis(ready);
        }
      }
    })();
    return () => {
      active = false;
      unsubscribe();
    };
  }, [loadAnalysis, loadVolumes, setActiveSource]);

  return {
    available,
    volumes,
    history,
    volumesLoading,
    volumesError,
    volumesWarnings,
    sources,
    source,
    analysis,
    analysisLoading,
    error,
    scanning,
    progress,
    duplicates,
    verifying,
    chooseSource,
    rescan,
    cancelScan,
    selectSource,
    verifyDuplicates,
    refreshVolumes: loadVolumes,
    clearError: () => setError(null),
  };
}
