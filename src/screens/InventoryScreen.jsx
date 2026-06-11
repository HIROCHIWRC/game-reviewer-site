import { useState, useEffect } from 'react';
import { BackButton } from '../components/BackButton';
import { YellowButton } from '../components/YellowButton';
import { CoinIcon } from '../components/CoinIcon';
import { Modal } from '../components/Modal';
import { assetUrl } from '../config';
import { casesApi } from '../api';

const RARITY_ORDER = ['gold', 'red', 'pink', 'purple', 'blue', 'sky', 'white'];

export function InventoryScreen({ onBack, onCoinsChange }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sellTarget, setSellTarget] = useState(null);

  useEffect(() => {
    casesApi.getInventory().then((data) => {
      setItems(data.items || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleSell = async () => {
    if (!sellTarget) return;
    try {
      const data = await casesApi.sell(sellTarget.id);
      setItems((prev) => prev.filter((i) => i.id !== sellTarget.id));
      if (data.coins != null && onCoinsChange) onCoinsChange(data.coins);
    } catch { /* ignore sell errors */ }
    setSellTarget(null);
  };

  const grouped = {};
  for (const r of RARITY_ORDER) grouped[r] = [];
  for (const item of items) {
    if (!grouped[item.rarity]) grouped[item.rarity] = [];
    grouped[item.rarity].push(item);
  }

  return (
    <div className="py-2">
      <div className="mb-6"><BackButton onClick={onBack} /></div>
      <h2 className="text-2xl font-black text-slate-100 mb-6">🎒 Инвентарь</h2>

      {loading ? (
        <div className="text-center py-16 text-slate-500">⏳ Загрузка...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-slate-500">Инвентарь пуст. Открой кейс!</div>
      ) : (
        RARITY_ORDER.map((rarity) => {
          const group = grouped[rarity];
          if (!group || group.length === 0) return null;
          const first = group[0];
          return (
            <div key={rarity} className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: first.rarityHex }} />
                <span className="text-sm font-bold" style={{ color: first.rarityHex }}>
                  {first.rarityLabel} ({group.length})
                </span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                {group.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSellTarget(item)}
                    className="relative aspect-square rounded-xl overflow-hidden border-2 border-slate-700/50 flex flex-col items-center justify-center p-1 transition-all cursor-pointer hover:border-rose-500/50 active:scale-95 group"
                    style={{ backgroundColor: item.rarityGlow }}
                  >
                    <img
                      src={assetUrl(item.image)}
                      alt={item.name}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        const f = document.createElement('span');
                        f.className = 'text-xl font-black opacity-40';
                        f.style.color = item.rarityHex;
                        f.textContent = '?';
                        e.target.parentElement.appendChild(f);
                      }}
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-[10px] font-bold text-center py-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-0.5">
                      <CoinIcon className="w-2.5 h-2.5" />
                      <span>{item.value}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          );
        })
      )}

        {sellTarget && (
          <Modal visible onClose={() => setSellTarget(null)} title="Продажа скина">
            <div className="flex flex-col items-center gap-4">
              <div
                className="w-32 h-32 rounded-xl flex items-center justify-center border-2"
                style={{ borderColor: sellTarget.rarityHex, backgroundColor: sellTarget.rarityGlow }}
              >
                <img src={assetUrl(sellTarget.image)} alt={sellTarget.name} className="w-full h-full object-contain rounded-xl p-1" />
              </div>
              <p className="text-lg font-bold text-slate-100">{sellTarget.name}</p>
              <p className="text-sm text-slate-400">{sellTarget.rarityLabel}</p>
              <p className="text-yellow-400 font-bold text-lg flex items-center gap-1">
                <CoinIcon className="w-4 h-4" />
                {sellTarget.value}
              </p>
              <p className="text-sm text-slate-500">Продать этот скин?</p>
            <div className="flex gap-3">
              <YellowButton text="Продать" onClick={handleSell} width={130} height={40} fontSize={14} />
              <button
                type="button"
                onClick={() => setSellTarget(null)}
                className="px-5 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium rounded-xl cursor-pointer active:scale-95 text-sm"
              >
                Отмена
              </button>
            </div>
            </div>
          </Modal>
        )}
      </div>
    );
  }

