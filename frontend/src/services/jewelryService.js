/**
 * Jewelry Recommendation Service
 * Communicates with FastAPI endpoint /api/v1/jewelry/recommend
 */

import { API_PREFIX } from '../config/api';
import { ApiError } from '../utils/api';
import { apiClient } from './client';

export async function getJewelryRecommendation({
  weight,
  shape = 'Oval',
  treatment = 'Heat Treated',
  clarity = 'Eye Clean',
  cut = 'Mixed Brilliant Cut',
  length,
  width,
  height,
  color,
  intensity,
  origin,
}) {
  const payload = {
    weight: Number(weight),
    shape: String(shape || 'Oval').trim(),
    treatment: String(treatment || 'Heat Treated').trim(),
    clarity: String(clarity || 'Eye Clean').trim(),
    cut: String(cut || 'Mixed Brilliant Cut').trim(),
  };

  if (length != null) payload.length = Number(length);
  if (width != null) payload.width = Number(width);
  if (height != null) payload.height = Number(height);
  if (color != null) payload.color = String(color);
  if (intensity != null) payload.intensity = String(intensity);
  if (origin != null) payload.origin = String(origin);

  const data = await apiClient.post(`${API_PREFIX}/jewelry/recommend`, payload, {
    timeout: 30000,
  });

  if (!data || !data.recommended || !data.scores) {
    throw new ApiError('The jewelry recommendation service returned an unexpected response format.', {
      status: 0,
      data,
    });
  }

  return {
    recommended: data.recommended,
    scores: data.scores,
    explanation: data.recommendation_explanation,
    factorBreakdown: data.factor_breakdown,
    reasons: data.reasons,
    method: data.method,
    disclaimer: data.disclaimer,
  };
}
