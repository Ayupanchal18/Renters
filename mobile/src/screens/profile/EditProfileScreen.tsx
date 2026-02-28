import React, { useState } from "react"; 
import { StyleSheet, Text, View, TextInput, Alert, ActivityIndicator } from "react-native";
import { useNavigation } from "@react-navigation/native";
import AppScreen from "../../components/layout/AppScreen";
import AppButton from "../../components/ui/AppButton";
import { colors } from "../../theme/tokens";
import { useAuth } from "../../features/auth/AuthContext";
import { getAccessToken } from "../../features/auth/services/tokenStorage";
import { env } from "../../config/env";

export default function EditProfileScreen() {
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
  textArea: {
    height: 100,
  },
  helperText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  btnWrap: {
    marginTop: 32,
  },
});
