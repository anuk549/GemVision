import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { colors, radius, spacing } from '../theme';
import { GRADE_COLORS } from '../constants/detection';
import AppText from './AppText';
import Badge from './Badge';
import Card from './Card';
import Icon from './Icon';
import KeyValue from './KeyValue';

const round1 = (value) => (typeof value === 'number' ? Math.round(value * 10) / 10 : value);

export default function DetectionResult({
  result,
  title = 'Detection result',
  showImages = true,
  showPredictions = true,
  style,
}) {
  if (!result) return null;

  const gradeColor = GRADE_COLORS[result.grade] || colors.primary;
  const isClean = result.predictedClass === 'normal' || result.grade === 'EC';
  const coverage = result.capabilities || {};
  const missing = coverage.missing_defects || [];

  return (
    <Card style={style}>
      <View style={styles.header}>
        <View style={[styles.headerIcon, { backgroundColor: `${gradeColor}22` }]}>
          <Icon
            name={isClean ? 'checkmark-circle' : 'warning'}
            size={18}
            color={gradeColor}
          />
        </View>
        <View style={styles.headerText}>
          <AppText variant="title">{title}</AppText>
          <AppText variant="caption" color={colors.textMuted}>
            {result.predictedClass} · {round1(result.confidence)}%
          </AppText>
        </View>
        <Badge label={result.grade || 'N/A'} color={gradeColor} />
      </View>

      <KeyValue
        items={[
          {
            label: 'Defect type',
            value: result.defect?.label || (result.predictedClass === 'normal' ? 'None (eye clean)' : result.predictedClass),
            icon: 'alert-circle-outline',
            color: colors.danger,
          },
          {
            label: 'Defect group',
            value: result.defect?.group || '—',
            icon: 'layers-outline',
            color: colors.textMuted,
          },
          {
            label: 'Clarity grade',
            value: result.grade || 'Unavailable',
            icon: 'ribbon-outline',
            color: gradeColor,
          },
          {
            label: 'Confidence',
            value: `${round1(result.confidence)}%`,
            icon: 'shield-checkmark-outline',
            color: colors.success,
          },
          {
            label: 'Gem region',
            value: `${result.gemCoverage}%`,
            icon: 'scan-outline',
            color: colors.accent,
          },
        ]}
      />

      {result.gradeDescription ? (
        <View style={styles.note}>
          <Icon name="information-circle-outline" size={14} color={colors.textDim} />
          <AppText variant="caption" color={colors.textMuted} style={styles.noteText}>
            {result.gradeDescription}
            {result.provisional ? ' (provisional grade)' : ''}
          </AppText>
        </View>
      ) : null}

      {showImages && (result.preview || result.heatmap) ? (
        <View style={styles.images}>
          {result.preview ? (
            <View style={styles.imageWrap}>
              <Image source={{ uri: result.preview }} style={styles.image} resizeMode="cover" />
              <AppText variant="caption" color={colors.textDim} align="center">
                Prepared
              </AppText>
            </View>
          ) : null}
          {result.heatmap ? (
            <View style={styles.imageWrap}>
              <Image source={{ uri: result.heatmap }} style={styles.image} resizeMode="cover" />
              <AppText variant="caption" color={colors.textDim} align="center">
                Grad-CAM
              </AppText>
            </View>
          ) : null}
        </View>
      ) : null}

      {showPredictions && result.predictions.length ? (
        <View style={styles.predictions}>
          <AppText variant="label" color={colors.textMuted}>
            Class probabilities
          </AppText>
          {result.predictions.map((item) => (
            <View key={item.class} style={styles.predRow}>
              <AppText variant="caption" color={colors.text} style={styles.predLabel}>
                {item.class}
              </AppText>
              <View style={styles.track}>
                <View
                  style={[
                    styles.fill,
                    {
                      width: `${Math.max(2, Math.min(100, item.confidence))}%`,
                      backgroundColor: item.class === result.predictedClass ? colors.accent : colors.borderStrong,
                    },
                  ]}
                />
              </View>
              <AppText variant="caption" color={colors.textMuted}>
                {round1(item.confidence)}%
              </AppText>
            </View>
          ))}
        </View>
      ) : null}

      {!coverage.requirement_complete && missing.length ? (
        <View style={styles.warning}>
          <Icon name="warning" size={14} color={colors.warning} />
          <AppText variant="caption" color={colors.warning} style={styles.noteText}>
            The loaded model cannot detect: {missing.join(', ')}.
          </AppText>
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  headerIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  note: {
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'flex-start',
    marginTop: spacing.sm,
  },
  warning: {
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'flex-start',
    marginTop: spacing.sm,
    backgroundColor: colors.warningSoft || colors.accentSoft,
    borderRadius: radius.sm,
    padding: spacing.sm,
  },
  noteText: {
    flex: 1,
  },
  images: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  imageWrap: {
    flex: 1,
    gap: spacing.xs,
  },
  image: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: radius.md,
    backgroundColor: colors.background,
  },
  predictions: {
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  predRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  predLabel: {
    width: 96,
  },
  track: {
    flex: 1,
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.divider,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.pill,
  },
});
