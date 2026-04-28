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
  Switch,
  Image,
} from "react-native";
import { User, Mail, Phone, Lock, Shield, Sparkles, Eye, EyeOff } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AppButton from "../../components/ui/AppButton";
import SocialLoginButtons from "../../components/auth/SocialLoginButtons";
import { useAuth } from "../../features/auth/AuthContext";
import { useTheme } from "../../theme/useTheme";
import type { RootStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Register">;

export default function RegisterScreen({ navigation }: Props) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const { register, continueAsGuest } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState<"buyer" | "seller" | "agent">("buyer");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError("Name, email, and password are required.");
      return;
    }
    if (!acceptTerms || !acceptPrivacy) {
      setError("Please accept Terms and Privacy Policy.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        phone: phone.trim() || undefined,
        userType,
        acceptTerms: true,
        acceptPrivacyPolicy: true,
      });
    } catch (err: any) {
      if (err?.response?.status !== 409 && err?.response?.status !== 400) {
        console.error("Register detail err:", err);
      }
      const data = err?.response?.data;
      let msg = data?.error ?? data?.message ?? err?.message ?? "Registration failed.";
      if (data?.details && Array.isArray(data.details)) {
        msg = data.details.map((d: any) => d.message).join(". ");
      }
      setError(`${msg} (Debug: ${err?.name})`);
    } finally {
      setLoading(false);
    }
  };

  const userTypes: Array<{ value: "buyer" | "seller" | "agent"; label: string }> = [
    { value: "buyer", label: "Buyer / Tenant" },
    { value: "seller", label: "Owner / Seller" },
    { value: "agent", label: "Agent" },
  ];

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
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join Renters to find or list properties</Text>
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
                <Text style={styles.label}>Full Name</Text>
                <View style={styles.inputWrapper}>
                  <User size={20} color={colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    placeholder="e.g. Rahul Sharma"
                    placeholderTextColor={colors.textSecondary}
                    value={name}
                    onChangeText={setName}
                    style={styles.input}
                    editable={!loading}
                    autoComplete="name"
                  />
                </View>
              </View>

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
                <Text style={styles.label}>Phone (optional)</Text>
                <View style={styles.inputWrapper}>
                  <Phone size={20} color={colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    keyboardType="phone-pad"
                    placeholder="+91 98765 43210"
                    placeholderTextColor={colors.textSecondary}
                    value={phone}
                    onChangeText={setPhone}
                    style={styles.input}
                    editable={!loading}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.inputWrapper}>
                  <Lock size={20} color={colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    placeholder="Min 8 chars"
                    placeholderTextColor={colors.textSecondary}
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                    style={styles.input}
                    editable={!loading}
                    autoComplete="password-new"
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

              {/* User type selector */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>I am a:</Text>
                <View style={styles.chipRow}>
                  {userTypes.map((t) => (
                    <Pressable
                      key={t.value}
                      onPress={() => setUserType(t.value)}
                      style={[
                        styles.chip,
                        userType === t.value && styles.chipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          userType === t.value && styles.chipTextActive,
                        ]}
                      >
                        {t.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Consent switches */}
              <View style={styles.switchGroup}>
                <View style={styles.switchRow}>
                  <Switch
                    value={acceptTerms}
                    onValueChange={setAcceptTerms}
                    trackColor={{ false: colors.border, true: colors.primary }}
                  />
                  <Text style={styles.switchLabel}>
                    I accept the{" "}
                    <Text 
                      style={{ color: colors.primary, textDecorationLine: "underline" }} 
                      onPress={() => navigation.navigate("Legal")}
                    >
                      Terms of Service
                    </Text>
                  </Text>
                </View>

                <View style={styles.switchRow}>
                  <Switch
                    value={acceptPrivacy}
                    onValueChange={setAcceptPrivacy}
                    trackColor={{ false: colors.border, true: colors.primary }}
                  />
                  <Text style={styles.switchLabel}>
                    I accept the{" "}
                    <Text 
                      style={{ color: colors.primary, textDecorationLine: "underline" }} 
                      onPress={() => navigation.navigate("Legal")}
                    >
                      Privacy Policy
                    </Text>
                  </Text>
                </View>
              </View>

              {loading ? (
                <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 12 }} />
              ) : (
                <View style={styles.buttonGroup}>
                  <AppButton onPress={handleRegister} style={styles.signInButton}>
                    <Text style={styles.signInButtonText}>Create Account</Text>
                  </AppButton>
                  <AppButton 
                    variant="secondary" 
                    onPress={continueAsGuest} 
                    style={styles.actionButtonOutline}
                    textStyle={{ color: colors.textPrimary }}
                  >
                    Continue as Guest
                  </AppButton>
                </View>
              )}

              {/* Social Login Divider */}
              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <View style={styles.dividerTextContainer}>
                  <Text style={styles.dividerText}>or continue with</Text>
                </View>
              </View>

              <SocialLoginButtons disabled={loading} />

              {/* Sign In Link */}
              <Pressable onPress={() => navigation.goBack()} style={styles.linkWrap}>
                <Text style={styles.linkText}>
                  Already have an account?{" "}
                  <Text style={styles.linkBold}>Sign In</Text>
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Trust Badges */}
          <View style={styles.trustBadges}>
            <View style={styles.badgeItem}>
              <Shield size={16} color={colors.success} />
              <Text style={styles.badgeText}>Secure & Encrypted</Text>
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
  form: { gap: 14 },
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
  eyeButton: {
    padding: 4,
    marginLeft: 8,
  },
  chipRow: { flexDirection: "row", gap: 6, flexWrap: "wrap", marginTop: 4 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 12, color: colors.textSecondary },
  chipTextActive: { color: "#ffffff", fontWeight: "600" },
  switchGroup: { gap: 8, marginVertical: 6 },
  switchRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  switchLabel: { color: colors.textSecondary, fontSize: 12, flexShrink: 1 },
  buttonGroup: { gap: 10, marginTop: 6 },
  signInButton: { height: 44, borderRadius: 10 },
  signInButtonText: { color: "#ffffff", fontSize: 15, fontWeight: "600" },
  actionButtonOutline: { backgroundColor: "transparent", borderWidth: 1, borderColor: colors.border, height: 44, borderRadius: 10 },
  dividerContainer: { marginVertical: 12, alignItems: "center", justifyContent: "center" },
  dividerLine: { position: "absolute", width: "100%", height: 1, backgroundColor: colors.border },
  dividerTextContainer: { backgroundColor: colors.surface, paddingHorizontal: 10 },
  dividerText: { fontSize: 11, color: colors.textSecondary },
  linkWrap: { alignItems: "center", paddingVertical: 10 },
  linkText: { color: colors.textSecondary, fontSize: 13 },
  linkBold: { color: colors.primary, fontWeight: "700" },
  trustBadges: { flexDirection: "row", justifyContent: "center", gap: 20, marginTop: 20 },
  badgeItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  badgeText: { fontSize: 11, color: colors.textSecondary },
});
