import type { Locale } from '../locales';
import type { ToolResult } from '@shared/contracts';
import { normalizeQuery } from './search';

/**
 * The Applications view model.
 *
 * Everything here is derived from the real `installed-apps` result: no field is
 * invented, no count is estimated, and a facet that has no backing data is not
 * offered at all. The provider records `estimatedSizeBytes` from the registry's
 * own `EstimatedSize` value, which is what the installer declared rather than
 * what the program occupies on disk, so the view model keeps those two claims
 * apart and the interface labels the first one as advertised.
 */

export type AppScope = 'machine' | 'user';

export interface AppRecord {
  id: string;
  /** Always-safe local key for selection and staging, even before ids exist. */
  uid: string;
  name: string;
  publisher: string | null;
  /** The untouched provider value when it carries more than the readable name. */
  publisherIdentity: string | null;
  version: string | null;
  installDate: string | null;
  installDateKnown: boolean;
  installLocation: string | null;
  architecture: string | null;
  scope: AppScope | null;
  registryView: string | null;
  packageIdentity: string | null;
  uninstallCapability: string | null;
  advertisedSizeBytes: number | null;
  measuredSizeBytes: number | null;
  installSource: string | null;
  releaseType: string | null;
  systemComponent: boolean | null;
  isFramework: boolean | null;
  source: string | null;
  /** Present only when the native icon provider records the registry's DisplayIcon value. */
  iconPath: string | null;
  /** Where the record was read from, kept so the dossier can cite its source. */
  evidence: { root: string | null; key: string | null };
  packaged: boolean;
  searchKey: string;
}

export interface CoverageMeasure {
  key: string;
  known: number;
  total: number;
  /** True when the underlying field is not delivered by the provider at all. */
  supported: boolean;
}

export type FacetId =
  | 'all' | 'desktop' | 'packaged' | 'recent' | 'large' | 'uninstall-supported' | 'system-component';

export interface Facet {
  id: FacetId;
  count: number;
}

export type SortKey = 'name' | 'publisher' | 'size' | 'date';
export type SortDirection = 'ascending' | 'descending';

const UNCATEGORISED = '\u0000';
const RECENT_DAYS = 90;
const LARGE_BYTES = 512 * 1024 * 1024;

function text(value: unknown): string | null {
  const raw = typeof value === 'string' ? value.trim() : '';
  if (!raw || /^(?:null|none|\(null\))$/i.test(raw)) return null;
  return raw;
}

function count(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
}

function flag(value: unknown): boolean | null {
  if (value === true || value === 1) return true;
  if (value === false || value === 0) return false;
  const raw = text(value);
  if (!raw) return null;
  if (/^(true|1|yes)$/i.test(raw)) return true;
  if (/^(false|0|no)$/i.test(raw)) return false;
  return null;
}

/** `2024-05-17` and `2024/05/17` both appear in the uninstall registry. */
export function parseDate(value: string | null): Date | null {
  if (!value) return null;
  const match = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/.exec(value);
  if (!match) {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * A stable renderer-side identity.
 *
 * The native icon provider keys its cache on an id it derives itself; the view
 * model prefers that id and only falls back to a locally built key when the
 * inventory predates the provider, so a stale renderer never asks for an icon it
 * cannot resolve.
 */
function recordId(item: Record<string, unknown>): string {
  const provided = text(item.id);
  if (provided && /^app-[0-9a-f]{8,40}$/.test(provided)) return provided;
  return '';
}

function registryKey(item: Record<string, unknown>): string {
  const evidence = item.evidence as Record<string, unknown> | undefined;
  return text(evidence?.keyName) || text(evidence?.root) || '';
}

/** The registry location the provider actually read, kept for the dossier. */
function evidenceOf(item: Record<string, unknown>): { root: string | null; key: string | null } {
  const evidence = item.evidence as Record<string, unknown> | undefined;
  return { root: text(evidence?.root), key: text(evidence?.keyName) };
}

/**
 * A Windows MSIX publisher is a distinguished name
 * (`CN=Microsoft Corporation, O=Microsoft Corporation, L=Redmond, C=US`);
 * a desktop installer's `Publisher` is usually a plain company name.
 *
 * The ledger shows the name a person would recognise — the same thing Windows
 * Settings shows — and the untouched string stays on the record so the dossier
 * can still cite exactly what the provider returned. Nothing is invented here:
 * when no common name exists, the original value is displayed as it arrived.
 */
function publisherOf(value: string | null): { label: string | null; identity: string | null } {
  if (!value) return { label: null, identity: null };
  const commonName = /(?:^|,)\s*CN=([^,]+)/i.exec(value)?.[1]?.trim();
  if (!commonName) return { label: value, identity: null };
  return { label: commonName, identity: commonName === value ? null : value };
}

export function toAppRecord(item: Record<string, unknown>, index: number): AppRecord {
  const name = text(item.name) || text(item.DisplayName) || '—';
  const { label: publisher, identity: publisherIdentity } = publisherOf(text(item.publisher));
  const installLocation = text(item.installLocation);
  const packageIdentity = text(item.packageIdentity);
  const registryView = text(item.registryView);
  const source = text(item.source);
  const iconPath = text(item.displayIcon) ?? text(item.iconPath);
  const scope = text(item.scope);
  const providerId = recordId(item);
  const record: AppRecord = {
    id: providerId,
    uid: providerId || `row-${index}`,
    name,
    publisher,
    publisherIdentity,
    version: text(item.version),
    installDate: text(item.installDate),
    installDateKnown: Boolean(text(item.installDate)),
    installLocation,
    architecture: text(item.architecture)?.toLowerCase() ?? null,
    scope: scope === 'machine' || scope === 'user' ? scope : null,
    registryView: registryView && registryView !== '—' ? registryView : null,
    packageIdentity,
    uninstallCapability: text(item.uninstallCapability),
    advertisedSizeBytes: count(item.estimatedSizeBytes),
    measuredSizeBytes: count(item.measuredSizeBytes),
    installSource: text(item.installSource),
    releaseType: text(item.releaseType),
    systemComponent: flag(item.systemComponent),
    isFramework: flag(item.isFramework),
    source,
    iconPath,
    evidence: evidenceOf(item),
    packaged: Boolean(packageIdentity) || source === 'appx-package' || source === 'msix',
    searchKey: normalizeQuery([name, publisher, installLocation, packageIdentity, registryKey(item)].filter(Boolean).join(' '))
  };
  return record;
}

export interface InventorySnapshot {
  records: AppRecord[];
  totals: {
    all: number;
    packaged: number;
    desktop: number;
    machineWide: number;
    userOnly: number;
    systemComponents: number;
    uninstallSupported: number;
    withPublisher: number;
    /** How many different publishers the machine actually reports. */
    distinctPublishers: number;
    withVersion: number;
    withAdvertisedSize: number;
    withMeasuredSize: number;
    withDate: number;
    withLocation: number;
    withIconPath: number;
    totalAdvertisedBytes: number;
    largest: number;
  };
  coverage: CoverageMeasure[];
  publishers: Array<{ name: string; count: number }>;
  collectedAt: string;
  partial: boolean;
  warnings: string[];
  providerSummary: Record<string, unknown>;
}

const EMPTY_TOTALS: InventorySnapshot['totals'] = {
  all: 0, packaged: 0, desktop: 0, machineWide: 0, userOnly: 0, systemComponents: 0,
  uninstallSupported: 0, withPublisher: 0, distinctPublishers: 0, withVersion: 0, withAdvertisedSize: 0,
  withMeasuredSize: 0, withDate: 0, withLocation: 0, withIconPath: 0, totalAdvertisedBytes: 0, largest: 0
};

export function buildInventory(result: ToolResult | null | undefined): InventorySnapshot | null {
  if (!result || result.toolId !== 'installed-apps') return null;
  const records = (result.items || []).map((item, index) => toAppRecord(item, index));
  const totals = { ...EMPTY_TOTALS, all: records.length };
  const now = Date.now();
  for (const record of records) {
    if (record.packaged) totals.packaged += 1;
    else totals.desktop += 1;
    if (record.scope === 'machine') totals.machineWide += 1;
    if (record.scope === 'user') totals.userOnly += 1;
    if (record.systemComponent === true) totals.systemComponents += 1;
    if (record.uninstallCapability) totals.uninstallSupported += 1;
    if (record.publisher) totals.withPublisher += 1;
    if (record.version) totals.withVersion += 1;
    if (record.advertisedSizeBytes != null) {
      totals.withAdvertisedSize += 1;
      totals.totalAdvertisedBytes += record.advertisedSizeBytes;
      totals.largest = Math.max(totals.largest, record.advertisedSizeBytes);
    }
    if (record.measuredSizeBytes != null) totals.withMeasuredSize += 1;
    if (record.installDateKnown) {
      const date = parseDate(record.installDate);
      if (date) totals.withDate += 1;
    }
    if (record.installLocation) totals.withLocation += 1;
    if (record.iconPath) totals.withIconPath += 1;
    void now;
  }
  const publisherCounts = new Map<string, number>();
  for (const record of records) {
    const key = record.publisher || UNCATEGORISED;
    publisherCounts.set(key, (publisherCounts.get(key) || 0) + 1);
  }
  const distinctPublishers = [...publisherCounts.keys()].filter(name => name !== UNCATEGORISED).length;
  totals.distinctPublishers = distinctPublishers;
  const publishers = [...publisherCounts.entries()]
    .map(([name, countValue]) => ({ name, count: countValue }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }));

  const denominator = records.length || 1;
  const coverage: CoverageMeasure[] = [
    { key: 'publisher', known: totals.withPublisher, total: denominator, supported: true },
    { key: 'version', known: totals.withVersion, total: denominator, supported: true },
    { key: 'date', known: totals.withDate, total: denominator, supported: true },
    { key: 'advertised-size', known: totals.withAdvertisedSize, total: denominator, supported: true },
    { key: 'location', known: totals.withLocation, total: denominator, supported: true },
    // The icon column only reports support once the provider actually carries
    // DisplayIcon through the inventory; before that it must not claim a number.
    { key: 'icon', known: totals.withIconPath, total: denominator, supported: totals.withIconPath > 0 }
  ];

  return {
    records,
    totals,
    coverage,
    publishers: publishers.filter(item => item.name !== UNCATEGORISED).slice(0, 24),
    collectedAt: result.finishedAt,
    partial: Boolean(result.partial),
    warnings: Array.isArray(result.warnings) ? result.warnings.filter(item => typeof item === 'string') : [],
    providerSummary: (result.summary || {}) as Record<string, unknown>
  };
}

/**
 * What makes a collection the same collection.
 *
 * Two reads that share a signature describe the same programs in the same
 * order, so the register can tell "the machine changed" apart from "the
 * machine was re-read", and reset the user's work only for the first.
 */
export function inventorySignature(records: readonly AppRecord[]): string {
  return JSON.stringify(records.map(record => [record.uid, record.name]));
}

/** A facet is offered only when at least one record can satisfy it. */
/**
 * The one definition of a facet.
 *
 * The chip count and the filter share this function, so a facet can never
 * advertise a number of programs it then fails to show.
 */
export function matchesFacet(record: AppRecord, facet: FacetId, now = Date.now()): boolean {
  switch (facet) {
    case 'all': return true;
    case 'recent': {
      const date = parseDate(record.installDate);
      return !!date && now - date.getTime() <= RECENT_DAYS * 24 * 3600 * 1000;
    }
    case 'large': return (record.advertisedSizeBytes || 0) >= LARGE_BYTES;
    case 'packaged': return record.packaged;
    case 'desktop': return !record.packaged;
    case 'system-component': return record.systemComponent === true;
    case 'uninstall-supported': return Boolean(record.uninstallCapability);
    default: return false;
  }
}

/**
 * A deliberately short primary set.
 *
 * Every chip has to answer a question the coverage ribbon cannot already answer:
 * what kind of package it is, who owns it, how new and how large it is, and
 * whether it can be removed. Missing-field counts live in the ribbon, so they are
 * not repeated here as filters, and a facet with no matching program is not
 * offered at all.
 */
const FACET_ORDER: FacetId[] = [
  'all', 'desktop', 'packaged', 'uninstall-supported', 'recent', 'large', 'system-component'
];

export function facetsFor(inventory: InventorySnapshot): Facet[] {
  const records = inventory.records;
  const now = Date.now();
  const out: Facet[] = [];
  for (const facet of FACET_ORDER) {
    const countValue = records.reduce((sum, record) => sum + (matchesFacet(record, facet, now) ? 1 : 0), 0);
    if (facet === 'all' || countValue > 0) out.push({ id: facet, count: countValue });
  }
  return out;
}

export function applyFacet(records: AppRecord[], facet: FacetId, publisher: string | null, query: string): AppRecord[] {
  const now = Date.now();
  const needle = normalizeQuery(query);
  return records.filter(record => {
    if (publisher && (record.publisher || UNCATEGORISED) !== publisher) return false;
    if (needle && !record.searchKey.includes(needle)) return false;
    return matchesFacet(record, facet, now);
  });
}

function compareName(a: string, b: string, locale: Locale): number {
  return a.localeCompare(b, locale === 'ar' ? 'ar' : 'en', { sensitivity: 'base', numeric: true });
}

export function sortRecords(records: AppRecord[], key: SortKey, direction: SortDirection, locale: Locale): AppRecord[] {
  const factor = direction === 'ascending' ? 1 : -1;
  return [...records].sort((rawA, rawB) => {
    if (key === 'size') {
      const a = rawA.measuredSizeBytes ?? rawA.advertisedSizeBytes ?? -1;
      const b = rawB.measuredSizeBytes ?? rawB.advertisedSizeBytes ?? -1;
      if (a !== b) return (a - b) * factor;
      return compareName(rawA.name, rawB.name, locale);
    }
    if (key === 'date') {
      const a = parseDate(rawA.installDate)?.getTime() ?? -1;
      const b = parseDate(rawB.installDate)?.getTime() ?? -1;
      if (a !== b) return (a - b) * factor;
      return compareName(rawA.name, rawB.name, locale);
    }
    if (key === 'publisher') {
      const a = rawA.publisher || UNCATEGORISED;
      const b = rawB.publisher || UNCATEGORISED;
      if (a !== b) return compareName(a, b, locale) * factor;
      return compareName(rawA.name, rawB.name, locale);
    }
    return compareName(rawA.name, rawB.name, locale) * factor;
  });
}

/** Groups the ledger into chapters when sorting by publisher, otherwise one stream. */
export function groupRecords(records: AppRecord[], key: SortKey, locale: Locale): Array<{ label: string; records: AppRecord[] }> {
  if (key !== 'publisher') return [{ label: '', records }];
  const groups: Array<{ label: string; records: AppRecord[] }> = [];
  let current: { label: string; records: AppRecord[] } | null = null;
  for (const record of records) {
    const label = record.publisher || '';
    if (!current || current.label !== label) {
      current = { label, records: [] };
      groups.push(current);
    }
    current.records.push(record);
  }
  void locale;
  return groups;
}

export interface DossierField {
  key: string;
  value: string | null;
  /** Marks a value that is declared by the installer rather than measured on disk. */
  qualifier?: 'advertised' | 'unverified';
}

export type ActionAvailability = 'available' | 'unavailable';

export interface DossierAction {
  id: 'inspect-folder' | 'copy-registry-path' | 'copy-summary' | 'review-startup' | 'open-website' | 'uninstall' | 'leftovers' | 'cache' | 'updates';
  availability: ActionAvailability;
  reasonKey?: string;
}

/** The full registry location the record was read from, or null for a package. */
export function registryPath(record: AppRecord): string | null {
  if (!record.evidence.root || !record.evidence.key) return null;
  return `${record.evidence.root}\\${record.evidence.key}`;
}

/**
 * The actions the Applications world may offer.
 *
 * Uninstall, leftovers, cache, updates and the publisher site have no engine in
 * the registry, so they are declared unavailable here rather than wired to a
 * button that would pretend. Everything marked available is something the
 * renderer can really do: open a recorded directory through the `knoux:open-path`
 * channel, or write text to the clipboard.
 */
export function actionsFor(record: AppRecord): DossierAction[] {
  return [
    { id: 'inspect-folder', availability: record.installLocation ? 'available' : 'unavailable', reasonKey: 'app.action.reason.noLocation' },
    { id: 'copy-registry-path', availability: registryPath(record) ? 'available' : 'unavailable', reasonKey: 'app.action.reason.noRegistryKey' },
    { id: 'copy-summary', availability: 'available' },
    { id: 'review-startup', availability: 'available' },
    { id: 'uninstall', availability: 'unavailable', reasonKey: 'app.action.reason.noUninstallEngine' },
    { id: 'leftovers', availability: 'unavailable', reasonKey: 'app.action.reason.noLeftoverEngine' },
    { id: 'cache', availability: 'unavailable', reasonKey: 'app.action.reason.noCacheEngine' },
    { id: 'updates', availability: 'unavailable', reasonKey: 'app.action.reason.noUpdateEngine' },
    { id: 'open-website', availability: 'unavailable', reasonKey: 'app.action.reason.noVerifiedLink' }
  ];
}

export function dossierFields(record: AppRecord): DossierField[] {
  const fields: DossierField[] = [
    { key: 'app.field.version', value: record.version },
    { key: 'app.field.publisher', value: record.publisher },
    { key: 'app.field.publisherIdentity', value: record.publisherIdentity },
    { key: 'app.field.date', value: record.installDate },
    { key: 'app.field.scope', value: record.scope },
    { key: 'app.field.architecture', value: record.architecture },
    { key: 'app.field.source', value: record.packaged ? 'packaged' : record.registryView ? `registry:${record.registryView}` : record.source },
    { key: 'app.field.installSource', value: record.installSource },
    { key: 'app.field.location', value: record.installLocation },
    { key: 'app.field.packageIdentity', value: record.packageIdentity }
  ];
  return fields.filter(field => field.value);
}

export function sizeOf(record: AppRecord): { bytes: number | null; kind: 'measured' | 'advertised' | 'unknown' } {
  if (record.measuredSizeBytes != null) return { bytes: record.measuredSizeBytes, kind: 'measured' };
  if (record.advertisedSizeBytes != null) return { bytes: record.advertisedSizeBytes, kind: 'advertised' };
  return { bytes: null, kind: 'unknown' };
}

/**
 * Deterministic identity colour for a program that has no icon yet.
 *
 * Derived from the publisher first and the name second, so two programs from one
 * publisher sit in the same family and the fallback never reads as random.
 */
export function glyphIdentity(record: AppRecord): { letters: string; hue: number } {
  const seedSource = record.publisher || record.name;
  let hash = 0;
  for (let index = 0; index < seedSource.length; index += 1) hash = (hash * 31 + seedSource.charCodeAt(index)) >>> 0;
  const letters = record.name.replace(/[^\p{L}\p{N}]/gu, '').slice(0, 2).toUpperCase() || '··';
  return { letters, hue: hash % 360 };
}
