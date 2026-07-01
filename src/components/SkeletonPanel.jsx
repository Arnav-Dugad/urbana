/** Shimmer skeleton shown while an analysis is in flight — no spinners. */
function Bar({ className = '' }) {
  return (
    <div className={`relative overflow-hidden rounded-md bg-white/[0.05] ${className}`}>
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </div>
  );
}

function Ring() {
  return (
    <div className="flex flex-col items-center">
      <div className="relative h-[116px] w-[116px]">
        <div className="absolute inset-0 rounded-full border-[9px] border-white/[0.05]" />
        <div className="absolute inset-0 -translate-x-full animate-shimmer rounded-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>
      <Bar className="mt-3 h-3 w-20" />
    </div>
  );
}

export default function SkeletonPanel() {
  return (
    <div className="animate-fade-up">
      <div className="grid grid-cols-2 gap-5">
        <Ring />
        <Ring />
        <Ring />
        <Ring />
      </div>
      <div className="mt-7 space-y-3">
        <Bar className="h-3.5 w-32" />
        <Bar className="h-11 w-full" />
        <Bar className="h-11 w-full" />
        <Bar className="h-11 w-full" />
      </div>
    </div>
  );
}
