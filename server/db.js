const { createClient } = require('@libsql/client');

const db = createClient({
  url: process.env.TURSO_DB_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

db.initDb = async function () {
  // Turso включает проверку FK по умолчанию (в отличие от обычного SQLite).
  // Отключаем, чтобы старые токены не ломали запросы.
  await db.execute('PRAGMA foreign_keys = OFF');

  await db.batch([
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      coins INTEGER DEFAULT 0,
      is_admin INTEGER DEFAULT 0
    )`,
    `CREATE TABLE IF NOT EXISTS games (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      genre TEXT NOT NULL,
      score_gameplay INTEGER NOT NULL,
      score_atmosphere INTEGER,
      score_story INTEGER,
      score_music INTEGER,
      score_technical INTEGER NOT NULL,
      score_impression INTEGER NOT NULL,
      score_overall REAL NOT NULL,
      comment TEXT DEFAULT '',
      saved_at TEXT NOT NULL,
      cover_url TEXT DEFAULT '',
      poster_url TEXT DEFAULT '',
      cover_source_url TEXT DEFAULT '',
      poster_source_url TEXT DEFAULT ''
    )`,
    `CREATE TABLE IF NOT EXISTS user_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      skin_name TEXT NOT NULL,
      skin_rarity TEXT NOT NULL,
      skin_value REAL NOT NULL,
      skin_image TEXT NOT NULL DEFAULT '',
      case_type TEXT NOT NULL,
      opened_at TEXT DEFAULT (datetime('now')),
      is_equipped INTEGER DEFAULT 0
    )`,
    `CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      username TEXT NOT NULL,
      text TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS meme_suggestions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      content TEXT NOT NULL,
      original_name TEXT DEFAULT '',
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS game_comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_title TEXT NOT NULL,
      user_id INTEGER NOT NULL,
      text TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_games_user_title ON games(user_id, title)`,
  ]);

  if (process.env.ADMIN_USERNAME) {
    const result = await db.execute({
      sql: 'UPDATE users SET is_admin = 1 WHERE username = ?',
      args: [process.env.ADMIN_USERNAME],
    });
    if (result.rowsAffected > 0) {
      console.log(`👑 Пользователь "${process.env.ADMIN_USERNAME}" назначен администратором`);
    }
  }

  // Миграции: добавляем колонки, которых может не быть в старых таблицах
  try { await db.execute('ALTER TABLE games ADD COLUMN cover_source_url TEXT DEFAULT \'\''); } catch {}
  try { await db.execute('ALTER TABLE games ADD COLUMN poster_source_url TEXT DEFAULT \'\''); } catch {}
};

module.exports = db;
