import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, radius, shadow, spacing } from '../theme';

export default function Card({
  children,
  style,
  padded = true,
  elevated = true,
  bordered = true,
  ...rest
}) {
  return (
    <View
      style={[
        styles.card,
        padded && styles.padded,
        elevated && shadow.card,
        bordered && styles.bordered,
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
  },
  padded: {
    padding: spacing.lg,
  },
  bordered: {
    borderWidth: 1,
    borderColor: colors.border,
  },
});
