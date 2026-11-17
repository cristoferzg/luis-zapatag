import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { readFileSync } from 'node:fs';

// Versión única del sistema: sale de la fecha y hora (Lima) de cada compilación y es la misma
// en la web, el programa de PC y la app Android (Gradle lee dist/version.txt). Ej. 2026.11.05.1432
const BUILD = new Date();
const lima = new Date(BUILD.getTime() - 5 * 3600e3); // Perú: UTC-5 todo el año
const dd = (n: number) => String(n).padStart(2, '0');
const VERSION = `${lima.getUTCFullYear()}.${dd(lima.getUTCMonth() + 1)}.${dd(lima.getUTCDate())}.${dd(lima.getUTCHours())}${dd(lima.getUTCMinutes())}`;

// Código de versión de la app Android (versionCode de Google Play): el contador de
// android/app/codigo-version.txt. Se compila dentro de la web, así la app sabe su número.
let CODIGO_ANDROID = 0;
try { CODIGO_ANDROID = parseInt(readFileSync('android/app/codigo-version.txt', 'utf8').trim(), 10) || 0; } catch { /* sin carpeta android */ }

// https://vite.dev/config/
export default defineConfig({
  define: { __BUILD__: JSON.stringify(BUILD.toISOString()), __VERSION__: JSON.stringify(VERSION), __CODIGO_ANDROID__: JSON.stringify(CODIGO_ANDROID) },
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  server: {
    hmr: false,
    watch: {
      usePolling: false,
    },
  },
  plugins: [
    { name: 'version-app', generateBundle() { this.emitFile({ type: 'asset', fileName: 'version.txt', source: VERSION }); } },
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['apple-touch-icon.png', 'favicon-32.png', 'favicon-64.png', 'pwa-192x192.png', 'pwa-512x512.png'],
      manifest: {
        id: '/',
        name: 'Innova Contratistas',
        short_name: 'InnovApp', // nombre bajo el ícono de la app instalada
        description: 'Gestor integral de estructuras metálicas, herrería CAD, presupuestos y control de proyectos',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'any',
        start_url: '/',
        scope: '/',
        // La app de Google Play es "pariente" de esta web: Chrome en Android puede saber si ya está
        // instalada (navigator.getInstalledRelatedApps) y así no pedir que la descarguen otra vez.
        related_applications: [{ platform: 'play', id: 'pe.innovacontratistas.app', url: 'https://play.google.com/store/apps/details?id=pe.innovacontratistas.app' }],
        prefer_related_applications: false,
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/pwa-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 16 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        // Páginas fijas que no son la app (política de privacidad, enlaces de Android).
        navigateFallbackDenylist: [/^\/privacidad/, /^\/\.well-known\//],
        clientsClaim: true,
        skipWaiting: true,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    chunkSizeWarningLimit: 4000,
    rollupOptions: {
      output: {
        // Solo se fijan bloques para lo grande y compartido. Lo demás va con quien lo usa:
        // antes TODO node_modules caía en vendor-main (cargado al abrir), incluidas las librerías
        // de PDF, QR y ZIP que solo usan algunos apartados (≈ 1/2 del bloque inicial).
        manualChunks(id) {
          // Ayudantes de Vite/Rollup: si caen en un bloque pesado (PDF), lo arrastran al arranque.
          if (id.includes('vite/preload-helper') || id.includes('commonjsHelpers') || id.includes('vite/modulepreload-polyfill')) return 'vendor-react';
          if (!id.includes('node_modules')) return undefined;
          if (/node_modules\/(@babel\/runtime|tslib)\//.test(id)) return 'vendor-react';
          if (id.includes('lucide-react')) return 'vendor-iconos'; // un solo bloque (antes: un archivo por ícono)
          if (/node_modules\/(react|react-dom|scheduler)\//.test(id)) return 'vendor-react';
          if (id.includes('three')) return 'vendor-three';
          if (id.includes('firebase') || id.includes('/re2js/') || id.includes('/idb/')) return 'vendor-firebase';
          if (id.includes('mediabunny')) return 'vendor-video'; // solo al subir un video
          if (/node_modules\/(jspdf|html2canvas|html2pdf|canvg|fflate|fast-png|dompurify|core-js|stackblur-canvas|iobuffer|svg-pathdata|rgbcolor|raf|performance-now)\//.test(id)) return 'vendor-pdf';
          if (/node_modules\/(jszip|pako)\//.test(id)) return 'vendor-zip';
          if (id.includes('/jsqr/')) return 'vendor-qr';
          return undefined;
        },
      },
    },
  },
});

