/**
 * Gemstone Classifier Service (Backend API Integration)
 * Calls native Keras gemstone_classifier_model_best.keras via FastAPI.
 */

import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { API_BASE_URL, API_PREFIX, PREDICT_TIMEOUT_MS } from '../config/api';
import { ApiError } from '../utils/api';
import { apiClient } from './client';
import { imageFileName, imageMimeType, toUploadPart } from './detectService';

const appendImage = async (form, asset) => {
  const part = toUploadPart(asset);
  if (!part) throw new ApiError('No image selected', { status: 0 });

  let blob;
  try {
    const response = await fetch(part.uri);
    blob = await response.blob();
  } catch {
    throw new ApiError('Could not read the selected image', { status: 0 });
  }

  const type = blob.type || part.type || 'image/jpeg';
  const ext = imageFileName(part.uri).split('.').pop().toLowerCase() || 'jpg';
  const name = `gemstone-${Date.now()}.${ext}`;
  form.append('file', blob.type ? blob : new Blob([blob], { type }), name);
  return { ...part, name, type };
};

/**
 * Sends gemstone photo to FastAPI backend for classification with gemstone_classifier_model_best.keras.
 * Saves uploaded image into backend assets folder (backend/assets/gem_inputs/i-001/).
 */
export async function identifyGemstone(asset) {
  const fileUri = typeof asset === 'string' ? asset : asset?.uri;
  if (!fileUri) {
    throw new ApiError('No image selected', { status: 0 });
  }

  const endpointUrl = `${API_BASE_URL}${API_PREFIX}/gemstones/identify`;
  let data;

  if (Platform.OS !== 'web') {
    // Native (Android / iOS): Use FileSystem.uploadAsync to stream directly from disk/content provider.
    // If the image is a remote URL (e.g. from history), download to cache first since uploadAsync requires a local file URI.
    let uploadUri = fileUri;
    let tempCacheFile = null;

    if (fileUri.startsWith('http://') || fileUri.startsWith('https://')) {
      const ext = imageFileName(fileUri).split('.').pop().toLowerCase() || 'jpg';
      tempCacheFile = `${FileSystem.cacheDirectory}gem_reid_${Date.now()}.${ext}`;
      const downloadResult = await FileSystem.downloadAsync(fileUri, tempCacheFile);
      uploadUri = downloadResult.uri;
    }

    try {
      const mimeType = imageMimeType(uploadUri);
      const uploadResult = await FileSystem.uploadAsync(endpointUrl, uploadUri, {
        httpMethod: 'POST',
        uploadType: FileSystem.FileSystemUploadType.MULTIPART,
        fieldName: 'file',
        mimeType,
        headers: {
          Accept: 'application/json',
        },
      });

      let parsed;
      try {
        parsed = JSON.parse(uploadResult.body);
      } catch {
        parsed = null;
      }

      if (uploadResult.status < 200 || uploadResult.status >= 300) {
        const message =
          (parsed && (parsed.detail || parsed.message || parsed.error)) ||
          `Identification request failed with status ${uploadResult.status}`;
        throw new ApiError(message, { status: uploadResult.status, data: parsed });
      }

      data = parsed;
    } finally {
      if (tempCacheFile) {
        try {
          await FileSystem.deleteAsync(tempCacheFile, { idempotent: true });
        } catch {
          // ignore cache cleanup error
        }
      }
    }
  } else {
    // Web: Use standard fetch with FormData & Blob
    const form = new FormData();
    await appendImage(form, asset);

    data = await apiClient.post(`${API_PREFIX}/gemstones/identify`, form, {
      timeout: PREDICT_TIMEOUT_MS,
    });
  }

  if (!data || !data.raw_class) {
    throw new ApiError('The backend returned an unexpected response format.', { status: 0, data });
  }

  const localUri = typeof asset === 'string' ? asset : asset?.uri;
  const backendImageUrl = data.image_url ? `${API_BASE_URL}${data.image_url}` : null;

  return {
    id: data.id,
    folder: data.folder,
    gem: data.gem,
    rawClass: data.raw_class,
    confidence: data.confidence,
    formattedPrediction: data.formatted_prediction,
    canProceedToPricing: Boolean(data.can_proceed_to_pricing),
    probabilities: (data.probabilities || []).map((p) => ({
      class: p.class || p.class_name,
      label: p.label || p.class,
      confidence: p.confidence,
    })),
    savedPath: data.saved_path,
    backendImageUrl,
    sourceUri: localUri,
    localUri: localUri || backendImageUrl,
    createdAt: data.created_at || Date.now(),
  };
}

/**
 * Fetches previous identification records saved in backend assets.
 */
export async function getBackendGemHistory() {
  try {
    const data = await apiClient.get(`${API_PREFIX}/gemstones/history`);
    if (!Array.isArray(data)) return [];

    return data.map((item) => {
      const imageUrl = item.image_url ? `${API_BASE_URL}${item.image_url}` : null;
      return {
        id: item.id,
        folder: item.folder,
        gem: item.gem,
        rawClass: item.raw_class,
        confidence: item.confidence,
        formattedPrediction: item.formatted_prediction,
        canProceedToPricing: Boolean(item.can_proceed_to_pricing),
        probabilities: (item.probabilities || []).map((p) => ({
          class: p.class || p.class_name,
          label: p.label || p.class || p.class_name,
          confidence: Number(p.confidence) || 0,
        })),
        savedPath: item.saved_path,
        backendImageUrl: imageUrl,
        localUri: imageUrl,
        sourceUri: imageUrl,
        createdAt: item.created_at || Date.now(),
      };
    });
  } catch {
    // Backend may be offline during initial startup; fall back gracefully
    return [];
  }
}
