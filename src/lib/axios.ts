// Axios wrapper in TypeScript that automatically refreshes the access token using your /api/auth/refresh endpoint when a 401 Unauthorized error occurs.

import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { useRouter } from 'next/navigation'

// Extend InternalAxiosRequestConfig to include the _retry property
interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const api: AxiosInstance = axios.create({
  baseURL: '/api',
});

// Flag to avoid multiple refresh calls at once
let isRefreshing = false;
let failedQueue: { resolve: (token: string) => void; reject: (err: unknown) => void }[] = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (token) prom.resolve(token);
    else prom.reject(error);
  });
  failedQueue = [];
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token && config.headers) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const router = useRouter()
    const originalRequest = error.config as CustomAxiosRequestConfig;

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              originalRequest.headers['Authorization'] = `Bearer ${token}`;
              resolve(api(originalRequest));
            },
            reject,
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const res = await axios.post('/api/auth/refresh'); // NOTE: use raw axios, not the wrapped one
        const newToken = res.data.accessToken;
        localStorage.setItem('access_token', newToken);
        processQueue(null, newToken);
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (err) {
        // If refresh token is expired or invalid, logout the user and redirect to login
        processQueue(err, null);
        // Clear local storage
        localStorage.removeItem('access_token');
        // Clear refresh token cookie
        await axios.post('/api/auth/logout'); // NOTE: use raw axios, not the wrapped one
        // Redirect to /login page
        if (typeof window !== 'undefined') {
          router.push('/login');
        }
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;