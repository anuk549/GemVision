import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  AppText,
  Button,
  Card,
  ChipGroup,
  Input,
  LoadingBar,
  Popup,
  Screen,
  Table,
  UploadCard,
} from '../../components';
import { colors, spacing } from '../../theme';
import { rules } from '../../utils/validation';
import useForm from '../../hooks/useForm';
import {
  COLOR_GRADES,
  GEMSTONE_TYPES,
  JEWELRY_TYPES,
  METAL_ALLOYS,
  SETTING_STYLES,
  STONE_GRADES,
  TREATMENTS,
} from '../constants';
import { calculatePricing } from '../services';
import { ValuationCard } from '../components';

export default function JewelryDesignScreen() {
  const [category, setCategory] = useState('Ring');
  const [metal, setMetal] = useState('22KT Gold');
  const [gemstone, setGemstone] = useState('Blue Sapphire');
  const [setting, setSetting] = useState('Prong');
  const [stoneGrade, setStoneGrade] = useState('AA (Fine Jewelry)');
  const [colorGrade, setColorGrade] = useState('Royal Blue');
  const [treatment, setTreatment] = useState('Heated');
  const [image, setImage] = useState(null);

  const [estimate, setEstimate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [savedQuotes, setSavedQuotes] = useState([]);
  const [popup, setPopup] = useState({ visible: false, type: 'success', title: '', message: '' });

  const form = useForm({
    initialValues: {
      carats: '2.50',
      metalWeight: '5.0',
      accents: '0',
    },
    validationSchema: {
      carats: [rules.required('Gemstone carat is required'), rules.number(), rules.minValue(0.1)],
      metalWeight: [rules.required('Metal weight (grams) is required'), rules.number(), rules.minValue(0.5)],
      accents: [rules.digits()],
    },
  });

  const onCalculate = async () => {
    const outcome = await form.handleSubmit(async (values) => {
      const spec = {
        category,
        metal,
        gemstone,
        setting_type: setting,
        stone_grade: stoneGrade,
        color_grade: colorGrade,
        treatment,
        gemstone_weight_ct: values.carats,
        metal_weight_g: values.metalWeight,
        number_of_accent_stones: values.accents || '0',
      };
      setLoading(true);
      try {
        const result = await calculatePricing(spec);
        setEstimate(result);
        return { spec, result };
      } finally {
        setLoading(false);
      }
    });

    if (!outcome.ok) {
      setPopup({
        visible: true,
        type: 'error',
        title: 'Validation Error',
        message: 'Please provide valid physical parameters (carats and grams).',
      });
      return;
    }

    const { spec, result } = outcome.result;
    const fairPrice = result?.valuation?.p50_fair_market_price_lkr || 0;

    setSavedQuotes((prev) => [
      {
        id: String(Date.now()),
        category: spec.category,
        metal: `${spec.metal} (${spec.metal_weight_g}g)`,
        gemstone: `${spec.gemstone} (${spec.gemstone_weight_ct}ct)`,
        price: fairPrice ? `LKR ${fairPrice.toLocaleString()}` : '—',
      },
      ...prev,
    ]);

    setPopup({
      visible: true,
      type: 'success',
      title: 'Valuation Calculated',
      message: `Quotation generated using live Colombo spot rates & verified Wadakuliya labor.`,
    });
  };

  const tableColumns = [
    { key: 'category', title: 'Item', flex: 0.9 },
    { key: 'metal', title: 'Metal', flex: 1.2 },
    { key: 'gemstone', title: 'Gemstone', flex: 1.2 },
    { key: 'price', title: 'Fair Market', flex: 1.2, align: 'right' },
  ];

  return (
    <Screen
      title="Jewelry Design & Valuation"
      subtitle="AI-driven design synthesis & grounded BOM pricing engine"
    >
      <Card>
        <AppText variant="label" color={colors.textMuted} style={styles.fieldLabel}>
          Jewelry Category
        </AppText>
        <ChipGroup options={JEWELRY_TYPES} value={category} onChange={setCategory} />

        <AppText variant="label" color={colors.textMuted} style={styles.fieldLabel}>
          Precious Metal Alloy
        </AppText>
        <ChipGroup options={METAL_ALLOYS} value={metal} onChange={setMetal} color={colors.accent} />

        <AppText variant="label" color={colors.textMuted} style={styles.fieldLabel}>
          Center Gemstone
        </AppText>
        <ChipGroup options={GEMSTONE_TYPES} value={gemstone} onChange={setGemstone} color={colors.sapphire} />

        <AppText variant="label" color={colors.textMuted} style={styles.fieldLabel}>
          Setting Architecture
        </AppText>
        <ChipGroup options={SETTING_STYLES} value={setting} onChange={setSetting} />

        <AppText variant="label" color={colors.textMuted} style={styles.fieldLabel}>
          Quality & Color Grade
        </AppText>
        <ChipGroup options={STONE_GRADES} value={stoneGrade} onChange={setStoneGrade} color={colors.emerald} />
        <View style={styles.subGap} />
        <ChipGroup options={COLOR_GRADES} value={colorGrade} onChange={setColorGrade} color={colors.topaz} />

        <AppText variant="label" color={colors.textMuted} style={styles.fieldLabel}>
          Gem Treatment
        </AppText>
        <ChipGroup options={TREATMENTS} value={treatment} onChange={setTreatment} />

        <View style={styles.grid}>
          <Input
            label="Center Carats"
            required
            keyboardType="decimal-pad"
            value={form.values.carats}
            onChangeText={form.handleChange('carats')}
            onBlur={form.handleBlur('carats')}
            error={form.errors.carats}
            placeholder="2.50"
            style={styles.half}
          />
          <Input
            label="Metal Mass (g)"
            required
            keyboardType="decimal-pad"
            value={form.values.metalWeight}
            onChangeText={form.handleChange('metalWeight')}
            onBlur={form.handleBlur('metalWeight')}
            error={form.errors.metalWeight}
            placeholder="5.0"
            style={styles.half}
          />
        </View>

        <Input
          label="Accent Stone Count (Melee)"
          keyboardType="number-pad"
          value={form.values.accents}
          onChangeText={form.handleChange('accents')}
          placeholder="0"
          style={styles.full}
        />

        <UploadCard
          value={image}
          onChange={setImage}
          title="Upload Reference Jewelry Sketch / Photo"
          subtitle="Audited with Gemini Vision for setting style & melee count"
          style={styles.uploadCard}
        />
      </Card>

      {loading && <LoadingBar indeterminate label="Computing BOM & Market Quantiles..." />}

      <Button
        title="Estimate Fair Price & BOM"
        icon="calculator-outline"
        loading={loading}
        onPress={onCalculate}
      />

      <ValuationCard
        estimate={estimate}
        specs={{
          category,
          metal,
          gemstone,
          metal_weight_g: form.values.metalWeight,
          gemstone_weight_ct: form.values.carats,
        }}
      />

      <AppText variant="title" style={styles.historyTitle}>
        Recent Valuations
      </AppText>
      <Table
        columns={tableColumns}
        data={savedQuotes}
        emptyTitle="No Saved Quotations"
        emptyMessage="Configure a design above and calculate its valuation."
      />

      <Popup
        visible={popup.visible}
        type={popup.type}
        title={popup.title}
        message={popup.message}
        onClose={() => setPopup((prev) => ({ ...prev, visible: false }))}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  fieldLabel: {
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  subGap: {
    height: spacing.xs,
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  half: {
    width: '47%',
  },
  full: {
    marginTop: spacing.xs,
  },
  uploadCard: {
    marginTop: spacing.md,
  },
  historyTitle: {
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
});
