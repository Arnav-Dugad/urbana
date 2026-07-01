/**
 * Vercel serverless proxy for Overpass.
 *
 * The browser calls this SAME-ORIGIN endpoint (`/api/overpass`) instead of a
 * third-party Overpass server. That removes every browser-specific failure
 * mode that was leaving the app stuck loading: CORS rejections, ad-blocker
 * blocking of third-party map domains, and per-client mod_security 406s.
 */
import { queryOverpassMirrors } from './_overpass-mirrors.js';

// Overpass queries can take ~10 s; give the function room beyond the default.
export const config = { maxDuration: 30 };

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Vercel parses a JSON body automatically; accept a raw string too.
    let query = req.body?.query;
    if (!query && typeof req.body === 'string') {
      try {
        query = JSON.parse(req.body).query;
      } catch {
        query = req.body;
      }
    }
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Missing "query" in request body.' });
    }

    const result = await queryOverpassMirrors(query, { perMirrorMs: 14000, overallMs: 24000 });

    if (!result.ok) {
      return res.status(result.status).json({ error: result.message });
    }

    // Short CDN cache: identical nearby queries are cheap to reuse.
    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=1800');
    return res.status(200).json(result.json);
  } catch (err) {
    return res.status(500).json({ error: 'Proxy error: ' + (err?.message || 'unknown') });
  }
}
