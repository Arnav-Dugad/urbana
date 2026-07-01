/**
 * Client geocoding. Calls the same-origin `/api/geocode` proxy first (which
 * talks to Nominatim server-side with a proper User-Agent), and falls back to
 * hitting Nominatim directly only if the proxy is unavailable — mirroring the
 * Overpass client pattern.
 */
const DIRECT = 'https://nominatim.openstreetmap.org';

/** Forward search: free text → ranked list of places. */
export async function searchPlaces(query, signal) {
  const q = query.trim();
  if (q.length < 2) return [];
  try {
    const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`, { signal });
    if (res.ok) {
      const j = await res.json();
      if (Array.isArray(j.results)) return j.results;
    }
  } catch (err) {
    if (err.name === 'AbortError') throw err;
  }
  return directSearch(q, signal);
}

/** Reverse geocode: coords → a short human place name. */
export async function reverseGeocode(lat, lon, signal) {
  try {
    const res = await fetch(`/api/geocode?lat=${lat}&lon=${lon}`, { signal });
    if (res.ok) {
      const j = await res.json();
      if ('name' in j) return j.name;
    }
  } catch (err) {
    if (err.name === 'AbortError') throw err;
  }
  return directReverse(lat, lon, signal);
}

// ---- direct-to-Nominatim fallbacks -----------------------------------------

async function directSearch(q, signal) {
  let results = await run(
    `${DIRECT}/search?format=jsonv2&addressdetails=1&limit=6&countrycodes=in&q=${encodeURIComponent(q)}`,
    signal
  );
  if (results.length === 0) {
    results = await run(
      `${DIRECT}/search?format=jsonv2&addressdetails=1&limit=6&q=${encodeURIComponent(q)}`,
      signal
    );
  }
  return results.map(normalize);
}

async function directReverse(lat, lon, signal) {
  const res = await fetch(
    `${DIRECT}/reverse?format=jsonv2&zoom=16&addressdetails=1&lat=${lat}&lon=${lon}`,
    { signal, headers: { Accept: 'application/json' } }
  );
  if (!res.ok) return null;
  const j = await res.json();
  if (!j || j.error) return null;
  return shortName(j);
}

async function run(url, signal) {
  const res = await fetch(url, { signal, headers: { Accept: 'application/json' } });
  if (!res.ok) return [];
  return res.json();
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
