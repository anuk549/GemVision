import { Platform } from 'react-native';
import Constants from 'expo-constants';

export const API_PORT = 8000;
export const API_PREFIX = '/api/v1';

const stripSlash = (value) => value.replace(/\/+$/, '');

const hostFromHostUri = (hostUri) => {
  if (!hostUri || typeof hostUri !== 'string') return null;
  const [host] = hostUri.split('/');
  const first = host.split(':')[0];
  return first || null;
};

const resolveBaseUrl = () => {
  const explicit = process.env.EXPO_PUBLIC_API_URL;
  if (explicit) return stripSlash(explicit);

  const devHost = hostFromHostUri(Constants.expoConfig?.hostUri);
  const isLoopback = !devHost || devHost === 'localhost' || devHost === '127.0.0.1';

  if (!isLoopback) return `http://${devHost}:${API_PORT}`;
  if (Platform.OS === 'android') return `http://10.0.2.2:${API_PORT}`;
  return `http://localhost:${API_PORT}`;
};

export const API_BASE_URL = resolveBaseUrl();

export const API_TIMEOUT_MS = 15000;
export const PREDICT_TIMEOUT_MS = 120000;
