import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, gradients, spacing } from '../theme';
import AppText from './AppText';

export default function Screen({
  title,
  subtitle,
  titleColor,
  headerTop,
  headerRight,
  children,
  scroll = true,
  padded = true,
  style,
  contentContainerStyle,
  scrollRef,
  keyboardOffset = 0,
}) {
  const content = (
    <View style={[padded && styles.padded, contentContainerStyle]}>{children}</View>
  );

  return (
    <View style={[styles.root, style]}>
      <LinearGradient colors={gradients.background} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        {headerTop ? <View style={styles.headerTop}>{headerTop}</View> : null}

        {title ? (
          <View style={styles.header}>
            <View style={styles.headerText}>
              <AppText variant="h3" color={titleColor}>{title}</AppText>
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
          <KeyboardAvoidingView
            style={styles.keyboardAvoid}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={keyboardOffset}
          >
            <ScrollView
              ref={scrollRef}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              automaticallyAdjustKeyboardInsets={true}
            >
              {content}
            </ScrollView>
          </KeyboardAvoidingView>
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
  keyboardAvoid: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  headerTop: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
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
