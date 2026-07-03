import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

// While joined to the Seven's WiFi, the device serves its API here. Override if
// needed with: `SEVEN_HOST=http://192.168.1.1 npm run dev`.
const SEVEN_HOST = process.env.SEVEN_HOST ?? 'http://192.168.1.1';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Dev convenience: load the core straight from source (instant
      // hot-reload, no build step). Mirrors the `paths` entry in
      // web/tsconfig.json.
      '@crumar-seven-cockpit/core': fileURLToPath(
        new URL('../core/src/index.ts', import.meta.url),
      ),
    },
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
    // The browser calls same-origin `/device/*`; Vite forwards to the Seven
    // server-side, so there's no CORS to fight.
    proxy: {
      '/device': {
        target: SEVEN_HOST,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/device/, ''),
      },
    },
  },
});
