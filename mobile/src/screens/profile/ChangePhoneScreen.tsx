import React, { useState, useMemo } from "react";
import { StyleSheet, Text, View, TextInput, Alert, ActivityIndicator, Pressable, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Lock, Eye, EyeOff, Phone, Hash, ShieldCheck } from "lucide-react-native";
import AppScreen from "../../components/layout/AppScreen";
import AppButton from "../../components/ui/AppButton";
import { useTheme } from "../../theme/useTheme";
import { useAuth } from "../../features/auth/AuthContext";

export default function ChangePhoneScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [showOTPInput, setShowOTPInput] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [showPassword, setShowPassword] = useState(false);

  const handleAction = async () => {
    if (!showOTPInput) {
      if (!currentPassword) {
        Alert.alert("Error", "Current password is required");
        return;
      }
      if (!newPhone) {
        Alert.alert("Error", "New phone number is required");
        return;
      }
      if (newPhone === user?.phone) {
        Alert.alert("Error", "New phone number must be different");
        return;
      }

      setIsLoading(true);
      try {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        setShowOTPInput(true);
        Alert.alert("Success", `Verification code sent to ${newPhone}`);
      } finally {
        setIsLoading(false);
      }
    } else {
      if (!otpCode || otpCode.length !== 6) {
        Alert.alert("Error", "Please enter the complete 6-digit verification code");
        return;
      }

      setIsLoading(true);
      try {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        Alert.alert("Success", "Phone number updated successfully");
        navigation.goBack();
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <AppScreen title="Mobile" subtitle="Update your contact information" showBack>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>{showOTPInput ? "Verify OTP" : "Change Phone"}</Text>
            
            {!showOTPInput ? (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Current Password</Text>
                  <View style={styles.inputWrapper}>
                    <Lock size={18} color={colors.textSecondary} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      value={currentPassword}
                      onChangeText={setCurrentPassword}
                      placeholder="Enter current password"
                      placeholderTextColor={isDark ? "rgba(255,255,255,0.4)" : "#94a3b8"}
                      secureTextEntry={!showPassword}
                    />
                    <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                      {showPassword ? <EyeOff size={18} color={colors.textSecondary} /> : <Eye size={18} color={colors.textSecondary} />}
                    </Pressable>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Current Phone</Text>
                  <View style={[styles.inputWrapper, styles.inputDisabled]}>
                    <Phone size={18} color={colors.textSecondary} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, { color: colors.textSecondary }]}
                      value={user?.phone || "Not set"}
                      editable={false}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>New Phone Number</Text>
                  <View style={styles.inputWrapper}>
                    <Phone size={18} color={colors.textSecondary} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      value={newPhone}
                      onChangeText={setNewPhone}
                      placeholder="+1234567890"
                      placeholderTextColor={isDark ? "rgba(255,255,255,0.4)" : "#94a3b8"}
                      keyboardType="phone-pad"
                    />
                  </View>
                </View>
              </>
            ) : (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Verification Code</Text>
                  <View style={styles.inputWrapper}>
                    <Hash size={18} color={colors.textSecondary} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      value={otpCode}
                      onChangeText={(text) => setOtpCode(text.replace(/[^0-9]/g, ""))}
                      placeholder="Enter 6-digit code"
                      placeholderTextColor={isDark ? "rgba(255,255,255,0.4)" : "#94a3b8"}
                      keyboardType="number-pad"
                      maxLength={6}
                    />
                  </View>
                  <Text style={styles.helperText}>Verification code was sent to {newPhone}</Text>
                </View>
              </>
            )}

            <View style={styles.btnWrap}>
              <AppButton 
                onPress={handleAction} 
                disabled={isLoading}
                style={styles.button}
              >
                {isLoading ? <ActivityIndicator color="#fff" /> : (showOTPInput ? "Verify & Update Phone" : "Send Verification Code")}
              </AppButton>
            </View>
          </View>
          
          <Text style={styles.footerInfo}>
            We'll send a verification code to your new mobile number. 
            Data rates may apply.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </AppScreen>
  );
}

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDark ? 0.3 : 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: colors.textPrimary,
    marginBottom: 24,
    letterSpacing: -0.5,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : colors.input || '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: 16,
  },
  inputDisabled: {
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : '#F1F5F9',
    opacity: 0.8,
  },
  inputIcon: {
    marginRight: 12,
    opacity: 0.7,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  eyeIcon: {
    padding: 8,
    marginLeft: 4,
  },
  helperText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 8,
    marginLeft: 4,
  },
  btnWrap: {
    marginTop: 12,
  },
  button: {
    height: 56,
    borderRadius: 14,
  },
  footerInfo: {
    marginTop: 24,
    textAlign: 'center',
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
    paddingHorizontal: 10,
  }
});

