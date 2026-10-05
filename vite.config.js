import { defineConfig } from 'vite';

// The dev entry lives in app/; `npm run build` writes to dist/, and
// `npm run publish` copies that build to the repo root, which is what
// GitHub Pages serves for this repository.
export default defineConfig({
  root: 'app',
  base: './',
  publicDir: false,
  server: { fs: { allow: ['..'] } },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    target: 'es2020',
    chunkSizeWarningLimit: 2000,
  },
});
