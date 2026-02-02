/**
 * Normalization and percentage calculation utilities
 * Standardized logic for calculating probabilities and percentages
 */

/**
 * Normalizes scores to percentages using filtered scores (positive only)
 * This prevents negative/zero scores from skewing the normalization
 * 
 * @param {Array} scores - Array of [name, value] pairs
 * @returns {Array} Array of normalized results with percentages
 */
export const normalizeScoresFiltered = (scores) => {
  // Filter to only positive scores
  const filteredScores = scores.filter(([, score]) => score > 0);

  if (filteredScores.length === 0) {
    return [];
  }

  const totalScore = filteredScores.reduce((sum, [, score]) => sum + score, 0);

  if (totalScore <= 0) {
    return [];
  }

  return filteredScores.map(([name, score]) => {
    const percentage = (score / totalScore) * 100;
    return {
      name,
      score,
      percentage: Number(percentage.toFixed(1))
    };
  });
};

/**
 * Normalizes scores to percentages using all scores (including zero/negative)
 * Useful when you want to normalize all scores regardless of sign
 * 
 * @param {Array} scores - Array of [name, value] pairs
 * @returns {Array} Array of normalized results with percentages
 */
export const normalizeScoresAll = (scores) => {
  if (scores.length === 0) {
    return [];
  }

  const totalScore = scores.reduce((sum, [, score]) => sum + score, 0);

  if (totalScore <= 0) {
    return [];
  }

  return scores.map(([name, score]) => {
    const percentage = (totalScore > 0 ? (score / totalScore) * 100 : 0);
    return {
      name,
      score,
      percentage: Number(percentage.toFixed(1))
    };
  });
};

/**
 * Gets top N scores and returns normalized percentages
 * 
 * @param {Object} scoresObject - Object with name: score pairs
 * @param {number} topN - Number of top scores to return (default: 4)
 * @param {boolean} filtered - Whether to filter negative scores (default: true)
 * @returns {Array} Top N normalized results with percentages
 */
export const getTopNormalized = (scoresObject, topN = 4, filtered = true) => {
  if (!scoresObject || Object.keys(scoresObject).length === 0) {
    return [];
  }

  const topScores = Object.entries(scoresObject)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN);

  if (filtered) {
    return normalizeScoresFiltered(topScores);
  } else {
    return normalizeScoresAll(topScores);
  }
};

/**
 * Calculates percentage for a single score against a total
 * 
 * @param {number} score - Individual score
 * @param {number} total - Total sum of scores
 * @returns {number} Percentage (0-100)
 */
export const calculatePercentage = (score, total) => {
  if (total <= 0) {
    return 0;
  }
  return Number(((score / total) * 100).toFixed(1));
};
