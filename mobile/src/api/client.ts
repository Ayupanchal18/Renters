import axios from "axios";
import { env } from "../config/env";
import { getAccessToken, getRefreshToken, saveTokens, clearTokens } from "../features/auth/services/tokenStorage";
import * as SecureStore from 'expo-secure-store';

export const apiClient = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 15_000,
  headers: {
    "Content-Type": "application/json",
  },
});

/* ─── Request Interceptor: Attach Bearer Token ───────────── */

apiClient.interceptors.request.use(
  async (config) => {
    const token = await getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Web app logic: Attach x-user-id for certain endpoints
    try {
      const rawUserId = await SecureStore.getItemAsync("userId");
      if (rawUserId) {
        if (rawUserId.startsWith('{')) {
          const userObj = JSON.parse(rawUserId);
          if (userObj.id) {
            config.headers["x-user-id"] = userObj.id;
          }
        } else {
          const cleanId = rawUserId.replace(/^"|"$/g, '');
          config.headers["x-user-id"] = cleanId;
        }
      }
    } catch (e) {
      console.warn("Failed to parse user ID:", e);
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

/* ─── Response Interceptor: Auto-Refresh on 401 ──────────── */

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only retry on 401 and only once per request
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Don't retry refresh or login requests
    const url = originalRequest.url ?? "";
    if (url.includes("/auth/refresh") || url.includes("/auth/login")) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Queue parallel 401 requests while a refresh is in flight
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return apiClient(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = await getRefreshToken();
      if (!refreshToken) {
        throw new Error("No refresh token available");
      }

      const res = await axios.post(`${env.apiBaseUrl}/api/auth/refresh`, {
        refreshToken,
      });

      const newToken: string = res.data.token;
      await saveTokens(newToken, refreshToken);

      // Update header for the retried request
      originalRequest.headers.Authorization = `Bearer ${newToken}`;

      processQueue(null, newToken);
      return apiClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      // Refresh failed – clear tokens so auth context redirects to login
      await clearTokens();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);
