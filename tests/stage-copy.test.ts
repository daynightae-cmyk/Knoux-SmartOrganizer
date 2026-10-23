import { describe, expect, it } from 'vitest';
import { stageCopy } from '../src/lib/stage-copy';
import { serviceCopy } from '../src/lib/service-copy';
import { worlds } from '../src/lib/service-catalog';

/**
 * The specialist world stages are copy-driven: a missing key renders the raw
 * key inside a finished layout, which is the one defect a screenshot review
 * tends to blame on the design. These checks keep every stage complete.
 */
const STAGE_WORLDS = ['cleanup', 'startup', 'system', 'repair', 'services', 'network', 'hardware'];

describe('world stage copy', () => {
  it('writes every stage string in both languages', () => {
    for (const [key, value] of Object.entries(stageCopy)) {
      expect(value.ar.trim().length, key).toBeGreaterThan(1);
      expect(value.en.trim().length, key).toBeGreaterThan(1);
    }
  });

  it('never shadows a service catalogue key', () => {
    const shadowed = Object.keys(stageCopy).filter(key => key in serviceCopy);
    expect(shadowed).toEqual([]);
  });

  it('gives every specialist world its name, lead, console, empty state and flow', () => {
    for (const world of STAGE_WORLDS) {
      for (const suffix of ['name', 'lead', 'console', 'consoleHint', 'empty', 'emptyNote', 'flow', 'flowHint']) {
        expect(stageCopy[`stage.${world}.${suffix}`], `stage.${world}.${suffix}`).toBeDefined();
      }
      const steps = Object.keys(stageCopy).filter(key => key.startsWith(`stage.${world}.s`));
      expect(steps.length, world).toBeGreaterThanOrEqual(4);
    }
  });

  it('covers the seven specialist worlds and leaves the four specialist pages alone', () => {
    expect(STAGE_WORLDS).toHaveLength(7);
    expect(worlds).toHaveLength(11);
    for (const world of STAGE_WORLDS) {
      expect(worlds.map(item => item.id)).toContain(world);
    }
  });
});
