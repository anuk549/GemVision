import { useEffect, useState } from 'react';
import { API_PREFIX } from '../../config/api';
import { apiClient } from '../../services/client';

export const FALLBACK_EXCHANGE_RATE = 331.25;
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes in-memory cache

let cachedRate = FALLBACK_EXCHANGE_RATE;
let lastFetchedTime = 0;
let isRateLive = false;

/**
 * Fetches real-time USD/LKR rate from api.exchangerate.fun (or backend proxy fallback).
 */
export async function fetchLiveExchangeRate(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && lastFetchedTime > 0 && now - lastFetchedTime < CACHE_TTL_MS) {
    return { rate: cachedRate, isLive: isRateLive };
  }

  // 1. Direct fetch to official api.exchangerate.fun
  try {
    const response = await fetch('https://api.exchangerate.fun/latest?base=USD', {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (response.ok) {
      const data = await response.json();
      const lkr = data?.rates?.LKR;
      if (lkr && typeof lkr === 'number' && lkr > 0) {
        cachedRate = Number(lkr.toFixed(2));
        lastFetchedTime = now;
        isRateLive = true;
        return { rate: cachedRate, isLive: true };
      }
    }
  } catch {
    // Direct external fetch failed, fallback to backend proxy
  }

  // 2. Fallback to backend currency endpoint
  try {
    const beRes = await apiClient.get(`${API_PREFIX}/jewelry/currency-rates`);
    const rate = beRes?.data?.rates?.LKR || beRes?.data?.rate;
    if (rate && typeof rate === 'number' && rate > 0) {
      cachedRate = Number(rate.toFixed(2));
      lastFetchedTime = now;
      isRateLive = true;
      return { rate: cachedRate, isLive: true };
    }
  } catch {
    // Backend also unreachable, use fallback
  }

  return { rate: cachedRate || FALLBACK_EXCHANGE_RATE, isLive: isRateLive };
}

export function getCurrentExchangeRate() {
  return cachedRate || FALLBACK_EXCHANGE_RATE;
}

/**
 * React Hook for consuming live exchange rates.
 */
export function useLiveExchangeRate() {
  const [exchangeState, setExchangeState] = useState({
    rate: cachedRate || FALLBACK_EXCHANGE_RATE,
    loading: true,
    isLive: isRateLive,
  });

  useEffect(() => {
    let mounted = true;
    fetchLiveExchangeRate().then((res) => {
      if (mounted) {
        setExchangeState({
          rate: res.rate,
          loading: false,
          isLive: res.isLive,
        });
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  return exchangeState;
}

export default {
  fetchLiveExchangeRate,
  getCurrentExchangeRate,
  useLiveExchangeRate,
  FALLBACK_EXCHANGE_RATE,
};
