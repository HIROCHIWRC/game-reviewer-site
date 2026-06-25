export const GENRES = [
  'Action', 'Adventure', 'Battle Royale', 'Casual', 'Fighting', 'Horror', 'Indie',
  'Platformer', 'Puzzle / Logic', 'RPG', 'Racing', 'Roguelike', 'Sandbox', 'Shooter',
  'Simulator', 'Sports', 'Stealth', 'Strategy', 'Survival', 'Visual Novel',
];

export const FILTER_GENRE_OPTIONS = ['Все жанры', ...GENRES];

export const SORT_OPTIONS = [
  '🏆 Сначала топовые',
  '📉 Сначала похуже',
  '📊 Больше всего отзывов',
  '🔤 По алфавиту (А-Я)',
];

export const SCORE_MULTIPLIERS = {
  gameplay: 3,
  atmosphere: 2,
  story: 2,
  music: 1,
  technical: 1,
  impression: 1,
};