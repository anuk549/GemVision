import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { AppText, Card, Icon } from '../../components';
import { colors, radius, spacing } from '../../theme';

const SAMPLE_IMAGES = {
  1: require('../../../assets/designs/generated_design_1.png'),
  2: require('../../../assets/designs/generated_design_2.png'),
  3: require('../../../assets/designs/generated_design_3.png'),
};

export default function DesignShowcaseCard({ design, onInspectBOM }) {
  if (!design) return null;

  const imageSource = design.image_url
    ? { uri: design.image_url }
    : SAMPLE_IMAGES[design.design_sample || 1] || SAMPLE_IMAGES[1];

  const audit = design.audited_attributes || {};

  return (
    <Card style={styles.card}>
      <View style={styles.imageContainer}>
        <Image source={imageSource} style={styles.image} resizeMode="cover" />
        <View style={styles.badgeRow}>
          <View style={styles.styleBadge}>
            <Icon name="sparkles" size={13} color={colors.emerald} />
            <AppText variant="caption" weight="600" color={colors.emerald}>
              {design.aesthetic_style || 'Modern'}
            </AppText>
          </View>
          <View style={styles.modelBadge}>
            <AppText variant="caption" weight="600" color={colors.text}>
              FLUX.2 Generative
            </AppText>
          </View>
        </View>
      </View>

      <View style={styles.body}>
        <AppText variant="label" color={colors.emerald} style={styles.promptLabel}>
          SYNTHESIZED PROMPT
        </AppText>
        <AppText variant="body" color={colors.text} style={styles.promptText}>
          &ldquo;{design.prompt}&rdquo;
        </AppText>

        <View style={styles.divider} />

        <AppText variant="label" color={colors.textMuted} style={styles.auditLabel}>
          Physical Audit (Gemini Vision)
        </AppText>

        <View style={styles.auditGrid}>
          <View style={styles.auditTile}>
            <Icon name="cog-outline" size={16} color={colors.accent} />
            <View>
              <AppText variant="caption" color={colors.textDim}>Setting</AppText>
              <AppText variant="caption" weight="600" color={colors.text}>
                {audit.setting_type || 'Prong'}
              </AppText>
            </View>
          </View>

          <View style={styles.auditTile}>
            <Icon name="diamond-outline" size={16} color={colors.sapphire} />
            <View>
              <AppText variant="caption" color={colors.textDim}>Accents</AppText>
              <AppText variant="caption" weight="600" color={colors.text}>
                {audit.number_of_accent_stones || 0} Melee
              </AppText>
            </View>
          </View>

          <View style={styles.auditTile}>
            <Icon name="color-palette-outline" size={16} color={colors.topaz} />
            <View>
              <AppText variant="caption" color={colors.textDim}>Tone</AppText>
              <AppText variant="caption" weight="600" color={colors.text}>
                {audit.metal_tone || 'Yellow'}
              </AppText>
            </View>
          </View>

          <View style={styles.auditTile}>
            <Icon name="shield-checkmark-outline" size={16} color={colors.emerald} />
            <View>
              <AppText variant="caption" color={colors.textDim}>Complexity</AppText>
              <AppText variant="caption" weight="600" color={colors.text}>
                {audit.design_complexity || 'Simple'}
              </AppText>
            </View>
          </View>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 0,
    overflow: 'hidden',
    marginTop: spacing.md,
  },
  imageContainer: {
    width: '100%',
    height: 280,
    backgroundColor: colors.input,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  badgeRow: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  styleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(7, 11, 20, 0.85)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.emerald,
  },
  modelBadge: {
    backgroundColor: 'rgba(7, 11, 20, 0.85)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  body: {
    padding: spacing.lg,
  },
  promptLabel: {
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  promptText: {
    lineHeight: 22,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  auditLabel: {
    marginBottom: spacing.sm,
  },
  auditGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  auditTile: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceAlt,
    padding: spacing.sm,
    borderRadius: radius.sm,
  },
});
