/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Phase 0 (v2 Amplop): React/JSX build support is enabled now so the v2
// rewrite can be authored as React components, while the current vanilla
// `index.html` entry keeps building unchanged until the Phase 3 cutover.
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
        main: './index.html',
        // v2 "Amplop" shell — built alongside the live app until the Phase 3
        // cutover swaps index.html over to it.
        v2: './v2.html',
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
