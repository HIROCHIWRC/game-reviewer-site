import { useState, useEffect } from 'react';
import { BackButton } from '../components/BackButton';
import { ScoreBadge } from '../components/ScoreBadge';
import { Pagination } from '../components/Pagination';
import { usersApi } from '../api';
import { getRank } from '../constants/ranks';

const PER_PAGE = 20;

const MEDAL_EMOJIS = { 0: '🥇', 1: '🥈', 2: '🥉' };

export function LeaderboardScreen({ onBack, onViewProfile }) {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    usersApi.getLeaderboard()
      .then((data) => { setRows(data); setLoading(false); })
      .catch((err) => { setError(err.message); setLoading(false); });
  }, []);

  if (loading) {
    return (
      <div className="py-2">
        <div className="mb-6"><BackButton onClick={onBack} /></div>
        <div className="flex items-center justify-center py-24 text-slate-500">⏳ Загрузка...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-2">
        <div className="mb-6"><BackButton onClick={onBack} /></div>
        <div className="text-center py-16 bg-slate-900/20 border border-dashed border-rose-500/30 rounded-xl">
          <p className="text-rose-400 font-medium mb-2">⚠️ Ошибка</p>
          <p className="text-slate-500 text-sm mb-6">{error}</p>
        </div>
      </div>
    );
  }

  const filtered = rows.filter((r) => r.game_count > 0);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const pagedRows = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div className="py-2">
      <div className="flex items-center justify-between mb-6">
        <BackButton onClick={onBack} />
      </div>

      <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400 mb-6">
        🏆 Лучшие пользователи
      </h2>

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/20 border border-dashed border-slate-700/50 rounded-xl">
          <p className="text-slate-500 font-medium">😴 Пока никто не добавил ни одной игры.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-700/60 bg-slate-900/30">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/80 border-b border-slate-700/80 text-xs font-bold uppercase tracking-wider text-slate-400">
                <th className="py-4 px-4 text-center w-16">#</th>
                <th className="py-4 px-4">Пользователь</th>
                <th className="py-4 px-4 text-center">Ранг</th>
                <th className="py-4 px-4 text-center">Обзоров</th>
                <th className="py-4 px-4 text-center">Средняя оценка</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-sm">
              {pagedRows.map((row, i) => {
                const rank = getRank(row.game_count);
                const globalIndex = (page - 1) * PER_PAGE + i;
                return (
                  <tr key={row.username} className={`transition-colors ${
                    globalIndex === 0 ? 'bg-yellow-500/5 hover:bg-yellow-500/10' :
                    globalIndex === 1 ? 'bg-slate-300/5 hover:bg-slate-300/10' :
                    globalIndex === 2 ? 'bg-amber-600/5 hover:bg-amber-600/10' :
                    'hover:bg-slate-800/40'
                  }`}>
                    <td className="py-3.5 px-4 text-center text-lg">
                      {MEDAL_EMOJIS[globalIndex] || <span className="text-slate-500 font-bold">{globalIndex + 1}</span>}
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={() => onViewProfile(row.username)}
                        className={`font-bold cursor-pointer transition-colors hover:opacity-80 ${rank.labelClass}`}
                      >
                        {row.username}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="text-lg">{rank.emoji}</span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-200">
                      {row.game_count}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <ScoreBadge score={row.avg_score} isFinal />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
