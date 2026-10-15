import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import {
  AppText,
  Button,
  Card,
  Chip,
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
  NON_SAPPHIRE_GEMS,
  SETTING_STYLES,
  STONE_GRADES,
  TREATMENTS,
} from '../constants';
import { buildClientEnhancedPrompt, generateDesignAndQuote } from '../services';
import { DesignShowcaseCard, ValuationCard } from '../components';

const PAGE_SIZE = 4;

const SPEC_TABS = [
  { id: 'sapphire', label: '1. Sapphire', icon: 'diamond-outline' },
  { id: 'metal', label: '2. Metal', icon: 'hardware-chip-outline' },
  { id: 'setting', label: '3. Setting', icon: 'construct-outline' },
  { id: 'style', label: '4. Style', icon: 'color-palette-outline' },
];

const CARAT_PILLS = ['1.50', '2.00', '2.50', '3.50', '5.00'];
const METAL_WEIGHT_PILLS = ['3.0', '4.5', '6.0', '8.5', '12.0'];
const ACCENT_PILLS = ['0', '12', '24', '36'];

export default function JewelryDesignScreen() {
  const [prompt, setPrompt] = useState('');
  const [originalPrompt, setOriginalPrompt] = useState('');
  const [isEnhanced, setIsEnhanced] = useState(false);
  const [aestheticStyle, setAestheticStyle] = useState('Modern');
  const [activeTab, setActiveTab] = useState('sapphire');

  // Physical specifications (Ceylon Sapphire defaults)
  const [category, setCategory] = useState('Ring');
  const [metal, setMetal] = useState('22KT Gold');
  const [gemstone, setGemstone] = useState('Blue Sapphire');
  const [setting, setSetting] = useState('Prong');
  const [stoneGrade, setStoneGrade] = useState('AA (Fine Jewelry)');
  const [colorGrade, setColorGrade] = useState('Royal Blue');
  const [treatment, setTreatment] = useState('Heated');
  const [referenceType, setReferenceType] = useState('gemstone'); // 'gemstone' | 'sketch'
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

  // Real-time detection of non-sapphire gemstones in prompt or dropdown
  const detectedNonSapphire = useMemo(() => {
    const text = prompt.toLowerCase();
    for (const gem of NON_SAPPHIRE_GEMS) {
      if (text.includes(gem)) {
        return gem.charAt(0).toUpperCase() + gem.slice(1);
      }
    }
    if (gemstone === 'Other') {
      return 'Non-Sapphire Gemstone';
    }
    return null;
  }, [prompt, gemstone]);

  // AI Prompt Enhancement handler
  const handleToggleEnhance = () => {
    if (isEnhanced) {
      setPrompt(originalPrompt);
      setIsEnhanced(false);
    } else {
      setOriginalPrompt(prompt);
      const enhanced = buildClientEnhancedPrompt({
        prompt: prompt || 'A bespoke ring featuring this gem',
        category,
        metal,
        gemstone,
        colorGrade,
        setting,
        aestheticStyle,
        carats: form.values.carats,
      });
      setPrompt(enhanced);
      setIsEnhanced(true);
    }
  };

  const handleClearPrompt = () => {
    setPrompt('');
    setIsEnhanced(false);
    setOriginalPrompt('');
  };

  const handleGenerate = async () => {
    const activePrompt = prompt.trim() || 'A bespoke ring featuring this gem';
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
        reference_type: referenceType,
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
        gemstone: `${spec.gemstone} (${spec.gemstone_weight_ct}ct)`,
        price: fairPrice ? `LKR ${fairPrice.toLocaleString()}` : '—',
      },
      ...prev,
    ]);

    setPopup({
      visible: true,
      type: 'success',
      title: 'Design & Valuation Ready',
      message: `FLUX.2 design generated with estimated fair market price: LKR ${fairPrice.toLocaleString()}.`,
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

  const activeTabIndex = SPEC_TABS.findIndex((t) => t.id === activeTab);
  const nextTabObj = activeTabIndex < SPEC_TABS.length - 1 ? SPEC_TABS[activeTabIndex + 1] : null;
  const prevTabObj = activeTabIndex > 0 ? SPEC_TABS[activeTabIndex - 1] : null;

  return (
    <Screen
      title="Jewelry Design Lab"
      titleColor={colors.emerald}
      headerTop={brandHeader}
    >
      {/* Generative Design Lab Studio Card */}
      <Card style={styles.labCard}>
        <AppText variant="body" color={colors.textMuted} style={styles.descriptionText}>
          Describe your jewelry vision and customize gemological parameters. Calibrated specifically for Ceylon Blue & Yellow Sapphires.
        </AppText>

        {/* Prompt Header & Action Controls */}
        <View style={styles.labelRow}>
          <AppText variant="label" color={colors.emerald} style={styles.sectionLabel}>
            DESIGN PROMPT
          </AppText>
          <View style={styles.promptActionGroup}>
            {prompt.length > 0 && (
              <Pressable onPress={handleClearPrompt} style={styles.clearButton}>
                <Icon name="close-circle-outline" size={13} color={colors.textMuted} />
                <AppText variant="caption" weight="600" color={colors.textMuted}>
                  Clear
                </AppText>
              </Pressable>
            )}
            <Pressable
              onPress={handleToggleEnhance}
              style={[styles.enhanceButton, isEnhanced && styles.enhanceButtonActive]}
            >
              <Icon
                name={isEnhanced ? 'refresh-outline' : 'sparkles-outline'}
                size={13}
                color={isEnhanced ? colors.emerald : colors.accent}
              />
              <AppText
                variant="caption"
                weight="700"
                color={isEnhanced ? colors.emerald : colors.accent}
              >
                {isEnhanced ? 'Revert' : 'Enhance'}
              </AppText>
            </Pressable>
          </View>
        </View>

        {/* Multiline Prompt Input */}
        <Input
          multiline
          placeholder="e.g. A bespoke ring with multiple intertwining lines holding this gemstone securely"
          value={prompt}
          onChangeText={(text) => {
            setPrompt(text);
            if (isEnhanced) setIsEnhanced(false);
          }}
          style={styles.promptInputWrapper}
          inputStyle={styles.promptTextInput}
        />

        {/* Real-time Non-Sapphire Pricing Calibration Notice */}
        {detectedNonSapphire && (
          <View style={styles.warningBox}>
            <View style={styles.warningHeaderRow}>
              <Icon name="alert-circle" size={16} color={colors.warning} />
              <AppText variant="caption" weight="700" color={colors.warning}>
                PRICING CALIBRATION NOTICE ({detectedNonSapphire.toUpperCase()})
              </AppText>
            </View>
            <AppText variant="caption" color={colors.textMuted} style={styles.warningText}>
              Our dynamic valuation engine is calibrated specifically on Sri Lankan{' '}
              <AppText variant="caption" weight="700" color={colors.text}>
                Ceylon Sapphires (Blue & Yellow)
              </AppText>{' '}
              using Colombo spot rates and real market power-law models. Because you specified{' '}
              <AppText variant="caption" weight="600" color={colors.warning}>
                {detectedNonSapphire}
              </AppText>
              , the estimated cost price is an approximate baseline and may not accurately reflect specialized {detectedNonSapphire} market pricing.
            </AppText>
          </View>
        )}

        {/* Integrated Specification & BOM Parameters Studio */}
        <View style={styles.specStudioContainer}>
          {/* Studio Header & Live Configuration Summary */}
          <View style={styles.specStudioHeader}>
            <View style={styles.specHeaderTitleRow}>
              <Icon name="options-outline" size={15} color={colors.accent} />
              <AppText variant="label" color={colors.accent} style={styles.specHeaderTitle}>
                SAPPHIRE & BOM SPECIFICATIONS
              </AppText>
            </View>
            <View style={styles.liveSummaryBadge}>
              <AppText variant="caption" color={colors.textDim} numberOfLines={1}>
                {form.values.carats || '2.5'}ct {colorGrade} · {form.values.metalWeight || '5'}g {metal} · {setting} · {category}
              </AppText>
            </View>
          </View>

          {/* Scrollable Step Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabScrollContainer}
          >
            {SPEC_TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <Pressable
                  key={tab.id}
                  onPress={() => setActiveTab(tab.id)}
                  style={[styles.stepTab, isActive && styles.stepTabActive]}
                >
                  <Icon
                    name={tab.icon}
                    size={14}
                    color={isActive ? colors.emerald : colors.textMuted}
                  />
                  <AppText
                    variant="caption"
                    weight={isActive ? '700' : '500'}
                    color={isActive ? colors.emerald : colors.textMuted}
                  >
                    {tab.label}
                  </AppText>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Active Specification Tab Content */}
          <View style={styles.tabContentCard}>
            {/* Tab 1: Center Sapphire */}
            {activeTab === 'sapphire' && (
              <View style={styles.tabPane}>
                <AppText variant="label" color={colors.emerald} style={styles.subfieldLabel}>
                  Center Gemstone (Sapphire Calibration Focus)
                </AppText>
                <ChipGroup
                  options={GEMSTONE_TYPES}
                  value={gemstone}
                  onChange={setGemstone}
                  color={gemstone === 'Yellow Sapphire' ? colors.warning : colors.sapphire}
                />

                <AppText variant="label" color={colors.textMuted} style={styles.subfieldLabel}>
                  Color Shade
                </AppText>
                <ChipGroup
                  options={COLOR_GRADES}
                  value={colorGrade}
                  onChange={setColorGrade}
                  color={colors.sapphire}
                />

                <AppText variant="label" color={colors.textMuted} style={styles.subfieldLabel}>
                  Quality Grade
                </AppText>
                <ChipGroup
                  options={STONE_GRADES}
                  value={stoneGrade}
                  onChange={setStoneGrade}
                  color={colors.emerald}
                />

                {/* Carat Quick Pills & Decimal Input */}
                <AppText variant="label" color={colors.textMuted} style={styles.subfieldLabel}>
                  Sapphire Carats (ct)
                </AppText>
                <View style={styles.quickPillRow}>
                  {CARAT_PILLS.map((pill) => (
                    <Chip
                      key={pill}
                      label={`${pill}ct`}
                      active={form.values.carats === pill}
                      color={colors.emerald}
                      onPress={() => form.handleChange('carats')(pill)}
                    />
                  ))}
                </View>
                <Input
                  label="Exact Carat Mass"
                  required
                  keyboardType="decimal-pad"
                  value={form.values.carats}
                  onChangeText={form.handleChange('carats')}
                  onBlur={form.handleBlur('carats')}
                  error={form.errors.carats}
                  placeholder="2.50"
                  style={styles.pillInput}
                />

                <AppText variant="label" color={colors.textMuted} style={styles.subfieldLabel}>
                  Gem Treatment
                </AppText>
                <ChipGroup
                  options={TREATMENTS}
                  value={treatment}
                  onChange={setTreatment}
                />
              </View>
            )}

            {/* Tab 2: Metal & Mass */}
            {activeTab === 'metal' && (
              <View style={styles.tabPane}>
                <AppText variant="label" color={colors.accent} style={styles.subfieldLabel}>
                  Precious Metal Alloy
                </AppText>
                <ChipGroup
                  options={METAL_ALLOYS}
                  value={metal}
                  onChange={setMetal}
                  color={colors.accent}
                />

                {/* Metal Weight Quick Pills & Input */}
                <AppText variant="label" color={colors.textMuted} style={styles.subfieldLabel}>
                  Metal Mass (Grams)
                </AppText>
                <View style={styles.quickPillRow}>
                  {METAL_WEIGHT_PILLS.map((pill) => (
                    <Chip
                      key={pill}
                      label={`${pill}g`}
                      active={form.values.metalWeight === pill}
                      color={colors.accent}
                      onPress={() => form.handleChange('metalWeight')(pill)}
                    />
                  ))}
                </View>
                <Input
                  label="Exact Metal Mass (g)"
                  required
                  keyboardType="decimal-pad"
                  value={form.values.metalWeight}
                  onChangeText={form.handleChange('metalWeight')}
                  onBlur={form.handleBlur('metalWeight')}
                  error={form.errors.metalWeight}
                  placeholder="5.0"
                  style={styles.pillInput}
                />
                <AppText variant="caption" color={colors.textDim} style={styles.hintText}>
                  Colombo spot rates: 22KT Gold (~LKR 33,500/g) · Platinum (~LKR 19,500/g) · Silver (~LKR 950/g)
                </AppText>
              </View>
            )}

            {/* Tab 3: Setting & Accents */}
            {activeTab === 'setting' && (
              <View style={styles.tabPane}>
                <AppText variant="label" color={colors.textMuted} style={styles.subfieldLabel}>
                  Setting Architecture
                </AppText>
                <ChipGroup
                  options={SETTING_STYLES}
                  value={setting}
                  onChange={setSetting}
                  color={colors.sapphire}
                />

                {/* Accent Count Quick Pills & Input */}
                <AppText variant="label" color={colors.textMuted} style={styles.subfieldLabel}>
                  Accent Stones (Melee Diamonds / Sapphires)
                </AppText>
                <View style={styles.quickPillRow}>
                  {ACCENT_PILLS.map((pill) => (
                    <Chip
                      key={pill}
                      label={pill === '0' ? 'Solitaire (0)' : `${pill} Melee`}
                      active={form.values.accents === pill}
                      color={colors.sapphire}
                      onPress={() => form.handleChange('accents')(pill)}
                    />
                  ))}
                </View>
                <Input
                  label="Custom Accent Count"
                  keyboardType="number-pad"
                  value={form.values.accents}
                  onChangeText={form.handleChange('accents')}
                  placeholder="0"
                  style={styles.pillInput}
                />

                <AppText variant="label" color={colors.accent} style={styles.subfieldLabel}>
                  Visual Reference Mode (Preservation or Concept Sketch)
                </AppText>
                <View style={styles.referenceTypeToggleRow}>
                  <Pressable
                    onPress={() => setReferenceType('gemstone')}
                    style={[
                      styles.referenceTypeOption,
                      referenceType === 'gemstone' && styles.referenceTypeOptionActive,
                    ]}
                  >
                    <Icon
                      name="diamond-outline"
                      size={14}
                      color={referenceType === 'gemstone' ? colors.emerald : colors.textMuted}
                    />
                    <AppText
                      variant="caption"
                      weight={referenceType === 'gemstone' ? '700' : '500'}
                      color={referenceType === 'gemstone' ? colors.emerald : colors.textMuted}
                    >
                      Loose Gem Photo
                    </AppText>
                  </Pressable>

                  <Pressable
                    onPress={() => setReferenceType('sketch')}
                    style={[
                      styles.referenceTypeOption,
                      referenceType === 'sketch' && styles.referenceTypeOptionActive,
                    ]}
                  >
                    <Icon
                      name="pencil-outline"
                      size={14}
                      color={referenceType === 'sketch' ? colors.accent : colors.textMuted}
                    />
                    <AppText
                      variant="caption"
                      weight={referenceType === 'sketch' ? '700' : '500'}
                      color={referenceType === 'sketch' ? colors.accent : colors.textMuted}
                    >
                      Jewelry Sketch / CAD
                    </AppText>
                  </Pressable>
                </View>

                <UploadCard
                  value={referenceImage}
                  onChange={setReferenceImage}
                  title={
                    referenceType === 'gemstone'
                      ? 'Upload Loose Ceylon Sapphire Photo'
                      : 'Upload Hand-drawn Jewelry Sketch / Wireframe'
                  }
                  subtitle={
                    referenceType === 'gemstone'
                      ? 'FLUX inpainting preserves 100% exact stone pixels while building metal prongs outward'
                      : 'Guides FLUX ring shank contours, crossover lines, and structural prong placement'
                  }
                  style={styles.uploadCard}
                />
              </View>
            )}

            {/* Tab 4: Category & Style */}
            {activeTab === 'style' && (
              <View style={styles.tabPane}>
                <AppText variant="label" color={colors.textMuted} style={styles.subfieldLabel}>
                  Jewelry Category
                </AppText>
                <ChipGroup
                  options={JEWELRY_TYPES}
                  value={category}
                  onChange={setCategory}
                  color={colors.sapphire}
                />

                <AppText variant="label" color={colors.emerald} style={styles.subfieldLabel}>
                  Aesthetic Style
                </AppText>
                <ChipGroup
                  options={AESTHETIC_STYLES}
                  value={aestheticStyle}
                  onChange={setAestheticStyle}
                  color={colors.emerald}
                />
              </View>
            )}

            {/* Step Navigation Controls */}
            <View style={styles.tabStepperRow}>
              {prevTabObj ? (
                <Pressable
                  onPress={() => setActiveTab(prevTabObj.id)}
                  style={styles.stepNavButton}
                >
                  <Icon name="arrow-back" size={13} color={colors.textMuted} />
                  <AppText variant="caption" color={colors.textMuted}>
                    {prevTabObj.label}
                  </AppText>
                </Pressable>
              ) : (
                <View />
              )}

              {nextTabObj && (
                <Pressable
                  onPress={() => setActiveTab(nextTabObj.id)}
                  style={[styles.stepNavButton, styles.stepNavButtonNext]}
                >
                  <AppText variant="caption" weight="700" color={colors.emerald}>
                    Next: {nextTabObj.label}
                  </AppText>
                  <Icon name="arrow-forward" size={13} color={colors.emerald} />
                </Pressable>
              )}
            </View>
          </View>
        </View>

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
              label={generating ? 'Synthesizing bespoke CAD jewelry model...' : 'Design synthesized'}
              labelColor={colors.emerald}
              showPercentage
              color={colors.emerald}
              height={5}
            />
          </View>
        )}
      </Card>

      {/* Prominent Estimated Cost Price & Valuation Banner */}
      {generatedDesign?.valuation && (
        <Card style={styles.valuationHeroCard}>
          <View style={styles.valuationHeroTop}>
            <View>
              <AppText variant="caption" color={colors.textMuted}>
                ESTIMATED FAIR MARKET PRICE
              </AppText>
              <AppText variant="h2" color={colors.emerald} style={styles.priceHeroText}>
                LKR {generatedDesign.valuation.p50_fair_market_price_lkr?.toLocaleString() || '—'}
              </AppText>
            </View>
            <View style={styles.verifiedBadge}>
              <Icon name="shield-checkmark" size={14} color={colors.emerald} />
              <AppText variant="caption" weight="700" color={colors.emerald}>
                Verified BOM
              </AppText>
            </View>
          </View>

          <View style={styles.marketRangeRow}>
            <View style={styles.rangeTile}>
              <AppText variant="caption" color={colors.textDim}>Wholesale Floor (P10)</AppText>
              <AppText variant="bodyStrong" color={colors.text}>
                LKR {generatedDesign.valuation.p10_wholesale_floor_lkr?.toLocaleString() || '—'}
              </AppText>
            </View>
            <View style={styles.rangeTile}>
              <AppText variant="caption" color={colors.textDim}>Showroom Retail (P90)</AppText>
              <AppText variant="bodyStrong" color={colors.ruby}>
                LKR {generatedDesign.valuation.p90_showroom_ceiling_lkr?.toLocaleString() || '—'}
              </AppText>
            </View>
          </View>

          <View style={styles.quickCostBreakdown}>
            <AppText variant="caption" color={colors.textMuted}>
              Cost Summary: Center Gem LKR {generatedDesign.bom_breakdown?.gemstone_cost_lkr?.toLocaleString()} · Metal LKR {generatedDesign.bom_breakdown?.metal_cost_lkr?.toLocaleString()} · Wadakuliya Labor LKR {generatedDesign.bom_breakdown?.labor_cost_lkr?.toLocaleString()}
            </AppText>
          </View>
        </Card>
      )}

      {/* Generated Design Showcase */}
      {generatedDesign && (
        <DesignShowcaseCard design={generatedDesign} />
      )}

      {/* Dynamic Itemized BOM & Valuation Certificate */}
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
    fontSize: 14,
    lineHeight: 21,
    marginBottom: spacing.md,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  sectionLabel: {
    letterSpacing: 1.2,
    fontSize: 12,
    fontWeight: '700',
  },
  promptActionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(94, 112, 137, 0.15)',
  },
  enhanceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(233, 185, 73, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(233, 185, 73, 0.3)',
  },
  enhanceButtonActive: {
    backgroundColor: 'rgba(37, 192, 138, 0.15)',
    borderColor: colors.emerald,
  },
  promptInputWrapper: {
    marginTop: spacing.xs,
  },
  promptTextInput: {
    minHeight: 95,
    fontSize: 15,
    lineHeight: 22,
  },
  warningBox: {
    backgroundColor: 'rgba(233, 162, 59, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(233, 162, 59, 0.35)',
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  warningHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  warningText: {
    lineHeight: 19,
  },
  specStudioContainer: {
    marginTop: spacing.lg,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  specStudioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  specHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  specHeaderTitle: {
    fontSize: 11,
    letterSpacing: 1,
    fontWeight: '700',
  },
  liveSummaryBadge: {
    maxWidth: '48%',
  },
  tabScrollContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  stepTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  stepTabActive: {
    backgroundColor: 'rgba(37, 192, 138, 0.15)',
    borderColor: colors.emerald,
  },
  tabContentCard: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  tabPane: {
    gap: spacing.xs,
  },
  subfieldLabel: {
    fontSize: 12,
    marginTop: spacing.sm,
    marginBottom: spacing.xxs,
  },
  quickPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  pillInput: {
    marginTop: spacing.xxs,
  },
  hintText: {
    marginTop: spacing.xxs,
    fontSize: 11,
  },
  referenceTypeToggleRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xxs,
    marginBottom: spacing.xs,
  },
  referenceTypeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  referenceTypeOptionActive: {
    backgroundColor: 'rgba(37, 192, 138, 0.12)',
    borderColor: colors.emerald,
  },
  uploadCard: {
    marginTop: spacing.xs,
  },
  tabStepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  stepNavButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: spacing.xs,
  },
  stepNavButtonNext: {
    backgroundColor: 'rgba(37, 192, 138, 0.1)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
  },
  generateButton: {
    marginTop: spacing.lg,
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
  valuationHeroCard: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1.5,
    borderColor: colors.emerald,
    borderRadius: radius.xl,
    padding: spacing.xl,
    marginTop: spacing.md,
  },
  valuationHeroTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  priceHeroText: {
    marginTop: spacing.xxs,
    fontWeight: '800',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(37, 192, 138, 0.15)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  marketRangeRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  rangeTile: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: spacing.sm,
    borderRadius: radius.sm,
    gap: spacing.xxs,
  },
  quickCostBreakdown: {
    marginTop: spacing.md,
    paddingTop: spacing.xs,
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
