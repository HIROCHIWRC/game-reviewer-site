const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret_in_production';

// POST /api/auth/register
router.post('/register', (req, res) => {
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

  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) {
    return res.status(409).json({ error: 'Пользователь с таким именем уже существует' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const result = db.prepare('INSERT INTO users (username, password, coins) VALUES (?, ?, ?)').run(username, hashedPassword, 5);

  const token = jwt.sign({ userId: result.lastInsertRowid, username, isAdmin: 0 }, JWT_SECRET, { expiresIn: '30d' });
  res.status(201).json({ token, username, coins: 5, isAdmin: 0 });
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Введи имя пользователя и пароль' });
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Неверное имя пользователя или пароль' });
  }

  const isAdmin = user.is_admin || 0;
  const token = jwt.sign({ userId: user.id, username: user.username, isAdmin }, JWT_SECRET, { expiresIn: '30d' });
  res.json({ token, username: user.username, coins: Math.round((user.coins || 0) * 100) / 100, isAdmin });
});

function getUserData(userId) {
  const user = db.prepare('SELECT id, username, created_at, coins, is_admin FROM users WHERE id = ?').get(userId);
  if (!user) return null;

  const gameCount = db.prepare('SELECT COUNT(*) as count FROM games WHERE user_id = ?').get(userId).count;

  const topGenres = db.prepare(`
    SELECT genre, COUNT(*) as count FROM games WHERE user_id = ?
    GROUP BY genre ORDER BY count DESC LIMIT 4
  `).all(userId);

  const bestGame = db.prepare(`
    SELECT title, score_overall FROM games WHERE user_id = ?
    ORDER BY score_overall DESC LIMIT 1
  `).get(userId);

  const popularTitles = db.prepare(`
    SELECT title, COUNT(*) as count FROM games
    GROUP BY title ORDER BY count DESC LIMIT 5
  `).all();

  return {
    username: user.username,
    createdAt: user.created_at,
    coins: Math.round((user.coins || 0) * 100) / 100,
    isAdmin: user.is_admin || 0,
    gameCount,
    topGenres: topGenres.map((g) => ({ genre: g.genre, count: g.count })),
    bestGame: bestGame ? { title: bestGame.title, score: bestGame.score_overall } : null,
    popularTitles: popularTitles.length > 0 ? popularTitles : null,
  };
}

// GET /api/auth/profile — текущий пользователь
router.get('/profile', authMiddleware, (req, res) => {
  const data = getUserData(req.user.userId);
  if (!data) return res.status(404).json({ error: 'Пользователь не найден' });
  res.json(data);
});

// GET /api/auth/profile/:username — публичный профиль
router.get('/profile/:username', (req, res) => {
  const user = db.prepare('SELECT id FROM users WHERE username = ?').get(req.params.username);
  if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
  const data = getUserData(user.id);
  if (!data) return res.status(404).json({ error: 'Пользователь не найден' });
  res.json(data);
});

module.exports = router;