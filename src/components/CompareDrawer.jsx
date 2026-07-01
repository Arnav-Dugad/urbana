import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPinned, Trees, Footprints, Wind, Sparkles, ArrowRight } from 'lucide-react';

/** A single comparison row with A / delta / B. */
function CompareRow({ icon: Icon, label, a, b, accent, unit = '' }) {
  const has = a != null && b != null;
  const delta = has ? b - a : null;
  const deltaColor = delta > 0 ? 'text-greenery' : delta < 0 ? 'text-rose-400' : 'text-slate-500';
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 py-2.5">
      <div className="tnum text-right text-lg font-700 text-white">{a ?? '—'}<span className="text-xs text-slate-500">{unit}</span></div>
      <div className="flex flex-col items-center">
        <Icon size={15} style={{ color: accent }} strokeWidth={2.3} />
        <span className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</span>
        {has && delta !== 0 && (
          <span className={`tnum mt-0.5 text-[11px] font-semibold ${deltaColor}`}>
            {delta > 0 ? '+' : ''}{delta}
          </span>
        )}
      </div>
      <div className="tnum text-left text-lg font-700 text-white">{b ?? '—'}<span className="text-xs text-slate-500">{unit}</span></div>
    </div>
  );
}

export default function CompareDrawer({ open, primary, secondary, onClose, onClear }) {
  const a = primary?.data;
  const b = secondary?.data;
  const waiting = !b && !secondary?.loading;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ type: 'spring', stiffness: 320, damping: 30 }}
          className="glass-strong pointer-events-auto w-[min(92vw,420px)] rounded-2xl p-4"
        >
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-livable/15">
                <MapPinned size={16} className="text-livable" />
              </div>
              <h3 className="font-display text-[15px] font-700 text-white">Compare locations</h3>
            </div>
            <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-white/[0.06] hover:text-white">
              <X size={16} />
            </button>
          </div>

          {/* Location labels */}
          <div className="mb-2 grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-center">
            <div className="min-w-0">
              <span className="inline-block h-2 w-2 rounded-full bg-livable align-middle" />
              <span className="ml-1.5 truncate text-[12px] font-medium text-slate-300 align-middle">
                {primary?.name || 'Location A'}
              </span>
            </div>
            <ArrowRight size={14} className="text-slate-600" />
            <div className="min-w-0">
              <span className="inline-block h-2 w-2 rounded-full bg-air align-middle" />
              <span className="ml-1.5 truncate text-[12px] font-medium text-slate-300 align-middle">
                {secondary?.name || 'Location B'}
              </span>
            </div>
          </div>

          {waiting ? (
            <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-6 text-center">
              <p className="text-[13px] font-medium text-slate-200">Pick a second location</p>
              <p className="mt-1 text-[12px] text-slate-500">
                Click anywhere on the map to drop a comparison point.
              </p>
            </div>
          ) : secondary?.loading ? (
            <div className="px-4 py-6 text-center text-[13px] text-slate-400">Analysing location B…</div>
          ) : (
            <div className="divide-y divide-white/[0.05] rounded-xl border border-white/[0.06] bg-white/[0.02] px-4">
              <CompareRow icon={Sparkles} label="Livability" accent="#a78bfa" a={a?.livabilityScore} b={b?.livabilityScore} />
              <CompareRow icon={Trees} label="Greenery" accent="#34d399" a={a?.greeneryScore} b={b?.greeneryScore} />
              <CompareRow icon={Footprints} label="Walkability" accent="#22d3ee" a={a?.walkabilityScore} b={b?.walkabilityScore} />
              <CompareRow icon={Wind} label="Air" accent="#f59e0b" a={a?.airQualityScore} b={b?.airQualityScore} />
            </div>
          )}

          {secondary && (
            <button
              onClick={onClear}
              className="mt-3 w-full rounded-lg border border-white/10 bg-white/[0.03] py-2 text-[12.5px] font-medium text-slate-300 transition hover:bg-white/[0.07]"
            >
              Clear comparison point
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
