export const RANKS = [
  { min: 0, max: 5, name: 'Серый', emoji: '🩶', labelClass: 'text-slate-400', barClass: 'bg-slate-400' },
  { min: 5, max: 15, name: 'Бронзовый', emoji: '🥉', labelClass: 'text-transparent bg-clip-text bg-gradient-to-r from-amber-700 via-amber-200 to-amber-700', barClass: 'bg-gradient-to-r from-amber-700 via-amber-200 to-amber-700' },
  { min: 15, max: 30, name: 'Серебряный', emoji: '🌟', labelClass: 'text-transparent bg-clip-text bg-gradient-to-r from-slate-500 via-slate-100 to-slate-500', barClass: 'bg-gradient-to-r from-slate-500 via-slate-100 to-slate-500' },
  { min: 30, max: 50, name: 'Золотой', emoji: '👑', labelClass: 'text-transparent bg-clip-text bg-gradient-to-r from-yellow-700 via-yellow-200 to-yellow-700', barClass: 'bg-gradient-to-r from-yellow-700 via-yellow-200 to-yellow-700' },
  { min: 50, max: 100, name: 'Розово-фиолетовый', emoji: '💎', labelClass: 'text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-violet-400', barClass: 'bg-gradient-to-r from-pink-400 to-violet-400' },
  { min: 100, max: Infinity, name: 'Радужный', emoji: '🌈', labelClass: 'text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-yellow-400 via-green-400 via-blue-400 to-violet-400 animate-rainbow bg-[length:400%_100%]', barClass: 'bg-gradient-to-r from-red-400 via-yellow-400 via-green-400 via-blue-400 to-violet-400 bg-[length:400%_100%]' },
];

export function getRank(gameCount) {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (gameCount >= RANKS[i].min) return RANKS[i];
  }
  return RANKS[0];
}

export function getPrevRank(gameCount) {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (gameCount > RANKS[i].min) continue;
    if (i === 0) return null;
    return RANKS[i - 1];
  }
  return null;
}

export function getRankProgress(gameCount) {
  const rank = getRank(gameCount);
  if (rank.max === Infinity) return 1;
  const range = rank.max - rank.min;
  if (range === 0) return 1;
  if (gameCount >= rank.max) return 1;
  return (gameCount - rank.min) / range;
}
