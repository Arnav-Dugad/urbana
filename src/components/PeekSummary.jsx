import { Trees, Footprints, Wind, Sparkles, ChevronUp, Loader2, AlertTriangle } from 'lucide-react';
import { scoreBand } from '../config/tags.js';

/** One tiny score pill for the collapsed mobile peek. */
function Mini({ icon: Icon, value, accent }) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon size={13} style={{ color: accent }} strokeWidth={2.4} />
      <span className="tnum text-[15px] font-700 text-white">{value ?? '—'}</span>
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
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold text-white">{placeName}</p>
          {loading ? (
            <span className="mt-0.5 flex items-center gap-1.5 text-[12px] text-slate-400">
              <Loader2 size={12} className="animate-spin" /> Analysing 1 km radius…
            </span>
          ) : error ? (
            <span className="mt-0.5 flex items-center gap-1.5 text-[12px] text-amber-400">
              <AlertTriangle size={12} /> Tap to retry
            </span>
          ) : data ? (
            <span className="mt-0.5 text-[12px] text-slate-400">
              Livability <span className="tnum font-semibold text-livable">{data.livabilityScore}</span> · {band.label}
            </span>
          ) : null}
        </div>

        {data && !loading && (
          <div className="flex items-center gap-3.5">
            <Mini icon={Trees} value={data.greeneryScore} accent="#34d399" />
            <Mini icon={Footprints} value={data.walkabilityScore} accent="#22d3ee" />
            <Mini icon={Wind} value={data.airQualityScore} accent="#f59e0b" />
            <Mini icon={Sparkles} value={data.livabilityScore} accent="#a78bfa" />
          </div>
        )}

        <ChevronUp size={18} className="shrink-0 text-slate-500" />
      </div>
    </button>
  );
}
