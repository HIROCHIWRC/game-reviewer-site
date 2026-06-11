import { useState, useEffect } from 'react';
import { BackButton } from '../components/BackButton';
import { RedButton } from '../components/RedButton';
import { adminApi } from '../api';

function ResultBanner({ message, onClose }) {
  if (!message) return null;
  return (
    <div className="mb-4 px-4 py-2.5 bg-slate-800 border border-slate-600/50 rounded-xl text-sm text-slate-200 flex items-center gap-3">
      <span className="flex-1">{message}</span>
      <button type="button" onClick={onClose} className="text-slate-500 hover:text-slate-300 cursor-pointer">✕</button>
    </div>
  );
}

export function AdminScreen({ onBack }) {
  const [tab, setTab] = useState('users');

  return (
    <div className="py-2">
      <div className="mb-4"><BackButton onClick={onBack} /></div>
      <h2 className="text-xl font-bold text-slate-100 mb-4">👑 Админ-панель</h2>

      <div className="flex gap-2 mb-6">
        <button
          type="button"
          onClick={() => setTab('users')}
          className={`px-4 py-2 rounded-lg text-sm font-bold cursor-pointer transition-all ${
            tab === 'users' ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          👥 Пользователи
        </button>
        <button
          type="button"
          onClick={() => setTab('memes')}
          className={`px-4 py-2 rounded-lg text-sm font-bold cursor-pointer transition-all ${
            tab === 'memes' ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          🃏 Мемы
        </button>
      </div>

      {tab === 'users' && <UsersPanel />}
      {tab === 'memes' && <MemesPanel />}
    </div>
  );
}

function UsersPanel() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editCoins, setEditCoins] = useState({});
  const [result, setResult] = useState(null);

  useEffect(() => {
    adminApi.getUsers().then((data) => {
      setUsers(data);
      setLoading(false);
    }).catch((err) => {
      setError(err.message);
      setLoading(false);
    });
  }, []);

  const reload = () => {
    adminApi.getUsers().then((data) => { setUsers(data); }).catch(() => {});
  };

  const handleDelete = async (user) => {
    if (!confirm(`Удалить пользователя "${user.username}"?\nВсе его отзывы, инвентарь и сообщения будут удалены.`)) return;
    try {
      const data = await adminApi.deleteUser(user.id);
      setResult(data.message);
      reload();
    } catch (err) {
      setResult(`❌ ${err.message}`);
    }
  };

  const handleSetCoins = async (userId) => {
    const val = editCoins[userId];
    if (val == null || isNaN(val) || val < 0 || val > 999999) return;
    try {
      const data = await adminApi.setCoins(userId, Number(val));
      setResult(data.message);
      setEditCoins((prev) => ({ ...prev, [userId]: undefined }));
      reload();
    } catch (err) {
      setResult(`❌ ${err.message}`);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-24 text-slate-500">⏳ Загрузка пользователей...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-16 bg-slate-900/20 border border-dashed border-rose-500/30 rounded-xl">
        <p className="text-rose-400 font-medium mb-2">⚠️ {error}</p>
        <button
          type="button"
          onClick={() => { setError(null); setLoading(true); adminApi.getUsers().then((data) => { setUsers(data); setLoading(false); }).catch((err) => { setError(err.message); setLoading(false); }); }}
          className="px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl transition-all cursor-pointer active:scale-95"
        >
          🔄 Повторить
        </button>
      </div>
    );
  }

  return (
    <>
      <ResultBanner message={result} onClose={() => setResult(null)} />
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="text-slate-500 text-xs uppercase border-b border-slate-700/50">
              <th className="pb-2 pr-2">ID</th>
              <th className="pb-2 pr-2">Имя</th>
              <th className="pb-2 pr-2">Отзывы</th>
              <th className="pb-2 pr-2">Монеты</th>
              <th className="pb-2 pr-2">Админ</th>
              <th className="pb-2 pr-2">Действия</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                <td className="py-3 pr-2 text-slate-400">{u.id}</td>
                <td className="py-3 pr-2 font-medium text-slate-100">{u.username}</td>
                <td className="py-3 pr-2 text-slate-400">{u.reviewCount}</td>
                <td className="py-3 pr-2">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={0}
                      max={999999}
                      value={editCoins[u.id] ?? u.coins}
                      onChange={(e) => setEditCoins((prev) => ({ ...prev, [u.id]: e.target.value }))}
                      className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-sm text-slate-100 focus:outline-none focus:border-violet-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleSetCoins(u.id)}
                      disabled={editCoins[u.id] == null || editCoins[u.id] === '' || isNaN(editCoins[u.id])}
                      className="px-2 py-1 text-xs font-bold bg-violet-600 hover:bg-violet-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg cursor-pointer disabled:cursor-not-allowed active:scale-95 transition-all"
                    >
                      💾
                    </button>
                  </div>
                </td>
                <td className="py-3 pr-2">{u.isAdmin ? <span className="text-amber-400">👑</span> : <span className="text-slate-600">—</span>}</td>
                <td className="py-3 pr-2">
                  <RedButton
                    text="🗑"
                    onClick={() => handleDelete(u)}
                    width={36}
                    height={32}
                    fontSize={14}
                    title={`Удалить ${u.username}`}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {users.length === 0 && <p className="text-slate-500 text-center py-12">Нет пользователей</p>}
    </>
  );
}

function MemesPanel() {
  const [texts, setTexts] = useState([]);
  const [images, setImages] = useState([]);
  const [newText, setNewText] = useState('');
  const [result, setResult] = useState(null);
  const [uploading, setUploading] = useState(false);

  const loadTexts = () => {
    adminApi.getMemeTexts().then((data) => setTexts(data.texts || [])).catch(() => {});
  };

  const loadImages = () => {
    adminApi.getMemeImages().then((data) => setImages(data.images || [])).catch(() => {});
  };

  useEffect(() => { loadTexts(); loadImages(); }, []);

  const handleAddText = async () => {
    const trimmed = newText.trim();
    if (!trimmed) return;
    try {
      const data = await adminApi.addMemeText(trimmed);
      setResult(data.message);
      setNewText('');
      loadTexts();
    } catch (err) {
      setResult(`❌ ${err.message}`);
    }
  };

  const handleDeleteText = async (idx) => {
    try {
      const data = await adminApi.deleteMemeText(idx);
      setResult(data.message);
      loadTexts();
    } catch (err) {
      setResult(`❌ ${err.message}`);
    }
  };

  const handleUploadImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(file.type)) {
      setResult('❌ Только изображения (png, jpg, webp, gif)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setResult('❌ Файл больше 5MB');
      return;
    }
    setUploading(true);
    try {
      const data = await adminApi.uploadMemeImage(file);
      setResult(data.message);
      loadImages();
    } catch (err) {
      setResult(`❌ ${err.message}`);
    }
    setUploading(false);
    e.target.value = '';
  };

  const handleDeleteImage = async (url) => {
    const filename = url.split('/').pop();
    if (!confirm(`Удалить файл "${filename}"?`)) return;
    try {
      const data = await adminApi.deleteMemeImage(filename);
      setResult(data.message);
      loadImages();
    } catch (err) {
      setResult(`❌ ${err.message}`);
    }
  };

  return (
    <div className="space-y-8">
      <ResultBanner message={result} onClose={() => setResult(null)} />

      {/* Тексты */}
      <div>
        <h3 className="text-lg font-bold text-slate-100 mb-3">📝 Фразы для мемов ({texts.length})</h3>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAddText(); }}
            placeholder="Введите новую фразу..."
            maxLength={500}
            className="flex-1 bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-violet-500"
          />
          <button
            type="button"
            onClick={handleAddText}
            disabled={!newText.trim()}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold rounded-xl cursor-pointer active:scale-95 transition-all text-sm"
          >
            ➕
          </button>
        </div>
        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
          {texts.length === 0 && <p className="text-slate-500 text-sm">Нет фраз</p>}
          {texts.map((t, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-2 bg-slate-900/40 border border-slate-800 rounded-lg text-sm">
              <span className="text-xs text-slate-500 shrink-0">#{i}</span>
              <span className="flex-1 text-slate-200 truncate">{t}</span>
              <button
                type="button"
                onClick={() => handleDeleteText(i)}
                className="text-rose-400 hover:text-rose-300 cursor-pointer shrink-0"
                title="Удалить"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Изображения */}
      <div>
        <h3 className="text-lg font-bold text-slate-100 mb-3">🖼️ Изображения ({images.length})</h3>
        <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl cursor-pointer active:scale-95 transition-all text-sm mb-3">
          {uploading ? '⏳' : '📁 Загрузить'}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={handleUploadImage}
            disabled={uploading}
            className="hidden"
          />
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {images.length === 0 && <p className="text-slate-500 text-sm col-span-full">Нет изображений</p>}
          {images.map((url) => {
            const filename = url.split('/').pop();
            return (
              <div key={url} className="relative group aspect-[4/3] bg-slate-900/60 border border-slate-700/50 rounded-lg overflow-hidden">
                <img src={url} alt={filename} className="w-full h-full object-contain" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => handleDeleteImage(url)}
                    className="opacity-0 group-hover:opacity-100 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg cursor-pointer transition-all"
                  >
                    🗑 Удалить
                  </button>
                </div>
                <div className="absolute bottom-0 left-0 right-0 px-2 py-1 bg-black/70 text-[10px] text-slate-400 truncate">{filename}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
