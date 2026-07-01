import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { queryOverpassMirrors } from './api/_overpass-mirrors.js';

/**
 * Dev-only middleware that mirrors the production `/api/overpass` serverless
 * function, so `npm run dev` exercises the exact same data path (same-origin
 * proxy → shared mirror runner) as the deployed app.
 */
function overpassDevProxy() {
  return {
    name: 'overpass-dev-proxy',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/api/overpass', async (req, res) => {
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
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), overpassDevProxy()],
  server: {
    port: 5173,
    open: false,
  },
});
