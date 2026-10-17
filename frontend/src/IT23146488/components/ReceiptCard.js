import React, { useState, useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText, Card, Icon } from '../../components';
import { colors, radius, spacing } from '../../theme';
import { useLiveExchangeRate } from '../services/currencyService';

export default function ReceiptCard({ estimate, specs, warningGem }) {
  // Default currency is USD ($) as requested by the user
  const [currency, setCurrency] = useState('USD');
  const liveCurrency = useLiveExchangeRate();

  const bom = estimate?.bom_breakdown || {};
  const val = estimate?.valuation || {};

  // Deterministic receipt ID based on design sample and BOM values
  const receiptId = useMemo(() => {
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

  const rateUsd = val?.exchange_rate_lkr_usd || liveCurrency.rate || 331.25;
  const isUsd = currency === 'USD';

  // Itemized costs in LKR
  const gemCostLkr = bom?.gemstone_cost_lkr || 0;
  const metalCostLkr = bom?.metal_cost_lkr || 0;
  const laborCostLkr =
    (bom?.labor_cost_lkr || 0) +
    (bom?.setting_cost_lkr || 0) +
    (bom?.accent_cost_lkr || 0);
  const subtotalLkr =
    bom?.total_manufacturing_cost_lkr ||
    (gemCostLkr + metalCostLkr + laborCostLkr);

  // Itemized costs in USD
  const gemCostUsd = bom?.gemstone_cost_usd ?? Math.round(gemCostLkr / rateUsd);
  const metalCostUsd = bom?.metal_cost_usd ?? Math.round(metalCostLkr / rateUsd);
  const laborCostUsd =
    (bom?.labor_cost_usd ?? Math.round((bom?.labor_cost_lkr || 0) / rateUsd)) +
    (bom?.setting_cost_usd ?? Math.round((bom?.setting_cost_lkr || 0) / rateUsd)) +
    (bom?.accent_cost_usd ?? Math.round((bom?.accent_cost_lkr || 0) / rateUsd));
  const subtotalUsd =
    bom?.total_manufacturing_cost_usd ?? Math.round(subtotalLkr / rateUsd);

  // Quantile valuations
  const p10Lkr = val?.p10_wholesale_floor_lkr || Math.round(subtotalLkr * 1.06);
  const p50Lkr = val?.p50_fair_market_price_lkr || Math.round(subtotalLkr * 1.22);
  const p90Lkr = val?.p90_showroom_ceiling_lkr || Math.round(subtotalLkr * 1.42);

  const p10Usd = val?.p10_wholesale_floor_usd ?? Math.round(p10Lkr / rateUsd);
  const p50Usd = val?.p50_fair_market_price_usd ?? Math.round(p50Lkr / rateUsd);
  const p90Usd = val?.p90_showroom_ceiling_usd ?? Math.round(p90Lkr / rateUsd);

  // Formatted amounts based on selected currency
  const activeGemCost = isUsd ? `$${gemCostUsd.toLocaleString()}` : `LKR ${gemCostLkr.toLocaleString()}`;
  const activeMetalCost = isUsd ? `$${metalCostUsd.toLocaleString()}` : `LKR ${metalCostLkr.toLocaleString()}`;
  const activeLaborCost = isUsd ? `$${laborCostUsd.toLocaleString()}` : `LKR ${laborCostLkr.toLocaleString()}`;
  const activeSubtotal = isUsd ? `$${subtotalUsd.toLocaleString()}` : `LKR ${subtotalLkr.toLocaleString()}`;

  // Price range string (strictly a range, not a single exact value)
  const priceRangeString = isUsd
    ? `$${p10Usd.toLocaleString()} – $${p90Usd.toLocaleString()}`
    : `LKR ${p10Lkr.toLocaleString()} – ${p90Lkr.toLocaleString()}`;

  const midpointString = isUsd ? `$${p50Usd.toLocaleString()}` : `LKR ${p50Lkr.toLocaleString()}`;

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

        {/* Currency Switcher: USD ($ Default) vs LKR */}
        <View style={styles.currencyToggleWrapper}>
          <AppText variant="caption" weight="800" color={colors.textMuted} style={styles.currencyToggleLabel}>
            CURRENCY {liveCurrency.isLive ? '· LIVE FX' : ''}:
          </AppText>
          <View style={styles.currencyTogglePillRow}>
            <Pressable
              onPress={() => setCurrency('USD')}
              style={[
                styles.currencyToggleBtn,
                isUsd && styles.currencyToggleBtnActive,
              ]}
              hitSlop={6}
            >
              <AppText
                variant="caption"
                weight="800"
                color={isUsd ? '#000000' : colors.textMuted}
              >
                $ USD (Default)
              </AppText>
            </Pressable>
            <Pressable
              onPress={() => setCurrency('LKR')}
              style={[
                styles.currencyToggleBtn,
                !isUsd && styles.currencyToggleBtnActive,
              ]}
              hitSlop={6}
            >
              <AppText
                variant="caption"
                weight="800"
                color={!isUsd ? '#000000' : colors.textMuted}
              >
                LKR (Rs)
              </AppText>
            </Pressable>
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
            AMOUNT ({isUsd ? 'USD' : 'LKR'})
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
            {activeGemCost}
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
            {activeMetalCost}
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
            {activeLaborCost}
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
            {activeSubtotal}
          </AppText>
        </View>

        {/* Final Price Highlight: Represented as a RANGE (Not exact single value) */}
        <View style={styles.totalPriceContainer}>
          <View style={styles.totalPriceTopRow}>
            <View>
              <AppText variant="caption" weight="800" color={colors.emerald} style={styles.totalLabel}>
                ESTIMATED FAIR VALUE RANGE
              </AppText>
              <AppText variant="caption" color={colors.textMuted}>
                P10 Wholesale Floor – P90 Showroom Ceiling
              </AppText>
            </View>
            <View style={styles.rangePill}>
              <Icon name="swap-horizontal" size={13} color={colors.emerald} />
              <AppText variant="caption" weight="800" color={colors.emerald} style={styles.rangePillText}>
                SPREAD
              </AppText>
            </View>
          </View>

          <AppText variant="h2" weight="900" color={colors.emerald} style={styles.totalPriceText}>
            {priceRangeString}
          </AppText>

          <View style={styles.midpointRow}>
            <AppText variant="caption" color={colors.textDim}>
              Appraised Midpoint (P50):{' '}
              <AppText variant="caption" weight="700" color={colors.text}>
                {midpointString}
              </AppText>
              {'  ·  '}1 USD = {rateUsd} LKR{liveCurrency.isLive ? ' (Live)' : ''}
            </AppText>
          </View>
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
  currencyToggleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    marginVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  currencyToggleLabel: {
    letterSpacing: 1,
    fontSize: 10,
  },
  currencyTogglePillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceAlt,
    padding: 3,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  currencyToggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  currencyToggleBtnActive: {
    backgroundColor: colors.emerald,
  },
  totalPriceContainer: {
    backgroundColor: 'rgba(37, 192, 138, 0.08)',
    padding: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(37, 192, 138, 0.3)',
    gap: 6,
  },
  totalPriceTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rangePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(37, 192, 138, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(37, 192, 138, 0.35)',
  },
  rangePillText: {
    fontSize: 10,
    letterSpacing: 0.8,
  },
  totalLabel: {
    letterSpacing: 1,
    fontSize: 12,
    marginBottom: 2,
  },
  totalPriceText: {
    fontSize: 22,
    letterSpacing: 0.5,
  },
  midpointRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
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
