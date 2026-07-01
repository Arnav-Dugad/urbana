import { useState } from 'react';
import { RADIUS_OPTIONS } from '../config/tags.js';

const fmt = (m) => (m >= 1000 ? `${m / 1000} km` : `${m} m`);

export default function RadiusSelector({ value, onChange }) {
  const [editing, setEditing] = useState(false);
  const [customVal, setCustomVal] = useState('');
  const isPreset = RADIUS_OPTIONS.includes(value);

  const commit = () => {
    const v = parseInt(customVal, 10);
    if (v >= 100 && v <= 10000) onChange(v);
    setEditing(false);
    setCustomVal('');
  };

  return (
    <div className="inline-flex items-center rounded-lg border border-white/10 bg-white/[0.03] p-0.5">
      {RADIUS_OPTIONS.map((m) => (
        <button
          key={m}
          onClick={() => { onChange(m); setEditing(false); setCustomVal(''); }}
          aria-pressed={value === m}
          className={`rounded-md px-2.5 py-1 text-[12px] font-semibold tabular-nums transition ${
            value === m ? 'bg-white/[0.1] text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {fmt(m)}
        </button>
      ))}

      {editing ? (
        <input
          autoFocus
          type="number"
          min="100"
          max="10000"
          value={customVal}
          onChange={(e) => setCustomVal(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') { setEditing(false); setCustomVal(''); }
          }}
          placeholder="m"
          className="w-16 rounded-md bg-white/[0.1] px-2 py-1 text-[12px] text-white placeholder-slate-500 outline-none tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
      ) : (
        <button
          onClick={() => { setCustomVal(isPreset ? '' : String(value)); setEditing(true); }}
          className={`rounded-md px-2.5 py-1 text-[12px] font-semibold tabular-nums transition ${
            !isPreset ? 'bg-white/[0.1] text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {isPreset ? 'Custom' : fmt(value)}
        </button>
      )}
    </div>
  );
}
