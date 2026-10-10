import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  AppText,
  Button,
  Card,
  Icon,
  KeyValue,
  LoadingBar,
  Pagination,
  Popup,
  Screen,
  SearchBar,
  Table,
  UploadCard,
} from '../../../components';
import { colors, radius, spacing } from '../../../theme';

const PAGE_SIZE = 4;
const GEMS = [
  'Blue Sapphire',
  'Yellow Sapphire',
  'Star Sapphire',
  'Ruby',
  "Cat's Eye",
  'Moonstone',
  'Emerald',
  'Spinel',
  'Topaz',
];
const HUES = [
  'Cornflower Blue',
  'Royal Blue',
  'Golden Yellow',
  'Crimson Red',
  'Honey',
  'Milky White',
  'Vivid Green',
  'Soft Pink',
  'Champagne',
];

const SEED = [
  { id: '1', gem: 'Blue Sapphire', color: 'Cornflower Blue', carat: '2.41', confidence: 96 },
  { id: '2', gem: 'Ruby', color: 'Crimson Red', carat: '1.18', confidence: 91 },
  { id: '3', gem: "Cat's Eye", color: 'Honey', carat: '2.05', confidence: 88 },
];

const pick = (list) => list[Math.floor(Math.random() * list.length)];

export default function IdentifyScreen() {
  const [image, setImage] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState(SEED);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [popup, setPopup] = useState({ visible: false, type: 'info', title: '', message: '' });

  const analyze = async () => {
    if (!image) {
      setPopup({
        visible: true,
        type: 'warning',
        title: 'No image',
        message: 'Add a gemstone photo before running identification.',
      });
      return;
    }
    setAnalyzing(true);
    setResult(null);
    await new Promise((resolve) => setTimeout(resolve, 1600));
    const res = {
      id: String(Date.now()),
      gem: pick(GEMS),
      color: pick(HUES),
      carat: (0.5 + Math.random() * 4).toFixed(2),
      confidence: 85 + Math.floor(Math.random() * 14),
    };
    setResult(res);
    setHistory((prev) => [res, ...prev]);
    setAnalyzing(false);
  };

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return history;
    return history.filter(
      (row) => row.gem.toLowerCase().includes(query) || row.color.toLowerCase().includes(query)
    );
  }, [history, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const rows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const columns = [
    { key: 'gem', title: 'Gemstone', flex: 1.4 },
    { key: 'color', title: 'Color', flex: 1.1 },
    { key: 'carat', title: 'Carat', width: 74, align: 'center' },
    {
      key: 'confidence',
      title: 'Match',
      width: 84,
      align: 'center',
      render: (row) => {
        const color = row.confidence >= 90 ? colors.success : colors.warning;
        return (
          <View style={[styles.badge, { backgroundColor: `${color}22` }]}>
            <AppText variant="caption" weight="700" color={color}>
              {row.confidence}%
            </AppText>
          </View>
        );
      },
    },
  ];

  return (
    <Screen title="Gem Identification" subtitle="Recognise gemstone type from a photo.">
      <UploadCard
        value={image}
        onChange={(asset) => {
          setImage(asset);
          setResult(null);
        }}
        title="Add a gemstone photo"
      />

      <Button title="Identify gemstone" icon="search" loading={analyzing} onPress={analyze} />

      {analyzing ? <LoadingBar indeterminate label="Analyzing image…" /> : null}

      {result ? (
        <Card>
          <View style={styles.resultHeader}>
            <View style={styles.resultIcon}>
              <Icon name="sparkles" size={18} color={colors.accent} />
            </View>
            <AppText variant="title">Identification result</AppText>
          </View>
          <KeyValue
            items={[
              { label: 'Gemstone', value: result.gem, icon: 'diamond-outline', color: colors.accent },
              { label: 'Color', value: result.color, icon: 'color-filter-outline' },
              { label: 'Estimated carat', value: result.carat, icon: 'scale-outline' },
              { label: 'Confidence', value: `${result.confidence}%`, icon: 'shield-checkmark-outline', color: colors.success },
            ]}
          />
        </Card>
      ) : null}

      <AppText variant="title" style={styles.sectionTitle}>
        Recent identifications
      </AppText>
      <SearchBar
        value={search}
        onChangeText={(text) => {
          setSearch(text);
          setPage(1);
        }}
        placeholder="Search gemstone or color…"
      />

      <Table
        columns={columns}
        data={rows}
        emptyTitle="No identifications"
        emptyMessage="Identify a gemstone to see it here."
        footer={
          <View style={styles.footer}>
            <AppText variant="caption" color={colors.textDim}>
              {filtered.length} result{filtered.length === 1 ? '' : 's'}
            </AppText>
            <Pagination page={current} totalPages={totalPages} onPageChange={setPage} />
          </View>
        }
      />

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
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  resultIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    marginTop: spacing.sm,
  },
  footer: {
    gap: spacing.md,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
});
