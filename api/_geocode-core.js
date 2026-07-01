/**
 * Shared Nominatim (OSM geocoding) runner used by BOTH the Vercel serverless
 * function (api/geocode.js) and the local Vite dev middleware, so production
 * and `npm run dev` behave identically.
 *
 * Runs server-side so it can send a proper User-Agent (Nominatim's usage policy
 * requires one) and avoid the rate/identification flakiness of calling it
 * directly from the browser. The leading `_` keeps Vercel from routing it.
 */
const BASE = 'https://nominatim.openstreetmap.org';
const UA = 'Urbana/1.0 (urban-livability analysis; +https://github.com/Arnav-Dugad/urbana)';

async function nominatim(path, timeoutMs = 8000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: { Accept: 'application/json', 'User-Agent': UA },
      signal: ctrl.signal,
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Forward search: free text → ranked list of normalized places. */
export async function searchPlaces(query) {
  const q = (query || '').trim();
  if (q.length < 2) return [];
  let results = await nominatim(
    `/search?format=jsonv2&addressdetails=1&limit=6&countrycodes=in&q=${encodeURIComponent(q)}`
  );
  if (!Array.isArray(results) || results.length === 0) {
    results = await nominatim(
      `/search?format=jsonv2&addressdetails=1&limit=6&q=${encodeURIComponent(q)}`
    );
  }
  return Array.isArray(results) ? results.map(normalize) : [];
}

/** Reverse geocode: coords → a short human place name. */
export async function reversePlace(lat, lon) {
  const j = await nominatim(`/reverse?format=jsonv2&zoom=16&addressdetails=1&lat=${lat}&lon=${lon}`);
  if (!j || j.error) return null;
  return shortName(j);
}

function normalize(r) {
  return {
    id: `${r.osm_type}/${r.osm_id}`,
    name: r.display_name,
    short: shortName(r),
    lat: Number(r.lat),
    lon: Number(r.lon),
    kind: r.type,
  };
}

function shortName(r) {
  const a = r.address || {};
  const primary =
    a.neighbourhood || a.suburb || a.village || a.town || a.city_district ||
    a.hamlet || r.name || (r.display_name ? r.display_name.split(',')[0] : 'Selected location');
  const city = a.city || a.town || a.state_district || a.county || a.state;
  return city && city !== primary ? `${primary}, ${city}` : primary;
}
