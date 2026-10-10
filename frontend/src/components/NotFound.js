import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, spacing } from '../theme';
import AppText from './AppText';
import Icon from './Icon';
import Button from './Button';

export default function NotFound({
  code = '404',
  title = 'Page not found',
  message = 'The screen you are looking for does not exist or has been moved.',
  icon = 'planet-outline',
  actionText,
  onAction,
  style,
}) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.badge}>
        <Icon name={icon} size={56} color={colors.accent} />
      </View>
      <AppText variant="h1" color={colors.accent} style={styles.code}>
        {code}
      </AppText>
      <AppText variant="h3" align="center" style={styles.title}>
        {title}
      </AppText>
      <AppText variant="body" color={colors.textMuted} align="center" style={styles.message}>
        {message}
      </AppText>
      {actionText ? (
        <Button
          title={actionText}
          onPress={onAction}
          fullWidth={false}
          icon="arrow-back"
          style={styles.button}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  badge: {
    width: 112,
    height: 112,
    borderRadius: 56,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  code: {
    fontSize: 48,
    lineHeight: 52,
  },
  title: {
    marginTop: spacing.xs,
  },
  message: {
    marginTop: spacing.sm,
    maxWidth: 340,
  },
  button: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
});
