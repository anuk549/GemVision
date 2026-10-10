import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { colors, radius, spacing } from '../theme';
import AppText from './AppText';
import Icon from './Icon';

const VARIANTS = {
  primary: { background: colors.primary, border: colors.primary, text: colors.white },
  secondary: { background: colors.surfaceAlt, border: colors.borderStrong, text: colors.text },
  outline: { background: colors.transparent, border: colors.primary, text: colors.accent },
  ghost: { background: colors.transparent, border: colors.transparent, text: colors.textMuted },
  danger: { background: colors.danger, border: colors.danger, text: colors.white },
  success: { background: colors.success, border: colors.success, text: colors.white },
};

const SIZES = {
  sm: { height: 36, padding: spacing.md, text: 'caption', icon: 14 },
  md: { height: 46, padding: spacing.lg, text: 'button', icon: 18 },
  lg: { height: 54, padding: spacing.xl, text: 'subtitle', icon: 20 },
};

export default function Button({
  title,
  children,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  loading = false,
  disabled = false,
  fullWidth = true,
  style,
  textStyle,
  ...rest
}) {
  const palette = VARIANTS[variant] || VARIANTS.primary;
  const dims = SIZES[size] || SIZES.md;
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={isDisabled ? undefined : onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.base,
        {
          height: dims.height,
          paddingHorizontal: dims.padding,
          backgroundColor: palette.background,
          borderColor: palette.border,
          opacity: isDisabled ? 0.55 : pressed ? 0.85 : 1,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        },
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator size="small" color={palette.text} />
      ) : (
        <View style={styles.content}>
          {icon ? <Icon name={icon} size={dims.icon} color={palette.text} /> : null}
          {title || children ? (
            <AppText variant={dims.text} color={palette.text} style={textStyle}>
              {title || children}
            </AppText>
          ) : null}
          {iconRight ? <Icon name={iconRight} size={dims.icon} color={palette.text} /> : null}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
});
