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
} from "react-native";
import { Mail, Lock, ArrowRight, Shield, Sparkles, Eye, EyeOff } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AppButton from "../../components/ui/AppButton";
import SocialLoginButtons from "../../components/auth/SocialLoginButtons";
import { useAuth } from "../../features/auth/AuthContext";
import { useTheme } from "../../theme/useTheme";
import type { RootStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Login">;

export default function LoginScreen({ navigation }: Props) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const { login, continueAsGuest } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Please enter email and password.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await login({ email: email.trim().toLowerCase(), password });
    } catch (err: any) {
      console.error("Login detail err:", err);
      const msg =
        err?.response?.data?.error ??
        err?.response?.data?.message ??
        err?.message ??
        "Login failed. Please try again.";
      
      if (msg.toLowerCase().includes("credential") || msg.toLowerCase().includes("unauthorized")) {
        setError("Invalid email or password");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

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
          {/* Header */}
          <View style={styles.header}>
            <Image 
              source={require("../../../assets/images/logo.png")} 
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to manage your listings and messages</Text>
          </View>

          {/* Form container akin to Web's Card */}
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
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Password</Text>
                  <Pressable onPress={() => navigation.navigate("ForgotPassword" as any)}>
                    <Text style={styles.forgotPassword}>Forgot Password?</Text>
                  </Pressable>
                </View>
                <View style={styles.inputWrapper}>
                  <Lock size={20} color={colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    placeholder="Enter your password"
                    placeholderTextColor={colors.textSecondary}
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                    style={styles.input}
                    editable={!loading}
                    autoComplete="password"
                  />
                  <Pressable
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    {showPassword ? (
                      <EyeOff size={20} color={colors.textSecondary} />
                    ) : (
                      <Eye size={20} color={colors.textSecondary} />
                    )}
                  </Pressable>
                </View>
              </View>

              {loading ? (
                <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 12 }} />
              ) : (
                <AppButton onPress={handleLogin} style={styles.signInButton}>
                  <View style={styles.signInButtonContent}>
                    <Text style={styles.signInButtonText}>Sign In</Text>
                    <ArrowRight size={20} color="#ffffff" style={{ marginLeft: 8 }} />
                  </View>
                </AppButton>
              )}

              {/* Social Login Divider */}
              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <View style={styles.dividerTextContainer}>
                  <Text style={styles.dividerText}>or continue with</Text>
                </View>
              </View>

              {/* Social Login Buttons */}
              <SocialLoginButtons disabled={loading} />

              {/* Divider for Signup */}
              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <View style={styles.dividerTextContainer}>
                  <Text style={styles.dividerText}>New to Renters?</Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtonGroup}>
                <AppButton
                   variant="secondary"
                   onPress={() => navigation.navigate("Register")}
                   style={styles.actionButtonOutline}
                   textStyle={{ color: colors.textPrimary }}
                >
                  Create an Account
                </AppButton>

                <Pressable onPress={continueAsGuest} style={styles.ghostButton}>
                  <Text style={styles.ghostButtonText}>Continue as Guest</Text>
                </Pressable>
              </View>
            </View>
          </View>

          {/* Trust Badges */}
          <View style={styles.trustBadges}>
            <View style={styles.badgeItem}>
              <Shield size={16} color={colors.success} />
              <Text style={styles.badgeText}>Secure Login</Text>
            </View>
            <View style={styles.badgeItem}>
              <Sparkles size={16} color="#f59e0b" />
              <Text style={styles.badgeText}>100K+ Users</Text>
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
  scrollContent: { flexGrow: 1, justifyContent: "center", padding: 16 },
  header: { alignItems: "center", marginBottom: 20 },
  logo: {
    width: 60,
    height: 60,
    marginBottom: 12,
  },
  title: { fontSize: 22, fontWeight: "700", color: colors.textPrimary, marginBottom: 6 },
  subtitle: { fontSize: 13, color: colors.textSecondary, textAlign: "center" },
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
  labelRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  label: { fontSize: 13, fontWeight: "500", color: colors.textPrimary },
  forgotPassword: { fontSize: 11, fontWeight: "500", color: colors.primary },
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
  eyeButton: {
    padding: 4,
    marginLeft: 8,
  },
  signInButton: { height: 44, borderRadius: 10 },
  signInButtonContent: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  signInButtonText: { color: "#ffffff", fontSize: 15, fontWeight: "600" },
  dividerContainer: { marginVertical: 16, alignItems: "center", justifyContent: "center" },
  dividerLine: { position: "absolute", width: "100%", height: 1, backgroundColor: colors.border },
  dividerTextContainer: { backgroundColor: colors.surface, paddingHorizontal: 10 },
  dividerText: { fontSize: 11, color: colors.textSecondary },
  actionButtonGroup: { gap: 10 },
  actionButtonOutline: { backgroundColor: "transparent", borderWidth: 1, borderColor: colors.border, height: 44, borderRadius: 10 },
  ghostButton: { height: 40, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  ghostButtonText: { color: colors.primary, fontSize: 14, fontWeight: "500" },
  trustBadges: { flexDirection: "row", justifyContent: "center", gap: 20, marginTop: 20 },
  badgeItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  badgeText: { fontSize: 11, color: colors.textSecondary },
});
