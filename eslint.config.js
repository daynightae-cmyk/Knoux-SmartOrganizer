import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default [
  // apps/** is a separate application with its own tsconfig, dependencies and
  // lint toolchain. This config grants browser and node globals only to src,
  // shared and tests, so walking into apps/ reported 574 no-undef errors for
  // code it was never set up to judge. The sibling app keeps its own toolchain.
  { ignores: ['dist/**', 'release/**', 'node_modules/**', 'apps/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  { files: ['src/**/*.{ts,tsx}', 'shared/**/*.ts', 'tests/**/*.ts'], languageOptions: { globals: { ...globals.browser, ...globals.node } }, rules: { '@typescript-eslint/no-explicit-any': 'off' } },
  { files: ['electron/**/*.cjs', 'scripts/**/*.cjs'], languageOptions: { globals: { ...globals.node } }, rules: { '@typescript-eslint/no-require-imports': 'off', 'no-empty': ['error', { 'allowEmptyCatch': true }] } }
];
