import { SCORE_MULTIPLIERS } from '../constants/gameConstants';

/**
 * Рассчитывает итоговый балл с учётом весовых коэффициентов.
 * Параметры atmosphere, story, music могут быть отключены (null).
 */
export const calculateOverallScore = ({ gameplay, atmosphere, story, music, technical, impression, hasAtmosphere, hasStory, hasMusic }) => {
  let totalPoints = 0;
  let activeMultipliersSum = 0;

  totalPoints += gameplay * SCORE_MULTIPLIERS.gameplay;
  activeMultipliersSum += SCORE_MULTIPLIERS.gameplay;

  totalPoints += technical * SCORE_MULTIPLIERS.technical;
  activeMultipliersSum += SCORE_MULTIPLIERS.technical;

  totalPoints += impression * SCORE_MULTIPLIERS.impression;
  activeMultipliersSum += SCORE_MULTIPLIERS.impression;

  if (hasAtmosphere) {
    totalPoints += atmosphere * SCORE_MULTIPLIERS.atmosphere;
    activeMultipliersSum += SCORE_MULTIPLIERS.atmosphere;
  }
  if (hasStory) {
    totalPoints += story * SCORE_MULTIPLIERS.story;
    activeMultipliersSum += SCORE_MULTIPLIERS.story;
  }
  if (hasMusic) {
    totalPoints += music * SCORE_MULTIPLIERS.music;
    activeMultipliersSum += SCORE_MULTIPLIERS.music;
  }

  if (activeMultipliersSum === 0) return 0;
  return Math.round((totalPoints / activeMultipliersSum) * 100) / 100;
};

/**
 * Склонение слова «игра» по числу.
 */
export const getGameWordForm = (count) => {
  const main = count % 10;
  const broad = count % 100;
  if (broad >= 11 && broad <= 19) return 'игр';
  if (main === 1) return 'игра';
  if (main >= 2 && main <= 4) return 'игры';
  return 'игр';
};