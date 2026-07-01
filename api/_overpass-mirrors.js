/**
 * Shared Overpass mirror runner used by BOTH the Vercel serverless function
 * (api/overpass.js) and the local Vite dev middleware (vite.config.js), so the
 * production and `npm run dev` data paths are identical.
 *
 * Runs server-side (Node), which is why it can freely try mirrors that are
 * awkward from a browser (CORS / ad-blockers / per-client mod_security) and set
 * a proper User-Agent per Overpass etiquette.
 *
 * The leading `_` keeps Vercel from exposing this file as its own endpoint.
 */

const MIRRORS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
];

// Identify ourselves politely; some instances reject blank/unknown agents.
const UA = 'Urbana/1.0 (urban-livability analysis; +https://github.com/Arnav-Dugad/urbana)';

async function fetchMirror(url, query, timeoutMs) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
        'User-Agent': UA,
      },
      body: `data=${encodeURIComponent(query)}`,
      signal: ctrl.signal,
    });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Try each mirror until one returns valid Overpass JSON.
 *
 * Two independent guards keep us inside the serverless `maxDuration`:
 *  - `perMirrorMs`  — give up on a slow/dead mirror and move on.
 *  - `overallMs`    — hard ceiling across all attempts, so we always return
 *                     in time rather than letting the function get killed.
 * A healthy Overpass answers our query in ~3–9 s, so these are generous.
 *
 * Resolves `{ ok: true, json }` or `{ ok: false, status, message }`.
 */
export async function queryOverpassMirrors(
  query,
  { perMirrorMs = 14000, overallMs = 24000 } = {}
) {
  const deadline = Date.now() + overallMs;
  let lastStatus = 0;
  let rateLimited = false;

  for (const url of MIRRORS) {
    const remaining = deadline - Date.now();
    if (remaining <= 1500) break; // not enough time for another attempt
    try {
      const res = await fetchMirror(url, query, Math.min(perMirrorMs, remaining));
      if (res.status === 429 || res.status === 504) {
        rateLimited = true;
        lastStatus = res.status;
        continue; // busy — try the next mirror
      }
      if (!res.ok) {
        lastStatus = res.status;
        continue; // 406/5xx — try the next mirror
      }
      const json = await res.json();
      // A malformed query yields 200 + a `remark` and no elements.
      if (json && Array.isArray(json.elements)) {
        return { ok: true, json };
      }
      lastStatus = 200;
    } catch {
      // timeout / network / abort — try the next mirror
    }
  }

  return {
    ok: false,
    status: rateLimited ? 503 : 502,
    message: rateLimited
      ? 'All Overpass mirrors are busy right now. Please try again in a moment.'
      : 'Could not reach the map-data service. Please try again.',
    lastStatus,
  };
}
