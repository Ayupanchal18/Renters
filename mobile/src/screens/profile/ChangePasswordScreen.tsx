import React, { useState, useMemo } from "react";
import { StyleSheet, Text, View, TextInput, Alert, ActivityIndicator, Pressable, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Lock, Eye, EyeOff } from "lucide-react-native";
import AppScreen from "../../components/layout/AppScreen";
import AppButton from "../../components/ui/AppButton";
import { useTheme } from "../../theme/useTheme";

export default function ChangePasswordScreen() {
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSave = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert("Error", "Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);
    try {
      // Simulate API call as done in web version
      await new Promise((resolve) => setTimeout(resolve, 1500));
      Alert.alert("Success", "Password updated successfully");
      navigation.goBack();
    } catch (error) {
      Alert.alert("Error", "Failed to update password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppScreen title="Security" subtitle="Update your account password" showBack>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>Change Password</Text>
            
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
                  secureTextEntry={!showCurrent}
                />
                <Pressable onPress={() => setShowCurrent(!showCurrent)} style={styles.eyeIcon}>
                  {showCurrent ? <EyeOff size={18} color={colors.textSecondary} /> : <Eye size={18} color={colors.textSecondary} />}
                </Pressable>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>New Password</Text>
              <View style={styles.inputWrapper}>
                <Lock size={18} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Minimum 8 characters"
                  placeholderTextColor={isDark ? "rgba(255,255,255,0.4)" : "#94a3b8"}
                  secureTextEntry={!showNew}
                />
                <Pressable onPress={() => setShowNew(!showNew)} style={styles.eyeIcon}>
                  {showNew ? <EyeOff size={18} color={colors.textSecondary} /> : <Eye size={18} color={colors.textSecondary} />}
                </Pressable>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm New Password</Text>
              <View style={styles.inputWrapper}>
                <Lock size={18} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Repeat your new password"
                  placeholderTextColor={isDark ? "rgba(255,255,255,0.4)" : "#94a3b8"}
                  secureTextEntry={!showConfirm}
                />
                <Pressable onPress={() => setShowConfirm(!showConfirm)} style={styles.eyeIcon}>
                  {showConfirm ? <EyeOff size={18} color={colors.textSecondary} /> : <Eye size={18} color={colors.textSecondary} />}
                </Pressable>
              </View>
            </View>

            <View style={styles.btnWrap}>
              <AppButton 
                onPress={handleSave} 
                disabled={isLoading}
                style={styles.button}
              >
                {isLoading ? <ActivityIndicator color="#fff" /> : "Update Password"}
              </AppButton>
            </View>
          </View>
          
          <Text style={styles.footerInfo}>
            For your security, don't share your password with anyone. 
            We recommend using a combination of letters, numbers, and symbols.
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

