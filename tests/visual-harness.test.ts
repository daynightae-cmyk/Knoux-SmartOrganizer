import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const mainProcess = readFileSync(new URL('../electron/main.cjs', import.meta.url), 'utf8');

describe('visual acceptance navigation', () => {
  it('waits for an explicit page identity before starting world-specific checks', () => {
    expect(mainProcess).toContain('if (scenario.page && state.page !== scenario.page)');
    expect(mainProcess).not.toContain('if (scenario.page && state.page && state.page !== scenario.page)');
  });
});
