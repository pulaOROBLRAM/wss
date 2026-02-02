/**
 * Unified category utilities
 * Single source of truth for category mapping and categorization logic
 */

/**
 * Maps a condition name to its disease category
 * Consolidates all keyword mappings from across the application
 */
export const getTargetCategory = (topPredictionCondition) => {
  if (!topPredictionCondition) return 'DEFAULT';

  const condition = topPredictionCondition.toLowerCase().trim();

  // Comprehensive category mapping with all known keywords
  const categories = {
    INFLAMMATORY: [
      'acne',
      'dermatitis',
      'atopic_dermatitis',
      'contact_dermatitis',
      'seborrheic_dermatitis',
      'psoriasis',
      'acne_keloidalis_nuchae'
    ],
    INFECTIOUS: [
      'molluscum contagiosum',
      'molluscum_contagiosum',
      'ringworm',
      'warts',
      'boils',
      'cellulitis',
      'folliculitis',
      'impetigo',
      'cold_sores',
      'cold sores'
    ],
    AUTOIMMUNE: ['vitiligo', 'lupus', 'drug_induced_pigmentation', 'lichen'],
    BENIGN_GROWTH: [
      'dermatofibroma',
      'digital_mucous_cyst',
      'cyst',
      'lipoma',
      'keloids'
    ],
    SKIN_CANCER: [
      'cancer',
      'actinic',
      'basal',
      'squamous',
      'melanoma',
      'actinic_keratosis',
      'basal_cell_cancer',
      'squamous_cell_cancer'
    ],
    PIGMENTARY: [
      'pigmentary',
      'melasma',
      'hyperpigmentation',
      'age_spots',
      'age spots',
      'dyschromia',
      'varicose_veins'
    ],
    ENVIRONMENTAL: [
      'environmental',
      'poison',
      'razor',
      'dry',
      'sun',
      'poison_ivy',
      'razor_bumps',
      'dry_skin',
      'hyperhidrosis',
      'sun_damage'
    ]
  };

  // First try exact match (handle underscores and spaces)
  const normalizedCondition = condition.replace(/[_\s]/g, '');
  for (const [category, keywords] of Object.entries(categories)) {
    const exactMatch = keywords.some(keyword => {
      const normalizedKeyword = keyword.replace(/[_\s]/g, '');
      return normalizedCondition === normalizedKeyword;
    });

    if (exactMatch) {
      return category;
    }
  }

  // Then try partial match
  for (const [category, keywords] of Object.entries(categories)) {
    if (
      keywords.some(
        keyword =>
          condition.includes(keyword) || keyword.includes(condition)
      )
    ) {
      return category;
    }
  }

  return 'DEFAULT';
};

/**
 * Gets all available disease categories
 */
export const DISEASE_CATEGORIES = {
  INFLAMMATORY: 'INFLAMMATORY',
  INFECTIOUS: 'INFECTIOUS',
  AUTOIMMUNE: 'AUTOIMMUNE',
  BENIGN_GROWTH: 'BENIGN_GROWTH',
  SKIN_CANCER: 'SKIN_CANCER',
  PIGMENTARY: 'PIGMENTARY',
  ENVIRONMENTAL: 'ENVIRONMENTAL',
  DEFAULT: 'DEFAULT'
};
