import React, { useState } from "react";
import { StyleSheet, Text, View, TextInput, Alert, ActivityIndicator, Switch, ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import AppScreen from "../../components/layout/AppScreen";
import AppButton from "../../components/ui/AppButton";
import { colors } from "../../theme/tokens";
import { useAuth } from "../../features/auth/AuthContext";
import { getAccessToken } from "../../features/auth/services/tokenStorage";
import { env } from "../../config/env";

export default function DeleteAccountScreen() {
  const { user, logout } = useAuth();
  const navigation = useNavigation();
  const [currentPassword, setCurrentPassword] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check if user is OAuth user (no password required)
  const isOAuthUser = user?.authProvider && user?.authProvider !== "local";

  const handleDelete = async () => {
    if (!isOAuthUser && !currentPassword) {
      Alert.alert("Error", "Password is required to confirm account deletion");
      return;
    }
    if (deleteConfirmation !== "DELETE_MY_ACCOUNT") {
      Alert.alert("Error", 'Please type "DELETE_MY_ACCOUNT" exactly to confirm deletion');
      return;
    }
    if (!isConfirmed) {
      Alert.alert("Error", "You must confirm that you understand this action is permanent");
      return;
    }

    Alert.alert(
      "Final Confirmation",
      "Are you absolutely sure you want to permanently delete your account?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete Account", 
          style: "destructive",
          onPress: performDelete
        }
      ]
    );
  };

  const performDelete = async () => {
    setIsLoading(true);
    try {
      const token = await getAccessToken();
      const response = await fetch(`${env.apiBaseUrl}/api/privacy/delete-account`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...(currentPassword && { password: currentPassword }),
          softDelete: false,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || "Failed to delete account");
      }

      Alert.alert("Account Deleted", "Your account has been permanently deleted.");
      await logout();
    } catch (error: any) {
      console.error("Delete account error:", error);
      Alert.alert("Error", error.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppScreen title="Delete Account" subtitle="Permanently remove your data" showBack>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.warningBox}>
          <Text style={styles.warningTitle}>⚠️ Permanent Account Deletion</Text>
          <Text style={styles.warningText}>
            This action cannot be undone. Once you delete your account, all of the following will be permanently removed:{`\n\n`}
            • Your profile and personal information{`\n`}
            • All property listings and photos{`\n`}
            • Message conversations and history{`\n`}
            • Wishlist and saved searches{`\n`}
            • Account settings and preferences{`\n\n`}
            You will not be able to recover this data or reactivate your account.
          </Text>
        </View>

        {!isOAuthUser && (
          <View style={styles.fieldWrap}>
            <Text style={styles.label}>Current Password</Text>
            <TextInput
              style={styles.input}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Enter current password"
              placeholderTextColor={colors.textSecondary}
              secureTextEntry
            />
          </View>
        )}

        <View style={styles.fieldWrap}>
          <Text style={styles.label}>Type "DELETE_MY_ACCOUNT" to confirm</Text>
          <TextInput
            style={styles.input}
            value={deleteConfirmation}
            onChangeText={setDeleteConfirmation}
            placeholder="DELETE_MY_ACCOUNT"
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="none"
          />
        </View>

        <View style={styles.confirmBox}>
          <Switch
            value={isConfirmed}
            onValueChange={setIsConfirmed}
            trackColor={{ false: colors.border, true: colors.error }}
          />
          <Text style={styles.confirmText}>
            I understand that this action is permanent and cannot be undone. I want to delete my account and all associated data.
          </Text>
        </View>

        <View style={styles.btnWrap}>
          <AppButton 
            onPress={handleDelete} 
            disabled={isLoading || !isConfirmed || deleteConfirmation !== "DELETE_MY_ACCOUNT"} 
            style={styles.deleteBtn}
          >
            {isLoading ? <ActivityIndicator color="#fff" /> : "Delete Account"}
          </AppButton>
        </View>
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  warningBox: {
    backgroundColor: "#fef2f2", // light red
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#b91c1c",
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: "#991b1b",
    lineHeight: 20,
  },
  fieldWrap: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 6,
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
  confirmBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#fffbeb", // light yellow
    borderWidth: 1,
    borderColor: "#fde68a",
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 24,
    gap: 12,
  },
  confirmText: {
    flex: 1,
    fontSize: 14,
    color: "#92400e",
    lineHeight: 20,
  },
  btnWrap: {
    marginTop: 8,
  },
  deleteBtn: {
    backgroundColor: colors.error,
  },
});
