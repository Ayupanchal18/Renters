import axios from "axios";
import { env } from "../config/env";
import { getAccessToken, getRefreshToken, saveTokens, clearTokens, getUserId } from "../features/auth/services/tokenStorage";

/* ─── Token Utilities ─────────────────────────────────────── */

/**
 * Check if a JWT token is expired or will expire soon
 */
function isTokenExpired(token: string, bufferMinutes: number = 2): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expirationTime = payload.exp * 1000; // Convert to milliseconds
    const currentTime = Date.now();
    const bufferTime = bufferMinutes * 60 * 1000; // Convert buffer to milliseconds
    
    return currentTime >= (expirationTime - bufferTime);
  } catch {
    return true; // If we can't parse the token, consider it expired
  }
}

/**
 * Proactively refresh token if it's about to expire
 */
async function ensureValidToken(): Promise<string | null> {
  const currentToken = await getAccessToken();
  
  if (!currentToken) {
    return null;
  }
  
  // If token is not expired, return it
  if (!isTokenExpired(currentToken)) {
    return currentToken;
  }
  
  // Token is expired or about to expire, try to refresh
  try {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) {
      return null;
    }

    const res = await axios.post(`${env.apiBaseUrl}/api/auth/refresh`, {
      refreshToken,
    });

    if (res.data.success && res.data.token) {
      await saveTokens(res.data.token, res.data.refreshToken);
      return res.data.token;
    }
    
    return null;
  } catch {
    // Refresh failed, clear tokens
    await clearTokens();
    return null;
  }
}

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
    // Proactively ensure we have a valid token before making the request
    const token = await ensureValidToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Attach x-user-id header
    try {
      const userId = await getUserId();
      if (userId) {
        config.headers["x-user-id"] = userId;
      }
    } catch (e) {
      console.warn("Failed to get user ID:", e);
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
      }).catch((err) => {
        return Promise.reject(err);
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
      const newRefreshToken: string = res.data.refreshToken;
      await saveTokens(newToken, newRefreshToken);

      // Update header for the retried request
      originalRequest.headers.Authorization = `Bearer ${newToken}`;

      processQueue(null, newToken);
      return apiClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      // Refresh failed – clear tokens so auth context redirects to login
      await clearTokens();
      
      // If this is a token expiration error, provide a more user-friendly message
      const isTokenExpiredError = refreshError instanceof Error && 
        (refreshError.message.includes("expired") || refreshError.message.includes("invalid"));
      
      if (isTokenExpiredError) {
        console.log("Session expired, user needs to login again");
      }
      
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);
