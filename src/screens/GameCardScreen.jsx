import { useState, useEffect } from 'react';
import { BackButton } from '../components/BackButton';
import { ScoreBadge } from '../components/ScoreBadge';
import { assetUrl } from '../config';
import { calculateOverallScore } from '../utils/scoreUtils';
import { getRank } from '../constants/ranks';
import { gamesApi } from '../api';

function avg(arr) {
  const vals = arr.filter((v) => v !== null);
  return vals.length === 0 ? null : Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) / 100;
}

function majorityGenre(games) {
  const freq = {};
  games.forEach((g) => { freq[g.genre] = (freq[g.genre] || 0) + 1; });
  return Object.keys(freq).reduce((a, b) => (freq[a] > freq[b] ? a : b));
}

function aggregateScores(games) {
  if (games.length === 1) {
    return { ...games[0].scores, overall: games[0].scores.overall };
  }

  const gameplay = avg(games.map((g) => g.scores.gameplay));
  const technical = avg(games.map((g) => g.scores.technical));
  const impression = avg(games.map((g) => g.scores.impression));

  const half = games.length / 2;
  const atmosNulls = games.filter((g) => g.scores.atmosphere === null).length;
  const storyNulls = games.filter((g) => g.scores.story === null).length;
  const musicNulls = games.filter((g) => g.scores.music === null).length;

  const atmosphere = atmosNulls > half ? null : avg(games.map((g) => g.scores.atmosphere));
  const story = storyNulls > half ? null : avg(games.map((g) => g.scores.story));
  const music = musicNulls > half ? null : avg(games.map((g) => g.scores.music));

  const overall = calculateOverallScore({
    gameplay, atmosphere, story, music, technical, impression,
    hasAtmosphere: atmosphere !== null,
    hasStory: story !== null,
    hasMusic: music !== null,
  });

  return { gameplay, atmosphere, story, music, technical, impression, overall };
}

function CommentSection({ comments, onViewProfile }) {
  const hasAny = comments.some((c) => c.text);
  if (!hasAny) {
    return (
      <p className="text-sm text-slate-500 italic">Комментариев нет</p>
    );
  }

  return (
    <div className="space-y-4">
      {comments.map((c, i) =>
        c.text ? (
          <div key={i} className="bg-slate-900/40 border border-slate-700/40 rounded-xl p-4">
            {c.username ? (
              <button
                type="button"
                onClick={() => onViewProfile(c.username)}
                className={`text-sm font-bold tracking-wide mb-1 cursor-pointer transition-colors ${c.rankClass} hover:opacity-80`}
              >
                {c.author}
              </button>
            ) : (
              <p className="text-xs font-bold text-slate-500 tracking-wide mb-1">{c.author}</p>
            )}
            <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap break-words">{c.text}</p>
          </div>
        ) : null
      )}
    </div>
  );
}

export function GameCardScreen({ games, onBack, onViewProfile }) {
  const game = games[0];
  if (!game) return null;

  const reviewCount = games.length;
  const scores = aggregateScores(games);
  const genre = majorityGenre(games);
  const isMyReview = reviewCount === 1 && !game.owner;
  const ownerRank = game.owner ? getRank(game.ownerGameCount || 0) : null;
  const allComments = games.map((g) => {
    const rank = g.owner ? getRank(g.ownerGameCount || 0) : null;
    return { text: g.comment, author: g.owner || 'Мой комментарий', username: g.owner || null, rankClass: rank ? rank.labelClass : '' };
  });
  const hasComments = allComments.some((c) => c.text);

  const [communityComments, setCommunityComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [sending, setSending] = useState(false);

  const loadComments = () => {
    gamesApi.getComments(game.title).then((data) => setCommunityComments(data)).catch(() => {});
  };

  useEffect(() => { loadComments(); }, [game.title]);

  const handleSendComment = async () => {
    const trimmed = newComment.trim();
    if (!trimmed) return;
    setSending(true);
    try {
      await gamesApi.addComment(game.title, trimmed);
      setNewComment('');
      loadComments();
    } catch (err) {
      alert(err.message);
    }
    setSending(false);
  };

  return (
    <div className="py-2">
      <BackButton onClick={onBack} />

      <div className="mt-6 flex flex-col lg:flex-row gap-8">
        {/* Левая колонка — обложка */}
        <div className="shrink-0 w-full lg:w-72">
          <div className="relative w-full aspect-[3/4] bg-slate-800 border border-slate-700/40 rounded-2xl flex items-center justify-center text-slate-600 overflow-hidden">
            {(game.posterUrl || game.coverUrl) && (
              <img
                key={game.posterUrl || game.coverUrl}
                src={assetUrl(game.posterUrl || game.coverUrl)}
                alt={game.title}
                className="absolute inset-0 w-full h-full object-cover"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            )}
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        </div>

        {/* Правая колонка — информация */}
        <div className="flex-1 min-w-0">
          <h2 className="text-3xl font-black text-slate-100 mb-1 break-words">{game.title}</h2>
          <p className="text-sm font-bold text-violet-400 uppercase tracking-wider mb-4">{genre}</p>

          {/* Средние по категориям */}
          <CategoryBars scores={scores} />

          {/* Итоговый балл + количество обзоров */}
          <div className="flex items-center gap-4 mb-8 flex-wrap">
            <div className="inline-flex items-center gap-3 px-5 py-3 rounded-xl bg-violet-950/30 border border-violet-500/30">
              <span className="text-sm font-bold text-violet-400 uppercase tracking-wider">Итог</span>
              <ScoreBadge score={scores.overall} isFinal />
              {isMyReview && (
                <span className="text-xs font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded-lg ml-2">
                  Мой обзор
                </span>
              )}
              {reviewCount === 1 && game.owner && (
                <button
                  type="button"
                  onClick={() => onViewProfile(game.owner)}
                  className={`text-xs font-bold bg-slate-800 border border-slate-700/40 px-2 py-0.5 rounded-lg ml-2 cursor-pointer transition-colors hover:opacity-80 ${ownerRank ? ownerRank.labelClass : 'text-slate-400'}`}
                >
                  {game.owner}
                </button>
              )}
            </div>
            {reviewCount > 1 && (
              <span className="text-sm text-slate-400">
                По итогам <span className="font-bold text-violet-400">{reviewCount}</span> обзоров
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Комментарии обзоров */}
      <div className="mt-8">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">
          💬 Комментарии из обзоров {hasComments && `(${allComments.filter((c) => c.text).length})`}
        </h3>
        <CommentSection comments={allComments} onViewProfile={onViewProfile} />
      </div>

      {/* Комментарии сообщества */}
      <div className="mt-8">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">
          🗨️ Обсуждение {communityComments.length > 0 && `(${communityComments.length})`}
        </h3>
        <div className="space-y-3 mb-4">
          {communityComments.length === 0 && (
            <p className="text-sm text-slate-500 italic">Пока нет обсуждений. Будь первым!</p>
          )}
          {communityComments.map((c) => {
            const rank = getRank(c.gameCount || 0);
            return (
              <div key={c.id} className="bg-slate-900/40 border border-slate-700/40 rounded-xl p-4">
                <button
                  type="button"
                  onClick={() => onViewProfile(c.username)}
                  className={`text-sm font-bold tracking-wide mb-1 cursor-pointer transition-colors ${rank.labelClass} hover:opacity-80`}
                >
                  {c.username}
                </button>
                <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap break-words">{c.text}</p>
                <p className="text-[10px] text-slate-600 mt-1">{c.createdAt?.slice(0, 16).replace('T', ' ')}</p>
              </div>
            );
          })}
        </div>
        <div className="flex gap-2">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Написать комментарий..."
            maxLength={500}
            rows={2}
            className="flex-1 bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-violet-500 resize-none"
          />
          <button
            type="button"
            onClick={handleSendComment}
            disabled={!newComment.trim() || sending}
            className="self-end px-4 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold rounded-xl cursor-pointer disabled:cursor-not-allowed active:scale-95 transition-all text-sm"
          >
            {sending ? '⏳' : '📤'}
          </button>
        </div>
        <p className="text-right text-[10px] text-slate-600 mt-1">{newComment.length}/500</p>
      </div>

    </div>
  );
}

function CategoryBars({ scores }) {
  const ORANGE_SCALE = {
    1: '#ef4444', 2: '#f75a3f', 3: '#fa7c32', 4: '#f99e1b', 5: '#eab308',
    6: '#c0e12c', 7: '#82e149', 8: '#22c55e', 9: '#10b981', 10: '#00f5a0',
  };

  const items = [
    { label: 'Геймплей', key: 'gameplay' },
    { label: 'Атмосфера', key: 'atmosphere' },
    { label: 'Сюжет', key: 'story' },
    { label: 'Музыка', key: 'music' },
    { label: 'Техника', key: 'technical' },
    { label: 'Впечатление', key: 'impression' },
  ];

  return (
    <div className="space-y-4 mb-6">
      {items.map(({ label, key }) => {
        const val = scores[key];
        if (val === null || val === undefined) return null;
        const pct = (val / 10) * 100;
        const color = ORANGE_SCALE[Math.round(Math.min(Math.max(val, 1), 10))] || '#eab308';
        return (
          <div key={key}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400">{label}</span>
              <span className="font-bold text-slate-200">{val}</span>
            </div>
            <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${pct}%`, backgroundColor: color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}