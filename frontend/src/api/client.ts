import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
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

// Response interceptor: let errors propagate to callers for real error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);
