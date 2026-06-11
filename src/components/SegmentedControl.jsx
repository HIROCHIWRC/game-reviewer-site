export function SegmentedControl({ options, value, onChange, className = '' }) {
  return (
    <div className={`flex bg-slate-900/80 rounded-xl p-1 ring-1 ring-violet-500/40 shadow-lg shadow-violet-500/10 ${className}`} role="tablist">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="tab"
          aria-selected={value === option.value}
          onClick={() => onChange(option.value)}
          className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer select-none ${
            value === option.value
              ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}