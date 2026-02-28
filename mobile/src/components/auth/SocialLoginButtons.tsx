import "react-native-get-random-values";
import React, { useEffect, useState, useMemo } from "react";
import { StyleSheet, Text, View, Pressable, ActivityIndicator, Alert } from "react-native";
import Svg, { Path } from "react-native-svg";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import * as Facebook from "expo-auth-session/providers/facebook";
import { useTheme } from "../../theme/useTheme";
import { useAuth } from "../../features/auth/AuthContext";
import { apiClient } from "../../api/client";

WebBrowser.maybeCompleteAuthSession();

type Props = {
  disabled?: boolean;
};

export default function SocialLoginButtons({ disabled }: Props) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const { socialLogin } = useAuth();
  const [config, setConfig] = useState({ googleClientId: "", facebookAppId: "" });
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingFacebook, setLoadingFacebook] = useState(false);

  // Fetch the configuration dynamically from the backend
  useEffect(() => {
    apiClient
      .get("/api/config/public")
      .then((res: any) => {
        setConfig({
          googleClientId: res.data.googleClientId || "",
          facebookAppId: res.data.facebookAppId || "",
        });
      })
      .catch((e: any) => console.warn("Failed to fetch OAuth config:", e));
  }, []);

  const [gRequest, gResponse, gPromptAsync] = Google.useAuthRequest({
    clientId: config.googleClientId || "dummy",
    webClientId: config.googleClientId || "dummy",
  });

  const [fRequest, fResponse, fPromptAsync] = Facebook.useAuthRequest({
    clientId: config.facebookAppId || "dummy",
  });

  // Handle Google Response
  useEffect(() => {
    if (gResponse?.type === "success") {
      const { code, id_token, access_token } = gResponse.params;
      const credential = id_token || access_token;
      if (code || credential) {
        setLoadingGoogle(true);
        socialLogin("google", { code, credential })
          .catch((e: any) => Alert.alert("Google Login Error", e.message || "Failed to log in with Google."))
          .finally(() => setLoadingGoogle(false));
      }
    } else if (gResponse?.type === "error" || gResponse?.type === "cancel") {
      setLoadingGoogle(false);
      if (gResponse.type === "error") {
        Alert.alert("Google Error", gResponse.error?.message || "Something went wrong.");
      }
    }
  }, [gResponse, socialLogin]);

  // Handle Facebook Response
  useEffect(() => {
    if (fResponse?.type === "success") {
      const { access_token } = fResponse.params;
      if (access_token) {
        setLoadingFacebook(true);
        socialLogin("facebook", { accessToken: access_token })
          .catch((e: any) => Alert.alert("Facebook Login Error", e.message || "Failed to log in with Facebook."))
          .finally(() => setLoadingFacebook(false));
      }
    } else if (fResponse?.type === "error" || fResponse?.type === "cancel") {
      setLoadingFacebook(false);
      if (fResponse.type === "error") {
        Alert.alert("Facebook Error", fResponse.error?.message || "Something went wrong.");
      }
    }
  }, [fResponse, socialLogin]);

  const handleGooglePress = async () => {
    if (!config.googleClientId || config.googleClientId.includes("your_google_client_id")) {
      Alert.alert("Configuration Missing", "Google login is currently disabled. Please configure Client IDs.");
      return;
    }
    setLoadingGoogle(true);
    await gPromptAsync();
  };

  const handleFacebookPress = async () => {
    if (!config.facebookAppId || config.facebookAppId.includes("your_facebook_app_id")) {
      Alert.alert("Configuration Missing", "Facebook login is currently disabled. Please configure App IDs.");
      return;
    }
    setLoadingFacebook(true);
    await fPromptAsync();
  };

  const isAnyLoading = loadingGoogle || loadingFacebook || disabled;

  return (
    <View style={styles.container}>
      {/* Google Login Button */}
      <Pressable
        onPress={handleGooglePress}
        disabled={isAnyLoading}
        style={({ pressed }) => [
          styles.button,
          pressed && !isAnyLoading && styles.buttonPressed,
          isAnyLoading && styles.buttonDisabled,
        ]}
      >
        <View style={styles.buttonContent}>
          {loadingGoogle ? (
            <ActivityIndicator size="small" color="#4285F4" />
          ) : (
            <Svg width="20" height="20" viewBox="0 0 24 24">
              <Path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <Path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <Path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <Path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </Svg>
          )}
          <Text style={styles.buttonText}>Continue with Google</Text>
        </View>
      </Pressable>

      {/* Facebook Login Button */}
      <Pressable
        onPress={handleFacebookPress}
        disabled={isAnyLoading}
        style={({ pressed }) => [
          styles.button,
          pressed && !isAnyLoading && styles.buttonPressed,
          isAnyLoading && styles.buttonDisabled,
        ]}
      >
        <View style={styles.buttonContent}>
          {loadingFacebook ? (
            <ActivityIndicator size="small" color="#1877F2" />
          ) : (
            <Svg width="20" height="20" viewBox="0 0 24 24" fill="#1877F2">
              <Path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </Svg>
          )}
          <Text style={styles.buttonText}>Continue with Facebook</Text>
        </View>
      </Pressable>
    </View>
  );
}

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: {
    gap: 12,
  },
  button: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonPressed: {
    backgroundColor: isDark ? colors.background : "#f9fafb",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: "500",
    color: colors.textPrimary,
  },
});
