import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toPng } from 'html-to-image';
import { X, Download, Loader2 } from 'lucide-react';
import { PILLARS, scoreBand } from '../config/tags.js';

/** A designed, shareable score card exported to PNG via html-to-image. */
export default function ReportCard({ open, onClose, data, placeName }) {
  const cardRef = useRef(null);
  const [busy, setBusy] = useState(false);

  const download = async () => {
    if (!cardRef.current) return;
    setBusy(true);
    try {
      const url = await toPng(cardRef.current, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: '#0B0F14',
      });
      const a = document.createElement('a');
      a.download = `urbana-${(placeName || 'location').replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.png`;
      a.href = url;
      a.click();
    } catch {
      /* export failed — leave the modal open so the user can retry */
    } finally {
      setBusy(false);
    }
  };

  const pillarValues = data
    ? {
        greenery: data.greeneryScore,
        walkability: data.walkabilityScore,
        transit: data.transitScore,
        air: data.airQualityScore,
      }
    : {};
  const band = data ? scoreBand(data.livabilityScore) : null;

  return (
    <AnimatePresence>
      {open && data && (
        <motion.div
          className="fixed inset-0 z-[2000] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ y: 20, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="relative z-10 w-full max-w-[380px]"
          >
            {/* The exported card */}
            <div
              ref={cardRef}
              className="overflow-hidden rounded-2xl border border-white/10 p-6"
              style={{
                background:
                  'radial-gradient(600px 400px at 85% -10%, rgba(52,211,153,0.16), transparent 60%), radial-gradient(500px 350px at 0% 110%, rgba(244,114,182,0.12), transparent 55%), #0B0F14',
              }}
            >
              <div className="flex items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 32 32">
                  <circle cx="16" cy="16" r="9" fill="none" stroke="#34d399" strokeWidth="2.4" />
                  <circle cx="16" cy="16" r="3.4" fill="#34d399" />
                </svg>
                <span className="font-display text-[15px] font-800 text-white">Urbana</span>
                <span className="ml-auto text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                  Livability report
                </span>
              </div>

              <h3 className="mt-4 font-display text-[19px] font-700 leading-tight text-white">{placeName}</h3>
              <p className="text-[11px] text-slate-500">Within {(data.radius / 1000).toFixed(data.radius % 1000 ? 1 : 0)} km · © OpenStreetMap · Open-Meteo</p>

              <div className="mt-4 flex items-end gap-3 rounded-xl border border-white/[0.07] bg-white/[0.03] p-4">
                <span className="tnum font-display text-[52px] font-800 leading-none text-white">
                  {data.livabilityScore}
                </span>
                <div className="pb-1">
                  <div className="text-[15px] font-700 text-livable">{band.label}</div>
                  <div className="text-[11px] text-slate-400">Livability index</div>
                </div>
              </div>

              <div className="mt-4 space-y-2.5">
                {PILLARS.map((p) => {
                  const v = pillarValues[p.key];
                  return (
                    <div key={p.key} className="flex items-center gap-2.5">
                      <span className="w-20 text-[12px] font-medium text-slate-300">{p.label}</span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${v ?? 0}%`, background: p.color }}
                        />
                      </div>
                      <span className="tnum w-7 text-right text-[13px] font-700 text-white">
                        {v ?? '—'}
                      </span>
                    </div>
                  );
                })}
              </div>

              <p className="mt-4 text-center text-[10px] text-slate-600">urbana-cyan.vercel.app</p>
            </div>

            {/* Controls (not part of the export) */}
            <div className="mt-3 flex gap-2">
              <button
                onClick={download}
                disabled={busy}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-livable/90 py-2.5 text-[13px] font-semibold text-ink-950 transition hover:bg-livable disabled:opacity-60"
              >
                {busy ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
                Download PNG
              </button>
              <button
                onClick={onClose}
                className="rounded-xl border border-white/10 bg-white/[0.04] px-3 text-slate-300 transition hover:bg-white/[0.08]"
                aria-label="Close"
              >
                <X size={17} />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
