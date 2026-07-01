import { PILLARS } from '../config/tags.js';

/**
 * Hand-rolled SVG radar of the four pillars (0–100). Supports overlaying a
 * second series for compare mode. No charting dependency — keeps the bundle
 * lean and the look bespoke.
 */
export default function RadarChart({ primary, secondary, size = 200 }) {
  const cx = size / 2;
  const cy = size / 2;
  const R = size / 2 - 26; // leave room for labels
  const axes = PILLARS;
  const n = axes.length;

  // Angle for axis i (start at top, clockwise).
  const angle = (i) => -Math.PI / 2 + (i * 2 * Math.PI) / n;
  const point = (i, value) => {
    const r = (Math.max(0, Math.min(100, value)) / 100) * R;
    return [cx + r * Math.cos(angle(i)), cy + r * Math.sin(angle(i))];
  };
  const axisEnd = (i) => [cx + R * Math.cos(angle(i)), cy + R * Math.sin(angle(i))];
  const labelPos = (i) => [cx + (R + 16) * Math.cos(angle(i)), cy + (R + 16) * Math.sin(angle(i))];

  const polygon = (series) =>
    axes.map((a, i) => point(i, series[a.key] ?? 0).join(',')).join(' ');

  const rings = [25, 50, 75, 100];

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
      {/* grid rings */}
      {rings.map((pct) => (
        <polygon
          key={pct}
          points={axes.map((_, i) => point(i, pct).join(',')).join(' ')}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="1"
        />
      ))}
      {/* spokes */}
      {axes.map((a, i) => {
        const [x, y] = axisEnd(i);
        return <line key={a.key} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />;
      })}

      {/* secondary series (compare) */}
      {secondary && (
        <polygon points={polygon(secondary)} fill="rgba(245,158,11,0.14)" stroke="#f59e0b" strokeWidth="1.5" />
      )}
      {/* primary series */}
      <polygon points={polygon(primary)} fill="rgba(167,139,250,0.18)" stroke="#a78bfa" strokeWidth="2" />

      {/* primary vertices coloured per pillar */}
      {axes.map((a, i) => {
        const [x, y] = point(i, primary[a.key] ?? 0);
        return <circle key={a.key} cx={x} cy={y} r="3" fill={a.color} />;
      })}

      {/* axis labels */}
      {axes.map((a, i) => {
        const [x, y] = labelPos(i);
        const anchor = Math.abs(Math.cos(angle(i))) < 0.3 ? 'middle' : x > cx ? 'start' : 'end';
        return (
          <text
            key={a.key}
            x={x}
            y={y}
            textAnchor={anchor}
            dominantBaseline="middle"
            fontSize="10"
            fontWeight="600"
            fill={a.color}
          >
            {a.short}
          </text>
        );
      })}
    </svg>
  );
}
