import { colors } from '../theme';

export const DEFECT_GROUPS = {
  EXTERNAL: 'external',
  INTERNAL: 'internal',
};

export const GRADES = ['EC', 'SI', 'MI', 'HI'];

export const GRADE_COLORS = {
  EC: colors.success,
  SI: colors.accent,
  MI: colors.warning,
  HI: colors.danger,
};

export const GRADE_LABELS = {
  EC: 'Eye clean',
  SI: 'Slight inclusion',
  MI: 'Moderate inclusion',
  HI: 'High impact',
};
