import React, { useMemo, useState } from "react";
import { StyleSheet, Text, View, TextInput, Alert, ActivityIndicator } from "react-native";
import { useNavigation } from "@react-navigation/native";
import AppScreen from "../../components/layout/AppScreen";
import AppButton from "../../components/ui/AppButton";
import { useAuth } from "../../features/auth/AuthContext";
import { getAccessToken } from "../../features/auth/services/tokenStorage";
import { env } from "../../config/env";
import { useTheme } from "../../theme/useTheme";

export default function EditProfileScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const { user, updateSessionUser } = useAuth();
  const navigation = useNavigation();
  const [name, setName] = useState(user?.name || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Name is required");
      return;
    }

    setIsLoading(true);
    try {
      const token = await getAccessToken();
      const response = await fetch(`${env.apiBaseUrl}/api/users/me`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, bio }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || "Failed to update profile");
      }

      updateSessionUser({ name, bio: data.data?.bio || bio });
      Alert.alert("Success", "Profile updated successfully");
      navigation.goBack();
    } catch (error: any) {
      console.error("Profile update error:", error);
      Alert.alert("Error", error.message || "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppScreen title="Edit Profile" subtitle="Update your personal details" showBack>
      <View style={styles.container}>
        <Text style={styles.label}>Full Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Enter your full name"
          placeholderTextColor={colors.textSecondary}
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={[styles.input, styles.inputDisabled]}
          value={user?.email || ""}
          editable={false}
        />
        <Text style={styles.helperText}>Email cannot be changed</Text>

        <Text style={styles.label}>About</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={bio}
          onChangeText={setBio}
          placeholder="Tell us about yourself..."
          placeholderTextColor={colors.textSecondary}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        <View style={styles.btnWrap}>
          <AppButton onPress={handleSave} disabled={isLoading}>
            {isLoading ? <ActivityIndicator color="#fff" /> : "Save Changes"}
          </AppButton>
        </View>
      </View>
    </AppScreen>
  );
}

const getStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: 4,
      paddingTop: 8,
    },
    label: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.textPrimary,
      marginBottom: 8,
      marginTop: 14,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 15,
      color: colors.textPrimary,
      backgroundColor: colors.input,
    },
    inputDisabled: {
      backgroundColor: colors.surface,
      color: colors.textSecondary,
      opacity: 0.9,
    },
    textArea: {
      height: 110,
    },
    helperText: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 6,
    },
    btnWrap: {
      marginTop: 22,
      paddingBottom: 12,
    },
  });
