import React, { useState } from "react";
import { StyleSheet, Text, View, Alert, TouchableOpacity, ActivityIndicator } from "react-native";
import { Mail, Phone, ShieldCheck, CheckCircle, AlertCircle, ChevronRight, BadgeCheck } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../../theme/useTheme";
import { User } from "../../../types/types";
import { getAccessToken } from "../../../features/auth/services/tokenStorage";
import { env } from "../../../config/env";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../../navigation/types";

type Props = {
  user: User | null;
};

export default function VerificationSection({ user }: Props) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [loadingType, setLoadingType] = useState<"email" | "phone" | null>(null);
  const { colors } = useTheme();
  
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  const handleVerify = async (type: "email" | "phone") => {
    const contact = type === "email" ? user?.email : user?.phone;

    if (!contact) {
      Alert.alert("Error", `Please add your ${type === 'email' ? 'email address' : 'phone number'} in your profile first.`);
      return;
    }

    setLoadingType(type);
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
        throw new Error(data.message || data.error || "Failed to send verification code");
      }

      // Navigate to OTP wrapper
      navigation.navigate("OTPVerification", { type, contact });
    } catch (error: any) {
      console.error("Initiate Verification Error:", error);
      Alert.alert("Error", error.message || "Failed to send verification code");
    } finally {
      setLoadingType(null);
    }
  };

  return (
    <View>
      <View style={styles.sectionHeader}>
        <BadgeCheck color={colors.primary} size={22} />
        <Text style={styles.sectionTitle}>Verification Status</Text>
      </View>
      <View style={styles.card}>
        <PressableRow 
          label="Email Address" 
          sublabel={user?.email}
          statusText={user?.emailVerified ? "Verified" : "Unverified"}
          icon={<Mail color={colors.textSecondary} size={22} />} 
          statusIcon={user?.emailVerified ? <CheckCircle color={colors.success} size={18} /> : <AlertCircle color={colors.error} size={18} />}
          onPress={() => !user?.emailVerified && handleVerify("email")}
          isLoading={loadingType === "email"}
          colors={colors}
        />
        <View style={styles.divider} />
        <PressableRow 
          label="Phone Number" 
          sublabel={user?.phone || "Not provided"}
          statusText={user?.phoneVerified ? "Verified" : "Unverified"}
          icon={<Phone color={colors.textSecondary} size={22} />} 
          statusIcon={user?.phoneVerified ? <CheckCircle color={colors.success} size={18} /> : <AlertCircle color={colors.error} size={18} />}
          onPress={() => !user?.phoneVerified && handleVerify("phone")}
          isLoading={loadingType === "phone"}
          colors={colors}
        />
        <View style={styles.divider} />
        <PressableRow 
          label="Document Vault" 
          sublabel="Government ID & address proofs"
          statusText={user?.verified ? "Verified" : "Manage Vault"}
          icon={<ShieldCheck color={colors.textSecondary} size={22} />} 
          statusIcon={user?.verified ? <CheckCircle color={colors.success} size={18} /> : undefined}
          onPress={() => navigation.navigate("DocumentVault")}
          colors={colors}
        />
      </View>
    </View>
  );
}

function PressableRow({ 
  label, 
  sublabel, 
  statusText, 
  icon, 
  statusIcon, 
  onPress,
  isLoading,
  colors
}: { 
  label: string; 
  sublabel?: string; 
  statusText: string;
  icon?: React.ReactNode; 
  statusIcon?: React.ReactNode; 
  onPress: () => void;
  isLoading?: boolean;
  colors: any;
}) {
  const styles = React.useMemo(() => getStyles(colors), [colors]);
  
  return (
    <TouchableOpacity style={styles.pressableRow} onPress={onPress} disabled={isLoading}>
      <View style={styles.leftContent}>
        <View style={styles.iconContainer}>{icon}</View>
        <View style={styles.textContainer}>
          <Text style={styles.label}>{label}</Text>
          {sublabel && <Text style={styles.sublabel}>{sublabel}</Text>}
        </View>
      </View>
      <View style={styles.rightContent}>
        <View style={styles.statusWrap}>
          {statusIcon}
          <Text style={[styles.statusText, statusText === 'Verified' ? styles.statusSuccess : styles.statusError]}>
            {statusText}
          </Text>
        </View>
        {isLoading ? (
          <ActivityIndicator size="small" color={colors.textSecondary} />
        ) : (
          <ChevronRight color={colors.textSecondary} size={20} />
        )}
      </View>
    </TouchableOpacity>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 24,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  pressableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  leftContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    flex: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  textContainer: {
    flex: 1,
    justifyContent: "center",
  },
  rightContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  statusWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.background,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  label: { 
    fontSize: 16, 
    color: colors.textPrimary, 
    fontWeight: "600",
    marginBottom: 4,
  },
  sublabel: { 
    fontSize: 14, 
    color: colors.textSecondary 
  },
  statusText: {
    fontSize: 13,
    fontWeight: "500",
  },
  statusSuccess: {
    color: colors.success,
  },
  statusError: {
    color: colors.error,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 74, // Align with text
  },
});
