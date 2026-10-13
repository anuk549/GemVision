import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  AppText,
  Button,
  Card,
  Icon,
  Screen,
} from '../../../components';
import { colors, radius, spacing } from '../../../theme';

export default function IdentifyScreen() {
  const router = useRouter();

  return (
    <Screen
      title="Gem Identification"
      subtitle="Mineralogical species & color grading module"
    >
      <Card style={styles.card}>
        <View style={styles.iconContainer}>
          <Icon name="search" size={38} color={colors.sapphire} />
        </View>

        <View style={styles.badge}>
          <Icon name="construct-outline" size={13} color={colors.sapphire} />
          <AppText variant="caption" weight="700" color={colors.sapphire}>
            RESEARCH TEAM MODULE · IN DEVELOPMENT
          </AppText>
        </View>

        <AppText variant="h3" style={styles.title}>
          Gemstone Identification & Classification
        </AppText>

        <AppText variant="body" color={colors.textMuted} style={styles.description}>
          This mineralogical classification component is designed and being actively trained by our
          gemstone identification team member. It classifies gemstone species (Corundum, Beryl, Chrysoberyl)
          and authenticates color varieties. Output measurements and classifications from this module
          feed directly into the Jewelry Design Lab.
        </AppText>

        <View style={styles.divider} />

        <AppText variant="label" color={colors.textMuted} style={styles.featureHeader}>
          UPCOMING CAPABILITIES
        </AppText>

        <View style={styles.featureList}>
          <View style={styles.featureRow}>
            <Icon name="checkmark-circle" size={18} color={colors.sapphire} />
            <AppText variant="body" color={colors.text}>
              Species classification & mineral identification
            </AppText>
          </View>
          <View style={styles.featureRow}>
            <Icon name="checkmark-circle" size={18} color={colors.sapphire} />
            <AppText variant="body" color={colors.text}>
              Color hue grading & shade verification
            </AppText>
          </View>
          <View style={styles.featureRow}>
            <Icon name="checkmark-circle" size={18} color={colors.sapphire} />
            <AppText variant="body" color={colors.text}>
              Direct pipeline bridge to Jewelry Design & Valuation
            </AppText>
          </View>
        </View>

        <View style={styles.actions}>
          <Button
            title="Open Jewelry Design Lab"
            icon="sparkles"
            variant="emerald"
            pill
            onPress={() => router.push('/design')}
          />
          <Button
            title="Back to Dashboard"
            variant="ghost"
            onPress={() => router.push('/')}
            style={styles.backButton}
          />
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    padding: spacing.xl,
    marginTop: spacing.md,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(62, 123, 250, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(62, 123, 250, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(62, 123, 250, 0.15)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    marginBottom: spacing.sm,
  },
  title: {
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  description: {
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  featureHeader: {
    letterSpacing: 1,
    marginBottom: spacing.sm,
    alignSelf: 'flex-start',
  },
  featureList: {
    width: '100%',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceAlt,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  actions: {
    width: '100%',
    gap: spacing.xs,
  },
  backButton: {
    marginTop: spacing.xs,
  },
});
