import React, { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { colors, radius, spacing } from '../theme';
import AppText from './AppText';
import Icon from './Icon';
import ErrorMessage from './ErrorMessage';

export default function Input({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  helper,
  leftIcon,
  rightIcon,
  onRightIconPress,
  secureTextEntry = false,
  multiline = false,
  required = false,
  editable = true,
  style,
  inputStyle,
  ...rest
}) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(secureTextEntry);

  const borderColor = error
    ? colors.danger
    : focused
    ? colors.accent
    : colors.inputBorder;

  return (
    <View style={[styles.wrapper, style]}>
      {label ? (
        <AppText variant="label" color={colors.textMuted} style={styles.label}>
          {label}
          {required ? <AppText color={colors.danger}> *</AppText> : null}
        </AppText>
      ) : null}

      <View
        style={[
          styles.field,
          { borderColor },
          multiline && styles.multilineField,
          !editable && styles.disabled,
        ]}
      >
        {leftIcon ? (
          <Icon name={leftIcon} size={18} color={focused ? colors.accent : colors.textDim} />
        ) : null}

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textDim}
          secureTextEntry={hidden}
          multiline={multiline}
          editable={editable}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[styles.input, multiline && styles.multilineInput, inputStyle]}
          {...rest}
        />

        {secureTextEntry ? (
          <Pressable onPress={() => setHidden((prev) => !prev)} hitSlop={8}>
            <Icon
              name={hidden ? 'eye-off-outline' : 'eye-outline'}
              size={18}
              color={colors.textDim}
            />
          </Pressable>
        ) : null}

        {rightIcon ? (
          <Pressable onPress={onRightIconPress} hitSlop={8} disabled={!onRightIconPress}>
            <Icon name={rightIcon} size={18} color={colors.textDim} />
          </Pressable>
        ) : null}
      </View>

      {error ? (
        <ErrorMessage message={error} />
      ) : helper ? (
        <AppText variant="caption" color={colors.textDim} style={styles.helper}>
          {helper}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  label: {
    marginBottom: spacing.xs,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.input,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    minHeight: 46,
  },
  multilineField: {
    minHeight: 96,
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    paddingVertical: spacing.sm,
  },
  multilineInput: {
    textAlignVertical: 'top',
    minHeight: 80,
  },
  helper: {
    marginTop: spacing.xxs,
  },
  disabled: {
    opacity: 0.6,
  },
});
