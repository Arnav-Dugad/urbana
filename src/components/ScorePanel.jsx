import { motion } from 'framer-motion';
import { Trees, Footprints, Wind, Sparkles, RefreshCw, AlertTriangle, GitCompareArrows, Share2, Check } from 'lucide-react';
import { useState } from 'react';
import ScoreGauge from './ScoreGauge.jsx';
import Breakdown from './Breakdown.jsx';
import SkeletonPanel from './SkeletonPanel.jsx';
import { scoreBand } from '../config/tags.js';

function ErrorState({ error, onRetry }) {
  return (
    <div className="animate-fade-up flex flex-col items-center py-10 text-center">
      <div className="mb-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3">
        <AlertTriangle size={22} className="text-amber-400" />
      </div>
      <h3 className="text-sm font-semibold text-slate-100">Couldn’t complete the analysis</h3>
      <p className="mt-1.5 max-w-[15rem] text-[12.5px] leading-relaxed text-slate-400">
        {error?.message || 'Something went wrong reaching the data service.'}
      </p>
      <button
        onClick={onRetry}
        className="mt-5 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-[13px] font-medium text-slate-200 transition hover:bg-white/[0.08]"
      >
        <RefreshCw size={14} /> Try again
      </button>
    </div>
  );
}

export default function ScorePanel({
  data,
  loading,
  error,
  onRetry,
  placeName,
  onCompare,
  comparing,
  shareUrl,
}) {
  const [copied, setCopied] = useState(false);

  const copyShare = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked — ignore */
    }
  };

  const band = data ? scoreBand(data.livabilityScore) : null;

  return (
    <div className="flex h-full flex-col">
      {/* Header row: place + livability headline */}
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
            Livability analysis
          </p>
          <h2 className="mt-0.5 truncate font-display text-[19px] font-700 text-white" title={placeName}>
            {placeName || 'Select a location'}
          </h2>
        </div>
        {data && !loading && (
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              onClick={copyShare}
              title="Copy shareable link"
              className="rounded-lg border border-white/10 bg-white/[0.04] p-2 text-slate-300 transition hover:bg-white/[0.08]"
            >
              {copied ? <Check size={15} className="text-greenery" /> : <Share2 size={15} />}
            </button>
            <button
              onClick={onCompare}
              title="Compare with another location"
              className={`rounded-lg border p-2 transition ${
                comparing
                  ? 'border-livable/40 bg-livable/15 text-livable'
                  : 'border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]'
              }`}
            >
              <GitCompareArrows size={15} />
            </button>
          </div>
        )}
      </div>

      <div className="scroll-thin -mr-2 flex-1 overflow-y-auto pr-2">
        {loading && <SkeletonPanel />}
        {!loading && error && <ErrorState error={error} onRetry={onRetry} />}
        {!loading && !error && data && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }}>
            {/* Headline livability */}
            <div className="mb-5 flex items-center gap-4 rounded-2xl border border-white/[0.06] bg-gradient-to-br from-livable/[0.12] to-transparent p-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-livable/15">
                <Sparkles size={22} className="text-livable" />
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="tnum font-display text-4xl font-800 text-white">{data.livabilityScore}</span>
                  <span className="text-sm font-semibold text-livable">{band.label}</span>
                </div>
                <p className="text-[12px] text-slate-400">Overall livability index (0–100)</p>
              </div>
            </div>

            {/* Metric gauges */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-6">
              <ScoreGauge value={data.greeneryScore} label="Greenery" accent="#34d399" icon={Trees}
                sublabel={`${data.breakdown.greenCoverPct}% green cover`} />
              <ScoreGauge value={data.walkabilityScore} label="Walkability" accent="#22d3ee" icon={Footprints}
                sublabel={`${data.breakdown.amenityTotal} amenities`} />
              <ScoreGauge value={data.airQualityScore ?? 0} label="Air quality" accent="#f59e0b" icon={Wind}
                unavailable={data.airQualityScore == null}
                sublabel={data.breakdown.pm2_5 != null ? `PM2.5 ${data.breakdown.pm2_5}` : 'unavailable'} />
              <ScoreGauge value={data.livabilityScore} label="Livability" accent="#a78bfa" icon={Sparkles}
                sublabel="weighted blend" />
            </div>

            <div className="mt-7">
              <h3 className="mb-2.5 text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                Detailed breakdown
              </h3>
              <Breakdown breakdown={data.breakdown} />
            </div>

            <p className="mt-5 text-[10.5px] leading-relaxed text-slate-600">
              Analysis covers a 1 km radius. Data © OpenStreetMap contributors · air quality via Open-Meteo.
              Scores are model estimates from open data and vary with local mapping completeness.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
