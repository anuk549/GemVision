import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, Card, Icon, KeyValue } from '../../components';
import { colors, radius, spacing } from '../../theme';

export default function ValuationCard({ estimate, specs }) {
  if (!estimate) return null;

  const bom = estimate.bom_breakdown || {};
  const val = estimate.valuation || {};
  const audit = estimate.audited_attributes || {};

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Icon name="diamond-outline" size={20} color={colors.accent} />
        </View>
        <View style={styles.headerText}>
          <AppText variant="title">Valuation Certificate</AppText>
          <AppText variant="caption" color={colors.textMuted}>
            Sri Lankan Gem & Jewelry Market (LKR)
          </AppText>
        </View>
      </View>

      <View style={styles.section}>
        <AppText variant="label" color={colors.accent} style={styles.sectionTitle}>
          Commercial Market Estimates
        </AppText>
        <View style={styles.badgeRow}>
          <View style={[styles.badge, styles.p10Badge]}>
            <AppText variant="caption" color={colors.textMuted}>Wholesale (P10)</AppText>
            <AppText variant="bodyStrong" color={colors.text}>
              {val.p10_wholesale_floor_lkr ? `LKR ${val.p10_wholesale_floor_lkr.toLocaleString()}` : '—'}
            </AppText>
          </View>
          <View style={[styles.badge, styles.p50Badge]}>
            <AppText variant="caption" color={colors.emerald}>Fair Market (P50)</AppText>
            <AppText variant="bodyStrong" color={colors.emerald}>
              {val.p50_fair_market_price_lkr ? `LKR ${val.p50_fair_market_price_lkr.toLocaleString()}` : '—'}
            </AppText>
          </View>
          <View style={[styles.badge, styles.p90Badge]}>
            <AppText variant="caption" color={colors.ruby}>Retail (P90)</AppText>
            <AppText variant="bodyStrong" color={colors.ruby}>
              {val.p90_showroom_ceiling_lkr ? `LKR ${val.p90_showroom_ceiling_lkr.toLocaleString()}` : '—'}
            </AppText>
          </View>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.section}>
        <AppText variant="label" color={colors.textMuted} style={styles.sectionTitle}>
          Itemized Bill of Materials (BOM)
        </AppText>
        <KeyValue
          items={[
            {
              label: `Precious Metal (${specs.metal || 'Alloy'})`,
              value: bom.metal_cost_lkr ? `LKR ${bom.metal_cost_lkr.toLocaleString()}` : '—',
              icon: 'ellipse-outline',
              color: colors.accent,
            },
            {
              label: `Center Gem (${specs.gemstone || 'Sapphire'})`,
              value: bom.gemstone_cost_lkr ? `LKR ${bom.gemstone_cost_lkr.toLocaleString()}` : '—',
              icon: 'diamond-outline',
              color: colors.sapphire,
            },
            {
              label: 'Wadakuliya Artisan Labor',
              value: bom.labor_cost_lkr ? `LKR ${bom.labor_cost_lkr.toLocaleString()}` : '—',
              icon: 'hammer-outline',
            },
            {
              label: 'Stone Setting & Finishing',
              value: bom.setting_cost_lkr ? `LKR ${bom.setting_cost_lkr.toLocaleString()}` : '—',
              icon: 'color-wand-outline',
            },
            {
              label: 'Total Manufacturing Cost',
              value: bom.total_manufacturing_cost_lkr ? `LKR ${bom.total_manufacturing_cost_lkr.toLocaleString()}` : '—',
              icon: 'calculator-outline',
              color: colors.primary,
            },
          ]}
        />
      </View>

      {audit.setting_type && (
        <>
          <View style={styles.divider} />
          <View style={styles.section}>
            <AppText variant="label" color={colors.textMuted} style={styles.sectionTitle}>
              Audited Visual Attributes (Gemini Vision)
            </AppText>
            <View style={styles.attributeRow}>
              <AppText variant="caption" color={colors.textMuted}>
                Setting: <AppText variant="caption" color={colors.text}>{audit.setting_type}</AppText>
              </AppText>
              <AppText variant="caption" color={colors.textMuted}>
                Accents: <AppText variant="caption" color={colors.text}>{audit.number_of_accent_stones || 0} Melee</AppText>
              </AppText>
              <AppText variant="caption" color={colors.textMuted}>
                Tone: <AppText variant="caption" color={colors.text}>{audit.metal_tone || 'Yellow'}</AppText>
              </AppText>
            </View>
          </View>
        </>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  section: {
    marginVertical: spacing.xs,
  },
  sectionTitle: {
    marginBottom: spacing.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  badge: {
    flex: 1,
    padding: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
  },
  p10Badge: {
    borderLeftWidth: 3,
    borderLeftColor: colors.textMuted,
  },
  p50Badge: {
    borderLeftWidth: 3,
    borderLeftColor: colors.emerald,
  },
  p90Badge: {
    borderLeftWidth: 3,
    borderLeftColor: colors.ruby,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  attributeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
});
