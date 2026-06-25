const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

const SUGGESTIONS_DIR = path.join(__dirname, '..', 'public', 'suggestions');
if (!fs.existsSync(SUGGESTIONS_DIR)) fs.mkdirSync(SUGGESTIONS_DIR, { recursive: true });

const COOLDOWN_MS = 10_000;

const lastSuggestTime = new Map();
setInterval(() => {
  const cutoff = Date.now() - COOLDOWN_MS;
  for (const [key, time] of lastSuggestTime) {
    if (time < cutoff) lastSuggestTime.delete(key);
  }
}, 30_000);

function checkCooldown(userId) {
  const last = lastSuggestTime.get(userId);
  if (last && Date.now() - last < COOLDOWN_MS) {
    const remaining = Math.ceil((COOLDOWN_MS - (Date.now() - last)) / 1000);
    return `Подожди ${remaining} сек. перед следующим предложением`;
  }
  return null;
}

const imgStorage = multer.diskStorage({
  destination: SUGGESTIONS_DIR,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = `suggest_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`;
    cb(null, name);
  },
});

const upload = multer({
  storage: imgStorage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!/\.(png|jpg|jpeg|webp|gif)$/i.test(path.extname(file.originalname))) {
      cb(new Error('Только изображения (png, jpg, webp, gif)'));
    } else {
      cb(null, true);
    }
  },
});

// POST /api/memes/suggest — предложить текст мема
router.post('/suggest', auth, async (req, res) => {
  const cooldown = checkCooldown(req.user.userId);
  if (cooldown) return res.status(429).json({ error: cooldown });

  const { text } = req.body;
  if (!text || typeof text !== 'string') return res.status(400).json({ error: 'Укажи текст' });
  const trimmed = text.trim();
  if (!trimmed || trimmed.length > 500) return res.status(400).json({ error: 'Текст от 1 до 500 символов' });

  await db.execute({
    sql: 'INSERT INTO meme_suggestions (user_id, type, content) VALUES (?, ?, ?)',
    args: [req.user.userId, 'text', trimmed],
  });

  lastSuggestTime.set(req.user.userId, Date.now());
  res.status(201).json({ ok: true, message: 'Фраза отправлена на проверку' });
});

// POST /api/memes/suggest-image — предложить изображение мема
router.post('/suggest-image', auth, (req, res) => {
  const cooldown = checkCooldown(req.user.userId);
  if (cooldown) return res.status(429).json({ error: cooldown });

  upload.single('image')(req, res, async (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ error: err.code === 'LIMIT_FILE_SIZE' ? 'Файл больше 2MB' : 'Ошибка загрузки' });
      }
      return res.status(400).json({ error: err.message });
    }
    if (!req.file) return res.status(400).json({ error: 'Файл не выбран' });

    try {
      await db.execute({
        sql: 'INSERT INTO meme_suggestions (user_id, type, content, original_name) VALUES (?, ?, ?, ?)',
        args: [req.user.userId, 'image', req.file.filename, req.file.originalname],
      });
      lastSuggestTime.set(req.user.userId, Date.now());
      res.status(201).json({ ok: true, message: 'Изображение отправлено на проверку' });
    } catch (e) {
      fs.unlinkSync(path.join(SUGGESTIONS_DIR, req.file.filename));
      throw e;
    }
  });
});

module.exports = router;
