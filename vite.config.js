/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// v2 Amplop: the React "Amplop" shell is now the root entry (index.html). The
// previous vanilla app is preserved at legacy.html.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        // Root entry is now the v2 "Amplop" React shell (Phase 3 cutover).
        main: './index.html',
        // Previous vanilla app, preserved and reachable at /legacy.html.
        legacy: './legacy.html',
        // Hidden settings page (budget + subscriptions); URL-only, no link from
        // the app. Reachable at /settings.html.
        settings: './settings.html'
      }
    }
  },
  // Minimal test runner for the pure v2 engine/helpers (Node env — no DOM yet).
  test: {
    environment: 'node',
    include: ['src/**/*.{test,spec}.{js,jsx}'],
  },
})
