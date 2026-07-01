import { useCallback, useEffect, useMemo, useState } from 'react';
import Header from './components/Header.jsx';
import SearchBar from './components/SearchBar.jsx';
import MapView from './components/MapView.jsx';
import ScorePanel from './components/ScorePanel.jsx';
import Legend from './components/Legend.jsx';
import CompareDrawer from './components/CompareDrawer.jsx';
import useUrbanAnalysis from './hooks/useUrbanAnalysis.js';
import { reverseGeocode } from './lib/geocode.js';
import { DEFAULT_LOCATION } from './config/tags.js';
import { readLocationFromUrl, writeLocationToUrl, shareUrl } from './utils/url.js';

// Set this to your GitHub repo to show the source link in the header.
const REPO_URL = '';

export default function App() {
  // Seed from URL if present, else the default India view.
  const initial = useMemo(() => readLocationFromUrl(), []);
  const [location, setLocation] = useState(initial?.primary || DEFAULT_LOCATION);
  const [compare, setCompare] = useState(initial?.compare || null);
  const [compareOpen, setCompareOpen] = useState(Boolean(initial?.compare));

  const primary = useUrbanAnalysis(location.lat, location.lon);
  const secondary = useUrbanAnalysis(compare?.lat ?? null, compare?.lon ?? null);

  // Keep the URL in sync so the view is always shareable.
  useEffect(() => {
    writeLocationToUrl(location, compare);
  }, [location, compare]);

  // Reverse-geocode any location that arrived without a name (map clicks, GPS).
  useEffect(() => {
    if (location.name) return;
    const ctrl = new AbortController();
    reverseGeocode(location.lat, location.lon, ctrl.signal)
      .then((name) => name && setLocation((l) => ({ ...l, name })))
      .catch(() => {});
    return () => ctrl.abort();
  }, [location.lat, location.lon, location.name]);

  useEffect(() => {
    if (!compare || compare.name) return;
    const ctrl = new AbortController();
    reverseGeocode(compare.lat, compare.lon, ctrl.signal)
      .then((name) => name && setCompare((c) => (c ? { ...c, name } : c)))
      .catch(() => {});
    return () => ctrl.abort();
  }, [compare]);

  const handleSelect = useCallback((place) => {
    setLocation({ lat: place.lat, lon: place.lon, name: place.name });
  }, []);

  const handlePick = useCallback((lat, lon) => {
    setLocation({ lat, lon, name: null });
  }, []);

  const handlePickCompare = useCallback((lat, lon) => {
    setCompare({ lat, lon, name: null });
  }, []);

  const toggleCompare = useCallback(() => {
    setCompareOpen((o) => {
      const next = !o;
      if (!next) {
        setCompare(null);
      }
      return next;
    });
  }, []);

  const placeName =
    location.name || `${location.lat.toFixed(4)}, ${location.lon.toFixed(4)}`;

  const link = shareUrl(location, compare);

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Map fills the screen */}
      <div className="absolute inset-0 z-0">
        <MapView
          location={location}
          compare={compare}
          elements={primary.data?.elements || []}
          onPick={handlePick}
          onPickCompare={handlePickCompare}
          compareMode={compareOpen}
        />
      </div>

      {/* Overlay UI — the grid itself ignores pointer events; children opt in */}
      <div className="pointer-events-none absolute inset-0 z-[1000] flex flex-col">
        {/* Top bar */}
        <div className="flex flex-wrap items-center gap-3 p-3 sm:p-4">
          <div className="glass pointer-events-auto rounded-xl px-3 py-2">
            <Header repoUrl={REPO_URL} />
          </div>
          <div className="pointer-events-auto w-full max-w-md flex-1 sm:w-auto">
            <SearchBar onSelect={handleSelect} />
          </div>
          {compareOpen && (
            <span className="pointer-events-auto chip border-livable/30 bg-livable/10 text-livable">
              Compare mode · click the map to pick point B
            </span>
          )}
        </div>

        {/* Middle region: legend (bottom-left) + compare drawer sit above the map */}
        <div className="flex flex-1 items-end justify-start gap-3 p-3 sm:p-4">
          <div className="hidden pointer-events-auto sm:block">
            <Legend />
          </div>
          <div className="pointer-events-auto ml-auto">
            <CompareDrawer
              open={compareOpen}
              primary={{ name: placeName, data: primary.data }}
              secondary={compare ? { name: compare.name, data: secondary.data, loading: secondary.loading } : null}
              onClose={toggleCompare}
              onClear={() => setCompare(null)}
            />
          </div>
        </div>
      </div>

      {/* Score panel — right rail on desktop, bottom sheet on mobile */}
      <div
        className="glass-strong pointer-events-auto absolute z-[1100] flex flex-col overflow-hidden
                   inset-x-0 bottom-0 max-h-[62vh] rounded-t-2xl p-4
                   sm:inset-x-auto sm:right-4 sm:top-[4.75rem] sm:bottom-4 sm:max-h-none sm:w-[384px] sm:rounded-2xl sm:p-5"
      >
        <ScorePanel
          data={primary.data}
          loading={primary.loading}
          error={primary.error}
          onRetry={primary.refetch}
          placeName={placeName}
          onCompare={toggleCompare}
          comparing={compareOpen}
          shareUrl={link}
        />
      </div>
    </div>
  );
}
