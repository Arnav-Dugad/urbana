/**
 * Reads/writes the analysed location (and optional compare pin) in the URL
 * query string so every view is shareable, bookmarkable, and survives reload.
 * Format: ?lat=..&lon=..&name=..&clat=..&clon=..
 */
import { roundCoord } from '../lib/geo.js';

export function readLocationFromUrl() {
  const p = new URLSearchParams(window.location.search);
  const lat = parseFloat(p.get('lat'));
  const lon = parseFloat(p.get('lon'));
  if (Number.isNaN(lat) || Number.isNaN(lon)) return null;

  const result = { primary: { lat, lon, name: p.get('name') || null } };
  const clat = parseFloat(p.get('clat'));
  const clon = parseFloat(p.get('clon'));
  if (!Number.isNaN(clat) && !Number.isNaN(clon)) {
    result.compare = { lat: clat, lon: clon, name: p.get('cname') || null };
  }
  return result;
}

export function writeLocationToUrl(primary, compare) {
  const p = new URLSearchParams();
  p.set('lat', roundCoord(primary.lat));
  p.set('lon', roundCoord(primary.lon));
  if (primary.name) p.set('name', primary.name);
  if (compare) {
    p.set('clat', roundCoord(compare.lat));
    p.set('clon', roundCoord(compare.lon));
    if (compare.name) p.set('cname', compare.name);
  }
  const url = `${window.location.pathname}?${p.toString()}`;
  window.history.replaceState(null, '', url);
}

export function shareUrl(primary, compare) {
  const p = new URLSearchParams();
  p.set('lat', roundCoord(primary.lat));
  p.set('lon', roundCoord(primary.lon));
  if (primary.name) p.set('name', primary.name);
  if (compare) {
    p.set('clat', roundCoord(compare.lat));
    p.set('clon', roundCoord(compare.lon));
    if (compare.name) p.set('cname', compare.name);
  }
  return `${window.location.origin}${window.location.pathname}?${p.toString()}`;
}
