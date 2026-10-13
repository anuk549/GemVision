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

export default function DetectScreen() {
  const router = useRouter();

  return (
    <Screen
      title="Defect Scanner"
      subtitle="Automated crack & inclusion detection module"
    >
      <Card style={styles.card}>
        <View style={styles.iconContainer}>
          <Icon name="scan" size={38} color={colors.ruby} />
        </View>

        <View style={styles.badge}>
          <Icon name="construct-outline" size={13} color={colors.ruby} />
          <AppText variant="caption" weight="700" color={colors.ruby}>
            RESEARCH TEAM MODULE · IN DEVELOPMENT
          </AppText>
        </View>

        <AppText variant="h3" style={styles.title}>
          Gemstone Defect Detection
        </AppText>

        <AppText variant="body" color={colors.textMuted} style={styles.description}>
          This computer vision component is designed and being actively trained by our
          defect-detection research team member. It specializes in automated microscopic
          fracture segmentation, internal inclusion mapping, and clarity grading (EC / SI / MI / HI).
        </AppText>

        <View style={styles.divider} />

        <AppText variant="label" color={colors.textMuted} style={styles.featureHeader}>
          UPCOMING CAPABILITIES
        </AppText>

        <View style={styles.featureList}>
          <View style={styles.featureRow}>
            <Icon name="checkmark-circle" size={18} color={colors.ruby} />
            <AppText variant="body" color={colors.text}>
              Surface crack & feather flaw localization
            </AppText>
          </View>
          <View style={styles.featureRow}>
            <Icon name="checkmark-circle" size={18} color={colors.ruby} />
            <AppText variant="body" color={colors.text}>
              Internal inclusion density & coverage analysis
            </AppText>
          </View>
          <View style={styles.featureRow}>
            <Icon name="checkmark-circle" size={18} color={colors.ruby} />
            <AppText variant="body" color={colors.text}>
              Automated Ceylon clarity certificate generation
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
    backgroundColor: 'rgba(226, 61, 92, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(226, 61, 92, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(226, 61, 92, 0.15)',
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
