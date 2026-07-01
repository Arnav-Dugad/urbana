import { Github } from 'lucide-react';

/** App brand mark — a small custom radar glyph, not a stock logo. */
function Mark() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden>
      <circle cx="16" cy="16" r="13" fill="none" stroke="#22d3ee" strokeWidth="1.2" opacity="0.35" strokeDasharray="3 3" />
      <circle cx="16" cy="16" r="9" fill="none" stroke="#34d399" strokeWidth="2" />
      <circle cx="16" cy="16" r="3.2" fill="#34d399" />
    </svg>
  );
}

export default function Header({ repoUrl }) {
  return (
    <div className="flex items-center gap-2.5">
      <Mark />
      <div className="leading-none">
        <div className="flex items-baseline gap-2">
          <span className="font-display text-[17px] font-800 tracking-tight text-white">Urbana</span>
          <span className="hidden sm:inline text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
            Urban Livability
          </span>
        </div>
      </div>
      {repoUrl && (
        <a
          href={repoUrl}
          target="_blank"
          rel="noreferrer"
          className="ml-1 hidden rounded-lg border border-white/10 bg-white/[0.03] p-1.5 text-slate-400 transition hover:text-white sm:inline-flex"
          title="View source"
        >
          <Github size={15} />
        </a>
      )}
    </div>
  );
}
