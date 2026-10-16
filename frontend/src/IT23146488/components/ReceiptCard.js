import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, Card, Icon } from '../../components';
import { colors, radius, spacing } from '../../theme';

export default function ReceiptCard({ estimate, specs, warningGem }) {
  const bom = estimate?.bom_breakdown || {};
  const val = estimate?.valuation || {};

  // Deterministic receipt ID based on design sample and BOM values
  const receiptId = React.useMemo(() => {
    const seed =
      ((estimate?.design_sample || 1) * 7919) ^
      ((bom?.gemstone_cost_lkr || 12345) % 100000);
    return `GV-${String(Math.abs(seed)).padStart(6, '8').slice(-6)}`;
  }, [estimate?.design_sample, bom?.gemstone_cost_lkr]);

  if (!estimate) return null;

  const categoryName = specs?.category || estimate.specs?.category || 'Ring';
  const gemName = specs?.gemstone || estimate.specs?.gemstone || 'Center Gemstone';
  const gemCarats = specs?.gemstone_weight_ct || estimate.specs?.gemstone_weight_ct || '2.50';
  const metalName = specs?.metal || estimate.specs?.metal || '22KT Gold';
  const metalGrams = specs?.metal_weight_g || estimate.specs?.metal_weight_g || '5.0';

  const gemCost = bom.gemstone_cost_lkr || 0;
  const metalCost = bom.metal_cost_lkr || 0;
  const laborCost = (bom.labor_cost_lkr || 0) + (bom.setting_cost_lkr || 0) + (bom.accent_cost_lkr || 0);
  const subtotal = bom.total_manufacturing_cost_lkr || (gemCost + metalCost + laborCost);
  const totalPrice = val.p50_fair_market_price_lkr || subtotal;

  const receiptDate = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const receiptTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <Card style={styles.card}>
      {/* Top receipt notch cutouts simulation */}
      <View style={styles.receiptTopEdge}>
        <View style={styles.zigzagRow}>
          {[...Array(16)].map((_, i) => (
            <View key={i} style={styles.sawtoothDot} />
          ))}
        </View>
      </View>

      <View style={styles.receiptBody}>
        {/* Receipt Header */}
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Icon name="diamond" size={20} color={colors.emerald} />
          </View>
          <AppText variant="h3" weight="800" align="center" style={styles.brandTitle}>
            GEMVISION STUDIO
          </AppText>
          <AppText variant="caption" weight="600" color={colors.emerald} align="center" style={styles.receiptSubtitle}>
            OFFICIAL VALUATION & PRICE ESTIMATE
          </AppText>

          <View style={styles.metaRow}>
            <AppText variant="caption" color={colors.emerald} weight="700" style={styles.monoText}>
              {categoryName.toUpperCase()}
            </AppText>
            <AppText variant="caption" color={colors.textMuted} style={styles.monoText}>
              Receipt: {receiptId}
            </AppText>
            <AppText variant="caption" color={colors.textMuted} style={styles.monoText}>
              {receiptDate} · {receiptTime}
            </AppText>
          </View>
        </View>

        {/* Dashed Perforation Line */}
        <View style={styles.dashedLine} />

        {/* Non-Sapphire Warning Banner if applicable */}
        {warningGem && (
          <View style={styles.warningBox}>
            <Icon name="alert-circle" size={16} color="#F59E0B" />
            <View style={styles.warningContent}>
              <AppText variant="caption" weight="800" color="#F59E0B">
                PRICE PREDICTION NOTICE
              </AppText>
              <AppText variant="caption" color={colors.textMuted} style={styles.warningText}>
                Because you specified &quot;{warningGem}&quot;, the predicted price will mismatch actual market value.
              </AppText>
            </View>
          </View>
        )}

        {/* Column Headers */}
        <View style={styles.tableHeaderRow}>
          <AppText variant="caption" weight="700" color={colors.textDim} style={styles.colDesc}>
            ITEM & DESCRIPTION
          </AppText>
          <AppText variant="caption" weight="700" color={colors.textDim} align="right" style={styles.colAmount}>
            AMOUNT (LKR)
          </AppText>
        </View>

        {/* Item 1: Gemstone */}
        <View style={styles.lineItem}>
          <View style={styles.lineDescCol}>
            <AppText variant="body" weight="700" color={colors.text}>
              {gemName}
            </AppText>
            <AppText variant="caption" color={colors.textMuted}>
              {gemCarats} ct Natural Gemstone
            </AppText>
          </View>
          <AppText variant="body" weight="700" color={colors.text} align="right">
            {gemCost ? `LKR ${gemCost.toLocaleString()}` : '—'}
          </AppText>
        </View>

        {/* Item 2: Precious Metal */}
        <View style={styles.lineItem}>
          <View style={styles.lineDescCol}>
            <AppText variant="body" weight="700" color={colors.text}>
              {metalName}
            </AppText>
            <AppText variant="caption" color={colors.textMuted}>
              {metalGrams} g Certified Precious Alloy
            </AppText>
          </View>
          <AppText variant="body" weight="700" color={colors.text} align="right">
            {metalCost ? `LKR ${metalCost.toLocaleString()}` : '—'}
          </AppText>
        </View>

        {/* Item 3: Craftsmanship & Setting */}
        <View style={styles.lineItem}>
          <View style={styles.lineDescCol}>
            <AppText variant="body" weight="700" color={colors.text}>
              Artisan Crafting & Setting
            </AppText>
            <AppText variant="caption" color={colors.textMuted}>
              Goldsmith Labor & Mounting
            </AppText>
          </View>
          <AppText variant="body" weight="700" color={colors.text} align="right">
            {laborCost ? `LKR ${laborCost.toLocaleString()}` : '—'}
          </AppText>
        </View>

        {/* Dashed Line */}
        <View style={styles.dashedLine} />

        {/* Subtotal */}
        <View style={styles.summaryRow}>
          <AppText variant="body" color={colors.textMuted}>
            Manufacturing Subtotal:
          </AppText>
          <AppText variant="body" weight="600" color={colors.text}>
            LKR {subtotal.toLocaleString()}
          </AppText>
        </View>

        {/* Final Price Highlight */}
        <View style={styles.totalPriceContainer}>
          <View>
            <AppText variant="caption" weight="800" color={colors.emerald} style={styles.totalLabel}>
              ESTIMATED TOTAL PRICE
            </AppText>
            <AppText variant="caption" color={colors.textMuted}>
              Net Estimated Fair Value
            </AppText>
          </View>
          <AppText variant="h2" weight="900" color={colors.emerald} style={styles.totalPriceText}>
            LKR {totalPrice.toLocaleString()}
          </AppText>
        </View>

        {/* Dashed Line */}
        <View style={styles.dashedLine} />

        {/* Barcode Graphic Simulation */}
        <View style={styles.barcodeSection}>
          <View style={styles.barcodeRow}>
            {[2, 1, 3, 1, 4, 1, 2, 3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 1, 2, 4, 1, 3, 2, 4, 1, 2, 3, 1].map(
              (w, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.barcodeBar,
                    {
                      width: w * 2,
                      marginHorizontal: 1.5,
                      backgroundColor: idx % 2 === 0 ? colors.textMuted : colors.textDim,
                    },
                  ]}
                />
              )
            )}
          </View>
          <AppText variant="caption" color={colors.textMuted} align="center" style={styles.barcodeNumbers}>
            * {receiptId} *
          </AppText>
          <AppText variant="caption" weight="600" color={colors.text} align="center" style={styles.thankYouText}>
            THANK YOU FOR DESIGNING WITH GEMVISION
          </AppText>
          <AppText variant="caption" color={colors.textDim} align="center">
            Estimate calibrated using current Ceylon bullion & gemstone spot rates
          </AppText>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 0,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: 'rgba(37, 192, 138, 0.35)',
    overflow: 'hidden',
    marginTop: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  receiptTopEdge: {
    backgroundColor: colors.surfaceAlt,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  zigzagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
  },
  sawtoothDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.borderStrong,
  },
  receiptBody: {
    padding: spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  logoBadge: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(37, 192, 138, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(37, 192, 138, 0.4)',
  },
  brandTitle: {
    letterSpacing: 2.5,
    marginTop: spacing.xxs,
  },
  receiptSubtitle: {
    letterSpacing: 1.5,
    marginTop: 2,
    fontSize: 11,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: spacing.md,
    paddingTop: spacing.xs,
  },
  monoText: {
    fontSize: 12,
  },
  dashedLine: {
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: colors.borderStrong,
    marginVertical: spacing.md,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: spacing.xs,
    marginBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  colDesc: {
    fontSize: 11,
    letterSpacing: 0.8,
  },
  colAmount: {
    fontSize: 11,
    letterSpacing: 0.8,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    borderRadius: radius.md,
    padding: spacing.sm,
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  warningContent: {
    flex: 1,
    gap: 2,
  },
  warningText: {
    fontSize: 11,
    lineHeight: 16,
  },
  lineItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  lineDescCol: {
    flex: 1,
    paddingRight: spacing.md,
    gap: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  totalPriceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(37, 192, 138, 0.08)',
    padding: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(37, 192, 138, 0.3)',
  },
  totalLabel: {
    letterSpacing: 1,
    fontSize: 12,
    marginBottom: 2,
  },
  totalPriceText: {
    fontSize: 22,
  },
  barcodeSection: {
    alignItems: 'center',
    paddingTop: spacing.xs,
    gap: 6,
  },
  barcodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 38,
    marginVertical: 4,
  },
  barcodeBar: {
    height: '100%',
    borderRadius: 1,
  },
  barcodeNumbers: {
    letterSpacing: 3,
    fontSize: 11,
  },
  thankYouText: {
    letterSpacing: 1.2,
    fontSize: 12,
    marginTop: 4,
  },
});
