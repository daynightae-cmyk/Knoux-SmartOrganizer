import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const advanced = require('../electron/advanced-local-services.cjs') as {
  classifyFileType: (filePath: string) => string;
  ageBucket: (modifiedAt: string, now?: number) => string;
  buildStorageIntelligence: (files: any[], root: string, now?: number) => any;
  enrichDuplicateGroups: (groups: any[]) => any;
  privacyExposure: (files: any[]) => any;
  clusterEventWarnings: (events: any[]) => any;
  analyzeInstalledApps: (apps: any[]) => any;
  diskPressure: (disks: any[]) => any[];
  buildSmartScore: (input: any) => any;
};

describe('advanced local services', () => {
  it('classifies common file families without reading file contents', () => {
    expect(advanced.classifyFileType('C:\\Users\\me\\photo.jpg')).toBe('Images');
    expect(advanced.classifyFileType('C:\\Users\\me\\archive.7z')).toBe('Archives');
    expect(advanced.classifyFileType('C:\\Users\\me\\app.tsx')).toBe('Development');
    expect(advanced.classifyFileType('C:\\Users\\me\\README')).toBe('No extension');
  });

  it('builds deterministic storage intelligence by type, age, extension and top folder', () => {
    const now = Date.parse('2026-08-24T00:00:00Z');
    const files = [
      { path: 'C:\\Root\\Images\\a.jpg', size: 400, modifiedAt: '2026-08-23T12:00:00Z' },
      { path: 'C:\\Root\\Images\\b.png', size: 600, modifiedAt: '2026-08-01T00:00:00Z' },
      { path: 'C:\\Root\\Docs\\c.pdf', size: 1000, modifiedAt: '2025-01-01T00:00:00Z' }
    ];
    const result = advanced.buildStorageIntelligence(files, 'C:\\Root', now);
    expect(result.files).toBe(3);
    expect(result.totalBytes).toBe(2000);
    expect(result.typeGroups[0]).toMatchObject({ type: 'Images', files: 2, bytes: 1000, percentBytes: 50 });
    expect(result.topFolders[0].bytes).toBe(1000);
    expect(result.extensionGroups).toHaveLength(3);
    expect(result.ageBuckets.some((item: any) => item.age === 'older' && item.bytes === 1000)).toBe(true);
  });

  it('adds a safe review plan to exact duplicate groups without deleting anything', () => {
    const result = advanced.enrichDuplicateGroups([{ hash: 'abc', size: 100, reclaimableBytes: 200, files: [
      { path: 'C:\\Users\\me\\deep\\copy.txt', size: 100, createdAt: '2026-01-02T00:00:00Z' },
      { path: 'C:\\Users\\me\\copy.txt', size: 100, createdAt: '2026-01-03T00:00:00Z' },
      { path: 'C:\\Windows\\copy.txt', size: 100, createdAt: '2020-01-01T00:00:00Z' }
    ] }]);
    expect(result.summary).toMatchObject({ duplicateGroups: 1, duplicateFiles: 3, reclaimableBytes: 200, reviewRequired: true });
    expect(result.items[0].recommendedKeeper.path).toBe('C:\\Users\\me\\copy.txt');
    expect(result.items[0].reviewFiles).toHaveLength(2);
    expect(result.items[0].reviewRequired).toBe(true);
    expect(result.items[0].risk).toBe('high');
  });

  it('detects privacy-sensitive filenames using metadata only', () => {
    const result = advanced.privacyExposure([
      { path: 'C:\\Users\\me\\project\\.env', size: 120, modifiedAt: '2026-08-20T00:00:00Z' },
      { path: 'C:\\Users\\me\\keys\\id_ed25519', size: 400, modifiedAt: '2026-08-20T00:00:00Z' },
      { path: 'C:\\Users\\me\\photo.jpg', size: 5000, modifiedAt: '2026-08-20T00:00:00Z' }
    ]);
    expect(result.summary.exposureCount).toBe(2);
    expect(result.summary.metadataOnly).toBe(true);
    expect(result.summary.contentsInspected).toBe(false);
    expect(result.items.map((item: any) => item.category).sort()).toEqual(['environment-config', 'private-key']);
  });

  it('clusters recurring Windows warnings by provider, event id and level', () => {
    const result = advanced.clusterEventWarnings([
      { ProviderName: 'Disk', Id: 7, LevelDisplayName: 'Error', TimeCreated: '2026-08-24T12:00:00Z', Message: 'first failure' },
      { ProviderName: 'Disk', Id: 7, LevelDisplayName: 'Error', TimeCreated: '2026-08-24T13:00:00Z', Message: 'second failure' },
      { ProviderName: 'Service Control Manager', Id: 7000, LevelDisplayName: 'Warning', TimeCreated: '2026-08-24T11:00:00Z', Message: 'service warning' }
    ]);
    expect(result.summary).toMatchObject({ events: 3, recurringClusters: 1, uniqueClusters: 2, topProvider: 'Disk', topEventId: '7' });
    expect(result.items[0].count).toBe(2);
    expect(result.items[0].sample.length).toBeLessThanOrEqual(300);
  });

  it('summarizes installed app registry hygiene without mutating registry state', () => {
    const result = advanced.analyzeInstalledApps([
      { name: 'App A', version: '1.0', publisher: 'Vendor', installLocation: 'C:\\A', uninstallString: 'uninstall.exe' },
      { name: 'App A', version: '1.0', publisher: 'Vendor', installLocation: '', uninstallString: '' },
      { name: 'App B', version: '2.0', publisher: '', installLocation: 'C:\\B', uninstallString: 'remove.exe' }
    ]);
    expect(result).toMatchObject({ applications: 3, duplicateRegistrations: 1, missingUninstallCommand: 1, missingInstallLocation: 1 });
    expect(result.publishers[0]).toMatchObject({ publisher: 'Vendor', count: 2 });
  });

  it('labels disk pressure and produces a bounded Smart Scan score', () => {
    expect(advanced.diskPressure([{ DeviceID: 'C:', Size: 1000, FreeSpace: 40 }])[0]).toMatchObject({ freePercent: 4, pressure: 'critical', usedBytes: 960 });
    const score = advanced.buildSmartScore({
      health: { memoryUsedPercent: 93 },
      disks: [{ DeviceID: 'C:', Size: 1000, FreeSpace: 40 }],
      duplicateSummary: { reclaimableBytes: 12 * 1024 ** 3 },
      privacySummary: { exposureCount: 2 },
      tempEligibleBytes: 6 * 1024 ** 3
    });
    expect(score.score).toBeGreaterThanOrEqual(0);
    expect(score.score).toBeLessThan(100);
    expect(score.reasons).toEqual(expect.arrayContaining(['high-memory-pressure', 'critical-disk-pressure', 'large-duplicate-footprint', 'privacy-review', 'large-temp-footprint']));
  });
});
