import React from 'react';
import { Alert, Image, Pressable, StyleSheet, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors, radius, spacing } from '../theme';
import AppText from './AppText';
import Icon from './Icon';
import Button from './Button';

export default function UploadCard({
  value,
  onChange,
  title = 'Add an image',
  subtitle = 'Take a photo or choose from your gallery',
  height = 190,
  style,
}) {
  const uri = typeof value === 'string' ? value : value?.uri;

  const pick = async (useCamera) => {
    try {
      const permission = useCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          'Permission needed',
          `Allow ${useCamera ? 'camera' : 'photo'} access to continue.`
        );
        return;
      }

      const options = { mediaTypes: ['images'], allowsEditing: true, quality: 0.8 };
      const result = useCamera
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);

      if (!result.canceled && result.assets?.length) {
        onChange?.(result.assets[0]);
      }
    } catch {
      Alert.alert('Error', 'Could not open the image picker.');
    }
  };

  if (uri) {
    return (
      <View style={[styles.preview, { height }, style]}>
        <Image source={{ uri }} style={styles.image} resizeMode="cover" />
        <View style={styles.previewActions}>
          <Pressable style={styles.roundButton} onPress={() => pick(false)}>
            <Icon name="images-outline" size={18} color={colors.white} />
          </Pressable>
          <Pressable style={styles.roundButton} onPress={() => onChange?.(null)}>
            <Icon name="close" size={18} color={colors.white} />
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <Pressable onPress={() => pick(false)} style={[styles.dropzone, { height }, style]}>
      <View style={styles.dropIcon}>
        <Icon name="cloud-upload-outline" size={30} color={colors.accent} />
      </View>
      <AppText variant="subtitle">{title}</AppText>
      <AppText variant="caption" color={colors.textMuted} align="center">
        {subtitle}
      </AppText>
      <View style={styles.dropActions}>
        <Button
          title="Gallery"
          size="sm"
          variant="secondary"
          icon="images-outline"
          fullWidth={false}
          onPress={() => pick(false)}
        />
        <Button
          title="Camera"
          size="sm"
          variant="outline"
          icon="camera-outline"
          fullWidth={false}
          onPress={() => pick(true)}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  dropzone: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.borderStrong,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.xs,
  },
  dropIcon: {
    width: 60,
    height: 60,
    borderRadius: radius.pill,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  dropActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  preview: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  previewActions: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  roundButton: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
