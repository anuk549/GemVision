import { Platform } from 'react-native';
import { API_PREFIX, PREDICT_TIMEOUT_MS } from '../config/api';
import { ApiError } from '../utils/api';
import { apiClient } from './client';

const MIME_TYPES = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  bmp: 'image/bmp',
  heic: 'image/heic',
};

const GRADE_BY_CLASS = {
  crack: 'HI',
  inclusion: 'MI',
  normal: 'EC',
};

const GROUP_BY_CLASS = {
  crack: 'external',
  inclusion: 'internal',
  normal: 'none',
};

export const imageFileName = (uri = '') => {
  const clean = uri.split('?')[0].split('#')[0];
  const last = clean.split('/').pop();
  return last && last.includes('.') ? last : `gemstone-${Date.now()}.jpg`;
};

export const imageMimeType = (uri = '') => {
  const ext = imageFileName(uri).split('.').pop().toLowerCase();
  return MIME_TYPES[ext] || 'image/jpeg';
};

const asDataUri = (base64, mime = 'image/png') =>
  !base64 ? null : base64.startsWith('data:') ? base64 : `data:${mime};base64,${base64}`;

const toPercent = (value) =>
  typeof value === 'number' ? Math.round(value * 1000) / 10 : null;

export const toUploadPart = (asset) => {
  const uri = typeof asset === 'string' ? asset : asset?.uri;
  if (!uri) return null;
  return { uri, name: imageFileName(uri), type: imageMimeType(uri) };
};

const normalizeDetection = (data, asset) => {
  const cls = data.predicted_class || 'unknown';
  const profile = data.defect || {};
  const visuals = data.visuals || {};

  const predictions = Object.entries(data.probabilities || {})
    .map(([name, probability]) => ({ class: name, confidence: toPercent(probability) ?? 0 }))
    .sort((a, b) => b.confidence - a.confidence);

  return {
    id: `${Date.now()}`,
    modelName: data.model_name || null,
    backbone: data.backbone || null,
    predictedClass: cls,
    confidence: toPercent(data.confidence),
    grade: GRADE_BY_CLASS[cls] || null,
    gradeDescription: profile.description || null,
    provisional: false,
    defect: {
      label: cls === 'normal' ? 'None (eye clean)' : profile.name || cls,
      group: GROUP_BY_CLASS[cls] || 'unknown',
      severity: profile.severity || null,
      description: profile.description || null,
      location: profile.location || null,
    },
    predictions,
    preview: asDataUri(visuals.overlay),
    heatmap: asDataUri(visuals.heatmap),
    gemMask: asDataUri(visuals.gem_mask),
    sourceUri: typeof asset === 'string' ? asset : asset?.uri || null,
    gemDetected: (data.gem_coverage_pct ?? 0) > 0,
    gemCoverage: data.gem_coverage_pct ?? 0,
    defectCoverage: data.defect_coverage_pct ?? 0,
    boundingBox: data.bounding_box || null,
    capabilities: { requirement_complete: true, missing_defects: [] },
    capabilitiesComplete: true,
  };
};

const EXT_BY_MIME = Object.fromEntries(
  Object.entries(MIME_TYPES).map(([ext, mime]) => [mime, ext])
);

const extensionFor = (mime) => EXT_BY_MIME[mime] || 'jpg';

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
  const name = `gemstone-${Date.now()}.${extensionFor(type)}`;
  form.append('file', blob.type ? blob : new Blob([blob], { type }), name);
  return { ...part, name, type };
};

export const detectDefect = async (asset, { model } = {}) => {
  const form = new FormData();
  await appendImage(form, asset);
  form.append('include_visuals', 'true');
  if (model) form.append('model', model);

  const data = await apiClient.post(`${API_PREFIX}/defects/detect`, form, {
    timeout: PREDICT_TIMEOUT_MS,
  });

  if (!data || !data.predicted_class) {
    throw new ApiError('The server returned an unexpected response', { status: 0, data });
  }

  return normalizeDetection(data, asset);
};

export const detectWithAllModels = async (asset) => {
  const form = new FormData();
  await appendImage(form, asset);

  const data = await apiClient.post(`${API_PREFIX}/defects/detect/compare`, form, {
    timeout: PREDICT_TIMEOUT_MS,
  });

  return Array.isArray(data) ? data.map((item) => normalizeDetection(item, asset)) : [];
};

export const getModels = () => apiClient.get(`${API_PREFIX}/defects/models`);

export const getHealth = () => apiClient.get(`${API_PREFIX}/health`);
