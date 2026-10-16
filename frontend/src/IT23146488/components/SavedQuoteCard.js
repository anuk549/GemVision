import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText, Card, Icon } from '../../components';
import { colors, radius, spacing } from '../../theme';

export default function SavedQuoteCard({ item, onSelect }) {
  if (!item) return null;

  return (
    <Card style={styles.card}>
      {/* Top Header Row with Badges */}
      <View style={styles.topRow}>
        <View style={styles.badgeGroup}>
          {item.gemstone && (
            <View style={styles.gemBadge}>
              <Icon name="diamond-outline" size={12} color={colors.emerald} />
              <AppText variant="caption" weight="700" color={colors.emerald}>
                {item.gemstone}
              </AppText>
            </View>
          )}

          {item.metal && (
            <View style={styles.specBadge}>
              <Icon name="hardware-chip-outline" size={12} color={colors.textMuted} />
              <AppText variant="caption" weight="600" color={colors.textMuted}>
                {item.metal}
              </AppText>
            </View>
          )}

          {item.style && (
            <View style={styles.styleBadge}>
              <Icon name="sparkles-outline" size={11} color={colors.sapphire} />
              <AppText variant="caption" weight="600" color={colors.sapphire}>
                {item.style}
              </AppText>
            </View>
          )}
        </View>

        {item.date && (
          <AppText variant="caption" color={colors.textDim} style={styles.dateText}>
            {item.date}
          </AppText>
        )}
      </View>

      {/* Design Concept Title */}
      <View style={styles.contentSection}>
        <AppText variant="body" weight="700" color={colors.text} numberOfLines={2} style={styles.titleText}>
          {item.title}
        </AppText>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Bottom Valuation & Action */}
      <View style={styles.bottomRow}>
        <View style={styles.priceContainer}>
          <AppText variant="caption" weight="700" color={colors.textDim} style={styles.priceLabel}>
            ESTIMATED RECEIPT TOTAL
          </AppText>
          <AppText variant="subtitle" weight="900" color={colors.emerald} style={styles.priceValue}>
            {item.price}
          </AppText>
        </View>

        {onSelect && (
          <Pressable onPress={() => onSelect(item)} style={styles.viewButton} hitSlop={8}>
            <AppText variant="caption" weight="700" color={colors.emerald}>
              View Receipt
            </AppText>
            <Icon name="chevron-forward" size={14} color={colors.emerald} />
          </Pressable>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  badgeGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  gemBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(37, 192, 138, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(37, 192, 138, 0.35)',
  },
  specBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  styleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(78, 143, 237, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(78, 143, 237, 0.3)',
  },
  dateText: {
    fontSize: 11,
  },
  contentSection: {
    paddingVertical: 2,
  },
  titleText: {
    lineHeight: 20,
    fontSize: 13,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 2,
  },
  priceContainer: {
    gap: 1,
  },
  priceLabel: {
    letterSpacing: 0.8,
    fontSize: 10,
  },
  priceValue: {
    fontSize: 16,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(37, 192, 138, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(37, 192, 138, 0.35)',
  },
});
