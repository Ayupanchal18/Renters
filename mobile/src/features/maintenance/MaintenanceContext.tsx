import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { AppState } from "react-native";
import { env } from "../../config/env";
import { apiClient } from "../../api/client";
import { useAuth } from "../../features/auth/AuthContext";

/* ─── Context Shape ──────────────────────────────────────── */

interface MaintenanceState {
  isMaintenanceMode: boolean;
  message: string | null;
  estimatedEndTime: string | null;
  checkNow: () => Promise<void>;
}

const MaintenanceContext = createContext<MaintenanceState | undefined>(undefined);

/* ─── Polling Intervals ──────────────────────────────────── */
const POLL_INTERVAL_NORMAL = 5 * 60 * 1000;   // 5 min when not in maintenance
const POLL_INTERVAL_ACTIVE = 30 * 1000;        // 30s when maintenance is active

/* ─── Provider ───────────────────────────────────────────── */

export function MaintenanceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [estimatedEndTime, setEstimatedEndTime] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  const checkMaintenanceStatus = useCallback(async () => {
    try {
      const res = await fetch(`${env.apiBaseUrl}/api/maintenance/status`);
      const json = await res.json();

      if (json.success && json.data) {
        const enabled = json.data.enabled === true;
        setIsMaintenanceMode(enabled);
        setMessage(json.data.message || null);
        setEstimatedEndTime(json.data.estimatedEndTime || null);
      } else {
        setIsMaintenanceMode(false);
      }
    } catch {
      // Network error — don't flip to maintenance for connectivity issues
    }
  }, []);

  // Initial check + periodic polling
  useEffect(() => {
    checkMaintenanceStatus();

    const pollMs = isMaintenanceMode ? POLL_INTERVAL_ACTIVE : POLL_INTERVAL_NORMAL;

    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(checkMaintenanceStatus, pollMs);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isMaintenanceMode, checkMaintenanceStatus]);

  // Re-check when app comes back to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        checkMaintenanceStatus();
      }
    });
    return () => subscription.remove();
  }, [checkMaintenanceStatus]);

  // Intercept 503 responses from API client
  useEffect(() => {
    const interceptorId = apiClient.interceptors.response.use(
      (response) => response,
      (error) => {
        if (
          error?.response?.status === 503 &&
          error?.response?.data?.maintenance === true
        ) {
          setIsMaintenanceMode(true);
          setMessage(error.response.data.message || null);
          setEstimatedEndTime(error.response.data.estimatedEndTime || null);
        }
        return Promise.reject(error);
      }
    );

    return () => {
      apiClient.interceptors.response.eject(interceptorId);
    };
  }, []);

  // If user is admin, bypass maintenance mode entirely
  const effectiveMaintenanceMode = isMaintenanceMode && !isAdmin;

  const value: MaintenanceState = {
    isMaintenanceMode: effectiveMaintenanceMode,
    message,
    estimatedEndTime,
    checkNow: checkMaintenanceStatus,
  };

  return (
    <MaintenanceContext.Provider value={value}>
      {children}
    </MaintenanceContext.Provider>
  );
}

/* ─── Hook ───────────────────────────────────────────────── */

export function useMaintenance(): MaintenanceState {
  const ctx = useContext(MaintenanceContext);
  if (!ctx) {
    throw new Error("useMaintenance must be used within a MaintenanceProvider");
  }
  return ctx;
}
