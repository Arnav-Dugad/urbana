import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { queryOverpassMirrors } from './api/_overpass-mirrors.js';
import { searchPlaces, reversePlace } from './api/_geocode-core.js';

/**
 * Dev-only middleware that mirrors the production `/api/*` serverless functions,
 * so `npm run dev` exercises the exact same data paths (same-origin proxies)
 * as the deployed app.
 */
function apiDevProxies() {
  return {
    name: 'api-dev-proxies',
    apply: 'serve',
    configureServer(server) {
      // /api/overpass — POST { query }
      server.middlewares.use('/api/overpass', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          return res.end(JSON.stringify({ error: 'Method not allowed' }));
        }
        let body = '';
        req.on('data', (c) => (body += c));
        req.on('end', async () => {
          try {
            let query;
            try {
              query = JSON.parse(body).query;
            } catch {
              query = body;
            }
            const result = await queryOverpassMirrors(query, { perMirrorMs: 14000, overallMs: 24000 });
            res.setHeader('Content-Type', 'application/json');
            if (!result.ok) {
              res.statusCode = result.status;
              return res.end(JSON.stringify({ error: result.message }));
            }
            res.statusCode = 200;
            res.end(JSON.stringify(result.json));
          } catch (err) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: String(err?.message || err) }));
          }
        });
      });

      // /api/geocode — GET ?q= | ?lat=&lon=
      server.middlewares.use('/api/geocode', async (req, res) => {
        try {
          const url = new URL(req.url, 'http://localhost');
          const q = url.searchParams.get('q');
          const lat = url.searchParams.get('lat');
          const lon = url.searchParams.get('lon');
          res.setHeader('Content-Type', 'application/json');
          if (lat != null && lon != null) {
            res.end(JSON.stringify({ name: await reversePlace(lat, lon) }));
          } else if (q != null) {
            res.end(JSON.stringify({ results: await searchPlaces(q) }));
          } else {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Provide ?q= or ?lat=&lon=' }));
          }
        } catch (err) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: String(err?.message || err) }));
        }
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    apiDevProxies(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icon-192.png', 'icon-512.png', 'og.png'],
      manifest: {
        name: 'Urbana — Urban Livability Analysis',
        short_name: 'Urbana',
        description:
          'Measure the greenery, walkability, transit and air quality of any neighbourhood on Earth.',
        theme_color: '#0B0F14',
        background_color: '#0B0F14',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.hostname.includes('basemaps.cartocdn.com'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'carto-tiles',
              expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 14 },
            },
          },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
    open: false,
  },
});
