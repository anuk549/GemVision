import { API_BASE_URL, API_TIMEOUT_MS } from '../config/api';
import { createApiClient } from '../utils/api';

export const apiClient = createApiClient({
  baseUrl: API_BASE_URL,
  timeout: API_TIMEOUT_MS,
});

export const apiUrl = (path) => `${API_BASE_URL}${path}`;
