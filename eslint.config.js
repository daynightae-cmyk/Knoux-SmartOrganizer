import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default [
  // The Gemini desktop renderer is a nested project with its own TypeScript,
  // Electron CJS and CI contract gates; the root lint must not reinterpret it.
  { ignores: ['dist/**', 'release/**', 'node_modules/**', 'apps/gemini-ui/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  { files: ['src/**/*.{ts,tsx}', 'shared/**/*.ts', 'tests/**/*.ts'], languageOptions: { globals: { ...globals.browser, ...globals.node } }, rules: { '@typescript-eslint/no-explicit-any': 'off' } },
  { files: ['electron/**/*.cjs', 'scripts/**/*.cjs'], languageOptions: { globals: { ...globals.node } }, rules: { '@typescript-eslint/no-require-imports': 'off', 'no-empty': ['error', { 'allowEmptyCatch': true }] } }
];
