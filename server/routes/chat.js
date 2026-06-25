const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// GET /api/chat — последние 50 сообщений
router.get('/', async (req, res) => {
  const result = await db.execute(`
    SELECT m.id, m.user_id, m.username, m.text, m.created_at,
      (SELECT COUNT(*) FROM games WHERE user_id = m.user_id) AS gameCount
    FROM messages m ORDER BY m.created_at DESC LIMIT 50
  `);
  const messages = result.rows.reverse();
  res.json({ messages });
});

// POST /api/chat — отправить сообщение
router.post('/', async (req, res) => {
  const { text } = req.body;
  if (!text || typeof text !== 'string') return res.status(400).json({ error: 'Текст сообщения обязателен' });
  const trimmed = text.trim().slice(0, 500);
  if (!trimmed) return res.status(400).json({ error: 'Сообщение не может быть пустым' });

  const info = await db.execute({
    sql: 'INSERT INTO messages (user_id, username, text) VALUES (?, ?, ?)',
    args: [req.user.userId, req.user.username, trimmed],
  });

  const message = (await db.execute({
    sql: 'SELECT id, user_id, username, text, created_at FROM messages WHERE id = ?',
    args: [Number(info.lastInsertRowid)],
  })).rows[0];
  res.status(201).json({ message });
});

module.exports = router;
