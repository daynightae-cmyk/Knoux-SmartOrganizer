import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  base: './',
  resolve: { alias: { '@': path.resolve(__dirname, 'src'), '@shared': path.resolve(__dirname, 'shared') } },
  build: { outDir: 'dist', emptyOutDir: true },
  server: { strictPort: true, port: 5173 }
});
