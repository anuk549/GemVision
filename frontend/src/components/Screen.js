import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../theme';
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
    <SafeAreaView style={[styles.safe, style]} edges={['top', 'left', 'right']}>
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
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
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
