import { configDefaults, defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  base: './',
  resolve: { alias: { '@': path.resolve(__dirname, 'src'), '@shared': path.resolve(__dirname, 'shared') } },
  build: { outDir: 'dist', emptyOutDir: true },
  test: {
    // The sibling Gemini application carries its own suite and its own
    // dependencies. Running it from this project reports missing modules that
    // this install never provided, so the product suite stays the product suite.
    exclude: [...configDefaults.exclude, 'apps/**']
  },
  server: { strictPort: true, port: 5173 }
});
