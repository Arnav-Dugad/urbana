import { useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { scoreBand } from '../config/tags.js';

/**
 * A custom animated radial gauge — SVG arc + a count-up numeral. Deliberately
 * not a stock progress bar. `accent` is the metric colour; the track is a
 * faint ring so even a low score reads as intentional design.
 */
export default function ScoreGauge({
  value,
  label,
  accent = '#34d399',
  size = 116,
  stroke = 9,
  sublabel,
  icon: Icon,
  unavailable = false,
}) {
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;

  const progress = useMotionValue(0);
  const display = useMotionValue(0);
  const dashOffset = useTransform(progress, (p) => circ - (p / 100) * circ);
  const rounded = useTransform(display, (v) => Math.round(v));

  useEffect(() => {
    if (unavailable) return;
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      progress.set(value);
      display.set(value);
      return;
    }
    const a1 = animate(progress, value, { duration: 1.1, ease: [0.16, 1, 0.3, 1] });
    const a2 = animate(display, value, { duration: 1.1, ease: [0.16, 1, 0.3, 1] });
    return () => {
      a1.stop();
      a2.stop();
    };
  }, [value, unavailable, progress, display]);

  const band = scoreBand(value);

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.07)"
            strokeWidth={stroke}
          />
          {!unavailable && (
            <motion.circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={accent}
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={circ}
              style={{ strokeDashoffset: dashOffset, filter: `drop-shadow(0 0 6px ${accent}55)` }}
            />
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {unavailable ? (
            <span className="text-slate-500 text-xs font-medium">n/a</span>
          ) : (
            <>
              <motion.span className="tnum font-display text-3xl font-800 leading-none text-white">
                {rounded}
              </motion.span>
              <span className="text-[10px] font-semibold uppercase tracking-wider mt-0.5" style={{ color: accent }}>
                {band.label}
              </span>
            </>
          )}
        </div>
      </div>
      <div className="mt-2.5 flex items-center gap-1.5">
        {Icon && <Icon size={13} style={{ color: accent }} strokeWidth={2.4} />}
        <span className="text-[13px] font-semibold text-slate-200">{label}</span>
      </div>
      {sublabel && <span className="text-[11px] text-slate-500 mt-0.5">{sublabel}</span>}
    </div>
  );
}
