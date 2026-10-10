import { useCallback, useEffect, useRef, useState } from 'react';
import { detectDefect } from '../services/detectService';

export default function useDetection({ onSuccess, onError } = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const mounted = useRef(true);
  const callbacks = useRef({ onSuccess, onError });
  const detect = useRef(detectDefect);

  useEffect(() => {
    mounted.current = true;
    callbacks.current = { onSuccess, onError };
    return () => {
      mounted.current = false;
    };
  }, [onSuccess, onError]);

  const run = useCallback(async (asset) => {
    setLoading(true);
    setError(null);
    try {
      const data = await detect.current(asset);
      if (!mounted.current) return { ok: true, data };
      setResult(data);
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

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { loading, error, result, run, reset };
}
