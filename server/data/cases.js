const CASES = [
  {
    id: 'base',
    name: 'Базовый кейс',
    price: 1,
    image: '/cases/base-case.png',
    drops: [
      { rarity: 'white', weight: 55 },
      { rarity: 'sky',   weight: 28 },
      { rarity: 'blue',  weight: 10 },
      { rarity: 'purple', weight: 4 },
      { rarity: 'pink',  weight: 1.5 },
      { rarity: 'red',   weight: 0.7 },
      { rarity: 'gold',  weight: 0.3 },
    ],
  },
  {
    id: 'mid',
    name: 'Средний кейс',
    price: 3,
    image: '/cases/mid-case.png',
    drops: [
      { rarity: 'white', weight: 12 },
      { rarity: 'sky',   weight: 20 },
      { rarity: 'blue',  weight: 25 },
      { rarity: 'purple', weight: 20 },
      { rarity: 'pink',  weight: 12 },
      { rarity: 'red',   weight: 7 },
      { rarity: 'gold',  weight: 4 },
    ],
  },
  {
    id: 'best',
    name: 'Крутой кейс',
    price: 10,
    image: '/cases/best-case.png',
    drops: [
      { rarity: 'white', weight: 2 },
      { rarity: 'sky',   weight: 5 },
      { rarity: 'blue',  weight: 8 },
      { rarity: 'purple', weight: 12 },
      { rarity: 'pink',  weight: 20 },
      { rarity: 'red',   weight: 28 },
      { rarity: 'gold',  weight: 25 },
    ],
  },
];

module.exports = CASES;
