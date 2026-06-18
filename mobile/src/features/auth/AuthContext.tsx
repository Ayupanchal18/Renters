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
import AsyncStorage from "@react-native-async-storage/async-storage";
import { pushNotificationService } from "../notifications/services/pushNotificationService";
import { socketService } from "../messages/services/socketService";

const ONBOARDING_KEY = 'app:onboarding_done';

/* ─── Context Shape ──────────────────────────────────────── */

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  isLoading: boolean;
  hasSeenOnboarding: boolean;
  completeOnboarding: () => void;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  socialLogin: (provider: "google" | "facebook", payload: { code?: string; accessToken?: string; credential?: string }) => Promise<void>;
  logout: () => Promise<void>;
  continueAsGuest: () => void;
  updateSessionUser: (data: Partial<User>) => void;
  setAuthData: (user: User, token: string) => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

/* ─── Provider ───────────────────────────────────────────── */

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);

  // Function to register push notifications
  const setupPushNotifications = useCallback(async () => {
    try {
      const token = await pushNotificationService.registerForPushNotificationsAsync();
      if (token) {
        await pushNotificationService.syncTokenWithServer(token);
        // Refresh user data to see the new token in state
        const updatedUser = await fetchCurrentUser();
        if (updatedUser) setUser(updatedUser);
      }
    } catch (error) {
      console.warn("Failed to setup push notifications:", error);
    }
  }, []);

  // Restore session on cold start
  useEffect(() => {
    (async () => {
      try {
        // Check onboarding flag first (fast read)
        const onboardingDone = await AsyncStorage.getItem(ONBOARDING_KEY);
        if (onboardingDone === 'true') setHasSeenOnboarding(true);

        const storedToken = await getAccessToken();
        if (storedToken) {
          setToken(storedToken);
          const currentUser = await fetchCurrentUser();
          if (currentUser) {
            setUser(currentUser);
            // Setup notifications on cold start if authenticated
            setupPushNotifications();
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

  // Manage socket connection lifecycle based on auth token
  useEffect(() => {
    if (token) {
      socketService.connect(token);
    } else {
      socketService.disconnect();
    }
    return () => {
      socketService.disconnect();
    };
  }, [token]);

  const login = useCallback(async (data: LoginRequest) => {
    try {
      const response = await loginUser(data);
      setUser(response.user);
      setToken(response.token);
      setIsGuest(false);
      // Register for push notifications after login
      setupPushNotifications();
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
      // Register for push notifications after registration
      setupPushNotifications();
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
      // Register for push notifications after social login
      setupPushNotifications();
    } catch (error) {
      console.error("Social login failed:", error);
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      // Unregister push token before logout
      await pushNotificationService.unregisterTokenFromServer().catch(() => {});
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

  const completeOnboarding = useCallback(() => {
    setHasSeenOnboarding(true);
    AsyncStorage.setItem(ONBOARDING_KEY, 'true').catch(() => {});
  }, []);

  const updateSessionUser = useCallback((updates: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...updates } : null));
  }, []);

  const setAuthData = useCallback((newUser: User, newToken: string) => {
    setUser(newUser);
    setToken(newToken);
    setIsGuest(false);
    setupPushNotifications();
  }, [setupPushNotifications]);

  const value = useMemo<AuthState>(
    () => ({
      user,
      token,
      isAuthenticated: !!user && !!token,
      isGuest,
      isLoading,
      hasSeenOnboarding,
      completeOnboarding,
      login,
      register,
      socialLogin,
      logout,
      continueAsGuest,
      updateSessionUser,
      setAuthData,
    }),
    [user, token, isGuest, isLoading, hasSeenOnboarding, completeOnboarding, login, register, socialLogin, logout, continueAsGuest, updateSessionUser, setAuthData]
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
