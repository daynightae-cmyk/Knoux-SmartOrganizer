import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { ToolResult } from '@shared/contracts';
import { dictionaries } from '../src/locales';
import {
  ageInOrder, applyFacet, buildFileSnapshot, buildPlan, bucketOf, exposedPaths, extensionBucketOf,
  facetsFor, fileActions, fileFields, LARGE_THRESHOLD, matchesBucket, matchesExtension, matchesFacet,
  NO_EXTENSION_BUCKET, planCategories, relativeFolder, ROOT_BUCKET,
  sortRecords, splitName, typeInOrder, type FileRecord
} from '../src/lib/file-inventory';

/**
 * The Files view model decides what the Downloads bench is allowed to claim.
 *
 * Three lines are held here: a proportion is only ever computed from bytes the
 * directory table reported, an attribute the entry did not carry is counted as
 * unknown instead of zero, and a move the organisation engine withheld never
 * appears in the lane of moves Apply would make.
 */

function resultOf(
  toolId: string,
  items: Array<Record<string, unknown>>,
  summary: Record<string, unknown> = {},
  overrides: Record<string, unknown> = {}
): ToolResult {
  return {
    operationId: 'op-1',
    toolId,
    success: true,
    partial: false,
    startedAt: '2026-10-23T09:00:00.000Z',
    finishedAt: '2026-10-23T09:00:04.000Z',
    summary,
    items,
    warnings: [],
    errors: [],
    ...overrides
  } as unknown as ToolResult;
}

const ROOT = 'C:\\Users\\tester\\Downloads';

const INSTALLER = {
  path: `${ROOT}\\knoux-setup-1.4.0.exe`,
  name: 'knoux-setup-1.4.0.exe',
  type: 'Installers',
  ageBucket: 'week',
  size: 84_000_000,
  modifiedAt: '2026-10-18T14:20:00.000Z',
  createdAt: '2026-10-18T14:20:00.000Z',
  entryKind: 'file'
};

const ARCHIVE = {
  path: `${ROOT}\\datasets\\2026\\quarter-3.zip`,
  name: 'quarter-3.zip',
  type: 'Archives',
  ageBucket: 'month',
  size: 4_200_000,
  modifiedAt: '2026-09-30T08:00:00.000Z',
  createdAt: '2026-09-30T08:00:00.000Z',
  entryKind: 'file'
};

// A cloud placeholder: reading it would fetch its content, so no action here
// may treat it as an ordinary file.
const CLOUD = {
  path: `${ROOT}\\team-share.mp4`,
  name: 'team-share.mp4',
  type: 'Video',
  ageBucket: 'older',
  size: 900_000_000,
  modifiedAt: '2024-02-02T02:02:02.000Z',
  entryKind: 'reparse',
  reparseName: 'IO_REPARSE_TAG_CLOUD',
  hydrationRisk: 'avoid'
};

// No size at all: the entry exists but Windows did not report a length.
const UNMEASURED = {
  path: `${ROOT}\\notes`,
  name: 'notes',
  ageBucket: 'today',
  entryKind: 'file'
};

// A name the privacy pattern set recognises.
const EXPOSED = {
  path: `${ROOT}\\production.env`,
  name: 'production.env',
  type: 'Documents',
  ageBucket: 'year',
  size: 2048,
  modifiedAt: '2025-05-05T05:05:05.000Z',
  entryKind: 'file',
  hardlinked: true,
  linkCount: 2
};

function inventory(items: Array<Record<string, unknown>> = [INSTALLER, ARCHIVE, CLOUD, UNMEASURED, EXPOSED]): ToolResult {
  return resultOf('downloads-inventory', items, {
    folder: ROOT,
    files: items.length,
    shownFiles: items.length,
    truncated: false,
    totalBytes: items.reduce((sum, item) => sum + Number(item.size || 0), 0),
    typeGroups: [
      { type: 'Video', files: 1, bytes: 900_000_000, percentBytes: 90.5 },
      { type: 'Installers', files: 1, bytes: 84_000_000, percentBytes: 8.5 },
      { type: 'Archives', files: 1, bytes: 4_200_000, percentBytes: 0.4 },
      { type: 'Documents', files: 1, bytes: 2048, percentBytes: 0 }
    ],
    ageBuckets: [
      { age: 'older', files: 1, bytes: 900_000_000 },
      { age: 'week', files: 1, bytes: 84_000_000 },
      { age: 'month', files: 1, bytes: 4_200_000 },
      { age: 'year', files: 1, bytes: 2048 },
      { age: 'today', files: 1, bytes: 0 }
    ],
    extensionGroups: [{ extension: '.exe', files: 1, bytes: 84_000_000 }],
    topFolders: [{ folder: 'datasets\\2026', files: 1, bytes: 4_200_000 }],
    privacyExposureCount: 1,
    privacyExposureBytes: 2048,
    privacyFindings: [{ path: EXPOSED.path, name: EXPOSED.name, category: 'environment-config', size: 2048, modifiedAt: EXPOSED.modifiedAt }],
    traversal: { foldersVisited: 3, filesVisited: items.length, accessDenied: 1, cloudPlaceholders: 1, hardlinkedFiles: 1 }
  });
}

describe('name and path splitting', () => {
  it('separates a stem from a lower-cased extension', () => {
    expect(splitName('Setup-1.4.0.EXE')).toEqual({ stem: 'Setup-1.4.0', extension: '.exe' });
  });

  it('treats a leading dot as part of the name, not as an extension', () => {
    expect(splitName('.env')).toEqual({ stem: '.env', extension: '' });
    expect(splitName('notes')).toEqual({ stem: 'notes', extension: '' });
  });

  it('makes a path inside the root relative and leaves anything outside it alone', () => {
    expect(relativeFolder(`${ROOT}\\datasets\\2026\\q3.zip`, ROOT)).toEqual({ folder: 'datasets\\2026', inRoot: false });
    expect(relativeFolder(`${ROOT}\\q3.zip`, ROOT)).toEqual({ folder: '', inRoot: true });
    expect(relativeFolder(`${ROOT}\\`, `${ROOT}\\`)).toEqual({ folder: '', inRoot: true });
    expect(relativeFolder('C:\\Windows\\notepad.exe', ROOT)).toEqual({ folder: 'C:\\Windows', inRoot: false });
  });

  it('accepts forward separators, which the provider mixes', () => {
    expect(relativeFolder(`${ROOT}/a/b/c.txt`, ROOT)).toEqual({ folder: 'a\\b', inRoot: false });
  });
});

describe('the walk’s own groupings', () => {
  // The idle inspector lists what `buildStorageIntelligence` grouped, and
  // selecting a row narrows the ledger. Both halves have to agree on the bucket
  // name, or the panel offers a filter that returns nothing.
  const snapshot = buildFileSnapshot(inventory())!;
  const [installer, archive, cloud] = snapshot.records;

  it('buckets a file by the first segment under the root', () => {
    expect(bucketOf(archive)).toBe('datasets');
    expect(bucketOf(installer)).toBe(ROOT_BUCKET);
    expect(bucketOf(cloud)).toBe(ROOT_BUCKET);
  });

  it('matches a bucket the way Windows matches a name, and never as a path prefix', () => {
    expect(matchesBucket(archive, 'DATASETS')).toBe(true);
    expect(matchesBucket(archive, 'datasets\\2026')).toBe(false);
    expect(matchesBucket(installer, ROOT_BUCKET)).toBe(true);
  });

  it('gives an entry with no dot the engine’s own no-extension bucket', () => {
    const notes = snapshot.records.find(record => record.name === 'notes')!;
    expect(extensionBucketOf(notes)).toBe(NO_EXTENSION_BUCKET);
    expect(matchesExtension(notes, NO_EXTENSION_BUCKET)).toBe(true);
    expect(matchesExtension(installer, '.exe')).toBe(true);
  });
});

describe('buildFileSnapshot', () => {
  it('refuses a result that is not a Downloads read', () => {
    expect(buildFileSnapshot(resultOf('installed-apps', [], {}))).toBeNull();
    expect(buildFileSnapshot(null)).toBeNull();
  });

  it('carries the folder, the stamp and the measured total', () => {
    const snapshot = buildFileSnapshot(inventory())!;
    expect(snapshot.root).toBe(ROOT);
    expect(snapshot.records).toHaveLength(5);
    expect(snapshot.totalBytes).toBe(988_202_048);
    expect(snapshot.largestBytes).toBe(900_000_000);
    expect(snapshot.collectedAt).toBe('2026-10-23T09:00:04.000Z');
  });

  it('keeps an unreported size as unmeasured rather than calling it zero bytes', () => {
    const snapshot = buildFileSnapshot(inventory())!;
    const notes = snapshot.records.find(record => record.name === 'notes')!;
    expect(notes.size).toBe(0);
    expect(notes.sizeKnown).toBe(false);
    const size = snapshot.coverage.find(measure => measure.key === 'size')!;
    expect(size.known).toBe(4);
    expect(size.total).toBe(5);
  });

  it('counts created stamps from the rows that actually carry one', () => {
    const snapshot = buildFileSnapshot(inventory())!;
    const created = snapshot.coverage.find(measure => measure.key === 'created')!;
    // The installer and the archive are the only rows that report a creation time.
    expect(created.known).toBe(2);
    expect(created.total).toBe(5);
  });

  it('derives a type for an entry the provider left unlabelled', () => {
    const snapshot = buildFileSnapshot(inventory())!;
    const notes = snapshot.records.find(record => record.name === 'notes')!;
    expect(notes.type).toBe('No extension');
    expect(notes.extension).toBe('');
  });

  it('marks a reparse entry as a link and records why its content is off limits', () => {
    const snapshot = buildFileSnapshot(inventory())!;
    const video = snapshot.records.find(record => record.name === 'team-share.mp4')!;
    expect(video.isLink).toBe(true);
    expect(video.hydrationRisk).toBe('avoid');
    expect(video.reparseName).toBe('IO_REPARSE_TAG_CLOUD');
  });

  it('normalises timestamps to ISO so ordering and formatting stay stable', () => {
    const snapshot = buildFileSnapshot(inventory())!;
    const installer = snapshot.records.find(record => record.name === INSTALLER.name)!;
    expect(installer.modifiedAt).toBe('2026-10-18T14:20:00.000Z');
    const unmeasured = snapshot.records.find(record => record.name === 'notes')!;
    expect(unmeasured.modifiedAt).toBeNull();
  });

  it('passes the privacy findings through without inventing a category', () => {
    const snapshot = buildFileSnapshot(inventory())!;
    expect(snapshot.exposure.count).toBe(1);
    expect(snapshot.exposure.findings[0]).toMatchObject({ category: 'environment-config', name: 'production.env' });
    expect(exposedPaths(snapshot)).toEqual(new Set([EXPOSED.path]));
  });

  it('reports a partial or truncated read instead of hiding it', () => {
    const truncated = buildFileSnapshot(resultOf('downloads-inventory', [INSTALLER], { folder: ROOT, files: 9000, truncated: true }, { partial: true, warnings: ['access denied'] }))!;
    expect(truncated.truncated).toBe(true);
    expect(truncated.partial).toBe(true);
    expect(truncated.warnings).toEqual(['access denied']);
    expect(truncated.filesFound).toBe(9000);
    expect(truncated.records).toHaveLength(1);
  });

  it('falls back to summing the rows when the engine reports no total', () => {
    const snapshot = buildFileSnapshot(resultOf('downloads-inventory', [INSTALLER, ARCHIVE], { folder: ROOT }))!;
    expect(snapshot.totalBytes).toBe(88_200_000);
  });

  it('orders the age buckets by calendar, not by the provider size ranking', () => {
    const snapshot = buildFileSnapshot(inventory())!;
    expect(ageInOrder(snapshot).map(bucket => bucket.age)).toEqual(['today', 'week', 'month', 'year', 'older']);
  });

  it('orders the type groups by the bytes they hold', () => {
    const snapshot = buildFileSnapshot(inventory())!;
    expect(typeInOrder(snapshot).map(group => group.type)).toEqual(['Video', 'Installers', 'Archives', 'Documents']);
  });
});

describe('facets and filtering', () => {
  const snapshot = buildFileSnapshot(inventory())!;
  const exposed = exposedPaths(snapshot);
  const byName = (name: string) => snapshot.records.find(record => record.name === name)!;

  it('offers only the facets this folder can satisfy', () => {
    const ids = facetsFor(snapshot).map(facet => facet.id);
    expect(ids[0]).toBe('all');
    expect(ids).toContain('in-root');
    expect(ids).toContain('exposed');
    expect(ids).toContain('large');
    expect(ids).toContain('linked');
  });

  it('counts a facet exactly as many rows as it later returns', () => {
    for (const facet of facetsFor(snapshot)) {
      const matched = snapshot.records.filter(record => matchesFacet(record, facet.id, exposed));
      expect(matched).toHaveLength(facet.count);
      expect(applyFacet(snapshot.records, facet.id, exposed, '')).toHaveLength(facet.count);
    }
  });

  it('keeps the large-facet threshold at the honest 256 MiB', () => {
    expect(LARGE_THRESHOLD).toBe(256 * 1024 * 1024);
    const records: FileRecord[] = [
      { ...byName(INSTALLER.name), size: LARGE_THRESHOLD },
      { ...byName(INSTALLER.name), size: LARGE_THRESHOLD - 1 }
    ];
    expect(records.filter(record => matchesFacet(record, 'large', exposed))).toHaveLength(1);
  });

  it('splits stale rows on the modification bucket', () => {
    const stale = snapshot.records.filter(record => matchesFacet(record, 'stale', exposed)).map(record => record.ageBucket);
    expect(new Set(stale)).toEqual(new Set(['year', 'older']));
  });

  it('searches name, folder and extension together', () => {
    expect(applyFacet(snapshot.records, 'all', exposed, 'quarter')).toHaveLength(1);
    expect(applyFacet(snapshot.records, 'all', exposed, 'DATASETS')).toHaveLength(1);
    expect(applyFacet(snapshot.records, 'all', exposed, '.env')).toHaveLength(1);
    expect(applyFacet(snapshot.records, 'installers', exposed, 'knoux')).toHaveLength(1);
    expect(applyFacet(snapshot.records, 'installers', exposed, 'quarter')).toHaveLength(0);
  });

  it('sorts by size and by name in both directions', () => {
    const descending = sortRecords(snapshot.records, 'size', 'descending', 'en').map(record => record.size);
    expect(descending).toEqual([...descending].sort((a, b) => b - a));
    const ascending = sortRecords(snapshot.records, 'name', 'ascending', 'en').map(record => record.name);
    expect(ascending).toEqual([...ascending].sort((a, b) => a.localeCompare(b, 'en', { numeric: true, sensitivity: 'base' })));
  });
});

describe('the organisation plan', () => {
  const planned = (name: string, category: string, size: number) => ({
    source: `${ROOT}\\${name}`,
    destination: `${ROOT}\\${category}\\${name}`,
    size
  });

  function preview(items: Array<Record<string, unknown>>, summary: Record<string, unknown> = {}): ToolResult {
    return resultOf('organize-downloads-preview', items, {
      sourceFolder: ROOT,
      plannedMoves: items.filter(item => item.destination && !item.blocked).length,
      blockedByCollision: items.filter(item => item.blocked === 'destination-exists').length,
      skipped: items.filter(item => !item.destination && !item.blocked).length,
      skippedReasons: ['cloud placeholder'],
      previewOnly: true,
      ...summary
    });
  }

  it('reads only a preview result', () => {
    expect(buildPlan(resultOf('downloads-inventory', [], {}))).toBeNull();
  });

  it('keeps a planned move in its category lane and a withheld move out of it', () => {
    const plan = buildPlan(preview([
      planned('a.exe', 'Installers', 10),
      planned('b.exe', 'Installers', 20),
      planned('c.zip', 'Archives', 30),
      { source: `${ROOT}\\d.iso`, destination: `${ROOT}\\Installers\\d.iso`, blocked: 'destination-exists', size: 40 },
      { source: `${ROOT}\\cloud.mp4`, reason: 'cloud placeholder', size: 50 }
    ]))!;

    expect(plan.moves).toHaveLength(5);
    expect(plan.planned).toBe(3);
    expect(plan.collisions).toBe(1);
    expect(plan.skipped).toBe(1);
    // Only the moves Apply would actually make contribute to the quoted bytes.
    expect(plan.plannedBytes).toBe(60);
    expect(plan.previewOnly).toBe(true);

    const lanes = planCategories(plan);
    expect(lanes.map(lane => [lane.category, lane.moves.length])).toEqual([['Installers', 2], ['Archives', 1]]);
    expect(lanes.find(lane => lane.category === 'Installers')!.bytes).toBe(30);
    expect(lanes.flatMap(lane => lane.moves).some(move => move.withheld)).toBe(false);
  });

  it('labels a withheld destination collision distinctly from an uncomputed one', () => {
    const plan = buildPlan(preview([
      { source: `${ROOT}\\x.exe`, destination: `${ROOT}\\Installers\\x.exe`, blocked: 'destination-exists', size: 1 },
      { source: `${ROOT}\\y.exe`, reason: 'reparse point', size: 1 }
    ]))!;
    expect(plan.moves[0].withheld).toBe('destination-exists');
    expect(plan.moves[0].reason).toBeNull();
    expect(plan.moves[1].withheld).toBe('not-planned');
    expect(plan.moves[1].reason).toBe('reparse point');
    expect(planCategories(plan)).toEqual([]);
  });

  it('names each move from its source path so a lane row is readable', () => {
    const plan = buildPlan(preview([planned('setup.exe', 'Installers', 5)]))!;
    expect(plan.moves[0].name).toBe('setup.exe');
    expect(plan.moves[0].category).toBe('Installers');
    expect(plan.moves[0].withheld).toBeNull();
  });

  it('trusts the engine counters over the row count when they differ', () => {
    const plan = buildPlan(preview([planned('a.exe', 'Installers', 5)], { plannedMoves: 41 }))!;
    expect(plan.planned).toBe(41);
  });
});

describe('the inspector contract', () => {
  const snapshot = buildFileSnapshot(inventory())!;
  const record = (name: string) => snapshot.records.find(entry => entry.name === name)!;

  it('lists only attributes the read carried, in a fixed order', () => {
    const keys = fileFields(record(INSTALLER.name)).map(field => field.key);
    expect(keys).toEqual([
      'file.field.size', 'file.field.type', 'file.field.extension', 'file.field.folder',
      'file.field.modified', 'file.field.created', 'file.field.entryKind', 'file.field.reparse',
      'file.field.linkCount', 'file.field.path'
    ]);
    const notes = fileFields(record('notes'));
    expect(notes.find(field => field.key === 'file.field.created')!.value).toBeNull();
  });

  it('offers hashing for an ordinary file and refuses it for a placeholder', () => {
    const actions = fileActions(record(INSTALLER.name));
    expect(actions.find(action => action.id === 'hash')!.available).toBe(true);
    const cloud = fileActions(record('team-share.mp4'));
    expect(cloud.find(action => action.id === 'hash')!.available).toBe(false);
    expect(cloud.find(action => action.id === 'hash')!.reasonKey).toBe('file.action.reason.linked');
  });

  it('never presents metadata, provenance or quarantine as if they were built', () => {
    for (const action of fileActions(record(INSTALLER.name))) {
      if (action.id === 'metadata' || action.id === 'provenance' || action.id === 'quarantine') {
        expect(action.available).toBe(false);
        expect(action.reasonKey).toBeTruthy();
      }
    }
  });
});

describe('world pages ask only for keys that exist', () => {
  // A missing key does not throw: it prints `file.field.size` on the screen.
  // This scans each world page for the literal keys it translates.
  const pages = [
    { file: 'src/pages/FilesPage.tsx', min: 50 },
    { file: 'src/pages/ApplicationsPage.tsx', min: 40 }
  ];
  for (const { file, min } of pages) {
    it(`covers ${file}`, () => {
      const text = readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
      const keys = [...new Set([...text.matchAll(/(?:^|[^\w$.])t\('([^']+)'\)/g)].map(match => match[1]))];
      expect(keys.length).toBeGreaterThan(min);
      const missing = keys.filter(key => !dictionaries.ar[key] || !dictionaries.en[key]);
      expect({ file, missing }).toEqual({ file, missing: [] });
    });
  }
});

describe('Files copy', () => {
  // The literal keys the page asks for are covered by the scan above. What is
  // checked from here is the run-time half, which a source scan cannot see.

  // The page builds many keys at run time (`file.type.${group}`, `file.age.${bucket}`).
  // Every value those templates can produce has to exist, or the screen would
  // print a raw key instead of a word.
  it('translates every key the page interpolates', () => {
    const dynamic = [
      ...['Images', 'Video', 'Audio', 'Documents', 'Archives', 'Installers', 'Development', 'Databases', 'Fonts', 'Other', 'No extension'].map(type => `file.type.${type}`),
      ...['today', 'week', 'month', 'quarter', 'year', 'older', 'unknown'].map(age => `file.age.${age}`),
      ...['all', 'in-root', 'installers', 'archives', 'stale', 'large', 'linked', 'exposed'].map(facet => `file.facet.${facet}`),
      ...['name', 'size', 'date', 'type'].map(key => `file.sort.${key}`),
      ...['name', 'folder', 'type', 'age', 'size'].map(col => `file.col.${col}`),
      ...['size', 'type', 'extension', 'folder', 'modified', 'created', 'entryKind', 'reparse', 'linkCount', 'path'].map(field => `file.field.${field}`),
      ...['hash', 'reveal-folder', 'metadata', 'provenance', 'quarantine'].map(action => `file.action.${action}`),
      ...['size', 'extension', 'modified', 'created'].map(measure => `file.coverage.${measure}`),
      ...['cloud-placeholder', 'reparse-point', 'cross-volume-move', 'destination-exists', 'not-planned'].map(reason => `file.plan.reason.${reason}`)
    ];
    const missing = dynamic.filter(key => !dictionaries.ar[key] || !dictionaries.en[key] || dictionaries.ar[key] === key);
    expect(missing).toEqual([]);
  });

  it('keeps every placeholder the page interpolates inside both templates', () => {
    const templates: Array<[string, string[]]> = [
      ['file.head.readAt', ['time']],
      ['file.results.shown', ['current', 'total']],
      ['file.results.capped', ['shown']],
      ['file.state.warnings', ['warnings']],
      ['file.plan.bytes', ['bytes']],
      ['file.plan.more', ['count']],
      ['file.plan.confirm', ['count']],
      ['file.plan.applied', ['moved']],
      ['file.plan.failed', ['count']],
      ['file.plan.verification', ['status']],
      ['file.plan.journal', ['id']],
      ['file.plan.restored', ['count']],
      ['file.folders.result', ['empty', 'scanned']],
      ['file.folders.inaccessible', ['count']],
      ['file.exposure.count', ['count', 'bytes']],
      ['file.col.select', ['name']],
      ['file.services.live', ['live', 'total']]
    ];
    const broken: string[] = [];
    for (const [key, placeholders] of templates) {
      for (const locale of ['ar', 'en'] as const) {
        const text = dictionaries[locale][key] || '';
        for (const name of placeholders) {
          if (!text.includes(`{${name}}`)) broken.push(`${key}.${locale}.{${name}}`);
        }
      }
    }
    expect(broken).toEqual([]);
  });

  it('never leaves an untranslated key in the Arabic dictionary', () => {
    const offenders = Object.keys(dictionaries.ar)
      .filter(key => key.startsWith('file.'))
      .filter(key => dictionaries.ar[key] === key || /^[A-Za-z ]+$/.test(dictionaries.ar[key]));
    expect(offenders).toEqual([]);
  });
});
