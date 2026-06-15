import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// Built output is written into the Electron app package (src/renderer-dist) and loaded
// via file:// — so assets must use relative paths (base: './').
export default defineConfig({
  plugins: [react()],
  base: './',
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      // Single source of truth: the framework-free TIMC Light engine lives at
      // structureview/src/timc-light and is imported by the bundled UI.
      '@timc': resolve(__dirname, '../src/timc-light'),
    },
  },
  // Allow the dev server to read the engine module that lives outside ui/.
  server: { fs: { allow: [resolve(__dirname, '..')] } },
  build: {
    outDir: resolve(__dirname, '../src/renderer-dist'),
    emptyOutDir: true,
  },
});
