import React, { useState } from 'react';
import {
  Button,
  IdentificationResultCard,
  JewelryRecommendationView,
  LoadingBar,
  Popup,
  RecentIdentificationsList,
  SapphirePricePredictionView,
  Screen,
  UploadCard,
} from '../../../components';
import { useGemIdentification } from '../../../hooks';

export default function IdentifyScreen() {
  const [currentView, setCurrentView] = useState('identify'); // 'identify' | 'pricing' | 'recommendation'
  const [pricingGem, setPricingGem] = useState(null);
  const [recommendationStone, setRecommendationStone] = useState(null);
  const [image, setImage] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [popup, setPopup] = useState({ visible: false, type: 'info', title: '', message: '' });

  const {
    loading: analyzing,
    result,
    history,
    run,
    reset,
    selectHistoryItem,
  } = useGemIdentification();

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

  const handleProceedToPricing = (gem) => {
    const target = gem || result;
    if (!target) return;
    setPricingGem(target);
    setCurrentView('pricing');
  };

  if (currentView === 'pricing') {
    return (
      <Screen
        title="Sapphire Valuation"
        subtitle="Estimate market price range based on physical and gemological traits."
      >
        <SapphirePricePredictionView
          identifiedGem={pricingGem}
          onBack={() => setCurrentView('identify')}
          onProceedToRecommendation={(stone) => {
            setRecommendationStone(stone);
            setCurrentView('recommendation');
          }}
        />
      </Screen>
    );
  }

  if (currentView === 'recommendation') {
    return (
      <Screen
        title="Jewelry Recommendation"
        subtitle="Recommended jewelry setting based on gemstone characteristics."
      >
        <JewelryRecommendationView
          stoneData={recommendationStone}
          onBack={() => setCurrentView('pricing')}
        />
      </Screen>
    );
  }

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
          onProceedToPricing={() => handleProceedToPricing(result)}
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
          const uri = item?.localUri || item?.sourceUri || item?.backendImageUrl;
          if (uri) {
            setImage({ uri });
          }
          selectHistoryItem(item);
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
