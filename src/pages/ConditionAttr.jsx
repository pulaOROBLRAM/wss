
  const DISEASES = {
    INFLAMMATORY: {
      "Acne": {
        attributes: [1, 0, 0, 1, 0, 1],
        weights: [4.8, 2.0, 2.0, 3.8, 2.0, 3.2] 
      },
      "Acne_Keloidalis_Nuchae": {
        attributes: [1, 1, 1, 1, 0, 0],
        weights: [2.8, 1.2, 3.8,  4.2, 2.0, 2.0]
      },  
      "Atopic_Dermatitis": {
        attributes: [0, 1, 1, 1, 1, 1],
        weights: [2.0, 5.2, 2.8, 2.2, 4.2, 2.8]
      },
      "Contact_Dermatitis": {
        attributes: [1, 1, 1, 1, 1, 1],
        weights: [2.8, 3.5, 3.2, 2.2, 2.8, 3.5]
      },
      "Seborrheic_  Dermatitis": {
        attributes: [0, 1, 0, 1, 1, 0],
        weights: [2.0, 3.2, 2.0, 1.8, 5.2, 2.0]
      },
      "Psoriasis": {
        attributes: [1, 1, 0, 1, 1, 0],
        weights: [2.2, 2.8, 2.0, 2.8, 5.5, 2.0] 
      }
    },

    INFECTIOUS: {
      "Boils": {
        attributes: [0, 1, 1, 0, 1, 1],
        weights: [2.0, 4.8, 2.0, 2.0, 5.7, 1.0] 
      },
      "Cellulitis": {
        attributes: [0, 1, 0, 0, 1, 0],
        weights: [2.0, 5.0, 2.0, 2.0, 7.5, 2.0] 
      },
      "Folliculitis": {
        attributes: [0, 0, 0, 0, 1, 1],
        weights: [2.0, 2.0, 2.0, 2.0, 4.2, 3.7] 
      },  
      "Impetigo": {
        attributes: [0, 1, 1,  0, 0, 1],
        weights: [2.0, 3.7, 5.2, 2.0, 2.0, 2.7] 
      },
      "Cold_Sores": {
        attributes: [0, 0, 1, 0, 1, 0],
        weights: [2.0, 2.0, 6.3, 2.0, 4.2, 2.0] 
      },
      "Molluscum_Contagiosum": {
        attributes: [0, 0, 0, 1, 0, 0],
        weights: [2.0, 2.0, 2.0, 7.2, 2.0, 2.0] 
      },
      "Ringworm": {
        attributes: [1, 0, 0, 0, 0, 1],
        weights: [7.5, 2.0, 2.0, 2.0, 2.0, 4.8] 
      }
    },

    AUTOIMMUNE: {
      "Vitiligo": {
        attributes: [1, 0, 0, 1, 0, 0],
        weights: [3.5, 2.0, 2.0, 1.2, 2.0, 2.0] 
      },
      "Lupus": {
        attributes: [0, 1, 1, 0, 1, 1],
        weights: [1.5, 3.5, 3.2, 1.5, 2.8, 2.5]  
      },
      "Drug_Induced_Pigmentation": {  
        attributes: [0, 0, 1, 1, 1, 0],
        weights: [2.0, 2.0, 2.8, 2.5, 1.2, 2.0] 
      },
      "Lichen_related_diseases": {
        attributes: [0, 1, 1, 1, 1, 1],
        weights: [2.0, 3.0, 2.2, 1.5, 2.5, 1.8]  
      }
    },

    BENIGN_GROWTH: {
      "Dermatofibroma": {
        attributes: [1, 1, 0, 1, 0, 0, 1, 1, 1],
        weights: [0.1, 0.2, 0, 0.1, 0, 0, 0.3, 0.9, 0.3]
      },
      "Digital_Mucous_Cyst": {
        attributes: [0, 1, 0, 1, 0, 0, 1, 1, 1],
        weights: [0, 0.3, 0, 0.1, 0, 0, 0.2, 0.8, 0.5]
      },
      "Cyst": {
        attributes: [0, 1, 0, 1, 0, 0, 1, 1, 1],
        weights: [0, 0.4, 0, 0.2, 0, 0, 0.2, 0.9, 0.2]
      },
      "Lipoma": {
        attributes: [0, 1, 0, 1, 0, 0, 1, 1, 1],
        weights: [0, 0.1, 0, 0.1, 0, 0, 0.1, 0.8, 0.4]
      },
      "Keloids": {
        attributes: [1, 1, 0, 1, 0, 0, 1, 1, 1],
        weights: [0.2, 0.3, 0, 0.2, 0, 0, 0.3, 0.9, 0.1]
      }
    },

    PIGMENTARY: {
      "Age_Spots": {
        attributes: [0, 0, 0, 1, 0, 0, 1, 0, 1],
        weights: [0, 0, 0, 0.1, 0, 0, 0.2, 0, 0.8]
      },
      "Dyschromia": {
        attributes: [0, 0, 0, 1, 0, 0, 1, 0, 1],
        weights: [0, 0, 0, 0.3, 0, 0, 0.7, 0, 0.6]
      },
      "Melasma": {
        attributes: [0, 0, 0, 1, 0, 0, 1, 0, 1],
        weights: [0, 0, 0, 0.2, 0, 0, 0.5, 0, 0.7]
      },
      "Hyperpigmentation": {
        attributes: [0, 0, 0, 1, 0, 0, 1, 0, 1],
        weights: [0, 0, 0, 0.4, 0, 0, 0.6, 0, 0.5]
      },
      "Varicose_Veins": {
        attributes: [1, 1, 0, 1, 0, 0, 1, 0, 1],
        weights: [0.3, 0.4, 0, 0.1, 0, 0, 0.2, 0, 0.3]
      }
    },

    SKIN_CANCER: {
      "Actinic_Keratosis": {
        attributes: [1, 1, 0, 1, 0, 1, 1, 1, 1],
        weights: [0.2, 0.1, 0, 0.6, 0, 0.8, 0.4, 0.3, 0.2]
      },
      "Basal_Cell_Cancer": {
        attributes: [1, 1, 0, 1, 0, 1, 1, 1, 1],
        weights: [0.1, 0.2, 0, 0.7, 0, 0.3, 0.5, 0.4, 0.3]
      },
      "Squamous_Cell_Cancer": {
        attributes: [1, 1, 0, 1, 0, 1, 1, 1, 1],
        weights: [0.2, 0.3, 0, 0.8, 0, 0.4, 0.6, 0.3, 0.2]
      },
      "Melanoma": {
        attributes: [1, 1, 0, 1, 0, 1, 1, 1, 1],
        weights: [0.1, 0.1, 0, 0.9, 0, 0.2, 0.9, 0.2, 0.1]
      }
    },

    ENVIRONMENTAL: {
      "Poison_Ivy": {
        attributes: [1, 1, 0, 1, 1, 1, 1, 1, 0],
        weights: [0.9, 0.3, 0, 0.2, 0.6, 0.2, 0.3, 0.1, 0]
      },
      "Razor_Bumps": {
        attributes: [1, 1, 0, 1, 1, 1, 1, 1, 0],
        weights: [0.2, 0.4, 0, 0.1, 0.3, 0.1, 0.1, 0.8, 0]
      },
      "Dry_Skin": {
        attributes: [1, 1, 0, 1, 0, 1, 1, 0, 0],
        weights: [0.6, 0.1, 0, 0.1, 0, 0.9, 0.1, 0, 0]
      },
      "Hyperhidrosis": {
        attributes: [1, 0, 0, 1, 0, 1, 1, 0, 0],
        weights: [0.2, 0, 0, 0.1, 0, 0.3, 0.1, 0, 0]
      },
      "Sun_damage": {
        attributes: [1, 0, 0, 1, 0, 1, 1, 0, 1],
        weights: [0.1, 0, 0, 0.3, 0, 0.2, 0.4, 0, 0.6]
      }
    }
  };

  export { DISEASES };