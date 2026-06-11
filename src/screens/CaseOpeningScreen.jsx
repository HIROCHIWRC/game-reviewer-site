import { useState, useRef, useCallback, useEffect } from 'react';
import { casesApi } from '../api';
import { BackButton } from '../components/BackButton';
import { YellowButton } from '../components/YellowButton';
import { VioletButton } from '../components/VioletButton';
import { Modal } from '../components/Modal';
import { SkinBox } from '../components/SkinBox';
import { CoinIcon } from '../components/CoinIcon';
import {
  ITEM_W, ITEM_H, ITEM_GAP, ITEM_STEP, VIEWPORT_W,
  TOTAL_ITEMS, TARGET_IDX,
  pickWeightedSkin,
} from '../utils/caseUtils';

export function CaseOpeningScreen({ caseData, coins, onBack, onUpdateCoins }) {
  const [result,          setResult         ] = useState(null);
  const [error,           setError          ] = useState('');
  const [scrollItems,     setScrollItems    ] = useState([]);
  const [scrollX,         setScrollX        ] = useState(0);
  const [opening,         setOpening        ] = useState(false);
  const [highlightWinner, setHighlightWinner] = useState(false);
  const [selling,         setSelling        ] = useState(false);

  const stoppedRef   = useRef(false);
  const rafRef       = useRef(null);
  const finalSkinRef = useRef(null);
  const containerRef = useRef(null);

  // Отмена анимации при размонтировании
  useEffect(() => () => {
    stoppedRef.current = true;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  const goToReady = () => {
    setResult(null);
    setScrollItems([]);
    setOpening(false);
    setHighlightWinner(false);
    setSelling(false);
  };

  const startOpening = useCallback(() => {
    if (coins < caseData.price) {
      setError('Недостаточно монет');
      return;
    }

    setError('');
    setResult(null);
    setHighlightWinner(false);
    stoppedRef.current  = false;
    finalSkinRef.current = null;

    const pool = caseData.pool || [];
    if (pool.length === 0) {
      setError('Нет скинов в кейсе');
      return;
    }

    // Заполняем ленту скинами с учётом весов редкостей
    const items = Array.from({ length: TOTAL_ITEMS }, (_, i) => {
      const s = pickWeightedSkin(pool, caseData.drops);
      return {
        name:       s.name,
        image:      s.image,
        rarityHex:  s.hex  || '#475569',
        rarityGlow: s.glow || 'rgba(71,85,105,0.2)',
        isWinner:   i === TARGET_IDX,
      };
    });

    setScrollItems(items);
    setOpening(true);

    // Запрос к API идёт параллельно с анимацией
    casesApi.open(caseData.id).then((data) => {
      if (stoppedRef.current) return;
      const ws = data.skin;
      finalSkinRef.current = ws;
      if (data.coins != null && onUpdateCoins) onUpdateCoins(data.coins);

      // Подменяем TARGET_IDX на реальный выпавший скин + соседи-приманки
      setScrollItems((prev) => {
        const updated = [...prev];
        updated[TARGET_IDX] = {
          name:       ws.name,
          image:      ws.image,
          rarityHex:  ws.rarityHex  || '#475569',
          rarityGlow: ws.rarityGlow || 'rgba(71,85,105,0.2)',
          isWinner:   true,
        };

        if (data.neighbors) {
          for (const { position, skin } of data.neighbors) {
            const idx = TARGET_IDX + position;
            if (idx >= 0 && idx < updated.length) {
              updated[idx] = {
                name:       skin.name,
                image:      skin.image,
                rarityHex:  skin.rarityHex  || '#475569',
                rarityGlow: skin.rarityGlow || 'rgba(71,85,105,0.2)',
                isWinner:   false,
              };
            }
          }
        }

        return updated;
      });
    }).catch((err) => {
      if (stoppedRef.current) return;
      setError(err.message || 'Ошибка');
      setOpening(false);
      setScrollItems([]);
    });

    // Анимация прокрутки — стартуем на следующем кадре после монтирования ленты
    requestAnimationFrame(() => {
      const vw = containerRef.current?.offsetWidth || VIEWPORT_W;
      const endX = vw / 2 - TARGET_IDX * ITEM_STEP - ITEM_W / 2;
      const startX = vw;
      setScrollX(startX);

      // Случайный сдвиг финальной позиции — чтобы каждый раз останавливалось в разном месте
      const endOffset = (Math.random() - 0.5) * 120; // -60..+60px
      const finalEndX = endX + endOffset;

      const DURATION  = 7000;
      const startTime = performance.now();

      const animate = (now) => {
        if (stoppedRef.current) return;

        const t    = Math.min((now - startTime) / DURATION, 1);
        const ease = 1 - Math.pow(1 - t, 4);

        setScrollX(startX + (finalEndX - startX) * ease);

        if (t < 1) {
          rafRef.current = requestAnimationFrame(animate);
        } else {
          setScrollX(finalEndX);
          setHighlightWinner(true);

          // Ждём ответа от API если ещё не пришёл
          const tryShowResult = () => {
            if (stoppedRef.current) return;
            if (finalSkinRef.current) {
              setResult(finalSkinRef.current);
            } else {
              setTimeout(tryShowResult, 200);
            }
          };
          setTimeout(tryShowResult, 800);
        }
      };

      rafRef.current = requestAnimationFrame(animate);
    });
  }, [caseData, coins, onUpdateCoins]);

  const handleSell = async () => {
    if (!result || selling) return;
    setSelling(true);
    try {
      const data = await casesApi.sell(result.itemId);
      if (data.coins != null && onUpdateCoins) onUpdateCoins(data.coins);
      goToReady();
    } catch (err) {
      setError(err.message || 'Ошибка продажи');
      setSelling(false);
    }
  };

  return (
    <div className="py-2">
      <div className="flex items-center gap-3 mb-4 min-h-[36px]">
        <BackButton onClick={onBack} text="← Назад" />
        <h2 className="text-xl font-bold text-slate-100 truncate">{caseData.name}</h2>
      </div>

      {error && (
        <p className="text-rose-400 text-sm font-medium text-center mb-4">{error}</p>
      )}

      <div className="flex flex-col items-center gap-4">

        {/* Лента прокрутки / заглушка */}
        {!opening ? (
          <div className="w-48 h-48 rounded-2xl bg-slate-800 flex items-center justify-center border-2 border-dashed border-slate-700/60">
            <svg className="w-16 h-16 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
            </svg>
          </div>
        ) : (
          <div
            ref={containerRef}
            className="w-full max-w-[720px] overflow-hidden rounded-xl border border-slate-700/50 bg-slate-900/60 flex items-center"
            style={{ height: `${ITEM_H + 24}px`, position: 'relative' }}
          >
            {/* Центровочный маркер (треугольник сверху) */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 0,
                height: 0,
                borderLeft: '8px solid transparent',
                borderRight: '8px solid transparent',
                borderTop: '10px solid #f59e0b',
                zIndex: 10,
              }}
            />

            <div
              className="flex items-center"
              style={{
                gap: `${ITEM_GAP}px`,
                transform: `translateX(${scrollX}px)`,
                willChange: 'transform',
              }}
            >
              {scrollItems.map((item, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 rounded-lg border-2 overflow-hidden flex items-center justify-center"
                  style={{
                    width:           `${ITEM_W}px`,
                    height:          `${ITEM_H}px`,
                    borderColor:     item.rarityHex,
                    backgroundColor: item.rarityHex + '20',
                    transition:      highlightWinner && item.isWinner ? 'box-shadow 0.4s ease' : 'none',
                    boxShadow:       highlightWinner && item.isWinner
                      ? `0 0 32px ${item.rarityGlow}, inset 0 0 20px ${item.rarityGlow}`
                      : 'none',
                  }}
                >
                  {item.image ? (
                    <img src={item.image} alt="" className="w-full h-full object-contain p-1.5" />
                  ) : (
                    <span className="text-4xl font-black opacity-30 text-slate-600">?</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Кнопка / статус */}
        {!opening ? (
          <div className="w-full max-w-[300px]">
            <YellowButton
              onClick={startOpening}
              className="w-full gap-2"
              height={50}
              fontSize={17}
            >
              <span>🎲 Открыть кейс</span>
              <CoinIcon className="w-4 h-4" />
              <span>{caseData.price}</span>
            </YellowButton>
          </div>
        ) : (
          <p className="text-sm text-slate-400 animate-pulse">
            {highlightWinner ? '✦ Выбранный скин ✦' : 'Прокрутка...'}
          </p>
        )}

        {/* Список скинов в кейсе */}
        <div className={`grid grid-cols-3 sm:grid-cols-5 gap-2 md:gap-3 mt-2 w-full ${opening ? 'opacity-30 pointer-events-none' : ''}`}>
          {caseData.pool.map((skin, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div
                className="w-full aspect-[4/3] rounded-xl overflow-hidden flex items-center justify-center"
                style={{ backgroundColor: skin.hex + '30' }}
              >
                <img
                  src={skin.image}
                  alt={skin.name}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              </div>
              <span className="text-xs text-slate-300 text-center leading-tight truncate w-full">
                {skin.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Модалка результата */}
      {result && (
        <Modal visible onClose={goToReady} showCloseButton={false} title={result.name} size="md">
          <div className="flex flex-col items-center gap-4">
            <SkinBox skin={result} glow size="w-40 h-40" />
            <span
              className="text-sm font-bold px-4 py-1 rounded-full"
              style={{ backgroundColor: result.rarityGlow, color: result.rarityHex }}
            >
              {result.rarityLabel}
            </span>
            <div className="flex items-center gap-1.5 text-sm font-bold text-yellow-400">
              <CoinIcon className="w-4 h-4" />
              <span>{result.value}</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-2 w-full">
              <YellowButton
                onClick={handleSell}
                className="w-full sm:w-auto gap-1.5"
                height={42}
                fontSize={14}
              >
                <CoinIcon className="w-4 h-4" />
                <span>Продать за {result.value}</span>
              </YellowButton>
              <VioletButton
                text="🎒 В инвентарь"
                onClick={goToReady}
                className="w-full sm:w-auto"
                height={42}
                fontSize={14}
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}