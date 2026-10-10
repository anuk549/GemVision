import { useEffect, useState } from 'react';
import { Dimensions, PixelRatio, Platform } from 'react-native';

const baseWidth = 375;

export const breakpoints = {
  sm: 375,
  md: 600,
  lg: 900,
  xl: 1200,
};

export const scaleSize = (size) => {
  const { width } = Dimensions.get('window');
  const scale = width / baseWidth;
  return Math.round(PixelRatio.roundToNearestPixel(size * scale));
};

export const wp = (percent) => (Dimensions.get('window').width * percent) / 100;

export const hp = (percent) => (Dimensions.get('window').height * percent) / 100;

export const getBreakpoint = () => {
  const { width } = Dimensions.get('window');
  if (width >= breakpoints.xl) return 'xl';
  if (width >= breakpoints.lg) return 'lg';
  if (width >= breakpoints.md) return 'md';
  return 'sm';
};

export const useResponsive = () => {
  const [layout, setLayout] = useState(() => {
    const { width, height } = Dimensions.get('window');
    return { width, height };
  });

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => {
      setLayout({ width: window.width, height: window.height });
    });
    return () => sub.remove();
  }, []);

  const isTablet = Math.min(layout.width, layout.height) >= 600;

  return {
    width: layout.width,
    height: layout.height,
    isLandscape: layout.width > layout.height,
    isTablet,
    isWeb: Platform.OS === 'web',
    breakpoint: getBreakpoint(),
  };
};
