/**
 * Prompt Specification Parser & Mismatch Detector
 * Extracts fine jewelry attributes (Metal, Category, Gemstone, Style, Weight)
 * from natural language prompts to auto-synchronize UI options and prevent mismatches.
 */

export function parsePromptSpecifications(text = '') {
  if (!text || typeof text !== 'string') return {};
  const lower = text.toLowerCase();
  const detected = {};

  // 1. Metal Alloy Detection (Specific alloys first, then generic)
  if (/\b(22\s*k(t|arat)?|22ct)\b/i.test(lower)) {
    detected.metal = '22KT Gold';
  } else if (/\b(rose\s*gold|pink\s*gold)\b/i.test(lower)) {
    detected.metal = '18K Rose Gold';
  } else if (/\b(white\s*gold)\b/i.test(lower)) {
    detected.metal = '18K White Gold';
  } else if (/\b(18\s*k(t|arat)?(\s*yellow)?(\s*gold)?|yellow\s*gold)\b/i.test(lower)) {
    detected.metal = '18K Yellow Gold';
  } else if (/\b(platinum|plat)\b/i.test(lower)) {
    detected.metal = 'Platinum';
  } else if (/\b(silver|sterling(\s*silver)?|925(\s*silver)?)\b/i.test(lower)) {
    detected.metal = '925 Sterling Silver';
  } else if (/\bgold\b/i.test(lower)) {
    detected.metal = '22KT Gold'; // Default Sri Lankan benchmark gold
  }

  // 2. Jewelry Category Detection (handles common typos like 'earings')
  if (/\b(ea[r]+ings?|studs?|drop\s*ea[r]+ings?|dangles?|hoops?)\b/i.test(lower)) {
    detected.category = 'Earrings';
  } else if (/\b(necklaces?|pendants?|choker|chain)\b/i.test(lower)) {
    detected.category = 'Necklace';
  } else if (/\b(bracelets?|bangles?|cuff)\b/i.test(lower)) {
    detected.category = 'Bracelet';
  } else if (/\b(rings?|band|solitaire|engagement\s*ring|wedding\s*band)\b/i.test(lower)) {
    detected.category = 'Ring';
  }

  // 3. Gemstone Species & Color Grade Detection (handles 'yellow saphire', plural 'sapphires', etc.)
  if (/\b(yellow\s*sap*h?ire?s?|canary\s*sap*h?ire?s?|yellow\s*gems?|yellow\s*stones?)\b/i.test(lower)) {
    detected.gemstone = 'Yellow Sapphire';
    detected.colorGrade = 'Vivid Yellow';
  } else if (/\b(blue\s*sap*h?ire?s?|royal\s*blue|cornflower|sap*h?ire?s?)\b/i.test(lower)) {
    detected.gemstone = 'Blue Sapphire';
    detected.colorGrade = 'Royal Blue';
  }

  // 4. Aesthetic Style Detection
  if (/\b(vintage|victorian|antique|filigree|milgrain|art\s*deco)\b/i.test(lower)) {
    detected.style = 'Vintage';
  } else if (/\b(minimal|minimalist|sleek|understated|delicate\s*band)\b/i.test(lower)) {
    detected.style = 'Minimal';
  } else if (/\b(royal\s*halo|halo|pave\s*halo)\b/i.test(lower)) {
    detected.style = 'Royal Halo';
  } else if (/\b(modern|contemporary|geometric|architectural)\b/i.test(lower)) {
    detected.style = 'Modern';
  }

  // 5. Carats Weight Detection (e.g., "2.5ct", "3 carats", "1.5 carat")
  const caratMatch = lower.match(/\b(\d+(\.\d+)?)\s*(ct|carats?|carat)\b/i);
  if (caratMatch) {
    const val = parseFloat(caratMatch[1]);
    if (!isNaN(val) && val >= 0.1 && val <= 30.0) {
      detected.carats = val.toFixed(2);
    }
  }

  // 6. Metal Weight Detection (e.g., "5g", "6.5 grams")
  const metalMatch = lower.match(/\b(\d+(\.\d+)?)\s*(g|grams?|gram)\b/i);
  if (metalMatch) {
    const val = parseFloat(metalMatch[1]);
    if (!isNaN(val) && val >= 0.5 && val <= 60.0) {
      detected.metalWeight = val.toFixed(1);
    }
  }

  return detected;
}

export function detectSpecificationMismatches(text = '', currentSpecs = {}) {
  const detected = parsePromptSpecifications(text);
  const mismatches = [];

  if (detected.metal && currentSpecs.metal && detected.metal !== currentSpecs.metal) {
    mismatches.push({
      field: 'metal',
      label: 'Metal Alloy',
      promptValue: detected.metal,
      selectedValue: currentSpecs.metal,
    });
  }

  if (detected.category && currentSpecs.category && detected.category !== currentSpecs.category) {
    mismatches.push({
      field: 'category',
      label: 'Jewelry Category',
      promptValue: detected.category,
      selectedValue: currentSpecs.category,
    });
  }

  if (detected.gemstone && currentSpecs.gemstone && detected.gemstone !== currentSpecs.gemstone) {
    mismatches.push({
      field: 'gemstone',
      label: 'Gemstone',
      promptValue: detected.gemstone,
      selectedValue: currentSpecs.gemstone,
    });
  }

  if (detected.style && currentSpecs.style && detected.style !== currentSpecs.style) {
    mismatches.push({
      field: 'style',
      label: 'Design Style',
      promptValue: detected.style,
      selectedValue: currentSpecs.style,
    });
  }

  return { detected, mismatches };
}
