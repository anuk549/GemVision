import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import {
  AppText,
  Button,
  Card,
  ErrorMessage,
  Icon,
  LoadingBar,
  Popup,
  Screen,
  UploadCard,
  Gem3DView,
} from '../../components';
import { recommendPattern, getPatternRenderUrl } from '../../services/gemService';
import { colors, radius, spacing } from '../../theme';

export default function GemRecommendationScreen() {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [showVisualization, setShowVisualization] = useState(false);
  const [popup, setPopup] = useState({ visible: false, type: 'info', title: '', message: '' });

  const analyze = async () => {
    if (!image) {
      setPopup({
        visible: true,
        type: 'warning',
        title: 'No image',
        message: 'Add a gemstone photo before requesting a recommendation.',
      });
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    setShowVisualization(false);
    try {
      const data = await recommendPattern(image);
      setResult(data);
    } catch (err) {
      setError(err);
      setPopup({
        visible: true,
        type: 'error',
        title: 'Recommendation failed',
        message: err?.message || 'Could not reach the backend. Is it running?',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen title="Gem Cutting Recommendation" subtitle="Get a recommended cutting pattern from a photo.">
      <UploadCard
        value={image}
        onChange={(asset) => {
          setImage(asset);
          setResult(null);
          setError(null);
          setShowVisualization(false);
        }}
        title="Add a gemstone photo"
      />

      <Button
        title="Recommend pattern"
        icon="sparkles-outline"
        loading={loading}
        onPress={analyze}
      />

      {loading ? <LoadingBar indeterminate label="Analysing gemstone…" /> : null}
      <ErrorMessage message={error?.message} />

      {result ? (
        <Pressable onPress={() => setShowVisualization((prev) => !prev)}>
          <Card style={styles.patternCard}>
            <View style={styles.patternHeader}>
              <View style={styles.patternIcon}>
                <Icon name="diamond-outline" size={20} color={colors.accent} />
              </View>
              <View style={styles.patternText}>
                <AppText variant="title">{result.pattern.name}</AppText>
                <AppText variant="caption" color={colors.textMuted}>
                  by {result.pattern.designer}
                </AppText>
              </View>
              <Icon name="chevron-forward" size={20} color={colors.textDim} />
            </View>
            <View style={styles.patternMeta}>
              <AppText variant="caption" color={colors.textMuted}>
                Gem type: {result.gemType}
              </AppText>
              <AppText variant="caption" color={colors.textMuted}>
                State: {result.state}
              </AppText>
              <AppText variant="caption" color={colors.textMuted}>
                Confidence: {result.confidence ?? 'N/A'}%
              </AppText>
              <AppText variant="caption" color={colors.textMuted}>
                Facets: {result.pattern.facets} | Index: {result.pattern.index}
              </AppText>
            </View>
            <AppText variant="caption" color={colors.accent} style={styles.tapHint}>
              Tap to {showVisualization ? 'hide' : 'view'} the 2D cut-gem visualization
            </AppText>
          </Card>
        </Pressable>
      ) : null}

      {result && showVisualization ? (
        <Card style={styles.visualizationCard}>
          <AppText variant="title" style={styles.visualizationTitle}>
            {result.pattern.name}
          </AppText>
          <Image
            source={{ uri: getPatternRenderUrl(result.pattern.id) }}
            style={styles.visualization}
            resizeMode="contain"
          />
          <AppText variant="caption" color={colors.textMuted} align="center">
            2D cut-gem visualization generated from the recommended pattern.
          </AppText>
        </Card>
      ) : null}

      <Card style={styles.visualizationCard}>
        <AppText variant="title" style={styles.visualizationTitle}>
          3D cut-gem view
        </AppText>
        <View style={styles.webviewWrap}>
          <Gem3DView style={styles.webview} />
        </View>
        <AppText variant="caption" color={colors.textMuted} align="center">
          Interactive 3D visualization of the cut gem.
        </AppText>
      </Card>

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
