export const GEMSTONE_TYPES = [
  { label: 'Blue Sapphire', value: 'Blue Sapphire', icon: 'diamond-outline' },
  { label: 'Yellow Sapphire', value: 'Yellow Sapphire', icon: 'diamond-outline' },
];

export const NON_SAPPHIRE_GEMS = [
  'ruby',
  'rubies',
  'emerald',
  'emeralds',
  'diamond',
  'diamonds',
  'padparadscha',
  'tanzanite',
  'alexandrite',
  'opal',
  'opals',
  'garnet',
  'garnets',
  'amethyst',
  'amethysts',
  'tourmaline',
  'topaz',
  'aquamarine',
  'peridot',
  'spinel',
  'pearl',
  'pearls',
  'zircon',
  'quartz',
  'jade',
  'tsavorite',
  'kunzite',
  'morganite',
  'moissanite',
  'citrine',
  'turquoise',
  'onyx',
  'agate',
  'coral',
];

export const METAL_ALLOYS = [
  { label: '22KT Gold', value: '22KT Gold' },
  { label: '18K Yellow Gold', value: '18K Yellow Gold' },
  { label: '18K White Gold', value: '18K White Gold' },
  { label: '18K Rose Gold', value: '18K Rose Gold' },
  { label: 'Platinum', value: 'Platinum' },
  { label: '925 Sterling Silver', value: '925 Sterling Silver' },
];

export const CARAT_PRESETS = ['1.00', '1.50', '2.00', '2.50', '3.50', '5.00'];
export const METAL_WEIGHT_PRESETS = ['3.0', '4.5', '6.0', '8.5', '12.0'];

export const DESIGN_STYLES = [
  { label: 'Modern', value: 'Modern', icon: 'cube-outline', description: 'Clean geometric lines & architectural contours' },
  { label: 'Vintage', value: 'Vintage', icon: 'flower-outline', description: 'Handcrafted filigree & Victorian milgrain' },
  { label: 'Minimal', value: 'Minimal', icon: 'remove-outline', description: 'Understated elegance & slender delicate band' },
  { label: 'Royal Halo', value: 'Royal Halo', icon: 'sparkles-outline', description: 'Dazzling micro-pavé halo & regal presence' },
];

export const DEFAULT_DESIGN_SPEC = {
  gemstone: 'Blue Sapphire',
  gemstone_weight_ct: '2.50',
  metal: '22KT Gold',
  metal_weight_g: '5.0',
  style: 'Modern',
  prompt: 'An elegant solitaire ring with graceful fluid curves holding the centerpiece gemstone',
};
