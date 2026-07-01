import { Trees, ShoppingBag, TrainFront, Flame } from 'lucide-react';

const LAYERS = [
  { key: 'green', label: 'Green', icon: Trees, color: '#34d399' },
  { key: 'walk', label: 'Amenities', icon: ShoppingBag, color: '#22d3ee' },
  { key: 'transit', label: 'Transit', icon: TrainFront, color: '#f472b6' },
  { key: 'heatmap', label: 'Heatmap', icon: Flame, color: '#f59e0b' },
];

/** Compact map layer toggles (green / amenities / transit / heatmap). */
export default function LayerControl({ visible, onToggle }) {
  return (
    <div className="glass pointer-events-auto flex items-center gap-1 rounded-xl p-1">
      {LAYERS.map((l) => {
        const on = visible[l.key];
        const Icon = l.icon;
        return (
          <button
            key={l.key}
            onClick={() => onToggle(l.key)}
            aria-pressed={on}
            title={`${on ? 'Hide' : 'Show'} ${l.label}`}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-medium transition ${
              on ? 'bg-white/[0.08] text-white' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Icon size={14} style={{ color: on ? l.color : undefined }} strokeWidth={2.3} />
            <span className="hidden sm:inline">{l.label}</span>
          </button>
        );
      })}
    </div>
  );
}
