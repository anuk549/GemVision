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

const TYPES = [
  { label: 'Ring', value: 'Ring', icon: 'ellipse-outline' },
  { label: 'Pendant', value: 'Pendant', icon: 'heart-outline' },
  { label: 'Necklace', value: 'Necklace', icon: 'link-outline' },
  { label: 'Earrings', value: 'Earrings', icon: 'flash-outline' },
  { label: 'Bracelet', value: 'Bracelet', icon: 'sync-outline' },
];

const METALS = [
  { label: 'Gold', value: 'Gold' },
  { label: 'White Gold', value: 'White Gold' },
  { label: 'Rose Gold', value: 'Rose Gold' },
  { label: 'Platinum', value: 'Platinum' },
  { label: 'Silver', value: 'Silver' },
];

const GEMS = ['Sapphire', 'Ruby', 'Cat\u2019s Eye', 'Moonstone', 'Spinel', 'Emerald', 'Amethyst'];

export default function DesignScreen() {
  const [type, setType] = useState('Ring');
  const [metal, setMetal] = useState('Gold');
  const [gem, setGem] = useState('Sapphire');
  const [designs, setDesigns] = useState([]);
  const [popup, setPopup] = useState({ visible: false, type: 'success', title: '', message: '' });

  const form = useForm({
    initialValues: { carat: '', budget: '', notes: '' },
    validationSchema: {
      carat: [rules.required('Center stone carat is required'), rules.number(), rules.minValue(0.01)],
      budget: [rules.required('Budget is required'), rules.number(), rules.minValue(1)],
    },
  });

  const save = async () => {
    const outcome = await form.handleSubmit(async (values) => ({
      id: String(Date.now()),
      type,
      metal,
      gem,
      carat: Number(values.carat).toFixed(2),
      budget: Math.round(Number(values.budget)).toLocaleString(),
    }));

    if (!outcome.ok) {
      setPopup({
        visible: true,
        type: 'error',
        title: 'Check your input',
        message: 'Enter a valid carat and budget before saving.',
      });
      return;
    }
    setDesigns((prev) => [outcome.result, ...prev]);
    setPopup({
      visible: true,
      type: 'success',
      title: 'Design saved',
      message: `Your ${type.toLowerCase()} design was saved to the list.`,
    });
  };

  const columns = [
    { key: 'type', title: 'Type', flex: 1 },
    { key: 'metal', title: 'Metal', flex: 1.2 },
    { key: 'gem', title: 'Gem', flex: 1, render: (r) => <AppText variant="body" color={colors.textMuted}>{r.gem}</AppText> },
    { key: 'budget', title: 'Budget', width: 84, align: 'right', render: (r) => `$${r.budget}` },
  ];

  return (
    <Screen title="Jewelry Design" subtitle="Configure a piece and save the design.">
      <Card>
        <AppText variant="label" color={colors.textMuted} style={styles.fieldLabel}>
          Jewelry type
        </AppText>
        <ChipGroup options={TYPES} value={type} onChange={setType} />

        <AppText variant="label" color={colors.textMuted} style={styles.fieldLabel}>
          Metal
        </AppText>
        <ChipGroup options={METALS} value={metal} onChange={setMetal} color={colors.warning} />

        <AppText variant="label" color={colors.textMuted} style={styles.fieldLabel}>
          Center gemstone
        </AppText>
        <ChipGroup
          options={GEMS}
          value={gem}
          onChange={setGem}
          color={colors.success}
        />

        <View style={styles.grid}>
          <Input
            label="Center carat"
            required
            keyboardType="decimal-pad"
            value={form.values.carat}
            onChangeText={form.handleChange('carat')}
            onBlur={form.handleBlur('carat')}
            error={form.errors.carat}
            placeholder="1.20"
            style={styles.half}
          />
          <Input
            label="Budget ($)"
            required
            keyboardType="number-pad"
            value={form.values.budget}
            onChangeText={form.handleChange('budget')}
            onBlur={form.handleBlur('budget')}
            error={form.errors.budget}
            placeholder="2500"
            style={styles.half}
          />
        </View>

        <Input
          label="Notes"
          value={form.values.notes}
          onChangeText={form.handleChange('notes')}
          placeholder="Optional design notes"
          multiline
          style={styles.notes}
        />
      </Card>

      <Card>
        <View style={styles.resultHeader}>
          <View style={styles.resultIcon}>
            <Icon name="color-palette" size={18} color={colors.primary} />
          </View>
          <AppText variant="title">Design summary</AppText>
        </View>
        <KeyValue
          items={[
            { label: 'Type', value: type, icon: 'sparkles-outline', color: colors.primary },
            { label: 'Metal', value: metal, icon: 'ellipse-outline' },
            { label: 'Center gem', value: gem, icon: 'diamond-outline', color: colors.success },
            { label: 'Carat', value: form.values.carat || '—', icon: 'scale-outline' },
            { label: 'Budget', value: form.values.budget ? `$${form.values.budget}` : '—', icon: 'cash-outline' },
          ]}
        />
      </Card>

      <Button title="Save design" icon="save-outline" loading={form.submitting} onPress={save} />

      <AppText variant="title" style={styles.sectionTitle}>
        Saved designs
      </AppText>
      <Table
        columns={columns}
        data={designs}
        emptyTitle="No designs"
        emptyMessage="Configure a piece and save it."
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
  notes: {
    marginTop: spacing.md,
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
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    marginTop: spacing.sm,
  },
});
