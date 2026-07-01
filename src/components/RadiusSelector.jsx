import { RADIUS_OPTIONS } from '../config/tags.js';

const fmt = (m) => (m >= 1000 ? `${m / 1000} km` : `${m} m`);

/** Segmented control to pick the analysis radius. */
export default function RadiusSelector({ value, onChange }) {
  return (
    <div className="inline-flex items-center rounded-lg border border-white/10 bg-white/[0.03] p-0.5">
      {RADIUS_OPTIONS.map((m) => (
        <button
          key={m}
          onClick={() => onChange(m)}
          aria-pressed={value === m}
          className={`rounded-md px-2.5 py-1 text-[12px] font-semibold tabular-nums transition ${
            value === m ? 'bg-white/[0.1] text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {fmt(m)}
        </button>
      ))}
    </div>
  );
}
