/**
 * Reads/writes the analysed location (+ optional compare pin + radius) in the
 * URL query string so every view is shareable, bookmarkable, and survives
 * reload. Format: ?lat=..&lon=..&name=..&r=..&clat=..&clon=..&cname=..
 */
import { roundCoord } from '../lib/geo.js';
import { RADIUS_OPTIONS, ANALYSIS_RADIUS_M } from '../config/tags.js';

export function readLocationFromUrl() {
  const p = new URLSearchParams(window.location.search);
  const lat = parseFloat(p.get('lat'));
  const lon = parseFloat(p.get('lon'));
  if (Number.isNaN(lat) || Number.isNaN(lon)) return null;

  const r = parseInt(p.get('r'), 10);
  const radius = RADIUS_OPTIONS.includes(r) ? r : ANALYSIS_RADIUS_M;

  const result = { primary: { lat, lon, name: p.get('name') || null }, radius };
  const clat = parseFloat(p.get('clat'));
  const clon = parseFloat(p.get('clon'));
  if (!Number.isNaN(clat) && !Number.isNaN(clon)) {
    result.compare = { lat: clat, lon: clon, name: p.get('cname') || null };
  }
  return result;
}

function buildParams(primary, compare, radius) {
  const p = new URLSearchParams();
  p.set('lat', roundCoord(primary.lat));
  p.set('lon', roundCoord(primary.lon));
  if (primary.name) p.set('name', primary.name);
  if (radius && radius !== ANALYSIS_RADIUS_M) p.set('r', radius);
  if (compare) {
    p.set('clat', roundCoord(compare.lat));
    p.set('clon', roundCoord(compare.lon));
    if (compare.name) p.set('cname', compare.name);
  }
  return p;
}

export function writeLocationToUrl(primary, compare, radius) {
  const p = buildParams(primary, compare, radius);
  window.history.replaceState(null, '', `${window.location.pathname}?${p.toString()}`);
}

export function shareUrl(primary, compare, radius) {
  const p = buildParams(primary, compare, radius);
  return `${window.location.origin}${window.location.pathname}?${p.toString()}`;
}
