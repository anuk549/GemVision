import React, { useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { colors, radius, spacing } from '../../theme';
import AppText from '../AppText';
import Button from '../Button';
import Card from '../Card';
import { ChipGroup } from '../Chip';
import Dropdown from '../Dropdown';
import Icon from '../Icon';
import Input from '../Input';
import KeyValue from '../KeyValue';
import Popup from '../Popup';
import { predictSapphirePrice } from '../../services';

const BLUE_SAPPHIRE_COLORS = [
  'Blue',
  'Bluish Green',
  'Bluish Grey',
  'Bluish Purple',
  'Color Change',
  'Greenish Blue',
  'Greyish Blue',
  'Purplish Blue',
  'Violet',
];

const YELLOW_SAPPHIRE_COLORS = [
  'Yellow',
  'Yellowish Green',
  'Yellowish Brown',
  'Yellowish Orange',
  'Orangish Yellow',
  'Greenish Yellow',
];

const INTENSITY_OPTIONS = ['Intense', 'Medium', 'Vivid', 'Light', 'Dark', 'Faint'];

const CLARITY_OPTIONS = [
  'Eye Clean',
  'Very Very Slightly Included',
  'Very Slightly Included',
  'Slightly Included',
  'Included',
];

const SHAPE_OPTIONS = [
  { label: 'Oval', value: 'Oval', icon: 'ellipse-outline' },
  { label: 'Cushion', value: 'Cushion', icon: 'square-outline' },
  { label: 'Round', value: 'Round', icon: 'disc-outline' },
  { label: 'Emerald Cut', value: 'Emerald Cut', icon: 'browsers-outline' },
  { label: 'Pear', value: 'Pear', icon: 'water-outline' },
  { label: 'Radiant', value: 'Radiant', icon: 'diamond-outline' },
  { label: 'Asscher', value: 'Asscher', icon: 'cube-outline' },
  { label: 'Princess', value: 'Princess', icon: 'hardware-chip-outline' },
  { label: 'Marquise', value: 'Marquise', icon: 'eye-outline' },
  { label: 'Heart', value: 'Heart', icon: 'heart-outline' },
  { label: 'Trillion', value: 'Trillion', icon: 'triangle-outline' },
];

const CUT_OPTIONS = [
  'Mixed Brilliant Cut',
  'Emerald Cut',
  'Radiant Cut',
  'Asscher Cut',
  'Step Cut',
];

const TREATMENT_OPTIONS = ['Heat Treated', 'No Enhancement', 'Lattice Diffused'];

const ORIGIN_OPTIONS = [
  'Ceylon (Sri Lanka)',
  'Madagascar',
  'Montana',
  'Tanzania',
  'Thailand',
  'Other',
];

function sanitizeTwoDecimals(text) {
  if (text == null) return '';
  let clean = String(text).replace(/,/g, '.');
  clean = clean.replace(/[^0-9.]/g, '');
  const parts = clean.split('.');
  if (parts.length > 2) {
    clean = `${parts[0]}.${parts.slice(1).join('')}`;
  }
  if (clean.includes('.')) {
    const [whole, decimal] = clean.split('.');
    return `${whole}.${decimal.slice(0, 2)}`;
  }
  return clean;
}

export default function SapphirePricePredictionView({
  identifiedGem,
  onBack,
  onProceedToRecommendation,
}) {
  const isYellow = identifiedGem?.rawClass === 'yellow_sapphire';
  const gemDisplayName = isYellow ? 'Yellow Sapphire' : 'Blue Sapphire';
  const gemThemeColor = isYellow ? colors.accent : colors.sapphire;
  const imageUri = identifiedGem?.localUri || identifiedGem?.sourceUri || identifiedGem?.backendImageUrl;

  const colorOptions = isYellow ? YELLOW_SAPPHIRE_COLORS : BLUE_SAPPHIRE_COLORS;

  const [weight, setWeight] = useState('2.10');
  const [length, setLength] = useState('8.40');
  const [width, setWidth] = useState('6.90');
  const [height, setHeight] = useState('4.60');
  const [color, setColor] = useState(isYellow ? 'Yellow' : 'Blue');
  const [intensity, setIntensity] = useState('Vivid');
  const [clarity, setClarity] = useState('Eye Clean');
  const [shape, setShape] = useState('Oval');
  const [cut, setCut] = useState('Mixed Brilliant Cut');
  const [treatment, setTreatment] = useState('Heat Treated');
  const [origin, setOrigin] = useState('Ceylon (Sri Lanka)');

  const [errors, setErrors] = useState({});
  const [calculating, setCalculating] = useState(false);
  const [priceResult, setPriceResult] = useState(null);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [popup, setPopup] = useState({ visible: false, type: 'info', title: '', message: '' });

  const handleWeightChange = (val) => {
    setWeight(sanitizeTwoDecimals(val));
    if (errors.weight) setErrors((prev) => ({ ...prev, weight: undefined }));
  };

  const handleLengthChange = (val) => {
    setLength(sanitizeTwoDecimals(val));
    if (errors.length) setErrors((prev) => ({ ...prev, length: undefined }));
  };

  const handleWidthChange = (val) => {
    setWidth(sanitizeTwoDecimals(val));
    if (errors.width) setErrors((prev) => ({ ...prev, width: undefined }));
  };

  const handleHeightChange = (val) => {
    setHeight(sanitizeTwoDecimals(val));
    if (errors.height) setErrors((prev) => ({ ...prev, height: undefined }));
  };

  const validate = () => {
    const errs = {};
    const w = parseFloat(weight);
    const l = parseFloat(length);
    const wi = parseFloat(width);
    const h = parseFloat(height);

    if (isNaN(w) || w <= 0) errs.weight = 'Enter valid carat weight (> 0)';
    if (isNaN(l) || l <= 0) errs.length = 'Enter length in mm (> 0)';
    if (isNaN(wi) || wi <= 0) errs.width = 'Enter width in mm (> 0)';
    if (isNaN(h) || h <= 0) errs.height = 'Enter height in mm (> 0)';
    if (!color) errs.color = 'Select a color';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleEstimate = async () => {
    if (!validate()) {
      setPopup({
        visible: true,
        type: 'warning',
        title: 'Invalid Dimensions',
        message: 'Please enter valid positive numbers for weight, length, width, and height.',
      });
      return;
    }

    setCalculating(true);
    try {
      const outcome = await predictSapphirePrice({
        weight,
        length,
        width,
        height,
        color,
        intensity,
        clarity,
        shape,
        cut,
        treatment,
        origin,
        coverage: 0.5,
      });

      setPriceResult(outcome);
      setShowPriceModal(true);
    } catch (err) {
      setPopup({
        visible: true,
        type: 'error',
        title: 'Price Estimation Failed',
        message: err.message || 'Could not reach backend pricing service.',
      });
    } finally {
      setCalculating(false);
    }
  };

  const handleProceedToRecommendation = () => {
    setShowPriceModal(false);
    onProceedToRecommendation?.(
      {
        weight: parseFloat(weight),
        length: parseFloat(length),
        width: parseFloat(width),
        height: parseFloat(height),
        color,
        intensity,
        clarity,
        shape,
        cut,
        treatment,
        origin,
      },
      priceResult
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {/* Back button */}
      <Pressable onPress={onBack} style={styles.backButton} hitSlop={8}>
        <Icon name="arrow-back" size={20} color={colors.accent} />
        <AppText variant="caption" weight="700" color={colors.accent}>
          Back to Gem Identification
        </AppText>
      </Pressable>

      {/* Identified Gemstone Banner */}
      <Card style={styles.gemBanner}>
        <View style={styles.bannerRow}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.gemThumb} resizeMode="cover" />
          ) : (
            <View style={[styles.gemThumbFallback, { backgroundColor: `${gemThemeColor}22` }]}>
              <Icon name="diamond" size={24} color={gemThemeColor} />
            </View>
          )}
          <View style={styles.bannerContent}>
            <View style={styles.badgeRow}>
              <View style={[styles.scanBadge, { backgroundColor: `${gemThemeColor}22` }]}>
                <Icon name="checkmark-circle" size={12} color={gemThemeColor} />
                <AppText variant="caption" color={gemThemeColor} weight="700">
                  Identified Gemstone
                </AppText>
              </View>
            </View>
            <AppText variant="title" weight="700" color={colors.text}>
              {gemDisplayName}
            </AppText>
            <AppText variant="caption" color={colors.textDim}>
              Market Price Range Estimator
            </AppText>
          </View>
        </View>
      </Card>

      {/* Input Form Card */}
      <Card>
        <View style={styles.cardHeader}>
          <Icon name="options-outline" size={18} color={colors.accent} />
          <AppText variant="subtitle" weight="700">
            Stone Characteristics
          </AppText>
        </View>

        {/* 1. Dimensions Grid */}
        <AppText variant="label" color={colors.textMuted} style={styles.sectionLabel}>
          DIMENSIONS & CARAT WEIGHT
        </AppText>
        <View style={styles.grid}>
          <Input
            label="Weight (Carat)"
            required
            keyboardType="decimal-pad"
            value={weight}
            onChangeText={handleWeightChange}
            error={errors.weight}
            placeholder="2.10"
            leftIcon="scale-outline"
            style={styles.half}
          />
          <Input
            label="Length (mm)"
            required
            keyboardType="decimal-pad"
            value={length}
            onChangeText={handleLengthChange}
            error={errors.length}
            placeholder="8.40"
            leftIcon="resize-outline"
            style={styles.half}
          />
          <Input
            label="Width (mm)"
            required
            keyboardType="decimal-pad"
            value={width}
            onChangeText={handleWidthChange}
            error={errors.width}
            placeholder="6.90"
            leftIcon="resize-outline"
            style={styles.half}
          />
          <Input
            label="Height (mm)"
            required
            keyboardType="decimal-pad"
            value={height}
            onChangeText={handleHeightChange}
            error={errors.height}
            placeholder="4.60"
            leftIcon="resize-outline"
            style={styles.half}
          />
        </View>

        {/* 2. Color & Clarity Dropdowns */}
        <AppText variant="label" color={colors.textMuted} style={styles.sectionLabel}>
          COLOR & CLARITY
        </AppText>
        <View style={styles.formRow}>
          <Dropdown
            label={`Color (${gemDisplayName})`}
            value={color}
            options={colorOptions}
            onChange={setColor}
            leftIcon="color-palette-outline"
            error={errors.color}
          />
        </View>

        <View style={styles.grid}>
          <Dropdown
            label="Intensity"
            value={intensity}
            options={INTENSITY_OPTIONS}
            onChange={setIntensity}
            leftIcon="sunny-outline"
            style={styles.half}
          />
          <Dropdown
            label="Clarity"
            value={clarity}
            options={CLARITY_OPTIONS}
            onChange={setClarity}
            leftIcon="eye-outline"
            style={styles.half}
          />
        </View>

        {/* 3. Shape Choice Chips */}
        <AppText variant="label" color={colors.textMuted} style={styles.sectionLabel}>
          GEMSTONE SHAPE
        </AppText>
        <ChipGroup
          options={SHAPE_OPTIONS}
          value={shape}
          onChange={setShape}
          color={colors.accent}
          style={styles.chipGroup}
        />

        {/* 4. Cut, Treatment & Origin */}
        <AppText variant="label" color={colors.textMuted} style={styles.sectionLabel}>
          CUT, TREATMENT & ORIGIN
        </AppText>
        <View style={styles.formRow}>
          <Dropdown
            label="Cut Style"
            value={cut}
            options={CUT_OPTIONS}
            onChange={setCut}
            leftIcon="cut-outline"
          />
        </View>

        <View style={styles.grid}>
          <Dropdown
            label="Treatment"
            value={treatment}
            options={TREATMENT_OPTIONS}
            onChange={setTreatment}
            leftIcon="flame-outline"
            style={styles.half}
          />
          <Dropdown
            label="Origin"
            value={origin}
            options={ORIGIN_OPTIONS}
            onChange={setOrigin}
            leftIcon="globe-outline"
            style={styles.half}
          />
        </View>

        <View style={styles.actionWrap}>
          <Button
            title="Estimate Price Range"
            icon="calculator-outline"
            loading={calculating}
            onPress={handleEstimate}
          />
        </View>
      </Card>

      {/* 5. Estimated Price Range Pop-up Card */}
      <Modal
        visible={showPriceModal && !!priceResult}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPriceModal(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setShowPriceModal(false)}
        >
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <Card style={styles.resultCard}>
              <View style={styles.cardHeader}>
                <View style={styles.resultIconWrap}>
                  <Icon name="cash" size={20} color={colors.success} />
                </View>
                <View style={styles.resultHeaderTitles}>
                  <AppText variant="title">Estimated Price Range</AppText>
                  <AppText variant="caption" color={colors.textDim}>
                    Market Price Valuation (USD)
                  </AppText>
                </View>
                <Pressable
                  onPress={() => setShowPriceModal(false)}
                  hitSlop={8}
                  style={styles.modalCloseBtn}
                >
                  <Icon name="close" size={22} color={colors.textMuted} />
                </Pressable>
              </View>

              {/* Prominent Price Range Callout */}
              <View style={styles.priceCallout}>
                <AppText variant="caption" color={colors.textMuted} weight="700">
                  TOTAL ESTIMATED VALUE
                </AppText>
                <AppText variant="hero" color={colors.success} weight="700" style={styles.heroPrice}>
                  {priceResult?.formattedTotalPriceRange}
                </AppText>
                <View style={styles.perCaratBadge}>
                  <AppText variant="subtitle" color={colors.accent} weight="700">
                    {priceResult?.formattedPricePerCaratRange}
                  </AppText>
                </View>
              </View>

              {/* Summary KeyValue breakdown */}
              {priceResult ? (
                <KeyValue
                  items={[
                    { label: 'Stone Weight', value: `${priceResult.weight} ct`, icon: 'scale-outline' },
                    { label: 'Median Valuation', value: `~$${priceResult.totalPriceMid.toLocaleString()} ($${priceResult.pricePerCaratMid.toLocaleString()}/ct)`, icon: 'stats-chart-outline', color: colors.primary },
                    { label: 'Color & Clarity', value: `${color} (${clarity})`, icon: 'diamond-outline' },
                    { label: 'Shape & Cut', value: `${shape} (${cut})`, icon: 'shapes-outline' },
                    { label: 'Origin & Treatment', value: `${origin} • ${treatment}`, icon: 'globe-outline' },
                  ]}
                />
              ) : null}
            </Card>

            {/* Below that card: Jewelry Recommendation button */}
            <View style={styles.modalActions}>
              <Button
                title="Jewelry Recommendation"
                icon="diamond-outline"
                onPress={handleProceedToRecommendation}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Popup
        visible={popup.visible}
        type={popup.type}
        title={popup.title}
        message={popup.message}
        onClose={() => setPopup((prev) => ({ ...prev, visible: false }))}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
  },
  gemBanner: {
    padding: spacing.md,
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  gemThumb: {
    width: 60,
    height: 60,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  gemThumbFallback: {
    width: 60,
    height: 60,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  bannerContent: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  scanBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  sectionLabel: {
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    letterSpacing: 0.5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  half: {
    width: '48%',
  },
  formRow: {
    width: '100%',
    marginBottom: spacing.xs,
  },
  chipGroup: {
    marginBottom: spacing.sm,
  },
  actionWrap: {
    marginTop: spacing.lg,
  },
  resultCard: {
    borderColor: `${colors.success}40`,
    borderWidth: 1,
  },
  resultIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.successSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultHeaderTitles: {
    flex: 1,
  },
  priceCallout: {
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginVertical: spacing.md,
    gap: spacing.xs,
  },
  heroPrice: {
    fontSize: 28,
    textAlign: 'center',
    marginVertical: 4,
  },
  perCaratBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.accentSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  modalContent: {
    width: '100%',
    maxWidth: 440,
    gap: spacing.md,
  },
  modalCloseBtn: {
    padding: spacing.xs,
  },
  modalActions: {
    width: '100%',
  },
});
