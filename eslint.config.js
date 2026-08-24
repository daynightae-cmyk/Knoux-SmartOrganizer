import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default [
  { ignores: ['dist/**', 'release/**', 'node_modules/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  { files: ['src/**/*.{ts,tsx}', 'shared/**/*.ts', 'tests/**/*.ts'], languageOptions: { globals: { ...globals.browser, ...globals.node } }, rules: { '@typescript-eslint/no-explicit-any': 'off' } },
  { files: ['electron/**/*.cjs', 'scripts/**/*.cjs'], languageOptions: { globals: { ...globals.node } }, rules: { '@typescript-eslint/no-require-imports': 'off', 'no-empty': ['error', { 'allowEmptyCatch': true }] } }
];
