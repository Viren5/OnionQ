import axios, { type AxiosResponse } from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach Authorization Token if present in localStorage
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('onionq_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: logs and handles errors gracefully
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // If backend returns 501 NOT IMPLEMENTED or network fails in local demo, we reject so callers can handle fallback
    return Promise.reject(error);
  }
);

/**
 * Helper to wrap API calls with automatic mock fallback when backend endpoint returns 501 or is unreachable
 */
export async function requestWithMockFallback<T>(
  requestFn: () => Promise<AxiosResponse<T>>,
  mockFallback: T | (() => T | Promise<T>)
): Promise<T> {
  try {
    const res = await requestFn();
    return res.data;
  } catch (error: unknown) {
    const axiosErr = error as { response?: { status?: number }; code?: string };
    // If server returned 501 Not Implemented, 404, or network connection refused (backend server not running)
    if (
      !axiosErr.response ||
      axiosErr.response.status === 501 ||
      axiosErr.response.status === 404 ||
      axiosErr.code === 'ERR_NETWORK' ||
      axiosErr.code === 'ECONNREFUSED'
    ) {
      if (typeof mockFallback === 'function') {
        return await (mockFallback as () => T | Promise<T>)();
      }
      return mockFallback;
    }
    throw error;
  }
}
