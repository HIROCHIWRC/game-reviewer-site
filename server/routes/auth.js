const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret_in_production';

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Имя пользователя и пароль обязательны' });
  }
  if (username.length < 3) {
    return res.status(400).json({ error: 'Имя пользователя минимум 3 символа' });
  }
  if (username.length > 30) {
    return res.status(400).json({ error: 'Имя пользователя максимум 30 символов' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Пароль минимум 6 символов' });
  }

  const existing = (await db.execute({ sql: 'SELECT id FROM users WHERE username = ?', args: [username] })).rows[0];
  if (existing) {
    return res.status(409).json({ error: 'Пользователь с таким именем уже существует' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const result = await db.execute({ sql: 'INSERT INTO users (username, password, coins) VALUES (?, ?, ?)', args: [username, hashedPassword, 5] });

  const token = jwt.sign({ userId: Number(result.lastInsertRowid), username, isAdmin: 0 }, JWT_SECRET, { expiresIn: '30d' });
  res.status(201).json({ token, username, coins: 5, isAdmin: 0 });
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Введи имя пользователя и пароль' });
  }

  const user = (await db.execute({ sql: 'SELECT * FROM users WHERE username = ?', args: [username] })).rows[0];
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: 'Неверное имя пользователя или пароль' });
  }

  const isAdmin = user.is_admin || 0;
  const token = jwt.sign({ userId: user.id, username: user.username, isAdmin }, JWT_SECRET, { expiresIn: '30d' });
  res.json({ token, username: user.username, coins: Math.round((user.coins || 0) * 100) / 100, isAdmin });
});

async function getUserData(userId) {
  const user = (await db.execute({ sql: 'SELECT id, username, created_at, coins, is_admin FROM users WHERE id = ?', args: [userId] })).rows[0];
  if (!user) return null;

  const gameCount = (await db.execute({ sql: 'SELECT COUNT(*) as count FROM games WHERE user_id = ?', args: [userId] })).rows[0].count;

  const topGenresResult = await db.execute({
    sql: 'SELECT genre, COUNT(*) as count FROM games WHERE user_id = ? GROUP BY genre ORDER BY count DESC LIMIT 4',
    args: [userId],
  });

  const bestGame = (await db.execute({
    sql: 'SELECT title, score_overall FROM games WHERE user_id = ? ORDER BY score_overall DESC LIMIT 1',
    args: [userId],
  })).rows[0];

  const popularTitlesResult = await db.execute(`
    SELECT title, COUNT(*) as count FROM games
    GROUP BY title ORDER BY count DESC LIMIT 5
  `);

  return {
    username: user.username,
    createdAt: user.created_at,
    coins: Math.round((user.coins || 0) * 100) / 100,
    isAdmin: user.is_admin || 0,
    gameCount,
    topGenres: topGenresResult.rows.map((g) => ({ genre: g.genre, count: g.count })),
    bestGame: bestGame ? { title: bestGame.title, score: bestGame.score_overall } : null,
    popularTitles: popularTitlesResult.rows.length > 0 ? popularTitlesResult.rows : null,
  };
}

// GET /api/auth/profile — текущий пользователь
router.get('/profile', authMiddleware, async (req, res) => {
  const data = await getUserData(req.user.userId);
  if (!data) return res.status(404).json({ error: 'Пользователь не найден' });
  res.json(data);
});

// GET /api/auth/profile/:username — публичный профиль
router.get('/profile/:username', async (req, res) => {
  const user = (await db.execute({ sql: 'SELECT id FROM users WHERE username = ?', args: [req.params.username] })).rows[0];
  if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
  const data = await getUserData(user.id);
  if (!data) return res.status(404).json({ error: 'Пользователь не найден' });

  if (req.query.includeGames === 'true') {
    const gamesResult = await db.execute({ sql: 'SELECT * FROM games WHERE user_id = ? ORDER BY score_overall DESC', args: [user.id] });
    const COVERS_DIR = path.join(__dirname, '..', 'public', 'covers');
    data.games = gamesResult.rows.map((row) => {
      const game = {
        id: row.id, title: row.title, genre: row.genre,
        scores: { gameplay: row.score_gameplay, atmosphere: row.score_atmosphere, story: row.score_story, music: row.score_music, technical: row.score_technical, impression: row.score_impression, overall: row.score_overall },
        comment: row.comment || '',
        savedAt: row.saved_at,
        coverUrl: row.cover_url || '',
        posterUrl: row.poster_url || '',
      };
      // fallback битых локальных путей
      if (game.coverUrl?.startsWith('/covers/') && !fs.existsSync(path.join(COVERS_DIR, path.basename(game.coverUrl)))) {
        game.coverUrl = row.cover_source_url || '';
      }
      if (game.posterUrl?.startsWith('/covers/') && !fs.existsSync(path.join(COVERS_DIR, path.basename(game.posterUrl)))) {
        game.posterUrl = row.poster_source_url || '';
      }
      return game;
    });
  }

  res.json(data);
});

module.exports = router;
