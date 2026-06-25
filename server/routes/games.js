const express = require('express');
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const RAWG_KEY = '04f793cdeeed4633963f102cd6ee6eeb';
const SGDB_KEY = '860aa0d0bb51044b6660531e97e0d0bc';

const router = express.Router();

router.use(authMiddleware);

const MULTIPLIERS = { gameplay: 3, atmosphere: 2, story: 2, music: 1, technical: 1, impression: 1 };

function calcOverall(scores) {
  let total = 0;
  let sum = 0;
  total += scores.gameplay * MULTIPLIERS.gameplay; sum += MULTIPLIERS.gameplay;
  total += scores.technical * MULTIPLIERS.technical; sum += MULTIPLIERS.technical;
  total += scores.impression * MULTIPLIERS.impression; sum += MULTIPLIERS.impression;
  if (scores.atmosphere !== null) { total += scores.atmosphere * MULTIPLIERS.atmosphere; sum += MULTIPLIERS.atmosphere; }
  if (scores.story !== null) { total += scores.story * MULTIPLIERS.story; sum += MULTIPLIERS.story; }
  if (scores.music !== null) { total += scores.music * MULTIPLIERS.music; sum += MULTIPLIERS.music; }
  return sum === 0 ? 0 : Math.round((total / sum) * 100) / 100;
}

function dbRowToGame(row) {
  return {
    id: row.id, title: row.title, genre: row.genre,
    scores: { gameplay: row.score_gameplay, atmosphere: row.score_atmosphere, story: row.score_story, music: row.score_music, technical: row.score_technical, impression: row.score_impression, overall: row.score_overall },
    comment: row.comment || '',
    savedAt: row.saved_at,
    coverUrl: row.cover_url || '',
    posterUrl: row.poster_url || '',
    coverSource: row.cover_source_url || '',
    posterSource: row.poster_source_url || '',
  };
}

function dbRowToAggregated(row) {
  const total = row.review_count;
  const half = total / 2;

  const atmosphereActive = row.atmosphere_null_count <= half;
  const storyActive = row.story_null_count <= half;
  const musicActive = row.music_null_count <= half;

  const scores = {
    gameplay: Math.round(row.score_gameplay * 100) / 100,
    atmosphere: atmosphereActive && row.score_atmosphere !== null ? Math.round(row.score_atmosphere * 100) / 100 : null,
    story: storyActive && row.score_story !== null ? Math.round(row.score_story * 100) / 100 : null,
    music: musicActive && row.score_music !== null ? Math.round(row.score_music * 100) / 100 : null,
    technical: Math.round(row.score_technical * 100) / 100,
    impression: Math.round(row.score_impression * 100) / 100,
  };
  scores.overall = calcOverall(scores);
  return {
    title: row.title,
    genre: row.genre,
    scores,
    reviewCount: total,
    coverUrl: row.cover_url || '',
    posterUrl: row.poster_url || '',
    coverSource: row.cover_source_url || '',
    posterSource: row.poster_source_url || '',
  };
}

// GET /api/games — получить игры (scope=my | scope=all)
router.get('/', async (req, res) => {
  const scope = req.query.scope || 'my';
  if (scope === 'all') {
    const result = await db.execute(`
      SELECT
        g.title,
        (SELECT genre FROM games WHERE title = g.title GROUP BY genre ORDER BY COUNT(*) DESC LIMIT 1) as genre,
        (SELECT cover_url FROM games WHERE title = g.title AND cover_url != '' LIMIT 1) as cover_url,
        (SELECT poster_url FROM games WHERE title = g.title AND poster_url != '' LIMIT 1) as poster_url,
        (SELECT cover_source_url FROM games WHERE title = g.title AND cover_source_url != '' LIMIT 1) as cover_source_url,
        (SELECT poster_source_url FROM games WHERE title = g.title AND poster_source_url != '' LIMIT 1) as poster_source_url,
        AVG(g.score_gameplay) as score_gameplay,
        AVG(g.score_atmosphere) as score_atmosphere,
        AVG(g.score_story) as score_story,
        AVG(g.score_music) as score_music,
        AVG(g.score_technical) as score_technical,
        AVG(g.score_impression) as score_impression,
        COUNT(*) as review_count,
        SUM(CASE WHEN g.score_atmosphere IS NULL THEN 1 ELSE 0 END) as atmosphere_null_count,
        SUM(CASE WHEN g.score_story IS NULL THEN 1 ELSE 0 END) as story_null_count,
        SUM(CASE WHEN g.score_music IS NULL THEN 1 ELSE 0 END) as music_null_count
      FROM games g
      GROUP BY g.title
    `);
    const games = result.rows.map(dbRowToAggregated);
    // Если локальный файл обложки пропал (рестарт Railway), используем оригинальный URL
    for (const game of games) {
      if (game.coverUrl?.startsWith('/covers/') && !fs.existsSync(path.join(COVERS_DIR, path.basename(game.coverUrl)))) {
        game.coverUrl = game.coverSource || '';
      }
      if (game.posterUrl?.startsWith('/covers/') && !fs.existsSync(path.join(COVERS_DIR, path.basename(game.posterUrl)))) {
        game.posterUrl = game.posterSource || '';
      }
    }
    games.sort((a, b) => b.scores.overall - a.scores.overall);
    return res.json(games);
  }
  const result = await db.execute({ sql: 'SELECT * FROM games WHERE user_id = ? ORDER BY score_overall DESC', args: [req.user.userId] });
  const games = result.rows.map(dbRowToGame);
  for (const game of games) {
    if (game.coverUrl?.startsWith('/covers/') && !fs.existsSync(path.join(COVERS_DIR, path.basename(game.coverUrl)))) {
      game.coverUrl = game.coverSource || '';
    }
    if (game.posterUrl?.startsWith('/covers/') && !fs.existsSync(path.join(COVERS_DIR, path.basename(game.posterUrl)))) {
      game.posterUrl = game.posterSource || '';
    }
  }
  res.json(games);
});

// GET /api/games/titles — список существующих названий для автоподсказки
router.get('/titles', async (req, res) => {
  const result = await db.execute(`
    SELECT title, (SELECT genre FROM games WHERE title = g.title GROUP BY genre ORDER BY COUNT(*) DESC LIMIT 1) as genre
    FROM games g
    GROUP BY g.title
    ORDER BY g.title
  `);
  res.json(result.rows);
});

// GET /api/games/by-title/:title — все обзоры по названию (для карточки в режиме "Общий")
router.get('/by-title/:title', async (req, res) => {
  const result = await db.execute({
    sql: `SELECT g.*, u.username,
      (SELECT COUNT(*) FROM games WHERE user_id = g.user_id) as owner_game_count
    FROM games g JOIN users u ON g.user_id = u.id
    WHERE g.title = ? ORDER BY g.score_overall DESC`,
    args: [req.params.title],
  });
  res.json(result.rows.map((row) => ({ ...dbRowToGame(row), owner: row.username, ownerGameCount: row.owner_game_count })));
});

function httpGet(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, Object.keys(headers).length > 0 ? { headers } : {}, (resp) => {
      let data = '';
      resp.on('data', (chunk) => { data += chunk; });
      resp.on('end', () => resolve(data));
    });
    req.setTimeout(8000, () => { req.destroy(); reject(new Error('timeout')); });
    req.on('error', reject);
  });
}

function slugify(text) {
  return text.toLowerCase()
    .replace(/[^a-z0-9а-яё\s-]/g, '')
    .replace(/[\s]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 60);
}

function downloadImage(url, dest, maxRedirects = 5) {
  return new Promise((resolve) => {
    if (!url || maxRedirects < 0) return resolve(false);

    const file = fs.createWriteStream(dest);
    const cleanup = () => {
      file.close();
      try { fs.unlinkSync(dest); } catch {}
    };

    const get = url.startsWith('https') ? https.get : http.get;

    const req = get(url, { headers: { 'User-Agent': 'GameReviewer/1.0' } }, (resp) => {
      if ([301, 302, 303, 307, 308].includes(resp.statusCode)) {
        file.close();
        try { fs.unlinkSync(dest); } catch {}
        const redirectUrl = resp.headers.location;
        if (!redirectUrl) return resolve(false);
        const absolute = redirectUrl.startsWith('http')
          ? redirectUrl
          : new URL(redirectUrl, url).toString();
        return resolve(downloadImage(absolute, dest, maxRedirects - 1));
      }

      if (resp.statusCode !== 200) { cleanup(); return resolve(false); }

      resp.pipe(file);
      resp.on('error', () => { cleanup(); resolve(false); });
      file.on('finish', () => file.close(() => resolve(fs.existsSync(dest))));
      file.on('error', () => { cleanup(); resolve(false); });
    });

    req.setTimeout(10000, () => { req.destroy(); cleanup(); resolve(false); });
    req.on('error', () => { cleanup(); resolve(false); });
  });
}

const COVERS_DIR = path.join(__dirname, '..', 'public', 'covers');
try { fs.mkdirSync(COVERS_DIR, { recursive: true }); } catch {}

async function downloadGameCovers(title, coverUrl, posterUrl) {
  const slug = slugify(title);
  if (!slug) return { coverUrl, posterUrl, coverSource: coverUrl, posterSource: posterUrl };

  let localCover = coverUrl;
  let localPoster = posterUrl;

  if (coverUrl && !coverUrl.startsWith('/covers/')) {
    const localPath = path.join(COVERS_DIR, `${slug}_icon.jpg`);
    console.log(`[cover] Скачиваю иконку для "${title}": ${coverUrl} → ${slug}_icon.jpg`);
    const ok = await downloadImage(coverUrl, localPath);
    if (ok) localCover = `/covers/${slug}_icon.jpg`;
    console.log(`[cover] Иконка ${ok ? 'скачана' : 'не скачалась'} для "${title}"`);
  }

  if (posterUrl && !posterUrl.startsWith('/covers/')) {
    const localPath = path.join(COVERS_DIR, `${slug}_poster.jpg`);
    console.log(`[cover] Скачиваю постер для "${title}": ${posterUrl} → ${slug}_poster.jpg`);
    const ok = await downloadImage(posterUrl, localPath);
    if (ok) localPoster = `/covers/${slug}_poster.jpg`;
    console.log(`[cover] Постер ${ok ? 'скачан' : 'не скачался'} для "${title}"`);
  }

  return { coverUrl: localCover, posterUrl: localPoster, coverSource: coverUrl, posterSource: posterUrl };
}

// GET /api/games/fetch-cover — поиск иконки и постера (без скачивания)
router.get('/fetch-cover', async (req, res) => {
  const title = req.query.title;
  if (!title || title.trim().length < 3) return res.json({ iconUrl: null, posterUrl: null });

  const q = title.trim();

  // Проверяем, есть ли уже обложка в БД
  const existing = (await db.execute({
    sql: `SELECT cover_url, poster_url FROM games
      WHERE title = ? AND (cover_url != '' OR poster_url != '')
      ORDER BY
        CASE WHEN cover_url != '' THEN 0 ELSE 1 END,
        CASE WHEN poster_url != '' THEN 0 ELSE 1 END
      LIMIT 1`,
    args: [q],
  })).rows[0];

  if (existing) {
    const coverFile = existing.cover_url ? path.join(COVERS_DIR, path.basename(existing.cover_url)) : null;
    const posterFile = existing.poster_url ? path.join(COVERS_DIR, path.basename(existing.poster_url)) : null;
    const coverOk = coverFile ? fs.existsSync(coverFile) : false;
    const posterOk = posterFile ? fs.existsSync(posterFile) : false;

    if (coverOk || posterOk) {
      console.log(`[cover] "${q}" — из БД:`, { icon: existing.cover_url, poster: existing.poster_url });
      return res.json({
        iconUrl: coverOk ? existing.cover_url : null,
        posterUrl: posterOk ? existing.poster_url : null,
      });
    }
    console.log(`[cover] "${q}" — в БД есть запись, но файлы отсутствуют на диске`);
  }

  const slug = slugify(q);
  if (slug) {
    const diskIcon = path.join(COVERS_DIR, `${slug}_icon.jpg`);
    const diskPoster = path.join(COVERS_DIR, `${slug}_poster.jpg`);
    const diskIconOk = fs.existsSync(diskIcon);
    const diskPosterOk = fs.existsSync(diskPoster);
    if (diskIconOk || diskPosterOk) {
      console.log(`[cover] "${q}" — найдено на диске:`, { icon: diskIconOk, poster: diskPosterOk });
      return res.json({
        iconUrl: diskIconOk ? `/covers/${slug}_icon.jpg` : null,
        posterUrl: diskPosterOk ? `/covers/${slug}_poster.jpg` : null,
      });
    }
  }

  console.log(`[cover] "${q}" — нет ни в БД, ни на диске, ищем через API...`);

  let iconUrl = null;
  let posterUrl = null;

  // 1. SteamGridDB (иконка)
  try {
    const searchBody = await httpGet(`https://www.steamgriddb.com/api/v2/search/autocomplete/${encodeURIComponent(q)}`, { Authorization: `Bearer ${SGDB_KEY}` });
    const searchData = JSON.parse(searchBody);
    if (searchData.data?.[0]) {
      const iconBody = await httpGet(`https://www.steamgriddb.com/api/v2/icons/game/${searchData.data[0].id}`, { Authorization: `Bearer ${SGDB_KEY}` });
      const iconData = JSON.parse(iconBody);
      if (iconData.data?.[0]?.url) iconUrl = iconData.data[0].url;
    }
  } catch {}

  // 2. Steam (постер)
  try {
    const steamBody = await httpGet(`https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(q)}&l=russian&cc=RU`);
    const steamData = JSON.parse(steamBody);
    const items = (steamData.items || []).filter((i) => i.type === 'app');
    if (items.length > 0) {
      const query = q.toLowerCase();
      const match = items.find((i) => i.name.toLowerCase() === query) || items.find((i) => i.name.toLowerCase().startsWith(query)) || items[0];
      if (match?.id) posterUrl = `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${match.id}/library_600x900.jpg`;
    }
  } catch {}

  // 3. RAWG (постер, если Steam не нашёл)
  if (!posterUrl) {
    try {
      const rawgBody = await httpGet(`https://api.rawg.io/api/games?search=${encodeURIComponent(q)}&key=${RAWG_KEY}&page_size=5`);
      const rawgData = JSON.parse(rawgBody);
      const match = (rawgData.results || []).find((r) => r.name.toLowerCase() === q.toLowerCase())
        || (rawgData.results || [])[0];
      if (match?.background_image) posterUrl = match.background_image;
    } catch {}
  }

  // 4. Wikipedia (запасной вариант)
  if (!iconUrl || !posterUrl) {
    try {
      const wikiBody = await httpGet(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(q)}`);
      const wikiData = JSON.parse(wikiBody);
      const thumb = wikiData?.thumbnail?.source;
      if (thumb) {
        if (!iconUrl) iconUrl = thumb;
        if (!posterUrl) posterUrl = thumb;
      }
    } catch {}
  }

  res.json({ iconUrl, posterUrl });
});

function validateGame(body) {
  const { title, genre, scores, comment } = body;
  if (!title || !genre || !scores) return 'Неполные данные игры';
  if (title.trim().length > 100) return 'Название игры не может быть длиннее 100 символов';
  if (comment && comment.length > 500) return 'Комментарий не может быть длиннее 500 символов';
  const scoreFields = ['gameplay', 'technical', 'impression'];
  for (const field of scoreFields) {
    const v = scores[field];
    if (v == null || v < 0 || v > 10) return `Оценка "${field}" должна быть от 0 до 10`;
  }
  const optional = ['atmosphere', 'story', 'music'];
  for (const field of optional) {
    if (scores[field] !== null && (scores[field] < 0 || scores[field] > 10)) {
      return `Оценка "${field}" должна быть от 0 до 10`;
    }
  }
  if (scores.overall == null || scores.overall < 0 || scores.overall > 10) return 'Итоговая оценка некорректна';
  return null;
}

// POST /api/games — добавить игру
router.post('/', async (req, res) => {
  const err = validateGame(req.body);
  if (err) return res.status(400).json({ error: err });
  const { id, title, genre, scores, comment, savedAt, coverUrl, posterUrl } = req.body;

  const dup = (await db.execute({ sql: 'SELECT id FROM games WHERE user_id = ? AND title = ?', args: [req.user.userId, title.trim()] })).rows[0];
  if (dup) return res.status(409).json({ error: 'Вы уже оценили эту игру' });
  console.log(`[games] POST "${title}" coverUrl=${coverUrl} posterUrl=${posterUrl}`);
  const covers = await downloadGameCovers(title.trim(), coverUrl, posterUrl);
  try {
    await db.execute({
      sql: `INSERT INTO games (id, user_id, title, genre, score_gameplay, score_atmosphere, score_story, score_music, score_technical, score_impression, score_overall, comment, saved_at, cover_url, poster_url, cover_source_url, poster_source_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [id, req.user.userId, title.trim(), genre,
        scores.gameplay, scores.atmosphere ?? null, scores.story ?? null, scores.music ?? null,
        scores.technical, scores.impression, scores.overall, (comment || '').trim(), savedAt, covers.coverUrl, covers.posterUrl, covers.coverSource || '', covers.posterSource || ''],
    });
  } catch (e) {
    if (e.message?.includes('UNIQUE')) return res.status(409).json({ error: 'Вы уже оценили эту игру' });
    throw e;
  }
  const countResult = await db.execute({ sql: 'SELECT COUNT(*) as cnt FROM games WHERE title = ?', args: [title.trim()] });
  const count = countResult.rows[0].cnt;
  const reward = count === 1 ? 2 : 1;
  await db.execute({ sql: 'UPDATE users SET coins = ROUND(coins + ?, 2) WHERE id = ?', args: [reward, req.user.userId] });
  const userRow = (await db.execute({ sql: 'SELECT ROUND(coins, 2) as coins FROM users WHERE id = ?', args: [req.user.userId] })).rows[0];
  if (!userRow) return res.status(401).json({ error: 'Пользователь не найден. Войдите заново.' });
  res.status(201).json({ ok: true, coins: userRow.coins, reward });
});

// PUT /api/games/:id — обновить игру
router.put('/:id', async (req, res) => {
  const err = validateGame(req.body);
  if (err) return res.status(400).json({ error: err });
  const { title, genre, scores, comment, savedAt, coverUrl, posterUrl } = req.body;
  console.log(`[games] PUT "${title}" coverUrl=${coverUrl} posterUrl=${posterUrl}`);
  const game = (await db.execute({ sql: 'SELECT id FROM games WHERE id = ? AND user_id = ?', args: [req.params.id, req.user.userId] })).rows[0];
  if (!game) return res.status(404).json({ error: 'Игра не найдена' });
  const covers = await downloadGameCovers(title.trim(), coverUrl, posterUrl);
  await db.execute({
    sql: `UPDATE games SET title = ?, genre = ?, score_gameplay = ?, score_atmosphere = ?, score_story = ?, score_music = ?, score_technical = ?, score_impression = ?, score_overall = ?, comment = ?, saved_at = ?, cover_url = ?, poster_url = ?, cover_source_url = ?, poster_source_url = ?
    WHERE id = ? AND user_id = ?`,
    args: [title.trim(), genre,
      scores.gameplay, scores.atmosphere ?? null, scores.story ?? null, scores.music ?? null,
      scores.technical, scores.impression, scores.overall, (comment || '').trim(), savedAt, covers.coverUrl, covers.posterUrl, covers.coverSource || '', covers.posterSource || '',
      req.params.id, req.user.userId],
  });
  res.json({ ok: true });
});

// DELETE /api/games/:id — удалить игру
router.delete('/:id', async (req, res) => {
  const result = await db.execute({ sql: 'DELETE FROM games WHERE id = ? AND user_id = ?', args: [req.params.id, req.user.userId] });
  if (result.rowsAffected === 0) return res.status(404).json({ error: 'Игра не найдена' });
  res.json({ ok: true });
});

// GET /api/games/comments — получить комментарии к игре по названию
router.get('/comments', async (req, res) => {
  const title = req.query.title;
  if (!title) return res.status(400).json({ error: 'Укажите название игры' });
  const result = await db.execute({
    sql: `SELECT gc.*, u.username,
      (SELECT COUNT(*) FROM games WHERE user_id = gc.user_id) as commenter_game_count
    FROM game_comments gc JOIN users u ON u.id = gc.user_id
    WHERE gc.game_title = ? ORDER BY gc.created_at ASC`,
    args: [title],
  });
  res.json(result.rows.map((row) => ({
    id: row.id,
    text: row.text,
    username: row.username,
    gameCount: row.commenter_game_count,
    createdAt: row.created_at,
  })));
});

// POST /api/games/comment — оставить комментарий
router.post('/comment', async (req, res) => {
  const { title, text } = req.body;
  if (!title) return res.status(400).json({ error: 'Укажите название игры' });
  if (!text || typeof text !== 'string') return res.status(400).json({ error: 'Укажите текст' });
  const trimmed = text.trim();
  if (!trimmed || trimmed.length > 500) return res.status(400).json({ error: 'Текст от 1 до 500 символов' });
  await db.execute({
    sql: 'INSERT INTO game_comments (game_title, user_id, text) VALUES (?, ?, ?)',
    args: [title, req.user.userId, trimmed],
  });
  res.status(201).json({ ok: true });
});

module.exports = router;
