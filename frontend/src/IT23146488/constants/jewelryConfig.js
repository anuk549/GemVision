export const JEWELRY_TYPES = [
  { label: 'Ring', value: 'Ring', icon: 'ellipse-outline' },
  { label: 'Earring', value: 'Earring', icon: 'flash-outline' },
  { label: 'Necklace', value: 'Necklace', icon: 'link-outline' },
  { label: 'Bracelet', value: 'Bracelet', icon: 'sync-outline' },
];

export const METAL_ALLOYS = [
  { label: '22KT Gold', value: '22KT Gold' },
  { label: '18K Yellow Gold', value: '18K Yellow Gold' },
  { label: '18K White Gold', value: '18K White Gold' },
  { label: '18K Rose Gold', value: '18K Rose Gold' },
  { label: '925 Sterling Silver', value: '925 Sterling Silver' },
  { label: 'Platinum', value: 'Platinum' },
];

export const GEMSTONE_TYPES = [
  { label: 'Blue Sapphire (Ceylon)', value: 'Blue Sapphire' },
  { label: 'Yellow Sapphire (Pushparaga)', value: 'Yellow Sapphire' },
  { label: 'Padparadscha (Sunset)', value: 'Padparadscha' },
  { label: 'Other Gemstone', value: 'Other' },
];

export const SETTING_STYLES = [
  { label: 'Prong Setting', value: 'Prong' },
  { label: 'Bezel Setting', value: 'Bezel' },
  { label: 'Halo Setting', value: 'Halo' },
  { label: 'Pave Setting', value: 'Pave' },
  { label: 'Channel Setting', value: 'Channel' },
];

export const COLOR_GRADES = [
  { label: 'Royal Blue (Top Grade)', value: 'Royal Blue' },
  { label: 'Cornflower Blue', value: 'Cornflower Blue' },
  { label: 'Vivid Canary Yellow', value: 'Vivid Yellow' },
  { label: 'Warm Golden Yellow', value: 'Golden Yellow' },
];

export const STONE_GRADES = [
  { label: 'A (Commercial)', value: 'A (Commercial)' },
  { label: 'AA (Fine Jewelry)', value: 'AA (Fine Jewelry)' },
  { label: 'AAA (Extra Fine)', value: 'AAA (Extra Fine)' },
  { label: 'AAAA (Investment)', value: 'AAAA (Investment)' },
];

export const TREATMENTS = [
  { label: 'Natural Unheated', value: 'Unheated' },
  { label: 'Standard Heated', value: 'Heated' },
];

export const AESTHETIC_STYLES = [
  { label: 'Modern', value: 'Modern' },
  { label: 'Vintage', value: 'Vintage' },
  { label: 'Minimal', value: 'Minimal' },
];

export const DESIGN_STYLE_TAGS = [
  { label: 'Solitaire Micro-Prong', promptAddon: 'four delicate micro-prongs holding the centerpiece cushion gem securely' },
  { label: 'Pavé Diamond Halo', promptAddon: 'surrounded by an exquisite micro-pavé melee diamond halo' },
  { label: 'Art Deco Filigree', promptAddon: 'vintage Art Deco milgrain filigree gallery and engraved shoulders' },
  { label: 'Modern Tension Band', promptAddon: 'sleek architectural tension-style mounting with mirror-polished band' },
  { label: 'Cathedral Arch', promptAddon: 'graceful cathedral arch shanks elevating the gemstone centerpiece' },
];

export const NON_SAPPHIRE_GEMS = [
  'ruby',
  'emerald',
  'diamond',
  'tanzanite',
  'alexandrite',
  'opal',
  'garnet',
  'amethyst',
  'tourmaline',
  'topaz',
  'aquamarine',
  'peridot',
  'spinel',
  'pearl',
  'zircon',
  'quartz',
  'jade',
  'tsavorite',
  'kunzite',
  'morganite',
];

export const DEFAULT_DESIGN_SPEC = {
  category: 'Ring',
  metal: '22KT Gold',
  gemstone: 'Blue Sapphire',
  gemstone_weight_ct: '2.50',
  metal_weight_g: '5.0',
  setting_type: 'Prong',
  color_grade: 'Royal Blue',
  stone_grade: 'AA (Fine Jewelry)',
  treatment: 'Heated',
  number_of_accent_stones: '0',
  aesthetic_style: 'Modern',
  prompt: 'A ring with multiple lines of this gem',
};
