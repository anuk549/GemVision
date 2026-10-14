import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import AppText from '../AppText';
import Button from '../Button';
import Card from '../Card';
import Icon from '../Icon';
import KeyValue from '../KeyValue';
import { colors, radius, spacing } from '../../theme';

export default function IdentificationResultCard({ result, onProceedToPricing }) {
  if (!result) return null;

  const isSapphire = result.canProceedToPricing;
  const matchColor = result.confidence >= 90 ? colors.success : colors.warning;
  const imageUri = result.localUri || result.sourceUri;

  return (
    <Card>
      <View style={styles.resultHeader}>
        <View style={styles.resultIcon}>
          <Icon name="sparkles" size={18} color={colors.accent} />
        </View>
        <View style={styles.headerTitles}>
          <AppText variant="title">Identification result</AppText>
          <AppText variant="caption" color={colors.textDim}>
            Native Keras model inference
          </AppText>
        </View>
      </View>

      {/* Main Preview Image */}
      {imageUri ? (
        <View style={styles.imagePreviewWrap}>
          <Image source={{ uri: imageUri }} style={styles.imagePreview} resizeMode="cover" />
        </View>
      ) : null}

      {/* Primary Model Prediction String */}
      <View style={[styles.predictionBox, { borderColor: `${matchColor}40` }]}>
        <Icon
          name={isSapphire ? 'checkmark-circle' : 'alert-circle'}
          size={18}
          color={matchColor}
        />
        <AppText variant="subtitle" weight="700" color={colors.text} style={styles.predictionText}>
          {result.formattedPrediction || `Prediction: ${result.rawClass} (${result.confidence}% confidence)`}
        </AppText>
      </View>

      <KeyValue
        items={[
          { label: 'Identified Gemstone', value: result.gem, icon: 'diamond-outline', color: colors.accent },
          { label: 'Confidence Score', value: `${result.confidence}%`, icon: 'shield-checkmark-outline', color: matchColor },
        ]}
      />

      {/* 4-Class Probabilities Breakdown */}
      {result.probabilities && result.probabilities.length > 0 ? (
        <View style={styles.probSection}>
          <AppText variant="caption" color={colors.textMuted} weight="700" style={styles.probTitle}>
            MODEL CLASS PROBABILITIES
          </AppText>
          {result.probabilities.map((item) => {
            const isTop = item.class === result.rawClass;
            const barColor = isTop ? colors.accent : colors.borderStrong;
            return (
              <View key={item.class} style={styles.probRow}>
                <AppText variant="caption" color={isTop ? colors.text : colors.textMuted} style={styles.probLabel}>
                  {item.class}
                </AppText>
                <View style={styles.track}>
                  <View
                    style={[
                      styles.fill,
                      {
                        width: `${Math.max(2, Math.min(100, item.confidence))}%`,
                        backgroundColor: barColor,
                      },
                    ]}
                  />
                </View>
                <AppText variant="caption" color={isTop ? colors.accent : colors.textDim} weight={isTop ? '700' : '400'}>
                  {item.confidence.toFixed(1)}%
                </AppText>
              </View>
            );
          })}
        </View>
      ) : null}

      {isSapphire ? (
        <View style={styles.actionContainer}>
          <Button
            title="Proceed to Price Prediction"
            icon="trending-up-outline"
            onPress={onProceedToPricing}
          />
        </View>
      ) : (
        <View style={styles.warningNotice}>
          <Icon name="information-circle-outline" size={16} color={colors.warning} />
          <AppText variant="caption" color={colors.textMuted} style={styles.noticeText}>
            Price prediction is exclusively calibrated for Blue and Yellow Sapphires.
          </AppText>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  headerTitles: {
    flex: 1,
  },
  resultIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePreviewWrap: {
    height: 160,
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: spacing.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  predictionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  predictionText: {
    flex: 1,
    fontSize: 14,
  },
  probSection: {
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.xs,
  },
  probTitle: {
    marginBottom: spacing.xs,
    letterSpacing: 0.5,
  },
  probRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  probLabel: {
    width: 110,
    fontSize: 12,
  },
  track: {
    flex: 1,
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceRaised,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.pill,
  },
  actionContainer: {
    marginTop: spacing.md,
  },
  warningNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.warningSoft,
    padding: spacing.sm,
    borderRadius: radius.md,
    marginTop: spacing.md,
  },
  noticeText: {
    flex: 1,
  },
});
