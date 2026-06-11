import { useState } from 'react';

export function FormSelect({ label, value, onChange, options = [] }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (option) => {
    onChange({ target: { value: option } });
    setIsOpen(false);
  };

  return (
    <div className="w-full relative">
      {label && (
        <label className="block text-sm font-bold text-slate-400 mb-2 uppercase tracking-wider">
          {label}
        </label>
      )}

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-slate-900/80 border text-left px-4 py-3 text-slate-100 rounded-xl focus:outline-none transition-all duration-200 flex justify-between items-center cursor-pointer
          ${isOpen ? 'border-orange-500 ring-1 ring-orange-500/20' : 'border-slate-700 hover:border-slate-600'}`}
      >
        <span className="font-medium">{value}</span>
        <svg
          className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-orange-400' : ''}`}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 right-0 mt-2 bg-slate-800 border border-slate-700/80 rounded-xl shadow-2xl overflow-hidden z-20 p-1.5 space-y-0.5 backdrop-blur-md">
            {options.map((option) => {
              const isSelected = option === value;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleSelect(option)}
                  className={`w-full text-left px-3 py-2.5 text-sm rounded-lg transition-colors cursor-pointer block
                    ${isSelected
                      ? 'bg-orange-500/15 text-orange-400 font-bold border border-orange-500/20'
                      : 'text-slate-300 hover:bg-slate-700/50 hover:text-slate-100'}`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}