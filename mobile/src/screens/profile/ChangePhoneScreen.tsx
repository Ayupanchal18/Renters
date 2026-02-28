import React, { useState } from "react";
import { StyleSheet, Text, View, TextInput, Alert, ActivityIndicator } from "react-native";
import { useNavigation } from "@react-navigation/native";
import AppScreen from "../../components/layout/AppScreen";
import AppButton from "../../components/ui/AppButton";
import { colors } from "../../theme/tokens";
import { useAuth } from "../../features/auth/AuthContext";

export default function ChangePhoneScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [showOTPInput, setShowOTPInput] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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
        await new Promise((resolve) => setTimeout(resolve, 1000));
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
        await new Promise((resolve) => setTimeout(resolve, 1000));
        Alert.alert("Success", "Phone number updated successfully");
        navigation.goBack();
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <AppScreen title="Change Phone" subtitle="Update your mobile number" showBack>
      <View style={styles.container}>
        {!showOTPInput ? (
          <>
            <Text style={styles.label}>Current Password</Text>
            <TextInput
              style={styles.input}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Enter current password"
              placeholderTextColor={colors.textSecondary}
              secureTextEntry
            />

            <Text style={styles.label}>Current Phone</Text>
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value={user?.phone || "Not set"}
              editable={false}
            />

            <Text style={styles.label}>New Phone Number</Text>
            <TextInput
              style={styles.input}
              value={newPhone}
              onChangeText={setNewPhone}
              placeholder="+1234567890"
              placeholderTextColor={colors.textSecondary}
              keyboardType="phone-pad"
            />
          </>
        ) : (
          <>
            <Text style={styles.label}>Verification Code</Text>
            <TextInput
              style={styles.input}
              value={otpCode}
              onChangeText={(text) => setOtpCode(text.replace(/[^0-9]/g, ""))}
              placeholder="Enter 6-digit code"
              placeholderTextColor={colors.textSecondary}
              keyboardType="number-pad"
              maxLength={6}
            />
            <Text style={styles.helperText}>Code sent to {newPhone}</Text>
          </>
        )}

        <View style={styles.btnWrap}>
          <AppButton onPress={handleAction} disabled={isLoading}>
            {isLoading ? <ActivityIndicator color="#fff" /> : (showOTPInput ? "Verify & Update Phone" : "Send Verification Code")}
          </AppButton>
        </View>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 6,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.textPrimary,
    backgroundColor: "#fff",
  },
  inputDisabled: {
    backgroundColor: "#f1f5f9",
    color: colors.textSecondary,
  },
  helperText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 6,
  },
  btnWrap: {
    marginTop: 32,
  },
});
