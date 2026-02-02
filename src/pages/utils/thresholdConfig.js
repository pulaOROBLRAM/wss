/**
 * Unified threshold configuration
 * Single source of truth for disease category thresholds
 */

export const CATEGORY_THRESHOLDS = {
  INFLAMMATORY: 25,
  INFECTIOUS: 20,
  AUTOIMMUNE: 30,
  BENIGN_GROWTH: 15,
  PIGMENTARY: 25,
  SKIN_CANCER: 10,
  ENVIRONMENTAL: 20,
  DEFAULT: 25
};

/**
 * Get threshold for a specific category
 * @param {string} category - Disease category
 * @returns {number} Threshold value
 */
export const getThreshold = (category) => {
  return CATEGORY_THRESHOLDS[category] || CATEGORY_THRESHOLDS.DEFAULT;
};
