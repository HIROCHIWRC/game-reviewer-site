export function ProgressBar({ value, max, barClass, label }) {
  const pct = value / max;

  return (
    <div className="w-full">
      {label && (
        <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
          <span>{label}</span>
          <span>{Math.round(pct * 100)}%</span>
        </div>
      )}
      <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barClass}`}
          style={{ width: `${Math.min(pct * 100, 100)}%` }}
        />
      </div>
    </div>
  );
}
