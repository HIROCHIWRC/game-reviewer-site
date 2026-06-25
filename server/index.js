const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const authRoutes = require('./routes/auth');
const gamesRoutes = require('./routes/games');
const casesRoutes = require('./routes/cases');
const chatRoutes = require('./routes/chat');
const adminRoutes = require('./routes/admin');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10kb' }));

app.use('/api/auth', authRoutes);
app.use('/api/games', gamesRoutes);
app.use('/api/cases', casesRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/admin', adminRoutes);

app.use('/memes', express.static(path.join(__dirname, 'public', 'memes')));
app.use('/covers', express.static(path.join(__dirname, 'public', 'covers')));
app.use('/skins', express.static(path.join(__dirname, 'public', 'skins')));
app.use('/cases', express.static(path.join(__dirname, 'public', 'cases')));

app.get('/api/memes/texts', (req, res) => {
  try {
    const filePath = path.join(__dirname, 'public', 'memes', 'texts.txt');
    if (!fs.existsSync(filePath)) {
      return res.json({ texts: [] });
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    const texts = content.split('\n').map((l) => l.trim()).filter(Boolean);
    res.json({ texts });
  } catch {
    res.status(500).json({ error: 'Не удалось загрузить тексты мемов' });
  }
});

app.get('/api/memes/images', (req, res) => {
  try {
    const dir = path.join(__dirname, 'public', 'memes');
    if (!fs.existsSync(dir)) return res.json({ images: [] });
    const files = fs.readdirSync(dir).filter((f) => /\.(png|jpg|jpeg|webp|gif)$/i.test(f));
    const images = files.map((f) => `/memes/${encodeURIComponent(f)}`);
    res.json({ images });
  } catch {
    res.status(500).json({ error: 'Не удалось загрузить изображения мемов' });
  }
});

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.get('/api/users/leaderboard', async (req, res) => {
  const result = await db.execute(`
    SELECT u.username, COUNT(g.id) as game_count,
      ROUND(AVG(g.score_overall), 2) as avg_score
    FROM users u
    LEFT JOIN games g ON g.user_id = u.id
    GROUP BY u.id, u.username
    ORDER BY game_count DESC
  `);
  res.json(result.rows);
});

// Раздача статики фронта
const distPath = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api/')) {
      res.sendFile(path.join(distPath, 'index.html'));
    } else {
      next();
    }
  });
}

async function start() {
  await db.initDb();
  app.listen(PORT, () => {
    console.log(`✅ Сервер запущен на http://localhost:${PORT}`);
  });
}
start();