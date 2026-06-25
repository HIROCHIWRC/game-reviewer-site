import { useState } from 'react';
import { Modal } from './Modal';
import { memesApi } from '../api';

export function SuggestMemeModal({ visible, onClose }) {
  const [tab, setTab] = useState('text');
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  const handleSendText = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setSending(true);
    setResult(null);
    try {
      const data = await memesApi.suggest(trimmed);
      setResult(data.message);
      setText('');
    } catch (err) {
      setResult(`❌ ${err.message}`);
    }
    setSending(false);
  };

  const handleSendImage = async () => {
    if (!file) return;
    setSending(true);
    setResult(null);
    try {
      const data = await memesApi.suggestImage(file);
      setResult(data.message);
      setFile(null);
    } catch (err) {
      setResult(`❌ ${err.message}`);
    }
    setSending(false);
  };

  return (
    <Modal visible={visible} title="🃏 Предложить мем" onClose={onClose} size="sm">
      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={() => setTab('text')}
          className={`px-4 py-2 rounded-lg text-sm font-bold cursor-pointer transition-all ${
            tab === 'text' ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          📝 Фраза
        </button>
        <button
          type="button"
          onClick={() => setTab('image')}
          className={`px-4 py-2 rounded-lg text-sm font-bold cursor-pointer transition-all ${
            tab === 'image' ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          🖼️ Картинка
        </button>
      </div>

      {result && (
        <div className="mb-4 px-4 py-2.5 bg-slate-800 border border-slate-600/50 rounded-xl text-sm text-slate-200">
          {result}
        </div>
      )}

      {tab === 'text' ? (
        <div className="space-y-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Введи фразу для мема..."
            maxLength={500}
            rows={3}
            className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-violet-500 resize-none"
          />
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500">{text.length}/500</span>
            <button
              type="button"
              onClick={handleSendText}
              disabled={!text.trim() || sending}
              className="px-5 py-2 bg-violet-600 hover:bg-violet-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold rounded-xl cursor-pointer disabled:cursor-not-allowed active:scale-95 transition-all text-sm"
            >
              {sending ? '⏳' : '📤 Отправить'}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <label className="flex flex-col items-center gap-2 px-4 py-8 border-2 border-dashed border-slate-700 rounded-xl cursor-pointer hover:border-violet-500/50 transition-all">
            {file ? (
              <div className="text-center">
                <p className="text-sm text-slate-200 font-medium mb-1">{file.name}</p>
                <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
              </div>
            ) : (
              <>
                <svg className="w-10 h-10 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm text-slate-500">Нажми, чтобы выбрать картинку (до 2MB)</p>
              </>
            )}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="hidden"
            />
          </label>
          {file && (
            <button
              type="button"
              onClick={handleSendImage}
              disabled={sending}
              className="w-full px-5 py-2 bg-violet-600 hover:bg-violet-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold rounded-xl cursor-pointer disabled:cursor-not-allowed active:scale-95 transition-all text-sm"
            >
              {sending ? '⏳' : '📤 Отправить'}
            </button>
          )}
        </div>
      )}
    </Modal>
  );
}
