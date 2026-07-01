import { useState } from 'react';
import { Trees, Footprints, TrainFront, Wind, Info, ChevronRight, MapPin, Droplets, Thermometer } from 'lucide-react';
import Sparkline from './Sparkline.jsx';

/** One labelled metric row. */
function Row({ label, value }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <span className="text-[12.5px] text-slate-400">{label}</span>
      <span className="tnum text-[13px] font-semibold text-slate-100">{value}</span>
    </div>
  );
}

/** Collapsible section with an optional drill-down list of contributing POIs. */
function Section({ icon: Icon, title, accent, children, pois, onFocus }) {
  const [open, setOpen] = useState(false);
  const list = (pois || []).slice(0, 12);

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5">
      <div className="mb-1.5 flex items-center gap-2">
        <Icon size={14} style={{ color: accent }} strokeWidth={2.4} />
        <h4 className="text-[12px] font-semibold uppercase tracking-wide text-slate-300">{title}</h4>
        {list.length > 0 && (
          <button
            onClick={() => setOpen((o) => !o)}
            className="ml-auto flex items-center gap-0.5 text-[11px] font-medium text-slate-400 transition hover:text-slate-200"
            aria-expanded={open}
          >
            {open ? 'Hide' : `${list.length} places`}
            <ChevronRight size={13} className={`transition-transform ${open ? 'rotate-90' : ''}`} />
          </button>
        )}
      </div>
      <div className="divide-y divide-white/[0.04]">{children}</div>

      {open && list.length > 0 && (
        <div className="mt-2 space-y-0.5 border-t border-white/[0.05] pt-2">
          {list.map((p) => (
            <button
              key={p.id}
              onClick={() => onFocus?.(p)}
              className="flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-left transition hover:bg-white/[0.05]"
            >
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: p.color }} />
              <span className="min-w-0 flex-1 truncate text-[12px] text-slate-200">{p.name}</span>
              <span className="tnum text-[11px] text-slate-500">{p.dist} m</span>
              <MapPin size={11} className="text-slate-600" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function fmtArea(m2) {
  if (m2 >= 10000) return `${(m2 / 10000).toFixed(1)} ha`;
  return `${m2.toLocaleString()} m²`;
}

export default function Breakdown({ breakdown: b, elements = [], onFocus }) {
  const green = elements.filter((e) => e.group === 'green' && e.category !== 'tree');
  const walk = elements.filter((e) => e.group === 'walk');
  const transit = elements.filter((e) => e.group === 'transit');
  const w = b.weather;

  return (
    <div className="space-y-3">
      <Section icon={Trees} title="Green & blue space" accent="#34d399" pois={green} onFocus={onFocus}>
        <Row label="Green cover (within radius)" value={`${b.greenCoverPct}%`} />
        {b.blueAreaM2 > 0 && <Row label="Water / blue cover" value={`${b.blueCoverPct}%`} />}
        <Row label="Total green area" value={fmtArea(b.greenAreaM2)} />
        <Row label="Parks & gardens" value={b.parkCount} />
        <Row label="Mapped trees" value={b.treeCount} />
      </Section>

      <Section icon={Footprints} title="Walkability" accent="#22d3ee" pois={walk} onFocus={onFocus}>
        <Row label="Pharmacies" value={b.pharmacies} />
        <Row label="Supermarkets" value={b.supermarkets} />
        <Row label="Schools" value={b.schools} />
        <Row label="All amenities nearby" value={b.amenityTotal} />
        <Row label="Essential categories present" value={`${b.diversity} / 3`} />
      </Section>

      <Section icon={TrainFront} title="Transit & connectivity" accent="#f472b6" pois={transit} onFocus={onFocus}>
        <Row label="Stations (rail / metro / bus)" value={b.transitStations} />
        <Row label="All transit stops nearby" value={b.transitTotal} />
      </Section>

      <Section icon={Wind} title="Air quality" accent="#f59e0b">
        {b.pm2_5 != null ? (
          <>
            {b.airTrend?.length > 1 && (
              <div className="flex items-center justify-between gap-3 py-2">
                <span className="text-[12.5px] text-slate-400">PM2.5 · last 24 h</span>
                <Sparkline data={b.airTrend} />
              </div>
            )}
            <Row label="PM2.5" value={`${b.pm2_5} µg/m³`} />
            {b.pm10 != null && <Row label="PM10" value={`${b.pm10} µg/m³`} />}
            {b.no2 != null && <Row label="NO₂" value={`${b.no2} µg/m³`} />}
            {b.o3 != null && <Row label="Ozone" value={`${b.o3} µg/m³`} />}
            {b.usAqi != null && <Row label="US AQI" value={b.usAqi} />}
            <Row label="Category" value={b.aqiCategory} />
          </>
        ) : (
          <div className="flex items-center gap-2 py-1.5 text-[12.5px] text-slate-500">
            <Info size={13} /> Air-quality data unavailable here right now.
          </div>
        )}
      </Section>

      {w && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="chip"><Thermometer size={12} className="text-amber-400" /> {w.temp}°C</span>
          {w.humidity != null && <span className="chip"><Droplets size={12} className="text-cyan-400" /> {w.humidity}% humidity</span>}
          <span className="chip">{w.condition}</span>
          {b.uv != null && <span className="chip">UV {b.uv}</span>}
        </div>
      )}
    </div>
  );
}
