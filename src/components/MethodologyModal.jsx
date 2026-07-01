import { motion, AnimatePresence } from 'framer-motion';
import { X, Info } from 'lucide-react';
import { METHODOLOGY, PILLARS } from '../config/tags.js';

const colorFor = (pillar) => PILLARS.find((p) => p.label === pillar)?.color || '#a78bfa';

/** "How scores work" modal — transparent, trust-building methodology. */
export default function MethodologyModal({ open, onClose }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[2000] flex items-end justify-center sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ y: 24, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="glass-strong scroll-thin relative z-10 max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-2xl p-5 sm:rounded-2xl"
            role="dialog"
            aria-modal="true"
            aria-label="How Urbana scores work"
          >
            <div className="mb-4 flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-livable/15">
                  <Info size={17} className="text-livable" />
                </div>
                <div>
                  <h2 className="font-display text-[17px] font-700 text-white">How scores work</h2>
                  <p className="text-[12px] text-slate-400">Transparent, open-data methodology</p>
                </div>
              </div>
              <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-white/[0.06] hover:text-white" aria-label="Close">
                <X size={17} />
              </button>
            </div>

            <p className="mb-4 text-[13px] leading-relaxed text-slate-300">
              Every location is analysed within the chosen radius. Four pillars are each scored 0–100
              and blended into an overall <span className="font-semibold text-livable">Livability</span> index
              (weights below; any pillar without data is dropped and the rest are re-weighted).
            </p>

            <div className="space-y-2.5">
              {METHODOLOGY.map((m) => (
                <div key={m.pillar} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-2 text-[13.5px] font-semibold text-white">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: colorFor(m.pillar) }} />
                      {m.pillar}
                    </span>
                    <span className="chip tnum">{m.weight}</span>
                  </div>
                  <p className="text-[12.5px] leading-relaxed text-slate-400">{m.how}</p>
                </div>
              ))}
            </div>

            <p className="mt-4 text-[11px] leading-relaxed text-slate-500">
              Data © OpenStreetMap contributors (via Overpass) · air quality &amp; weather © Open-Meteo ·
              geocoding © Nominatim. Scores are model estimates from open data and depend on local mapping
              completeness — treat them as directional, not authoritative.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
