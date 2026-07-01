/**
 * Geocoding via OpenStreetMap Nominatim (free, keyless). We bias results
 * toward India for relevance but never restrict — searching any place on Earth
 * still works. Nominatim's usage policy asks for a descriptive identifier and
 * light request rates; the app debounces input and reverse-geocodes only on
 * committed location changes.
 */
const BASE = 'https://nominatim.openstreetmap.org';

/** Forward search: free text → ranked list of places. */
export async function searchPlaces(query, signal) {
  const q = query.trim();
  if (q.length < 2) return [];
  const url =
    `${BASE}/search?format=jsonv2&addressdetails=1&limit=6` +
    `&countrycodes=in&q=${encodeURIComponent(q)}`;

  // First pass biased to India; if nothing found, retry worldwide.
  let results = await run(url, signal);
  if (results.length === 0) {
    results = await run(
      `${BASE}/search?format=jsonv2&addressdetails=1&limit=6&q=${encodeURIComponent(q)}`,
      signal
    );
  }
  return results.map(normalize);
}

/** Reverse geocode: coords → a short human place name. */
export async function reverseGeocode(lat, lon, signal) {
  const url = `${BASE}/reverse?format=jsonv2&zoom=16&addressdetails=1&lat=${lat}&lon=${lon}`;
  const res = await fetch(url, { signal, headers: { Accept: 'application/json' } });
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

/** Build a compact "Neighbourhood, City" style label from address parts. */
function shortName(r) {
  const a = r.address || {};
  const primary =
    a.neighbourhood ||
    a.suburb ||
    a.village ||
    a.town ||
    a.city_district ||
    a.hamlet ||
    r.name ||
    (r.display_name ? r.display_name.split(',')[0] : 'Selected location');
  const city = a.city || a.town || a.state_district || a.county || a.state;
  return city && city !== primary ? `${primary}, ${city}` : primary;
}
