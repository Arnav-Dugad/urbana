import { Trees, ShoppingBag, TrainFront } from 'lucide-react';

const GREEN = [
  { c: '#34d399', label: 'Parks / gardens' },
  { c: '#059669', label: 'Woodland' },
  { c: '#38bdf8', label: 'Water' },
  { c: '#86efac', label: 'Trees' },
];
const WALK = [
  { c: '#22d3ee', label: 'Pharmacy' },
  { c: '#38bdf8', label: 'Supermarket' },
  { c: '#818cf8', label: 'School' },
  { c: '#2dd4bf', label: 'Shops / clinics' },
];
const TRANSIT = [
  { c: '#e879f9', label: 'Rail / metro' },
  { c: '#f472b6', label: 'Bus stop' },
];

function Group({ icon: Icon, title, items }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-slate-400">
        <Icon size={12} strokeWidth={2.4} /> {title}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {items.map((i) => (
          <span key={i.label} className="flex items-center gap-1.5 text-[11px] text-slate-300">
            <span className="h-2.5 w-2.5 rounded-full poi-dot" style={{ background: i.c }} />
            {i.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function Legend() {
  return (
    <div className="glass pointer-events-auto rounded-xl p-3">
      <div className="flex flex-col gap-2.5">
        <Group icon={Trees} title="Green & blue" items={GREEN} />
        <Group icon={ShoppingBag} title="Amenities" items={WALK} />
        <Group icon={TrainFront} title="Transit" items={TRANSIT} />
      </div>
    </div>
  );
}
