import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { colors, radius, spacing } from '../theme';
import AppText from './AppText';
import Icon from './Icon';
import ErrorMessage from './ErrorMessage';

export default function Dropdown({
  label,
  value,
  options = [],
  onChange,
  placeholder = 'Select an option',
  error,
  helper,
  leftIcon,
  required = false,
  disabled = false,
  title,
  style,
}) {
  const [visible, setVisible] = useState(false);
  const [search, setSearch] = useState('');

  const normalizedOptions = options.map((opt) => {
    if (typeof opt === 'string') {
      return { label: opt, value: opt };
    }
    return opt;
  });

  const selectedOption = normalizedOptions.find((opt) => opt.value === value);
  const displayLabel = selectedOption ? selectedOption.label : '';

  const filteredOptions = normalizedOptions.filter((opt) =>
    opt.label.toLowerCase().includes(search.trim().toLowerCase())
  );

  const handleSelect = (val) => {
    onChange?.(val);
    setVisible(false);
    setSearch('');
  };

  const handleClose = () => {
    setVisible(false);
    setSearch('');
  };

  return (
    <View style={[styles.wrapper, style]}>
      {label ? (
        <AppText variant="label" color={colors.textMuted} style={styles.label}>
          {label}
          {required ? <AppText color={colors.danger}> *</AppText> : null}
        </AppText>
      ) : null}

      <Pressable
        onPress={() => !disabled && setVisible(true)}
        disabled={disabled}
        style={({ pressed }) => [
          styles.field,
          error && styles.fieldError,
          disabled && styles.disabled,
          pressed && !disabled && styles.pressed,
        ]}
      >
        {leftIcon ? (
          <Icon name={leftIcon} size={18} color={displayLabel ? colors.accent : colors.textDim} />
        ) : null}

        <AppText
          style={styles.valueText}
          color={displayLabel ? colors.text : colors.textDim}
          numberOfLines={1}
        >
          {displayLabel || placeholder}
        </AppText>

        <Icon name="chevron-down" size={18} color={colors.textDim} />
      </Pressable>

      {error ? (
        <ErrorMessage message={error} />
      ) : helper ? (
        <AppText variant="caption" color={colors.textDim} style={styles.helper}>
          {helper}
        </AppText>
      ) : null}

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={handleClose}
      >
        <Pressable style={styles.backdrop} onPress={handleClose}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Icon name="list-outline" size={18} color={colors.accent} />
                <AppText variant="subtitle" weight="700">
                  {title || label || 'Select Option'}
                </AppText>
              </View>
              <Pressable style={styles.closeBtn} onPress={handleClose} hitSlop={8}>
                <Icon name="close" size={20} color={colors.textDim} />
              </Pressable>
            </View>

            {normalizedOptions.length > 6 ? (
              <View style={styles.searchBox}>
                <Icon name="search-outline" size={16} color={colors.textDim} />
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Filter options…"
                  placeholderTextColor={colors.textDim}
                  style={styles.searchInput}
                  autoCorrect={false}
                />
                {search ? (
                  <Pressable onPress={() => setSearch('')} hitSlop={6}>
                    <Icon name="close-circle" size={16} color={colors.textDim} />
                  </Pressable>
                ) : null}
              </View>
            ) : null}

            <ScrollView style={styles.optionsList} keyboardShouldPersistTaps="handled">
              {filteredOptions.length === 0 ? (
                <View style={styles.emptyWrap}>
                  <AppText variant="caption" color={colors.textDim}>
                    No matching options
                  </AppText>
                </View>
              ) : (
                filteredOptions.map((opt) => {
                  const isSelected = opt.value === value;
                  return (
                    <Pressable
                      key={String(opt.value)}
                      onPress={() => handleSelect(opt.value)}
                      style={({ pressed }) => [
                        styles.optionRow,
                        isSelected && styles.optionSelected,
                        pressed && styles.optionPressed,
                      ]}
                    >
                      {opt.icon ? (
                        <Icon
                          name={opt.icon}
                          size={16}
                          color={isSelected ? colors.accent : colors.textMuted}
                          style={styles.optionIcon}
                        />
                      ) : null}
                      <AppText
                        style={styles.optionLabel}
                        weight={isSelected ? '700' : '400'}
                        color={isSelected ? colors.accent : colors.text}
                      >
                        {opt.label}
                      </AppText>
                      {isSelected ? (
                        <Icon name="checkmark" size={18} color={colors.accent} />
                      ) : null}
                    </Pressable>
                  );
                })
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
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
    borderColor: colors.inputBorder,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    minHeight: 46,
  },
  fieldError: {
    borderColor: colors.danger,
  },
  valueText: {
    flex: 1,
    fontSize: 14,
  },
  helper: {
    marginTop: spacing.xxs,
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.85,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '75%',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    overflow: 'hidden',
    padding: spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  closeBtn: {
    padding: 4,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    marginTop: spacing.sm,
    height: 38,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
    paddingVertical: 0,
  },
  optionsList: {
    marginTop: spacing.sm,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
  },
  optionSelected: {
    backgroundColor: colors.accentSoft,
  },
  optionPressed: {
    backgroundColor: colors.surfaceRaised,
  },
  optionIcon: {
    marginRight: spacing.xs,
  },
  optionLabel: {
    flex: 1,
    fontSize: 14,
  },
  emptyWrap: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
});
