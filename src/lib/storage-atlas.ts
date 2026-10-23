import type { ToolResult } from '@shared/contracts';

/**
 * The Storage view model.
 *
 * Two independent Windows sources feed this world, and the model keeps them
 * apart on purpose:
 *
 * - `disk-overview` reads the volume table (Win32_LogicalDisk) and the physical
 *   disk table (MSFT_PhysicalDisk). Capacity, free space, filesystem and media
 *   type come from those tables; the pressure label is the engine's own, derived
 *   from the free-space percentage it measured, and is never recomputed here.
 * - `large-files` and `duplicate-files` walk one directory the user chose. They
 *   report what that walk found and how far it got — nothing about the rest of
 *   the volume.
 *
 * The two are never added together. A walk that stops at its scan budget knows
 * the size of the folder it started in but not the size of everything inside it,
 * so "reclaimable" is only ever claimed for the copies the engine verified with
 * SHA-256, and heavy files are labelled as heavy rather than as recoverable.
 */

export type Pressure = 'critical' | 'high' | 'medium' | 'healthy' | 'unknown';

export interface VolumeBay {
  /** Win32_LogicalDisk device id, e.g. "C:" — also the scan root this world offers. */
  id: string;
  letter: string;
  label: string;
  fileSystem: string | null;
  serial: string | null;
  sizeBytes: number | null;
  freeBytes: number | null;
  usedBytes: number | null;
  /** Share of the volume already taken, one decimal, or null when unmeasured. */
  usedPercent: number | null;
  freePercent: number | null;
  pressure: Pressure;
  pressureBasis: string | null;
  /** The volume root as a scan folder: "C:\\". Null when the id is not a drive letter. */
  scanRoot: string | null;
}

export interface PhysicalBay {
  id: string;
  friendlyName: string;
  mediaType: string | null;
  busType: string | null;
  sizeBytes: number | null;
  healthStatus: string | null;
  operationalStatus: string | null;
  /** MSFT_PhysicalDisk does not expose a portable temperature; the UI says so. */
  temperatureAvailable: boolean;
}

export interface AtlasTotals {
  volumes: number;
  capacityBytes: number;
  freeBytes: number;
  usedBytes: number;
  pressured: number;
  critical: number;
  unknownPressure: number;
  /** Volumes whose capacity Windows did not report. */
  unmeasured: number;
}

export interface AtlasSnapshot {
  collectedAt: string;
  volumes: VolumeBay[];
  physical: PhysicalBay[];
  totals: AtlasTotals;
  volumeProvider: string | null;
  physicalProvider: string | null;
  inventoryAvailable: boolean;
  unavailableReason: string | null;
  physicalAvailable: boolean;
  warnings: string[];
  partial: boolean;
}

export interface CompositionRung {
  key: string;
  files: number;
  bytes: number;
  /** Share of the bytes the walk measured, not of the volume. */
  percent: number;
}

export interface HeavyRow {
  path: string;
  name: string;
  extension: string;
  size: number;
  type: string;
  ageBucket: string;
  modifiedAt: string | null;
  /** The walked root's first-level folder this file sits in, or "(root)". */
  folderBucket: string;
  /** True when the entry is a cloud placeholder: reading it would fetch it. */
  deferred: boolean;
}

export interface TraversalMeasure {
  foldersVisited: number;
  filesVisited: number;
  reparsePointsSkipped: number;
  reparsePointsTraversed: number;
  accessDenied: number;
  hardlinkedFiles: number;
  cloudPlaceholders: number;
  excluded: number;
}

export interface HeavyScan {
  root: string;
  collectedAt: string;
  filesScanned: number;
  matchingFiles: number;
  thresholdBytes: number;
  totalMatchingBytes: number;
  /** Bytes the whole walk measured, which is what the ladders are drawn from. */
  totalScannedBytes: number;
  types: CompositionRung[];
  ages: CompositionRung[];
  folders: CompositionRung[];
  extensions: CompositionRung[];
  rows: HeavyRow[];
  traversal: TraversalMeasure | null;
  warnings: string[];
  partial: boolean;
  success: boolean;
}

export interface DuplicateRow {
  key: string;
  hash: string;
  size: number;
  count: number;
  reclaimableBytes: number;
  /** A group of hard links: extra names, no extra bytes. */
  singlePhysicalFile: boolean;
  physicalDuplicates: number;
  risk: string;
  keeperPath: string | null;
  reviewPaths: string[];
  /** Every path in the verified set, including the keeper. */
  memberPaths: string[];
  extension: string;
}

export interface DuplicateScan {
  root: string;
  collectedAt: string;
  filesScanned: number;
  candidateFiles: number;
  contentVerifiedFiles: number;
  skippedForHydration: number;
  changedDuringRead: number;
  groups: DuplicateRow[];
  duplicateFiles: number;
  reclaimableBytes: number;
  algorithm: string;
  traversal: TraversalMeasure | null;
  warnings: string[];
  partial: boolean;
  success: boolean;
}

export interface EmptyFolderScan {
  root: string;
  collectedAt: string;
  empty: number;
  scanned: number;
  inaccessible: number;
  paths: string[];
  success: boolean;
}

/* ------------------------------------------------------------------ helpers */

function num(value: unknown): number | null {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

function str(value: unknown): string {
  return typeof value === 'string' ? value : value == null ? '' : String(value);
}

function numList(value: unknown): number[] {
  return Array.isArray(value) ? value.map(num).filter((n): n is number => n != null) : [];
}

function strList(value: unknown): string[] {
  return Array.isArray(value) ? value.map(str).filter(Boolean) : [];
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function recordList(value: unknown): Array<Record<string, unknown>> {
  return Array.isArray(value) ? value.map(record) : [];
}

/** Percent of `total` that `part` is, to one decimal, or null when unmeasured. */
function share(part: number | null, total: number | null): number | null {
  if (part == null || total == null || total <= 0) return null;
  return Math.round((part / total) * 1000) / 10;
}

function baseName(filePath: string): string {
  const segments = filePath.split(/[\\/]/);
  return segments[segments.length - 1] || filePath;
}

function extensionOf(filePath: string): string {
  const name = baseName(filePath);
  const dot = name.lastIndexOf('.');
  return dot > 0 ? name.slice(dot).toLowerCase() : '';
}

/** The same split the engine uses: a path as segments, whichever separator appears. */
function pathSegmentsOf(filePath: string): string[] {
  return filePath.split(/[\\/]+/).filter(Boolean);
}

/**
 * The folder bucket a file belongs to, exactly as `buildStorageIntelligence`
 * groups it: the first segment under the walked root when the file sits deeper
 * than one level, and "(root)" for anything the walk found directly in a folder.
 *
 * The ladder is drawn from those buckets, so filtering a ladder row has to match
 * on the same rule — matching a path substring instead would let "Documents"
 * select a deep folder of that name anywhere in the tree.
 */
function bucketOf(filePath: string, root: string): string {
  const rootParts = pathSegmentsOf(root);
  const fileParts = pathSegmentsOf(filePath);
  if (!rootParts.length) return fileParts.length > 1 ? fileParts[0] : '(root)';
  const rooted = rootParts.every((part, index) => (fileParts[index] || '').toLowerCase() === part.toLowerCase());
  const segments = rooted ? fileParts.slice(rootParts.length) : fileParts;
  return segments.length > 1 ? segments[0] : '(root)';
}

const PRESSURE_VALUES: Pressure[] = ['critical', 'high', 'medium', 'healthy', 'unknown'];

function pressureOf(value: unknown): Pressure {
  const text = str(value).toLowerCase() as Pressure;
  return PRESSURE_VALUES.includes(text) ? text : 'unknown';
}

function traversalOf(value: unknown): TraversalMeasure | null {
  const totals = record(value);
  if (!Object.keys(totals).length) return null;
  return {
    foldersVisited: num(totals.foldersVisited) ?? 0,
    filesVisited: num(totals.filesVisited) ?? 0,
    reparsePointsSkipped: num(totals.reparsePointsSkipped) ?? 0,
    reparsePointsTraversed: num(totals.reparsePointsTraversed) ?? 0,
    accessDenied: num(totals.accessDenied) ?? 0,
    hardlinkedFiles: num(totals.hardlinkedFiles) ?? 0,
    cloudPlaceholders: num(totals.cloudPlaceholders) ?? 0,
    excluded: num(totals.excluded) ?? 0
  };
}

/**
 * The four composition ladders the large-file walk reports.
 *
 * The engine's grouped arrays are named by what they group — `typeGroups`,
 * `ageBuckets`, `topFolders`, `extensionGroups` — and each entry carries its
 * label under the short key `ranked()` was given (`type`, `age`, `folder`,
 * `extension`). The two namings are pinned here rather than guessed at, because
 * a ladder that silently reads the wrong property renders an empty composition
 * and still looks like a finished interface.
 */
function laddersOf(summary: Record<string, unknown>, totalBytes: number) {
  const rung = (entry: Record<string, unknown>, keyName: string): CompositionRung => ({
    key: str(entry[keyName]) || '—',
    files: num(entry.files) ?? 0,
    bytes: num(entry.bytes) ?? 0,
    percent: share(num(entry.bytes), totalBytes) ?? 0
  });
  const list = (arrayName: string, keyName: string) => recordList(summary[arrayName]).map(entry => rung(entry, keyName));
  return {
    types: list('typeGroups', 'type'),
    ages: list('ageBuckets', 'age'),
    folders: list('topFolders', 'folder'),
    extensions: list('extensionGroups', 'extension')
  };
}

/* ------------------------------------------------------------------- builds */

/** The volume table. A provider that did not answer yields null, never zeros. */
export function buildAtlas(result: ToolResult): AtlasSnapshot | null {
  if (!result || result.toolId !== 'disk-overview') return null;
  const summary = record(result.summary);
  const volumes = recordList(result.items).map(item => {
    const id = str(item.deviceId) || str(item.DeviceID);
    const sizeBytes = num(item.sizeBytes) ?? num(item.Size);
    const freeBytes = num(item.freeBytes) ?? num(item.FreeSpace);
    const usedBytes = num(item.usedBytes) ?? (sizeBytes != null && freeBytes != null ? Math.max(0, sizeBytes - freeBytes) : null);
    const letter = id.replace(/[:\\]/g, '').toUpperCase();
    return {
      id: id || '—',
      letter: letter || '?',
      label: str(item.volumeName) || str(item.VolumeName),
      fileSystem: str(item.fileSystem) || str(item.FileSystem) || null,
      serial: str(item.volumeSerialNumber) || null,
      sizeBytes,
      freeBytes,
      usedBytes,
      usedPercent: share(usedBytes, sizeBytes),
      freePercent: share(freeBytes, sizeBytes),
      pressure: pressureOf(item.pressure),
      pressureBasis: str(item.pressureBasis) || null,
      // A device id that is not a single drive letter is not a folder anybody
      // can walk, so it is offered as capacity only — never as a scan root.
      scanRoot: /^[A-Z]$/.test(letter) ? `${letter}:\\` : null
    } satisfies VolumeBay;
  });

  const totals: AtlasTotals = {
    volumes: volumes.length,
    // Only volumes Windows gave a capacity for are summed; an unmeasured volume
    // would otherwise be silently reported as zero bytes of disk.
    capacityBytes: numList(volumes.map(v => v.sizeBytes)).reduce((a, b) => a + b, 0),
    freeBytes: numList(volumes.map(v => v.freeBytes)).reduce((a, b) => a + b, 0),
    usedBytes: numList(volumes.map(v => v.usedBytes)).reduce((a, b) => a + b, 0),
    pressured: volumes.filter(v => v.pressure === 'critical' || v.pressure === 'high').length,
    critical: volumes.filter(v => v.pressure === 'critical').length,
    unknownPressure: volumes.filter(v => v.pressure === 'unknown').length,
    unmeasured: volumes.filter(v => v.sizeBytes == null).length
  };

  return {
    collectedAt: str(result.finishedAt) || str(result.startedAt) || new Date().toISOString(),
    volumes,
    physical: recordList(summary.physicalDisks).map(item => ({
      id: str(item.deviceId),
      friendlyName: str(item.friendlyName) || '—',
      mediaType: str(item.mediaType) || null,
      busType: str(item.busType) || null,
      sizeBytes: num(item.sizeBytes),
      healthStatus: str(item.healthStatus) || null,
      operationalStatus: Array.isArray(item.operationalStatus)
        ? item.operationalStatus.map(str).filter(Boolean).join(', ')
        : str(item.operationalStatus) || null,
      temperatureAvailable: item.temperatureAvailable === true
    } satisfies PhysicalBay)),
    totals,
    volumeProvider: str(summary.volumeProvider) || null,
    physicalProvider: str(summary.physicalProvider) || null,
    inventoryAvailable: summary.inventoryAvailable !== false && volumes.length > 0,
    unavailableReason: str(summary.unavailableReason) || null,
    physicalAvailable: summary.physicalDisksAvailable !== false,
    warnings: strList(result.warnings),
    partial: result.partial === true
  };
}

/** One directory walk, reported as the bytes it measured and what holds them. */
export function buildHeavyScan(result: ToolResult): HeavyScan | null {
  if (!result || result.toolId !== 'large-files') return null;
  const summary = record(result.summary);
  const totalScannedBytes = num(summary.totalScannedBytes) ?? 0;
  const ladders = laddersOf(summary, totalScannedBytes);
  const rows = recordList(result.items).map(item => ({
    path: str(item.path),
    name: baseName(str(item.path)),
    extension: extensionOf(str(item.path)),
    size: num(item.size) ?? 0,
    type: str(item.type) || 'Other',
    ageBucket: str(item.ageBucket) || 'unknown',
    modifiedAt: str(item.modifiedAt) || null,
    folderBucket: bucketOf(str(item.path), str(summary.folder)),
    /** Set when reading this file's content would fetch or materialise it. */
    deferred: str(item.hydrationRisk) === 'avoid',
  } satisfies HeavyRow));
  return {
    root: str(summary.folder),
    collectedAt: str(result.finishedAt) || new Date().toISOString(),
    filesScanned: num(summary.filesScanned) ?? 0,
    matchingFiles: num(summary.matchingFiles) ?? 0,
    thresholdBytes: num(summary.thresholdBytes) ?? 0,
    totalMatchingBytes: num(summary.totalMatchingBytes) ?? rows.reduce((sum, row) => sum + row.size, 0),
    totalScannedBytes,
    ...ladders,
    rows,
    traversal: traversalOf(summary.traversal),
    warnings: strList(result.warnings),
    partial: result.partial === true,
    success: result.success !== false
  };
}

/** Verified duplicate sets. Only the extra copies are ever counted as reclaimable. */
export function buildDuplicateScan(result: ToolResult): DuplicateScan | null {
  if (!result || result.toolId !== 'duplicate-files') return null;
  const summary = record(result.summary);
  const groups = recordList(result.items).map(item => {
    const files = recordList(item.files);
    const keeper = record(item.recommendedKeeper);
    const keeperPath = str(keeper.path);
    return {
      key: `${str(item.hash)}:${num(item.size) ?? 0}`,
      hash: str(item.hash),
      size: num(item.size) ?? 0,
      count: num(item.count) ?? files.length,
      reclaimableBytes: num(item.reclaimableBytes) ?? 0,
      singlePhysicalFile: item.singlePhysicalFile === true,
      physicalDuplicates: num(item.physicalDuplicates) ?? 0,
      risk: str(item.risk) || 'normal',
      keeperPath: keeperPath || null,
      reviewPaths: (Array.isArray(item.reviewFiles) ? recordList(item.reviewFiles) : files.slice(1)).map(f => str(f.path)).filter(Boolean),
      memberPaths: [
        ...new Set([
          ...files.map(f => str(f.path)).filter(Boolean),
          ...(keeperPath ? [keeperPath] : [])
        ])
      ],
      extension: extensionOf(keeperPath)
    } satisfies DuplicateRow;
  });
  return {
    root: str(summary.folder),
    collectedAt: str(result.finishedAt) || new Date().toISOString(),
    filesScanned: num(summary.filesScanned) ?? 0,
    candidateFiles: num(summary.candidateFiles) ?? 0,
    contentVerifiedFiles: num(summary.contentVerifiedFiles) ?? 0,
    skippedForHydration: num(summary.skippedForHydration) ?? 0,
    changedDuringRead: num(summary.changedDuringRead) ?? 0,
    groups,
    duplicateFiles: num(summary.duplicateFiles) ?? groups.reduce((sum, g) => sum + g.count, 0),
    reclaimableBytes: num(summary.reclaimableBytes) ?? groups.reduce((sum, g) => sum + g.reclaimableBytes, 0),
    algorithm: str(summary.exactHashAlgorithm) || 'sha256',
    traversal: traversalOf(summary.traversal),
    warnings: strList(result.warnings),
    partial: result.partial === true,
    success: result.success !== false
  };
}

export function buildEmptyFolderScan(result: ToolResult): EmptyFolderScan | null {
  if (!result || result.toolId !== 'empty-folders') return null;
  const summary = record(result.summary);
  return {
    root: str(summary.folder),
    collectedAt: str(result.finishedAt) || new Date().toISOString(),
    empty: num(summary.emptyFolders) ?? 0,
    scanned: num(summary.foldersScanned) ?? 0,
    inaccessible: num(summary.inaccessibleFolders) ?? 0,
    paths: recordList(result.items).map(item => str(item.path)).filter(Boolean).slice(0, 80),
    success: result.success !== false
  };
}

/* ------------------------------------------------------------- cross checks */

export interface OverlapMeasure {
  /** Heavy files that are also members of a verified duplicate set. */
  paths: number;
  bytes: number;
}

/**
 * How much of the heavy list is already counted as duplicate copies.
 *
 * The two scans walk the same directory independently, so their totals overlap.
 * The atlas says so instead of letting a reader add two numbers that were never
 * meant to be added.
 */
export function overlapBetween(heavy: HeavyScan | null, duplicates: DuplicateScan | null): OverlapMeasure {
  if (!heavy || !duplicates) return { paths: 0, bytes: 0 };
  const members = new Set<string>();
  for (const group of duplicates.groups) {
    // Every member of a verified set counts, not only the paths the engine chose
    // to label keeper or review: a set whose membership was never split still
    // covers the same bytes the heavy walk is about to list.
    for (const path of group.memberPaths.length ? group.memberPaths : [group.keeperPath, ...group.reviewPaths]) {
      if (path) members.add(path.toLowerCase());
    }
  }
  let paths = 0;
  let bytes = 0;
  for (const row of heavy.rows) {
    if (!row.path || !members.has(row.path.toLowerCase())) continue;
    paths += 1;
    bytes += row.size;
  }
  return { paths, bytes };
}

/** Free-space thresholds the engine itself uses, drawn onto the capacity rail. */
export const PRESSURE_TICKS = [
  { freePercent: 20, pressure: 'medium' },
  { freePercent: 10, pressure: 'high' },
  { freePercent: 5, pressure: 'critical' }
] as const;

/** The scan roots the atlas can honestly offer: one per lettered volume. */
export function scanRoots(atlas: AtlasSnapshot | null): Array<{ id: string; letter: string; root: string }> {
  if (!atlas) return [];
  return atlas.volumes
    .filter(volume => volume.scanRoot != null)
    .map(volume => ({ id: volume.id, letter: volume.letter, root: volume.scanRoot as string }));
}

/** One walk that has an answer on record, reduced to the only facts the read
 *  board needs: which folder it walked and when the engine replied. */
export interface ReadOnRecord {
  id: string;
  root: string | null;
  collectedAt: string | null;
}

/**
 * Whether the reads on record describe one folder or several.
 *
 * Three lanes can be walked against three different roots, and a reader who adds
 * "recoverable" to "heavy" across two of them gets a number that was never a
 * measurement of anything. The atlas already refuses to add them; this says why
 * in the one place a reader looks when nothing is selected.
 *
 * Identity is the Windows rule, not the string rule: a trailing separator is not
 * part of a path and `C:\Dir` names the same folder as `c:\dir`.
 */
export function readAgreement(reads: ReadOnRecord[]): { walked: number; roots: string[] } {
  const roots = new Set<string>();
  let walked = 0;
  for (const read of reads) {
    if (!read.root) continue;
    walked += 1;
    roots.add(read.root.replace(/[\\/]+$/, '').toUpperCase());
  }
  return { walked, roots: [...roots] };
}

/**
 * The folder a path sits in, or nothing when it is already at the top.
 *
 * The empty-folder record needs it because a folder name alone rarely locates
 * anything: `New folder` exists under most profiles several times over, and the
 * line above the pick is what tells the reader which one the walk called empty.
 *
 * A drive root has no parent, and returning `''` would render an empty row that
 * reads as a bug rather than as the top of the tree, so the answer is `null` and
 * the record drops the line. Both separators count: Windows accepts either, and
 * a trailing one is not part of the path.
 */
export function parentFolder(path: string): string | null {
  const parts = path.replace(/[\\/]+$/, '').split(/[\\/]/);
  parts.pop();
  const parent = parts.join('\\');
  return parent.length >= 2 ? parent : null;
}
