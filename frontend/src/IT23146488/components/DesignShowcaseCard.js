import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText, Card, Icon } from '../../components';
import { colors, radius, spacing } from '../../theme';
import { saveImageToPhone, shareDesignImage } from '../utils/mediaUtils';

const SAMPLE_IMAGES = {
  1: require('../../../assets/designs/generated_design_1.png'),
  2: require('../../../assets/designs/generated_design_2.png'),
  3: require('../../../assets/designs/generated_design_3.png'),
};

export default function DesignShowcaseCard({ design }) {
  const [saving, setSaving] = useState(false);
  const [fullViewVisible, setFullViewVisible] = useState(false);

  if (!design) return null;

  // Resolve image source: prioritize direct BFL image URL, then BFL Base64 data, then sample fallback
  let imageSource = null;
  if (design.image_url) {
    imageSource = { uri: design.image_url };
  } else if (design.image_base64) {
    const b64 = design.image_base64.startsWith('data:')
      ? design.image_base64
      : `data:image/jpeg;base64,${design.image_base64}`;
    imageSource = { uri: b64 };
  } else {
    imageSource = SAMPLE_IMAGES[design.design_sample || 1] || SAMPLE_IMAGES[1];
  }

  const handleSaveToPhone = async () => {
    setSaving(true);
    try {
      const result = await saveImageToPhone(imageSource, 'gemvision-custom-jewelry.png');
      Alert.alert(
        result.success ? 'Design Saved' : 'Save Image',
        result.message || 'Image saved.'
      );
    } catch {
      Alert.alert('Notice', 'Could not save image to device.');
    } finally {
      setSaving(false);
    }
  };

  const handleShare = () => {
    shareDesignImage(
      imageSource,
      `Check out my custom jewelry design: "${design.prompt || 'Custom Jewelry'}"`
    );
  };

  const gemText = design.specs?.gemstone
    ? `${design.specs.gemstone} (${design.specs.gemstone_weight_ct || '2.5'}ct)`
    : null;
  const metalText = design.specs?.metal
    ? `${design.specs.metal} (${design.specs.metal_weight_g || '5.0'}g)`
    : null;
  const styleText = design.specs?.aesthetic_style || design.specs?.style || null;

  return (
    <>
      <Card style={styles.card}>
        {/* Generated Design Image View - Tap to open Full Image */}
        <Pressable
          style={styles.imageWrapper}
          onPress={() => setFullViewVisible(true)}
          activeOpacity={0.92}
        >
          <Image source={imageSource} style={styles.image} resizeMode="contain" />

          {/* Top Badges */}
          <View style={styles.badgeRow}>
            <View style={styles.customBadge}>
              <Icon name="sparkles" size={13} color={colors.emerald} />
              <AppText variant="caption" weight="700" color={colors.emerald}>
                Custom Jewelry Design
              </AppText>
            </View>

            <View style={styles.fullViewBadge}>
              <Icon name="expand-outline" size={13} color="#FFFFFF" />
              <AppText variant="caption" weight="700" color="#FFFFFF">
                Full View
              </AppText>
            </View>
          </View>

          {/* Bottom subtle hint overlay */}
          <View style={styles.tapHintOverlay}>
            <Icon name="scan-outline" size={13} color="rgba(255, 255, 255, 0.85)" />
            <AppText variant="caption" weight="600" color="rgba(255, 255, 255, 0.85)">
              Tap to view full uncropped design
            </AppText>
          </View>
        </Pressable>

        {/* Card Body */}
        <View style={styles.body}>
          {/* Quick Spec Pills */}
          {(gemText || metalText || styleText) && (
            <View style={styles.pillRow}>
              {gemText && (
                <View style={styles.specPill}>
                  <Icon name="diamond-outline" size={13} color={colors.sapphire} />
                  <AppText variant="caption" weight="600" color={colors.text}>
                    {gemText}
                  </AppText>
                </View>
              )}
              {metalText && (
                <View style={styles.specPill}>
                  <Icon name="hardware-chip-outline" size={13} color={colors.emerald} />
                  <AppText variant="caption" weight="600" color={colors.text}>
                    {metalText}
                  </AppText>
                </View>
              )}
              {styleText && (
                <View style={styles.specPill}>
                  <Icon name="sparkles-outline" size={13} color={colors.emerald} />
                  <AppText variant="caption" weight="600" color={colors.text}>
                    {styleText}
                  </AppText>
                </View>
              )}
            </View>
          )}

          {/* Clean Action Buttons: View Full Image, Save to Phone, and Share */}
          <View style={styles.actionRow}>
            <Pressable
              onPress={() => setFullViewVisible(true)}
              style={[styles.actionButton, styles.viewFullButton]}
            >
              <Icon name="expand-outline" size={17} color={colors.emerald} />
              <AppText variant="caption" weight="800" color={colors.emerald}>
                View Full
              </AppText>
            </Pressable>

            <Pressable
              onPress={handleSaveToPhone}
              disabled={saving}
              style={[styles.actionButton, styles.saveButton]}
            >
              {saving ? (
                <ActivityIndicator size="small" color={colors.black} />
              ) : (
                <Icon name="download-outline" size={17} color={colors.black} />
              )}
              <AppText variant="caption" weight="800" color={colors.black}>
                {saving ? 'Saving...' : 'Save to Phone'}
              </AppText>
            </Pressable>

            <Pressable onPress={handleShare} style={[styles.actionButton, styles.shareButton]}>
              <Icon name="share-social-outline" size={18} color={colors.text} />
            </Pressable>
          </View>
        </View>
      </Card>

      {/* Full Image Viewer Modal */}
      <Modal
        visible={fullViewVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setFullViewVisible(false)}
        statusBarTranslucent
      >
        <SafeAreaView style={styles.modalRoot} edges={['top', 'bottom', 'left', 'right']}>
          {/* Top Navigation Bar */}
          <View style={styles.modalHeader}>
            <Pressable
              onPress={() => setFullViewVisible(false)}
              style={styles.modalIconButton}
              hitSlop={12}
            >
              <Icon name="close" size={22} color="#FFFFFF" />
            </Pressable>

            <View style={styles.modalTitleBlock}>
              <AppText variant="caption" weight="800" color={colors.emerald} style={styles.modalHeaderTitle}>
                JEWELRY DESIGN
              </AppText>
              {gemText && (
                <AppText variant="caption" color="rgba(255, 255, 255, 0.7)" numberOfLines={1}>
                  {gemText}
                </AppText>
              )}
            </View>

            <View style={styles.modalHeaderRight}>
              <Pressable onPress={handleShare} style={styles.modalIconButton} hitSlop={10}>
                <Icon name="share-social-outline" size={20} color="#FFFFFF" />
              </Pressable>
              <Pressable
                onPress={handleSaveToPhone}
                disabled={saving}
                style={[styles.modalIconButton, styles.modalSaveIcon]}
                hitSlop={10}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#000000" />
                ) : (
                  <Icon name="download-outline" size={20} color="#000000" />
                )}
              </Pressable>
            </View>
          </View>

          {/* Full Uncropped Image View Area */}
          <Pressable
            style={styles.modalImageStage}
            onPress={() => setFullViewVisible(false)}
            activeOpacity={1}
          >
            <Image
              source={imageSource}
              style={styles.modalFullImage}
              resizeMode="contain"
            />
          </Pressable>

          {/* Bottom Action Footer */}
          <View style={styles.modalFooter}>
            <Pressable
              onPress={handleSaveToPhone}
              disabled={saving}
              style={styles.modalFooterSaveButton}
            >
              {saving ? (
                <ActivityIndicator size="small" color={colors.black} />
              ) : (
                <Icon name="download-outline" size={18} color={colors.black} />
              )}
              <AppText variant="body" weight="800" color={colors.black}>
                {saving ? 'Saving...' : 'Save Design to Phone'}
              </AppText>
            </Pressable>

            <Pressable
              onPress={() => setFullViewVisible(false)}
              style={styles.modalClosePill}
            >
              <AppText variant="caption" weight="700" color="rgba(255, 255, 255, 0.8)">
                Close View
              </AppText>
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 0,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    overflow: 'hidden',
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  imageWrapper: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#05080f',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  badgeRow: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  customBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(7, 11, 20, 0.85)',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(37, 192, 138, 0.4)',
  },
  fullViewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(7, 11, 20, 0.85)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  tapHintOverlay: {
    position: 'absolute',
    bottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(7, 11, 20, 0.82)',
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  body: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  specPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: radius.pill,
    gap: 7,
  },
  viewFullButton: {
    flex: 1,
    backgroundColor: 'rgba(37, 192, 138, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(37, 192, 138, 0.4)',
  },
  saveButton: {
    flex: 1.2,
    backgroundColor: colors.emerald,
  },
  shareButton: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },

  /* Full Image Viewer Modal Styles */
  modalRoot: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.96)',
    justifyContent: 'space-between',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  modalTitleBlock: {
    alignItems: 'center',
    gap: 2,
  },
  modalHeaderTitle: {
    letterSpacing: 1.2,
  },
  modalHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  modalIconButton: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSaveIcon: {
    backgroundColor: colors.emerald,
  },
  modalImageStage: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
  },
  modalFullImage: {
    width: '100%',
    height: '100%',
  },
  modalFooter: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  modalFooterSaveButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.emerald,
    paddingVertical: 14,
    borderRadius: radius.pill,
    gap: 8,
  },
  modalClosePill: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
});

