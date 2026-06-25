import { useState, useEffect, useCallback, useRef } from 'react';
import { IconButton } from './IconButton';
import { Modal } from './Modal';
import { API_BASE } from '../config';

const CLICKBAIT_HEADERS = [
  '🔥 ШОК! СЕНСАЦИЯ!',
  '⚠️ ВНИМАНИЕ ГЕЙМЕРАМ!',
  '❗ СЕКРЕТ РАСКРЫТ:',
  '☢️ СТРОГО 18+',
  '⚡ СКАЧАТЬ БЕЗ СМС:',
  '🚨 ПАЛУНДРА!!!',
];

function useMemeRotation(getImageUrl, getRandomText) {
  const [meme, setMeme] = useState({ header: '', image: '', text: '' });

  const generateMeme = useCallback(() => {
    const image = getImageUrl();
    const text = getRandomText();
    if (!text) return;
    setMeme({
      header: CLICKBAIT_HEADERS[Math.floor(Math.random() * CLICKBAIT_HEADERS.length)],
      image,
      text,
    });
  }, [getImageUrl, getRandomText]);

  useEffect(() => {
    const id = setTimeout(generateMeme, 0);
    const interval = setInterval(generateMeme, 8000);
    return () => { clearTimeout(id); clearInterval(interval); };
  }, [generateMeme]);

  return { meme, generateMeme };
}

function FakeCloseModal({ visible, onClose }) {
  return (
    <Modal visible={visible} title="🤫 Реклама" onClose={onClose} size="sm" showCloseButton={false}>
      <p className="text-slate-300 text-sm leading-relaxed mb-6">
        Вы действительно хотите убрать рекламу? Благодаря ней работают наши сервера :(
      </p>
      <div className="flex justify-center">
        <button
          type="button"
          onClick={onClose}
          className="px-8 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl transition-all cursor-pointer active:scale-95"
        >
          Нет
        </button>
      </div>
    </Modal>
  );
}

function SingleAdItem({ getImageUrl, getRandomText, position }) {
  const { meme, generateMeme } = useMemeRotation(getImageUrl, getRandomText);
  const [showModal, setShowModal] = useState(false);

  const handleFakeClose = (e) => {
    e.stopPropagation();
    setShowModal(true);
  };

  if (!meme.text) return null;

  return (
    <div
      onClick={generateMeme}
      className={`fixed top-20 w-72 p-3 bg-white border border-slate-200 shadow-2xl animate-pulse rounded-2xl font-serif text-left cursor-pointer hover:scale-105 hover:animate-none transition-transform duration-200 z-50
        ${position === 'left' ? 'left-6 hidden xl:block' : 'right-6 hidden xl:block'}`}
    >
      <IconButton
        variant="danger"
        size="sm"
        onClick={handleFakeClose}
        aria-label="Закрыть"
        className="absolute -top-3 -right-3 z-10"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </IconButton>

      <div className="text-rose-700 font-extrabold text-sm text-center mb-2 uppercase tracking-tight drop-shadow-[0_1px_0_rgba(255,255,255,1)]">
        {meme.header}
      </div>

      <div
        className="w-full h-96 bg-slate-100 border border-slate-200 rounded-lg bg-cover bg-center mb-2 transition-all duration-300"
        style={{ backgroundImage: `url(${meme.image})` }}
      />

      <p className="text-sm font-semibold text-slate-900 leading-snug bg-slate-50 p-2 rounded-lg border border-slate-100 min-h-[56px] flex items-center">
        {meme.text}
      </p>

      <div className="mt-2 text-xs uppercase font-black text-center text-white bg-violet-600 py-1.5 rounded-lg animate-bounce shadow-md shadow-violet-500/20">
        Узнать подробности 👍
      </div>

      <FakeCloseModal visible={showModal} onClose={() => setShowModal(false)} />
    </div>
  );
}

function MobileStrip({ getImageUrl, getRandomText }) {
  const { meme, generateMeme } = useMemeRotation(getImageUrl, getRandomText);
  const [showModal, setShowModal] = useState(false);

  if (!meme.text) return null;

  return (
    <>
      <div
        onClick={generateMeme}
        className="fixed bottom-0 left-0 right-0 z-50 flex items-center gap-2 px-3 py-3 bg-white border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.15)] cursor-pointer active:scale-[0.99] transition-transform xl:hidden"
      >
        <div
          className="w-12 h-12 shrink-0 rounded-lg bg-slate-100 border border-slate-200 bg-cover bg-center"
          style={{ backgroundImage: `url(${meme.image})` }}
        />
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-black text-rose-600 uppercase tracking-wider truncate">
            {meme.header}
          </div>
          <p className="text-xs font-semibold text-slate-800 leading-snug line-clamp-2">
            {meme.text}
          </p>
        </div>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setShowModal(true); }}
          className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors active:scale-90"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <FakeCloseModal visible={showModal} onClose={() => setShowModal(false)} />
    </>
  );
}

export function MemeAdBanner() {
  const [phrases, setPhrases] = useState([]);
  const [images, setImages] = useState([]);
  const [ready, setReady] = useState(false);
  const lastImageRef = useRef(null);
  const lastTextRef = useRef(null);

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/api/memes/texts`).then((r) => r.json()),
      fetch(`${API_BASE}/api/memes/images`).then((r) => r.json()),
    ])
      .then(([textsData, imagesData]) => {
        setPhrases(textsData.texts || []);
        setImages(imagesData.images || []);
        setReady(true);
      })
      .catch(() => setReady(false));
  }, []);

  const getImageUrl = useCallback(() => {
    if (images.length === 0) return `https://placehold.co/300x500/slate/white?text=No+Memes`;
    let available = images;
    if (images.length > 1 && lastImageRef.current) {
      available = images.filter((img) => img !== lastImageRef.current);
    }
    const chosen = available[Math.floor(Math.random() * available.length)];
    lastImageRef.current = chosen;
    return `${API_BASE}${chosen}`;
  }, [images]);

  const getRandomText = useCallback(() => {
    if (phrases.length === 0) return '';
    let available = phrases;
    if (phrases.length > 1 && lastTextRef.current) {
      available = phrases.filter((t) => t !== lastTextRef.current);
    }
    const chosen = available[Math.floor(Math.random() * available.length)];
    lastTextRef.current = chosen;
    return chosen;
  }, [phrases]);

  if (!ready) return null;

  return (
    <>
      <SingleAdItem getImageUrl={getImageUrl} getRandomText={getRandomText} position="left" />
      <SingleAdItem getImageUrl={getImageUrl} getRandomText={getRandomText} position="right" />
      <MobileStrip getImageUrl={getImageUrl} getRandomText={getRandomText} />
    </>
  );
}