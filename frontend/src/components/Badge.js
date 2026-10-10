import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, radius, spacing } from '../theme';
import AppText from './AppText';

export default function Badge({ label, color = colors.primary, style }) {
  if (!label) return null;
  return (
    <View style={[styles.badge, { backgroundColor: `${color}22` }, style]}>
      <AppText variant="caption" weight="700" color={color}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
});
