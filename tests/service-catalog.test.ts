import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
import {
  countByState,
  registeredEngineIds,
  serviceById,
  serviceCatalog,
  servicesForWorld,
  stateLabelKey,
  worlds,
  type ServiceState,
  type WorldId
} from '../src/lib/service-catalog';
import { serviceCopy } from '../src/lib/service-copy';

const require = createRequire(import.meta.url);
const { createToolRegistry, serializeRegistry } = require('../electron/tool-registry.cjs') as {
  createToolRegistry: (resolver: (engine: string) => (...args: unknown[]) => Promise<unknown>, options?: { platform?: string }) => Array<{ id: string }>;
  serializeRegistry: (registry: Array<{ id: string }>) => Promise<Array<{ id: string }>>;
};

// Hard-coded mirror of the frozen SPECS ids in electron/tool-registry.cjs.
// A registry rename must break this test on purpose.
const REGISTRY_IDS = [
  'system-health', 'smart-scan', 'disk-overview', 'large-files', 'duplicate-files',
  'empty-folders', 'downloads-inventory', 'organize-downloads-preview', 'organize-downloads-apply',
  'organize-downloads-undo', 'temp-cleanup-preview', 'temp-cleanup-apply', 'temp-cleanup-undo',
  'startup-items', 'startup-disable', 'startup-restore', 'installed-apps', 'network-diagnostics',
  'hardware-inventory', 'event-warnings', 'process-inventory', 'battery-status', 'file-hash',
  'repair-dism-check-health', 'repair-dism-scan-health', 'repair-dism-restore-health',
  'repair-sfc-verify-only', 'repair-sfc-scan-now', 'repair-dns-flush', 'repair-winsock-reset',
  'repair-tcpip-reset', 'services-inventory', 'service-control', 'service-startup-undo'
];
const REGISTRY = new Set(REGISTRY_IDS);
const WORLD_IDS: WorldId[] = [
  'applications', 'files', 'storage', 'cleanup', 'startup',
  'system', 'repair', 'services', 'network', 'hardware', 'automation'
];
const hasBacking = (engine: string | null, native?: string) => (engine !== null) || (native !== undefined);

describe('service catalog integrity', () => {
  it('covers 11 worlds with exactly 12 services each (132 total)', () => {
    expect(worlds).toHaveLength(11);
    expect(worlds.map(world => world.id).sort()).toEqual([...WORLD_IDS].sort());
    expect(serviceCatalog).toHaveLength(132);
    for (const world of WORLD_IDS) {
      expect(servicesForWorld(world)).toHaveLength(12);
      expect(serviceCatalog.filter(service => service.world === world)).toHaveLength(12);
    }
  });

  it('keeps every service id globally unique and resolvable', () => {
    const ids = serviceCatalog.map(service => service.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(serviceById(id)?.id).toBe(id);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    expect(serviceById('does-not-exist')).toBeUndefined();
  });

  it('references only real registry engine ids and uses each at most once', () => {
    for (const service of serviceCatalog) {
      if (service.engine !== null) expect(REGISTRY.has(service.engine)).toBe(true);
    }
    const used = serviceCatalog.filter(service => service.engine !== null).map(service => service.engine as string);
    expect(new Set(used).size).toBe(used.length);
  });

  it('keeps the hard-coded registry copy in sync with the real tool registry', async () => {
    const tools = await serializeRegistry(createToolRegistry(() => async () => ({ summary: {}, items: [] }), { platform: 'win32' }));
    const liveIds = tools.map(tool => tool.id).sort();
    expect(liveIds).toEqual([...REGISTRY_IDS].sort());
    expect([...registeredEngineIds].sort()).toEqual(liveIds);
  });

  it('marks every operational service as genuinely backed', () => {
    const operational = serviceCatalog.filter(service => service.state === 'operational');
    for (const service of operational) {
      expect(hasBacking(service.engine, service.native)).toBe(true);
      if (service.engine !== null) expect(REGISTRY.has(service.engine)).toBe(true);
    }
    // All 34 engines must appear in at least one service.
    const referenced = new Set(operational.map(service => service.engine).filter((id): id is string => id !== null));
    for (const engine of REGISTRY_IDS) expect(referenced.has(engine)).toBe(true);
  });

  it('is honest about non-operational services: planned is un-backed, partial/planned carry a limit', () => {
    for (const service of serviceCatalog) {
      const state = service.state as ServiceState;
      if (state === 'planned') {
        expect(service.engine).toBeNull();
        expect(service.native).toBeUndefined();
      }
      if (state !== 'operational') {
        expect(service.limitKey).toBe(`svc.${service.id}.limit`);
        expect(service.limitKey).toBeDefined();
      } else {
        expect(service.limitKey).toBeUndefined();
      }
    }
  });

  it('requires administrator for the repair-world engines that need it', () => {
    for (const service of serviceCatalog.filter(item => item.world === 'repair' && item.state === 'operational')) {
      expect(service.requiresAdmin).toBe(true);
    }
  });

  it('localises every referenced key in both Arabic and English with no empty strings', () => {
    for (const service of serviceCatalog) {
      for (const key of [service.nameKey, service.summaryKey, service.limitKey]) {
        if (!key) continue;
        const entry = serviceCopy[key];
        expect(entry, `missing copy for ${key}`).toBeDefined();
        expect(typeof entry.ar).toBe('string');
        expect(typeof entry.en).toBe('string');
        expect(entry.ar.trim().length).toBeGreaterThan(0);
        expect(entry.en.trim().length).toBeGreaterThan(0);
      }
    }
    for (const world of worlds) {
      for (const key of [world.labelKey, world.taglineKey]) {
        expect(serviceCopy[key]?.ar.trim().length).toBeGreaterThan(0);
        expect(serviceCopy[key]?.en.trim().length).toBeGreaterThan(0);
      }
    }
    for (const state of ['operational', 'partial', 'planned'] as ServiceState[]) {
      expect(serviceCopy[stateLabelKey(state)]?.en).toBeTruthy();
    }
    for (const action of ['browse', 'run', 'review', 'schedule', 'none']) {
      expect(serviceCopy[`svc.action.${action}`]?.ar.trim().length).toBeGreaterThan(0);
    }
  });

  it('never presents an un-backed service as functional', () => {
    for (const service of serviceCatalog) {
      if (service.state === 'operational') continue;
      expect(hasBacking(service.engine, service.native)).toBe(false);
    }
  });

  it('varies the workspace layout within each world (at least 4 kinds)', () => {
    for (const world of WORLD_IDS) {
      const kinds = new Set(servicesForWorld(world).map(service => service.workspace));
      expect(kinds.size).toBeGreaterThanOrEqual(4);
    }
  });

  it('reports per-world state counts that are internally consistent', () => {
    let operationalTotal = 0;
    for (const world of WORLD_IDS) {
      const counts = countByState(world);
      const total = counts.operational + counts.partial + counts.planned;
      expect(total).toBe(12);
      operationalTotal += counts.operational;
    }
    // Every real engine is operational-backed, plus the native-backing services.
    expect(operationalTotal).toBeGreaterThanOrEqual(REGISTRY_IDS.length);
  });
});
