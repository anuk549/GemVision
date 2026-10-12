import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  AppText,
  Badge,
  Button,
  DetectionResult,
  ErrorMessage,
  LoadingBar,
  Pagination,
  Popup,
  Screen,
  SearchBar,
  Table,
  UploadCard,
} from '../../../components';
import { useDetection } from '../../../hooks';
import { GRADE_COLORS } from '../../../constants/detection';
import { imageFileName } from '../../../services/detectService';
import { colors, spacing } from '../../../theme';

const PAGE_SIZE = 4;

const recordFromResult = (result) => ({
  id: result.id,
  stone: imageFileName(result.sourceUri),
  defect: result.defect?.label || result.predictedClass,
  grade: result.grade || 'N/A',
  confidence: result.confidence,
});

export default function DetectScreen() {
  const [image, setImage] = useState(null);
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [popup, setPopup] = useState({ visible: false, type: 'info', title: '', message: '' });

  const { loading, error, result, run, reset } = useDetection({
    onSuccess: (data) => setRecords((prev) => [recordFromResult(data), ...prev]),
  });

  const analyze = async () => {
    if (!image) {
      setPopup({
        visible: true,
        type: 'warning',
        title: 'No image',
        message: 'Add a gemstone photo before running detection.',
      });
      return;
    }
    const outcome = await run(image);
    if (!outcome.ok) {
      setPopup({
        visible: true,
        type: 'error',
        title: 'Detection failed',
        message: outcome.error?.message || 'Could not reach the backend. Is it running?',
      });
    }
  };

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return records;
    return records.filter(
      (row) =>
        row.stone.toLowerCase().includes(query) || row.defect.toLowerCase().includes(query)
    );
  }, [records, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const rows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const columns = [
    { key: 'stone', title: 'Image', flex: 1.6 },
    {
      key: 'defect',
      title: 'Defect',
      flex: 1.2,
      render: (row) => (
        <AppText variant="body" color={colors.textMuted}>
          {row.defect}
        </AppText>
      ),
    },
    {
      key: 'grade',
      title: 'Clarity',
      width: 90,
      align: 'center',
      render: (row) => (
        <Badge label={row.grade} color={GRADE_COLORS[row.grade] || colors.primary} />
      ),
    },
  ];

  return (
    <Screen title="Defect Detection" subtitle="Find cracks, inclusions and clarity grade.">
      <UploadCard
        value={image}
        onChange={(asset) => {
          setImage(asset);
          reset();
        }}
        title="Add a gemstone photo"
      />

      <Button title="Detect defects" icon="diamond" loading={loading} onPress={analyze} />

      {loading ? <LoadingBar indeterminate label="Scanning for defects…" /> : null}

      <ErrorMessage message={error?.message} />

      <DetectionResult result={result} showImages={!!result?.preview || !!result?.heatmap} />

      <AppText variant="title" style={styles.sectionTitle}>
        Detection records
      </AppText>
      <SearchBar
        value={search}
        onChangeText={(text) => {
          setSearch(text);
          setPage(1);
        }}
        placeholder="Search image or defect…"
      />

      <Table
        columns={columns}
        data={rows}
        emptyTitle="No records"
        emptyMessage="Run a detection to see results here."
        footer={
          <View style={styles.footer}>
            <AppText variant="caption" color={colors.textDim}>
              {filtered.length} record{filtered.length === 1 ? '' : 's'}
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
  sectionTitle: {
    marginTop: spacing.sm,
  },
  footer: {
    gap: spacing.md,
  },
});
