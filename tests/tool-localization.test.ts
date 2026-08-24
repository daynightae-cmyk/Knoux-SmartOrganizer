import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
import { dictionaries } from '../src/locales';

const require = createRequire(import.meta.url);
const { createToolRegistry } = require('../electron/tool-registry.cjs') as {
  createToolRegistry: (resolver: (engine: string) => (...args: unknown[]) => Promise<unknown>) => Array<{ id: string; nameKey: string; descriptionKey: string }>;
};

describe('tool localization parity', () => {
  it('has non-empty Arabic and English name and description copy for every runtime tool', () => {
    const registry = createToolRegistry(() => async () => ({ summary: {}, items: [] }));
    const missing = registry.flatMap(tool => [
      ['ar', tool.nameKey], ['en', tool.nameKey], ['ar', tool.descriptionKey], ['en', tool.descriptionKey]
    ].filter(([locale, key]) => typeof dictionaries[locale as 'ar' | 'en'][key] !== 'string' || dictionaries[locale as 'ar' | 'en'][key].trim() === '').map(([locale, key]) => `${tool.id}:${locale}:${key}`));
    expect(missing).toEqual([]);
  });
});
