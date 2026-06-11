const { RARITIES, SKINS } = require('../data/skins');

const BAIT_POOL = [...SKINS.pink, ...SKINS.red, ...SKINS.gold];
const BAIT_RARITIES = { pink: RARITIES.pink, red: RARITIES.red, gold: RARITIES.gold };
const BAIT_RARITY_KEYS = Object.keys(BAIT_RARITIES);

function pickSkin(caseData) {
  const totalWeight = caseData.drops.reduce((s, d) => s + d.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const drop of caseData.drops) {
    roll -= drop.weight;
    if (roll <= 0) {
      const rarity = drop.rarity;
      const pool = SKINS[rarity];
      const skin = pool[Math.floor(Math.random() * pool.length)];
      const r = RARITIES[rarity];
      return { ...skin, rarity, rarityLabel: r.label, value: skin.value, rarityHex: r.hex, rarityGlow: r.glow };
    }
  }
  const fallback = SKINS.white[0];
  return { ...fallback, rarity: 'white', rarityLabel: RARITIES.white.label, value: fallback.value, rarityHex: RARITIES.white.hex, rarityGlow: RARITIES.white.glow };
}

function pickBaitSkin() {
  const skin = BAIT_POOL[Math.floor(Math.random() * BAIT_POOL.length)];
  let rarity = 'pink';
  for (const key of BAIT_RARITY_KEYS) {
    if (SKINS[key].some((s) => s.name === skin.name)) { rarity = key; break; }
  }
  const r = BAIT_RARITIES[rarity];
  return { ...skin, rarity, rarityLabel: r.label, value: skin.value, rarityHex: r.hex, rarityGlow: r.glow };
}

function pickNeighbors(caseId) {
  const neighbors = [];
  const chances = caseId === 'base' ? { left: 0.4, right: 0.2 }
    : caseId === 'mid' ? { left: 0.3, right: 0.15 }
    : { left: 0.15, right: 0.08 };
  if (Math.random() < chances.left) neighbors.push({ position: -1, skin: pickBaitSkin() });
  if (Math.random() < chances.right) neighbors.push({ position: 1, skin: pickBaitSkin() });
  return neighbors;
}

module.exports = { pickSkin, pickBaitSkin, pickNeighbors };
