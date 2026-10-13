import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, radius, spacing } from '../theme';
import AppText from './AppText';
import Icon from './Icon';

export default function ErrorMessage({ message, visible = true, style }) {
  if (!visible || !message) return null;
  return (
    <View style={[styles.container, style]}>
      <Icon name="alert-circle" size={14} color={colors.danger} />
      <AppText variant="caption" color={colors.danger} style={styles.text}>
        {message}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.dangerSoft,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: radius.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    marginTop: spacing.xs,
  },
  text: {
    flex: 1,
  },
});
