import React from 'react';
import { Alert, Image, Pressable, StyleSheet, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors, radius } from '../../theme';
import { AppText, Icon } from '../../components';

export default function CompactUploadCard({
  value,
  onChange,
  title = 'Upload Photo',
  subtitle = 'Tap to select',
  icon = 'cloud-upload-outline',
  height = 152,
  style,
}) {
  const uri = typeof value === 'string' ? value : value?.uri;

  const pickImage = async (useCamera = false) => {
    try {
      const permission = useCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          'Permission Needed',
          `Please grant ${useCamera ? 'camera' : 'photo library'} permission to upload.`
        );
        return;
      }

      const options = {
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.85,
      };

      const result = useCamera
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);

      if (!result.canceled && result.assets?.length) {
        onChange?.(result.assets[0]);
      }
    } catch {
      Alert.alert('Upload Error', 'Could not open image picker.');
    }
  };

  if (uri) {
    return (
      <View style={[styles.previewCard, { height }, style]}>
        <Image source={{ uri }} style={styles.image} resizeMode="cover" />

        {/* Overlay Badges & Actions */}
        <View style={styles.previewTopRow}>
          <View style={styles.successPill}>
            <Icon name="checkmark-circle" size={12} color={colors.emerald} />
            <AppText variant="caption" weight="700" color={colors.emerald} style={styles.pillText}>
              Ready
            </AppText>
          </View>
          <View style={styles.actionButtonsRow}>
            <Pressable
              style={styles.iconCircle}
              onPress={() => pickImage(false)}
              hitSlop={6}
            >
              <Icon name="images-outline" size={14} color={colors.white} />
            </Pressable>
            <Pressable
              style={[styles.iconCircle, styles.deleteCircle]}
              onPress={() => onChange?.(null)}
              hitSlop={6}
            >
              <Icon name="close" size={14} color={colors.white} />
            </Pressable>
          </View>
        </View>

        <View style={styles.previewBottomBar}>
          <AppText variant="caption" weight="600" color={colors.white} numberOfLines={1}>
            {title}
          </AppText>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.card, { height }, style]}>
      {/* Upper clickable area to pick from gallery */}
      <Pressable onPress={() => pickImage(false)} style={styles.bodyPressable}>
        <View style={styles.iconContainer}>
          <Icon name={icon} size={22} color={colors.emerald} />
        </View>
        <AppText variant="caption" weight="700" color={colors.text} align="center" numberOfLines={1}>
          {title}
        </AppText>
        <AppText variant="caption" color={colors.textMuted} align="center" style={styles.subtitleText}>
          {subtitle}
        </AppText>
      </Pressable>

      {/* Compact Mini Actions Row that fits comfortably */}
      <View style={styles.buttonsRow}>
        <Pressable
          style={styles.miniBtn}
          onPress={() => pickImage(false)}
          hitSlop={4}
        >
          <Icon name="images-outline" size={12} color={colors.emerald} />
          <AppText variant="caption" weight="700" color={colors.text} style={styles.btnLabel}>
            Gallery
          </AppText>
        </Pressable>

        <Pressable
          style={styles.miniBtn}
          onPress={() => pickImage(true)}
          hitSlop={4}
        >
          <Icon name="camera-outline" size={12} color={colors.emerald} />
          <AppText variant="caption" weight="700" color={colors.text} style={styles.btnLabel}>
            Camera
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(37, 192, 138, 0.4)',
    paddingHorizontal: 8,
    paddingTop: 10,
    paddingBottom: 8,
    justifyContent: 'space-between',
    alignItems: 'center',
    overflow: 'hidden',
  },
  bodyPressable: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    gap: 3,
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(37, 192, 138, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
    borderWidth: 1,
    borderColor: 'rgba(37, 192, 138, 0.25)',
  },
  subtitleText: {
    fontSize: 10,
  },
  buttonsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 6,
    justifyContent: 'center',
    marginTop: 4,
  },
  miniBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingVertical: 5,
    paddingHorizontal: 4,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnLabel: {
    fontSize: 10,
  },
  previewCard: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: 'rgba(37, 192, 138, 0.5)',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  previewTopRow: {
    position: 'absolute',
    top: 6,
    left: 6,
    right: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  successPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(7, 11, 20, 0.85)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.emerald,
  },
  pillText: {
    fontSize: 9,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 5,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteCircle: {
    backgroundColor: 'rgba(226, 61, 92, 0.75)',
  },
  previewBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(7, 11, 20, 0.75)',
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
});
