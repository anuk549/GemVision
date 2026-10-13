import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import {
  AppText,
  Button,
  Card,
  ChipGroup,
  Icon,
  Input,
  LoadingBar,
  Pagination,
  Popup,
  Screen,
  SearchBar,
  Table,
  UploadCard,
} from '../../components';
import { colors, radius, spacing } from '../../theme';
import { rules } from '../../utils/validation';
import useForm from '../../hooks/useForm';
import {
  AESTHETIC_STYLES,
  COLOR_GRADES,
  GEMSTONE_TYPES,
  JEWELRY_TYPES,
  METAL_ALLOYS,
  SETTING_STYLES,
  STONE_GRADES,
  TREATMENTS,
} from '../constants';
import { generateDesignAndQuote } from '../services';
import { DesignShowcaseCard, ValuationCard } from '../components';

const PAGE_SIZE = 4;

export default function JewelryDesignScreen() {
  const [prompt, setPrompt] = useState('');
  const [aestheticStyle, setAestheticStyle] = useState('Modern');
  const [showAdvancedSpecs, setShowAdvancedSpecs] = useState(false);

  // Physical specifications
  const [category, setCategory] = useState('Ring');
  const [metal, setMetal] = useState('22KT Gold');
  const [gemstone, setGemstone] = useState('Blue Sapphire');
  const [setting, setSetting] = useState('Prong');
  const [stoneGrade, setStoneGrade] = useState('AA (Fine Jewelry)');
  const [colorGrade, setColorGrade] = useState('Royal Blue');
  const [treatment, setTreatment] = useState('Heated');
  const [referenceImage, setReferenceImage] = useState(null);

  // Generation & valuation states
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0.45);
  const [showProgress, setShowProgress] = useState(false);
  const [generatedDesign, setGeneratedDesign] = useState(null);
  const [savedQuotes, setSavedQuotes] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sampleCounter, setSampleCounter] = useState(1);

  const [popup, setPopup] = useState({
    visible: false,
    type: 'success',
    title: '',
    message: '',
  });

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

  const handleGenerate = async () => {
    const activePrompt = prompt.trim() || 'A ring with multiple lines of this gem';
    setShowProgress(true);
    setGenerating(true);
    setProgress(0.15);

    const stepTimer1 = setTimeout(() => setProgress(0.45), 400);
    const stepTimer2 = setTimeout(() => setProgress(0.85), 900);

    const outcome = await form.handleSubmit(async (values) => {
      const nextSample = (sampleCounter % 3) + 1;
      setSampleCounter(nextSample);

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
        prompt: activePrompt,
        aesthetic_style: aestheticStyle,
        sample_index: nextSample,
      };

      try {
        const result = await generateDesignAndQuote(spec, referenceImage);
        return { spec, result };
      } finally {
        setProgress(1.0);
      }
    });

    clearTimeout(stepTimer1);
    clearTimeout(stepTimer2);
    setGenerating(false);

    if (!outcome.ok) {
      setShowProgress(false);
      setPopup({
        visible: true,
        type: 'error',
        title: 'Validation Error',
        message: 'Please review physical parameters (carats and grams).',
      });
      return;
    }

    const { spec, result } = outcome.result;
    setGeneratedDesign(result);

    const fairPrice = result?.valuation?.p50_fair_market_price_lkr || 0;
    setSavedQuotes((prev) => [
      {
        id: String(Date.now()),
        title: spec.prompt.slice(0, 24) + (spec.prompt.length > 24 ? '…' : ''),
        style: spec.aesthetic_style,
        metal: spec.metal,
        gemstone: `${spec.gemstone} (${spec.gemstone_weight_ct}ct)`,
        price: fairPrice ? `LKR ${fairPrice.toLocaleString()}` : '—',
      },
      ...prev,
    ]);

    setPopup({
      visible: true,
      type: 'success',
      title: 'Design Synthesized',
      message: `FLUX.2 Generative render ready with Gemini Vision audit and dynamic LKR valuation.`,
    });
  };

  const filteredQuotes = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return savedQuotes;
    return savedQuotes.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.style.toLowerCase().includes(q) ||
        item.gemstone.toLowerCase().includes(q)
    );
  }, [savedQuotes, search]);

  const totalPages = Math.max(1, Math.ceil(filteredQuotes.length / PAGE_SIZE));
  const currentQuotes = filteredQuotes.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const tableColumns = [
    { key: 'title', title: 'Design Prompt', flex: 1.5 },
    { key: 'style', title: 'Style', width: 85 },
    { key: 'gemstone', title: 'Gemstone', flex: 1.2 },
    { key: 'price', title: 'Fair Market', flex: 1.2, align: 'right' },
  ];

  const brandHeader = (
    <View style={styles.brandRow}>
      <View style={styles.brandLogo}>
        <Icon name="diamond" size={20} color={colors.accent} />
        <AppText variant="subtitle" weight="700" color={colors.text}>
          GemVision
        </AppText>
      </View>
      <View style={styles.signalBadge}>
        <Icon name="radio" size={18} color={colors.emerald} />
      </View>
    </View>
  );

  return (
    <Screen
      title="Jewelry Design Lab"
      titleColor={colors.emerald}
      headerTop={brandHeader}
    >
      {/* Generative Design Lab Card */}
      <Card style={styles.labCard}>
        <AppText variant="body" color={colors.textMuted} style={styles.descriptionText}>
          Describe your vision or provide parameters for the generative model.
        </AppText>

        <AppText variant="label" color={colors.emerald} style={styles.sectionLabel}>
          DESIGN PROMPT
        </AppText>

        <Input
          multiline
          placeholder="e.g. A ring with multiple lines of this gem"
          value={prompt}
          onChangeText={setPrompt}
          style={styles.promptInputWrapper}
          inputStyle={styles.promptTextInput}
        />

        <AppText variant="label" color={colors.emerald} style={styles.sectionLabel}>
          AESTHETIC STYLE
        </AppText>

        <ChipGroup
          options={AESTHETIC_STYLES}
          value={aestheticStyle}
          onChange={setAestheticStyle}
          color={colors.emerald}
          style={styles.chipGroup}
        />

        {/* Generate Design Action */}
        <Button
          title="GENERATE DESIGN"
          variant="emerald"
          size="lg"
          pill
          loading={generating}
          onPress={handleGenerate}
          style={styles.generateButton}
          textStyle={styles.generateButtonText}
        />

        {/* Progress Loading Indicator */}
        {(showProgress || generating) && (
          <View style={styles.progressContainer}>
            <LoadingBar
              progress={progress}
              label={generating ? 'Generating...' : 'Synthesized'}
              labelColor={colors.emerald}
              showPercentage
              color={colors.emerald}
              height={5}
            />
          </View>
        )}
      </Card>

      {/* Generated Design Showcase */}
      {generatedDesign && (
        <DesignShowcaseCard design={generatedDesign} />
      )}

      {/* Dynamic BOM & Valuation Certificate */}
      {generatedDesign?.valuation && (
        <ValuationCard
          estimate={generatedDesign}
          specs={{
            category,
            metal,
            gemstone,
            metal_weight_g: form.values.metalWeight,
            gemstone_weight_ct: form.values.carats,
          }}
        />
      )}

      {/* Expandable Physical Parameters Engine */}
      <Card style={styles.specsCard}>
        <Pressable
          onPress={() => setShowAdvancedSpecs((prev) => !prev)}
          style={styles.specsHeader}
        >
          <View style={styles.specsTitleRow}>
            <Icon name="options-outline" size={18} color={colors.accent} />
            <AppText variant="subtitle" weight="600">
              Physical Specification Engine
            </AppText>
          </View>
          <Icon
            name={showAdvancedSpecs ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={colors.textMuted}
          />
        </Pressable>

        {showAdvancedSpecs && (
          <View style={styles.specsContent}>
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
              value={referenceImage}
              onChange={setReferenceImage}
              title="Upload Reference Jewelry Sketch / Photo"
              subtitle="Audited with Gemini Vision for setting style & melee count"
              style={styles.uploadCard}
            />
          </View>
        )}
      </Card>

      {/* Recent Syntheses / Quotes History */}
      <View style={styles.historySection}>
        <AppText variant="title" style={styles.historyTitle}>
          Design Portfolio & Valuations
        </AppText>

        {savedQuotes.length > 0 && (
          <SearchBar
            value={search}
            onChangeText={(text) => {
              setSearch(text);
              setPage(1);
            }}
            placeholder="Search saved designs…"
            onClear={() => {
              setSearch('');
              setPage(1);
            }}
            style={styles.searchBar}
          />
        )}

        <Table
          columns={tableColumns}
          data={currentQuotes}
          horizontal
          emptyTitle="No Saved Designs Yet"
          emptyMessage="Enter a design prompt above and tap 'GENERATE DESIGN'."
          footer={
            totalPages > 1 ? (
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            ) : null
          }
        />
      </View>

      {/* User Feedback Modal */}
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
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  brandLogo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  signalBadge: {
    padding: spacing.xs,
  },
  labCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
  },
  descriptionText: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    letterSpacing: 1.2,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  promptInputWrapper: {
    marginTop: spacing.xs,
  },
  promptTextInput: {
    minHeight: 110,
    fontSize: 15,
    lineHeight: 22,
  },
  chipGroup: {
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  generateButton: {
    marginTop: spacing.sm,
    height: 52,
  },
  generateButtonText: {
    fontWeight: '800',
    letterSpacing: 1,
    fontSize: 15,
  },
  progressContainer: {
    marginTop: spacing.lg,
    paddingTop: spacing.xs,
  },
  specsCard: {
    marginTop: spacing.md,
    padding: spacing.lg,
  },
  specsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  specsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  specsContent: {
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
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
  historySection: {
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  historyTitle: {
    marginBottom: spacing.sm,
  },
  searchBar: {
    marginBottom: spacing.sm,
  },
});
