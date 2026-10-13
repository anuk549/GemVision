import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, spacing } from '../theme';
import AppText from './AppText';
import Icon from './Icon';

export default function KeyValue({ items = [], style }) {
  return (
    <View style={[styles.list, style]}>
      {items.map((item, index) => (
        <View
          key={item.label}
          style={[styles.row, index === items.length - 1 && styles.last]}
        >
          <View style={styles.labelWrap}>
            {item.icon ? <Icon name={item.icon} size={16} color={colors.textDim} /> : null}
            <AppText variant="caption" color={colors.textMuted}>
              {item.label}
            </AppText>
          </View>
          <AppText variant="bodyStrong" color={item.color || colors.text}>
            {item.value}
          </AppText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  last: {
    borderBottomWidth: 0,
  },
  labelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
});
