/**
 * Geospatial helpers. We use turf for polygon area (geodesic, handles the
 * spherical earth correctly) and a hand-rolled haversine for point distance
 * (cheap, no dependency, plenty accurate at neighbourhood scale).
 */
import turfArea from '@turf/area';
import { polygon as turfPolygon } from '@turf/helpers';

const R = 6371008.8; // mean earth radius, metres

/** Great-circle distance in metres between two [lat, lon] points. */
export function haversineMeters(lat1, lon1, lat2, lon2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}

/**
 * Geodesic area (m²) of an Overpass `geometry` array ([{lat, lon}, ...]).
 * Returns 0 for anything that isn't a closed-ish ring (< 3 points).
 * turf expects GeoJSON [lon, lat] order and a closed ring.
 */
export function polygonAreaM2(geometry) {
  if (!Array.isArray(geometry) || geometry.length < 3) return 0;
  const ring = geometry.map((p) => [p.lon, p.lat]);
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) ring.push(first); // close it
  try {
    return turfArea(turfPolygon([ring]));
  } catch {
    return 0;
  }
}

/** Clamp a number into [min, max]. */
export const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

/** Round coords for cache keys / stable URLs (~1 m precision at 5 dp). */
export const roundCoord = (n, dp = 5) => Number(n.toFixed(dp));
