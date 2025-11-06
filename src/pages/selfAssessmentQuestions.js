export const CATEGORY_QUESTIONS = {
  INFLAMMATORY: [
    {
      id: 1,
      text: "Does it feel painful or tender when touched?",
      options: ["Yes", "Not at all"],
      attribute: 'painful'
    },
    {
      id: 2,
      text: "Is the area itchy or causing discomfort?",
      options: ["Yes", "Not at all"],
      attribute: 'itchy'
    },
    {
      id: 3,
      text: "Is it getting bigger, redder, or spreading?",
      options: ["Yes", "Not at all"],
      attribute: 'changing_shape'
    },
    {
      id: 4,
      text: "Are there raised bumps or swollen areas?",
      options: ["Yes", "Not at all"],
      attribute: 'bump'
    },  
    {
      id: 5,
      text: "Is the skin flaky, scaly, or peeling?",
      options: ["Yes", "Not at all"],
      attribute: 'rough_scaly'
    },
    {
      id: 6,
      text: "Do you see pus-filled bumps or blisters?",
      options: ["Yes", "Not at all"],
      attribute: 'blisters'
    }
  ],
  
  INFECTIOUS: [
    {
    id: 1,
    text: "Does it have a circular or ring-like shape?",
    options: ["Yes", "Not at all"],
    attribute: 'ring_shape'
  },
  {
    id: 2, 
    text: "Is it spreading to other areas or getting bigger?",
    options: ["Yes", "Not at all"],
    attribute: 'changing_shape'
  },
  {
    id: 3,
    text: "Are there fluid-filled blisters or pus?",
    options: ["Yes", "Not at all"],
    attribute: 'blisters'
  },
  {
    id: 4,
    text: "Does it look smooth, shiny, or pearly?",
    options: ["Yes", "Not at all"],
    attribute: 'shiny_sticker'
  },
  {
    id: 5,
    text: "Is the area painful or tender?",
    options: ["Yes", "Not at all"],
    attribute: 'painful'
  },
  {
    id: 6,
    text: "Does it feel itchy or irritating?",
    options: ["Yes", "Not at all"],
    attribute: 'itchy'
  }
  ],
  
  AUTOIMMUNE: [
  {
    id: 1,
    text: "Is there white patches where skin has lost color?",
    options: ["Yes", "Not at all"],
    attribute: 'pigment_loss'
  },
  {
    id: 2,
    text: "Does the skin feel rough, scaly, or thickened?",
    options: ["Yes", "Not at all"],
    attribute: 'rough_scaly'
  },
  {
    id: 3,
    text: "Does the spot have uneven borders or multiple colors?",
    options: ["Yes", "Not at all"],
    attribute: 'uneven_shape'
  },
  {
    id: 4,
    text: "Is it getting bigger, spreading, or changing shape?",
    options: ["Yes", "Not at all"],
    attribute: 'changing_shape'
  },
  {
    id: 5,
    text: "Is the area itchy or causing discomfort?",
    options: ["Yes", "Not at all"],
    attribute: 'itchy'
  },
  {
    id: 6,
    text: "Does it feel painful or tender?",
    options: ["Yes", "Not at all"],
    attribute: 'painful'
  }
  ],
  
  BENIGN_GROWTH: [

  ],
  
  PIGMENTARY: [

  ],
  
  SKIN_CANCER: [

  ],
  
  ENVIRONMENTAL: [

  ],
  

  DEFAULT: [

  ]
};

export const BASE_QUESTIONS = {
  1: { id: 1, text: "Does it feel itchy?", options: ["Yes", "Not at all"], attribute: 'itchy' },
  2: { id: 2, text: "Does it hurt or feel sore when you touch it?", options: ["Yes", "Not at all"], attribute: 'painful' },
  3: { id: 3, text: "Does it look like a ring or circle on the skin?", options: ["Yes", "Not at all"], attribute: 'ring_shape' },
  4: { id: 4, text: "Have you noticed the spot getting darker, bigger, or changing shape?", options: ["Yes", "Not at all"], attribute: 'changing_shape' },
  5: { id: 5, text: "Do you see small blisters filled with clear fluid?", options: ["Yes", "Not at all"], attribute: 'blisters' },
  6: { id: 6, text: "Does the skin feel rough, scaly, or flaky?", options: ["Yes", "Not at all"], attribute: 'rough_scaly' },
  7: { id: 7, text: "Does the spot look uneven in shape or have more than one color?", options: ["Yes", "Not at all"], attribute: 'uneven_shape' },
  8: { id: 8, text: "Does it look like a small bump that sticks up from the skin?", options: ["Yes", "Not at all"], attribute: 'bump' },
  9: { id: 9, text: "Does it look smooth and shiny, or as if it's sitting on top of the skin like a sticker?", options: ["Yes", "Not at all"], attribute: 'shiny_sticker' }
};

export const getQuestionsForCategory = (category) => {
  return CATEGORY_QUESTIONS[category] || CATEGORY_QUESTIONS.DEFAULT;
};

export const getTopPrediction = (predictions) => {
  if (!predictions) return '';
  
  if (Array.isArray(predictions) && predictions.length > 0) {
    return predictions[0]?.condition || '';
  } else if (predictions.top_prediction) {
    return predictions.top_prediction;
  } else if (typeof predictions === 'string') {
    return predictions;
  } else if (predictions.predictions && typeof predictions.predictions === 'object') {
    const predArray = Object.entries(predictions.predictions);
    if (predArray.length > 0) {
      return predArray.sort((a, b) => b[1] - a[1])[0][0];
    }
  }
  
  return '';
};

export const getTargetCategory = (topPredictionCondition) => {
  if (!topPredictionCondition) return 'DEFAULT';

  const condition = topPredictionCondition.toLowerCase();

  const categories = {
    INFLAMMATORY: ['acne', 'dermatitis', 'psoriasis'],
    INFECTIOUS: ['molluscum contagiosum', 'ringworm', 'warts', 'boils', 'cellulitis', 'folliculitis', 'impetigo'],
    AUTOIMMUNE: ['vitiligo', 'lupus'],
    SKIN_CANCER: ['cancer', 'melanoma', 'carcinoma', 'keratosis'],
    PIGMENTARY: ['pigmentary', 'melasma', 'hyperpigmentation', 'age spots'],
    ENVIRONMENTAL: ['environmental', 'poison ivy', 'razor bumps', 'dry skin', 'sun damage']
  };

  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => condition.includes(keyword))) {
      return category;
    }
  }
  
  return 'DEFAULT';
};

export const getPersonalizedQuestions = (predictions) => {
  const topPrediction = getTopPrediction(predictions);
  const category = getTargetCategory(topPrediction);
  const questions = getQuestionsForCategory(category);
  
  console.log('Personalized Assessment:', {
    topPrediction,
    category,
    questionCount: questions.length
  });
  
  return {
    questions,
    category,
    topPrediction
  };
};

export default CATEGORY_QUESTIONS;