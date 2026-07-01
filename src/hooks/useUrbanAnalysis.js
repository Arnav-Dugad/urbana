/**
 * useUrbanAnalysis(lat, lon) — the heart of the app.
 *
 * Given a coordinate it fetches OSM features (Overpass) and PM2.5 (Open-Meteo)
 * *in parallel*, computes greenery / walkability / air-quality / livability
 * scores, and returns { data, loading, error, refetch }.
 *
 * Design notes:
 *  - Air quality is best-effort: if Open-Meteo fails the analysis still
 *    resolves with greenery + walkability (livability renormalizes).
 *  - Overpass failure IS fatal (it's the core dataset) → surfaces `error`.
 *  - Every request is tied to an AbortController so changing the target
 *    coordinate cancels stale work and prevents out-of-order results.
 *  - Successful results are memo-cached in localStorage (keyed by rounded
 *    coords) to spare the shared public Overpass mirrors.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { buildOverpassQuery, fetchOverpass } from '../lib/overpass.js';
import { fetchPm25 } from '../lib/airQuality.js';
import {
  parseOverpass,
  greeneryScore,
  walkabilityScore,
  airQualityScore,
  livabilityScore,
} from '../lib/scoring.js';
import { roundCoord } from '../lib/geo.js';

const CACHE_PREFIX = 'urbana:v1:';
const CACHE_TTL_MS = 1000 * 60 * 60 * 12; // 12 h

function cacheKey(lat, lon) {
  return `${CACHE_PREFIX}${roundCoord(lat)},${roundCoord(lon)}`;
}

function readCache(lat, lon) {
  try {
    const raw = localStorage.getItem(cacheKey(lat, lon));
    if (!raw) return null;
    const { t, data } = JSON.parse(raw);
    if (Date.now() - t > CACHE_TTL_MS) return null;
    return data;
  } catch {
    return null;
  }
}

function writeCache(lat, lon, data) {
  try {
    localStorage.setItem(cacheKey(lat, lon), JSON.stringify({ t: Date.now(), data }));
  } catch {
    /* storage full / disabled — non-fatal */
  }
}

/** Pure analysis pipeline shared by the hook and the compare flow. */
export async function analyzeLocation(lat, lon, { signal } = {}) {
  const cached = readCache(lat, lon);
  if (cached) return cached;

  const query = buildOverpassQuery(lat, lon);

  // Run both data sources concurrently. Air quality is allowed to fail.
  const [overpassJson, pm25] = await Promise.all([
    fetchOverpass(query, signal),
    fetchPm25(lat, lon, signal).catch(() => null),
  ]);

  const parsed = parseOverpass(overpassJson, lat, lon);
  const green = greeneryScore(parsed);
  const walk = walkabilityScore(parsed.elements);
  const air = airQualityScore(pm25);

  const data = {
    lat,
    lon,
    greeneryScore: green.score,
    walkabilityScore: walk.score,
    airQualityScore: air ? air.score : null,
    livabilityScore: livabilityScore({
      greenery: green.score,
      walkability: walk.score,
      air: air ? air.score : null,
    }),
    breakdown: {
      greenAreaM2: Math.round(parsed.greenAreaM2),
      greenCoverPct: Math.round(green.coverPct * 10) / 10,
      treeCount: parsed.treeCount,
      parkCount: parsed.parkCount,
      pharmacies: walk.counts.pharmacy || 0,
      supermarkets: walk.counts.supermarket || 0,
      schools: walk.counts.school || 0,
      amenityTotal: walk.total,
      diversity: walk.present,
      pm2_5: air ? air.pm25 : null,
      aqiCategory: air ? air.category : null,
    },
    elements: parsed.elements,
  };

  writeCache(lat, lon, data);
  return data;
}

export default function useUrbanAnalysis(lat, lon) {
  const [state, setState] = useState({ data: null, loading: false, error: null });
  const abortRef = useRef(null);
  const [nonce, setNonce] = useState(0); // bumping this forces a refetch

  const refetch = useCallback(() => {
    // Clear the cache entry so refetch truly re-queries.
    try {
      localStorage.removeItem(cacheKey(lat, lon));
    } catch {
      /* ignore */
    }
    setNonce((n) => n + 1);
  }, [lat, lon]);

  useEffect(() => {
    if (lat == null || lon == null) return;

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    let alive = true;
    setState((s) => ({ ...s, loading: true, error: null }));

    analyzeLocation(lat, lon, { signal: ctrl.signal })
      .then((data) => {
        if (alive && !ctrl.signal.aborted) setState({ data, loading: false, error: null });
      })
      .catch((err) => {
        if (err.code === 'ABORTED' || ctrl.signal.aborted) return; // superseded
        if (alive) setState((s) => ({ ...s, loading: false, error: err }));
      });

    return () => {
      alive = false;
      ctrl.abort();
    };
  }, [lat, lon, nonce]);

  return { ...state, refetch };
}
