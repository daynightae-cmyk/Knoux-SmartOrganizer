import { defineConfig } from 'vitest/config';

/**
 * The nested `apps/gemini-ui` renderer has its own package, TypeScript and
 * test-scope. Root Vitest must not collect its page tests (they import the
 * nested application's toolchain, not this repository's root tests).
 */
export default defineConfig({
  test: {
    exclude: [
      'apps/gemini-ui/**',
      'node_modules/**',
      'dist/**',
      'release/**',
      'release-gemini/**',
    ],
  },
});
