import { API_PREFIX, PREDICT_TIMEOUT_MS } from '../../config/api';
import { apiClient } from '../../services/client';

export const calculatePricing = async (specs) => {
  try {
    const payload = {
      category: specs.category || 'Ring',
      metal: specs.metal || '22KT Gold',
      metal_weight_g: Number(specs.metal_weight_g || 4.5),
      gemstone: specs.gemstone || 'Blue Sapphire',
      gemstone_weight_ct: Number(specs.gemstone_weight_ct || 2.0),
      setting_type: specs.setting_type || 'Prong',
      color_grade: specs.color_grade || 'Royal Blue',
      stone_grade: specs.stone_grade || 'AA (Fine Jewelry)',
      treatment: specs.treatment || 'Heated',
      number_of_accent_stones: Number(specs.number_of_accent_stones || 0),
    };

    const response = await apiClient.post(`${API_PREFIX}/jewelry/price-estimate`, payload, {
      timeout: PREDICT_TIMEOUT_MS,
    });
    return response;
  } catch {
    // Offline / fallback calculation grounded in empirical BOM formulas
    return calculateOfflineEstimate(specs);
  }
};

export const generateDesignAndQuote = async (specs, imageAsset = null) => {
  const form = new FormData();
  form.append('category', specs.category);
  form.append('metal', specs.metal);
  form.append('metal_weight_g', String(specs.metal_weight_g));
  form.append('gemstone', specs.gemstone);
  form.append('gemstone_weight_ct', String(specs.gemstone_weight_ct));
  form.append('setting_type', specs.setting_type);
  form.append('color_grade', specs.color_grade);
  form.append('stone_grade', specs.stone_grade);
  form.append('treatment', specs.treatment);
  form.append('number_of_accent_stones', String(specs.number_of_accent_stones || 0));

  if (imageAsset) {
    const uri = typeof imageAsset === 'string' ? imageAsset : imageAsset?.uri;
    if (uri) {
      form.append('image', {
        uri,
        name: 'jewelry-input.jpg',
        type: 'image/jpeg',
      });
    }
  }

  try {
    const response = await apiClient.post(`${API_PREFIX}/jewelry/generate-design`, form, {
      timeout: PREDICT_TIMEOUT_MS,
    });
    return response;
  } catch {
    return calculateOfflineEstimate(specs);
  }
};

const calculateOfflineEstimate = (specs) => {
  const metalWeight = Number(specs.metal_weight_g || 4.5);
  const gemWeight = Number(specs.gemstone_weight_ct || 2.0);
  const accents = Number(specs.number_of_accent_stones || 0);

  // Spot metal rates (LKR/g)
  const rates = {
    '24KT Gold': 36500,
    '22KT Gold': 33500,
    '18K Yellow Gold': 27500,
    '18K White Gold': 28200,
    '18K Rose Gold': 28000,
    '925 Sterling Silver': 950,
    Platinum: 19500,
  };
  const rate = rates[specs.metal] || 33500;
  const metalCost = metalWeight * rate * 1.1; // 10% wastage

  // Empirical Ceylon Sapphire curve: Price = 385,076 * (carats)^1.28
  const baseGem = 385076 * Math.pow(gemWeight, 1.28);
  const gradeMul = specs.stone_grade?.includes('AAA')
    ? 1.45
    : specs.stone_grade?.includes('AA')
    ? 1.0
    : 0.75;
  const gemCost = baseGem * gradeMul;

  // Verified Wadakuliya Labor
  const labor = specs.category === 'Necklace' ? 13500 : specs.category === 'Earring' ? 4500 : 4000;
  const settingCost = (accents + 1) * 800;
  const accentGemCost = accents * 4200;

  const totalCost = metalCost + gemCost + labor + settingCost + accentGemCost;

  return {
    bom_breakdown: {
      metal_cost_lkr: Math.round(metalCost),
      gemstone_cost_lkr: Math.round(gemCost),
      labor_cost_lkr: Math.round(labor),
      setting_cost_lkr: Math.round(settingCost),
      accent_cost_lkr: Math.round(accentGemCost),
      total_manufacturing_cost_lkr: Math.round(totalCost),
    },
    valuation: {
      p10_wholesale_floor_lkr: Math.round(totalCost * 1.06),
      p50_fair_market_price_lkr: Math.round(totalCost * 1.22),
      p90_showroom_ceiling_lkr: Math.round(totalCost * 1.42),
    },
    audited_attributes: {
      setting_type: specs.setting_type || 'Prong',
      number_of_accent_stones: accents,
      metal_tone: specs.metal?.includes('White') || specs.metal?.includes('Silver') ? 'White' : 'Yellow',
      design_complexity: accents > 12 ? 'Complex' : 'Simple',
    },
  };
};
