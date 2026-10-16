import React, { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { AppText, Card, Icon } from '../../components';
import { colors, radius, spacing } from '../../theme';

const CRAFTING_STEPS = [
  { icon: 'diamond-outline', text: 'Analyzing gemstone geometry & facet angles...' },
  { icon: 'hardware-chip-outline', text: 'Designing goldsmith prongs & gallery structure...' },
  { icon: 'sparkles', text: 'Simulating studio lighting & specular reflections...' },
  { icon: 'receipt-outline', text: 'Synthesizing official Ceylon valuation receipt...' },
];

export default function CraftingAnimationCard({ progress = 0.3 }) {
  // Stable Animated values initialized once
  const [pulseAnim] = useState(() => new Animated.Value(1));
  const [glowOpacity] = useState(() => new Animated.Value(0.4));
  const [rotateAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    // Looping breathing/pulse animation
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 900,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(glowOpacity, {
            toValue: 0.85,
            duration: 900,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 1.0,
            duration: 900,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(glowOpacity, {
            toValue: 0.35,
            duration: 900,
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    // Continuous subtle rotation for the halo ring
    const rotateLoop = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 4000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    pulseLoop.start();
    rotateLoop.start();

    return () => {
      pulseLoop.stop();
      rotateLoop.stop();
    };
  }, [pulseAnim, glowOpacity, rotateAnim]);

  // Derived step from progress (no unnecessary effect or setState)
  const currentStepIndex =
    progress < 0.35 ? 0 : progress < 0.65 ? 1 : progress < 0.9 ? 2 : 3;

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const step = CRAFTING_STEPS[currentStepIndex] || CRAFTING_STEPS[0];
  const percent = Math.min(100, Math.max(5, Math.round(progress * 100)));

  return (
    <Card style={styles.card}>
      <View style={styles.container}>
        {/* Animated Visual Core */}
        <View style={styles.animationCore}>
          {/* Outer glowing pulsing ring */}
          <Animated.View
            style={[
              styles.pulseRing,
              {
                transform: [{ scale: pulseAnim }],
                opacity: glowOpacity,
              },
            ]}
          />

          {/* Rotating dashed orbital accent */}
          <Animated.View
            style={[
              styles.orbitalRing,
              {
                transform: [{ rotate: spin }],
              },
            ]}
          >
            <View style={styles.orbitalDot} />
            <View style={styles.orbitalDotOpposite} />
          </Animated.View>

          {/* Central Gemstone Emblem */}
          <View style={styles.centerEmblem}>
            <Icon name="diamond" size={28} color={colors.emerald} />
          </View>
        </View>

        {/* Title & Status Message */}
        <View style={styles.textContainer}>
          <View style={styles.headerRow}>
            <Icon name="sparkles" size={15} color={colors.emerald} />
            <AppText variant="subtitle" weight="800" color={colors.text}>
              Crafting Custom Jewelry Design
            </AppText>
          </View>

          <View style={styles.stepRow}>
            <Icon name={step.icon} size={15} color={colors.emerald} />
            <AppText variant="caption" weight="600" color={colors.textMuted} style={styles.stepText}>
              {step.text}
            </AppText>
          </View>
        </View>

        {/* Emerald Progress Bar & Percentage */}
        <View style={styles.progressBarWrapper}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${percent}%` }]} />
          </View>
          <View style={styles.progressMeta}>
            <AppText variant="caption" weight="700" color={colors.emerald}>
              {percent}% COMPLETED
            </AppText>
            <AppText variant="caption" color={colors.textDim}>
              AI Diffusion & Valuation
            </AppText>
          </View>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(12, 19, 32, 0.95)',
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: 'rgba(37, 192, 138, 0.35)',
    padding: spacing.lg,
    marginVertical: spacing.md,
  },
  container: {
    alignItems: 'center',
    gap: spacing.md,
  },
  animationCore: {
    width: 90,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: spacing.xs,
  },
  pulseRing: {
    position: 'absolute',
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: 'rgba(37, 192, 138, 0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(37, 192, 138, 0.5)',
  },
  orbitalRing: {
    position: 'absolute',
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 1,
    borderColor: 'rgba(37, 192, 138, 0.25)',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 1,
  },
  orbitalDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.emerald,
  },
  orbitalDotOpposite: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(37, 192, 138, 0.5)',
  },
  centerEmblem: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.emerald,
    elevation: 4,
    shadowColor: colors.emerald,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  textContainer: {
    alignItems: 'center',
    gap: 6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm,
  },
  stepText: {
    fontSize: 12,
    lineHeight: 16,
  },
  progressBarWrapper: {
    width: '100%',
    gap: 6,
  },
  progressTrack: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.emerald,
    borderRadius: 3,
  },
  progressMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
});
