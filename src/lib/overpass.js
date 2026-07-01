/**
 * Overpass API access layer (client side).
 *
 * The app calls a SAME-ORIGIN proxy (`/api/overpass`) rather than public
 * Overpass servers directly — that removes the browser-specific failure modes
 * (CORS, ad-blockers, per-client mod_security 406s) that previously left the
 * analysis stuck loading. If the proxy itself is unreachable we fall back to
 * hitting public mirrors directly, so the app still degrades gracefully.
 */
import { ANALYSIS_RADIUS_M, GREEN_TAGS, WATER_TAGS, WALK_TAGS, TRANSIT_TAGS } from '../config/tags.js';

const PROXY_URL = '/api/overpass';

// Direct fallbacks (only used if the same-origin proxy can't be reached).
const DIRECT_MIRRORS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
];

/**
 * Build the Overpass QL query for a point.
 *
 * `nwr` = node/way/relation in one line. We finish with `out geom;` (NOT
 * `out geom tags center;` which was measured at ~24 s — right at the server
 * timeout). `out geom;` returns tags + full geometry + a `bounds` box for
 * every element in ~9 s, which is everything the scorer needs.
 */
export function buildOverpassQuery(lat, lon, radius = ANALYSIS_RADIUS_M) {
  const around = `(around:${radius},${lat},${lon})`;
  const allTags = [
    ...GREEN_TAGS.base,
    ...GREEN_TAGS.extended,
    ...WATER_TAGS,
    ...WALK_TAGS.base,
    ...WALK_TAGS.extended,
    ...TRANSIT_TAGS,
  ];

  const lines = allTags.map(([k, v]) => `  nwr["${k}"="${v}"]${around};`).join('\n');

  return `[out:json][timeout:25];
(
${lines}
);
out geom;`;
}

/** fetch() wrapper: honours an external abort signal AND a hard timeout. */
async function timedFetch(url, options, externalSignal, timeoutMs) {
  const ctrl = new AbortController();
  const onAbort = () => ctrl.abort();
  if (externalSignal) {
    if (externalSignal.aborted) ctrl.abort();
    else externalSignal.addEventListener('abort', onAbort, { once: true });
  }
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
    if (externalSignal) externalSignal.removeEventListener('abort', onAbort);
  }
}

function abortedError() {
  const e = new Error('aborted');
  e.code = 'ABORTED';
  return e;
}

/**
 * Fetch OSM features for a query. Tries the same-origin proxy first, then
 * public mirrors. Resolves with parsed Overpass JSON or throws an Error
 * tagged with `.code` for the UI ('RATE_LIMIT' | 'NETWORK' | 'ABORTED').
 */
export async function fetchOverpass(query, signal) {
  if (signal?.aborted) throw abortedError();

  // 1) Same-origin proxy (the reliable path). It already tries every mirror
  //    server-side, so if it gives a definitive answer (200/502/503) we trust
  //    it and DON'T redundantly re-hit the same mirrors from the browser.
  //    We only fall back to direct mirrors when the proxy itself is missing
  //    or broken (404 on a non-Vercel static host, network error, or 500).
  try {
    const res = await timedFetch(
      PROXY_URL,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ query }),
      },
      signal,
      28000
    );
    if (res.ok) {
      const json = await res.json();
      if (json && Array.isArray(json.elements)) return json;
      // 200 but unexpected shape → treat as proxy malfunction, try direct.
    } else if (res.status === 503) {
      const e = new Error('All Overpass mirrors are busy right now. Please try again in a moment.');
      e.code = 'RATE_LIMIT';
      throw e;
    } else if (res.status === 502) {
      // Proxy reached every mirror and all failed — surface it, don't retry.
      const e = new Error('Could not reach the map-data service. Check your connection and retry.');
      e.code = 'NETWORK';
      throw e;
    }
    // 404 / 500 / other → proxy absent or buggy → fall through to direct.
  } catch (err) {
    if (err.code === 'ABORTED' || (err.name === 'AbortError' && signal?.aborted)) {
      throw abortedError();
    }
    if (err.code === 'RATE_LIMIT' || err.code === 'NETWORK') throw err;
    // genuine proxy-unreachable (network throw) — fall through to direct mirrors
  }

  // 2) Direct-mirror fallback (only when the proxy couldn't answer).
  return fetchDirectMirrors(query, signal);
}

async function fetchDirectMirrors(query, signal) {
  let rateLimited = false;
  for (const url of DIRECT_MIRRORS) {
    if (signal?.aborted) throw abortedError();
    try {
      const res = await timedFetch(
        url,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json',
          },
          body: `data=${encodeURIComponent(query)}`,
        },
        signal,
        18000
      );
      if (res.status === 429 || res.status === 504) {
        rateLimited = true;
        continue;
      }
      if (!res.ok) continue;
      const json = await res.json();
      if (json && Array.isArray(json.elements)) return json;
    } catch (err) {
      if (err.name === 'AbortError' && signal?.aborted) throw abortedError();
      // timeout / network / CORS — try the next mirror
    }
  }

  const e = new Error(
    rateLimited
      ? 'All Overpass mirrors are busy right now. Please try again in a moment.'
      : 'Could not reach the map-data service. Check your connection and retry.'
  );
  e.code = rateLimited ? 'RATE_LIMIT' : 'NETWORK';
  throw e;
}
