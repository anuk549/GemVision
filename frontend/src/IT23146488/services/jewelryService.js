import { API_PREFIX, PREDICT_TIMEOUT_MS } from '../../config/api';
import { apiClient } from '../../services/client';
import { parsePromptSpecifications } from '../utils/promptParser';

/**
 * Dynamically resolves appropriate gemological color grade:
 * 1. Explicit user selection (specs.color_grade)
 * 2. Natural language cues parsed from prompt (e.g. "canary yellow", "royal blue")
 * 3. Selected gemstone species mapping (Yellow Sapphire -> Vivid Yellow, Blue Sapphire -> Royal Blue)
 */
export const resolveColorGrade = (specs = {}) => {
  if (specs.color_grade) return specs.color_grade;
  const fromPrompt = parsePromptSpecifications(specs.prompt || '').colorGrade;
  if (fromPrompt) return fromPrompt;
  const gem = (specs.gemstone || '').toLowerCase();
  if (gem.includes('yellow')) return 'Vivid Yellow';
  if (gem.includes('blue')) return 'Royal Blue';
  return 'Royal Blue';
};

export const calculatePricing = async (specs) => {
  const colorGrade = resolveColorGrade(specs);
  const payload = {
    category: specs.category || 'Ring',
    metal: specs.metal || '22KT Gold',
    metal_weight_g: Number(specs.metal_weight_g || 5.0),
    gemstone: specs.gemstone || 'Blue Sapphire',
    gemstone_weight_ct: Number(specs.gemstone_weight_ct || 2.5),
    setting_type: specs.setting_type || 'Prong',
    color_grade: colorGrade,
    stone_grade: specs.stone_grade || 'AA (Fine Jewelry)',
    treatment: specs.treatment || 'Heated',
    number_of_accent_stones: Number(specs.number_of_accent_stones || 0),
    design_complexity: specs.design_complexity || 'Simple',
  };

  return await apiClient.post(`${API_PREFIX}/jewelry/price-estimate`, payload, {
    timeout: PREDICT_TIMEOUT_MS,
  });
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
  category = 'Ring',
  gemstone = 'Blue Sapphire',
  carats = '2.50',
  metal = '22KT Gold',
  metalWeight = '5.0',
  style = 'Modern',
}) => {
  try {
    const payload = {
      prompt: prompt.trim() || `An exquisite ${style.toLowerCase()} ${category.toLowerCase()} featuring this ${gemstone}`,
      category,
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
  return buildClientEnhancedPrompt({ prompt, category, gemstone, carats, metal, metalWeight, style });
};

export const buildClientEnhancedPrompt = ({
  prompt = '',
  category = 'Ring',
  gemstone = 'Blue Sapphire',
  carats = '2.50',
  metal = '22KT Gold',
  metalWeight = '5.0',
  style = 'Modern',
}) => {
  const c = Number(carats) || 2.5;
  const scale = c >= 3.5 ? 'commanding centerpiece' : c >= 1.8 ? 'prominent centerpiece' : 'delicate centerpiece';
  const cleanInput = (prompt || '').trim() || `A bespoke ${style.toLowerCase()} luxury ${category.toLowerCase()} showcasing a ${scale} ${c.toFixed(2)}ct natural ${gemstone}`;

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

  // Multi-object pair symmetry for earrings
  const isEarring = /earring/i.test(category) || /earring/i.test(coreVision);
  if (isEarring) {
    clauses.push(`a perfectly matching identical pair of earrings, matching bilateral symmetry, uniform identical ${gemstone} gemstones on both earrings, strictly uniform color across both earrings`);
  }

  // Perspective angle directive to prevent flat front-facing stones and show 3D design
  if (/ring/i.test(category)) {
    clauses.push('dynamic three-quarter isometric perspective angle view showcasing elevated crown setting, openwork gallery, and band shank profile');
  } else if (isEarring) {
    clauses.push('angled three-quarter studio perspective showcasing both matching earrings with dimensional depth');
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

  const colorGrade = resolveColorGrade(specs);
  form.append('color_grade', colorGrade);
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

  return await apiClient.post(`${API_PREFIX}/jewelry/generate-design`, form, {
    timeout: PREDICT_TIMEOUT_MS,
  });
};
