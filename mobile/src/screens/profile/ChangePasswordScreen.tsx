import React, { useState } from "react";
import { StyleSheet, Text, View, TextInput, Alert, ActivityIndicator } from "react-native";
import { useNavigation } from "@react-navigation/native";
import AppScreen from "../../components/layout/AppScreen";
import AppButton from "../../components/ui/AppButton";
import { colors } from "../../theme/tokens";

export default function ChangePasswordScreen() {
  const navigation = useNavigation();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);
    try {
      // Simulate API call as done in web version
      await new Promise((resolve) => setTimeout(resolve, 1000));
      Alert.alert("Success", "Password updated successfully");
      navigation.goBack();
    } catch (error) {
      Alert.alert("Error", "Failed to update password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppScreen title="Change Password" subtitle="Update your security settings" showBack>
      <View style={styles.container}>
        <Text style={styles.label}>Current Password</Text>
        <TextInput
          style={styles.input}
          value={currentPassword}
          onChangeText={setCurrentPassword}
          placeholder="Enter current password"
          placeholderTextColor={colors.textSecondary}
          secureTextEntry
        />

        <Text style={styles.label}>New Password</Text>
        <TextInput
          style={styles.input}
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder="Enter new password"
          placeholderTextColor={colors.textSecondary}
          secureTextEntry
        />

        <Text style={styles.label}>Confirm New Password</Text>
        <TextInput
          style={styles.input}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Confirm new password"
          placeholderTextColor={colors.textSecondary}
          secureTextEntry
        />

        <View style={styles.btnWrap}>
          <AppButton onPress={handleSave} disabled={isLoading}>
            {isLoading ? <ActivityIndicator color="#fff" /> : "Update Password"}
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
  btnWrap: {
    marginTop: 32,
  },
});
