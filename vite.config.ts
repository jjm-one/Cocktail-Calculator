import { copyFileSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const pkg = JSON.parse(readFileSync(resolve(import.meta.dirname, 'package.json'), 'utf-8')) as { version: string };

// GitHub Pages has no server-side rewrites. Serving a copy of index.html as
// 404.html lets deep links like /Cocktail-Calculator/de/recipes load the
// SPA shell, which then resolves the route client-side via React Router.
function spaFallback(): Plugin {
  return {
    name: 'spa-404-fallback',
    apply: 'build',
    closeBundle() {
      const outDir = resolve(import.meta.dirname, 'dist');
      copyFileSync(resolve(outDir, 'index.html'), resolve(outDir, '404.html'));
    },
  };
}

export default defineConfig(({ command, isPreview }) => ({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        name: "JJM's Cocktail-Calculator",
        short_name: 'Cocktail-Calc',
        description:
          'Bilingual cocktail planning, recipe scaling and profitability calculator – fully local and offline-capable in the browser.',
        theme_color: '#16171a',
        background_color: '#16171a',
        display: 'standalone',
        start_url: '.',
        scope: '.',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Precache the app shell plus the default recipe/price data so the
        // app works fully offline after the first visit.
        globPatterns: ['**/*.{js,css,html,ico,svg,png,json,csv,webmanifest}'],
        navigateFallback: 'index.html',
      },
    }),
    spaFallback(),
  ],
  // Only the production build (and `vite preview`, which serves that same
  // build) needs the GitHub Pages project-page subpath
  // (github.io/Cocktail-Calculator/) so absolute asset URLs resolve there.
  // Plain `vite dev` serves from root for clean /de/... URLs.
  base: command === 'build' || isPreview ? '/Cocktail-Calculator/' : '/',
}));
