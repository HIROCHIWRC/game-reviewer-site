import { useState, useEffect, useRef } from 'react';
import { YellowButton } from '../components/YellowButton';
import { BackButton } from '../components/BackButton';
import { Autocomplete } from '../components/Autocomplete';
import { FormSelect } from '../components/FormSelect';
import { ScoreSlider } from '../components/ScoreSlider';
import { InfoButton } from '../components/InfoButton';
import { gamesApi } from '../api';
import { GENRES } from '../constants/gameConstants';

export function AddGameScreen({ form, setFormField, currentOverallScore, isEditing, onSave, onBack }) {
  const [showInfo, setShowInfo] = useState(false);
  const [existingTitles, setExistingTitles] = useState([]);
  const [coverLoading, setCoverLoading] = useState(false);
  const [coverError, setCoverError] = useState(false);
  const fetchingRef = useRef(false);
  const coverFetchId = useRef(0);
  const coverFallbackRef = useRef('');

  useEffect(() => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    gamesApi.getTitles()
      .then(setExistingTitles)
      .catch(() => {});
  }, []);

  const fetchCover = (title) => {
    if (isEditing || !title.trim()) return;
    const id = ++coverFetchId.current;
    setCoverLoading(true);
    gamesApi.fetchCover(title.trim())
      .then((data) => {
        if (id !== coverFetchId.current) return;
        coverFallbackRef.current = data?.posterUrl || data?.iconUrl || '';
        if (typeof data?.iconUrl === 'string' && data.iconUrl) {
          setCoverError(false);
          setFormField('coverUrl')(data.iconUrl);
        }
        if (typeof data?.posterUrl === 'string' && data.posterUrl) {
          setFormField('posterUrl')(data.posterUrl);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (id === coverFetchId.current) setCoverLoading(false);
      });
  };

  const handleTitleChange = (e) => {
    setFormField('title')(e.target.value);
  };

  const handleTitleBlur = () => {
    if (form.title.trim()) fetchCover(form.title);
  };

  const handleTitleSelect = (item) => {
    setFormField('title')(item.title);
    setFormField('genre')(item.genre);
    fetchCover(item.title);
  };

  return (
    <div className="py-2">
      {/* Шапка */}
      <div className="flex justify-between items-center mb-6">
        <BackButton onClick={onBack} />
        <InfoButton active={showInfo} onToggle={() => setShowInfo((v) => !v)} />
      </div>

      {/* Инфо-панель с весами */}
      {showInfo && (
        <div className="mb-8 p-5 rounded-xl bg-slate-900/80 border border-violet-500/40 text-left text-sm text-slate-300 space-y-3 shadow-2xl">
          <h4 className="font-bold text-violet-400 flex items-center gap-2">
            <span>🧠</span> Система весовых коэффициентов
          </h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Итоговый балл рассчитывается автоматически. Каждый критерий умножается на свой индекс важности,
            после чего сумма делится на сумму множителей активных параметров.
          </p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 pt-1 text-xs border-t border-slate-800">
            <div>🎮 Геймплей: <span className="text-amber-400 font-bold">x3</span></div>
            <div>🎵 Звук и Музыка: <span className="text-slate-400 font-bold">x1</span></div>
            <div>🌌 Атмосфера: <span className="text-amber-400 font-bold">x2</span></div>
            <div>🛠 Тех. часть: <span className="text-slate-400 font-bold">x1</span></div>
            <div>📜 Сюжет: <span className="text-amber-400 font-bold">x2</span></div>
            <div>❤️ Впечатление: <span className="text-slate-400 font-bold">x1</span></div>
          </div>
        </div>
      )}

      <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500 mb-8">
        {isEditing ? '✏️ Редактирование игры' : '🎮 Оценка новой игры'}
      </h2>

      <div className="space-y-6 text-left">
        {/* Название и жанр */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Autocomplete
            label="Название игры"
            value={form.title}
            onChange={handleTitleChange}
            onBlur={handleTitleBlur}
            onSelect={handleTitleSelect}
            options={existingTitles}
            placeholder="Например, Minecraft..."
          />
          <FormSelect
            label="Жанр"
            value={form.genre}
            onChange={(e) => setFormField('genre')(e.target.value)}
            options={GENRES}
          />
        </div>

        <div className="mt-3 flex justify-center">
          {coverLoading ? (
            <div className="h-40 w-full max-w-xs rounded-xl border border-dashed border-slate-700/30 bg-slate-900/30 flex items-center justify-center text-slate-600 text-sm">
              🔍 Ищем обложку...
            </div>
          ) : coverError ? (
            <div className="h-40 w-full max-w-xs rounded-xl border border-dashed border-rose-500/30 bg-slate-900/40 flex items-center justify-center text-slate-600 text-sm">
              ⚠️ Обложка не загрузилась
            </div>
          ) : form.coverUrl ? (
            <img
              src={form.coverUrl}
              alt="Обложка"
              className="h-40 rounded-xl border border-slate-700/40 object-cover"
              onError={() => {
                if (coverFallbackRef.current && form.coverUrl !== coverFallbackRef.current) {
                  setFormField('coverUrl')(coverFallbackRef.current);
                } else {
                  setCoverError(true);
                }
              }}
              onLoad={() => setCoverError(false)}
            />
          ) : (
            <div className="w-40 h-40 rounded-xl border border-dashed border-slate-700/20 bg-slate-900/20 flex items-center justify-center text-slate-700 select-none">
              <svg className="w-10 h-10 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>

        <hr className="border-slate-700/50 my-8" />

        {/* Слайдеры оценок */}
        <div className="space-y-5">
          <h3 className="text-lg font-bold text-slate-300 mb-4">Параметры оценки (1 - 10)</h3>

          <ScoreSlider
            label="🎮 Геймплей (x3)"
            value={form.gameplay}
            onChange={setFormField('gameplay')}
          />
          <ScoreSlider
            label="🌌 Атмосфера (x2)"
            value={form.atmosphere}
            onChange={setFormField('atmosphere')}
            hasToggle={true}
            toggleValue={form.hasAtmosphere}
            onToggleChange={setFormField('hasAtmosphere')}
            toggleOptions={{ yes: 'Есть в игре', no: 'Неоценимо / Нет' }}
          />
          <ScoreSlider
            label="📜 Сюжет (x2)"
            value={form.story}
            onChange={setFormField('story')}
            hasToggle={true}
            toggleValue={form.hasStory}
            onToggleChange={setFormField('hasStory')}
            toggleOptions={{ yes: 'Есть сюжет', no: 'Нет сюжета' }}
          />
          <ScoreSlider
            label="🎵 Музыка и Звук (x1)"
            value={form.music}
            onChange={setFormField('music')}
            hasToggle={true}
            toggleValue={form.hasMusic}
            onToggleChange={setFormField('hasMusic')}
            toggleOptions={{ yes: 'Есть саундтрек', no: 'Без музыки' }}
          />
          <ScoreSlider
            label="🛠 Техническая часть (x1)"
            value={form.technical}
            onChange={setFormField('technical')}
          />
          <ScoreSlider
            label="❤️ Общее впечатление (x1)"
            value={form.impression}
            onChange={setFormField('impression')}
            variant="amber"
          />

          {/* Итоговый балл */}
          <div className="mt-8 p-4 rounded-xl bg-slate-900/60 border border-violet-500/30 flex items-center justify-between">
            <div>
              <h4 className="font-bold text-violet-400">🤖 Итоговый коэффициентный балл</h4>
              <p className="text-xs text-slate-400 mt-0.5">Все ползунки пересчитаны с учётом веса их важности</p>
            </div>
            <div className="text-3xl font-black text-fuchsia-400 drop-shadow-[0_0_8px_rgba(232,121,249,0.3)]">
              {currentOverallScore} <span className="text-sm text-slate-500 font-normal">/ 10</span>
            </div>
          </div>
        </div>

        {/* Комментарий */}
        <div className="mt-8">
          <label className="block text-sm font-bold text-slate-400 mb-2 uppercase tracking-wider">
            💬 Комментарий
          </label>
          <textarea
            value={form.comment}
            onChange={(e) => {
              if (e.target.value.length <= 500) setFormField('comment')(e.target.value);
            }}
            placeholder="Впечатления, заметки, мысли об игре... (до 500 символов)"
            rows={4}
            className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 transition-all duration-200 resize-none"
          />
          <div className="flex justify-end mt-1">
            <span className={`text-xs ${form.comment.length >= 450 ? 'text-rose-400 font-bold' : 'text-slate-500'}`}>
              {form.comment.length}/500
            </span>
          </div>
        </div>

        {/* Кнопка сохранения */}
        <div className="pt-6 flex justify-end">
          <YellowButton text={isEditing ? "💾 Сохранить изменения" : "💾 Сохранить в рейтинг"} onClick={onSave} />
        </div>
      </div>
    </div>
  );
}