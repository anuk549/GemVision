import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { AppText, Card, Icon } from '../../components';
import { colors, gradients, radius, shadow, spacing } from '../../theme';

const STATS = [
  { label: 'Identified', value: '128', icon: 'search-outline', color: colors.sapphire },
  { label: 'Defects', value: '6', icon: 'warning-outline', color: colors.ruby },
  { label: 'Accuracy', value: '94%', icon: 'trending-up-outline', color: colors.emerald },
];

const WORKSPACES = [
  {
    route: '/identify',
    title: 'Gem Identification',
    subtitle: 'Recognise the gemstone type',
    icon: 'search-outline',
    color: colors.sapphire,
  },
  {
    route: '/detect',
    title: 'Defect Detection',
    subtitle: 'Find cracks & inclusions',
    icon: 'diamond-outline',
    color: colors.ruby,
  },
  {
    route: '/cutting',
    title: 'Gem Cutting',
    subtitle: 'Plan a cut & estimate yield',
    icon: 'cut-outline',
    color: colors.topaz,
  },
  {
    route: '/design',
    title: 'Jewelry Design',
    subtitle: 'Create a jewelry piece',
    icon: 'color-palette-outline',
    color: colors.emerald,
  },
];

const ACTIVITY = [
  { icon: 'checkmark-circle', color: colors.success, title: 'Blue Sapphire #A4 graded EC', time: '2m ago' },
  { icon: 'alert-circle', color: colors.warning, title: 'Crack detected in #B3', time: '1h ago' },
  { icon: 'cloud-upload-outline', color: colors.accent, title: '24 records imported', time: 'Yesterday' },
];

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.safe}>
      <LinearGradient colors={gradients.background} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={styles.flex} edges={['top', 'left', 'right']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
        <View style={styles.topbar}>
          <View>
            <AppText variant="caption" color={colors.textMuted}>
              Welcome back
            </AppText>
            <AppText variant="h3">Gemstone Studio</AppText>
          </View>
          <View style={styles.bell}>
            <Icon name="notifications-outline" size={22} color={colors.text} />
            <View style={styles.dot} />
          </View>
        </View>

        <Pressable onPress={() => router.push('/detect')}>
          <LinearGradient
            colors={gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <Icon name="scan-outline" size={140} color="rgba(255,255,255,0.12)" style={styles.heroArt} />
            <View style={styles.heroBadge}>
              <Icon name="sparkles-outline" size={14} color={colors.accent} />
              <AppText variant="caption" weight="600" color={colors.accent}>Ceylon gem AI</AppText>
            </View>
            <AppText variant="h2" color={colors.white} style={styles.heroTitle}>
              Detect defects
            </AppText>
            <AppText variant="body" color="rgba(255,255,255,0.82)" style={styles.heroText}>
              Upload a gemstone photo to detect cracks, inclusions and clarity grade.
            </AppText>
            <Pressable
              style={styles.cta}
              onPress={() => router.push('/detect')}
            >
              <AppText variant="button" color={colors.textOnAccent}>
                Start detection
              </AppText>
              <Icon name="arrow-forward" size={16} color={colors.textOnAccent} />
            </Pressable>
          </LinearGradient>
        </Pressable>

        <View style={styles.stats}>
          {STATS.map((stat) => (
            <Card key={stat.label} style={styles.statCard} padded={false}>
              <View style={[styles.statIcon, { backgroundColor: `${stat.color}22` }]}>
                <Icon name={stat.icon} size={18} color={stat.color} />
              </View>
              <AppText variant="h3">{stat.value}</AppText>
              <AppText variant="caption" color={colors.textMuted}>
                {stat.label}
              </AppText>
            </Card>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <AppText variant="title">Tools</AppText>
          <AppText variant="caption" color={colors.textDim}>
            4 features
          </AppText>
        </View>

        <View style={styles.workspaces}>
          {WORKSPACES.map((item) => (
            <Pressable key={item.route} onPress={() => router.push(item.route)}>
              <Card style={styles.workCard}>
                <View style={[styles.workIcon, { backgroundColor: `${item.color}22` }]}>
                  <Icon name={item.icon} size={24} color={item.color} />
                </View>
                <View style={styles.workText}>
                  <AppText variant="title">{item.title}</AppText>
                  <AppText variant="caption" color={colors.textMuted} style={styles.workSub}>
                    {item.subtitle}
                  </AppText>
                </View>
                <Icon name="chevron-forward" size={20} color={colors.textDim} />
              </Card>
            </Pressable>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <AppText variant="title">Recent activity</AppText>
          <AppText variant="caption" color={colors.accent}>
            See all
          </AppText>
        </View>

        <Card style={styles.activityCard}>
          {ACTIVITY.map((item, index) => (
            <View
              key={item.title}
              style={[styles.activityRow, index === ACTIVITY.length - 1 && styles.activityLast]}
            >
              <View style={[styles.activityIcon, { backgroundColor: `${item.color}22` }]}>
                <Icon name={item.icon} size={18} color={item.color} />
              </View>
              <View style={styles.workText}>
                <AppText variant="body">{item.title}</AppText>
                <AppText variant="caption" color={colors.textDim}>
                  {item.time}
                </AppText>
              </View>
            </View>
          ))}
        </Card>
      </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.xl,
  },
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  bell: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    position: 'absolute',
    top: 11,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.danger,
    borderWidth: 1.5,
    borderColor: colors.background,
  },
  hero: {
    borderRadius: radius.xl,
    padding: spacing.xl,
    overflow: 'hidden',
    ...shadow.card,
  },
  heroArt: {
    position: 'absolute',
    right: -20,
    bottom: -24,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(233, 185, 73, 0.18)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
    marginBottom: spacing.sm,
  },
  heroTitle: {
    marginBottom: spacing.xs,
  },
  heroText: {
    maxWidth: '82%',
    marginBottom: spacing.lg,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    alignSelf: 'flex-start',
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.lg,
    height: 44,
    borderRadius: radius.pill,
  },
  stats: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.xs,
  },
  statIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: -spacing.sm,
  },
  workspaces: {
    gap: spacing.md,
  },
  workCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  workIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  workText: {
    flex: 1,
  },
  workSub: {
    marginTop: spacing.xxs,
  },
  activityCard: {
    paddingVertical: spacing.sm,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  activityLast: {
    borderBottomWidth: 0,
  },
  activityIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
