const GENRE_EMOJIS = {
  Action: '⚔️', Adventure: '🗺️', 'Battle Royale': '🏆', Casual: '🎮',
  Fighting: '🥊', Horror: '👻', Indie: '🎨', Platformer: '🦘',
  'Puzzle / Logic': '🧩', RPG: '⚡', Racing: '🏎️', Roguelike: '💀',
  Sandbox: '🏗️', Shooter: '🔫', Simulator: '✈️', Sports: '⚽',
  Stealth: '🥷', Strategy: '♟️', Survival: '🏕️', 'Visual Novel': '📖',
};

export function getGenreEmoji(genre) {
  return GENRE_EMOJIS[genre] || '🎮';
}
