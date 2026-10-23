import { describe, expect, it } from 'vitest';
import { serviceCatalog, servicesForWorld, worlds } from '../src/lib/service-catalog';
import { inputsFor, previewFor, previewIds, riskLabels, workspaceLabels } from '../src/lib/service-preview';

/**
 * The preview is the only place a planned service can be explored, so a missing
 * or half-written entry is a hole in the product rather than a missing string.
 * These tests keep all 132 entries complete in both languages.
 */

describe('service previews', () => {
  it('has exactly one preview for each of the 132 services and no orphans', () => {
    expect(serviceCatalog).toHaveLength(132);
    expect(previewIds).toHaveLength(132);
    const missing = serviceCatalog.filter(service => !previewFor(service)).map(service => service.id);
    expect(missing).toEqual([]);
    const known = new Set(serviceCatalog.map(service => service.id));
    expect(previewIds.filter(id => !known.has(id))).toEqual([]);
  });

  it('gives every service a purpose, at least three steps and an output', () => {
    for (const service of serviceCatalog) {
      const preview = previewFor(service);
      expect(preview, service.id).not.toBeNull();
      if (!preview) continue;
      expect(preview.purpose.en.trim().length, service.id).toBeGreaterThan(20);
      expect(preview.steps.length, service.id).toBeGreaterThanOrEqual(3);
      expect(preview.output.en.trim().length, service.id).toBeGreaterThan(20);
      expect(Object.keys(riskLabels)).toContain(preview.risk);
    }
  });

  it('writes every preview string in both languages', () => {
    for (const service of serviceCatalog) {
      const preview = previewFor(service);
      if (!preview) continue;
      const strings = [
        preview.purpose,
        preview.output,
        ...preview.steps,
        ...inputsFor(service, preview).flatMap(input => [input.label, ...(input.options ?? [])])
      ];
      for (const text of strings) {
        expect(text.ar.trim().length, `${service.id} ar`).toBeGreaterThan(2);
        expect(text.en.trim().length, `${service.id} en`).toBeGreaterThan(2);
      }
    }
  });

  it('marks every service that needs elevation as needing it in its preview', () => {
    // The catalogue decides this once; the preview must not soften it, because
    // the preview is where the person reads what the service will ask for.
    for (const service of serviceCatalog) {
      const preview = previewFor(service);
      if (!preview) continue;
      if (service.requiresAdmin) expect(preview.risk, service.id).toBe('needs-admin');
      if (service.state === 'planned') expect(service.engine, service.id).toBeNull();
    }
  });

  it('labels every workspace kind and every world', () => {
    for (const service of serviceCatalog) {
      expect(workspaceLabels[service.workspace].en.length, service.id).toBeGreaterThan(2);
      expect(workspaceLabels[service.workspace].ar.length, service.id).toBeGreaterThan(2);
    }
    for (const world of worlds) {
      expect(servicesForWorld(world.id)).toHaveLength(12);
    }
  });
});
