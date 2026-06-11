import { useState } from 'react';

const getSliderTheme = (value, variant) => {
  if (variant === 'orange') {
    const col = {
      1: '#ef4444', 2: '#f75a3f', 3: '#fa7c32', 4: '#f99e1b', 5: '#eab308',
      6: '#c0e12c', 7: '#82e149', 8: '#22c55e', 9: '#10b981', 10: '#00f5a0',
    }[value];

    return {
      base: col,
      bg: `${col}18`,
      border: `${col}60`,
      ring: `${col}33`,
      shadow: `0 0 8px ${col}25`,
      bg10: `${col}25`,
      shadow10: `0 0 15px ${col}60`,
    };
  }

  // Violet: плавный HSL-поток от красного до фиолетового
  const startHue = 355;
  const endHue = 265;
  const hue = Math.round(startHue - ((value - 1) / 9) * (startHue - endHue));

  if (value === 10) {
    return {
      base: 'hsl(265, 100%, 72%)',
      bg10: 'hsla(265, 100%, 72%, 0.25)',
      shadow10: '0 0 15px hsla(265, 100%, 72%, 0.6)',
    };
  }

  const s = 95;
  const l = 58;
  return {
    base: `hsl(${hue}, ${s}%, ${l}%)`,
    bg: `hsla(${hue}, ${s}%, ${l}%, 0.18)`,
    border: `hsla(${hue}, ${s}%, ${l}%, 0.6)`,
    ring: `hsla(${hue}, ${s}%, ${l}%, 0.33)`,
    shadow: `0 0 8px hsla(${hue}, ${s}%, ${l}%, 0.25)`,
  };
};

export function ScoreSlider({
  label,
  value,
  onChange,
  hasToggle = false,
  toggleValue = true,
  onToggleChange,
  toggleOptions = { yes: 'Есть', no: 'Нет' },
  variant = 'orange',
}) {
  const [isToggleOpen, setIsToggleOpen] = useState(false);

  const isOrange = variant === 'orange';
  const isDisabled = hasToggle && !toggleValue;
  const theme = getSliderTheme(value, variant);
  const percent = ((value - 1) / (10 - 1)) * 100;

  const cardStyles = isOrange
    ? 'bg-slate-900/40 border-slate-700/30'
    : 'bg-gradient-to-r from-violet-950/20 to-slate-900 border-violet-500/20 mt-8';

  return (
    <div className={`p-4 rounded-xl border flex flex-col gap-4 transition-all duration-300 ${cardStyles}`}>
      {/* Строка заголовка */}
      <div className="flex justify-between items-center w-full">
        <span className={`font-semibold ${!isOrange ? 'text-violet-300 font-bold text-base' : 'text-slate-200'}`}>
          {label}
        </span>

        <div className="flex items-center gap-3">
          {/* Дропдаун-тогл */}
          {hasToggle && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsToggleOpen(!isToggleOpen)}
                className="bg-slate-800 border border-slate-700 hover:border-slate-600 text-xs px-2.5 py-1.5 rounded-lg text-slate-300 flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <span>{toggleValue ? toggleOptions.yes : toggleOptions.no}</span>
                <svg
                  className={`h-3 w-3 text-slate-500 transition-transform duration-200 ${isToggleOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isToggleOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsToggleOpen(false)} />
                  <div className="absolute right-0 mt-1 w-44 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-20 p-1 space-y-0.5">
                    <button
                      type="button"
                      onClick={() => { onToggleChange(true); setIsToggleOpen(false); }}
                      className={`w-full text-left px-2 py-1.5 text-xs rounded transition-colors cursor-pointer block ${toggleValue ? 'bg-orange-500/15 text-orange-400 font-bold' : 'text-slate-300 hover:bg-slate-700/50'}`}
                    >
                      {toggleOptions.yes}
                    </button>
                    <button
                      type="button"
                      onClick={() => { onToggleChange(false); setIsToggleOpen(false); }}
                      className={`w-full text-left px-2 py-1.5 text-xs rounded transition-colors cursor-pointer block ${!toggleValue ? 'bg-orange-500/15 text-orange-400 font-bold' : 'text-slate-300 hover:bg-slate-700/50'}`}
                    >
                      {toggleOptions.no}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Плашка с цифрой */}
          {(!hasToggle || toggleValue) && (
            <span
              className="font-black px-2.5 py-0.5 rounded border text-sm transition-all duration-200"
              style={
                value === 10
                  ? { color: theme.base, borderColor: theme.base, backgroundColor: theme.bg10, boxShadow: theme.shadow10, transform: 'scale(1.05)' }
                  : { color: theme.base, borderColor: theme.border, backgroundColor: theme.bg, boxShadow: theme.shadow }
              }
            >
              {value}
            </span>
          )}
        </div>
      </div>

      {/* Ползунок */}
      <input
        type="range"
        min="1"
        max="10"
        value={value}
        disabled={isDisabled}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          '--thumb-color': theme.base,
          '--thumb-ring': theme.ring,
          background: `linear-gradient(to right, ${theme.base} ${percent}%, #1e293b ${percent}%)`,
        }}
        className={`appearance-none w-full h-2 rounded-lg cursor-pointer outline-none transition-all duration-150
          [&::-webkit-slider-thumb]:appearance-none
          [&::-webkit-slider-thumb]:w-4
          [&::-webkit-slider-thumb]:h-4
          [&::-webkit-slider-thumb]:rounded-full
          [&::-webkit-slider-thumb]:bg-[var(--thumb-color)]
          [&::-webkit-slider-thumb]:transition-colors
          [&::-webkit-slider-thumb]:duration-150
          [&::-moz-range-thumb]:w-4
          [&::-moz-range-thumb]:h-4
          [&::-moz-range-thumb]:rounded-full
          [&::-moz-range-thumb]:border-0
          [&::-moz-range-thumb]:bg-[var(--thumb-color)]
          [&::-moz-range-thumb]:transition-colors
          [&::-moz-range-thumb]:duration-150
          focus:[&::-webkit-slider-thumb]:ring-4
          focus:[&::-webkit-slider-thumb]:ring-[var(--thumb-ring)]
          ${isDisabled ? 'opacity-10 cursor-not-allowed' : ''}`}
      />
    </div>
  );
}