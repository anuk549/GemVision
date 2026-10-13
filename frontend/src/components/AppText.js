import React from 'react';
import { StyleSheet, Text as RNText } from 'react-native';
import { colors, textVariants } from '../theme';

export default function AppText({
  variant = 'body',
  color = colors.text,
  align,
  weight,
  size,
  style,
  children,
  ...rest
}) {
  return (
    <RNText
      style={[
        styles.base,
        textVariants[variant] || textVariants.body,
        color ? { color } : null,
        align ? { textAlign: align } : null,
        weight ? { fontWeight: weight } : null,
        size ? { fontSize: size } : null,
        style,
      ]}
      {...rest}
    >
      {children}
    </RNText>
  );
}

const styles = StyleSheet.create({
  base: {
    includeFontPadding: false,
  },
});
