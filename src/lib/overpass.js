/**
 * Overpass API access layer.
 *
 * Public Overpass instances are free but rate-limited and occasionally down,
 * so we build one compact query and try a list of mirrors in turn, with a
 * short retry, before surfacing an error. All requests honour an external
 * AbortSignal so the hook can cancel stale in-flight work.
 */
import { ANALYSIS_RADIUS_M, GREEN_TAGS, WALK_TAGS } from '../config/tags.js';

const MIRRORS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
];

/**
 * Build the Overpass QL query for a point.
 * `nwr` = node/way/relation in one line; `out center tags` returns a
 * representative point (for markers) plus tags, and `out geom` on the ways
 * gives us vertex geometry for accurate area maths.
 */
export function buildOverpassQuery(lat, lon, radius = ANALYSIS_RADIUS_M) {
  const around = `(around:${radius},${lat},${lon})`;
  const allTags = [
    ...GREEN_TAGS.base,
    ...GREEN_TAGS.extended,
    ...WALK_TAGS.base,
    ...WALK_TAGS.extended,
  ];

  // Trees are always nodes; everything else can be node/way/relation. We ask
  // for geometry so polygon areas are exact.
  const lines = allTags
    .map(([k, v]) => `  nwr["${k}"="${v}"]${around};`)
    .join('\n');

  return `[out:json][timeout:25];
(
${lines}
);
out geom tags center;`;
}

/** Fetch with timeout + external abort signal. */
async function fetchWithTimeout(url, body, externalSignal, timeoutMs = 30000) {
  const ctrl = new AbortController();
  const onAbort = () => ctrl.abort();
  if (externalSignal) {
    if (externalSignal.aborted) ctrl.abort();
    else externalSignal.addEventListener('abort', onAbort, { once: true });
  }
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    // Canonical Overpass form: `data=<url-encoded QL>`. This is exactly what
    // browser clients (overpass-turbo etc.) send, so it's the most widely
    // accepted format across public instances.
    return await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: `data=${encodeURIComponent(body)}`,
      signal: ctrl.signal,
    });
  } finally {
    clearTimeout(timer);
    if (externalSignal) externalSignal.removeEventListener('abort', onAbort);
  }
}

/**
 * Run a query against the mirror list. Resolves with parsed JSON, or throws
 * an Error tagged with a `.code` we can present nicely in the UI.
 */
export async function fetchOverpass(query, signal) {
  let lastError;
  for (const url of MIRRORS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      // If the caller cancelled (coords changed), stop immediately.
      if (signal?.aborted) {
        const e = new Error('aborted');
        e.code = 'ABORTED';
        throw e;
      }
      try {
        const res = await fetchWithTimeout(url, query, signal);
        if (res.status === 429 || res.status === 504) {
          lastError = new Error(`Rate limited (${res.status})`);
          lastError.code = 'RATE_LIMIT';
          await sleep(600 * (attempt + 1));
          continue;
        }
        if (!res.ok) {
          lastError = new Error(`Overpass ${res.status}`);
          lastError.code = 'SERVER';
          continue;
        }
        return await res.json();
      } catch (err) {
        if (err.name === 'AbortError' && signal?.aborted) {
          err.code = 'ABORTED';
          throw err;
        }
        lastError = err; // timeout or network — try next mirror
      }
    }
  }
  const e = new Error(
    lastError?.code === 'RATE_LIMIT'
      ? 'All Overpass mirrors are busy right now. Please try again in a moment.'
      : 'Could not reach the map data service. Check your connection and retry.'
  );
  e.code = lastError?.code || 'NETWORK';
  throw e;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
