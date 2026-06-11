const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'database.db'));

// Включаем WAL режим — лучше для одновременных запросов
db.pragma('journal_mode = WAL');

// Создаём таблицы если их нет
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS games (
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
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

// Таблица инвентаря (скины)
db.exec(`
  CREATE TABLE IF NOT EXISTS user_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    skin_name TEXT NOT NULL,
    skin_rarity TEXT NOT NULL,
    skin_value REAL NOT NULL,
    skin_image TEXT NOT NULL DEFAULT '',
    case_type TEXT NOT NULL,
    opened_at TEXT DEFAULT (datetime('now')),
    is_equipped INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )
`);

// Таблица чата
db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    username TEXT NOT NULL,
    text TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  )
`);

// Миграции для существующих БД
try { db.exec('ALTER TABLE games ADD COLUMN comment TEXT DEFAULT \'\''); } catch {}
try { db.exec('ALTER TABLE games ADD COLUMN cover_url TEXT DEFAULT \'\''); } catch {}
try { db.exec('ALTER TABLE games ADD COLUMN poster_url TEXT DEFAULT \'\''); } catch {}
try { db.exec('ALTER TABLE users ADD COLUMN coins INTEGER DEFAULT 0'); } catch {}
try { db.exec('ALTER TABLE users ADD COLUMN is_admin INTEGER DEFAULT 0'); } catch {}

// Если задан ADMIN_USERNAME — делаем его админом
if (process.env.ADMIN_USERNAME) {
  db.prepare('UPDATE users SET is_admin = 1 WHERE username = ?').run(process.env.ADMIN_USERNAME);
  console.log(`👑 Пользователь "${process.env.ADMIN_USERNAME}" назначен администратором`);
}

// Удаляем дубликаты (один пользователь — одна игра), чистим БД
db.exec(`
  DELETE FROM games WHERE rowid NOT IN (
    SELECT MIN(rowid) FROM games GROUP BY user_id, title
  )
`);
// Запрещаем дубликаты на уровне БД — защита от race condition
try { db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_games_user_title ON games(user_id, title)'); } catch {}

module.exports = db;