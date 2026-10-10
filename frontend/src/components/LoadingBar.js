import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, StyleSheet, View } from 'react-native';
import { colors, radius, spacing } from '../theme';
import AppText from './AppText';
import Icon from './Icon';

export default function LoadingBar({
  progress,
  indeterminate = false,
  color = colors.accent,
  height = 6,
  label,
  showPercentage = false,
  style,
}) {
  const [anim] = useState(() => new Animated.Value(0));
  const loop = useRef(null);

  useEffect(() => {
    if (indeterminate) {
      anim.setValue(0);
      loop.current = Animated.loop(
        Animated.timing(anim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        })
      );
      loop.current.start();
    }
    return () => loop.current?.stop();
  }, [indeterminate, anim]);

  const clamped = Math.max(0, Math.min(1, progress ?? 0));

  const width = indeterminate
    ? anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] })
    : `${clamped * 100}%`;

  const translateX = indeterminate
    ? anim.interpolate({ inputRange: [0, 1], outputRange: [-100, 100] })
    : 0;

  return (
    <View style={[styles.wrapper, style]}>
      {label || showPercentage ? (
        <View style={styles.row}>
          <AppText variant="caption" color={colors.textMuted}>
            {label}
          </AppText>
          {showPercentage && !indeterminate ? (
            <AppText variant="caption" color={colors.textMuted}>
              {Math.round(clamped * 100)}%
            </AppText>
          ) : null}
        </View>
      ) : null}
      <View style={[styles.track, { height, borderRadius: height / 2 }]}>
        <Animated.View
          style={[
            styles.fill,
            { width, height, borderRadius: height / 2, backgroundColor: color },
            indeterminate && { transform: [{ translateX }] },
          ]}
        />
      </View>
    </View>
  );
}

export function Spinner({ label, color = colors.accent, style }) {
  return (
    <View style={[styles.spinner, style]}>
      <ActivityIndicator color={color} size="large" />
      {label ? (
        <AppText variant="caption" color={colors.textMuted}>
          {label}
        </AppText>
      ) : null}
    </View>
  );
}

export function LoadingOverlay({ visible = false, message = 'Loading…' }) {
  if (!visible) return null;
  return (
    <View style={styles.overlay}>
      <View style={styles.overlayCard}>
        <ActivityIndicator color={colors.accent} size="large" />
        <AppText variant="caption" color={colors.textMuted} style={styles.overlayText}>
          {message}
        </AppText>
      </View>
    </View>
  );
}

export function InlineStatus({ type = 'loading', message, style }) {
  if (type === 'loading') return <Spinner label={message} style={style} />;
  const palette = {
    success: { icon: 'checkmark-circle', color: colors.success },
    error: { icon: 'close-circle', color: colors.danger },
    info: { icon: 'information-circle', color: colors.info },
  };
  const conf = palette[type] || palette.info;
  return (
    <View style={[styles.status, style]}>
      <Icon name={conf.icon} size={18} color={conf.color} />
      <AppText variant="caption" color={colors.textMuted}>
        {message}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  track: {
    width: '100%',
    backgroundColor: colors.input,
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  spinner: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
  },
  overlayCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    minWidth: 160,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  overlayText: {
    marginTop: spacing.sm,
  },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
});
