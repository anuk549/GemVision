import React, { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {
  AppText,
  Button,
  Card,
  Chip,
  ChipGroup,
  Icon,
  Input,
  Pagination,
  Popup,
  Screen,
  SearchBar,
} from '../../components';
import { colors, radius, spacing } from '../../theme';
import { rules } from '../../utils/validation';
import useForm from '../../hooks/useForm';
import {
  CARAT_PRESETS,
  DESIGN_STYLES,
  GEMSTONE_TYPES,
  JEWELRY_TYPES,
  METAL_ALLOYS,
  METAL_WEIGHT_PRESETS,
  NON_SAPPHIRE_GEMS,
} from '../constants';
import { enhancePrompt, generateDesignAndQuote } from '../services';
import {
  // eslint-disable-next-line no-unused-vars
  CompactUploadCard,
  CraftingAnimationCard,
  DesignShowcaseCard,
  ReceiptCard,
  SavedQuoteCard,
} from '../components';
import { getCurrentExchangeRate } from '../services/currencyService';
import { parsePromptSpecifications, detectSpecificationMismatches } from '../utils/promptParser';

const PAGE_SIZE = 4;

export default function JewelryDesignScreen() {
  const scrollViewRef = useRef(null);

  // User input states (Unselected by default - user must explicitly select/enter each)
  const [jewelryType, setJewelryType] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [promptError, setPromptError] = useState('');
  const [originalPrompt, setOriginalPrompt] = useState('');
  const [isEnhanced, setIsEnhanced] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [gemstone, setGemstone] = useState(null);
  const [metal, setMetal] = useState(null);
  const [styleAesthetic, setStyleAesthetic] = useState(null);
  const [specsExpanded, setSpecsExpanded] = useState(true);
  const autoSelectedRef = useRef({});

  // Analyze prompt for fine jewelry attributes and detect specification mismatches
  const specAnalysis = useMemo(() => {
    return detectSpecificationMismatches(prompt, {
      metal,
      category: jewelryType,
      gemstone,
      style: styleAesthetic,
    });
  }, [prompt, metal, jewelryType, gemstone, styleAesthetic]);

  const { detected: promptDetectedSpecs, mismatches: specMismatches } = specAnalysis;

  const handleSyncSpec = (field, value) => {
    if (field === 'metal') {
      setMetal(value);
      autoSelectedRef.current.metal = value;
    } else if (field === 'category') {
      setJewelryType(value);
      autoSelectedRef.current.category = value;
    } else if (field === 'gemstone') {
      setGemstone(value);
      autoSelectedRef.current.gemstone = value;
    } else if (field === 'style') {
      setStyleAesthetic(value);
      autoSelectedRef.current.style = value;
    }
  };

  const handlePromptChange = (text) => {
    setPrompt(text);
    if (promptError) setPromptError('');
    if (isEnhanced) setIsEnhanced(false);

    // Live Real-Time Auto-Selection from typed prompt
    const detected = parsePromptSpecifications(text);

    // 1. Category Auto-Selection
    if (detected.category && (!jewelryType || autoSelectedRef.current.category === jewelryType)) {
      setJewelryType(detected.category);
      autoSelectedRef.current.category = detected.category;
    }

    // 2. Gemstone Auto-Selection
    if (detected.gemstone && (!gemstone || autoSelectedRef.current.gemstone === gemstone)) {
      setGemstone(detected.gemstone);
      autoSelectedRef.current.gemstone = detected.gemstone;
    }

    // 3. Metal Alloy Auto-Selection
    if (detected.metal && (!metal || autoSelectedRef.current.metal === metal)) {
      setMetal(detected.metal);
      autoSelectedRef.current.metal = detected.metal;
    }

    // 4. Style Auto-Selection
    if (detected.style && (!styleAesthetic || autoSelectedRef.current.style === styleAesthetic)) {
      setStyleAesthetic(detected.style);
      autoSelectedRef.current.style = detected.style;
    }

    // 5. Weight Auto-Fill if not manually filled
    if (detected.carats && !form.values.carats) {
      form.handleChange('carats')(detected.carats);
      autoSelectedRef.current.carats = detected.carats;
    }
    if (detected.metalWeight && !form.values.metalWeight) {
      form.handleChange('metalWeight')(detected.metalWeight);
      autoSelectedRef.current.metalWeight = detected.metalWeight;
    }
  };

  const handleSyncAllSpecs = () => {
    specMismatches.forEach((m) => {
      handleSyncSpec(m.field, m.promptValue);
    });
  };

  const handleAutoFillUnsetSpecs = () => {
    if (promptDetectedSpecs.metal && !metal) setMetal(promptDetectedSpecs.metal);
    if (promptDetectedSpecs.category && !jewelryType) setJewelryType(promptDetectedSpecs.category);
    if (promptDetectedSpecs.gemstone && !gemstone) setGemstone(promptDetectedSpecs.gemstone);
    if (promptDetectedSpecs.style && !styleAesthetic) setStyleAesthetic(promptDetectedSpecs.style);
    if (promptDetectedSpecs.carats && !form.values.carats) form.handleChange('carats')(promptDetectedSpecs.carats);
    if (promptDetectedSpecs.metalWeight && !form.values.metalWeight) form.handleChange('metalWeight')(promptDetectedSpecs.metalWeight);
  };

  // Detect non-sapphire stones mentioned in user prompt for real-time pricing notice
  const detectedNonSapphireGem = useMemo(() => {
    if (!prompt) return null;
    const lowerPrompt = prompt.toLowerCase();
    for (const gem of NON_SAPPHIRE_GEMS) {
      const regex = new RegExp(`\\b${gem}\\b`, 'i');
      if (regex.test(lowerPrompt)) {
        return gem.charAt(0).toUpperCase() + gem.slice(1);
      }
    }
    return null;
  }, [prompt]);

  // Distinct image uploads: Loose Gemstone Photo and Concept Sketch
  // const [gemImage, setGemImage] = useState(null);
  // const [sketchImage, setSketchImage] = useState(null);

  // Generation & valuation states
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0.3);
  const [generatedDesign, setGeneratedDesign] = useState(null);
  const [sampleCounter, setSampleCounter] = useState(1);

  // Saved quotes history
  const [savedQuotes, setSavedQuotes] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const [popup, setPopup] = useState({
    visible: false,
    type: 'success',
    title: '',
    message: '',
  });

  const form = useForm({
    initialValues: {
      carats: '',
      metalWeight: '',
    },
    validationSchema: {
      carats: [
        rules.required('Gemstone carat weight is required'),
        rules.number('Enter a valid number'),
        rules.minValue(0.1, 'Minimum 0.1 carats'),
      ],
      metalWeight: [
        rules.required('Metal weight is required'),
        rules.number('Enter a valid number'),
        rules.minValue(0.5, 'Minimum 0.5 grams'),
      ],
    },
  });

  const handleClearPrompt = () => {
    setPrompt('');
    setIsEnhanced(false);
    setOriginalPrompt('');
  };

  const handleEnhancePrompt = async () => {
    if (isEnhanced) {
      setPrompt(originalPrompt);
      setIsEnhanced(false);
      return;
    }

    let cleanPrompt = prompt.trim();
    if (!cleanPrompt) {
      if (jewelryType || gemstone || metal || styleAesthetic) {
        cleanPrompt = `A bespoke ${(styleAesthetic || 'Modern').toLowerCase()} ${(jewelryType || 'Ring').toLowerCase()} featuring a ${(gemstone || 'Blue Sapphire')} set in ${(metal || '22KT Gold')}`;
        setPrompt(cleanPrompt);
      } else {
        setPromptError('Please enter a design prompt or select jewelry options first.');
        setPopup({
          visible: true,
          type: 'error',
          title: 'Design Details Needed',
          message: 'Please enter your jewelry design idea or select your options so AI can enhance it.',
        });
        return;
      }
    }
    setPromptError('');

    setEnhancing(true);
    try {
      setOriginalPrompt(prompt);

      // Auto-synchronize any detected attributes from user prompt into options
      const detected = parsePromptSpecifications(cleanPrompt);
      const effectiveMetal = detected.metal || metal;
      const effectiveCategory = detected.category || jewelryType;
      const effectiveGem = detected.gemstone || gemstone;
      const effectiveStyle = detected.style || styleAesthetic;
      const effectiveCarats = form.values.carats || detected.carats || '2.50';
      const effectiveWeight = form.values.metalWeight || detected.metalWeight || '5.0';

      if (detected.metal && detected.metal !== metal) setMetal(detected.metal);
      if (detected.category && detected.category !== jewelryType) setJewelryType(detected.category);
      if (detected.gemstone && detected.gemstone !== gemstone) setGemstone(detected.gemstone);
      if (detected.style && detected.style !== styleAesthetic) setStyleAesthetic(detected.style);
      if (detected.carats && !form.values.carats) form.handleChange('carats')(detected.carats);
      if (detected.metalWeight && !form.values.metalWeight) form.handleChange('metalWeight')(detected.metalWeight);

      const enhanced = await enhancePrompt({
        prompt: cleanPrompt,
        category: effectiveCategory,
        gemstone: effectiveGem,
        carats: effectiveCarats,
        metal: effectiveMetal,
        metalWeight: effectiveWeight,
        style: effectiveStyle,
      });
      setPrompt(enhanced);
      setIsEnhanced(true);
    } catch {
      setPopup({
        visible: true,
        type: 'error',
        title: 'Enhancement Notice',
        message: 'Could not enhance prompt right now. You can continue typing directly.',
      });
    } finally {
      setEnhancing(false);
    }
  };

  const handleGenerate = async () => {
    const cleanPrompt = prompt.trim();
    const hasPrompt = Boolean(cleanPrompt);
    const hasAllOptions = Boolean(jewelryType && gemstone && metal && styleAesthetic);

    // If user didn't enter a prompt AND didn't select all options
    if (!hasPrompt && !hasAllOptions) {
      setPopup({
        visible: true,
        type: 'error',
        title: 'Design Details Needed',
        message: 'Please either describe your design in the prompt box OR select the jewelry options (Category, Gemstone, Metal, and Style).',
      });
      return;
    }
    setPromptError('');

    // Determine effective options: use explicitly selected option, or detect from prompt, or sensible default
    const detected = hasPrompt ? parsePromptSpecifications(cleanPrompt) : {};
    const effectiveCategory = jewelryType || detected.category || 'Ring';
    const effectiveGemstone = gemstone || detected.gemstone || 'Blue Sapphire';
    const effectiveMetal = metal || detected.metal || '22KT Gold';
    const effectiveStyle = styleAesthetic || detected.style || 'Modern';

    // If user selected all options and didn't write a prompt, auto-synthesize the prompt
    const effectivePrompt = cleanPrompt || `A bespoke ${effectiveStyle.toLowerCase()} luxury ${effectiveCategory.toLowerCase()} featuring a natural ${effectiveGemstone} set in lustrous ${effectiveMetal}`;

    setGenerating(true);
    setProgress(0.2);

    const stepTimer1 = setTimeout(() => setProgress(0.55), 450);
    const stepTimer2 = setTimeout(() => setProgress(0.9), 950);

    const outcome = await form.handleSubmit(async (values) => {
      const nextSample = (sampleCounter % 3) + 1;
      setSampleCounter(nextSample);

      const spec = {
        category: effectiveCategory,
        gemstone: effectiveGemstone,
        gemstone_weight_ct: values.carats,
        metal: effectiveMetal,
        metal_weight_g: values.metalWeight,
        aesthetic_style: effectiveStyle,
        style: effectiveStyle,
        prompt: effectivePrompt,
        sample_index: nextSample,
      };

      try {
        const result = await generateDesignAndQuote(spec);
        return { spec, result };
      } finally {
        setProgress(1.0);
      }
    });

    clearTimeout(stepTimer1);
    clearTimeout(stepTimer2);
    setGenerating(false);

    if (!outcome?.ok || !outcome?.result) {
      const errorMsg =
        outcome?.error?.data?.detail ||
        outcome?.error?.message ||
        (outcome?.errors
          ? 'Ensure gemstone carats and metal weight (grams) are valid positive numbers.'
          : 'Jewelry design generation encountered an issue. Please try again.');
      setPopup({
        visible: true,
        type: 'error',
        title: 'Generation Notice',
        message: String(errorMsg),
      });
      return;
    }

    const { spec, result } = outcome.result;
    setGeneratedDesign(result);

    const rateUsd = result?.valuation?.exchange_rate_lkr_usd || getCurrentExchangeRate();
    const p10Lkr = result?.valuation?.p10_wholesale_floor_lkr || 0;
    const p90Lkr = result?.valuation?.p90_showroom_ceiling_lkr || 0;
    const p10Usd = result?.valuation?.p10_wholesale_floor_usd || Math.round(p10Lkr / rateUsd);
    const p90Usd = result?.valuation?.p90_showroom_ceiling_usd || Math.round(p90Lkr / rateUsd);

    const priceRangeUsd = (p10Usd && p90Usd) ? `$${p10Usd.toLocaleString()} – $${p90Usd.toLocaleString()}` : '—';
    const priceRangeLkr = (p10Lkr && p90Lkr) ? `LKR ${p10Lkr.toLocaleString()} – ${p90Lkr.toLocaleString()}` : '—';

    setSavedQuotes((prev) => [
      {
        id: String(Date.now()),
        title: spec.prompt.slice(0, 42) + (spec.prompt.length > 42 ? '…' : ''),
        category: jewelryType,
        gemstone: `${spec.gemstone} (${spec.gemstone_weight_ct}ct)`,
        metal: `${spec.metal} (${spec.metal_weight_g}g)`,
        style: styleAesthetic,
        price: priceRangeUsd,
        priceRange: priceRangeUsd,
        priceRangeUsd,
        priceRangeLkr,
        date: 'Just now',
        fullResult: result,
        specs: spec,
      },
      ...prev,
    ]);

    setPopup({
      visible: true,
      type: 'success',
      title: 'Design Ready!',
      message: `Your custom jewelry design and official estimation receipt have been generated.`,
    });

    // Smoothly scroll down to the generated result
    setTimeout(() => {
      scrollViewRef.current?.scrollTo?.({ y: 560, animated: true });
    }, 400);
  };

  const filteredQuotes = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return savedQuotes;
    return savedQuotes.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.gemstone.toLowerCase().includes(q) ||
        item.metal.toLowerCase().includes(q)
    );
  }, [savedQuotes, search]);

  const totalPages = Math.max(1, Math.ceil(filteredQuotes.length / PAGE_SIZE));
  const currentQuotes = filteredQuotes.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const brandHeader = (
    <View style={styles.brandRow}>
      <View style={styles.brandLogo}>
        <Icon name="diamond" size={22} color={colors.emerald} />
        <AppText variant="subtitle" weight="800" color={colors.text}>
          GemVision Studio
        </AppText>
      </View>
      <View style={styles.headerTag}>
        <AppText variant="caption" weight="700" color={colors.emerald}>
          CUSTOM DESIGN
        </AppText>
      </View>
    </View>
  );

  return (
    <Screen
      title="Jewelry Designer"
      titleColor={colors.emerald}
      headerTop={brandHeader}
      scroll={false}
      padded={false}
    >
      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={true}
        style={styles.webAwareScroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets={Platform.OS !== 'web'}
      >
        {/* Simple & Clear Main Studio Card */}
        <Card style={styles.mainCard}>
          <AppText variant="body" color={colors.textMuted} style={styles.introText}>
            Create your custom jewelry.
          </AppText>

          {/* SECTION 1: VISUAL UPLOADS (GEM IMAGE & SKETCH) */}
          {/* <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Icon name="images-outline" size={17} color={colors.emerald} />
              <AppText variant="label" weight="800" color={colors.emerald} style={styles.sectionLabel}>
                1. REFERENCE IMAGES (OPTIONAL)
              </AppText>
            </View>

            <View style={styles.uploadRow}>
              {/* Gemstone Image Upload */}
              {/* <View style={styles.uploadColumn}>
                <CompactUploadCard
                  value={gemImage}
                  onChange={setGemImage}
                  title="Gemstone Photo"
                  subtitle="Loose stone or gem"
                  icon="diamond-outline"
                  height={154}
                />
              </View> */}

              {/* Jewelry Sketch Upload */}
              {/* <View style={styles.uploadColumn}>
                <CompactUploadCard
                  value={sketchImage}
                  onChange={setSketchImage}
                  title="Concept Sketch"
                  subtitle="Drawing or layout"
                  icon="pencil-outline"
                  height={154}
                />
              </View>
            </View>
          </View> */} 

          {/* SECTION 2: USER PROMPT */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderBetween}>
              <View style={styles.sectionHeader}>
                <Icon name="chatbubble-ellipses-outline" size={17} color={colors.emerald} />
                <AppText variant="label" weight="800" color={colors.emerald} style={styles.sectionLabel}>
                  1 DESIGN PROMPT
                </AppText>

              </View>
              <View style={styles.promptHeaderActions}>
                {prompt.length > 0 && (
                  <Pressable onPress={handleClearPrompt} style={styles.clearBtn} hitSlop={8}>
                    <Icon name="close-circle-outline" size={13} color={colors.textMuted} />
                    <AppText variant="caption" weight="600" color={colors.textMuted}>
                      Clear
                    </AppText>
                  </Pressable>
                )}
                <Pressable
                  onPress={handleEnhancePrompt}
                  disabled={enhancing}
                  style={[styles.enhanceBtn, isEnhanced && styles.enhanceBtnActive]}
                  hitSlop={8}
                >
                  {enhancing ? (
                    <ActivityIndicator size="small" color={colors.emerald} />
                  ) : (
                    <Icon
                      name={isEnhanced ? 'refresh-outline' : 'sparkles'}
                      size={13}
                      color={colors.emerald}
                    />
                  )}
                  <AppText
                    variant="caption"
                    weight="700"
                    color={colors.emerald}
                  >
                    {enhancing ? 'Enhancing...' : isEnhanced ? 'Revert' : 'AI Enhance'}
                  </AppText>
                </Pressable>
              </View>
            </View>

            <Input
              multiline
              error={promptError}
              placeholder="Describe your design vision (e.g. A delicate solitaire ring with intertwined botanical vines holding the gemstone securely)..."
              value={prompt}
              onFocus={() => {
                if (Platform.OS !== 'web') {
                  setTimeout(() => {
                    scrollViewRef.current?.scrollTo({ y: 150, animated: true });
                  }, 100);
                }
              }}
              onChangeText={handlePromptChange}
              style={styles.promptInputWrapper}
              inputStyle={styles.promptTextInput}
            />

            {/* Real-time Auto-Selected Specs Feedback */}
            {specMismatches.length === 0 && (promptDetectedSpecs.category || promptDetectedSpecs.gemstone || promptDetectedSpecs.metal || promptDetectedSpecs.style) && (
              <View style={styles.autoSelectedBanner}>
                <Icon name="sparkles" size={13} color={colors.emerald} />
                <AppText variant="caption" weight="700" color={colors.emerald} style={{ flex: 1 }}>
                  Auto-selected from prompt: {[
                    promptDetectedSpecs.category,
                    promptDetectedSpecs.gemstone,
                    promptDetectedSpecs.metal,
                    promptDetectedSpecs.style
                  ].filter(Boolean).join(' • ')}
                </AppText>
              </View>
            )}

            {/* Specification Mismatch Warning Banner */}
            {specMismatches.length > 0 && (
              <View style={styles.mismatchBanner}>
                <View style={styles.mismatchHeaderRow}>
                  <View style={styles.mismatchTitleWrap}>
                    <Icon name="swap-horizontal" size={17} color="#F59E0B" />
                    <AppText variant="caption" weight="800" color="#F59E0B">
                      SPECIFICATION MISMATCH DETECTED
                    </AppText>
                  </View>
                  {specMismatches.length > 1 && (
                    <Pressable
                      style={styles.syncAllBtn}
                      onPress={handleSyncAllSpecs}
                      hitSlop={8}
                    >
                      <AppText variant="caption" weight="800" color={colors.emerald}>
                        Sync All
                      </AppText>
                    </Pressable>
                  )}
                </View>

                {specMismatches.map((m) => (
                  <View key={m.field} style={styles.mismatchItem}>
                    <AppText variant="caption" color={colors.textMuted} style={styles.mismatchItemText}>
                      Prompt mentions <AppText variant="caption" weight="700" color={colors.text}>{m.promptValue}</AppText>, but selected is <AppText variant="caption" weight="700" color="#F59E0B">{m.selectedValue}</AppText>.
                    </AppText>
                    <Pressable
                      style={styles.syncItemBtn}
                      onPress={() => handleSyncSpec(m.field, m.promptValue)}
                      hitSlop={6}
                    >
                      <Icon name="checkmark-circle-outline" size={13} color={colors.emerald} />
                      <AppText variant="caption" weight="700" color={colors.emerald}>
                        Select {m.promptValue}
                      </AppText>
                    </Pressable>
                  </View>
                ))}
              </View>
            )}

            {/* Prompt Detected Quick-Fill Pill Bar (when fields are unselected) */}
            {specMismatches.length === 0 &&
              ((!metal && promptDetectedSpecs.metal) ||
                (!jewelryType && promptDetectedSpecs.category) ||
                (!gemstone && promptDetectedSpecs.gemstone) ||
                (!styleAesthetic && promptDetectedSpecs.style)) && (
                <View style={styles.detectedSpecsBanner}>
                  <View style={styles.detectedSpecsContent}>
                    <Icon name="sparkles" size={14} color={colors.emerald} />
                    <AppText variant="caption" color={colors.textMuted} style={{ flex: 1 }}>
                      Detected in prompt: {[
                        promptDetectedSpecs.category,
                        promptDetectedSpecs.gemstone,
                        promptDetectedSpecs.metal,
                        promptDetectedSpecs.style,
                      ]
                        .filter(Boolean)
                        .join(', ')}
                    </AppText>
                  </View>
                  <Pressable
                    style={styles.autoFillBtn}
                    onPress={handleAutoFillUnsetSpecs}
                    hitSlop={6}
                  >
                    <AppText variant="caption" weight="700" color={colors.emerald}>
                      Auto-fill Options
                    </AppText>
                  </Pressable>
                </View>
              )}

            {/* Non-Sapphire Gemstone Pricing Warning */}
            {detectedNonSapphireGem && (
              <View style={styles.gemWarningBanner}>
                <Icon name="alert-circle" size={17} color="#F59E0B" />
                <View style={styles.gemWarningContent}>
                  <AppText variant="caption" weight="800" color="#F59E0B">
                    PRICING WARNING: GEMSTONE MISMATCH
                  </AppText>
                  <AppText variant="caption" color={colors.textMuted} style={styles.gemWarningText}>
                    We only support <AppText variant="caption" weight="700" color={colors.text}>Blue & Yellow Sapphires</AppText>. Because &quot;{detectedNonSapphireGem}&quot; was entered in your prompt, the estimated price prediction will mismatch actual market value.
                  </AppText>
                </View>
              </View>
            )}
          </View>

          {/* SECTION 3: SPECIFICATIONS (COLLAPSIBLE / EXPANDABLE) */}
          <View style={styles.sectionContainer}>
            <Pressable
              onPress={() => setSpecsExpanded((prev) => !prev)}
              style={styles.sectionHeaderBetween}
              hitSlop={6}
            >
              <View style={styles.sectionHeader}>
                <Icon name="options-outline" size={17} color={colors.emerald} />
                <AppText variant="label" weight="800" color={colors.emerald} style={styles.sectionLabel}>
                  2. SPECIFICATIONS
                </AppText>

              </View>
              <View style={styles.collapseTogglePill}>
                <AppText variant="caption" weight="700" color={colors.emerald}>
                  {specsExpanded ? 'Collapse' : 'Expand'}
                </AppText>
                <Icon
                  name={specsExpanded ? 'chevron-up' : 'chevron-down'}
                  size={14}
                  color={colors.emerald}
                />
              </View>
            </Pressable>

            {/* Collapsed summary pill banner */}
            {!specsExpanded && (
              <Pressable
                onPress={() => setSpecsExpanded(true)}
                style={styles.collapsedSummaryBar}
              >
                <View style={styles.collapsedSummaryItems}>
                  <View style={styles.summaryItemPill}>
                    <Icon name="sparkles" size={12} color={colors.emerald} />
                    <AppText variant="caption" weight="700" color={colors.emerald}>
                      {jewelryType || 'Select Type'}
                    </AppText>
                  </View>
                  <View style={styles.summaryItemPill}>
                    <Icon name="diamond-outline" size={12} color={colors.sapphire} />
                    <AppText variant="caption" weight="600" color={colors.sapphire}>
                      {gemstone ? `${gemstone}${form.values.carats ? ` (${form.values.carats}ct)` : ''}` : 'Select Gemstone'}
                    </AppText>
                  </View>
                  <View style={styles.summaryItemPill}>
                    <Icon name="hardware-chip-outline" size={12} color={colors.textMuted} />
                    <AppText variant="caption" weight="600" color={colors.textMuted}>
                      {metal ? `${metal}${form.values.metalWeight ? ` (${form.values.metalWeight}g)` : ''}` : 'Select Metal'}
                    </AppText>
                  </View>
                  <View style={styles.summaryItemPill}>
                    <Icon name="color-palette-outline" size={12} color={colors.amber} />
                    <AppText variant="caption" weight="600" color={colors.amber}>
                      {styleAesthetic || 'Select Style'}
                    </AppText>
                  </View>
                </View>
                <Icon name="pencil-outline" size={14} color={colors.textMuted} />
              </Pressable>
            )}

            {/* Expanded Specifications Controls */}
            {specsExpanded && (
              <View style={styles.expandedSpecsContainer}>
                {/* Spec 0: Jewelry Type & Category (Ring, Necklace, Earrings, Bracelet, Pendant) */}
                <View style={styles.specSubCard}>
                  <View style={styles.specCategoryTitleRow}>
                    <Icon name="sparkles" size={15} color={colors.emerald} />
                    <AppText variant="caption" weight="800" color={colors.emerald} style={styles.specCategoryTitle}>
                      JEWELRY TYPE & CATEGORY
                    </AppText>

                  </View>
                  <AppText variant="caption" weight="600" color={colors.textMuted} style={styles.fieldLabel}>
                    Select the type of jewelry to craft
                  </AppText>
                  <ChipGroup
                    options={JEWELRY_TYPES}
                    value={jewelryType}
                    onChange={(val) => {
                      autoSelectedRef.current.category = null;
                      setJewelryType(val);
                    }}
                    color={colors.emerald}
                  />
                </View>

                {/* Spec 1 & 2: Gemstone Type & Carat Weight */}
                <View style={styles.specSubCard}>
                  <View style={styles.specCategoryTitleRow}>
                    <Icon name="diamond-outline" size={15} color={colors.emerald} />
                    <AppText variant="caption" weight="800" color={colors.emerald} style={styles.specCategoryTitle}>
                      CENTER GEMSTONE
                    </AppText>

                  </View>

                  {/* Option 1: Gemstone Type */}
                  <AppText variant="caption" weight="600" color={colors.textMuted} style={styles.fieldLabel}>
                    Gemstone Type
                  </AppText>
                  <ChipGroup
                    options={GEMSTONE_TYPES}
                    value={gemstone}
                    onChange={(val) => {
                      autoSelectedRef.current.gemstone = null;
                      setGemstone(val);
                    }}
                    color={colors.emerald}
                  />

                  {/* Option 2: Gemstone Carat Weight */}
                  <View style={styles.fieldLabelRow}>
                    <AppText variant="caption" weight="600" color={colors.textMuted}>
                      Carat Weight (ct)
                    </AppText>

                  </View>
                  <View style={styles.pillsRow}>
                    {CARAT_PRESETS.map((pill) => (
                      <Chip
                        key={pill}
                        label={`${pill} ct`}
                        active={form.values.carats === pill}
                        color={colors.emerald}
                        onPress={() => form.handleChange('carats')(pill)}
                      />
                    ))}
                  </View>
                  <Input
                    label="Custom Carat Weight"
                    required
                    keyboardType="decimal-pad"
                    value={form.values.carats}
                    onChangeText={form.handleChange('carats')}
                    onBlur={form.handleBlur('carats')}
                    error={form.errors.carats}
                    placeholder="2.50"
                    style={styles.pillInput}
                  />
                </View>

                {/* Spec 3 & 4: Precious Metal Type & Metal Weight */}
                <View style={styles.specSubCard}>
                  <View style={styles.specCategoryTitleRow}>
                    <Icon name="hardware-chip-outline" size={15} color={colors.emerald} />
                    <AppText variant="caption" weight="800" color={colors.emerald} style={styles.specCategoryTitle}>
                      PRECIOUS METAL
                    </AppText>

                  </View>

                  {/* Option 3: Metal Type */}
                  <AppText variant="caption" weight="600" color={colors.textMuted} style={styles.fieldLabel}>
                    Metal Type
                  </AppText>
                  <ChipGroup
                    options={METAL_ALLOYS}
                    value={metal}
                    onChange={(val) => {
                      autoSelectedRef.current.metal = null;
                      setMetal(val);
                    }}
                    color={colors.emerald}
                  />

                  {/* Option 4: Metal Weight (Grams) */}
                  <View style={styles.fieldLabelRow}>
                    <AppText variant="caption" weight="600" color={colors.textMuted}>
                      Metal Weight (Grams)
                    </AppText>

                  </View>
                  <View style={styles.pillsRow}>
                    {METAL_WEIGHT_PRESETS.map((pill) => (
                      <Chip
                        key={pill}
                        label={`${pill} g`}
                        active={form.values.metalWeight === pill}
                        color={colors.emerald}
                        onPress={() => form.handleChange('metalWeight')(pill)}
                      />
                    ))}
                  </View>
                  <Input
                    label="Custom Metal Weight (g)"
                    required
                    keyboardType="decimal-pad"
                    value={form.values.metalWeight}
                    onChangeText={form.handleChange('metalWeight')}
                    onBlur={form.handleBlur('metalWeight')}
                    error={form.errors.metalWeight}
                    placeholder="5.0"
                    style={styles.pillInput}
                  />
                </View>

                {/* Spec 5: Design Aesthetic (Vintage, Minimal, Modern, Royal Halo) */}
                <View style={styles.specSubCard}>
                  <View style={styles.specCategoryTitleRow}>
                    <Icon name="sparkles-outline" size={15} color={colors.emerald} />
                    <AppText variant="caption" weight="800" color={colors.emerald} style={styles.specCategoryTitle}>
                      DESIGN AESTHETIC & STYLE
                    </AppText>

                  </View>
                  <AppText variant="caption" weight="600" color={colors.textMuted} style={styles.fieldLabel}>
                    Select aesthetic style to guide generative jewelry creation
                  </AppText>

                  <View style={styles.styleOptionsGrid}>
                    {DESIGN_STYLES.map((st) => {
                      const isSelected = styleAesthetic === st.value;
                      return (
                        <Pressable
                          key={st.value}
                          onPress={() => {
                            autoSelectedRef.current.style = null;
                            setStyleAesthetic(st.value);
                          }}
                          style={[
                            styles.styleOptionCard,
                            isSelected && styles.styleOptionCardActive,
                          ]}
                        >
                          <View style={styles.styleOptionHeader}>
                            <Icon
                              name={st.icon}
                              size={16}
                              color={isSelected ? colors.emerald : colors.textMuted}
                            />
                            <AppText
                              variant="caption"
                              weight="800"
                              color={isSelected ? colors.emerald : colors.text}
                            >
                              {st.label}
                            </AppText>
                          </View>
                          <AppText
                            variant="caption"
                            color={isSelected ? colors.text : colors.textDim}
                            style={styles.styleOptionDesc}
                          >
                            {st.description}
                          </AppText>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* Action: Generate Design */}
          <Button
            title="GENERATE JEWELRY DESIGN"
            variant="emerald"
            size="lg"
            pill
            loading={generating}
            onPress={handleGenerate}
            style={styles.generateButton}
            textStyle={styles.generateButtonText}
          />

          {/* Crafting Animation Feedback (Only while generating) */}
          {generating && (
            <CraftingAnimationCard progress={progress} />
          )}
        </Card>

        {/* RESULTS AREA: GENERATED DESIGN IMAGE WITH INSPECT & SAVE */}
        {generatedDesign && (
          <View style={styles.resultSection}>
            <View style={styles.resultHeader}>
              <Icon name="sparkles" size={18} color={colors.emerald} />
              <AppText variant="title" weight="800" color={colors.text}>
                Generated Jewelry Design
              </AppText>
            </View>

            {/* Design Showcase Card: Clean Image Only, Zoom Options & Save */}
            <DesignShowcaseCard design={generatedDesign} />

            {/* Price Receipt: Clean Itemized Receipt */}
            <ReceiptCard
              estimate={generatedDesign}
              specs={{
                category: jewelryType,
                gemstone,
                gemstone_weight_ct: form.values.carats,
                metal,
                metal_weight_g: form.values.metalWeight,
              }}
              warningGem={detectedNonSapphireGem}
            />
          </View>
        )}

        {/* RECENT SAVED DESIGNS GALLERY */}
        <View style={styles.historySection}>
          <View style={styles.historyHeaderRow}>
            <View style={styles.historyTitleRow}>
              <Icon name="bookmark-outline" size={19} color={colors.emerald} />
              <AppText variant="title" weight="800" style={styles.historyTitle}>
                Saved Designs & Quotes
              </AppText>
            </View>
            {savedQuotes.length > 0 && (
              <View style={styles.historyCountBadge}>
                <AppText variant="caption" weight="700" color={colors.emerald}>
                  {savedQuotes.length} {savedQuotes.length === 1 ? 'Design' : 'Designs'}
                </AppText>
              </View>
            )}
          </View>

          {savedQuotes.length > 0 && (
            <SearchBar
              value={search}
              onChangeText={(text) => {
                setSearch(text);
                setPage(1);
              }}
              placeholder="Search by gemstone, metal, style or prompt…"
              onClear={() => {
                setSearch('');
                setPage(1);
              }}
              style={styles.searchBar}
            />
          )}

          {currentQuotes.length > 0 ? (
            <View style={styles.quotesList}>
              {currentQuotes.map((quote) => (
                <SavedQuoteCard
                  key={quote.id}
                  item={quote}
                  onSelect={(selectedQuote) => {
                    if (selectedQuote.fullResult) {
                      setGeneratedDesign(selectedQuote.fullResult);
                      setTimeout(() => {
                        scrollViewRef.current?.scrollTo?.({ y: 560, animated: true });
                      }, 200);
                    }
                  }}
                />
              ))}

              {totalPages > 1 && (
                <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
              )}
            </View>
          ) : (
            <Card style={styles.emptyGalleryCard}>
              <Icon name="diamond-outline" size={32} color={colors.textDim} />
              <AppText variant="subtitle" weight="700" color={colors.textMuted} align="center">
                No Saved Designs Yet
              </AppText>
              <AppText variant="caption" color={colors.textDim} align="center" style={styles.emptyGalleryDesc}>
                Customize your gemstone, metal and style above, then tap &apos;GENERATE JEWELRY DESIGN&apos; to build your bespoke collection.
              </AppText>
            </Card>
          )}
        </View>

        {/* User Alert Popup */}
        <Popup
          visible={popup.visible}
          type={popup.type}
          title={popup.title}
          message={popup.message}
          onClose={() => setPopup((prev) => ({ ...prev, visible: false }))}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  webAwareScroll: {
    flex: 1,
    width: '100%',
    ...(Platform.OS === 'web' ? { height: '100%', minHeight: 0, overflowY: 'auto' } : {}),
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl * 3,
    gap: spacing.lg,
  },
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
  headerTag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(37, 192, 138, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(37, 192, 138, 0.35)',
  },
  mainCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  introText: {
    fontSize: 14,
    lineHeight: 21,
  },
  sectionContainer: {
    gap: spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  sectionHeaderBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionLabel: {
    letterSpacing: 1,
    fontSize: 12,
  },
  promptHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
  },
  enhanceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(37, 192, 138, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(37, 192, 138, 0.35)',
  },
  enhanceBtnActive: {
    backgroundColor: 'rgba(37, 192, 138, 0.22)',
    borderColor: colors.emerald,
  },
  uploadRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  uploadColumn: {
    flex: 1,
    gap: 6,
  },
  uploadTitle: {
    fontSize: 12,
  },
  uploadDropzone: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.borderStrong,
  },
  promptInputWrapper: {
    marginTop: 2,
  },
  promptTextInput: {
    minHeight: 88,
    fontSize: 14,
    lineHeight: 21,
  },
  autoSelectedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(37, 192, 138, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(37, 192, 138, 0.3)',
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    marginTop: spacing.xs,
  },
  mismatchBanner: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    borderRadius: radius.md,
    padding: spacing.sm,
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  mismatchHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mismatchTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  mismatchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingVertical: 2,
    borderTopWidth: 1,
    borderTopColor: 'rgba(245, 158, 11, 0.15)',
    paddingTop: 4,
  },
  mismatchItemText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
  },
  syncItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(37, 192, 138, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(37, 192, 138, 0.35)',
  },
  syncAllBtn: {
    backgroundColor: 'rgba(37, 192, 138, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  detectedSpecsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(37, 192, 138, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(37, 192, 138, 0.25)',
    borderRadius: radius.md,
    padding: spacing.sm,
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  detectedSpecsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
  },
  autoFillBtn: {
    backgroundColor: 'rgba(37, 192, 138, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(37, 192, 138, 0.35)',
  },
  gemWarningBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    borderRadius: radius.md,
    padding: spacing.sm,
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  gemWarningContent: {
    flex: 1,
    gap: 2,
  },
  gemWarningText: {
    fontSize: 12,
    lineHeight: 17,
  },
  specSubCard: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  specCategoryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.xs,
  },
  specCategoryTitle: {
    letterSpacing: 1,
    fontSize: 11,
  },
  fieldLabel: {
    marginTop: spacing.xs,
    marginBottom: 2,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    marginBottom: 2,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginVertical: 4,
  },
  pillInput: {
    marginTop: 4,
  },
  generateButton: {
    backgroundColor: colors.emerald,
    marginTop: spacing.xs,
  },
  generateButtonText: {
    color: colors.black,
    fontWeight: '800',
    letterSpacing: 1,
  },
  progressContainer: {
    marginTop: spacing.xs,
  },
  resultSection: {
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  collapseTogglePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(37, 192, 138, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(37, 192, 138, 0.35)',
  },
  collapsedSummaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 2,
  },
  collapsedSummaryItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
  },
  summaryItemPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  expandedSpecsContainer: {
    gap: spacing.sm,
  },
  styleOptionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: 4,
  },
  styleOptionCard: {
    flexBasis: '48%',
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    gap: 3,
  },
  styleOptionCardActive: {
    borderColor: colors.emerald,
    backgroundColor: 'rgba(37, 192, 138, 0.1)',
  },
  styleOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  styleOptionDesc: {
    fontSize: 11,
    lineHeight: 15,
  },
  historySection: {
    marginTop: spacing.xxl,
    gap: spacing.md,
  },
  historyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
  },
  historyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  historyTitle: {
    fontSize: 18,
  },
  historyCountBadge: {
    backgroundColor: 'rgba(37, 192, 138, 0.12)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(37, 192, 138, 0.35)',
  },
  searchBar: {
    marginBottom: spacing.xs,
  },
  quotesList: {
    gap: spacing.xs,
  },
  emptyGalleryCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyGalleryDesc: {
    fontSize: 12,
    lineHeight: 18,
    maxWidth: 280,
  },
  mandatoryBadge: {
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.xs,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  mandatoryBadgeText: {
    fontSize: 9,
    letterSpacing: 0.5,
  },
});
