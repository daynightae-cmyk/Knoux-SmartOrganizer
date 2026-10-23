import { describe, expect, it } from 'vitest';
import type { ToolResult } from '@shared/contracts';
import {
  actionsFor,
  applyFacet,
  buildInventory,
  dossierFields,
  facetsFor,
  glyphIdentity,
  groupRecords,
  inventorySignature,
  matchesFacet,
  parseDate,
  registryPath,
  sizeOf,
  sortRecords,
  toAppRecord,
  type AppRecord,
  type FacetId
} from '../src/lib/app-inventory';

/**
 * The Applications view model is the layer that decides what the interface is
 * allowed to claim. These tests hold that line: a number the provider did not
 * return must not appear, a declared size must not read as a measured one, an
 * action with no engine must arrive marked unavailable, and a filter chip must
 * contain exactly the programs it counts.
 */

function resultOf(items: Array<Record<string, unknown>>, overrides: Record<string, unknown> = {}): ToolResult {
  return {
    toolId: 'installed-apps',
    success: true,
    partial: false,
    startedAt: '2026-10-23T09:00:00.000Z',
    finishedAt: '2026-10-23T09:00:04.000Z',
    summary: { sources: 4 },
    items,
    warnings: [],
    errors: [],
    ...overrides
  } as unknown as ToolResult;
}

const DESKTOP_APP = {
  id: 'app-1a2b3c4d5e6f7a8b',
  name: '7-Zip',
  publisher: 'Igor Pavlov',
  version: '24.09',
  installDate: '2026-10-01',
  installLocation: 'C:\\Program Files\\7-Zip',
  scope: 'machine',
  registryView: 'HKLM',
  estimatedSizeBytes: 5_242_880,
  uninstallCapability: 'registry',
  displayIcon: 'C:\\Program Files\\7-Zip\\7z.exe,0',
  evidence: { root: 'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall', keyName: '7-Zip' }
};

const PACKAGE_APP = {
  name: 'Microsoft.PowerShell',
  publisher: 'CN=Microsoft Corporation, O=Microsoft Corporation, L=Redmond, S=Washington, C=US',
  version: '7.4.2.0',
  packageIdentity: 'Microsoft.PowerShell_7.4.2.0_neutral__8wekyb3d8bbwe',
  scope: 'user',
  uninstallCapability: 'appx-package',
  installLocation: 'C:\\Program Files\\WindowsApps\\Microsoft.PowerShell_7.4.2.0'
};

function records(...items: Array<Record<string, unknown>>): AppRecord[] {
  const snapshot = buildInventory(resultOf(items));
  if (!snapshot) throw new Error('the fixture did not build an inventory');
  return snapshot.records;
}

describe('inventory reading', () => {
  it('refuses to build an inventory from another tool result', () => {
    expect(buildInventory(resultOf([DESKTOP_APP], { toolId: 'disk-overview' }))).toBeNull();
    expect(buildInventory(null)).toBeNull();
  });

  it('keeps an installer-declared size apart from a measured one', () => {
    const [record] = records(DESKTOP_APP);
    expect(record.advertisedSizeBytes).toBe(5_242_880);
    expect(record.measuredSizeBytes).toBeNull();
    expect(sizeOf(record)).toEqual({ bytes: 5_242_880, kind: 'advertised' });

    const [measured] = records({ ...DESKTOP_APP, measuredSizeBytes: 9_000_000 });
    expect(sizeOf(measured).kind).toBe('measured');
    expect(sizeOf(measured).bytes).toBe(9_000_000);

    const [unknown] = records({ name: 'No sizes', publisher: null });
    expect(sizeOf(unknown)).toEqual({ bytes: null, kind: 'unknown' });
  });

  it('totals only what the provider actually returned', () => {
    const snapshot = buildInventory(resultOf([DESKTOP_APP, PACKAGE_APP]));
    expect(snapshot).not.toBeNull();
    const totals = snapshot!.totals;
    expect(totals.all).toBe(2);
    expect(totals.machineWide).toBe(1);
    expect(totals.userOnly).toBe(1);
    expect(totals.packaged).toBe(1);
    expect(totals.withAdvertisedSize).toBe(1);
    expect(totals.totalAdvertisedBytes).toBe(5_242_880);
    expect(totals.withMeasuredSize).toBe(0);
    expect(totals.withDate).toBe(1);
    expect(totals.distinctPublishers).toBe(2);
    expect(totals.uninstallSupported).toBe(2);
  });

  it('reports icon coverage as unsupported until the provider carries DisplayIcon', () => {
    const withoutIcons = buildInventory(resultOf([{ name: 'Plain', publisher: 'Someone' }]))!;
    const iconMeasure = withoutIcons.coverage.find(measure => measure.key === 'icon');
    expect(iconMeasure?.supported).toBe(false);
    expect(iconMeasure?.known).toBe(0);

    const withIcons = buildInventory(resultOf([DESKTOP_APP]))!;
    const second = withIcons.coverage.find(measure => measure.key === 'icon');
    expect(second?.supported).toBe(true);
    expect(second?.known).toBe(1);
  });

  it('carries the warnings and the partial flag instead of hiding them', () => {
    const snapshot = buildInventory(resultOf([DESKTOP_APP], { partial: true, warnings: ['AppX enumeration timed out'] }))!;
    expect(snapshot.partial).toBe(true);
    expect(snapshot.warnings).toEqual(['AppX enumeration timed out']);
  });
});

describe('record identity', () => {
  it('accepts only the native provider id shape and always supplies a local uid', () => {
    const [native] = records(DESKTOP_APP);
    expect(native.id).toBe('app-1a2b3c4d5e6f7a8b');
    expect(native.uid).toBe('app-1a2b3c4d5e6f7a8b');

    const [invented] = records({ ...DESKTOP_APP, id: 'C:\\Windows\\System32\\calc.exe' });
    expect(invented.id).toBe('');
    expect(invented.uid).toBe('row-0');
    expect(invented.uid).toBeTruthy();
  });

  it('records the registry location the provider read from', () => {
    const [record] = records(DESKTOP_APP);
    expect(record.evidence.root).toBe('HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall');
    expect(registryPath(record)).toBe('HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\7-Zip');

    const [packaged] = records(PACKAGE_APP);
    expect(registryPath(packaged)).toBeNull();
  });
});

describe('publisher reading', () => {
  it('shows the common name of a package publisher and keeps the identity for the dossier', () => {
    const [record] = records(PACKAGE_APP);
    expect(record.publisher).toBe('Microsoft Corporation');
    expect(record.publisherIdentity).toBe(PACKAGE_APP.publisher);
    const identity = dossierFields(record).find(field => field.key === 'app.field.publisherIdentity');
    expect(identity?.value).toBe(PACKAGE_APP.publisher);
  });

  it('leaves a plain registry publisher untouched', () => {
    const [record] = records(DESKTOP_APP);
    expect(record.publisher).toBe('Igor Pavlov');
    expect(record.publisherIdentity).toBeNull();
    expect(dossierFields(record).some(field => field.key === 'app.field.publisherIdentity')).toBe(false);
  });

  it('treats placeholder publisher values as missing', () => {
    const [record] = records({ name: 'Ghost', publisher: 'null' });
    expect(record.publisher).toBeNull();
    expect(dossierFields(record).some(field => field.key === 'app.field.publisher')).toBe(false);
  });
});

describe('actions', () => {
  const byId = (record: AppRecord) => new Map(actionsFor(record).map(action => [action.id, action]));

  it('never offers an operation the application cannot perform', () => {
    const actions = byId(records(DESKTOP_APP)[0]);
    for (const id of ['uninstall', 'leftovers', 'cache', 'updates', 'open-website'] as const) {
      expect(actions.get(id)?.availability, id).toBe('unavailable');
      expect(actions.get(id)?.reasonKey, id).toBeTruthy();
    }
  });

  it('ties the folder and registry actions to the data that exists', () => {
    const withBoth = byId(records(DESKTOP_APP)[0]);
    expect(withBoth.get('inspect-folder')?.availability).toBe('available');
    expect(withBoth.get('copy-registry-path')?.availability).toBe('available');

    const packaged = byId(records(PACKAGE_APP)[0]);
    expect(packaged.get('inspect-folder')?.availability).toBe('available');
    expect(packaged.get('copy-registry-path')?.availability).toBe('unavailable');

    const [bare] = records({ name: 'Bare entry' });
    const bareActions = byId(bare);
    expect(bareActions.get('inspect-folder')?.availability).toBe('unavailable');
    expect(bareActions.get('copy-summary')?.availability).toBe('available');
  });
});

describe('facets', () => {
  const snapshot = buildInventory(resultOf([
    DESKTOP_APP,
    PACKAGE_APP,
    { name: 'Giant', publisher: 'Big Co', estimatedSizeBytes: 4 * 1024 * 1024 * 1024, systemComponent: true, scope: 'machine' },
    { name: 'Unknown thing' }
  ]))!;

  it('offers each facet with exactly the records it counts', () => {
    for (const facet of facetsFor(snapshot)) {
      const shown = applyFacet(snapshot.records, facet.id as FacetId, null, '').length;
      expect(shown, `facet ${facet.id} counts ${facet.count} but shows ${shown}`).toBe(facet.count);
    }
  });

  it('offers every facet the records can satisfy', () => {
    const offered = facetsFor(snapshot).map(facet => facet.id);
    expect(offered).toEqual(expect.arrayContaining(['all', 'desktop', 'packaged', 'uninstall-supported', 'recent', 'large', 'system-component']));
  });

  it('hides a facet no record satisfies', () => {
    const onlyDesktop = buildInventory(resultOf([{ name: 'Solo', publisher: 'Me', installLocation: 'C:\\Solo' }]))!;
    expect(facetsFor(onlyDesktop).map(facet => facet.id)).toEqual(['all', 'desktop']);
    const noChapters = buildInventory(resultOf([{ name: 'Solo' }]))!;
    expect(facetsFor(noChapters).map(facet => facet.id)).toEqual(['all', 'desktop']);
  });

  it('matches the declared facet rules', () => {
    const [giant] = records({ name: 'Giant', publisher: 'Big Co', estimatedSizeBytes: 4 * 1024 * 1024 * 1024, systemComponent: true });
    expect(matchesFacet(giant, 'large')).toBe(true);
    expect(matchesFacet(giant, 'system-component')).toBe(true);
    expect(matchesFacet(giant, 'recent')).toBe(false);

    const [packaged] = records(PACKAGE_APP);
    expect(matchesFacet(packaged, 'packaged')).toBe(true);
    expect(matchesFacet(packaged, 'desktop')).toBe(false);
  });

  it('combines a facet with a publisher and a search term', () => {
    expect(applyFacet(snapshot.records, 'all', 'Igor Pavlov', '').map(record => record.name)).toEqual(['7-Zip']);
    expect(applyFacet(snapshot.records, 'all', null, 'giant').map(record => record.name)).toEqual(['Giant']);
    expect(applyFacet(snapshot.records, 'packaged', 'Igor Pavlov', '')).toHaveLength(0);
  });
});

describe('ordering and grouping', () => {
  const set = records(DESKTOP_APP, PACKAGE_APP, { name: 'Alpha', publisher: 'Zeta Labs' });

  it('sorts by name in both directions using the record name', () => {
    expect(sortRecords(set, 'name', 'ascending', 'en').map(record => record.name)).toEqual(['7-Zip', 'Alpha', 'Microsoft.PowerShell']);
    expect(sortRecords(set, 'name', 'descending', 'en')[0].name).toBe('Microsoft.PowerShell');
  });

  it('treats an unrecorded size as the smallest value in the column', () => {
    const descending = sortRecords(set, 'size', 'descending', 'en');
    expect(descending[0].name).toBe('7-Zip');
    expect(descending.map(record => record.name).slice(1)).toEqual(['Alpha', 'Microsoft.PowerShell']);
    const ascending = sortRecords(set, 'size', 'ascending', 'en');
    expect(ascending[ascending.length - 1].name).toBe('7-Zip');
    expect(ascending[0].advertisedSizeBytes).toBeNull();
  });

  it('groups into publisher chapters only when the ledger is ordered by publisher', () => {
    const withOrphan = records(DESKTOP_APP, PACKAGE_APP, { name: 'Alpha', publisher: 'Zeta Labs' }, { name: 'Orphan' });
    const ordered = sortRecords(withOrphan, 'publisher', 'ascending', 'en');
    const chapters = groupRecords(ordered, 'publisher', 'en');
    expect(chapters.map(chapter => chapter.label)).toEqual(['', 'Igor Pavlov', 'Microsoft Corporation', 'Zeta Labs']);
    expect(chapters[0].records.map(record => record.name)).toEqual(['Orphan']);
    expect(groupRecords(set, 'name', 'en')).toHaveLength(1);
    expect(groupRecords(set, 'name', 'en')[0].label).toBe('');
  });
});

describe('fallback typography', () => {
  it('derives a stable colour family from the publisher', () => {
    const [first] = records(PACKAGE_APP);
    const [second] = records(PACKAGE_APP);
    expect(glyphIdentity(first)).toEqual(glyphIdentity(second));
    const [sibling] = records({ ...PACKAGE_APP, name: 'Microsoft.WindowsTerminal' });
    expect(glyphIdentity(sibling).hue).toBe(glyphIdentity(first).hue);
    expect(glyphIdentity(first).letters).toBe('MI');
  });

  it('keeps a name with no letters readable', () => {
    const [record] = records({ name: '···' });
    expect(glyphIdentity(record).letters).toBe('··');
  });
});

describe('date reading', () => {
  it('accepts the separators the registry actually contains', () => {
    expect(parseDate('2026-10-01')?.getFullYear()).toBe(2026);
    expect(parseDate('2026/10/01')?.getMonth()).toBe(9);
    expect(parseDate('2026.1.9')?.getDate()).toBe(9);
    expect(parseDate(null)).toBeNull();
    expect(parseDate('not a date')).toBeNull();
  });
});

describe('collection signature', () => {
  it('says a re-read of the same machine is the same collection', () => {
    const first = records(DESKTOP_APP, { name: 'Second', version: '2.0' });
    const again = records(DESKTOP_APP, { name: 'Second', version: '2.0' });
    expect(inventorySignature(again)).toBe(inventorySignature(first));
  });

  it('says a new program, a renamed program and a reordered list all changed', () => {
    const base = records(DESKTOP_APP);
    expect(inventorySignature(records(DESKTOP_APP, { name: 'Extra' }))).not.toBe(inventorySignature(base));
    expect(inventorySignature(records({ ...DESKTOP_APP, name: 'Renamed' }))).not.toBe(inventorySignature(base));
    const pair = records(DESKTOP_APP, { name: 'Second' });
    expect(inventorySignature(pair.slice().reverse())).not.toBe(inventorySignature(pair));
  });

  it('tells an empty collection apart from an unread one', () => {
    expect(inventorySignature([])).toBe('[]');
  });
});

describe('record construction guards', () => {
  it('never invents a name for an entry that has none', () => {
    const [record] = records({ publisher: 'Someone' });
    expect(record.name).toBe('—');
    expect(toAppRecord({}, 3).uid).toBe('row-3');
  });

  it('normalises an architecture value Windows returns in mixed case', () => {
    const [record] = records({ name: 'Arch', architecture: 'X64' });
    expect(record.architecture).toBe('x64');
  });
});
