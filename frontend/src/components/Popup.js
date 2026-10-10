import React from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { colors, radius, shadow, spacing } from '../theme';
import AppText from './AppText';
import Icon from './Icon';
import Button from './Button';

const PRESETS = {
  success: { icon: 'checkmark-circle', color: colors.success, bg: colors.successSoft },
  error: { icon: 'close-circle', color: colors.danger, bg: colors.dangerSoft },
  warning: { icon: 'warning', color: colors.warning, bg: colors.warningSoft },
  info: { icon: 'information-circle', color: colors.info, bg: colors.infoSoft },
};

export default function Popup({
  visible = false,
  type = 'info',
  title,
  message,
  confirmText = 'OK',
  cancelText,
  onConfirm,
  onCancel,
  onClose,
  dismissable = true,
  children,
}) {
  const preset = PRESETS[type] || PRESETS.info;
  const close = () => {
    if (dismissable) onClose?.();
  };

  const handleConfirm = () => {
    onConfirm?.();
    onClose?.();
  };

  const handleCancel = () => {
    onCancel?.();
    onClose?.();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={close}
      statusBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={close}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation?.()}>
          <View style={[styles.iconCircle, { backgroundColor: preset.bg }]}>
            <Icon name={preset.icon} size={32} color={preset.color} />
          </View>

          {title ? (
            <AppText variant="title" align="center" style={styles.title}>
              {title}
            </AppText>
          ) : null}

          {message ? (
            <AppText variant="body" color={colors.textMuted} align="center" style={styles.message}>
              {message}
            </AppText>
          ) : null}

          {children}

          <View style={styles.actions}>
            {cancelText ? (
              <Button
                title={cancelText}
                variant="ghost"
                onPress={handleCancel}
                style={styles.action}
              />
            ) : null}
            <Button
              title={confirmText}
              variant={type === 'error' ? 'danger' : 'primary'}
              onPress={handleConfirm}
              style={styles.action}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.floating,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    marginBottom: spacing.xs,
  },
  message: {
    marginBottom: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
    width: '100%',
  },
  action: {
    flex: 1,
  },
});
