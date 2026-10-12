import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, radius, spacing } from '../theme';
import AppText from './AppText';
import Icon from './Icon';

export default function Chip({
  label,
  active = false,
  onPress,
  icon,
  color = colors.accent,
  disabled = false,
  style,
}) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.chip,
        active && { backgroundColor: `${color}22`, borderColor: color },
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      {icon ? <Icon name={icon} size={14} color={active ? color : colors.textMuted} /> : null}
      <AppText variant="caption" weight="600" color={active ? color : colors.textMuted}>
        {label}
      </AppText>
    </Pressable>
  );
}

export function ChipGroup({ options = [], value, onChange, color = colors.accent, style }) {
  return (
    <View style={[styles.group, style]}>
      {options.map((option) => {
        const optionValue = option.value ?? option;
        const label = option.label ?? option;
        return (
          <Chip
            key={optionValue}
            label={label}
            icon={option.icon}
            color={color}
            active={value === optionValue}
            onPress={() => onChange?.(optionValue)}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    height: 34,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.input,
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.5,
  },
  group: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
