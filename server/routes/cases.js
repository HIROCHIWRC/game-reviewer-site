const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const CASES = require('../data/cases');
const { RARITIES, SKINS } = require('../data/skins');
const { pickSkin, pickNeighbors } = require('../services/caseLogic');

const router = express.Router();
router.use(authMiddleware);

function buildPool(caseData) {
  const pool = [];
  for (const drop of caseData.drops) {
    const rarity = drop.rarity;
    const r = RARITIES[rarity];
    for (const skin of SKINS[rarity]) {
      pool.push({ name: skin.name, image: skin.image, rarity, rarityLabel: r.label, hex: r.hex, glow: r.glow, value: skin.value });
    }
  }
  return pool;
}

function enrichItem(item) {
  return {
    id: item.id,
    name: item.skin_name,
    rarity: item.skin_rarity,
    value: item.skin_value,
    image: item.skin_image,
    caseType: item.case_type,
    openedAt: item.opened_at,
    isEquipped: !!item.is_equipped,
    rarityLabel: RARITIES[item.skin_rarity]?.label || '',
    rarityHex: RARITIES[item.skin_rarity]?.hex || '#94a3b8',
    rarityGlow: RARITIES[item.skin_rarity]?.glow || 'rgba(148,163,184,0.3)',
  };
}

// GET /api/cases/data
router.get('/data', (req, res) => {
  const cases = CASES.map((c) => ({
    id: c.id,
    name: c.name,
    price: c.price,
    image: c.image,
    drops: c.drops.map((d) => ({ rarity: d.rarity, label: RARITIES[d.rarity]?.label || '', hex: RARITIES[d.rarity]?.hex || '#666', weight: d.weight })),
    pool: buildPool(c),
  }));
  res.json({ version: '1.0.2', cases });
});

// GET /api/cases/inventory
router.get('/inventory', async (req, res) => {
  const result = await db.execute({
    sql: 'SELECT id, skin_name, skin_rarity, skin_value, skin_image, case_type, opened_at, is_equipped FROM user_items WHERE user_id = ? ORDER BY opened_at DESC',
    args: [req.user.userId],
  });
  res.json({ items: result.rows.map(enrichItem) });
});

// POST /api/cases/sell
router.post('/sell', async (req, res) => {
  const { itemId } = req.body;
  if (!itemId) return res.status(400).json({ error: 'Нужен ID предмета' });

  const item = (await db.execute({ sql: 'SELECT id, user_id, skin_name, skin_value FROM user_items WHERE id = ?', args: [itemId] })).rows[0];
  if (!item) return res.status(404).json({ error: 'Предмет не найден' });
  if (item.user_id !== req.user.userId) return res.status(403).json({ error: 'Это не твой предмет' });

  await db.execute('BEGIN');
  try {
    await db.execute({ sql: 'DELETE FROM user_items WHERE id = ?', args: [itemId] });
    await db.execute({ sql: 'UPDATE users SET coins = ROUND(coins + ?, 2) WHERE id = ?', args: [item.skin_value, req.user.userId] });
    await db.execute('COMMIT');
  } catch (e) {
    await db.execute('ROLLBACK');
    throw e;
  }

  const newBalance = (await db.execute({ sql: 'SELECT ROUND(coins, 2) as coins FROM users WHERE id = ?', args: [req.user.userId] })).rows[0].coins;
  res.json({ ok: true, coins: newBalance, sold: item.skin_name, value: item.skin_value });
});

// POST /api/cases/open
router.post('/open', async (req, res) => {
  const { caseId } = req.body;
  const caseData = CASES.find((c) => c.id === caseId);
  if (!caseData) return res.status(400).json({ error: 'Кейс не найден' });

  const row = (await db.execute({ sql: 'SELECT coins FROM users WHERE id = ?', args: [req.user.userId] })).rows[0];
  const balance = Math.round((row?.coins || 0) * 100) / 100;
  if (balance < caseData.price) return res.status(400).json({ error: 'Недостаточно монет' });

  await db.execute({ sql: 'UPDATE users SET coins = ROUND(coins - ?, 2) WHERE id = ?', args: [caseData.price, req.user.userId] });

  const skin = pickSkin(caseData);
  const insert = await db.execute({
    sql: 'INSERT INTO user_items (user_id, skin_name, skin_rarity, skin_value, skin_image, case_type) VALUES (?, ?, ?, ?, ?, ?)',
    args: [req.user.userId, skin.name, skin.rarity, skin.value, skin.image, caseId],
  });

  const newBalance = (await db.execute({ sql: 'SELECT ROUND(coins, 2) as coins FROM users WHERE id = ?', args: [req.user.userId] })).rows[0].coins;

  res.json({ skin: { ...skin, itemId: Number(insert.lastInsertRowid) }, coins: newBalance, neighbors: pickNeighbors(caseId) });
});

module.exports = router;
