export class ApiError extends Error {
  constructor(message, { status, data } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export const createApiClient = ({ baseUrl = '', headers = {}, timeout = 15000 } = {}) => {
  const request = async (path, { method = 'GET', body, signal, timeout: requestTimeout, ...rest } = {}) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), requestTimeout ?? timeout);

    try {
      const response = await fetch(`${baseUrl}${path}`, {
        method,
        headers: {
          Accept: 'application/json',
          ...(body && !(body instanceof FormData)
            ? { 'Content-Type': 'application/json' }
            : {}),
          ...headers,
          ...rest.headers,
        },
        body:
          body && !(body instanceof FormData) && typeof body !== 'string'
            ? JSON.stringify(body)
            : body,
        signal: signal || controller.signal,
      });

      const isJson = (response.headers.get('content-type') || '').includes('application/json');
      const data = isJson ? await response.json() : await response.text();

      if (!response.ok) {
        const message =
          (data && data.message) || (data && data.error) || `Request failed (${response.status})`;
        throw new ApiError(message, { status: response.status, data });
      }

      return data;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new ApiError('Request timed out', { status: 408 });
      }
      if (error instanceof ApiError) throw error;
      throw new ApiError(error.message || 'Network error', { status: 0 });
    } finally {
      clearTimeout(timer);
    }
  };

  return {
    request,
    get: (path, options) => request(path, { ...options, method: 'GET' }),
    post: (path, body, options) => request(path, { ...options, method: 'POST', body }),
    put: (path, body, options) => request(path, { ...options, method: 'PUT', body }),
    patch: (path, body, options) => request(path, { ...options, method: 'PATCH', body }),
    delete: (path, options) => request(path, { ...options, method: 'DELETE' }),
  };
};
