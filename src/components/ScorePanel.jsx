import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Trees, Footprints, TrainFront, Wind, Sparkles, RefreshCw, AlertTriangle,
  GitCompareArrows, Share2, Check, Star, ImageDown, HelpCircle,
} from 'lucide-react';
import ScoreGauge from './ScoreGauge.jsx';
import RadarChart from './RadarChart.jsx';
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

function IconBtn({ onClick, title, active, children }) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      className={`rounded-lg border p-2 transition ${
        active
          ? 'border-livable/40 bg-livable/15 text-livable'
          : 'border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]'
      }`}
    >
      {children}
    </button>
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
  compareData,
  shareUrl,
  saved,
  onToggleSave,
  onOpenReport,
  onOpenMethodology,
  onFocus,
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
  const radarPrimary = data
    ? { greenery: data.greeneryScore, walkability: data.walkabilityScore, transit: data.transitScore, air: data.airQualityScore ?? 0 }
    : null;
  const radarSecondary = compareData
    ? { greenery: compareData.greeneryScore, walkability: compareData.walkabilityScore, transit: compareData.transitScore, air: compareData.airQualityScore ?? 0 }
    : null;

  return (
    <div className="flex h-full flex-col">
      {/* Header row */}
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Livability analysis</p>
          <h2 className="mt-0.5 truncate font-display text-[19px] font-700 text-white" title={placeName}>
            {placeName || 'Select a location'}
          </h2>
        </div>
        {data && !loading && (
          <div className="flex shrink-0 items-center gap-1.5">
            <IconBtn onClick={onToggleSave} title={saved ? 'Remove from saved' : 'Save location'} active={saved}>
              <Star size={15} className={saved ? 'fill-current' : ''} />
            </IconBtn>
            <IconBtn onClick={copyShare} title="Copy shareable link">
              {copied ? <Check size={15} className="text-greenery" /> : <Share2 size={15} />}
            </IconBtn>
            <IconBtn onClick={onCompare} title="Compare with another location" active={comparing}>
              <GitCompareArrows size={15} />
            </IconBtn>
          </div>
        )}
      </div>

      <div className="scroll-thin -mr-2 flex-1 overflow-y-auto pr-2">
        {loading && <SkeletonPanel />}
        {!loading && error && <ErrorState error={error} onRetry={onRetry} />}
        {!loading && !error && data && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }}>
            {/* Livability headline */}
            <div className="mb-5 rounded-2xl border border-white/[0.06] bg-gradient-to-br from-livable/[0.12] to-transparent p-4">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-livable/15">
                  <Sparkles size={22} className="text-livable" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="tnum font-display text-4xl font-800 text-white">{data.livabilityScore}</span>
                    <span className="text-sm font-semibold text-livable">{band.label}</span>
                  </div>
                  <p className="text-[12px] text-slate-400">Overall livability index (0–100)</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 border-t border-white/[0.06] pt-3">
                <button onClick={onOpenReport} className="flex items-center gap-1.5 rounded-lg bg-white/[0.05] px-2.5 py-1.5 text-[12px] font-medium text-slate-200 transition hover:bg-white/[0.1]">
                  <ImageDown size={13} /> Report card
                </button>
                <button onClick={onOpenMethodology} className="ml-auto flex items-center gap-1 text-[11.5px] text-slate-400 transition hover:text-slate-200">
                  <HelpCircle size={13} /> How scores work
                </button>
              </div>
            </div>

            {/* Pillar gauges */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-6">
              <ScoreGauge value={data.greeneryScore} label="Greenery" accent="#34d399" icon={Trees}
                sublabel={`${data.breakdown.greenCoverPct}% green cover`} />
              <ScoreGauge value={data.walkabilityScore} label="Walkability" accent="#22d3ee" icon={Footprints}
                sublabel={`${data.breakdown.amenityTotal} amenities`} />
              <ScoreGauge value={data.transitScore} label="Transit" accent="#f472b6" icon={TrainFront}
                sublabel={`${data.breakdown.transitTotal} stops · ${data.breakdown.transitStations} stn`} />
              <ScoreGauge value={data.airQualityScore ?? 0} label="Air quality" accent="#f59e0b" icon={Wind}
                unavailable={data.airQualityScore == null}
                sublabel={data.breakdown.pm2_5 != null ? `PM2.5 ${data.breakdown.pm2_5}` : 'unavailable'} />
            </div>

            {/* Radar */}
            {radarPrimary && (
              <div className="mt-6 flex flex-col items-center rounded-2xl border border-white/[0.06] bg-white/[0.02] py-4">
                <RadarChart primary={radarPrimary} secondary={radarSecondary} size={196} />
                {radarSecondary && (
                  <div className="mt-1 flex items-center gap-4 text-[11px]">
                    <span className="flex items-center gap-1.5 text-slate-300"><span className="h-2 w-2 rounded-full bg-livable" /> This place</span>
                    <span className="flex items-center gap-1.5 text-slate-300"><span className="h-2 w-2 rounded-full bg-air" /> Comparison</span>
                  </div>
                )}
              </div>
            )}

            <div className="mt-7">
              <h3 className="mb-2.5 text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                Detailed breakdown
              </h3>
              <Breakdown breakdown={data.breakdown} elements={data.elements} onFocus={onFocus} />
            </div>

            <p className="mt-5 text-[10.5px] leading-relaxed text-slate-600">
              Analysis covers a {(data.radius / 1000).toFixed(data.radius % 1000 ? 1 : 0)} km radius. Data ©
              OpenStreetMap contributors · air &amp; weather via Open-Meteo. Scores are model estimates from
              open data and vary with local mapping completeness.
            </p>
          </motion.div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-3 border-t border-white/[0.06] pt-2.5 text-center text-[10.5px] text-slate-600">
        Arnav &copy; {new Date().getFullYear()}
      </div>
    </div>
  );
}
