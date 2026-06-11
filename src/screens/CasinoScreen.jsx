import { useState, useEffect } from 'react';
import { BackButton } from '../components/BackButton';
import { CoinIcon } from '../components/CoinIcon';
import { casesApi } from '../api';

export function CasinoScreen({ onBack, onOpenCase }) {
  const [cases, setCases] = useState([]);

  useEffect(() => {
    casesApi.getData().then((data) => setCases(data.cases || [])).catch(() => {});
  }, []);

  return (
    <div className="py-2">
      <div className="mb-6"><BackButton onClick={onBack} /></div>

      {cases.length === 0 ? (
        <div className="text-center py-16 text-slate-500">⏳ Загрузка кейсов...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {cases.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onOpenCase(c)}
              className="group bg-slate-900/60 border border-slate-700/50 rounded-2xl p-5 flex flex-col items-center gap-4 cursor-pointer transition-all hover:border-violet-500/30 hover:bg-slate-900/80 active:scale-[0.97]"
            >
              <div className="w-32 h-32 rounded-xl overflow-hidden bg-slate-800 flex items-center justify-center">
                <img
                  src={c.image}
                  alt={c.name}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              </div>
              <h3 className="text-lg font-bold text-slate-100">{c.name}</h3>
              <div className="flex items-center gap-1.5 text-sm font-bold text-yellow-400 bg-yellow-400/10 px-4 py-1.5 rounded-full">
                <CoinIcon className="w-3.5 h-3.5" />
                <span>{c.price}</span>
              </div>
              <div className="flex flex-wrap gap-1.5 justify-center mt-1">
                {c.drops.map((d, i) => (
                  <span
                    key={i}
                    className="text-[10px] font-semibold px-2 py-0.5 rounded"
                    style={{ backgroundColor: d.hex + '20', color: d.hex }}
                  >
                    {d.label.split(' ')[0]}
                  </span>
                ))}
              </div>
              <span className="text-xs text-slate-500 mt-1">Выбрать кейс</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
