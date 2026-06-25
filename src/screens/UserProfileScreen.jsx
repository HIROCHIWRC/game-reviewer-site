import { useState, useEffect } from 'react';
import { BackButton } from '../components/BackButton';
import { ScoreBadge } from '../components/ScoreBadge';
import { RankBadge } from '../components/RankBadge';
import { GenreRadar } from '../components/GenreRadar';
import { getGenreEmoji } from '../utils/genreUtils';
import { authApi } from '../api';
import { getRank } from '../constants/ranks';
import { assetUrl } from '../config';

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

export function UserProfileScreen({ profileUsername, onBack, onOpenCard }) {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authApi.getUserProfile(profileUsername)
      .then((data) => { setProfile(data); setLoading(false); })
      .catch((err) => { setError(err.message); setLoading(false); });
  }, [profileUsername]);

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
          {profile.username[0].toUpperCase()}
        </div>
        <h2 className={`text-2xl font-black ${rank.labelClass}`}>{profile.username}</h2>
      </div>

      <RankBadge gameCount={profile.gameCount} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
        <StatCard
          icon="🎮"
          label="Оценено игр"
          value={profile.gameCount}
          subtitle={profile.gameCount === 0 ? 'Пока нет обзоров' : null}
        />

        <StatCard
          icon="⭐"
          label="Лучшая игра"
          value={profile.bestGame ? profile.bestGame.title : '—'}
          subtitle={profile.bestGame ? <ScoreBadge score={profile.bestGame.score} isFinal /> : null}
        />

        <StatCard
          icon="🪙"
          label="Монеты"
          value={profile.coins}
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

      {profile.games && profile.games.length > 0 && (
        <div className="mt-10">
          <h3 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400 mb-4">
            📋 Обзоры пользователя ({profile.games.length})
          </h3>
          <div className="overflow-x-auto rounded-xl border border-slate-700/60 bg-slate-900/30">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/80 border-b border-slate-700/80 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-4 px-3 text-center text-slate-500 w-14">Обложка</th>
                  <th className="py-4 px-4">Название</th>
                  <th className="py-4 px-3">Жанр</th>
                  <th className="py-4 px-3 text-center">Геймплей</th>
                  <th className="py-4 px-3 text-center">Атмосфера</th>
                  <th className="py-4 px-3 text-center">Сюжет</th>
                  <th className="py-4 px-3 text-center">Звук</th>
                  <th className="py-4 px-3 text-center">Техн.</th>
                  <th className="py-4 px-3 text-center">Впечатление</th>
                  <th className="py-4 px-5 text-center bg-violet-950/20 text-violet-300 border-l border-slate-700/30">
                    Итог
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-sm">
                {profile.games.map((game) => (
                  <tr
                    key={game.id}
                    onClick={() => onOpenCard(game)}
                    className="transition-colors cursor-pointer hover:bg-slate-800/40"
                  >
                    <td className="py-3 px-3 text-center">
                      <div className="relative w-9 h-9 mx-auto">
                        {game.coverUrl && (
                          <img
                            key={game.coverUrl}
                            src={assetUrl(game.coverUrl)}
                            alt=""
                            className="absolute inset-0 w-full h-full rounded object-cover z-10"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        )}
                        <div className="w-9 h-9 bg-slate-800 border border-slate-700/40 rounded flex items-center justify-center text-xs text-slate-500 font-mono select-none">
                          —
                        </div>
                      </div>
                    </td>
                    <td
                      className="py-3.5 px-4 font-bold text-slate-200 max-w-[160px] truncate"
                      title={game.title}
                    >
                      {game.title}
                    </td>
                    <td className="py-3.5 px-3 text-slate-400">
                      <span className="px-2 py-0.5 bg-slate-800 rounded-md border border-slate-700/40 text-xs">
                        {game.genre}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-center"><ScoreBadge score={game.scores.gameplay} /></td>
                    <td className="py-3.5 px-3 text-center"><ScoreBadge score={game.scores.atmosphere} /></td>
                    <td className="py-3.5 px-3 text-center"><ScoreBadge score={game.scores.story} /></td>
                    <td className="py-3.5 px-3 text-center"><ScoreBadge score={game.scores.music} /></td>
                    <td className="py-3.5 px-3 text-center"><ScoreBadge score={game.scores.technical} /></td>
                    <td className="py-3.5 px-3 text-center"><ScoreBadge score={game.scores.impression} /></td>
                    <td className="py-3.5 px-5 text-center font-black bg-violet-950/10 border-l border-slate-700/30">
                      <ScoreBadge score={game.scores.overall} isFinal />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}