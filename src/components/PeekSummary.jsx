import { Trees, Footprints, TrainFront, Wind, ChevronUp, Loader2, AlertTriangle } from 'lucide-react';
import { scoreBand } from '../config/tags.js';

/** One tiny score pill for the collapsed mobile peek. */
function Mini({ icon: Icon, value, accent, label }) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon size={13} style={{ color: accent }} strokeWidth={2.4} />
      <span className="tnum text-[15px] font-700 text-white">{value ?? '—'}</span>
      <span className="hidden text-[11px] text-slate-500 min-[380px]:inline">{label}</span>
    </div>
  );
}

/**
 * The always-visible strip shown when the mobile bottom sheet is collapsed:
 * enough signal to be useful (place + livability + the three metrics) with a
 * clear affordance to expand. Tapping anywhere on it opens the full panel.
 */
export default function PeekSummary({ data, loading, error, placeName, onExpand }) {
  const band = data ? scoreBand(data.livabilityScore) : null;

  return (
    <button onClick={onExpand} className="w-full text-left">
      <div className="flex items-center gap-2.5">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold text-white">{placeName}</p>
          {loading ? (
            <span className="mt-0.5 flex items-center gap-1.5 text-[12px] text-slate-400">
              <Loader2 size={12} className="animate-spin" /> Analysing…
            </span>
          ) : error ? (
            <span className="mt-0.5 flex items-center gap-1.5 text-[12px] text-amber-400">
              <AlertTriangle size={12} /> Tap to retry
            </span>
          ) : data ? (
            <span className="mt-0.5 block truncate text-[12px] text-slate-400">
              Livability <span className="tnum font-semibold text-livable">{data.livabilityScore}</span> · {band.label}
            </span>
          ) : null}
        </div>
        <ChevronUp size={17} className="shrink-0 text-slate-500" />
      </div>

      {data && !loading && (
        <div className="mt-2.5 flex items-center justify-between border-t border-white/[0.06] pt-2.5">
          <Mini icon={Trees} value={data.greeneryScore} accent="#34d399" label="Green" />
          <Mini icon={Footprints} value={data.walkabilityScore} accent="#22d3ee" label="Walk" />
          <Mini icon={TrainFront} value={data.transitScore} accent="#f472b6" label="Transit" />
          <Mini icon={Wind} value={data.airQualityScore} accent="#f59e0b" label="Air" />
        </div>
      )}
    </button>
  );
}
