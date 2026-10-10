import { useCallback, useRef, useState } from 'react';

export function useAsync(asyncFn, { onSuccess, onError } = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const mounted = useRef(true);

  const run = useCallback(
    async (...args) => {
      setLoading(true);
      setError(null);
      try {
        const result = await asyncFn(...args);
        if (mounted.current) {
          setData(result);
          onSuccess?.(result);
        }
        return { ok: true, data: result };
      } catch (err) {
        if (mounted.current) {
          setError(err);
          onError?.(err);
        }
        return { ok: false, error: err };
      } finally {
        if (mounted.current) setLoading(false);
      }
    },
    [asyncFn, onSuccess, onError]
  );

  return { loading, error, data, run };
}

export { default as useForm } from './useForm';
export { default as useDetection } from './useDetection';
