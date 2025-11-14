const CONDITION_DESCRIPTIONS = {
  "Acne": {
    name: "Acne",
    description: "Acne is a common medical skin condition affecting up to 90% of adolescents and sometimes adults. It causes pimples, blackheads, and cysts, mainly on the face, chest, and back. Though often seen as cosmetic, it requires treatment to prevent scarring and emotional distress.",
    causes: "Acne develops when pores clog with oil, dead skin cells, and bacteria, causing inflammation. Whiteheads occur when pores are fully blocked, while blackheads form when clogged pores remain open and darken on exposure to air. Excess oil and inflammation can lead to deeper cysts and nodules. Causes include hormonal, genetic, and environmental factors. Androgens, which rise during puberty, menstruation, and pregnancy, increase oil production. Family history, comedogenic products, certain medications, diet, and stress can also trigger acne.",

  },
  "Acne Keloidalis Nuchae": {
    name: "Acne Kleoidalis Nuchae",
    description: "Acne keloidalis nuchae (AKN), or keloidal folliculitis, is a chronic skin condition causing acne-like bumps on the scalp and neck. It starts with inflamed, pus-filled follicles that form small scars, which can grow into thick keloids leading to permanent hair loss. Tufted “doll hairs” may appear, with itching and pain common, though cosmetic disfigurement most affects quality of life.",
    treatment: "AKN is a chronic condition with periodic inflammatory flares. Treatment focuses on controlling inflammation and requires ongoing maintenance and adjustment during flares. Behavioral counseling helps patients avoid triggers. Inflammation can improve with treatment, but keloidal scarring remains.",
    causes: "AKN is a chronic condition with periodic inflammatory flares. Treatment focuses on controlling inflammation and requires ongoing maintenance and adjustment during flares. Behavioral counseling helps patients avoid triggers. Inflammation can improve with treatment, but keloidal scarring remains.",

  },
  "Atopic Dermatitis": {
    name: "Atopic Dermatitis",
    description: "Atopic dermatitis (eczema) is a chronic, itchy, and flaky skin condition often affecting the face, arms, and legs. It results from a gene variation that weakens the skin’s barrier, causing dryness and sensitivity. Flares occur due to allergens, irritants, or environmental factors and are more common in people with asthma or allergies. Common in children, eczema often appears before age five; about 60% outgrow it by adulthood, though some continue to have chronic, relapsing symptoms.",
    treatment: "Though there is no cure for eczema, there are treatments that can relieve its symptoms.",
    causes: "Atopic dermatitis is caused by a combination of genetic, immune, and environmental factors that weaken the skin barrier, making it dry and prone to irritation. It often runs in families and can be triggered by allergens, stress, heat, or harsh soaps.",

  },
  "Contact Dermatitis": {
    name: "Contact Dermatitis",
    description: "Seborrheic dermatitis, also known as severe dandruff, is a skin condition that causes red, scaly, and flaky patches on areas with more hair, like the scalp, face, chest, and back. It can cause itchiness or discomfort and is called cradle cap in infants.",
    treatment: "Treatment usually involves using prescribed creams to reduce itching and inflammation, along with oral medications when symptoms are more severe or infection is present.",
    causes: "Contact dermatitis occurs when the skin reacts to an irritant or allergen, such as soaps, chemicals, or metals, causing redness, itching, and rash.",

  },
    "Seborrheic Dermatitis": {
    name: "Seborrheic dermatitis",
    description: "Seborrheic dermatitis, also known as severe dandruff, is a skin condition that causes red, scaly, and flaky patches on areas with more hair, like the scalp, face, chest, and back. It can cause itchiness or discomfort and is called cradle cap in infants.",
    treatment: "Treatment usually involves using prescribed creams to reduce itching and inflammation, along with oral medications when symptoms are more severe or infection is present.",
    causes: "Seborrheic dermatitis is mainly caused by the overgrowth of Malassezia yeast on oily skin, combined with excess sebum production and an abnormal immune response. Factors like stress, cold weather, hormonal changes, and certain illnesses can trigger or worsen it.",

  },
  "Psoriasis": {
    name: "Psoriasis",
    description: "Psoriasis causes thick, pink, scaly plaques on areas like the elbows, knees, scalp, and back. It often flares and improves over time. Some patients develop psoriatic arthritis, which affects the joints, and nail psoriasis, which causes nail discoloration and pitting. The exact cause is unknown but tends to run in families. A variant called palmo-plantar psoriasis affects the palms and soles, sometimes leading to severe nail damage and may be triggered by certain treatments for psoriasis or Crohn’s disease.",
    treatment: "moderate",
    causes: "Psoriasis is caused by an overactive immune system that speeds up skin cell growth. It often runs in families and can be triggered by stress, infections, cold weather, skin injury, certain medications, smoking, or alcohol.",

  },
  "Boils":{
    name: "Boils",
    description: "boil (furuncle) is a painful, pus-filled bump that starts as a red lump and grows as it fills with pus. It commonly appears on hair-bearing, sweaty, or friction-prone areas like the neck, armpits, thighs, and buttocks. When multiple boils merge, they form a larger infection called a carbuncle. Diagnosis is usually made by visual examination.",
    treatment: "Treatment may involve a minor procedure to remove trapped pus, and in more serious or recurring cases, medication may be prescribed to control the infection.",
    causes: "Boils originate due to the rapid buildup of pus caused by a bacterial infection in hair follicles under the skin. As excessive amounts of pus fill the small bumps, the growth becomes larger and more painful, eventually leading to its own rupture and drainage.",

  },
  "Cellulitis":{
    name: "Cellulitis",
    description: "Cellulitis is a bacterial skin infection, usually caused by Staph or Strep bacteria entering through breaks in the skin. It leads to redness, swelling, and pain. Most cases are mild and resolve with oral antibiotics, but severe infections can spread and require urgent medical care. People with worsening symptoms or higher risk of complications should seek prompt treatment.",
    treatment: "Treatment focuses on taking prescribed medication for the full duration, keeping the affected area elevated to reduce swelling, and maintaining proper skin hygiene to support healing and prevent infection.",
    causes: "Cellulitis is caused by bacteria, most commonly Streptococcus or Staphylococcus aureus, entering through breaks in the skin such as cuts, insect bites, or ulcers. It leads to redness, swelling, warmth, and pain in the affected area.",

  },
  "Bullous Disease": {
    name: "Bullous Disease",
    description: "Painful blisters that appear when the body attacks the skin—can be serious and need long-term care.",
    treatment: "moderate",
    causes: " ",

  },
  "Folliculitis": {
    name: "Folliculitis",
    description: "Widespread rashes from infections or medications—may come with fever or itching.",
    treatment: "Applying warm compresses and using over-the-counter cleansers can help manage folliculitis. For more persistent or severe cases, prescription creams or oral medications may be needed. Seeking timely medical care helps prevent the infection from worsening or leaving scars.",
    causes: "Folliculitis is caused by infection or inflammation of hair follicles, usually from the bacteria Staphylococcus aureus. It can also result from friction, shaving, tight clothing, or exposure to contaminated water.",

  },
  "Impetigo": {
    name: "Impetigo",
    description: "Impetigo, a highly contagious bacterial skin infection caused by Staphylococcus aureus or Streptococcus group A, often affects children under five. It develops when bacteria enter through cuts, dry skin, or other skin conditions like eczema and spreads easily through close contact.",
    treatment: "Impetigo is diagnosed through a physical exam, and treatment typically involves topical or oral antibiotics depending on the severity. Completing the full course of medication is essential to ensure full recovery and prevent the infection from returning or becoming resistant.",
    causes: "Impetigo is caused by bacteria, most often Staphylococcus aureus or Streptococcus pyogenes. It spreads through direct contact with infected skin or contaminated items and leads to red sores that rupture and form honey-colored crusts.",

  },
  "Cold Sores": {
    name: "Cold Sores",
    description: "Herpes labialis, or cold sores, is a common viral infection caused by herpes simplex virus type 1 (HSV1) or type 2 (HSV2). HSV1 usually affects the lips and face, while HSV2 mainly causes genital sores, though both can affect either area. After infection, the virus stays dormant in nerve cells and can reactivate during stress, sun exposure, skin injury, or weakened immunity, causing painful blisters.",
    treatment: "There is no cure for HSV1 or HSV2, but mild cases heal on their own within days to weeks. Antiviral medications help control severe or frequent outbreaks. During flares, avoid close contact and sharing items to prevent spread.",
    causes: "Cold sores are highly contagious and usually spread in childhood through close contact like kissing or sharing personal items. The virus stays in the body for life and can reactivate, but treatment helps reduce the severity and frequency of outbreaks.",

  },
  "Molluscum Contagiosum":{
    name: "Molluscum Contagiosum",
    description: "Molluscum contagiosum, also known as molluscum, is a common viral skin infection that causes localized clusters of papules with flat tops and characteristic white cores. Molluscum mostly affects infants and children under the age of 10. People are more likely to get infected with molluscum in warm, overcrowded environments. Molluscum tends to more severely affect children who have atopic dermatitis, or eczema, patients with HIV, and patients with weakened immune systems.",
    treatment: "Most cases clear on their own as the body fights off the virus, but treatment can be used to speed recovery. Options include physical methods like freezing, gentle removal, or laser procedures, as well as topical solutions that help break down the bumps or control infection.",
    causes: "Molluscum contagiosum is caused by a poxvirus that spreads through direct skin contact, shared items, scratching or shaving the bumps, and sexual contact in adults."
  },
  "Ringworm":{
    name: "Ringworm",
    description: "Ringworm is a common name for a superficial fungal infection of the skin. Ringworm appears as a red, ring-shaped, itchy rash on the skin. Fungal infections are caught by direct exposure on the skin from another person or animal with a fungal infection or from a public area where fungus might be residing. Fungal infections on the skin can also spread to other parts of the body so it is important to treat them when you first notice them.",
    treatment: "Treatment typically involves antifungal creams applied to the affected area, and in more stubborn or widespread cases, oral antifungal medication may be recommended to fully clear the infection.",
    causes: "Ringworm is caused by a contagious fungal infection spread through direct contact, shared items, or contaminated surfaces."
  },
  "Vitiligo":{
    name: "Vitiligo",
    description: "A skin condition characterized by the loss of pigment from the skin, often affecting the sun-exposed areas of the body.",
    treatment: "Vitiligo is treated with topical medications, such as topical steroids, topical retinoids, or topical emollients. Treatment may also include laser therapy.",
    causes: "Vitiligo is caused by a genetic mutation that reduces the production of melanin, the pigment responsible for skin color.",

  },
  "Lupus": {
    name: "Lupus",
    description: "A rare autoimmune disease that causes inflammation of the skin, joints, and other connective tissues.",
    treatment: "Lupus is treated with medications, including steroids, immunosuppressants, and biologics.",
    causes: "Lupus is caused by an overactive immune system that speeds up skin cell growth.",

  },
  "Drug Induced Pigmentation": {
    name: "Drug-Induced Pigmentation",
    description: "Drug-induced skin pigmentation accounts for 10–20% of acquired hyperpigmentation. Common causes include NSAIDs, phenytoin, antimalarials, amiodarone, antipsychotics, cytotoxic drugs, tetracyclines, and heavy metals. Some drugs can trigger fixed drug eruptions, leaving localized, gradually fading hyperpigmented patches.",
    treatment: "Treatment for drug-induced pigmentation includes topical retinoids, topical steroids, and laser therapy.",
    causes: "Drug-induced skin pigmentation occurs when certain medications or heavy metals interact with skin pigments or accumulate in the skin, sometimes worsened by sunlight, leading to changes in skin color.",

  },
  "Lichen related diseases": {
    name: "Lichen Related Diseases",
    description: "Lichen is a common skin condition characterized by small, scaly patches of skin.",
    treatment: "Lichen is treated with topical medications, such as topical steroids, topical retinoids, or topical emollients.",
    causes: "Lichen is caused by a genetic mutation that reduces the production of melanin, the pigment responsible for skin color.",

  },
  "Dermatofibroma":{
    name: "Dermatofibroma",
    description: "Dermatofibromas, or benign fibrous histiocytomas, are common firm, hyperpigmented skin bumps, usually under 1 cm, often on the legs but also arms or trunk. They may result from trauma or insect bites causing fibroblast growth. Typically asymptomatic, they can itch or become irritated, and show dimpling when pinched.",
    treatment: "Treatment is usually unnecessary unless the dermatofibroma is symptomatic. Surgical excision is reserved for changing, bleeding, or suspicious lesions. Cosmetic removal is discouraged due to potential scarring, especially on the legs, which are prone to infection. Protruding lesions may also be treated with liquid nitrogen cryotherapy.",
    causes: "Dermatofibromas are small, firm, benign skin bumps, often on the legs, caused by trauma or insect bites. They are usually harmless but can itch or become irritated and show dimpling when pinched.",

  },
  "Digital mucuous cyst": {
    name: "Digital Mucuous Cyst",
    description: "Digital mucous cysts are fluid-filled sacs, a type of ganglion cyst, usually found on finger joints near the fingernail and occasionally on the toes. They move minimally under the skin.",
    treatment: "Digital mucous cysts are persistent skin cysts that often recur and usually require a dermatologist’s treatment for effective management.",
    causes: "Digital mucous cysts are caused by degeneration of connective tissue near finger joints, often associated with osteoarthritis. They can also result from repeated minor trauma to the joint or tendon sheath.",

  },
  "Cysts": {
    name: "Cysts",
    description: "Skin cysts are harmless, flesh-colored bumps usually on the face, neck, or trunk, often called epidermal or epidermoid cysts. They form when the outer skin layer gets trapped under the skin, producing keratin that clogs pores. Cysts can appear as blackheads or drain a thick, foul-smelling substance, and may form after skin or hair follicle injury. Rarely, they occur in large numbers in conditions like Gardner Syndrome.",
    treatment: "Treatment options include surgery in which the entire cyst, including the lining, is surgically removed.",
    causes: "Cysts are caused by blockages of ducts, infections, or abnormal cell growth, leading to fluid or semi-solid material being trapped in a sac. They can also form due to genetic conditions, inflammation, or trauma.",

  },
  "Lipoma": {
    name: "Lipoma",
    description: "Lipomas are harmless, soft, painless fat-filled nodules under the skin, commonly on the trunk, shoulders, and arms, ranging from 1 cm to over 10 cm. They grow slowly and may cause pain if pressing on nerves or blood vessels. Some people have multiple lipomas, sometimes due to a genetic condition called familial multiple lipomatosis.",
    treatment: "Most lipomas do not require treatment because of their subtle and benign nature. If necessary, an ultrasound can be used to help distinguish a lipoma from an epidermoid cyst or a ganglion cyst.",
    causes: "Lipomas are caused by the growth of abnormal fatty tissue under the skin.",

  },
  "Keloids": {
    name: "Keloids",
    description: "A keloid is an abnormal scar that forms at a healed injury site. They can be painful or itchy and often differ in appearance from normal scars. Keloids can be hereditary and commonly develop after cuts, acne, surgery, or piercings, typically on the ears, neck, jaw, chest, shoulders, and upper back.", 
    treatment: "Reduce inflammation, flatten and soften the growth, relieve symptoms, and prevent recurrence through ongoing management.",
    causes: "Keloids are caused by overproduction of collagen during wound healing, leading to raised, thickened scars. They are more likely in people with a genetic predisposition and can form after injuries, surgeries, burns, or even minor skin trauma.",
  },
  "Age Spots": {
    name: "Age Spots",
    description: "Sunspots, or solar lentigines, are common, harmless flat tan or brown spots on sun-exposed skin. They result from UV-induced melanin production and are more frequent in older adults, fair-skinned individuals, sun-exposed people, and those with a genetic predisposition. Rarely, they appear in childhood in certain inherited conditions.",
    treatment: "Treatment involves gradually reducing pigmentation through targeted skin treatments over multiple sessions until the spots fade.",  
    causes: "Keloids are caused by overproduction of collagen during wound healing, leading to raised, thickened scars. They are more likely in people with a genetic predisposition and can form after injuries, surgeries, burns, or even minor skin trauma.",
  },
  "Dyschromia": {
    name: "Dyschromia",
    description: "Dyschromia is a skin condition caused by uneven melanocyte distribution, leading to patches of darker or lighter skin. It includes hyperpigmentation (dark spots) and hypopigmentation (light spots) and can appear as freckles, age spots, melasma, or lentigines.",
    treatment: "Treatment for dyschromia involves using targeted therapies to even out skin tone, gradually reducing the appearance of light or dark patches.",
    causes: "Dyschromia is caused by various factors, including skin cancers, injuries, moles, sunburn, insect bites, medications, vitiligo, radiation, and infections, leading to changes in skin color."
  },
  "Melasma": {
    name: "Melasma",
    description: "Melasma is a pigmentation condition that causes brown patches on the skin, most often on the face. Melasma is common in pregnant females, people with darker skin, and people who live in sunny places, but can affect anyone.",
    treatment: "Treatment for melasma involves using targeted therapies to even out skin tone, gradually reducing the appearance of dark patches.",
    causes: "Melasma is caused by various factors, including sun exposure, sunburn, insect bites, medications, vitiligo, radiation, and infections, leading to changes in skin color.",
  },
  "Hyperpigmentation": {
    name: "Hyperpigmentation",
    description: "Hyperpigmentation is a condition where certain areas of the skin become darker than the surrounding skin due to excess melanin production. It can appear as age spots, melasma, freckles, or other dark patches.",
    treatment: "Treatment for hyperpigmentation involves reducing excess pigmentation through targeted skin therapies, which gradually lighten darkened areas over time.",
    causes: "Hyperpigmentation is caused by excess melanin production in the skin, often triggered by sun exposure, inflammation, acne, hormonal changes, or certain medications, resulting in darker patches or spots.",
  }
}

export { CONDITION_DESCRIPTIONS };