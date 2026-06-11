const Database = require('better-sqlite3');
const db = new Database('./database.db');
db.pragma('journal_mode = WAL');

const users = db.prepare('SELECT * FROM users').all();
console.log('=== USERS ===');
console.log(JSON.stringify(users, null, 2));

const games = db.prepare(`
  SELECT g.*, u.username as owner_username
  FROM games g
  JOIN users u ON u.id = g.user_id
`).all();
console.log('\n=== GAMES WITH OWNER ===');
console.log(JSON.stringify(games, null, 2));

function dbRowToGame(row) {
  return {
    id: row.id,
    title: row.title,
    genre: row.genre,
    scores: {
      gameplay: row.score_gameplay,
      atmosphere: row.score_atmosphere,
      story: row.score_story,
      music: row.score_music,
      technical: row.score_technical,
      impression: row.score_impression,
      overall: row.score_overall,
    },
    savedAt: row.saved_at,
  };
}

console.log('\n=== AFTER dbRowToGame ===');
const allGames = db.prepare('SELECT * FROM games').all();
allGames.forEach(g => console.log(JSON.stringify(dbRowToGame(g), null, 2)));
