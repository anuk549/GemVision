import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, radius, spacing } from '../theme';
import AppText from './AppText';
import Icon from './Icon';

const range = (start, end) => {
  const out = [];
  for (let i = start; i <= end; i += 1) out.push(i);
  return out;
};

export default function Pagination({
  page = 1,
  totalPages = 1,
  onPageChange,
  maxButtons = 5,
  style,
}) {
  const pages = useMemo(() => {
    if (totalPages <= maxButtons) return range(1, totalPages);
    const half = Math.floor(maxButtons / 2);
    let start = Math.max(1, page - half);
    let end = start + maxButtons - 1;
    if (end > totalPages) {
      end = totalPages;
      start = end - maxButtons + 1;
    }
    return range(start, end);
  }, [page, totalPages, maxButtons]);

  if (totalPages <= 1) return null;

  const go = (next) => {
    if (next < 1 || next > totalPages || next === page) return;
    onPageChange?.(next);
  };

  return (
    <View style={[styles.container, style]}>
      <Pressable
        onPress={() => go(page - 1)}
        disabled={page <= 1}
        style={[styles.arrow, page <= 1 && styles.disabled]}
        accessibilityLabel="Previous page"
      >
        <Icon name="chevron-back" size={18} color={colors.textMuted} />
      </Pressable>

      {pages[0] > 1 ? (
        <>
          <PageButton value={1} active={page === 1} onPress={() => go(1)} />
          {pages[0] > 2 ? (
            <AppText color={colors.textDim} style={styles.ellipsis}>
              …
            </AppText>
          ) : null}
        </>
      ) : null}

      {pages.map((p) => (
        <PageButton key={p} value={p} active={p === page} onPress={() => go(p)} />
      ))}

      {pages[pages.length - 1] < totalPages ? (
        <>
          {pages[pages.length - 1] < totalPages - 1 ? (
            <AppText color={colors.textDim} style={styles.ellipsis}>
              …
            </AppText>
          ) : null}
          <PageButton
            value={totalPages}
            active={page === totalPages}
            onPress={() => go(totalPages)}
          />
        </>
      ) : null}

      <Pressable
        onPress={() => go(page + 1)}
        disabled={page >= totalPages}
        style={[styles.arrow, page >= totalPages && styles.disabled]}
        accessibilityLabel="Next page"
      >
        <Icon name="chevron-forward" size={18} color={colors.textMuted} />
      </Pressable>
    </View>
  );
}

function PageButton({ value, active, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.page, active && styles.pageActive]}
      accessibilityLabel={`Page ${value}`}
    >
      <AppText
        variant="label"
        color={active ? colors.white : colors.textMuted}
        weight={active ? '700' : '500'}
      >
        {value}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  arrow: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  page: {
    minWidth: 36,
    height: 36,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  pageActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  disabled: {
    opacity: 0.4,
  },
  ellipsis: {
    paddingHorizontal: spacing.xs,
  },
});
