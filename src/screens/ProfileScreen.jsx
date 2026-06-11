import { useState, useEffect } from 'react';
import { BackButton } from '../components/BackButton';
import { RedButton } from '../components/RedButton';
import { ScoreBadge } from '../components/ScoreBadge';
import { RankBadge } from '../components/RankBadge';
import { GenreRadar } from '../components/GenreRadar';
import { getGenreEmoji } from '../utils/genreUtils';
import { authApi } from '../api';
import { getRank } from '../constants/ranks';
export function ProfileScreen({ username, coins, isAdmin, onBack, onLogout, onOpenInventory, onOpenAdmin }) {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authApi.getProfile()
      .then((data) => { setProfile(data); setLoading(false); })
      .catch((err) => { setError(err.message); setLoading(false); });
  }, []);

  if (loading) {
    return (
      <div className="py-2">
        <div className="mb-6"><BackButton onClick={onBack} /></div>
        <div className="flex items-center justify-center py-24 text-slate-500">
          ⏳ Загрузка профиля...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-2">
        <div className="mb-6"><BackButton onClick={onBack} /></div>
        <div className="text-center py-16 bg-slate-900/20 border border-dashed border-rose-500/30 rounded-xl">
          <p className="text-rose-400 font-medium mb-2">⚠️ Ошибка загрузки профиля</p>
          <p className="text-slate-500 text-sm mb-6">{error}</p>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const rank = getRank(profile.gameCount);

  return (
    <div className="py-2">
      <div className="flex items-center justify-between mb-6">
        <BackButton onClick={onBack} />
      </div>

      <div className="flex flex-col items-center mb-10">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-3xl font-black text-white shadow-lg shadow-violet-500/30 mb-4">
          {username[0].toUpperCase()}
        </div>
        <h2 className={`text-2xl font-black ${rank.labelClass}`}>{profile.username}</h2>
      </div>

      <RankBadge gameCount={profile.gameCount} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
        <StatCard
          icon="🎮"
          label="Оценено игр"
          value={profile.gameCount}
          subtitle={profile.gameCount === 0 ? 'Пора добавить первую!' : null}
        />

        <StatCard
          icon="🪙"
          label="Монеты"
          value={coins}
          subtitle="Копи для казино"
        />

        <StatCard
          icon="⭐"
          label="Лучшая игра"
          value={profile.bestGame ? profile.bestGame.title : '—'}
          subtitle={profile.bestGame ? <ScoreBadge score={profile.bestGame.score} isFinal /> : null}
        />

        <StatCard
          icon="🏷️"
          label="Любимые жанры"
          value={null}
          subtitle={null}
        >
          {profile.topGenres.length === 0 ? (
            <p className="text-sm text-slate-500">Нет оценённых игр</p>
          ) : (
            <>
              <GenreRadar genres={profile.topGenres} maxCount={profile.topGenres[0].count} />
              <div className="flex flex-wrap gap-2 mt-3 justify-center">
                {profile.topGenres.map((g) => (
                  <span
                    key={g.genre}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700/50 text-sm font-medium text-slate-200"
                  >
                    <span>{getGenreEmoji(g.genre)}</span>
                    {g.genre}
                    <span className="text-xs text-slate-500 ml-1">×{g.count}</span>
                  </span>
                ))}
              </div>
            </>
          )}
        </StatCard>
      </div>

      <div className="flex justify-center pt-4 border-t border-slate-700/40">
        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={onOpenInventory}
            className="px-6 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold rounded-xl transition-all cursor-pointer active:scale-95 text-sm"
          >
            🎒 Инвентарь
          </button>
          {isAdmin && (
            <button
              type="button"
              onClick={onOpenAdmin}
              className="px-6 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold rounded-xl transition-all cursor-pointer active:scale-95 text-sm"
            >
              👑 Админ-панель
            </button>
          )}
          <RedButton
            text="🚪 Выйти из аккаунта"
            onClick={onLogout}
            width={320}
            height={48}
            fontSize={14}
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, subtitle, children }) {
  return (
    <div className="bg-slate-900/40 border border-slate-700/40 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{icon}</span>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</p>
      </div>
      {value !== null && (
        <p className="text-lg font-black text-slate-100 break-words">{value}</p>
      )}
      {subtitle && (
        <div className="mt-1">{subtitle}</div>
      )}
      {children}
    </div>
  );
}
