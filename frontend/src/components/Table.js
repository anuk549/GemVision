import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { colors, radius, spacing } from '../theme';
import AppText from './AppText';
import Icon from './Icon';

const DEFAULT_WIDTH = 140;

export default function Table({
  columns = [],
  data = [],
  keyExtractor,
  onRowPress,
  loading = false,
  horizontal = false,
  emptyIcon = 'file-tray-outline',
  emptyTitle = 'No data',
  emptyMessage = 'There is nothing to display yet.',
  emptyComponent,
  footer,
  style,
  headerStyle,
  rowStyle,
}) {
  const getKey = (row, index) =>
    keyExtractor ? keyExtractor(row, index) : String(row?.id ?? index);

  const gridWidth = columns.reduce(
    (sum, col) => sum + (col.width || (col.flex ? 0 : DEFAULT_WIDTH)),
    0
  );

  const renderCell = (col, row, rowIndex) => {
    const content = col.render ? col.render(row, rowIndex) : row?.[col.key];
    return (
      <View
        key={col.key}
        style={[
          styles.cell,
          { width: col.width || (horizontal ? DEFAULT_WIDTH : undefined) },
          col.flex && !horizontal && { flex: col.flex },
          col.align && { alignItems: `flex-${col.align}` },
        ]}
      >
        {typeof content === 'string' || typeof content === 'number' ? (
          <AppText variant="body" numberOfLines={1}>
            {String(content)}
          </AppText>
        ) : (
          content
        )}
      </View>
    );
  };

  const content = (
    <View style={styles.table}>
      <View style={[styles.headerRow, headerStyle]}>
        {columns.map((col) => (
          <View
            key={col.key}
            style={[
              styles.cell,
              { width: col.width || (horizontal ? DEFAULT_WIDTH : undefined) },
              col.flex && !horizontal && { flex: col.flex },
              col.align && { alignItems: `flex-${col.align}` },
            ]}
          >
            <AppText variant="label" color={colors.textMuted} weight="600" numberOfLines={1}>
              {col.title}
            </AppText>
          </View>
        ))}
      </View>

      {loading ? (
        <View style={styles.state}>
          <ActivityIndicator color={colors.accent} />
          <AppText variant="caption" color={colors.textMuted}>
            Loading…
          </AppText>
        </View>
      ) : data.length === 0 ? (
        <View style={styles.state}>
          {emptyComponent || (
            <>
              <Icon name={emptyIcon} size={32} color={colors.textDim} />
              <AppText variant="subtitle" color={colors.textMuted}>
                {emptyTitle}
              </AppText>
              <AppText variant="caption" color={colors.textDim} align="center">
                {emptyMessage}
              </AppText>
            </>
          )}
        </View>
      ) : (
        data.map((row, index) => {
          const RowWrapper = onRowPress ? Pressable : View;
          return (
            <RowWrapper
              key={getKey(row, index)}
              onPress={onRowPress ? () => onRowPress(row, index) : undefined}
              style={({ pressed } = {}) => [
                styles.row,
                index === data.length - 1 && styles.rowLast,
                rowStyle,
                onRowPress && pressed && styles.rowPressed,
              ]}
            >
              {columns.map((col) => renderCell(col, row, index))}
            </RowWrapper>
          );
        })
      )}
    </View>
  );

  return (
    <View style={[styles.container, style]}>
      {horizontal ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ width: Math.max(gridWidth, 320) }}>
          {content}
        </ScrollView>
      ) : (
        content
      )}
      {footer ? <View style={styles.footer}>{footer}</View> : null}
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
  },
  table: {
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundAlt,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowPressed: {
    backgroundColor: colors.surfaceAlt,
  },
  cell: {
    paddingHorizontal: spacing.sm,
    justifyContent: 'center',
  },
  state: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: spacing.md,
  },
});
