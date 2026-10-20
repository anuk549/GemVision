import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import AppText from '../AppText';
import Card from '../Card';
import Icon from '../Icon';
import Pagination from '../Pagination';
import SearchBar from '../SearchBar';
import { colors, radius, spacing } from '../../theme';

function formatTimestamp(timestamp) {
  if (!timestamp) return 'Recent';
  const diffMinutes = Math.floor((Date.now() - timestamp) / 60000);
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return new Date(timestamp).toLocaleDateString();
}

function getGemColor(rawClass) {
  switch (rawClass) {
    case 'blue_sapphire':
      return colors.sapphire;
    case 'yellow_sapphire':
      return colors.accent;
    case 'other_gemstone':
      return colors.ruby;
    default:
      return colors.textMuted;
  }
}

export default function RecentIdentificationsList({
  items = [],
  search = '',
  onSearchChange,
  page = 1,
  pageSize = 4,
  onPageChange,
  onSelectItem,
}) {
  const filtered = items.filter((row) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return (
      (row.gem && row.gem.toLowerCase().includes(query)) ||
      (row.id && row.id.toLowerCase().includes(query)) ||
      (row.rawClass && row.rawClass.toLowerCase().includes(query))
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, totalPages);
  const rows = filtered.slice((current - 1) * pageSize, current * pageSize);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AppText variant="title">Recent identifications</AppText>
        <View style={styles.countBadge}>
          <AppText variant="caption" weight="700" color={colors.accent}>
            {filtered.length} {filtered.length === 1 ? 'scan' : 'scans'}
          </AppText>
        </View>
      </View>

      <SearchBar
        value={search}
        onChangeText={onSearchChange}
        placeholder="Search gemstone or scan ID…"
      />

      {rows.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Icon name="search-outline" size={32} color={colors.textDim} />
          <AppText variant="subtitle" color={colors.textMuted} align="center">
            No identifications found
          </AppText>
          <AppText variant="caption" color={colors.textDim} align="center">
            Identify a gemstone photo to see your scan history here.
          </AppText>
        </Card>
      ) : (
        <View style={styles.list}>
          {rows.map((row, index) => {
            const gemColor = getGemColor(row.rawClass);
            const confNum = Number(row.confidence) || 0;
            const matchColor = confNum >= 90 ? colors.success : colors.warning;
            const imageUri = row.localUri || row.sourceUri;

            return (
              <Pressable
                key={`${row.id || 'row'}-${row.createdAt || index}`}
                onPress={() => onSelectItem?.(row)}
                style={({ pressed }) => [
                  styles.itemCard,
                  pressed && styles.itemPressed,
                ]}
              >
                {/* Gemstone Image Thumbnail */}
                <View style={styles.thumbWrap}>
                  {imageUri ? (
                    <Image source={{ uri: imageUri }} style={styles.thumb} resizeMode="cover" />
                  ) : (
                    <View style={[styles.thumbFallback, { backgroundColor: `${gemColor}22` }]}>
                      <Icon name="diamond" size={20} color={gemColor} />
                    </View>
                  )}
                </View>

                {/* Details */}
                <View style={styles.itemContent}>
                  <View style={styles.itemTopRow}>
                    <AppText variant="subtitle" weight="700" color={colors.text} numberOfLines={1}>
                      {row.gem || 'Unknown'}
                    </AppText>
                    {row.id ? (
                      <View style={styles.folderPill}>
                        <Icon name="folder-outline" size={10} color={colors.accent} />
                        <AppText variant="caption" weight="700" color={colors.accent} style={styles.folderText}>
                          {row.id}
                        </AppText>
                      </View>
                    ) : null}
                  </View>

                  <AppText variant="caption" color={colors.textMuted} numberOfLines={1}>
                    {row.formattedPrediction || `Prediction: ${row.rawClass || 'gem'}`}
                  </AppText>

                  <AppText variant="caption" color={colors.textDim} style={styles.timeText}>
                    {formatTimestamp(row.createdAt)}
                  </AppText>
                </View>

                {/* Match Confidence Badge */}
                <View style={styles.rightSection}>
                  <View style={[styles.badge, { backgroundColor: `${matchColor}22` }]}>
                    <AppText variant="caption" weight="700" color={matchColor}>
                      {confNum.toFixed(1)}%
                    </AppText>
                  </View>
                  <Icon name="chevron-forward" size={14} color={colors.textDim} style={styles.chevron} />
                </View>
              </Pressable>
            );
          })}
        </View>
      )}

      {totalPages > 1 ? (
        <View style={styles.paginationWrap}>
          <Pagination page={current} totalPages={totalPages} onPageChange={onPageChange} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  countBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: colors.accentSoft,
  },
  list: {
    gap: spacing.sm,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  itemPressed: {
    backgroundColor: colors.surfaceRaised,
    opacity: 0.9,
  },
  thumbWrap: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  thumbFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemContent: {
    flex: 1,
    gap: 2,
  },
  itemTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  folderPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.pill,
    backgroundColor: colors.accentSoft,
  },
  folderText: {
    fontSize: 10,
  },
  timeText: {
    fontSize: 11,
    marginTop: 2,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  chevron: {
    marginLeft: 2,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.xs,
  },
  paginationWrap: {
    marginTop: spacing.xs,
  },
});
