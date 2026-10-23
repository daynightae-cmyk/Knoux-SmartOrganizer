import type { ToolResult } from '@shared/contracts';
import { normalizeQuery } from './search';

/**
 * The Files view model.
 *
 * Every value here is a measurement the `downloads-inventory` engine took from
 * the directory table — size, timestamps, link count, reparse tag. Nothing is
 * inferred from the file's contents: the engine never opens a file, so the
 * interface never claims to know what is inside one. The type of a file is
 * Windows' own extension-to-group mapping, the age is derived from the
 * modification stamp, and the privacy findings are name patterns only.
 */

export interface FileRecord {
  uid: string;
  path: string;
  /** The file name with its extension, exactly as the directory reports it. */
  name: string;
  /** Name without the trailing extension, so the two can be typeset apart. */
  stem: string;
  /** Lower-cased extension including the dot, or '' when the file has none. */
  extension: string;
  /** The provider's own group for that extension: Archives, Images, and so on. */
  type: string;
  /** today | week | month | quarter | year | older | unknown */
  ageBucket: string;
  size: number;
  /** False when the directory entry carried no size: a 0 then means unmeasured, not empty. */
  sizeKnown: boolean;
  modifiedAt: string | null;
  createdAt: string | null;
  /** Directory relative to the Downloads root; '' means it sits in the root. */
  folder: string;
  inRoot: boolean;
  entryKind: string | null;
  isLink: boolean;
  reparseName: string | null;
  /** Set when reading the file's content would fetch or materialise it. */
  hydrationRisk: string | null;
  hardlinked: boolean;
  linkCount: number | null;
  searchKey: string;
}

export interface CoverageMeasure {
  key: string;
  known: number;
  total: number;
  supported: boolean;
}

export interface TraversalTotals {
  foldersVisited: number;
  filesVisited: number;
  reparsePointsSkipped: number;
  reparsePointsTraversed: number;
  accessDenied: number;
  hardlinkedFiles: number;
  cloudPlaceholders: number;
  allocatedSizeAvailable: boolean;
  excluded: number;
}

export interface ExposureFinding {
  path: string;
  name: string;
  category: string;
  size: number;
  modifiedAt: string | null;
}

export interface FileSnapshot {
  root: string;
  collectedAt: string;
  records: FileRecord[];
  /** Files the walk found, which may exceed the rows the engine returned. */
  filesFound: number;
  totalBytes: number;
  largestBytes: number;
  truncated: boolean;
  typeGroups: Array<{ type: string; files: number; bytes: number; percentBytes: number }>;
  ageBuckets: Array<{ age: string; files: number; bytes: number }>;
  extensionGroups: Array<{ extension: string; files: number; bytes: number }>;
  topFolders: Array<{ folder: string; files: number; bytes: number }>;
  coverage: CoverageMeasure[];
  exposure: { count: number; bytes: number; findings: ExposureFinding[] };
  traversal: TraversalTotals;
  partial: boolean;
  warnings: string[];
}

export type FacetId =
  | 'all' | 'in-root' | 'installers' | 'archives' | 'stale' | 'large' | 'linked' | 'exposed';

export interface Facet {
  id: FacetId;
  count: number;
}

export type SortKey = 'name' | 'size' | 'date' | 'type';
export type SortDirection = 'ascending' | 'descending';

const LARGE_BYTES = 256 * 1024 * 1024;
const STALE_BUCKETS = new Set(['year', 'older']);
const LINK_KINDS = new Set(['reparse', 'symlink', 'junction']);

function text(value: unknown): string | null {
  const raw = typeof value === 'string' ? value.trim() : '';
  return raw || null;
}

function count(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function timestamp(value: unknown): string | null {
  const raw = text(value);
  if (!raw) return null;
  const parsed = new Date(raw).getTime();
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : null;
}

/** Splits a name into its stem and its lower-cased extension. */
export function splitName(name: string): { stem: string; extension: string } {
  const dot = name.lastIndexOf('.');
  if (dot <= 0) return { stem: name, extension: '' };
  return { stem: name.slice(0, dot), extension: name.slice(dot).toLowerCase() };
}

/** Directory portion of a path, on either separator. */
function directoryOf(value: string): string {
  const normalised = value.replace(/\//g, '\\');
  const index = normalised.lastIndexOf('\\');
  return index < 0 ? '' : normalised.slice(0, index);
}

/**
 * The path a file sits at *inside* the scanned root.
 *
 * A full path is up to 260 characters and repeats the same `Downloads\` prefix
 * on every row, which tells the reader nothing twice. The relative part is what
 * differs, and the root is still stated once in the head band.
 */
export function relativeFolder(path: string, root: string): { folder: string; inRoot: boolean } {
  const normalisedPath = path.replace(/\//g, '\\');
  const normalisedRoot = root.replace(/\//g, '\\').replace(/\\+$/, '');
  const inside = normalisedPath.toLowerCase().startsWith(`${normalisedRoot.toLowerCase()}\\`)
    ? normalisedPath.slice(normalisedRoot.length + 1)
    : normalisedPath;
  const directory = directoryOf(inside);
  return { folder: directory, inRoot: directory === '' };
}

function readTraversal(value: unknown): TraversalTotals {
  const source = (value || {}) as Record<string, unknown>;
  return {
    foldersVisited: count(source.foldersVisited) ?? 0,
    filesVisited: count(source.filesVisited) ?? 0,
    reparsePointsSkipped: count(source.reparsePointsSkipped) ?? 0,
    reparsePointsTraversed: count(source.reparsePointsTraversed) ?? 0,
    accessDenied: count(source.accessDenied) ?? 0,
    hardlinkedFiles: count(source.hardlinkedFiles) ?? 0,
    cloudPlaceholders: count(source.cloudPlaceholders) ?? 0,
    allocatedSizeAvailable: source.allocatedSizeAvailable === true,
    excluded: count(source.excluded) ?? 0
  };
}

function toFileRecord(item: unknown, index: number, root: string): FileRecord | null {
  const source = (item || {}) as Record<string, unknown>;
  const path = text(source.path);
  if (!path) return null;
  const name = text(source.name) || path.split(/[\\/]/).filter(Boolean).pop() || path;
  const { stem, extension } = splitName(name);
  const { folder, inRoot } = relativeFolder(path, root);
  const entryKind = text(source.entryKind);
  const reparseName = text(source.reparseName);
  return {
    uid: `file-${index}`,
    path,
    name,
    stem,
    extension,
    type: text(source.type) || (extension ? 'Other' : 'No extension'),
    ageBucket: text(source.ageBucket) || 'unknown',
    size: count(source.size) ?? 0,
    sizeKnown: count(source.size) !== null,
    modifiedAt: timestamp(source.modifiedAt),
    createdAt: timestamp(source.createdAt),
    folder,
    inRoot,
    entryKind,
    isLink: Boolean(entryKind && LINK_KINDS.has(entryKind.toLowerCase())) || Boolean(reparseName),
    reparseName,
    hydrationRisk: text(source.hydrationRisk),
    hardlinked: source.hardlinked === true,
    linkCount: count(source.linkCount),
    searchKey: normalizeQuery(`${name} ${folder} ${extension} ${text(source.type) || ''}`)
  };
}

function groupList(value: unknown, keyName: string): Array<Record<string, number | string>> {
  if (!Array.isArray(value)) return [];
  const groups: Array<Record<string, number | string>> = [];
  for (const entry of value) {
    const source = (entry || {}) as Record<string, unknown>;
    const label = text(source[keyName]);
    if (!label) continue;
    groups.push({
      [keyName]: label,
      files: count(source.files) ?? 0,
      bytes: count(source.bytes) ?? 0,
      percentBytes: count(source.percentBytes) ?? 0
    });
  }
  return groups;
}

/**
 * Builds the Files snapshot from a real `downloads-inventory` result.
 *
 * Returns null when the result is not a Downloads read, so a page never renders
 * another tool's payload under its own headings.
 */
export function buildFileSnapshot(result: ToolResult | null | undefined): FileSnapshot | null {
  if (!result || result.toolId !== 'downloads-inventory') return null;
  const summary = (result.summary || {}) as Record<string, unknown>;
  const root = text(summary.folder) || '';
  const records = (result.items || [])
    .map((item, index) => toFileRecord(item, index, root))
    .filter((record): record is FileRecord => Boolean(record));

  let largestBytes = 0;
  let withSize = 0;
  let withModified = 0;
  let withCreated = 0;
  let withExtension = 0;
  for (const record of records) {
    if (record.size > largestBytes) largestBytes = record.size;
    if (record.sizeKnown) withSize += 1;
    if (record.modifiedAt) withModified += 1;
    if (record.createdAt) withCreated += 1;
    if (record.extension) withExtension += 1;
  }

  const traversal = readTraversal(summary.traversal);
  const total = records.length;
  // Each measure says how many of the returned rows actually carry the
  // attribute. Stating "size 100%" when some entries reported nothing would be
  // an invented metric, so the count is taken from the rows, not assumed.
  const coverage: CoverageMeasure[] = [
    { key: 'size', known: withSize, total, supported: withSize > 0 },
    { key: 'extension', known: withExtension, total, supported: withExtension > 0 },
    { key: 'modified', known: withModified, total, supported: withModified > 0 },
    { key: 'created', known: withCreated, total, supported: withCreated > 0 }
  ];

  const findings = Array.isArray(summary.privacyFindings) ? summary.privacyFindings : [];
  const exposure: FileSnapshot['exposure'] = {
    count: count(summary.privacyExposureCount) ?? 0,
    bytes: count(summary.privacyExposureBytes) ?? 0,
    findings: findings.map(entry => {
      const source = (entry || {}) as Record<string, unknown>;
      return {
        path: text(source.path) || '',
        name: text(source.name) || '',
        category: text(source.category) || 'unknown',
        size: count(source.size) ?? 0,
        modifiedAt: timestamp(source.modifiedAt)
      };
    }).filter(finding => Boolean(finding.path))
  };

  return {
    root,
    collectedAt: result.finishedAt || result.startedAt || new Date().toISOString(),
    records,
    filesFound: count(summary.files) ?? total,
    totalBytes: count(summary.totalBytes) ?? records.reduce((sum, record) => sum + record.size, 0),
    largestBytes,
    truncated: summary.truncated === true,
    typeGroups: groupList(summary.typeGroups, 'type') as FileSnapshot['typeGroups'],
    ageBuckets: groupList(summary.ageBuckets, 'age') as FileSnapshot['ageBuckets'],
    extensionGroups: groupList(summary.extensionGroups, 'extension') as FileSnapshot['extensionGroups'],
    topFolders: groupList(summary.topFolders, 'folder') as FileSnapshot['topFolders'],
    coverage,
    exposure,
    traversal,
    partial: result.partial === true,
    warnings: Array.isArray(result.warnings) ? result.warnings.filter(item => typeof item === 'string') : []
  };
}

/* ------------------------------------------------------------------ facets */

export function matchesFacet(record: FileRecord, facet: FacetId, exposed: ReadonlySet<string>): boolean {
  switch (facet) {
    case 'all': return true;
    case 'in-root': return record.inRoot;
    case 'installers': return record.type === 'Installers';
    case 'archives': return record.type === 'Archives';
    case 'stale': return STALE_BUCKETS.has(record.ageBucket);
    case 'large': return record.size >= LARGE_BYTES;
    case 'linked': return record.isLink;
    case 'exposed': return exposed.has(record.path);
    default: return false;
  }
}

/** A facet is offered only when at least one record can satisfy it. */
export function facetsFor(snapshot: FileSnapshot): Facet[] {
  const exposed = exposedPaths(snapshot);
  const ids: FacetId[] = ['all', 'in-root', 'installers', 'archives', 'stale', 'large', 'linked', 'exposed'];
  return ids
    .map(id => ({ id, count: snapshot.records.filter(record => matchesFacet(record, id, exposed)).length }))
    .filter(facet => facet.count > 0);
}

export function exposedPaths(snapshot: FileSnapshot): Set<string> {
  return new Set(snapshot.exposure.findings.map(finding => finding.path));
}

/**
 * What the walk groups a file under, using the engine's own bucket names.
 *
 * `buildStorageIntelligence` files every entry by its first segment below the
 * scanned root, and calls the loose ones `(root)`; an entry with no dot gets
 * `(none)`. The idle inspector lists those two groupings, and selecting a row
 * narrows the ledger, so the comparison has to be made on the same rule the
 * engine used — matching a path substring instead would let `Data` select a
 * `Data2026` folder beside it. Windows names are case-insensitive, so the
 * compare is too.
 */
export const ROOT_BUCKET = '(root)';
export const NO_EXTENSION_BUCKET = '(none)';

export function bucketOf(record: FileRecord): string {
  const first = record.folder.split('\\').filter(Boolean)[0];
  return first || ROOT_BUCKET;
}

export function extensionBucketOf(record: FileRecord): string {
  return record.extension || NO_EXTENSION_BUCKET;
}

export function matchesBucket(record: FileRecord, bucket: string): boolean {
  return bucketOf(record).toLowerCase() === bucket.toLowerCase();
}

export function matchesExtension(record: FileRecord, extension: string): boolean {
  return extensionBucketOf(record).toLowerCase() === extension.toLowerCase();
}

export function applyFacet(records: FileRecord[], facet: FacetId, exposed: ReadonlySet<string>, query: string): FileRecord[] {
  const needle = normalizeQuery(query);
  return records.filter(record => {
    if (!matchesFacet(record, facet, exposed)) return false;
    if (!needle) return true;
    return record.searchKey.includes(needle);
  });
}

export function sortRecords(records: FileRecord[], key: SortKey, direction: SortDirection, locale: string): FileRecord[] {
  const factor = direction === 'ascending' ? 1 : -1;
  const collator = new Intl.Collator(locale, { numeric: true, sensitivity: 'base' });
  return [...records].sort((a, b) => {
    let delta = 0;
    if (key === 'size') delta = a.size - b.size;
    else if (key === 'date') delta = (a.modifiedAt ? Date.parse(a.modifiedAt) : 0) - (b.modifiedAt ? Date.parse(b.modifiedAt) : 0);
    else if (key === 'type') delta = collator.compare(a.type, b.type) || collator.compare(a.name, b.name);
    else delta = collator.compare(a.name, b.name);
    if (delta === 0) delta = collator.compare(a.name, b.name);
    return delta * factor;
  });
}

/* -------------------------------------------------------------- age bands */

export const AGE_ORDER = ['today', 'week', 'month', 'quarter', 'year', 'older', 'unknown'] as const;

/** Re-orders the provider's size-ranked buckets into calendar order. */
export function ageInOrder(snapshot: FileSnapshot): Array<{ age: string; files: number; bytes: number; percentBytes: number }> {
  const byAge = new Map(snapshot.ageBuckets.map(bucket => [bucket.age, bucket]));
  const total = snapshot.totalBytes || 1;
  return AGE_ORDER
    .filter(age => byAge.has(age))
    .map(age => {
      const bucket = byAge.get(age)!;
      return { age: bucket.age, files: bucket.files, bytes: bucket.bytes, percentBytes: Math.round((bucket.bytes / total) * 1000) / 10 };
    });
}

export function typeInOrder(snapshot: FileSnapshot): FileSnapshot['typeGroups'] {
  return [...snapshot.typeGroups].sort((a, b) => b.bytes - a.bytes);
}

/* ------------------------------------------------------------------- plan */

export interface PlanMove {
  uid: string;
  source: string;
  destination: string | null;
  name: string;
  /** The category folder the engine would file it under, when one was planned. */
  category: string | null;
  size: number;
  /** null means the move can happen; anything else says why it cannot. */
  withheld: 'destination-exists' | string | null;
  reason: string | null;
}

export interface PlanSnapshot {
  source: string;
  moves: PlanMove[];
  planned: number;
  collisions: number;
  skipped: number;
  skippedReasons: string[];
  previewOnly: boolean;
  plannedBytes: number;
  collectedAt: string;
}

/**
 * Reads an `organize-downloads-preview` result.
 *
 * The engine returns three different kinds of row in one list — moves it would
 * make, moves it withheld because the destination name is taken, and files its
 * safety policy refused to touch. They are separated here because showing a
 * withheld move in the same lane as a planned one would overstate what Apply
 * actually does.
 */
export function buildPlan(result: ToolResult | null | undefined): PlanSnapshot | null {
  if (!result || result.toolId !== 'organize-downloads-preview') return null;
  const summary = (result.summary || {}) as Record<string, unknown>;
  const source = text(summary.sourceFolder) || '';
  const moves = (result.items || []).map((item, index) => {
    const entry = (item || {}) as Record<string, unknown>;
    const path = text(entry.source) || '';
    const destination = text(entry.destination);
    const normalised = path.replace(/\//g, '\\');
    return {
      uid: `move-${index}`,
      source: path,
      destination,
      name: normalised.split('\\').filter(Boolean).pop() || path,
      category: destination ? (directoryOf(destination).replace(/\//g, '\\').split('\\').filter(Boolean).pop() || null) : null,
      size: count(entry.size) ?? 0,
      withheld: text(entry.blocked) || (destination ? null : 'not-planned'),
      reason: text(entry.reason)
    } satisfies PlanMove;
  }).filter(move => Boolean(move.source));

  const plannedMoves = moves.filter(move => !move.withheld);
  const reasons = Array.isArray(summary.skippedReasons) ? summary.skippedReasons.filter((item): item is string => typeof item === 'string') : [];

  return {
    source,
    moves,
    planned: count(summary.plannedMoves) ?? plannedMoves.length,
    collisions: count(summary.blockedByCollision) ?? 0,
    skipped: count(summary.skipped) ?? 0,
    skippedReasons: reasons,
    previewOnly: summary.previewOnly === true,
    plannedBytes: plannedMoves.reduce((sum, move) => sum + move.size, 0),
    collectedAt: result.finishedAt || result.startedAt || new Date().toISOString()
  };
}

/** Groups the planned half of a plan by the category folder it would land in. */
export function planCategories(plan: PlanSnapshot): Array<{ category: string; moves: PlanMove[]; bytes: number }> {
  const byCategory = new Map<string, PlanMove[]>();
  for (const move of plan.moves) {
    if (move.withheld) continue;
    const key = move.category || 'Ungrouped';
    const bucket = byCategory.get(key);
    if (bucket) bucket.push(move);
    else byCategory.set(key, [move]);
  }
  return [...byCategory.entries()]
    .map(([category, moves]) => ({ category, moves, bytes: moves.reduce((sum, move) => sum + move.size, 0) }))
    .sort((a, b) => b.moves.length - a.moves.length || a.category.localeCompare(b.category));
}

/* --------------------------------------------------------------- inspector */

export interface FileField {
  key: string;
  value: string | null;
  /** Says when a value is a Windows attribute rather than a measured fact. */
  qualifier?: 'metadata-only';
}

export function fileFields(record: FileRecord): FileField[] {
  return [
    { key: 'file.field.size', value: String(record.size) },
    { key: 'file.field.type', value: record.type },
    { key: 'file.field.extension', value: record.extension || null },
    { key: 'file.field.folder', value: record.folder || null },
    { key: 'file.field.modified', value: record.modifiedAt },
    { key: 'file.field.created', value: record.createdAt },
    { key: 'file.field.entryKind', value: record.entryKind },
    { key: 'file.field.reparse', value: record.reparseName },
    { key: 'file.field.linkCount', value: record.linkCount == null ? null : String(record.linkCount) },
    { key: 'file.field.path', value: record.path }
  ];
}

/**
 * What the Files world may actually do to a selected file.
 *
 * Hashing is a registered read-only engine. Metadata reading, provenance and
 * safe deletion are not, so they are reported as unavailable instead of being
 * wired to buttons that would do nothing.
 */
export function fileActions(record: FileRecord): Array<{ id: 'hash' | 'reveal-folder' | 'metadata' | 'provenance' | 'quarantine'; available: boolean; reasonKey?: string }> {
  const hashable = !record.isLink && record.hydrationRisk !== 'avoid';
  return [
    { id: 'hash', available: hashable, reasonKey: 'file.action.reason.linked' },
    { id: 'reveal-folder', available: true },
    { id: 'metadata', available: false, reasonKey: 'file.action.reason.noMetadataEngine' },
    { id: 'provenance', available: false, reasonKey: 'file.action.reason.noProvenanceEngine' },
    { id: 'quarantine', available: false, reasonKey: 'file.action.reason.noFileQuarantineEngine' }
  ];
}

export const LARGE_THRESHOLD = LARGE_BYTES;
