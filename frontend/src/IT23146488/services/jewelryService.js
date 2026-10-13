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

    if (specs.team_member_gemstone) {
      payload.team_member_gemstone = specs.team_member_gemstone;
    }

    const response = await apiClient.post(`${API_PREFIX}/jewelry/price-estimate`, payload, {
      timeout: PREDICT_TIMEOUT_MS,
    });
    return response;
  } catch {
    // Offline / fallback calculation grounded in empirical BOM formulas
    return calculateOfflineEstimate(specs);
  }
};

export const fetchGemstoneCatalog = async () => {
  try {
    return await apiClient.get(`${API_PREFIX}/gemstones`);
  } catch {
    return [];
  }
};

export const buildClientEnhancedPrompt = ({
  prompt = '',
  category = 'Ring',
  metal = '22KT Gold',
  gemstone = 'Blue Sapphire',
  colorGrade = 'Royal Blue',
  setting = 'Prong',
  aestheticStyle = 'Modern',
  carats = '2.50',
}) => {
  const c = Number(carats) || 2.5;
  const scale = c >= 3.5 ? 'commanding centerpiece' : c >= 1.8 ? 'prominent centerpiece' : 'delicate centerpiece';
  const cleanInput = (prompt || '').trim();

  // If user prompt is empty, generate an evocative bespoke concept
  if (!cleanInput) {
    return `A bespoke luxury ${category.toLowerCase()} featuring a ${scale} ${carats}ct ${colorGrade} Ceylon ${gemstone} held securely in an exquisite ${setting.toLowerCase()} setting crafted in polished ${metal}, ${aestheticStyle.toLowerCase()} architectural contours, macro studio jewelry photography, crisp facet reflections, high refraction dispersion, specular highlights, dark neutral studio backdrop, 8k resolution`;
  }

  // Intelligently transform common natural language phrases
  let coreVision = cleanInput;
  if (/multiple lines|lines of|several lines|multi line|multi-line/i.test(coreVision)) {
    coreVision = coreVision.replace(
      /with multiple lines of this gem|with multiple lines|multiple lines of this gem|multiple lines/gi,
      'featuring multiple intertwining fluid bands encrusted with micro-pavé melee lines'
    );
  } else if (/\bhalo\b/i.test(coreVision) && !/micro-pavé halo/i.test(coreVision)) {
    coreVision = coreVision.replace(/\bhalo\b/gi, 'delicate micro-pavé brilliant-cut diamond halo');
  }

  // Capitalize first letter of core vision
  coreVision = coreVision.charAt(0).toUpperCase() + coreVision.slice(1);

  // Check if core elements are already described by user
  const hasStone = coreVision.toLowerCase().includes('sapphire') || coreVision.toLowerCase().includes('gem');
  const hasMetal = /gold|silver|platinum/i.test(coreVision);
  const hasSetting = /prong|bezel|pave|channel|halo/i.test(coreVision);

  const stoneClause = hasStone
    ? `highlighting the ${scale} ${carats}ct ${colorGrade} Ceylon ${gemstone}`
    : `featuring a ${scale} ${carats}ct ${colorGrade} Ceylon ${gemstone}`;

  const settingClause = hasSetting ? '' : `secured in a refined ${setting.toLowerCase()} mount`;
  const metalClause = hasMetal ? '' : `crafted in lustrous ${metal}`;

  const studioTokens = [
    `${aestheticStyle.toLowerCase()} aesthetic contours`,
    'macro studio jewelry product photography',
    'sharp facet reflections',
    'high refraction dispersion',
    'specular highlights',
    'neutral studio lighting',
    '8k resolution fine jewelry render',
  ];

  const clauses = [coreVision];
  if (!coreVision.toLowerCase().includes(colorGrade.toLowerCase())) {
    clauses.push(stoneClause);
  }
  if (settingClause) clauses.push(settingClause);
  if (metalClause) clauses.push(metalClause);
  clauses.push(...studioTokens);

  return clauses.filter(Boolean).join(', ');
};

export const enhancePrompt = async (promptData) => {
  try {
    const response = await apiClient.post(`${API_PREFIX}/jewelry/enhance-prompt`, promptData);
    if (response?.enhanced_prompt) {
      return response.enhanced_prompt;
    }
    return buildClientEnhancedPrompt(promptData);
  } catch {
    return buildClientEnhancedPrompt(promptData);
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
  form.append('prompt', specs.prompt || '');
  form.append('aesthetic_style', specs.aesthetic_style || 'Modern');

  if (specs.pipeline_option) {
    form.append('pipeline_option', specs.pipeline_option);
  }
  if (specs.gemstone_asset_id) {
    form.append('gemstone_asset_id', specs.gemstone_asset_id);
  }
  if (specs.team_member_gemstone) {
    form.append('team_member_gemstone_json', JSON.stringify(specs.team_member_gemstone));
  }

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
    prompt: specs.prompt || 'A ring with multiple lines of this gem',
    aesthetic_style: specs.aesthetic_style || 'Modern',
    design_sample: specs.sample_index || 1,
    audited_attributes: {
      setting_type: specs.setting_type || 'Prong',
      number_of_accent_stones: accents,
      metal_tone: specs.metal?.includes('White') || specs.metal?.includes('Silver') ? 'White' : 'Yellow',
      design_complexity: accents > 12 ? 'Complex' : 'Simple',
    },
  };
};
