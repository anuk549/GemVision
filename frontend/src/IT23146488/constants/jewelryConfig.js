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
  { label: 'Blue Sapphire', value: 'Blue Sapphire' },
  { label: 'Yellow Sapphire', value: 'Yellow Sapphire' },
  { label: 'Padparadscha', value: 'Padparadscha' },
  { label: 'Ruby', value: 'Ruby' },
  { label: 'Diamond', value: 'Diamond' },
];

export const SETTING_STYLES = [
  { label: 'Prong Setting', value: 'Prong' },
  { label: 'Bezel Setting', value: 'Bezel' },
  { label: 'Halo Setting', value: 'Halo' },
  { label: 'Pave Setting', value: 'Pave' },
  { label: 'Channel Setting', value: 'Channel' },
];

export const COLOR_GRADES = [
  { label: 'Royal Blue', value: 'Royal Blue' },
  { label: 'Cornflower Blue', value: 'Cornflower Blue' },
  { label: 'Vivid Yellow', value: 'Vivid Yellow' },
  { label: 'Warm Yellow', value: 'Yellow' },
  { label: 'Pigeon Blood Red', value: 'Pigeon Blood' },
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
};
