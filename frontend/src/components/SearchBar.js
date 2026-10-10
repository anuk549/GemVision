import React from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { colors, radius, spacing } from '../theme';
import Icon from './Icon';

export default function SearchBar({
  value,
  onChangeText,
  placeholder = 'Search...',
  onClear,
  onSubmit,
  style,
  autoFocus = false,
}) {
  const clear = () => {
    onChangeText?.('');
    onClear?.();
  };

  return (
    <View style={[styles.container, style]}>
      <Icon name="search" size={18} color={colors.textDim} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textDim}
        style={styles.input}
        autoFocus={autoFocus}
        returnKeyType="search"
        onSubmitEditing={onSubmit}
        clearButtonMode="never"
      />
      {value ? (
        <Pressable onPress={clear} hitSlop={8} accessibilityLabel="Clear search">
          <Icon name="close-circle" size={18} color={colors.textDim} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.input,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    minHeight: 46,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    paddingVertical: spacing.sm,
  },
});
