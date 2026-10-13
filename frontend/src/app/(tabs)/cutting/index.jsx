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

export default function CuttingScreen() {
  const router = useRouter();

  return (
    <Screen
      title="Gem Cutting & Planning"
      subtitle="Lapidary yield optimization & cut planner"
    >
      <Card style={styles.card}>
        <View style={styles.iconContainer}>
          <Icon name="cut" size={38} color={colors.topaz} />
        </View>

        <View style={styles.badge}>
          <Icon name="construct-outline" size={13} color={colors.topaz} />
          <AppText variant="caption" weight="700" color={colors.topaz}>
            RESEARCH TEAM MODULE · IN DEVELOPMENT
          </AppText>
        </View>

        <AppText variant="h3" style={styles.title}>
          Lapidary Cut Planning & Yield Optimization
        </AppText>

        <AppText variant="body" color={colors.textMuted} style={styles.description}>
          This lapidary geometry component is designed and being actively trained by our
          gem-cutting research team member. It evaluates raw gemstone shapes, calculates optimal
          critical angles, and plans facet architecture for maximum yield and brilliance.
          Custom cut shapes planned here will integrate seamlessly with jewelry mounting designs.
        </AppText>

        <View style={styles.divider} />

        <AppText variant="label" color={colors.textMuted} style={styles.featureHeader}>
          UPCOMING CAPABILITIES
        </AppText>

        <View style={styles.featureList}>
          <View style={styles.featureRow}>
            <Icon name="checkmark-circle" size={18} color={colors.topaz} />
            <AppText variant="body" color={colors.text}>
              3D rough gemstone mesh analysis
            </AppText>
          </View>
          <View style={styles.featureRow}>
            <Icon name="checkmark-circle" size={18} color={colors.topaz} />
            <AppText variant="body" color={colors.text}>
              Facet angle simulation & maximum carat yield planning
            </AppText>
          </View>
          <View style={styles.featureRow}>
            <Icon name="checkmark-circle" size={18} color={colors.topaz} />
            <AppText variant="body" color={colors.text}>
              Direct export of calibrated cut models into jewelry settings
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
    backgroundColor: 'rgba(233, 162, 59, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(233, 162, 59, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(233, 162, 59, 0.15)',
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
