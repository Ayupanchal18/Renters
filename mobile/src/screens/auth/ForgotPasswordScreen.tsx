import React, { useState, useMemo } from "react";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  StyleSheet,
  TextInput,
  View,
  Text,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
  Image,
  Alert,
} from "react-native";
import { Mail, ArrowLeft, Shield, CheckCircle } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AppButton from "../../components/ui/AppButton";
import { useTheme } from "../../theme/useTheme";
import type { RootStackParamList } from "../../navigation/types";
import { apiClient } from "../../api/client";

type Props = NativeStackScreenProps<RootStackParamList, "ForgotPassword">;

export default function ForgotPasswordScreen({ navigation }: Props) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    setError("");
    setLoading(true);
    
    try {
      await apiClient.post("/api/auth/forgot-password", {
        email: email.trim().toLowerCase(),
      });
      setSuccess(true);
    } catch (err: any) {
      console.error("Forgot password error:", err);
      const msg =
        err?.response?.data?.error ??
        err?.response?.data?.message ??
        err?.message ??
        "Failed to send reset email. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigation.goBack();
  };

  if (success) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.successContainer}>
            <CheckCircle size={64} color={colors.success} />
            <Text style={styles.successTitle}>Check Your Email</Text>
            <Text style={styles.successMessage}>
              We've sent a password reset link to {email}
            </Text>
            <Text style={styles.successSubtext}>
              Click the link in the email to reset your password. If you don't see it, check your spam folder.
            </Text>
            <AppButton onPress={handleBackToLogin} style={styles.backButton}>
              <Text style={styles.backButtonText}>Back to Login</Text>
            </AppButton>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header with Back Button */}
          <View style={styles.headerRow}>
            <Pressable onPress={handleBackToLogin} style={styles.backIconButton}>
              <ArrowLeft size={24} color={colors.textPrimary} />
            </Pressable>
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Image 
              source={require("../../../assets/images/logo.png")} 
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>Forgot Password?</Text>
            <Text style={styles.subtitle}>
              Enter your email address and we'll send you a link to reset your password
            </Text>
          </View>

          {/* Form Container */}
          <View style={styles.card}>
            {error ? (
              <View style={styles.errorContainer}>
                <Shield size={16} color={colors.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address</Text>
                <View style={styles.inputWrapper}>
                  <Mail size={20} color={colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    autoCapitalize="none"
                    keyboardType="email-address"
                    placeholder="you@example.com"
                    placeholderTextColor={colors.textSecondary}
                    value={email}
                    onChangeText={setEmail}
                    style={styles.input}
                    editable={!loading}
                    autoComplete="email"
                    autoFocus
                  />
                </View>
              </View>

              {loading ? (
                <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 12 }} />
              ) : (
                <AppButton onPress={handleForgotPassword} style={styles.resetButton}>
                  <Text style={styles.resetButtonText}>Send Reset Link</Text>
                </AppButton>
              )}

              <Pressable onPress={handleBackToLogin} style={styles.backToLoginButton}>
                <Text style={styles.backToLoginText}>
                  Remember your password? <Text style={styles.backToLoginBold}>Sign In</Text>
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  container: { flex: 1, justifyContent: "center", padding: 16 },
  scrollContent: { flexGrow: 1, justifyContent: "center", padding: 16 },
  headerRow: { 
    flexDirection: "row", 
    alignItems: "center", 
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  backIconButton: {
    padding: 8,
    borderRadius: 8,
  },
  header: { alignItems: "center", marginBottom: 20 },
  logo: {
    width: 60,
    height: 60,
    marginBottom: 12,
  },
  title: { fontSize: 22, fontWeight: "700", color: colors.textPrimary, marginBottom: 6 },
  subtitle: { 
    fontSize: 13, 
    color: colors.textSecondary, 
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDark ? 0.2 : 0.03,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  form: { gap: 16 },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: isDark ? 'rgba(180, 35, 24, 0.1)' : "#fef3f2",
    padding: 10,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: isDark ? colors.error : "#fee4e2",
    gap: 6,
  },
  errorText: { color: colors.error, fontSize: 12, flex: 1 },
  inputGroup: { gap: 6 },
  label: { fontSize: 13, fontWeight: "500", color: colors.textPrimary },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.input,
    height: 44,
    paddingHorizontal: 12,
  },
  inputIcon: { 
    marginRight: 8,
  },
  input: { 
    flex: 1, 
    height: "100%", 
    fontSize: 14, 
    color: colors.textPrimary,
  },
  resetButton: { height: 44, borderRadius: 10 },
  resetButtonText: { color: "#ffffff", fontSize: 15, fontWeight: "600" },
  backToLoginButton: { alignItems: "center", paddingVertical: 10 },
  backToLoginText: { color: colors.textSecondary, fontSize: 13 },
  backToLoginBold: { color: colors.primary, fontWeight: "700" },
  
  // Success state styles
  successContainer: {
    alignItems: "center",
    paddingHorizontal: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.textPrimary,
    marginTop: 20,
    marginBottom: 12,
  },
  successMessage: {
    fontSize: 16,
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: 8,
    fontWeight: "500",
  },
  successSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 32,
  },
  backButton: { 
    height: 44, 
    borderRadius: 10,
    minWidth: 200,
  },
  backButtonText: { 
    color: "#ffffff", 
    fontSize: 15, 
    fontWeight: "600" 
  },
});