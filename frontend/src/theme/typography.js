export const fontSizes = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 26,
  xxxl: 32,
};

export const fontWeights = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
};

export const textVariants = {
  h1: { fontSize: fontSizes.xxxl, fontWeight: fontWeights.bold, lineHeight: 40 },
  h2: { fontSize: fontSizes.xxl, fontWeight: fontWeights.bold, lineHeight: 34 },
  h3: { fontSize: fontSizes.xl, fontWeight: fontWeights.semibold, lineHeight: 28 },
  title: { fontSize: fontSizes.lg, fontWeight: fontWeights.semibold, lineHeight: 24 },
  subtitle: { fontSize: fontSizes.md, fontWeight: fontWeights.medium, lineHeight: 22 },
  body: { fontSize: fontSizes.md, fontWeight: fontWeights.regular, lineHeight: 22 },
  bodyStrong: { fontSize: fontSizes.md, fontWeight: fontWeights.semibold, lineHeight: 22 },
  label: { fontSize: fontSizes.sm, fontWeight: fontWeights.medium, lineHeight: 18 },
  caption: { fontSize: fontSizes.xs, fontWeight: fontWeights.regular, lineHeight: 16 },
  button: { fontSize: fontSizes.md, fontWeight: fontWeights.semibold, lineHeight: 20 },
  link: { fontSize: fontSizes.md, fontWeight: fontWeights.medium, lineHeight: 22 },
};
