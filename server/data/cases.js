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
      { rarity: 'white', weight: 35 },
      { rarity: 'sky',   weight: 28 },
      { rarity: 'blue',  weight: 20 },
      { rarity: 'purple', weight: 10 },
      { rarity: 'pink',  weight: 4 },
      { rarity: 'red',   weight: 2 },
      { rarity: 'gold',  weight: 1 },
    ],
  },
  {
    id: 'best',
    name: 'Крутой кейс',
    price: 10,
    image: '/cases/best-case.png',
    drops: [
      { rarity: 'white', weight: 22 },
      { rarity: 'sky',   weight: 22 },
      { rarity: 'blue',  weight: 22 },
      { rarity: 'purple', weight: 15 },
      { rarity: 'pink',  weight: 9 },
      { rarity: 'red',   weight: 5 },
      { rarity: 'gold',  weight: 5 },
    ],
  },
];

module.exports = CASES;
