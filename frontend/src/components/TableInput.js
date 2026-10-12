import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { colors, radius, spacing } from '../theme';
import AppText from './AppText';
import Icon from './Icon';
import Input from './Input';
import Button from './Button';
import { validateValue } from '../utils/validation';

const DEFAULT_WIDTH = 160;

export default function TableInput({
  columns = [],
  value = [],
  onChange,
  addRowLabel = 'Add row',
  minRows = 0,
  maxRows = 100,
  getDefaultRow,
  showRowNumbers = false,
  removable = true,
  style,
  cellWidth,
}) {
  const [errors, setErrors] = useState({});

  const defaultRow = useMemo(() => {
    if (getDefaultRow) return getDefaultRow();
    return columns.reduce((acc, col) => ({ ...acc, [col.key]: '' }), {});
  }, [columns, getDefaultRow]);

  const emit = (nextRows) => onChange?.(nextRows);

  const setCell = (rowIndex, key, text) => {
    const nextRows = value.map((row, i) => (i === rowIndex ? { ...row, [key]: text } : row));
    emit(nextRows);
    const field = `${rowIndex}.${key}`;
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const validateCell = (rowIndex, col) => {
    const row = value[rowIndex] || {};
    const error = validateValue(row[col.key], col.validate, row);
    setErrors((prev) => ({ ...prev, [`${rowIndex}.${col.key}`]: error }));
    return error;
  };

  const addRow = () => {
    if (value.length >= maxRows) return;
    emit([...value, { ...defaultRow }]);
  };

  const removeRow = (rowIndex) => {
    if (value.length <= minRows) return;
    emit(value.filter((_, i) => i !== rowIndex));
  };

  const width = cellWidth || DEFAULT_WIDTH;
  const actionWidth = removable ? 52 : 0;

  return (
    <View style={[styles.container, style]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          <View style={styles.headerRow}>
            {showRowNumbers ? (
              <View style={[styles.headerCell, { width: 44 }]}>
                <AppText variant="label" color={colors.textMuted}>
                  #
                </AppText>
              </View>
            ) : null}
            {columns.map((col) => (
              <View key={col.key} style={[styles.headerCell, { width: col.width || width }]}>
                <AppText variant="label" color={colors.textMuted} weight="600">
                  {col.title}
                </AppText>
              </View>
            ))}
            {removable ? <View style={{ width: actionWidth }} /> : null}
          </View>

          {value.map((row, rowIndex) => (
            <View key={`row-${rowIndex}`} style={styles.bodyRow}>
              {showRowNumbers ? (
                <View style={[styles.numberCell, { width: 44 }]}>
                  <AppText variant="caption" color={colors.textDim}>
                    {rowIndex + 1}
                  </AppText>
                </View>
              ) : null}

              {columns.map((col) => (
                <View
                  key={col.key}
                  style={{ width: col.width || width, paddingHorizontal: spacing.xs }}
                >
                  <Input
                    value={row?.[col.key] ?? ''}
                    onChangeText={(text) => setCell(rowIndex, col.key, text)}
                    onBlur={() => validateCell(rowIndex, col)}
                    placeholder={col.placeholder || col.title}
                    keyboardType={col.keyboardType}
                    error={errors[`${rowIndex}.${col.key}`]}
                    style={styles.cellInput}
                  />
                </View>
              ))}

              {removable ? (
                <View style={[styles.actionCell, { width: actionWidth }]}>
                  <Pressable
                    onPress={() => removeRow(rowIndex)}
                    disabled={value.length <= minRows}
                    hitSlop={8}
                    style={[styles.remove, value.length <= minRows && styles.disabled]}
                    accessibilityLabel={`Remove row ${rowIndex + 1}`}
                  >
                    <Icon name="trash-outline" size={18} color={colors.danger} />
                  </Pressable>
                </View>
              ) : null}
            </View>
          ))}
        </View>
      </ScrollView>

      {value.length < maxRows ? (
        <Button
          title={addRowLabel}
          variant="ghost"
          size="sm"
          icon="add-circle-outline"
          fullWidth={false}
          onPress={addRow}
          style={styles.addButton}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    overflow: 'hidden',
    paddingBottom: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerCell: {
    paddingHorizontal: spacing.xs,
  },
  bodyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  numberCell: {
    paddingTop: spacing.md,
    alignItems: 'center',
  },
  actionCell: {
    paddingTop: spacing.sm,
    alignItems: 'center',
  },
  remove: {
    padding: spacing.sm,
  },
  disabled: {
    opacity: 0.35,
  },
  addButton: {
    marginTop: spacing.sm,
    marginLeft: spacing.sm,
  },
  cellInput: {
    marginBottom: 0,
  },
});
