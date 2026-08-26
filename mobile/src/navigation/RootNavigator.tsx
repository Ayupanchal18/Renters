import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, View, StyleSheet, AccessibilityInfo } from "react-native";
import LoginScreen from "../screens/auth/LoginScreen";
import RegisterScreen from "../screens/auth/RegisterScreen";
import ForgotPasswordScreen from "../screens/auth/ForgotPasswordScreen";
import ResetPasswordScreen from "../screens/auth/ResetPasswordScreen";
import MainTabs from "./MainTabs";
import PropertyDetailScreen from "../screens/properties/PropertyDetailScreen";
import AboutScreen from "../screens/info/AboutScreen";
import FAQScreen from "../screens/info/FAQScreen";
import ContactScreen from "../screens/info/ContactScreen";
import MessagesScreen from "../screens/profile/MessagesScreen";
import NotificationsScreen from "../screens/notifications/NotificationsScreen";
import PostPropertyScreen from "../screens/post-property/PostPropertyScreen";
import EditProfileScreen from "../screens/profile/EditProfileScreen";
import ChangePasswordScreen from "../screens/profile/ChangePasswordScreen";
import ChangePhoneScreen from "../screens/profile/ChangePhoneScreen";
import DeleteAccountScreen from "../screens/profile/DeleteAccountScreen";
import LegalScreen from "../screens/profile/LegalScreen";
import OTPVerificationScreen from "../screens/profile/OTPVerificationScreen";
import OnboardingScreen from "../screens/onboarding/OnboardingScreen";
import MyVisitsScreen from "../screens/profile/MyVisitsScreen";
import IncomingVisitsScreen from "../screens/profile/IncomingVisitsScreen";
import AvailabilityEditorScreen from "../screens/profile/AvailabilityEditorScreen";
import DocumentVaultScreen from "../screens/profile/DocumentVaultScreen";
import LeaseDraftScreen from "../screens/profile/LeaseDraftScreen";
import MaintenanceScreen from "../screens/maintenance/MaintenanceScreen";
import AiAssistantModal from "../components/ai/AiAssistantModal";
import { useAuth } from "../features/auth/AuthContext";
import { useMaintenance } from "../features/maintenance/MaintenanceContext";
import { useTheme } from "../theme/useTheme";
import type { RootStackParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { isAuthenticated, isGuest, isLoading, hasSeenOnboarding, completeOnboarding } = useAuth();
  const { isMaintenanceMode } = useMaintenance();
  const { colors, isDark } = useTheme();
  const [reduceMotion, setReduceMotion] = React.useState(false);

  React.useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      setReduceMotion(enabled);
    });
  }, []);

  if (isLoading) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Show maintenance screen for non-admin users when maintenance is active
  if (isMaintenanceMode) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false, animation: reduceMotion ? "none" : "fade" }}>
        <Stack.Screen name="Maintenance" component={MaintenanceScreen} />
      </Stack.Navigator>
    );
  }

  const hasAccess = isAuthenticated || isGuest;

  // ── First launch: show onboarding before anything else ──────
  if (!hasSeenOnboarding && !isAuthenticated) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false, animation: reduceMotion ? "none" : "fade" }}>
        <Stack.Screen name="Onboarding" options={{ animation: reduceMotion ? "none" : "fade" }}>
          {() => <OnboardingScreen onDone={completeOnboarding} />}
        </Stack.Screen>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
        <Stack.Screen name="Legal" component={LegalScreen} />
      </Stack.Navigator>
    );
  }

  return (
    <>
      <Stack.Navigator
      screenOptions={{
        headerTitleStyle: { fontWeight: "700" as const, color: colors.textPrimary },
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.primary,
        contentStyle: { backgroundColor: colors.background },
        animation: reduceMotion ? "fade" : "fade_from_bottom",
        gestureEnabled: true,
      }}
    >
      {!hasAccess ? (
        // Auth stack
        <>
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Register"
            component={RegisterScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ForgotPassword"
            component={ForgotPasswordScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ResetPassword"
            component={ResetPasswordScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Legal"
            component={LegalScreen}
            options={{ headerShown: false }}
          />
        </>
      ) : (
        // Authenticated or Guest stack
        <>
          <Stack.Screen
            name="MainTabs"
            component={MainTabs}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="PropertyDetail"
            component={PropertyDetailScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen name="About" component={AboutScreen} options={{ headerShown: false }} />
          <Stack.Screen name="FAQ" component={FAQScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Contact" component={ContactScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Messages" component={MessagesScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ headerShown: false }} />
          <Stack.Screen name="PostProperty" component={PostPropertyScreen} options={{ headerShown: false }} />
          <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ headerShown: false }} />
          <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{ headerShown: false }} />
          <Stack.Screen name="ChangePhone" component={ChangePhoneScreen} options={{ headerShown: false }} />
          <Stack.Screen name="DeleteAccount" component={DeleteAccountScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Legal" component={LegalScreen} options={{ headerShown: false }} />
          <Stack.Screen name="OTPVerification" component={OTPVerificationScreen} options={{ headerShown: false }} />
          <Stack.Screen name="MyVisits" component={MyVisitsScreen} options={{ headerShown: false }} />
          <Stack.Screen name="IncomingVisits" component={IncomingVisitsScreen} options={{ headerShown: false }} />
          <Stack.Screen name="AvailabilityEditor" component={AvailabilityEditorScreen} options={{ headerShown: false }} />
          <Stack.Screen name="DocumentVault" component={DocumentVaultScreen} options={{ headerShown: false }} />
          <Stack.Screen name="LeaseDraft" component={LeaseDraftScreen} options={{ headerShown: false }} />
        </>
      )}
    </Stack.Navigator>
    {hasAccess && <AiAssistantModal />}
    </>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
