import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { ToolResult } from '@shared/contracts';
import { dictionaries } from '../src/locales';
import { storageCopy } from '../src/lib/storage-copy';
import {
  buildAtlas, buildDuplicateScan, buildEmptyFolderScan, buildHeavyScan,
  overlapBetween, parentFolder, PRESSURE_TICKS, readAgreement, scanRoots
} from '../src/lib/storage-atlas';

/**
 * The Volume Atlas view model is the layer that decides what the Storage world
 * may say about a disk.
 *
 * Four lines are held here:
 *
 * - a volume Windows gave no capacity for is named as unmeasured, never summed
 *   in as zero bytes of disk;
 * - the pressure label is the engine's own, passed through, with an absent label
 *   staying "unknown" rather than becoming "healthy";
 * - a composition ladder is a share of the bytes the walk measured, not a share
 *   of the volume, and it is read from the array names the engines actually
 *   return;
 * - two walks over the same folder are reported as overlapping, never added.
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

function atlasResult(items: Array<Record<string, unknown>>, summary: Record<string, unknown> = {}) {
  return resultOf('disk-overview', items, {
    volumeProvider: 'Win32_LogicalDisk',
    physicalProvider: 'MSFT_PhysicalDisk',
    inventoryAvailable: true,
    physicalDisksAvailable: true,
    physicalDisks: [],
    ...summary
  });
}

describe('buildAtlas — the volume table', () => {
  it('refuses a result from any other engine', () => {
    expect(buildAtlas(resultOf('empty-folders', []))).toBeNull();
  });

  it('sums only the capacities Windows reported, and counts the rest as unmeasured', () => {
    const atlas = buildAtlas(atlasResult([
      { deviceId: 'C:', Size: 1000, FreeSpace: 400 },
      { deviceId: 'D:', FreeSpace: 50 },
      { deviceId: 'E:' }
    ]))!;
    // D: has free space but no capacity; E: has neither. Neither may become a
    // zero-byte disk inside a total that looks measured.
    expect(atlas.totals.capacityBytes).toBe(1000);
    expect(atlas.totals.freeBytes).toBe(450);
    expect(atlas.totals.unmeasured).toBe(2);
    expect(atlas.volumes[1].usedPercent).toBeNull();
    expect(atlas.volumes[1].sizeBytes).toBeNull();
  });

  it('derives used bytes from the two figures it was given, and never invents a third', () => {
    const atlas = buildAtlas(atlasResult([{ deviceId: 'C:', Size: 1000, FreeSpace: 400 }]))!;
    const volume = atlas.volumes[0];
    expect(volume.usedBytes).toBe(600);
    expect(volume.usedPercent).toBe(60);
    expect(volume.freePercent).toBe(40);
    expect(volume.letter).toBe('C');
    expect(volume.scanRoot).toBe('C:\\');
  });

  it('passes the engine pressure label through and keeps an absent one unknown', () => {
    const atlas = buildAtlas(atlasResult([
      { deviceId: 'C:', Size: 100, FreeSpace: 1, pressure: 'critical', pressureBasis: 'below 5% free' },
      { deviceId: 'D:', Size: 100, FreeSpace: 90, pressure: 'healthy' },
      { deviceId: 'E:', Size: 100, FreeSpace: 50 }
    ]))!;
    expect(atlas.volumes.map(volume => volume.pressure)).toEqual(['critical', 'healthy', 'unknown']);
    expect(atlas.volumes[0].pressureBasis).toBe('below 5% free');
    expect(atlas.volumes[2].pressureBasis).toBeNull();
    expect(atlas.totals.pressured).toBe(1);
    expect(atlas.totals.critical).toBe(1);
    expect(atlas.totals.unknownPressure).toBe(1);
  });

  it('keeps the physical disk table separate from the volume table', () => {
    const atlas = buildAtlas(atlasResult([{ deviceId: 'C:', Size: 10, FreeSpace: 1 }], {
      physicalDisks: [
        { deviceId: '\\\\.\\PHYSICALDRIVE0', friendlyName: 'NVMe SSD', mediaType: 'SSD', busType: 'PCI', sizeBytes: 512000, healthStatus: 'OK', operationalStatus: ['Running', 'OK'], temperatureAvailable: false }
      ]
    }))!;
    expect(atlas.physical).toHaveLength(1);
    expect(atlas.physical[0].operationalStatus).toBe('Running, OK');
    // MSFT_PhysicalDisk has no portable temperature, and the world says so
    // instead of showing a blank that reads as a cool disk.
    expect(atlas.physical[0].temperatureAvailable).toBe(false);
  });

  it('reports a provider that did not answer without inventing zeros', () => {
    const atlas = buildAtlas(atlasResult([], { inventoryAvailable: false, unavailableReason: 'WMI did not answer' }))!;
    expect(atlas.volumes).toHaveLength(0);
    expect(atlas.totals.capacityBytes).toBe(0);
    expect(atlas.inventoryAvailable).toBe(false);
    expect(atlas.unavailableReason).toBe('WMI did not answer');
  });
});

describe('buildHeavyScan — one walk and the bytes it measured', () => {
  const summary = {
    folder: 'C:\\Users\\me\\Downloads',
    filesScanned: 120,
    matchingFiles: 2,
    thresholdBytes: 100,
    totalMatchingBytes: 700,
    totalScannedBytes: 1000,
    // These are the names the large-files engine actually returns. A ladder read
    // from the wrong key is an empty ladder, not a wrong one — so the names are
    // asserted rather than trusted.
    typeGroups: [{ type: 'Videos', files: 1, bytes: 600 }, { type: 'No extension', files: 1, bytes: 100 }],
    ageBuckets: [{ age: 'older', files: 2, bytes: 700 }],
    topFolders: [{ folder: 'C:\\Users\\me\\Downloads', files: 120, bytes: 1000 }],
    extensionGroups: [{ extension: '.mkv', files: 1, bytes: 600 }],
    traversal: { foldersVisited: 9, filesVisited: 120, accessDenied: 2, reparsePointsSkipped: 1, hardlinkedFiles: 3, cloudPlaceholders: 4 }
  };
  const items = [
    { path: 'C:\\Users\\me\\Downloads\\a.mkv', size: 600, type: 'Videos', ageBucket: 'older', modifiedAt: '2020-01-01T00:00:00.000Z', hydrationRisk: 'avoid' },
    { path: 'C:\\Users\\me\\Downloads\\b', size: 100, type: 'No extension', ageBucket: 'unknown' }
  ];

  it('reads the engine summary arrays it is really given', () => {
    const scan = buildHeavyScan(resultOf('large-files', items, summary))!;
    expect(scan.types.map(rung => rung.key)).toEqual(['Videos', 'No extension']);
    expect(scan.ages.map(rung => rung.key)).toEqual(['older']);
    expect(scan.folders.map(rung => rung.key)).toEqual(['C:\\Users\\me\\Downloads']);
    expect(scan.extensions.map(rung => rung.key)).toEqual(['.mkv']);
  });

  it('draws each rung as a share of the walked bytes, never of the volume', () => {
    const scan = buildHeavyScan(resultOf('large-files', items, summary))!;
    expect(scan.types[0].percent).toBe(60);
    expect(scan.types[1].percent).toBe(10);
    // The top folder holds everything the walk measured, so its share is of the
    // walk — a disk-sized denominator would make every row look negligible.
    expect(scan.folders[0].bytes).toBe(1000);
    expect(scan.folders[0].percent).toBe(100);
  });

  it('marks a cloud placeholder as deferred only when reading it would fetch it', () => {
    const scan = buildHeavyScan(resultOf('large-files', items, summary))!;
    expect(scan.rows[0].deferred).toBe(true);
    expect(scan.rows[1].deferred).toBe(false);
    expect(scan.rows[1].extension).toBe('');
    expect(scan.rows[0].name).toBe('a.mkv');
  });

  it('carries the traversal counts and the partial flag the engine set', () => {
    const scan = buildHeavyScan(resultOf('large-files', items, summary, { partial: true }))!;
    expect(scan.partial).toBe(true);
    expect(scan.traversal?.accessDenied).toBe(2);
    expect(scan.traversal?.reparsePointsSkipped).toBe(1);
    expect(scan.traversal?.hardlinkedFiles).toBe(3);
  });
});

describe('buildDuplicateScan — verified copies and what they are worth', () => {
  it('counts only the extra copies as recoverable, and zero for a hard-linked set', () => {
    const scan = buildDuplicateScan(resultOf('duplicate-files', [
      {
        hash: 'ab12', size: 500, count: 3, reclaimableBytes: 1000, singlePhysicalFile: false, physicalDuplicates: 2, risk: 'normal',
        files: [{ path: 'C:\\a.bin' }, { path: 'C:\\b.bin' }, { path: 'C:\\c.bin' }],
        recommendedKeeper: { path: 'C:\\a.bin' },
        reviewFiles: [{ path: 'C:\\b.bin' }, { path: 'C:\\c.bin' }]
      },
      {
        hash: 'cd34', size: 90, count: 2, reclaimableBytes: 0, singlePhysicalFile: true, physicalDuplicates: 0, risk: 'high',
        files: [{ path: 'C:\\d.txt' }, { path: 'C:\\e.txt' }],
        recommendedKeeper: { path: 'C:\\d.txt' }
      }
    ], { folder: 'C:\\', filesScanned: 40, candidateFiles: 5, contentVerifiedFiles: 5, reclaimableBytes: 1000, duplicateFiles: 5, exactHashAlgorithm: 'sha256' }))!;
    expect(scan.reclaimableBytes).toBe(1000);
    expect(scan.groups[0].reviewPaths).toEqual(['C:\\b.bin', 'C:\\c.bin']);
    // The set's membership is kept whole, because overlap has to count the
    // keeper too: it is the same verified content the heavy walk lists.
    expect(scan.groups[0].memberPaths).toEqual(['C:\\a.bin', 'C:\\b.bin', 'C:\\c.bin']);
    // Five hard links to one file are one file: extra names, no extra bytes.
    expect(scan.groups[1].singlePhysicalFile).toBe(true);
    expect(scan.groups[1].reclaimableBytes).toBe(0);
    expect(scan.groups[1].risk).toBe('high');
    expect(scan.algorithm).toBe('sha256');
  });

  it('falls back to the walk totals the engine did not precompute', () => {
    const scan = buildDuplicateScan(resultOf('duplicate-files', [
      { hash: 'ab12', size: 500, count: 3, files: [{ path: 'C:\\a.bin' }, { path: 'C:\\b.bin' }, { path: 'C:\\c.bin' }] }
    ], { folder: 'C:\\' }))!;
    expect(scan.duplicateFiles).toBe(3);
    expect(scan.groups[0].reviewPaths).toEqual(['C:\\b.bin', 'C:\\c.bin']);
    expect(scan.algorithm).toBe('sha256');
  });
});

describe('buildEmptyFolderScan — the walk that recovers nothing', () => {
  it('reports the folders it found without pretending a size', () => {
    const items = Array.from({ length: 120 }, (_, index) => ({ path: `C:\\empty-${index}` }));
    const scan = buildEmptyFolderScan(resultOf('empty-folders', items, { folder: 'C:\\', emptyFolders: 120, foldersScanned: 400, inaccessibleFolders: 3 }))!;
    expect(scan.empty).toBe(120);
    expect(scan.scanned).toBe(400);
    expect(scan.inaccessible).toBe(3);
    // The list is a sample of what was found, not the whole ledger.
    expect(scan.paths).toHaveLength(80);
  });
});

describe('overlapBetween — two walks that were never added together', () => {
  const heavy = buildHeavyScan(resultOf('large-files', [
    { path: 'C:\\Downloads\\big.mkv', size: 600, type: 'Videos' },
    { path: 'C:\\Downloads\\other.bin', size: 200, type: 'Other' }
  ], { folder: 'C:\\Downloads', totalScannedBytes: 800 }));
  const duplicates = buildDuplicateScan(resultOf('duplicate-files', [
    { hash: 'ab12', size: 600, count: 2, reclaimableBytes: 600, files: [{ path: 'C:\\downloads\\BIG.mkv' }, { path: 'C:\\backup\\big.mkv' }] }
  ], { folder: 'C:\\Downloads' }));

  it('finds the heavy file that is also a verified duplicate, ignoring case', () => {
    expect(overlapBetween(heavy, duplicates)).toEqual({ paths: 1, bytes: 600 });
  });

  it('claims no overlap when either walk has not run', () => {
    expect(overlapBetween(null, duplicates)).toEqual({ paths: 0, bytes: 0 });
    expect(overlapBetween(heavy, null)).toEqual({ paths: 0, bytes: 0 });
  });
});

describe('scanRoots — the roots this world may honestly offer', () => {
  it('offers one scan root per lettered volume and none for an unnamed one', () => {
    const atlas = buildAtlas(atlasResult([
      { deviceId: 'C:', Size: 10, FreeSpace: 1 },
      { deviceId: 'Unknown', Size: 10, FreeSpace: 1 }
    ]))!;
    expect(scanRoots(atlas)).toEqual([{ id: 'C:', letter: 'C', root: 'C:\\' }]);
    expect(scanRoots(null)).toEqual([]);
  });

  it('draws the engine pressure ticks in the order the OS uses them', () => {
    expect(PRESSURE_TICKS.map(tick => tick.freePercent)).toEqual([20, 10, 5]);
    expect(PRESSURE_TICKS.map(tick => tick.pressure)).toEqual(['medium', 'high', 'critical']);
  });
});

describe('the Storage world only speaks in labels that exist', () => {
  const page = readFileSync(new URL('../src/pages/StoragePage.tsx', import.meta.url), 'utf8');
  const keys = new Set<string>();
  for (const match of page.matchAll(/\bt\(\s*['"](store\.[a-zA-Z0-9.]+)['"]/g)) keys.add(match[1]);
  // Keys assembled at runtime from an engine value: every one of these is a name
  // the model can actually produce, so each is checked by name rather than left
  // to a screenshot.
  for (const phase of ['idle', 'running', 'ready', 'partial', 'failed', 'unavailable']) keys.add(`store.state.${phase}`);
  for (const pressure of ['critical', 'high', 'medium', 'healthy', 'unknown']) keys.add(`store.pressure.${pressure}`);
  for (const age of ['today', 'week', 'month', 'quarter', 'year', 'older', 'unknown']) keys.add(`store.age.${age}`);
  for (const id of ['heavy', 'duplicates', 'empties']) keys.add(`store.deck.${id}`);

  it('names every store.* label the page asks for', () => {
    expect(keys.size).toBeGreaterThan(60);
    const missing = Array.from(keys).filter(key => !storageCopy[key]);
    expect(missing).toEqual([]);
  });

  it('answers in both languages, and in the built dictionary the page reads', () => {
    for (const [key, value] of Object.entries(storageCopy)) {
      expect(value.ar.trim(), key).not.toBe('');
      expect(value.en.trim(), key).not.toBe('');
      expect(dictionaries.ar[key], key).toBe(value.ar);
      expect(dictionaries.en[key], key).toBe(value.en);
    }
  });

  it('never leaves an unresolved placeholder in a label', () => {
    // A {token} the page does not pass renders as the token itself, which is how
    // a product starts showing its own plumbing.
    for (const [key, value] of Object.entries(storageCopy)) {
      const tokens = (text: string) => Array.from(text.matchAll(/\{([a-zA-Z0-9]+)\}/g)).map(m => m[1]);
      expect(tokens(value.en), key).toEqual(tokens(value.ar));
    }
  });
});

describe('readAgreement', () => {
  it('counts only the walks that named a root', () => {
    const agreement = readAgreement([
      { id: 'heavy', root: 'K:\\Downloads', collectedAt: 'now' },
      { id: 'duplicates', root: null, collectedAt: null },
      { id: 'empties', root: 'K:\\Downloads', collectedAt: 'now' }
    ]);
    expect(agreement).toEqual({ walked: 2, roots: ['K:\\DOWNLOADS'] });
  });

  it('separates reads taken against different folders', () => {
    const agreement = readAgreement([
      { id: 'heavy', root: 'K:\\Downloads', collectedAt: 'now' },
      { id: 'duplicates', root: 'C:\\Users\\me\\Desktop', collectedAt: 'now' }
    ]);
    expect(agreement.roots).toHaveLength(2);
  });

  // The board has to call two reads of one folder one root. Windows matches a
  // path case-insensitively and a trailing separator is not part of the name, so
  // both spellings are the same measurement — and reporting them as two would
  // tell the reader not to add numbers that were always additive.
  it('reads a path the way Windows does, not the way a string does', () => {
    const agreement = readAgreement([
      { id: 'heavy', root: 'k:\\downloads\\', collectedAt: 'now' },
      { id: 'duplicates', root: 'K:\\Downloads', collectedAt: 'now' }
    ]);
    expect(agreement.roots).toEqual(['K:\\DOWNLOADS']);
  });

  it('says so when nothing has been walked yet', () => {
    expect(readAgreement([
      { id: 'heavy', root: null, collectedAt: null },
      { id: 'duplicates', root: null, collectedAt: null },
      { id: 'empties', root: '', collectedAt: null }
    ])).toEqual({ walked: 0, roots: [] });
  });
});

// The empty-folder record names the folder above the pick, because a leaf called
// "Temp" is not a location. Two answers matter to the interface: the parent of a
// top-level folder is the drive itself, and a drive root has no parent at all —
// it must return null rather than an empty string the record would render blank.
describe('parentFolder', () => {
  it('returns the folder a path sits in', () => {
    expect(parentFolder('C:\\Users\\me\\Downloads\\Temp')).toBe('C:\\Users\\me\\Downloads');
  });

  it('accepts either separator and ignores a trailing one', () => {
    expect(parentFolder('C:/Users/me/Downloads')).toBe('C:\\Users\\me');
    expect(parentFolder('C:\\Users\\me\\')).toBe('C:\\Users');
  });

  it('names the drive as the parent of a top-level folder', () => {
    expect(parentFolder('C:\\Users')).toBe('C:');
  });

  it('has no parent above a drive root', () => {
    expect(parentFolder('C:')).toBeNull();
    expect(parentFolder('C:\\')).toBeNull();
  });
});
