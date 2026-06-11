export const ITEM_W     = 140;
export const ITEM_GAP   = 8;
export const ITEM_STEP  = ITEM_W + ITEM_GAP;
export const ITEM_H     = 160;
export const VIEWPORT_W = 720;

export const TOTAL_ITEMS = 80;
export const TARGET_IDX  = 60;

export const END_X   = VIEWPORT_W / 2 - TARGET_IDX * ITEM_STEP - ITEM_W / 2;
export const START_X = VIEWPORT_W;

export function pickWeightedSkin(pool, drops) {
  const totalWeight = drops.reduce((s, d) => s + d.weight, 0);
  let roll = Math.random() * totalWeight;
  let pickedRarity = drops[0].rarity;
  for (const drop of drops) {
    roll -= drop.weight;
    if (roll <= 0) { pickedRarity = drop.rarity; break; }
  }
  const candidates = pool.filter((s) => s.rarity === pickedRarity);
  return candidates.length > 0 ? candidates[Math.floor(Math.random() * candidates.length)] : pool[0];
}
