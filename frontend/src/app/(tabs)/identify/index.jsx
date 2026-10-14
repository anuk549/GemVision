import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import {
  Button,
  IdentificationResultCard,
  LoadingBar,
  Popup,
  RecentIdentificationsList,
  Screen,
  UploadCard,
} from '../../../components';
import { useGemIdentification } from '../../../hooks';

export default function IdentifyScreen() {
  const router = useRouter();
  const [image, setImage] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [popup, setPopup] = useState({ visible: false, type: 'info', title: '', message: '' });

  const { loading: analyzing, result, history, run, reset } = useGemIdentification();

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

    const outcome = await run(image);
    if (!outcome.ok) {
      setPopup({
        visible: true,
        type: 'error',
        title: 'Identification failed',
        message: outcome.error?.message || 'Could not reach the backend API. Is the server running?',
      });
    }
  };

  const handleProceedToPricing = () => {
    if (!result) return;
    router.push({
      pathname: '/cutting',
      params: {
        gemType: result.rawClass,
        gemName: result.gem,
        confidence: String(result.confidence),
        imageUri: result.localUri || (typeof image === 'string' ? image : image?.uri),
      },
    });
  };

  return (
    <Screen title="Gem Identification" subtitle="Recognise gemstone type from a photo with AI.">
      <UploadCard
        value={image}
        onChange={(asset) => {
          setImage(asset);
          reset();
        }}
        title="Add a gemstone photo"
      />

      <Button title="Identify gemstone" icon="search" loading={analyzing} onPress={analyze} />

      {analyzing ? <LoadingBar indeterminate label="Classifying gemstone with AI model…" /> : null}

      {result ? (
        <IdentificationResultCard
          result={result}
          onProceedToPricing={handleProceedToPricing}
        />
      ) : null}

      <RecentIdentificationsList
        items={history}
        search={search}
        onSearchChange={(text) => {
          setSearch(text);
          setPage(1);
        }}
        page={page}
        onPageChange={setPage}
        onSelectItem={(item) => {
          if (item?.localUri || item?.sourceUri) {
            setImage({ uri: item.localUri || item.sourceUri });
          }
        }}
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
