import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  AppText,
  Button,
  Card,
  ChipGroup,
  Icon,
  Input,
  KeyValue,
  Popup,
  Screen,
  Table,
} from '../../../components';
import { colors, radius, spacing } from '../../../theme';
import { rules } from '../../../utils/validation';
import useForm from '../../../hooks/useForm';

const SHAPES = [
  { label: 'Round', value: 'Round', yield: 0.4 },
  { label: 'Oval', value: 'Oval', yield: 0.45 },
  { label: 'Emerald', value: 'Emerald', yield: 0.5 },
  { label: 'Pear', value: 'Pear', yield: 0.42 },
  { label: 'Cushion', value: 'Cushion', yield: 0.48 },
  { label: 'Marquise', value: 'Marquise', yield: 0.38 },
];

const PRICE_PER_CARAT = 450;

export default function CuttingScreen() {
  const [shape, setShape] = useState('Round');
  const [result, setResult] = useState(null);
  const [plans, setPlans] = useState([]);
  const [popup, setPopup] = useState({ visible: false, type: 'success', title: '', message: '' });

  const form = useForm({
    initialValues: { carat: '', length: '', width: '', depth: '' },
    validationSchema: {
      carat: [rules.required('Rough carat is required'), rules.number(), rules.minValue(0.01)],
      length: [rules.number()],
      width: [rules.number()],
      depth: [rules.number()],
    },
  });

  const calculate = async () => {
    const outcome = await form.handleSubmit(async (values) => {
      const carat = Number(values.carat);
      const factor = SHAPES.find((s) => s.value === shape)?.yield ?? 0.4;
      const polished = Number((carat * factor).toFixed(2));
      return {
        id: String(Date.now()),
        shape,
        carat: carat.toFixed(2),
        polished: polished.toFixed(2),
        yield: Math.round(factor * 100),
        value: Math.round(polished * PRICE_PER_CARAT),
      };
    });

    if (!outcome.ok) {
      setPopup({
        visible: true,
        type: 'error',
        title: 'Check your input',
        message: 'Enter a valid rough carat and numeric dimensions.',
      });
      return;
    }
    setResult(outcome.result);
  };

  const savePlan = () => {
    if (!result) return;
    setPlans((prev) => [result, ...prev]);
    setPopup({
      visible: true,
      type: 'success',
      title: 'Plan saved',
      message: `${result.shape} cut plan added to your list.`,
    });
  };

  const columns = [
    { key: 'shape', title: 'Shape', flex: 1 },
    { key: 'carat', title: 'Rough', width: 74, align: 'center' },
    { key: 'polished', title: 'Polished', width: 84, align: 'center' },
    { key: 'yield', title: 'Yield', width: 68, align: 'center', render: (r) => `${r.yield}%` },
  ];

  return (
    <Screen title="Gem Cutting" subtitle="Plan a cut and estimate polished yield.">
      <Card>
        <AppText variant="label" color={colors.textMuted} style={styles.fieldLabel}>
          Cut shape
        </AppText>
        <ChipGroup
          options={SHAPES.map(({ label, value }) => ({ label, value }))}
          value={shape}
          onChange={(value) => {
            setShape(value);
            setResult(null);
          }}
        />

        <View style={styles.grid}>
          <Input
            label="Rough carat"
            required
            keyboardType="decimal-pad"
            value={form.values.carat}
            onChangeText={form.handleChange('carat')}
            onBlur={form.handleBlur('carat')}
            error={form.errors.carat}
            placeholder="3.20"
            style={styles.half}
          />
          <Input
            label="Length (mm)"
            keyboardType="decimal-pad"
            value={form.values.length}
            onChangeText={form.handleChange('length')}
            error={form.errors.length}
            placeholder="9.0"
            style={styles.half}
          />
          <Input
            label="Width (mm)"
            keyboardType="decimal-pad"
            value={form.values.width}
            onChangeText={form.handleChange('width')}
            error={form.errors.width}
            placeholder="7.0"
            style={styles.half}
          />
          <Input
            label="Depth (mm)"
            keyboardType="decimal-pad"
            value={form.values.depth}
            onChangeText={form.handleChange('depth')}
            error={form.errors.depth}
            placeholder="4.5"
            style={styles.half}
          />
        </View>
      </Card>

      <Button title="Calculate yield" icon="calculator-outline" loading={form.submitting} onPress={calculate} />

      {result ? (
        <Card>
          <View style={styles.resultHeader}>
            <View style={styles.resultIcon}>
              <Icon name="cut" size={18} color={colors.accent} />
            </View>
            <AppText variant="title">Estimated result</AppText>
          </View>
          <KeyValue
            items={[
              { label: 'Cut shape', value: result.shape, icon: 'shapes-outline', color: colors.accent },
              { label: 'Rough carat', value: result.carat, icon: 'ellipse-outline' },
              { label: 'Polished carat', value: result.polished, icon: 'diamond-outline', color: colors.success },
              { label: 'Yield', value: `${result.yield}%`, icon: 'trending-up-outline' },
              { label: 'Estimated value', value: `$${result.value.toLocaleString()}`, icon: 'cash-outline', color: colors.success },
            ]}
          />
          <Button title="Save plan" variant="secondary" icon="bookmark-outline" onPress={savePlan} style={styles.saveButton} />
        </Card>
      ) : null}

      <AppText variant="title" style={styles.sectionTitle}>
        Saved plans
      </AppText>
      <Table
        columns={columns}
        data={plans}
        emptyTitle="No cutting plans"
        emptyMessage="Calculate a cut to save a plan."
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
    marginBottom: spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  half: {
    width: '47%',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  resultIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: {
    marginTop: spacing.lg,
  },
  sectionTitle: {
    marginTop: spacing.sm,
  },
});
