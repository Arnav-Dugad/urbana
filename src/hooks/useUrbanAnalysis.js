/**
 * useUrbanAnalysis(lat, lon, radius) — the heart of the app.
 *
 * Given a coordinate + radius it fetches OSM features (Overpass), air quality
 * and weather (Open-Meteo) *in parallel*, computes the four pillars + a blended
 * livability score, and returns { data, loading, error, refetch }.
 *
 * Design notes:
 *  - Air quality & weather are best-effort: if they fail the analysis still
 *    resolves (livability renormalizes over the pillars that are available).
 *  - Overpass failure IS fatal (it's the core dataset) → surfaces `error`.
 *  - Every request is tied to an AbortController so changing the target
 *    cancels stale work and prevents out-of-order results.
 *  - Successful results are memo-cached in localStorage (keyed by rounded
 *    coords + radius) to spare the shared public services.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { buildOverpassQuery, fetchOverpass } from '../lib/overpass.js';
import { fetchAirQuality } from '../lib/airQuality.js';
import { fetchWeather } from '../lib/weather.js';
import {
  parseOverpass,
  greeneryScore,
  walkabilityScore,
  transitScore,
  airQualityScore,
  livabilityScore,
} from '../lib/scoring.js';
import { roundCoord } from '../lib/geo.js';
import { ANALYSIS_RADIUS_M } from '../config/tags.js';

const CACHE_PREFIX = 'urbana:v2:';
const CACHE_TTL_MS = 1000 * 60 * 60 * 12; // 12 h

function cacheKey(lat, lon, radius) {
  return `${CACHE_PREFIX}${roundCoord(lat)},${roundCoord(lon)}@${radius}`;
}

function readCache(lat, lon, radius) {
  try {
    const raw = localStorage.getItem(cacheKey(lat, lon, radius));
    if (!raw) return null;
    const { t, data } = JSON.parse(raw);
    if (Date.now() - t > CACHE_TTL_MS) return null;
    return data;
  } catch {
    return null;
  }
}

function writeCache(lat, lon, radius, data) {
  try {
    localStorage.setItem(cacheKey(lat, lon, radius), JSON.stringify({ t: Date.now(), data }));
  } catch {
    /* storage full / disabled — non-fatal */
  }
}

/** Pure analysis pipeline shared by the hook and the compare flow. */
export async function analyzeLocation(lat, lon, radius = ANALYSIS_RADIUS_M, { signal } = {}) {
  const cached = readCache(lat, lon, radius);
  if (cached) return cached;

  const query = buildOverpassQuery(lat, lon, radius);

  // Overpass is required; air + weather are best-effort.
  const [overpassJson, air, weather] = await Promise.all([
    fetchOverpass(query, signal),
    fetchAirQuality(lat, lon, signal).catch(() => null),
    fetchWeather(lat, lon, signal).catch(() => null),
  ]);

  const parsed = parseOverpass(overpassJson, lat, lon, radius);
  const green = greeneryScore(parsed, radius);
  const walk = walkabilityScore(parsed.elements);
  const transit = transitScore(parsed.elements);
  const airScore = airQualityScore(air ? air.pm25 : null);

  const livability = livabilityScore({
    greenery: green.score,
    walkability: walk.score,
    transit: transit.score,
    air: airScore ? airScore.score : null,
  });

  const data = {
    lat,
    lon,
    radius,
    greeneryScore: green.score,
    walkabilityScore: walk.score,
    transitScore: transit.score,
    airQualityScore: airScore ? airScore.score : null,
    livabilityScore: livability,
    breakdown: {
      greenAreaM2: Math.round(parsed.greenAreaM2),
      blueAreaM2: Math.round(parsed.blueAreaM2),
      greenCoverPct: Math.round(green.greenCoverPct * 10) / 10,
      blueCoverPct: Math.round(green.blueCoverPct * 10) / 10,
      treeCount: parsed.treeCount,
      parkCount: parsed.parkCount,
      pharmacies: walk.counts.pharmacy || 0,
      supermarkets: walk.counts.supermarket || 0,
      schools: walk.counts.school || 0,
      amenityTotal: walk.total,
      diversity: walk.present,
      transitTotal: transit.total,
      transitStations: transit.stations,
      transitCounts: transit.counts,
      pm2_5: air ? air.pm25 : null,
      pm10: air ? air.pm10 : null,
      no2: air ? air.no2 : null,
      o3: air ? air.o3 : null,
      usAqi: air ? air.usAqi : null,
      uv: air ? air.uv : null,
      aqiCategory: airScore ? airScore.category : null,
      airTrend: air ? air.trend : [],
      weather: weather || null,
    },
    elements: parsed.elements,
  };

  writeCache(lat, lon, radius, data);
  return data;
}

export default function useUrbanAnalysis(lat, lon, radius = ANALYSIS_RADIUS_M) {
  const [state, setState] = useState({ data: null, loading: false, error: null });
  const abortRef = useRef(null);
  const [nonce, setNonce] = useState(0); // bumping this forces a refetch

  const refetch = useCallback(() => {
    try {
      localStorage.removeItem(cacheKey(lat, lon, radius));
    } catch {
      /* ignore */
    }
    setNonce((n) => n + 1);
  }, [lat, lon, radius]);

  useEffect(() => {
    if (lat == null || lon == null) return;

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    let alive = true;
    setState((s) => ({ ...s, loading: true, error: null }));

    analyzeLocation(lat, lon, radius, { signal: ctrl.signal })
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
  }, [lat, lon, radius, nonce]);

  return { ...state, refetch };
}
