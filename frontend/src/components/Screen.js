import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, gradients, spacing } from '../theme';
import AppText from './AppText';

export default function Screen({
  title,
  subtitle,
  headerRight,
  children,
  scroll = true,
  padded = true,
  style,
  contentContainerStyle,
}) {
  const content = (
    <View style={[padded && styles.padded, contentContainerStyle]}>{children}</View>
  );

  return (
    <View style={[styles.root, style]}>
      <LinearGradient colors={gradients.background} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        {title ? (
          <View style={styles.header}>
            <View style={styles.headerText}>
              <AppText variant="h3">{title}</AppText>
              {subtitle ? (
                <AppText variant="caption" color={colors.textMuted} style={styles.subtitle}>
                  {subtitle}
                </AppText>
              ) : null}
            </View>
            {headerRight}
          </View>
        ) : null}

        {scroll ? (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {content}
          </ScrollView>
        ) : (
          content
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.md,
  },
  headerText: {
    flex: 1,
  },
  subtitle: {
    marginTop: spacing.xxs,
  },
  scrollContent: {
    flexGrow: 1,
  },
  padded: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
});
