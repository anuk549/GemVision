import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import {
  AppText,
  Button,
  Card,
  ChipGroup,
  ErrorMessage,
  Gem3DView,
  Icon,
  Input,
  KeyValue,
  LoadingBar,
  Popup,
  Screen,
  Table,
  UploadCard,
} from '../../../components';
import { recommendPattern, getPatternRenderUrl } from '../../../services/gemService';
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
  { label: 'Cabochon', value: 'Cabochon', yield: 0.55 },
  { label: 'Star', value: 'Star', yield: 0.35 },
];

const PRICE_PER_CARAT = 450;

export default function CuttingScreen() {
  const [shape, setShape] = useState('Round');
  const [result, setResult] = useState(null);
  const [plans, setPlans] = useState([]);
  const [popup, setPopup] = useState({ visible: false, type: 'success', title: '', message: '' });

  const [recImage, setRecImage] = useState(null);
  const [recLoading, setRecLoading] = useState(false);
  const [recError, setRecError] = useState(null);
  const [recResult, setRecResult] = useState(null);
  const [showRecViz, setShowRecViz] = useState(false);

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

  const runRecommendation = async () => {
    if (!recImage) {
      setPopup({
        visible: true,
        type: 'warning',
        title: 'No image',
        message: 'Add a gemstone photo before requesting a recommendation.',
      });
      return;
    }
    setRecLoading(true);
    setRecError(null);
    setRecResult(null);
    setShowRecViz(false);
    try {
      const data = await recommendPattern(recImage);
      setRecResult(data);
    } catch (err) {
      setRecError(err);
      setPopup({
        visible: true,
        type: 'error',
        title: 'Recommendation failed',
        message: err?.message || 'Could not reach the backend. Is it running?',
      });
    } finally {
      setRecLoading(false);
    }
  };

  const columns = [
    { key: 'shape', title: 'Shape', flex: 1 },
    { key: 'carat', title: 'Rough', width: 74, align: 'center' },
    { key: 'polished', title: 'Polished', width: 84, align: 'center' },
    { key: 'yield', title: 'Yield', width: 68, align: 'center', render: (r) => `${r.yield}%` },
  ];

  return (
    <Screen title="Gem Cutting" subtitle="Plan a cut, estimate yield, and recommend a pattern.">
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

      <AppText variant="title" style={styles.sectionTitle}>
        Gem Cutting Recommendation
      </AppText>
      <UploadCard
        value={recImage}
        onChange={(asset) => {
          setRecImage(asset);
          setRecResult(null);
          setRecError(null);
          setShowRecViz(false);
        }}
        title="Add a gemstone photo"
      />

      <Button
        title="Recommend pattern"
        icon="sparkles-outline"
        loading={recLoading}
        onPress={runRecommendation}
      />

      {recLoading ? <LoadingBar indeterminate label="Analysing gemstone…" /> : null}
      <ErrorMessage message={recError?.message} />

      {recResult ? (
        <Pressable onPress={() => setShowRecViz((prev) => !prev)}>
          <Card style={styles.patternCard}>
            <View style={styles.patternHeader}>
              <View style={styles.patternIcon}>
                <Icon name="diamond-outline" size={20} color={colors.accent} />
              </View>
              <View style={styles.patternText}>
                <AppText variant="title">{recResult.pattern.name}</AppText>
                <AppText variant="caption" color={colors.textMuted}>
                  by {recResult.pattern.designer}
                </AppText>
              </View>
              <Icon name="chevron-forward" size={20} color={colors.textDim} />
            </View>
            <View style={styles.patternMeta}>
              <AppText variant="caption" color={colors.textMuted}>
                Gem type: {recResult.gemType}
              </AppText>
              <AppText variant="caption" color={colors.textMuted}>
                State: {recResult.state}
              </AppText>
              <AppText variant="caption" color={colors.textMuted}>
                Confidence: {recResult.confidence ?? 'N/A'}%
              </AppText>
              <AppText variant="caption" color={colors.textMuted}>
                Facets: {recResult.pattern.facets} | Index: {recResult.pattern.index}
              </AppText>
            </View>
            <AppText variant="caption" color={colors.accent} style={styles.tapHint}>
              Tap to {showRecViz ? 'hide' : 'view'} the 2D/3D cut-gem visualization
            </AppText>
          </Card>
        </Pressable>
      ) : null}

      {recResult && showRecViz ? (
        <Card style={styles.visualizationCard}>
          <AppText variant="title" style={styles.visualizationTitle}>
            {recResult.pattern.name}
          </AppText>
          <Image
            source={{ uri: getPatternRenderUrl(recResult.pattern.id) }}
            style={styles.visualization}
            resizeMode="contain"
          />
          <View style={styles.webviewWrap}>
            <Gem3DView style={styles.webview} />
          </View>
          <AppText variant="caption" color={colors.textMuted} align="center">
            2D and 3D cut-gem visualization generated from the recommended pattern.
          </AppText>
        </Card>
      ) : null}

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
  patternCard: {
    gap: spacing.sm,
  },
  patternHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  patternIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  patternText: {
    flex: 1,
  },
  patternMeta: {
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  tapHint: {
    marginTop: spacing.sm,
  },
  visualizationCard: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  visualizationTitle: {
    marginBottom: spacing.sm,
  },
  visualization: {
    width: '100%',
    height: 260,
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
  },
  webviewWrap: {
    width: '100%',
    height: 260,
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
