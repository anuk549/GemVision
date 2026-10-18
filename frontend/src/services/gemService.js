import { Platform } from 'react-native';
import { API_BASE_URL, PREDICT_TIMEOUT_MS } from '../config/api';
import { ApiError } from '../utils/api';
import { apiClient } from './client';

const MIME_TYPES = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

export const GEM_API_PREFIX = '/api/gem';

export const imageFileName = (uri = '') => {
  const clean = uri.split('?')[0].split('#')[0];
  const last = clean.split('/').pop();
  return last && last.includes('.') ? last : `gemstone-${Date.now()}.jpg`;
};

export const imageMimeType = (uri = '') => {
  const ext = imageFileName(uri).split('.').pop().toLowerCase();
  return MIME_TYPES[ext] || 'image/jpeg';
};

export const toUploadPart = (asset) => {
  const uri = typeof asset === 'string' ? asset : asset?.uri;
  if (!uri) return null;
  return { uri, name: imageFileName(uri), type: imageMimeType(uri) };
};

const appendImage = async (form, asset) => {
  const part = toUploadPart(asset);
  if (!part) throw new ApiError('No image selected', { status: 0 });

  if (Platform.OS !== 'web') {
    form.append('file', part);
    return part;
  }

  let blob;
  try {
    const response = await fetch(part.uri);
    blob = await response.blob();
  } catch {
    throw new ApiError('Could not read the selected image', { status: 0 });
  }

  const type = blob.type || part.type;
  const name = `gemstone-${Date.now()}.jpg`;
  form.append('file', blob.type ? blob : new Blob([blob], { type }), name);
  return { ...part, name, type };
};

export const recommendPattern = async (asset) => {
  const form = new FormData();
  await appendImage(form, asset);

  const data = await apiClient.post(`${GEM_API_PREFIX}/recommend-pattern`, form, {
    timeout: PREDICT_TIMEOUT_MS,
  });

  if (!data || !data.recommended_pattern) {
    throw new ApiError('The server returned an unexpected response', { status: 0, data });
  }

  return {
    gemType: data.gem_type || 'unknown',
    state: data.state || 'unknown',
    confidence:
      typeof data.confidence === 'number' ? Math.round(data.confidence * 1000) / 10 : null,
    pattern: {
      id: data.recommended_pattern.id,
      name: data.recommended_pattern.name,
      designer: data.recommended_pattern.designer,
      facets: data.recommended_pattern.facets,
      index: data.recommended_pattern.index,
      angles: data.recommended_pattern.angles || {},
    },
  };
};

export const getPatternRenderUrl = (patternId) =>
  `${API_BASE_URL}${GEM_API_PREFIX}/pattern/${encodeURIComponent(patternId)}/render`;
