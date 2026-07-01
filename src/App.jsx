import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import Header from './components/Header.jsx';
import SearchBar from './components/SearchBar.jsx';
import MapView from './components/MapView.jsx';
import ScorePanel from './components/ScorePanel.jsx';
import PeekSummary from './components/PeekSummary.jsx';
import Legend from './components/Legend.jsx';
import CompareDrawer from './components/CompareDrawer.jsx';
import RadiusSelector from './components/RadiusSelector.jsx';
import LayerControl from './components/LayerControl.jsx';
import MethodologyModal from './components/MethodologyModal.jsx';
import ReportCard from './components/ReportCard.jsx';
import useUrbanAnalysis from './hooks/useUrbanAnalysis.js';
import useMediaQuery from './hooks/useMediaQuery.js';
import { reverseGeocode } from './lib/geocode.js';
import { DEFAULT_LOCATION, ANALYSIS_RADIUS_M } from './config/tags.js';
import { readLocationFromUrl, writeLocationToUrl, shareUrl } from './utils/url.js';
import { isSaved, toggleSaved, pushRecent, subscribe } from './lib/places.js';

// Set this to your GitHub repo to show the source link in the header.
const REPO_URL = 'https://github.com/Arnav-Dugad/urbana';

export default function App() {
  const initial = useMemo(() => readLocationFromUrl(), []);
  const [location, setLocation] = useState(initial?.primary || DEFAULT_LOCATION);
  const [compare, setCompare] = useState(initial?.compare || null);
  const [compareOpen, setCompareOpen] = useState(Boolean(initial?.compare));
  const [radius, setRadius] = useState(initial?.radius || ANALYSIS_RADIUS_M);

  const isDesktop = useMediaQuery('(min-width: 640px)');
  const [sheetOpen, setSheetOpen] = useState(false);

  const [visible, setVisible] = useState({ green: true, walk: true, transit: true, heatmap: false });
  const [focusedElement, setFocusedElement] = useState(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [methodologyOpen, setMethodologyOpen] = useState(false);
  const [savedFlag, setSavedFlag] = useState(false);

  const primary = useUrbanAnalysis(location.lat, location.lon, radius);
  const secondary = useUrbanAnalysis(compare?.lat ?? null, compare?.lon ?? null, radius);

  // Keep the URL shareable (includes radius + compare).
  useEffect(() => {
    writeLocationToUrl(location, compare, radius);
  }, [location, compare, radius]);

  // Track whether the current location is saved.
  useEffect(() => {
    const refresh = () => setSavedFlag(isSaved(location.lat, location.lon));
    refresh();
    return subscribe(refresh);
  }, [location.lat, location.lon]);

  // Reverse-geocode locations that arrived without a name (map clicks, GPS).
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
    const next = { lat: place.lat, lon: place.lon, name: place.name };
    setLocation(next);
    pushRecent(next);
    setFocusedElement(null);
  }, []);

  const handlePick = useCallback(
    (lat, lon) => {
      setLocation({ lat, lon, name: null });
      setFocusedElement(null);
      if (!isDesktop) setSheetOpen(true);
    },
    [isDesktop]
  );

  const handlePickCompare = useCallback((lat, lon) => {
    setCompare({ lat, lon, name: null });
  }, []);

  const toggleCompare = useCallback(() => {
    setCompareOpen((o) => {
      const next = !o;
      if (!next) setCompare(null);
      return next;
    });
  }, []);

  const toggleLayer = useCallback((key) => {
    setVisible((v) => ({ ...v, [key]: !v[key] }));
  }, []);

  const placeName = location.name || `${location.lat.toFixed(4)}, ${location.lon.toFixed(4)}`;

  const link = shareUrl(location, compare, radius);

  const panelProps = {
    data: primary.data,
    loading: primary.loading,
    error: primary.error,
    onRetry: primary.refetch,
    placeName,
    onCompare: toggleCompare,
    comparing: compareOpen,
    compareData: compareOpen ? secondary.data : null,
    shareUrl: link,
    saved: savedFlag,
    onToggleSave: () => toggleSaved({ lat: location.lat, lon: location.lon, name: placeName }),
    onOpenReport: () => setReportOpen(true),
    onOpenMethodology: () => setMethodologyOpen(true),
    onFocus: setFocusedElement,
  };

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Map */}
      <div className="absolute inset-0 z-0">
        <MapView
          location={{ ...location, radius }}
          compare={compare}
          elements={primary.data?.elements || []}
          onPick={handlePick}
          onPickCompare={handlePickCompare}
          compareMode={compareOpen}
          visible={visible}
          focusedElement={focusedElement}
        />
      </div>

      {/* Overlay UI */}
      <div className="pointer-events-none absolute inset-0 z-[1000] flex flex-col">
        {/* Top bar */}
        <div className="flex flex-wrap items-center gap-2.5 p-2.5 sm:gap-3 sm:p-4">
          <div className="glass pointer-events-auto rounded-xl px-3 py-2">
            <Header repoUrl={REPO_URL} />
          </div>
          <div className="pointer-events-auto min-w-0 flex-1 sm:max-w-md">
            <SearchBar onSelect={handleSelect} />
          </div>
          {compareOpen && (
            <span className="pointer-events-auto chip w-full justify-center border-livable/30 bg-livable/10 text-livable sm:w-auto">
              Compare mode · tap the map to pick point B
            </span>
          )}
        </div>

        {/* Controls row: radius + layers */}
        <div className="flex flex-wrap items-center gap-2.5 px-2.5 sm:px-4">
          <div className="glass pointer-events-auto flex items-center gap-2 rounded-xl px-2.5 py-1.5">
            <span className="hidden text-[11px] font-semibold uppercase tracking-wide text-slate-500 sm:inline">
              Radius
            </span>
            <RadiusSelector value={radius} onChange={setRadius} />
          </div>
          <LayerControl visible={visible} onToggle={toggleLayer} />
        </div>

        {/* Middle: legend */}
        <div className="flex flex-1 items-end justify-start gap-3 overflow-hidden p-3 sm:p-4">
          <div className="hidden pointer-events-auto sm:block">
            <Legend />
          </div>
        </div>
      </div>

      {/* Compare drawer — own layer above score panel and bottom sheet */}
      <div className="pointer-events-none absolute inset-0 z-[1200]">
        <div className="absolute bottom-[5.5rem] left-3 max-w-[calc(100vw-1.5rem)] pointer-events-auto sm:bottom-6 sm:left-4 sm:max-w-[420px]">
          <CompareDrawer
            open={compareOpen}
            primary={{ name: placeName, data: primary.data }}
            secondary={compare ? { name: compare.name, data: secondary.data, loading: secondary.loading } : null}
            onClose={toggleCompare}
            onClear={() => setCompare(null)}
          />
        </div>
      </div>

      {/* Score panel — desktop right rail / mobile bottom sheet */}
      {isDesktop ? (
        <div className="glass-strong pointer-events-auto absolute right-4 top-[4.75rem] bottom-4 z-[1100] flex w-[384px] flex-col overflow-hidden rounded-2xl p-5">
          <ScorePanel {...panelProps} />
        </div>
      ) : (
        <div
          className={`glass-strong pointer-events-auto absolute inset-x-0 bottom-0 z-[1100] flex flex-col overflow-hidden rounded-t-2xl transition-[height] duration-300 ease-out ${
            sheetOpen ? 'h-[82vh]' : 'h-auto'
          }`}
        >
          <button
            onClick={() => setSheetOpen((o) => !o)}
            className="flex w-full flex-col items-center pt-2"
            aria-label={sheetOpen ? 'Collapse panel' : 'Expand panel'}
          >
            <span className="h-1.5 w-10 rounded-full bg-white/20" />
          </button>

          {sheetOpen ? (
            <>
              <div className="flex justify-end px-3 pt-1">
                <button
                  onClick={() => setSheetOpen(false)}
                  className="flex items-center gap-1 rounded-lg px-2 py-1 text-[12px] text-slate-400"
                >
                  <ChevronDown size={15} /> Collapse
                </button>
              </div>
              <div className="min-h-0 flex-1 px-4 pb-4">
                <ScorePanel {...panelProps} />
              </div>
            </>
          ) : (
            <div className="px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-2">
              <PeekSummary
                data={primary.data}
                loading={primary.loading}
                error={primary.error}
                placeName={placeName}
                onExpand={() => setSheetOpen(true)}
              />
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <MethodologyModal open={methodologyOpen} onClose={() => setMethodologyOpen(false)} />
      <ReportCard open={reportOpen} onClose={() => setReportOpen(false)} data={primary.data} placeName={placeName} />
    </div>
  );
}
