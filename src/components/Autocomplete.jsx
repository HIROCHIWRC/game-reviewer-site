import { useState, useRef, useEffect } from 'react';

export function Autocomplete({ label, value, onChange, options = [], onSelect, placeholder, onBlur }) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  const query = value.toLowerCase();
  const filtered = options
    .filter((opt) => opt.title.toLowerCase().includes(query))
    .sort((a, b) => {
      const at = a.title.toLowerCase();
      const bt = b.title.toLowerCase();
      const aExact = at === query ? 0 : at.startsWith(query) ? 1 : 2;
      const bExact = bt === query ? 0 : bt.startsWith(query) ? 1 : 2;
      return aExact - bExact || at.localeCompare(bt);
    })
    .slice(0, 10);

  useEffect(() => {
    const handleClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleInputChange = (e) => {
    onChange(e);
    setIsOpen(true);
  };

  const handleSelect = (item) => {
    onSelect(item);
    setIsOpen(false);
  };

  return (
    <div className="w-full relative" ref={wrapperRef}>
      {label && (
        <label className="block text-sm font-bold text-slate-400 mb-2 uppercase tracking-wider">
          {label}
        </label>
      )}
      <input
        type="text"
        value={value}
        onChange={handleInputChange}
        onFocus={() => setIsOpen(true)}
        onBlur={onBlur}
        placeholder={placeholder}
        className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 transition-all duration-200"
      />
      {isOpen && filtered.length > 0 && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 right-0 mt-2 bg-slate-800 border border-slate-700/80 rounded-xl shadow-2xl overflow-hidden z-20 p-1.5 space-y-0.5 backdrop-blur-md">
            {filtered.map((item) => (
              <button
                key={item.title}
                type="button"
                onClick={() => handleSelect(item)}
                className={`w-full text-left px-3 py-2.5 text-sm rounded-lg transition-colors cursor-pointer block
                  ${item.title.toLowerCase() === value.toLowerCase()
                    ? 'bg-orange-500/15 text-orange-400 font-bold border border-orange-500/20'
                    : 'text-slate-300 hover:bg-slate-700/50 hover:text-slate-100'}`}
              >
                <span>{item.title}</span>
                <span className="text-slate-500 ml-2 text-xs">({item.genre})</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}