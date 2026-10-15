import React, { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { colors, radius, spacing } from '../../theme';
import AppText from '../AppText';
import Card from '../Card';
import Icon from '../Icon';
import LoadingBar from '../LoadingBar';
import Popup from '../Popup';
import { getJewelryRecommendation } from '../../services';

/**
 * Clean fixed outline illustrations for the 3 jewelry types.
 * Minimalist, elegant geometric line-art matching GemVision dark theme.
 */
function JewelryOutline({ type, color = colors.accent, size = 120 }) {
  const norm = (type || '').toLowerCase();

  if (norm === 'ring') {
    return (
      <View style={[styles.outlineCanvas, { width: size, height: size }]}>
        {/* Solitaire Gem Top */}
        <View style={[styles.ringGemWrapper, { top: size * 0.12 }]}>
          <View style={[styles.ringGemDiamond, { borderColor: color, backgroundColor: `${color}18` }]} />
          <View style={[styles.ringProngLeft, { backgroundColor: color }]} />
          <View style={[styles.ringProngRight, { backgroundColor: color }]} />
        </View>
        {/* Ring Band */}
        <View
          style={[
            styles.ringBand,
            {
              width: size * 0.62,
              height: size * 0.62,
              borderRadius: (size * 0.62) / 2,
              borderColor: color,
              top: size * 0.28,
            },
          ]}
        />
        {/* Inner Band */}
        <View
          style={[
            styles.ringBandInner,
            {
              width: size * 0.44,
              height: size * 0.44,
              borderRadius: (size * 0.44) / 2,
              borderColor: `${color}55`,
              top: size * 0.37,
            },
          ]}
        />
      </View>
    );
  }

  if (norm === 'earring') {
    return (
      <View style={[styles.outlineCanvas, { width: size, height: size }]}>
        {/* Pair of Earrings: Left & Right */}
        <View style={styles.earringRow}>
          {/* Left Earring */}
          <View style={styles.singleEarring}>
            <View style={[styles.earringPost, { backgroundColor: color }]} />
            <View style={[styles.earringChain, { borderColor: color }]} />
            <View style={[styles.earringDrop, { borderColor: color, backgroundColor: `${color}18` }]} />
          </View>
          {/* Right Earring */}
          <View style={styles.singleEarring}>
            <View style={[styles.earringPost, { backgroundColor: color }]} />
            <View style={[styles.earringChain, { borderColor: color }]} />
            <View style={[styles.earringDrop, { borderColor: color, backgroundColor: `${color}18` }]} />
          </View>
        </View>
      </View>
    );
  }

  // Default: Necklace
  return (
    <View style={[styles.outlineCanvas, { width: size, height: size }]}>
      {/* Necklace Chain Arch */}
      <View
        style={[
          styles.necklaceChain,
          {
            width: size * 0.72,
            height: size * 0.62,
            borderColor: color,
            top: size * 0.12,
          },
        ]}
      />
      {/* Pendant Bail & Stone */}
      <View style={[styles.pendantWrap, { top: size * 0.52 }]}>
        <View style={[styles.pendantBail, { borderColor: color }]} />
        <View style={[styles.pendantGem, { borderColor: color, backgroundColor: `${color}18` }]} />
      </View>
    </View>
  );
}

export default function JewelryRecommendationView({
  stoneData,
  onBack,
}) {
  const [loading, setLoading] = useState(true);
  const [recommendation, setRecommendation] = useState(null);
  const [popup, setPopup] = useState({ visible: false, type: 'info', title: '', message: '' });

  useEffect(() => {
    let active = true;

    async function fetchRecommendation() {
      if (!stoneData) return;
      setLoading(true);
      try {
        const result = await getJewelryRecommendation(stoneData);
        if (active) {
          setRecommendation(result);
        }
      } catch (err) {
        if (active) {
          setPopup({
            visible: true,
            type: 'error',
            title: 'Recommendation Failed',
            message: err.message || 'Could not fetch jewelry recommendation from backend.',
          });
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchRecommendation();
    return () => {
      active = false;
    };
  }, [stoneData]);

  const recommendedType = recommendation?.recommended || 'Ring';
  const scores = recommendation?.scores || {};
  const recommendedScore = scores[recommendedType.toLowerCase()] ?? 0;

  // Filter out the other two categories
  const otherTypes = ['Ring', 'Earring', 'Necklace'].filter(
    (t) => t.toLowerCase() !== recommendedType.toLowerCase()
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Back Button */}
      <Pressable onPress={onBack} style={styles.backButton} hitSlop={8}>
        <Icon name="arrow-back" size={20} color={colors.accent} />
        <AppText variant="caption" weight="700" color={colors.accent}>
          Back to Price Estimation
        </AppText>
      </Pressable>

      {loading ? (
        <View style={styles.loadingWrap}>
          <LoadingBar indeterminate label="Calculating jewelry suitability…" />
        </View>
      ) : recommendation ? (
        <View style={styles.resultsWrapper}>
          {/* 1. Recommended Choice Hero Card */}
          <Card style={styles.recommendedCard}>
            <View style={styles.recommendedBadge}>
              <Icon name="checkmark-circle" size={14} color={colors.accent} />
              <AppText variant="caption" color={colors.accent} weight="700">
                RECOMMENDED CHOICE
              </AppText>
            </View>

            {/* Fixed Outline Design */}
            <View style={styles.illustrationWrap}>
              <JewelryOutline type={recommendedType} color={colors.accent} size={130} />
            </View>

            {/* Type Name & Score */}
            <View style={styles.titleScoreRow}>
              <AppText variant="hero" weight="700" color={colors.text} style={styles.recommendedTitle}>
                {recommendedType}
              </AppText>
              <View style={styles.scorePill}>
                <AppText variant="title" weight="700" color={colors.accent}>
                  {recommendedScore.toFixed(1)}%
                </AppText>
                <AppText variant="caption" color={colors.textDim} style={styles.scoreSub}>
                  Suitability
                </AppText>
              </View>
            </View>
          </Card>

          {/* 2. Other Two Categories */}
          <View style={styles.otherSection}>
            <AppText variant="label" color={colors.textMuted} style={styles.sectionLabel}>
              OTHER JEWELRY TYPES
            </AppText>

            <View style={styles.otherCardsWrap}>
              {otherTypes.map((type) => {
                const typeScore = scores[type.toLowerCase()] ?? 0;
                return (
                  <Card key={type} style={styles.otherCard}>
                    <View style={styles.otherRow}>
                      <View style={styles.otherMiniOutline}>
                        <JewelryOutline type={type} color={colors.textMuted} size={44} />
                      </View>
                      <View style={styles.otherDetails}>
                        <View style={styles.otherNameRow}>
                          <AppText variant="subtitle" weight="700" color={colors.text}>
                            {type}
                          </AppText>
                          <AppText variant="subtitle" weight="700" color={colors.textMuted}>
                            {typeScore.toFixed(1)}%
                          </AppText>
                        </View>
                        {/* Progress Bar */}
                        <View style={styles.track}>
                          <View
                            style={[
                              styles.fill,
                              {
                                width: `${Math.max(2, Math.min(100, typeScore))}%`,
                                backgroundColor: colors.borderStrong,
                              },
                            ]}
                          />
                        </View>
                      </View>
                    </View>
                  </Card>
                );
              })}
            </View>
          </View>

          {/* 3. Small Explanation Box */}
          {recommendation.explanation ? (
            <View style={styles.explanationBox}>
              <View style={styles.explanationHeader}>
                <Icon name="information-circle-outline" size={16} color={colors.accent} />
                <AppText variant="caption" weight="700" color={colors.accent}>
                  WHY THIS WAS RECOMMENDED
                </AppText>
              </View>
              <AppText variant="body" color={colors.text} style={styles.explanationText}>
                {recommendation.explanation}
              </AppText>
            </View>
          ) : null}
        </View>
      ) : null}

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
  loadingWrap: {
    marginTop: spacing.xl,
  },
  resultsWrapper: {
    gap: spacing.md,
  },
  recommendedCard: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    borderColor: `${colors.accent}55`,
    borderWidth: 1.5,
  },
  recommendedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.accentSoft,
    marginBottom: spacing.md,
  },
  illustrationWrap: {
    marginVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  recommendedTitle: {
    fontSize: 26,
  },
  scorePill: {
    alignItems: 'flex-end',
  },
  scoreSub: {
    fontSize: 10,
    marginTop: -2,
  },
  otherSection: {
    gap: spacing.xs,
  },
  sectionLabel: {
    marginBottom: spacing.xs,
    letterSpacing: 0.5,
  },
  otherCardsWrap: {
    gap: spacing.sm,
  },
  otherCard: {
    padding: spacing.md,
  },
  otherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  otherMiniOutline: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  otherDetails: {
    flex: 1,
    gap: spacing.xs,
  },
  otherNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  track: {
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceRaised,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.pill,
  },
  explanationBox: {
    backgroundColor: colors.surfaceAlt,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  explanationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  explanationText: {
    fontSize: 13,
    lineHeight: 20,
  },

  // -------------------------------------------------------------
  // Outline Design Styles (Ring, Earring, Necklace)
  // -------------------------------------------------------------
  outlineCanvas: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  // Ring:
  ringBand: {
    position: 'absolute',
    borderWidth: 3,
  },
  ringBandInner: {
    position: 'absolute',
    borderWidth: 1.5,
  },
  ringGemWrapper: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  ringGemDiamond: {
    width: 26,
    height: 26,
    borderWidth: 2,
    transform: [{ rotate: '45deg' }],
  },
  ringProngLeft: {
    position: 'absolute',
    left: -4,
    bottom: -4,
    width: 3,
    height: 8,
    borderRadius: 2,
  },
  ringProngRight: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    width: 3,
    height: 8,
    borderRadius: 2,
  },
  // Earring:
  earringRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 32,
  },
  singleEarring: {
    alignItems: 'center',
  },
  earringPost: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginBottom: 4,
  },
  earringChain: {
    width: 0,
    height: 22,
    borderLeftWidth: 2,
    marginBottom: 4,
  },
  earringDrop: {
    width: 22,
    height: 32,
    borderRadius: 11,
    borderWidth: 2,
  },
  // Necklace:
  necklaceChain: {
    position: 'absolute',
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    backgroundColor: 'transparent',
  },
  pendantWrap: {
    position: 'absolute',
    alignItems: 'center',
  },
  pendantBail: {
    width: 8,
    height: 10,
    borderWidth: 2,
    borderRadius: 4,
    marginBottom: 2,
  },
  pendantGem: {
    width: 28,
    height: 36,
    borderRadius: 14,
    borderWidth: 2,
  },
});
