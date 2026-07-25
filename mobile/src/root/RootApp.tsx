import React from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "../state/queryClient";
import { AuthProvider } from "../features/auth/AuthContext";
import { MaintenanceProvider } from "../features/maintenance/MaintenanceContext";
import RootNavigator from "../navigation/RootNavigator";
import { ThemeProvider, useTheme } from "../theme/ThemeContext";
import NetworkWarning from "../components/ui/NetworkWarning";
import * as Notifications from 'expo-notifications';

// Handle notifications when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  } as any),
});

function RootAppContent() {
  const { colors, isDark } = useTheme();
  
  const navTheme = {
    dark: isDark,
    colors: {
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.textPrimary,
      border: colors.border,
      notification: colors.error,
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <NetworkWarning />
      <RootNavigator />
    </NavigationContainer>
  );
}

export default function RootApp() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MaintenanceProvider>
          <SafeAreaProvider>
            <ThemeProvider>
              <RootAppContent />
            </ThemeProvider>
          </SafeAreaProvider>
        </MaintenanceProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
