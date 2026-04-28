import { apiClient } from "../../../api/client";
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  RefreshResponse,
  ApiResponse,
  User,
} from "../../../types/types";
import { saveTokens, clearTokens, getRefreshToken } from "./tokenStorage";

/**
 * POST /api/auth/login
 */
export async function loginUser(data: LoginRequest): Promise<AuthResponse> {
  const res = await apiClient.post<AuthResponse>("/api/auth/login", data);
  const { token, refreshToken, user } = res.data;
  // Persist both access and refresh tokens to secure storage
  await saveTokens(token, refreshToken, user.id);
  return res.data;
}

/**
 * POST /api/auth/register
 */
export async function registerUser(
  data: RegisterRequest
): Promise<AuthResponse> {
  const res = await apiClient.post<AuthResponse>("/api/auth/register", data);
  const { token, refreshToken, user } = res.data;
  await saveTokens(token, refreshToken, user.id);
  return res.data;
}

/**
 * POST /api/auth/google or /api/auth/facebook
 */
export async function socialLoginUser(
  provider: "google" | "facebook",
  payload: { code?: string; accessToken?: string; credential?: string }
): Promise<AuthResponse> {
  const res = await apiClient.post<AuthResponse>(`/api/auth/${provider}`, payload);
  const { token, refreshToken, user } = res.data;
  await saveTokens(token, refreshToken, user.id);
  return res.data;
}

/**
 * POST /api/auth/refresh
 * Sends the stored refresh token in the request body.
 */
export async function refreshAccessToken(): Promise<string | null> {
  try {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) return null;

    const res = await apiClient.post<RefreshResponse>("/api/auth/refresh", {
      refreshToken,
    });

    if (res.data.success && res.data.token) {
      // Save both new access token and refresh token (if provided)
      await saveTokens(res.data.token, res.data.refreshToken);
      return res.data.token;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * POST /api/auth/logout
 */
export async function logoutUser(): Promise<void> {
  try {
    await apiClient.post("/api/auth/logout");
  } catch {
    // Ignore errors — we clear tokens regardless
  } finally {
    await clearTokens();
  }
}

/**
 * GET /api/users/me   (requires Authorization header)
 * Used to restore session on app relaunch.
 */
export async function fetchCurrentUser(): Promise<User | null> {
  try {
    const res = await apiClient.get<ApiResponse<User>>("/api/users/me");
    return res.data.data ?? null;
  } catch {
    return null;
  }
}

/**
 * POST /api/auth/forgot-password
 */
export async function forgotPassword(email: string): Promise<{ success: boolean; message: string; development_token?: string }> {
  const res = await apiClient.post("/api/auth/forgot-password", { email });
  return res.data;
}

/**
 * POST /api/auth/reset-password
 */
export async function resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
  const res = await apiClient.post("/api/auth/reset-password", { token, newPassword });
  return res.data;
}
