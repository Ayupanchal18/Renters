import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, TextInput, Alert, ActivityIndicator } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import AppScreen from "../../components/layout/AppScreen";
import AppButton from "../../components/ui/AppButton";
import { colors } from "../../theme/tokens";
import { getAccessToken } from "../../features/auth/services/tokenStorage";
import { env } from "../../config/env";
import { RootStackParamList } from "../../navigation/types";
import { useAuth } from "../../features/auth/AuthContext";

type OTPRouteProp = RouteProp<RootStackParamList, "OTPVerification">;

export default function OTPVerificationScreen() {
  const route = useRoute<OTPRouteProp>();
  const navigation = useNavigation();
  const { fetchCurrentUser } = useAuth() as any; // We might need to refresh user or just rely on global sync
  const { type, contact } = route.params;

  const [otpCode, setOtpCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleVerify = async () => {
    if (otpCode.length !== 6) {
      Alert.alert("Error", "Please enter the complete 6-digit code");
      return;
    }

    setIsLoading(true);
    try {
      const token = await getAccessToken();
      const response = await fetch(`${env.apiBaseUrl}/api/verification/verify-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ type, contact, otp: otpCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || "Verification failed");
      }

      if (data.success && data.verified) {
        Alert.alert("Success", `${type === "email" ? "Email" : "Phone number"} verified successfully!`);
        // If we had a direct fetchCurrentUser method globally, we'd invoke it here. For now we assume a refresh mechanism exists or user will see it next launch, or we can rely on an AuthContext hook if available.
        navigation.goBack();
      } else {
        throw new Error(data.message || "Verification failed");
      }
    } catch (error: any) {
      console.error("OTP Error:", error);
      Alert.alert("Error", error.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setIsLoading(true);
    try {
      const token = await getAccessToken();
      const response = await fetch(`${env.apiBaseUrl}/api/verification/send-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ type, contact }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || data.error || "Failed to resend OTP");
      }
      
      Alert.alert("Success", "A new verification code has been sent!");
      setResendCooldown(60);
      setOtpCode("");
    } catch (error: any) {
      Alert.alert("Error", error.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppScreen title={`Verify ${type === "email" ? "Email" : "Phone"}`} subtitle="Enter your verification code" showBack>
      <View style={styles.container}>
        <Text style={styles.infoText}>
          We've sent a 6-digit verification code to
          <Text style={styles.contactText}> {contact}</Text>
        </Text>

        <View style={styles.inputWrap}>
          <Text style={styles.label}>Verification Code</Text>
          <TextInput
            style={styles.input}
            value={otpCode}
            onChangeText={(t) => setOtpCode(t.replace(/[^0-9]/g, ""))}
            keyboardType="number-pad"
            maxLength={6}
            placeholder="000000"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <View style={styles.btnWrap}>
          <AppButton onPress={handleVerify} disabled={isLoading || otpCode.length !== 6}>
            {isLoading ? <ActivityIndicator color="#fff" /> : "Verify Code"}
          </AppButton>
          
          <AppButton 
            variant="secondary" 
            onPress={handleResend} 
            disabled={isLoading || resendCooldown > 0} 
            style={styles.resendBtn}
          >
            {resendCooldown > 0 ? `Resend Code in ${resendCooldown}s` : "Resend Verification Code"}
          </AppButton>
        </View>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingTop: 8,
  },
  infoText: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: 24,
  },
  contactText: {
    fontWeight: "600",
    color: colors.textPrimary,
  },
  inputWrap: {
    marginBottom: 32,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: 4,
    textAlign: "center",
    color: colors.textPrimary,
    backgroundColor: "#fff",
  },
  btnWrap: {
    gap: 16,
  },
  resendBtn: {
    borderWidth: 0,
    backgroundColor: "#f1f5f9",
  }
});
