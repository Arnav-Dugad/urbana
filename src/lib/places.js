/**
 * Saved places + recent searches, persisted in localStorage. Small, dependency-
 * free store with a pub/sub so React components can subscribe to changes.
 */
const SAVED_KEY = 'urbana:saved';
const RECENT_KEY = 'urbana:recent';
const MAX_RECENT = 6;

const listeners = new Set();
const emit = () => listeners.forEach((fn) => fn());

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function read(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
function write(key, arr) {
  try {
    localStorage.setItem(key, JSON.stringify(arr));
  } catch {
    /* ignore */
  }
  emit();
}

const idOf = (p) => `${p.lat.toFixed(4)},${p.lon.toFixed(4)}`;

// ---- saved ----
export function getSaved() {
  return read(SAVED_KEY);
}
export function isSaved(lat, lon) {
  const id = `${lat.toFixed(4)},${lon.toFixed(4)}`;
  return read(SAVED_KEY).some((p) => idOf(p) === id);
}
export function toggleSaved(place) {
  const list = read(SAVED_KEY);
  const id = idOf(place);
  const idx = list.findIndex((p) => idOf(p) === id);
  if (idx >= 0) list.splice(idx, 1);
  else list.unshift({ lat: place.lat, lon: place.lon, name: place.name || id });
  write(SAVED_KEY, list.slice(0, 20));
  return idx < 0; // true if now saved
}

// ---- recents ----
export function getRecent() {
  return read(RECENT_KEY);
}
export function pushRecent(place) {
  if (!place?.name) return; // only track named/geocoded picks
  const list = read(RECENT_KEY).filter((p) => idOf(p) !== idOf(place));
  list.unshift({ lat: place.lat, lon: place.lon, name: place.name });
  write(RECENT_KEY, list.slice(0, MAX_RECENT));
}
