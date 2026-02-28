import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import type { User, LoginRequest, RegisterRequest } from "../../types/types";
import {
  loginUser,
  registerUser,
  logoutUser,
  fetchCurrentUser,
  socialLoginUser,
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
      } catch {
        await clearTokens();
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (data: LoginRequest) => {
    const response = await loginUser(data);
    setUser(response.user);
    setToken(response.token);
    setIsGuest(false);
  }, []);

  const register = useCallback(async (data: RegisterRequest) => {
    const response = await registerUser(data);
    setUser(response.user);
    setToken(response.token);
    setIsGuest(false);
  }, []);

  const socialLogin = useCallback(async (provider: "google" | "facebook", payload: { code?: string; accessToken?: string; credential?: string }) => {
    const response = await socialLoginUser(provider, payload);
    setUser(response.user);
    setToken(response.token);
    setIsGuest(false);
  }, []);

  const logout = useCallback(async () => {
    await logoutUser();
    setUser(null);
    setToken(null);
    setIsGuest(false);
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
