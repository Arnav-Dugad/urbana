/**
 * Minimal SVG sparkline for the 24h PM2.5 trend. Colour reflects the latest
 * value's air band (green→amber→red) so the trend reads at a glance.
 */
export default function Sparkline({ data = [], width = 150, height = 38 }) {
  const series = data.filter((v) => v != null);
  if (series.length < 2) return null;

  const min = Math.min(...series);
  const max = Math.max(...series);
  const range = max - min || 1;
  const stepX = width / (series.length - 1);

  const x = (i) => i * stepX;
  const y = (v) => height - 4 - ((v - min) / range) * (height - 8);

  const line = series.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const area = `${line} L${width},${height} L0,${height} Z`;

  const last = series[series.length - 1];
  const color = last <= 15 ? '#34d399' : last <= 35 ? '#fbbf24' : last <= 55 ? '#fb923c' : '#f43f5e';
  const id = `spark-${Math.round(Math.random() * 1e6)}`;

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={x(series.length - 1)} cy={y(last)} r="2.4" fill={color} />
    </svg>
  );
}
