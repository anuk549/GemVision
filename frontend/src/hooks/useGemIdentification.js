import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getBackendGemHistory,
  identifyGemstone,
} from '../services';

const DEFAULT_SEED = [
  { id: 'sample-003', gem: 'Blue Sapphire', rawClass: 'blue_sapphire', confidence: 98.4, formattedPrediction: 'Prediction: blue_sapphire (98.40% confidence)', createdAt: 1700000000003 },
  { id: 'sample-002', gem: 'Yellow Sapphire', rawClass: 'yellow_sapphire', confidence: 96.2, formattedPrediction: 'Prediction: yellow_sapphire (96.20% confidence)', createdAt: 1700000000002 },
  { id: 'sample-001', gem: 'Other Gemstone', rawClass: 'other_gemstone', confidence: 91.5, formattedPrediction: 'Prediction: other_gemstone (91.50% confidence)', createdAt: 1700000000001 },
];

export default function useGemIdentification({ onSuccess, onError } = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const mounted = useRef(true);
  const callbacks = useRef({ onSuccess, onError });

  useEffect(() => {
    mounted.current = true;
    callbacks.current = { onSuccess, onError };
    return () => {
      mounted.current = false;
    };
  }, [onSuccess, onError]);

  // Load persistent records from backend assets on mount
  useEffect(() => {
    let active = true;
    async function initHistory() {
      const backendHistory = await getBackendGemHistory();
      if (active && mounted.current) {
        if (backendHistory && backendHistory.length > 0) {
          setHistory(backendHistory);
        } else {
          setHistory(DEFAULT_SEED);
        }
      }
    }
    initHistory();
    return () => {
      active = false;
    };
  }, []);

  const run = useCallback(async (asset) => {
    setLoading(true);
    setError(null);
    try {
      // Call native Keras backend API (saves to backend/assets/gem_inputs/i-001/)
      const data = await identifyGemstone(asset);

      if (!mounted.current) return { ok: true, data };

      setResult(data);
      setHistory((prev) => [data, ...prev.filter((item) => item.id !== data.id)]);
      callbacks.current.onSuccess?.(data);
      return { ok: true, data };
    } catch (err) {
      if (!mounted.current) return { ok: false, error: err };
      setResult(null);
      setError(err);
      callbacks.current.onError?.(err);
      return { ok: false, error: err };
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  const selectHistoryItem = useCallback((item) => {
    if (!item) return;
    setResult(item);
    setError(null);
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { loading, error, result, history, run, reset, selectHistoryItem, setResult, setHistory };
}
