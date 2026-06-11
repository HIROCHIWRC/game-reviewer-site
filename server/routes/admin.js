const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db');
const adminMiddleware = require('../middleware/admin');

const router = express.Router();

const MEMES_DIR = path.join(__dirname, '..', 'public', 'memes');

if (!fs.existsSync(MEMES_DIR)) fs.mkdirSync(MEMES_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: MEMES_DIR,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = path.basename(file.originalname, ext).replace(/[^a-zA-Zа-яА-Я0-9_-]/g, '_');
    const finalName = `${name}${ext}`;
    if (fs.existsSync(path.join(MEMES_DIR, finalName))) {
      cb(new Error('Файл с таким именем уже существует'));
    } else {
      cb(null, finalName);
    }
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /\.(png|jpg|jpeg|webp|gif)$/i;
    if (!allowed.test(path.extname(file.originalname))) {
      cb(new Error('Только изображения (png, jpg, webp, gif)'));
    } else {
      cb(null, true);
    }
  },
});

router.use(adminMiddleware);

// ---- Мемы: тексты ----

function readTexts() {
  const fp = path.join(MEMES_DIR, 'texts.txt');
  if (!fs.existsSync(fp)) return [];
  return fs.readFileSync(fp, 'utf-8').split('\n').map((l) => l.trim()).filter(Boolean);
}

function writeTexts(texts) {
  fs.writeFileSync(path.join(MEMES_DIR, 'texts.txt'), texts.join('\n') + '\n', 'utf-8');
}

// GET /api/admin/memes/texts — список фраз
router.get('/memes/texts', (req, res) => {
  res.json({ texts: readTexts() });
});

// POST /api/admin/memes/texts — добавить фразу
router.post('/memes/texts', (req, res) => {
  const { text } = req.body;
  if (!text || typeof text !== 'string') return res.status(400).json({ error: 'Укажите текст' });
  const trimmed = text.trim();
  if (!trimmed || trimmed.length > 500) return res.status(400).json({ error: 'Текст от 1 до 500 символов' });
  const texts = readTexts();
  texts.push(trimmed);
  writeTexts(texts);
  res.json({ message: 'Фраза добавлена', count: texts.length });
});

// DELETE /api/admin/memes/texts/:index — удалить фразу по индексу
router.delete('/memes/texts/:index', (req, res) => {
  const idx = Number(req.params.index);
  const texts = readTexts();
  if (idx < 0 || idx >= texts.length) return res.status(400).json({ error: 'Неверный индекс' });
  const removed = texts.splice(idx, 1)[0];
  writeTexts(texts);
  res.json({ message: `Фраза "${removed}" удалена`, count: texts.length });
});

// ---- Мемы: изображения ----

// GET /api/admin/memes/images — список изображений
router.get('/memes/images', (req, res) => {
  const files = fs.readdirSync(MEMES_DIR).filter((f) => /\.(png|jpg|jpeg|webp|gif)$/i.test(f));
  res.json({ images: files.map((f) => `/memes/${encodeURIComponent(f)}`) });
});

// POST /api/admin/memes/images — загрузить изображение
router.post('/memes/images', (req, res) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ error: err.code === 'LIMIT_FILE_SIZE' ? 'Файл больше 5MB' : 'Ошибка загрузки' });
      }
      return res.status(400).json({ error: err.message });
    }
    if (!req.file) return res.status(400).json({ error: 'Файл не выбран' });
    res.json({ message: `Файл "${req.file.filename}" загружен`, url: `/memes/${encodeURIComponent(req.file.filename)}` });
  });
});

// DELETE /api/admin/memes/images/:filename — удалить изображение
router.delete('/memes/images/:filename', (req, res) => {
  const filename = req.params.filename;
  const fp = path.join(MEMES_DIR, filename);
  if (!fs.existsSync(fp)) return res.status(404).json({ error: 'Файл не найден' });
  if (!/\.(png|jpg|jpeg|webp|gif)$/i.test(filename)) return res.status(400).json({ error: 'Неверный формат' });
  fs.unlinkSync(fp);
  res.json({ message: `Файл "${filename}" удалён` });
});

// GET /api/admin/users — список всех пользователей
router.get('/users', (req, res) => {
  const users = db.prepare(`
    SELECT u.id, u.username, u.created_at, u.coins, u.is_admin,
      (SELECT COUNT(*) FROM games WHERE user_id = u.id) as review_count
    FROM users u
    ORDER BY u.id ASC
  `).all();
  res.json(users.map((u) => ({
    id: u.id,
    username: u.username,
    createdAt: u.created_at,
    coins: Math.round((u.coins || 0) * 100) / 100,
    isAdmin: !!u.is_admin,
    reviewCount: u.review_count,
  })));
});

// DELETE /api/admin/users/:id — удалить пользователя + его отзывы + инвентарь
router.delete('/users/:id', (req, res) => {
  const userId = Number(req.params.id);
  if (!userId) return res.status(400).json({ error: 'Неверный ID' });

  const user = db.prepare('SELECT id, username FROM users WHERE id = ?').get(userId);
  if (!user) return res.status(404).json({ error: 'Пользователь не найден' });

  // Нельзя удалить самого себя
  if (user.id === req.user.userId) {
    return res.status(400).json({ error: 'Нельзя удалить самого себя' });
  }

  const delGames = db.prepare('DELETE FROM games WHERE user_id = ?').run(userId);
  const delItems = db.prepare('DELETE FROM user_items WHERE user_id = ?').run(userId);
  const delMsgs = db.prepare('DELETE FROM messages WHERE user_id = ?').run(userId);
  db.prepare('DELETE FROM users WHERE id = ?').run(userId);

  res.json({
    message: `Пользователь "${user.username}" удалён`,
    deletedGames: delGames.changes,
    deletedItems: delItems.changes,
    deletedMessages: delMsgs.changes,
  });
});

// PUT /api/admin/users/:id/coins — изменить монеты
router.put('/users/:id/coins', (req, res) => {
  const userId = Number(req.params.id);
  const { coins } = req.body;

  if (!userId) return res.status(400).json({ error: 'Неверный ID' });
  if (coins == null || typeof coins !== 'number' || !Number.isFinite(coins)) {
    return res.status(400).json({ error: 'Укажите число монет' });
  }
  if (coins < 0 || coins > 999999) {
    return res.status(400).json({ error: 'Монеты от 0 до 999999' });
  }

  const user = db.prepare('SELECT id, username FROM users WHERE id = ?').get(userId);
  if (!user) return res.status(404).json({ error: 'Пользователь не найден' });

  db.prepare('UPDATE users SET coins = ? WHERE id = ?').run(Math.round(coins * 100) / 100, userId);
  res.json({ message: `Монеты пользователя "${user.username}" изменены на ${coins}`, coins });
});

module.exports = router;
