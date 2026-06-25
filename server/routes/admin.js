const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db');
const adminMiddleware = require('../middleware/admin');

const router = express.Router();

const MEMES_DIR = path.join(__dirname, '..', 'public', 'memes');
const SUGGESTIONS_DIR = path.join(__dirname, '..', 'public', 'suggestions');

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

// ---- Предложки мемов ----

// GET /api/admin/memes/suggestions — список предложений
router.get('/memes/suggestions', async (req, res) => {
  const status = req.query.status || 'pending';
  const result = await db.execute({
    sql: "SELECT s.id, s.user_id, s.type, s.content, s.original_name, s.status, s.created_at, u.username FROM meme_suggestions s JOIN users u ON u.id = s.user_id WHERE s.status = ? ORDER BY s.created_at DESC",
    args: [status],
  });
  res.json(result.rows.map((s) => ({
    id: s.id,
    userId: s.user_id,
    username: s.username,
    type: s.type,
    content: s.type === 'image' ? `/suggestions/${encodeURIComponent(s.content)}` : s.content,
    originalName: s.original_name,
    status: s.status,
    createdAt: s.created_at,
  })));
});

// POST /api/admin/memes/suggestions/:id/approve — одобрить
router.post('/memes/suggestions/:id/approve', async (req, res) => {
  const id = Number(req.params.id);
  const suggestion = (await db.execute({ sql: 'SELECT * FROM meme_suggestions WHERE id = ?', args: [id] })).rows[0];
  if (!suggestion) return res.status(404).json({ error: 'Предложение не найдено' });
  if (suggestion.status !== 'pending') return res.status(400).json({ error: 'Уже обработано' });

  if (suggestion.type === 'text') {
    const textsPath = path.join(MEMES_DIR, 'texts.txt');
    const texts = fs.existsSync(textsPath)
      ? fs.readFileSync(textsPath, 'utf-8').split('\n').filter(Boolean)
      : [];
    texts.push(suggestion.content);
    fs.writeFileSync(textsPath, texts.join('\n') + '\n', 'utf-8');
  } else {
    const src = path.join(SUGGESTIONS_DIR, suggestion.content);
    const ext = path.extname(suggestion.content);
    const name = `suggested_${Date.now()}${ext}`;
    const dst = path.join(MEMES_DIR, name);
    if (fs.existsSync(src)) {
      fs.renameSync(src, dst);
    }
  }

  await db.execute({ sql: "UPDATE meme_suggestions SET status = 'approved' WHERE id = ?", args: [id] });
  res.json({ message: 'Предложение одобрено' });
});

// POST /api/admin/memes/suggestions/:id/reject — отклонить
router.post('/memes/suggestions/:id/reject', async (req, res) => {
  const id = Number(req.params.id);
  const suggestion = (await db.execute({ sql: 'SELECT * FROM meme_suggestions WHERE id = ?', args: [id] })).rows[0];
  if (!suggestion) return res.status(404).json({ error: 'Предложение не найдено' });
  if (suggestion.status !== 'pending') return res.status(400).json({ error: 'Уже обработано' });

  if (suggestion.type === 'image') {
    const fp = path.join(SUGGESTIONS_DIR, suggestion.content);
    if (fs.existsSync(fp)) fs.unlinkSync(fp);
  }

  await db.execute({ sql: "UPDATE meme_suggestions SET status = 'rejected' WHERE id = ?", args: [id] });
  res.json({ message: 'Предложение отклонено' });
});

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
router.get('/users', async (req, res) => {
  const result = await db.execute(`
    SELECT u.id, u.username, u.created_at, u.coins, u.is_admin,
      (SELECT COUNT(*) FROM games WHERE user_id = u.id) as review_count
    FROM users u
    ORDER BY u.id ASC
  `);
  res.json(result.rows.map((u) => ({
    id: u.id,
    username: u.username,
    createdAt: u.created_at,
    coins: Math.round((u.coins || 0) * 100) / 100,
    isAdmin: !!u.is_admin,
    reviewCount: u.review_count,
  })));
});

// DELETE /api/admin/users/:id — удалить пользователя + его отзывы + инвентарь
router.delete('/users/:id', async (req, res) => {
  const userId = Number(req.params.id);
  if (!userId) return res.status(400).json({ error: 'Неверный ID' });

  const user = (await db.execute({ sql: 'SELECT id, username FROM users WHERE id = ?', args: [userId] })).rows[0];
  if (!user) return res.status(404).json({ error: 'Пользователь не найден' });

  if (user.id === req.user.userId) {
    return res.status(400).json({ error: 'Нельзя удалить самого себя' });
  }

  const results = await db.batch([
    { sql: 'DELETE FROM games WHERE user_id = ?', args: [userId] },
    { sql: 'DELETE FROM user_items WHERE user_id = ?', args: [userId] },
    { sql: 'DELETE FROM messages WHERE user_id = ?', args: [userId] },
    { sql: 'DELETE FROM users WHERE id = ?', args: [userId] },
  ]);
  res.json({
    message: `Пользователь "${user.username}" удалён`,
    deletedGames: results[0].rowsAffected,
    deletedItems: results[1].rowsAffected,
    deletedMessages: results[2].rowsAffected,
  });
});

// PUT /api/admin/users/:id/coins — изменить монеты
router.put('/users/:id/coins', async (req, res) => {
  const userId = Number(req.params.id);
  const { coins } = req.body;

  if (!userId) return res.status(400).json({ error: 'Неверный ID' });
  if (coins == null || typeof coins !== 'number' || !Number.isFinite(coins)) {
    return res.status(400).json({ error: 'Укажите число монет' });
  }
  if (coins < 0 || coins > 999999) {
    return res.status(400).json({ error: 'Монеты от 0 до 999999' });
  }

  const user = (await db.execute({ sql: 'SELECT id, username FROM users WHERE id = ?', args: [userId] })).rows[0];
  if (!user) return res.status(404).json({ error: 'Пользователь не найден' });

  await db.execute({ sql: 'UPDATE users SET coins = ? WHERE id = ?', args: [Math.round(coins * 100) / 100, userId] });
  res.json({ message: `Монеты пользователя "${user.username}" изменены на ${coins}`, coins });
});

module.exports = router;
