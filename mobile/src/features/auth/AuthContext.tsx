import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import type { User, LoginRequest, RegisterRequest } from "../../types/types";
import {
  loginUser,
  registerUser,
  logoutUser,
  fetchCurrentUser,
  socialLoginUser,
  refreshAccessToken,
} from "./services/authService";
import { getAccessToken, clearTokens } from "./services/tokenStorage";

/* ─── Context Shape ──────────────────────────────────────── */

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  socialLogin: (provider: "google" | "facebook", payload: { code?: string; accessToken?: string; credential?: string }) => Promise<void>;
  logout: () => Promise<void>;
  continueAsGuest: () => void;
  updateSessionUser: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

/* ─── Provider ───────────────────────────────────────────── */

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  // Restore session on cold start
  useEffect(() => {
    (async () => {
      try {
        const storedToken = await getAccessToken();
        if (storedToken) {
          setToken(storedToken);
          const currentUser = await fetchCurrentUser();
          if (currentUser) {
            setUser(currentUser);
          } else {
            // Token invalid / expired beyond refresh — clear state
            await clearTokens();
            setToken(null);
          }
        }
      } catch (error) {
        console.warn("Session restoration failed:", error);
        await clearTokens();
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // Background token refresh - check every 5 minutes
  useEffect(() => {
    if (!user || !token) return;

    const interval = setInterval(async () => {
      try {
        const newToken = await refreshAccessToken();
        if (newToken && newToken !== token) {
          setToken(newToken);
        }
      } catch (error) {
        console.warn("Background token refresh failed:", error);
        // Don't logout on background refresh failure - let the API interceptor handle it
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [user, token]);

  const login = useCallback(async (data: LoginRequest) => {
    try {
      const response = await loginUser(data);
      setUser(response.user);
      setToken(response.token);
      setIsGuest(false);
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  }, []);

  const register = useCallback(async (data: RegisterRequest) => {
    try {
      const response = await registerUser(data);
      setUser(response.user);
      setToken(response.token);
      setIsGuest(false);
    } catch (error: any) {
      if (error?.response?.status !== 409 && error?.response?.status !== 400) {
        console.error("Registration failed:", error);
      }
      throw error;
    }
  }, []);

  const socialLogin = useCallback(async (provider: "google" | "facebook", payload: { code?: string; accessToken?: string; credential?: string }) => {
    try {
      const response = await socialLoginUser(provider, payload);
      setUser(response.user);
      setToken(response.token);
      setIsGuest(false);
    } catch (error) {
      console.error("Social login failed:", error);
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } catch (error) {
      console.warn("Logout API call failed:", error);
      // Continue with local cleanup even if API call fails
    } finally {
      setUser(null);
      setToken(null);
      setIsGuest(false);
    }
  }, []);
  
  const continueAsGuest = useCallback(() => {
    setIsGuest(true);
  }, []);

  const updateSessionUser = useCallback((updates: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...updates } : null));
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      token,
      isAuthenticated: !!user && !!token,
      isGuest,
      isLoading,
      login,
      register,
      socialLogin,
      logout,
      continueAsGuest,
      updateSessionUser,
    }),
    [user, token, isGuest, isLoading, login, register, socialLogin, logout, continueAsGuest, updateSessionUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/* ─── Hook ───────────────────────────────────────────────── */

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
