import { API_PREFIX, PREDICT_TIMEOUT_MS } from '../../config/api';
import { apiClient } from '../../services/client';

export const calculatePricing = async (specs) => {
  try {
    const payload = {
      category: specs.category || 'Ring',
      metal: specs.metal || '22KT Gold',
      metal_weight_g: Number(specs.metal_weight_g || 5.0),
      gemstone: specs.gemstone || 'Blue Sapphire',
      gemstone_weight_ct: Number(specs.gemstone_weight_ct || 2.5),
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

export const enhancePrompt = async ({
  prompt = '',
  gemstone = 'Blue Sapphire',
  carats = '2.50',
  metal = '22KT Gold',
  metalWeight = '5.0',
  style = 'Modern',
}) => {
  try {
    const payload = {
      prompt: prompt.trim() || `An exquisite ${style.toLowerCase()} ring featuring this ${gemstone}`,
      gemstone,
      gemstone_weight_ct: Number(carats) || 2.5,
      metal,
      metal_weight_g: Number(metalWeight) || 5.0,
      aesthetic_style: style,
    };

    const response = await apiClient.post(`${API_PREFIX}/jewelry/enhance-prompt`, payload, {
      timeout: 25000,
    });

    if (response?.enhanced_prompt) {
      return response.enhanced_prompt;
    }
  } catch (err) {
    console.log('Backend enhance-prompt fallback:', err);
  }

  // Client-side fallback if backend is offline
  return buildClientEnhancedPrompt({ prompt, gemstone, carats, metal, metalWeight, style });
};

export const buildClientEnhancedPrompt = ({
  prompt = '',
  gemstone = 'Blue Sapphire',
  carats = '2.50',
  metal = '22KT Gold',
  metalWeight = '5.0',
  style = 'Modern',
}) => {
  const c = Number(carats) || 2.5;
  const scale = c >= 3.5 ? 'commanding centerpiece' : c >= 1.8 ? 'prominent centerpiece' : 'delicate centerpiece';
  const cleanInput = (prompt || '').trim() || `A bespoke ${style.toLowerCase()} luxury ring showcasing a ${scale} ${c.toFixed(2)}ct natural ${gemstone}`;

  let coreVision = cleanInput;
  if (/multiple lines|lines of|several lines|multi line|multi-line/i.test(coreVision)) {
    coreVision = coreVision.replace(
      /with multiple lines of this gem|with multiple lines|multiple lines of this gem|multiple lines/gi,
      'featuring multiple intertwining fluid bands encrusted with micro-pavé melee lines'
    );
  }

  coreVision = coreVision.charAt(0).toUpperCase() + coreVision.slice(1);
  const hasGem = coreVision.toLowerCase().includes(gemstone.toLowerCase()) || coreVision.toLowerCase().includes('gem');
  const hasMetal = /gold|silver|platinum/i.test(coreVision);

  const clauses = [coreVision];
  if (!hasGem) {
    clauses.push(`featuring a ${scale} ${c.toFixed(2)}ct ${gemstone}`);
  }
  if (!hasMetal) {
    clauses.push(`crafted in lustrous ${metal} (${metalWeight}g)`);
  }

  const styleDirectives = {
    Vintage: 'handcrafted vintage filigree detailing and Victorian milgrain flourishes',
    Minimal: 'understated minimalist silhouette with slender delicate shank and refined low-profile setting',
    Modern: 'contemporary architectural geometry with bold fluid contours',
    'Royal Halo': 'majestic micro-pave diamond halo accentuating center stone brilliance',
  };
  if (styleDirectives[style]) {
    clauses.push(styleDirectives[style]);
  }

  const studioTokens = [
    'master goldsmith micro-prong architecture',
    'openwork pavilion gallery rail',
    'macro studio jewelry product photography',
    'sharp facet reflections',
    'high refractive dispersion',
    'specular caustic highlights',
    'neutral luxury studio lighting',
    '8k resolution fine jewelry render',
  ];
  clauses.push(...studioTokens);
  return clauses.filter(Boolean).join(', ');
};

export const generateDesignAndQuote = async (specs, gemImage = null, sketchImage = null) => {
  const form = new FormData();
  form.append('category', specs.category || 'Ring');
  form.append('metal', specs.metal || '22KT Gold');
  form.append('metal_weight_g', String(specs.metal_weight_g || '5.0'));
  form.append('gemstone', specs.gemstone || 'Blue Sapphire');
  form.append('gemstone_weight_ct', String(specs.gemstone_weight_ct || '2.50'));
  form.append('setting_type', 'Prong');
  form.append('color_grade', 'Royal Blue');
  form.append('stone_grade', 'AA (Fine Jewelry)');
  form.append('treatment', 'Heated');
  form.append('number_of_accent_stones', '0');
  form.append('prompt', specs.prompt || '');
  form.append('aesthetic_style', specs.aesthetic_style || specs.style || 'Modern');

  // If gem image is provided
  if (gemImage) {
    const uri = typeof gemImage === 'string' ? gemImage : gemImage?.uri;
    if (uri) {
      form.append('image', {
        uri,
        name: 'gemstone.jpg',
        type: 'image/jpeg',
      });
      form.append('reference_type', 'gemstone');
    }
  }

  // If sketch image is provided
  if (sketchImage) {
    const sketchUri = typeof sketchImage === 'string' ? sketchImage : sketchImage?.uri;
    if (sketchUri) {
      form.append('sketch', {
        uri: sketchUri,
        name: 'sketch.jpg',
        type: 'image/jpeg',
      });
      if (!gemImage) {
        form.append('image', {
          uri: sketchUri,
          name: 'sketch.jpg',
          type: 'image/jpeg',
        });
        form.append('reference_type', 'sketch');
      }
    }
  }

  try {
    const response = await apiClient.post(`${API_PREFIX}/jewelry/generate-design`, form, {
      timeout: PREDICT_TIMEOUT_MS,
    });
    return response;
  } catch (err) {
    console.warn('generate-design API call failed, falling back:', err);
    return calculateOfflineEstimate(specs);
  }
};

export const calculateOfflineEstimate = (specs) => {
  const metalWeight = Number(specs.metal_weight_g || 5.0);
  const gemWeight = Number(specs.gemstone_weight_ct || 2.5);
  const gemType = specs.gemstone || 'Blue Sapphire';

  // Spot metal rates (LKR/g)
  const metalRates = {
    '24KT Gold': 36500,
    '22KT Gold': 33500,
    '18K Yellow Gold': 27500,
    '18K White Gold': 28200,
    '18K Rose Gold': 28000,
    'Platinum': 19500,
    '925 Sterling Silver': 950,
  };
  const rate = metalRates[specs.metal] || 33500;
  // 8% craft wastage
  const metalCost = metalWeight * rate * 1.08;

  // Gemstone base curves (LKR based on carat power law)
  const gemMultipliers = {
    'Blue Sapphire': 1.0,
    'Yellow Sapphire': 0.78,
    'Padparadscha': 1.55,
    'Ruby': 1.35,
    'Emerald': 1.25,
    'Diamond': 1.85,
    'Other': 0.7,
  };
  const multiplier = gemMultipliers[gemType] || 1.0;
  const baseGem = 385076 * Math.pow(gemWeight, 1.25) * multiplier;

  // Master goldsmith crafting, casting & gemstone setting labor
  const artisanLabor = 18500;
  const settingAndFinishing = 6500;
  const craftingTotal = artisanLabor + settingAndFinishing;

  const subtotal = Math.round(metalCost + baseGem + craftingTotal);
  // Fair market pricing
  const totalMarketPrice = Math.round(subtotal * 1.15);

  return {
    bom_breakdown: {
      gemstone_cost_lkr: Math.round(baseGem),
      metal_cost_lkr: Math.round(metalCost),
      labor_cost_lkr: Math.round(artisanLabor),
      setting_cost_lkr: Math.round(settingAndFinishing),
      total_crafting_cost_lkr: Math.round(craftingTotal),
      subtotal_cost_lkr: subtotal,
      total_manufacturing_cost_lkr: subtotal,
    },
    valuation: {
      p50_fair_market_price_lkr: totalMarketPrice,
    },
    prompt: specs.prompt || 'Custom bespoke jewelry design',
    design_sample: specs.sample_index || 1,
    specs: {
      gemstone: gemType,
      gemstone_weight_ct: String(gemWeight),
      metal: specs.metal || '22KT Gold',
      metal_weight_g: String(metalWeight),
    },
  };
};
