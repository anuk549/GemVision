/**
 * Sapphire Price Range Prediction Service
 * Communicates with FastAPI endpoint /api/v1/pricing/predict
 */

import { API_PREFIX } from '../config/api';
import { ApiError } from '../utils/api';
import { apiClient } from './client';

export async function predictSapphirePrice({
  weight,
  length,
  width,
  height,
  color,
  intensity = 'Medium',
  clarity = 'Eye Clean',
  shape = 'Oval',
  cut = 'Mixed Brilliant Cut',
  treatment = 'Heat Treated',
  origin = 'Ceylon (Sri Lanka)',
  coverage = 0.5,
}) {
  const payload = {
    weight: Number(weight),
    length: Number(length),
    width: Number(width),
    height: Number(height),
    color: String(color).trim(),
    intensity: String(intensity).trim(),
    clarity: String(clarity).trim(),
    shape: String(shape).trim(),
    cut: String(cut).trim(),
    treatment: String(treatment).trim(),
    origin: String(origin).trim(),
    coverage: Number(coverage) || 0.5,
  };

  const data = await apiClient.post(`${API_PREFIX}/pricing/predict`, payload, {
    timeout: 30000,
  });

  if (!data || typeof data.price_per_carat_low === 'undefined') {
    throw new ApiError('The pricing service returned an unexpected response format.', {
      status: 0,
      data,
    });
  }

  return {
    weight: data.weight,
    pricePerCaratLow: data.price_per_carat_low,
    pricePerCaratMid: data.price_per_carat_mid,
    pricePerCaratHigh: data.price_per_carat_high,
    totalPriceLow: data.total_price_low,
    totalPriceMid: data.total_price_mid,
    totalPriceHigh: data.total_price_high,
    currency: data.currency || 'USD',
    coverage: data.coverage || 0.5,
    formattedPricePerCaratRange:
      data.formatted_price_per_carat_range ||
      `$${data.price_per_carat_low.toLocaleString()} - $${data.price_per_carat_high.toLocaleString()} / ct`,
    formattedTotalPriceRange:
      data.formatted_total_price_range ||
      `$${data.total_price_low.toLocaleString()} - $${data.total_price_high.toLocaleString()}`,
  };
}
