import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * A stage is only a stage when its stylesheet reached the bundle.
 *
 * `world-stage.css` was once written, referenced by seven specialist pages and
 * never imported in `main.tsx`. Every layout measurement in the visual suite
 * passed because the regions existed and nothing overflowed; the screenshots
 * showed raw text. These checks fail on that exact class of false green:
 * the imports are required, the sheets must carry the shared classes, and every
 * literal `className` the specialist pages render has to have a matching rule.
 */
const ROOT = path.resolve(process.cwd(), 'src');

function filesUnder(directory: string): string[] {
  return readdirSync(directory).flatMap(entry => {
    const full = path.join(directory, entry);
    if (statSync(full).isDirectory()) return filesUnder(full);
    return /\.(tsx?|css)$/.test(entry) ? [full] : [];
  });
}

const sources = filesUnder(ROOT);
const css = sources.filter(file => file.endsWith('.css')).map(file => readFileSync(file, 'utf8')).join('\n');
const main = readFileSync(path.join(ROOT, 'main.tsx'), 'utf8');

describe('stage stylesheet wiring', () => {
  it('imports the shared stage sheet and the Flow Studio sheet into the renderer', () => {
    expect(main).toContain("import './world-stage.css';");
    expect(main).toContain("import './flow-studio.css';");
  });

  it('carries the chrome every specialist world composes', () => {
    const sheet = readFileSync(path.join(ROOT, 'world-stage.css'), 'utf8');
    for (const selector of ['.stage {', '.stage__head', '.stage__panel', '.stage__split', '.stage__stat', '.stage__flow', '.stage__empty']) {
      expect(sheet, selector).toContain(selector);
    }
    const flow = readFileSync(path.join(ROOT, 'flow-studio.css'), 'utf8');
    for (const selector of ['.flowstudio', '.flow-lib', '.flow-canvas', '.flow-node', '.flow-config', '.flow-preview']) {
      expect(flow, selector).toContain(selector);
    }
  });

  it('styles every stage and Flow Studio class the interface actually renders', () => {
    const used = new Set<string>();
    for (const file of sources) {
      if (!file.endsWith('.tsx')) continue;
      const text = readFileSync(file, 'utf8');
      // Read only JSX className values, so CSS variables, ids, import paths and
      // copy keys are not mistaken for classes.
      const pattern = /className=(?:\{)?(?:"([^"]*)"|`([^`]*)`)/g;
      for (const match of text.matchAll(pattern)) {
        const value = (match[1] ?? match[2] ?? '').replace(/\$\{[^}]*\}/g, ' ');
        for (const raw of value.split(/\s+/)) {
          const token = raw.replace(/^\{|\}$/g, '').replace(/^['"]|['"]$/g, '');
          if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(token)) continue;
          if (/^(stage__|flowstudio$|flow-)/.test(token)) used.add(token);
        }
      }
    }
    // The shared composition is only meaningful when the pages really use it.
    expect(used.has('stage__head')).toBe(true);
    expect(used.has('stage__split')).toBe(true);
    expect(used.has('flow-node')).toBe(true);
    const unstyled = [...used].filter(className => !css.includes(`.${className}`));
    expect(unstyled).toEqual([]);
  });
});
