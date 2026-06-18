import React, { useState, useMemo } from "react";
import { StyleSheet, Text, View, TextInput, Alert, ActivityIndicator, Switch, ScrollView, Pressable, KeyboardAvoidingView, Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { AlertTriangle, Lock, Trash2, Eye, EyeOff, Info } from "lucide-react-native";
import AppScreen from "../../components/layout/AppScreen";
import AppButton from "../../components/ui/AppButton";
import { useTheme } from "../../theme/useTheme";
import { useAuth } from "../../features/auth/AuthContext";
import { getAccessToken } from "../../features/auth/services/tokenStorage";
import { env } from "../../config/env";
import { pushNotificationService } from "../../features/notifications/services/pushNotificationService";

export default function DeleteAccountScreen() {
  const { user, logout } = useAuth();
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  const [currentPassword, setCurrentPassword] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

      // Unregister push token AND unsubscribe from topics
      await pushNotificationService.unregisterTokenFromServer(true).catch(() => {});

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
    <AppScreen title="Privacy" subtitle="Manage your account data" showBack>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
          <View style={styles.warningCard}>
            <View style={styles.warningHeader}>
              <AlertTriangle size={20} color={isDark ? "#ef4444" : "#b91c1c"} />
              <Text style={styles.warningTitle}>Permanent Deletion</Text>
            </View>
            <Text style={styles.warningText}>
              This action cannot be undone. Once you delete your account, all your profile data, listings, photos, and messages will be permanently removed.
            </Text>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>Confirm Deletion</Text>
            
            {!isOAuthUser && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirm Password</Text>
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
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Verification Text</Text>
              <Text style={styles.instruction}>Type <Text style={styles.bold}>DELETE_MY_ACCOUNT</Text> below:</Text>
              <View style={styles.inputWrapper}>
                <Trash2 size={18} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={deleteConfirmation}
                  onChangeText={setDeleteConfirmation}
                  placeholder="Type the confirmation text"
                  placeholderTextColor={isDark ? "rgba(255,255,255,0.4)" : "#94a3b8"}
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.confirmRow}>
              <Switch
                value={isConfirmed}
                onValueChange={setIsConfirmed}
                trackColor={{ false: isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0', true: '#ef4444' }}
                thumbColor={Platform.OS === 'ios' ? '#fff' : isConfirmed ? '#fff' : '#f4f4f5'}
              />
              <Text style={styles.confirmLabel}>I understand this is permanent</Text>
            </View>

            <View style={styles.btnWrap}>
              <AppButton 
                onPress={handleDelete} 
                disabled={isLoading || !isConfirmed || deleteConfirmation !== "DELETE_MY_ACCOUNT"} 
                style={[styles.deleteBtn, { opacity: (isLoading || !isConfirmed || deleteConfirmation !== "DELETE_MY_ACCOUNT") ? 0.6 : 1 }]}
              >
                {isLoading ? <ActivityIndicator color="#fff" /> : "Delete My Account"}
              </AppButton>
            </View>
          </View>
          
          <View style={styles.infoBox}>
            <Info size={16} color={isDark ? "#facc15" : "#854d0e"} />
            <Text style={styles.infoText}>
              All data will be purged from our servers within 24 hours of confirmation.
            </Text>
          </View>
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
  warningCard: {
    backgroundColor: isDark ? 'rgba(239, 68, 68, 0.08)' : '#fef2f2',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(239, 68, 68, 0.2)' : '#fecaca',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: isDark ? "#ef4444" : "#b91c1c",
  },
  warningText: {
    fontSize: 14,
    color: isDark ? "rgba(255,255,255,0.7)" : "#991b1b",
    lineHeight: 22,
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
    fontSize: 18,
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
  instruction: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 8,
    marginLeft: 4,
  },
  bold: {
    fontWeight: '800',
    color: colors.textPrimary,
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
  confirmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
    gap: 12,
  },
  confirmLabel: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  btnWrap: {
    marginTop: 0,
  },
  deleteBtn: {
    height: 56,
    borderRadius: 14,
    backgroundColor: '#ef4444',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    paddingHorizontal: 12,
    gap: 10,
    backgroundColor: isDark ? 'rgba(250, 204, 21, 0.05)' : '#fffbeb',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(250, 204, 21, 0.15)' : '#fde68a',
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: isDark ? "rgba(255,255,255,0.6)" : "#854d0e",
    lineHeight: 18,
  },
});

