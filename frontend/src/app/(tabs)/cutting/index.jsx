import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import {
  AppText,
  Button,
  Card,
  ErrorMessage,
  Gem3DView,
  Icon,
  LoadingBar,
  Popup,
  Screen,
  UploadCard,
} from '../../../components';
import { recommendPattern, getPatternRenderUrl } from '../../../services/gemService';
import { colors, radius, spacing } from '../../../theme';

export default function CuttingScreen() {
  const [recImage, setRecImage] = useState(null);
  const [recLoading, setRecLoading] = useState(false);
  const [recError, setRecError] = useState(null);
  const [recResult, setRecResult] = useState(null);
  const [showRecViz, setShowRecViz] = useState(false);
  const [popup, setPopup] = useState({ visible: false, type: 'info', title: '', message: '' });

  const runRecommendation = async () => {
    if (!recImage) {
      setPopup({
        visible: true,
        type: 'warning',
        title: 'No image',
        message: 'Add a gemstone photo before requesting a recommendation.',
      });
      return;
    }
    setRecLoading(true);
    setRecError(null);
    setRecResult(null);
    setShowRecViz(false);
    try {
      const data = await recommendPattern(recImage);
      setRecResult(data);
      setShowRecViz(true);
    } catch (err) {
      setRecError(err);
      setPopup({
        visible: true,
        type: 'error',
        title: 'Recommendation failed',
        message: err?.message || 'Could not reach the backend. Is it running?',
      });
    } finally {
      setRecLoading(false);
    }
  };

  return (
    <Screen title="Gem Cutting" subtitle="Recommend a cutting pattern from a gem photo.">
      <UploadCard
        value={recImage}
        onChange={(asset) => {
          setRecImage(asset);
          setRecResult(null);
          setRecError(null);
          setShowRecViz(false);
        }}
        title="Add a gemstone photo"
      />

      <Button title="Generate" icon="sparkles-outline" loading={recLoading} onPress={runRecommendation} />

      {recLoading ? <LoadingBar indeterminate label="Analysing gemstone…" /> : null}
      <ErrorMessage message={recError?.message} />

      {recResult ? (
        <Pressable onPress={() => setShowRecViz((prev) => !prev)}>
          <Card style={styles.patternCard}>
            <View style={styles.patternHeader}>
              <View style={styles.patternIcon}>
                <Icon name="diamond-outline" size={20} color={colors.accent} />
              </View>
              <View style={styles.patternText}>
                <AppText variant="title">{recResult.pattern.name}</AppText>
                <AppText variant="caption" color={colors.textMuted}>
                  by {recResult.pattern.designer}
                </AppText>
              </View>
              <Icon name="chevron-forward" size={20} color={colors.textDim} />
            </View>
            <View style={styles.patternMeta}>
              <AppText variant="caption" color={colors.textMuted}>
                Gem type: {recResult.gemType}
              </AppText>
              <AppText variant="caption" color={colors.textMuted}>
                State: {recResult.state}
              </AppText>
              <AppText variant="caption" color={colors.textMuted}>
                Confidence: {recResult.confidence ?? 'N/A'}%
              </AppText>
              <AppText variant="caption" color={colors.textMuted}>
                Facets: {recResult.pattern.facets} | Index: {recResult.pattern.index}
              </AppText>
            </View>
            <AppText variant="caption" color={colors.accent} style={styles.tapHint}>
              Tap to {showRecViz ? 'hide' : 'view'} the 2D/3D cut-gem visualization
            </AppText>
          </Card>
        </Pressable>
      ) : null}

      {recResult && showRecViz ? (
        <Card style={styles.visualizationCard}>
          <AppText variant="title" style={styles.visualizationTitle}>
            {recResult.pattern.name}
          </AppText>
          <Image
            source={{ uri: getPatternRenderUrl(recResult.pattern.id) }}
            style={styles.visualization}
            resizeMode="contain"
          />
          <View style={styles.webviewWrap}>
            <Gem3DView style={styles.webview} />
          </View>
          <AppText variant="caption" color={colors.textMuted} align="center">
            2D and 3D cut-gem visualization generated from the recommended pattern.
          </AppText>
        </Card>
      ) : null}

      <Popup
        visible={popup.visible}
        type={popup.type}
        title={popup.title}
        message={popup.message}
        onClose={() => setPopup((prev) => ({ ...prev, visible: false }))}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  patternCard: {
    gap: spacing.sm,
  },
  patternHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  patternIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  patternText: {
    flex: 1,
  },
  patternMeta: {
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  tapHint: {
    marginTop: spacing.sm,
  },
  visualizationCard: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  visualizationTitle: {
    marginBottom: spacing.sm,
  },
  visualization: {
    width: '100%',
    height: 260,
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
  },
  webviewWrap: {
    width: '100%',
    height: 260,
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
