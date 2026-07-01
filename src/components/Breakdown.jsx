import { Trees, Footprints, Wind, Info } from 'lucide-react';

/** One labelled metric row. */
function Row({ label, value, hint }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <span className="text-[12.5px] text-slate-400">{label}</span>
      <span className="tnum text-[13px] font-semibold text-slate-100">{value}</span>
      {hint && <span className="sr-only">{hint}</span>}
    </div>
  );
}

function Section({ icon: Icon, title, accent, children }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5">
      <div className="mb-1.5 flex items-center gap-2">
        <Icon size={14} style={{ color: accent }} strokeWidth={2.4} />
        <h4 className="text-[12px] font-semibold uppercase tracking-wide text-slate-300">{title}</h4>
      </div>
      <div className="divide-y divide-white/[0.04]">{children}</div>
    </div>
  );
}

/** Formats an area in m² as m² or ha for readability. */
function fmtArea(m2) {
  if (m2 >= 10000) return `${(m2 / 10000).toFixed(1)} ha`;
  return `${m2.toLocaleString()} m²`;
}

export default function Breakdown({ breakdown: b }) {
  return (
    <div className="space-y-3">
      <Section icon={Trees} title="Green space" accent="#34d399">
        <Row label="Green cover (within 1 km)" value={`${b.greenCoverPct}%`} />
        <Row label="Total green area" value={fmtArea(b.greenAreaM2)} />
        <Row label="Parks & gardens" value={b.parkCount} />
        <Row label="Mapped trees" value={b.treeCount} />
      </Section>

      <Section icon={Footprints} title="Walkability" accent="#22d3ee">
        <Row label="Pharmacies" value={b.pharmacies} />
        <Row label="Supermarkets" value={b.supermarkets} />
        <Row label="Schools" value={b.schools} />
        <Row label="All amenities nearby" value={b.amenityTotal} />
        <Row label="Essential categories present" value={`${b.diversity} / 3`} />
      </Section>

      <Section icon={Wind} title="Air quality" accent="#f59e0b">
        {b.pm2_5 != null ? (
          <>
            <Row label="PM2.5" value={`${b.pm2_5} µg/m³`} />
            <Row label="Category" value={b.aqiCategory} />
          </>
        ) : (
          <div className="flex items-center gap-2 py-1.5 text-[12.5px] text-slate-500">
            <Info size={13} /> Air-quality data unavailable here right now.
          </div>
        )}
      </Section>
    </div>
  );
}
