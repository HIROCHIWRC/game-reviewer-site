const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// GET /api/chat — последние 50 сообщений
router.get('/', (req, res) => {
  const messages = db.prepare(
    'SELECT id, user_id, username, text, created_at FROM messages ORDER BY created_at DESC LIMIT 50'
  ).all().reverse();
  res.json({ messages });
});

// POST /api/chat — отправить сообщение
router.post('/', (req, res) => {
  const { text } = req.body;
  if (!text || typeof text !== 'string') return res.status(400).json({ error: 'Текст сообщения обязателен' });
  const trimmed = text.trim().slice(0, 500);
  if (!trimmed) return res.status(400).json({ error: 'Сообщение не может быть пустым' });

  const info = db.prepare('INSERT INTO messages (user_id, username, text) VALUES (?, ?, ?)')
    .run(req.user.userId, req.user.username, trimmed);

  const message = db.prepare('SELECT id, user_id, username, text, created_at FROM messages WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ message });
});

module.exports = router;
