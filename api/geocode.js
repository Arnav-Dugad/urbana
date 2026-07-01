/**
 * Vercel serverless proxy for geocoding (same-origin, like /api/overpass).
 *   GET /api/geocode?q=<text>            → forward search
 *   GET /api/geocode?lat=<>&lon=<>       → reverse geocode
 */
import { searchPlaces, reversePlace } from './_geocode-core.js';

export const config = { maxDuration: 15 };

export default async function handler(req, res) {
  try {
    const { q, lat, lon } = req.query || {};
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800');

    if (lat != null && lon != null) {
      const name = await reversePlace(lat, lon);
      return res.status(200).json({ name });
    }
    if (q != null) {
      const results = await searchPlaces(q);
      return res.status(200).json({ results });
    }
    return res.status(400).json({ error: 'Provide ?q= or ?lat=&lon=' });
  } catch (err) {
    return res.status(500).json({ error: String(err?.message || err) });
  }
}
