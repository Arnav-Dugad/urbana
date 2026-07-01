import { useEffect, useRef, useState } from 'react';
import { Search, MapPin, LocateFixed, Loader2, X } from 'lucide-react';
import useDebounce from '../hooks/useDebounce.js';
import { searchPlaces } from '../lib/geocode.js';
import { PRESETS } from '../config/tags.js';

export default function SearchBar({ onSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [active, setActive] = useState(-1);
  const boxRef = useRef(null);
  const debounced = useDebounce(query, 350);

  // Fetch suggestions when the debounced query changes.
  useEffect(() => {
    const q = debounced.trim();
    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    const ctrl = new AbortController();
    setLoading(true);
    searchPlaces(q, ctrl.signal)
      .then((r) => {
        setResults(r);
        setActive(-1);
      })
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [debounced]);

  // Close on outside click.
  useEffect(() => {
    const onClick = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const choose = (place) => {
    onSelect({ lat: place.lat, lon: place.lon, name: place.short || place.name });
    setQuery(place.short || place.name.split(',').slice(0, 2).join(','));
    setOpen(false);
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        setOpen(false);
        setQuery('');
        onSelect({ lat: pos.coords.latitude, lon: pos.coords.longitude, name: null });
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const onKeyDown = (e) => {
    if (!open) return;
    const list = results.length ? results : [];
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, list.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter' && active >= 0 && list[active]) {
      choose(list[active]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const showPresets = open && query.trim().length < 2;

  return (
    <div ref={boxRef} className="relative w-full">
      <div className="glass-strong flex items-center gap-2 rounded-xl px-3.5 py-2.5">
        <Search size={17} className="shrink-0 text-slate-400" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search a city, neighbourhood or address…"
          className="w-full bg-transparent text-[14px] text-slate-100 placeholder:text-slate-500 focus:outline-none"
          aria-label="Search location"
        />
        {query && (
          <button onClick={() => { setQuery(''); setResults([]); }} className="text-slate-500 hover:text-slate-300">
            <X size={15} />
          </button>
        )}
        <div className="mx-0.5 h-5 w-px bg-white/10" />
        <button
          onClick={useMyLocation}
          title="Use my location"
          className="flex shrink-0 items-center gap-1.5 rounded-lg px-1.5 py-1 text-slate-300 transition hover:text-white"
        >
          {locating ? <Loader2 size={16} className="animate-spin" /> : <LocateFixed size={16} />}
        </button>
      </div>

      {open && (query.trim().length >= 2 || showPresets) && (
        <div className="glass-strong absolute z-[1200] mt-2 w-full overflow-hidden rounded-xl">
          {loading && (
            <div className="flex items-center gap-2 px-3.5 py-3 text-[13px] text-slate-400">
              <Loader2 size={14} className="animate-spin" /> Searching…
            </div>
          )}

          {showPresets && (
            <div className="p-1.5">
              <p className="px-2.5 py-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-slate-500">
                Try a place in India
              </p>
              {PRESETS.map((p) => (
                <button
                  key={p.name}
                  onClick={() => choose({ ...p, short: p.name })}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] text-slate-200 transition hover:bg-white/[0.06]"
                >
                  <MapPin size={14} className="text-greenery" />
                  {p.name}
                </button>
              ))}
            </div>
          )}

          {!loading && !showPresets && results.length === 0 && (
            <div className="px-3.5 py-3 text-[13px] text-slate-400">No matches found.</div>
          )}

          {!showPresets && results.length > 0 && (
            <div className="max-h-72 overflow-y-auto scroll-thin p-1.5">
              {results.map((r, i) => (
                <button
                  key={r.id}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => choose(r)}
                  className={`flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left transition ${
                    active === i ? 'bg-white/[0.08]' : 'hover:bg-white/[0.05]'
                  }`}
                >
                  <MapPin size={14} className="mt-0.5 shrink-0 text-walk" />
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-medium text-slate-100">{r.short}</span>
                    <span className="block truncate text-[11.5px] text-slate-500">{r.name}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
