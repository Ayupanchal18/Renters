import React from "react";
import { StyleSheet, Text, View, Alert, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Lock, Phone, Trash2, ChevronRight, ShieldCheck } from "lucide-react-native";
import { useTheme } from "../../../theme/useTheme";

import { User } from "../../../types/types";

type Props = {
  user: User | null;
};

export default function SettingsSecuritySection({ user }: Props) {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  return (
    <View>
      <View style={styles.sectionHeader}>
        <ShieldCheck color={colors.primary} size={22} />
        <Text style={styles.sectionTitle}>Security & Login</Text>
      </View>
      <View style={styles.card}>
        <PressableRow 
          label="Change Password" 
          sublabel="Update your password"
          icon={<Lock color="#ffffff" size={20} />} 
          onPress={() => navigation.navigate("ChangePassword")}
          colors={colors}
        />
        <View style={styles.divider} />
        <PressableRow 
          label="Change Phone" 
          sublabel="Update phone number"
          icon={<Phone color="#ffffff" size={20} />} 
          onPress={() => navigation.navigate("ChangePhone")}
          colors={colors}
        />
        <View style={styles.divider} />
        <PressableRow 
          label="Delete Account" 
          sublabel="Remove your account"
          icon={<Trash2 color="#ffffff" size={20} />} 
          iconBg={colors.error + "1A"}
          onPress={() => navigation.navigate("DeleteAccount")}
          colors={colors}
        />
        
        <View style={styles.footerWrap}>
          <Text style={styles.footerTitle}>Security Information</Text>
          <View style={styles.footerRow}>
            <Text style={styles.footerLabel}>Account created</Text>
            <Text style={styles.footerValue}>
                {user?.createdAt 
                    ? new Date(user.createdAt).toLocaleDateString()
                    : 'Unknown'
                }
            </Text>
          </View>
          <View style={styles.footerRow}>
            <Text style={styles.footerLabel}>Phone verified</Text>
            <Text style={[styles.footerValue, { color: user?.phoneVerified ? colors.success : colors.error }]}>
                {user?.phoneVerified ? 'Verified' : 'Not verified'}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function PressableRow({ 
  label, 
  sublabel, 
  icon, 
  iconBg,
  onPress,
  colors
}: { 
  label: string; 
  sublabel?: string; 
  icon?: React.ReactNode; 
  iconBg?: string;
  onPress: () => void;
  colors: any;
}) {
  const styles = React.useMemo(() => getStyles(colors), [colors]);
  
  return (
    <TouchableOpacity style={styles.pressableRow} onPress={onPress}>
      <View style={styles.leftContent}>
        <View style={[styles.iconContainer, iconBg ? { backgroundColor: iconBg } : undefined]}>{icon}</View>
        <View style={styles.textContainer}>
          <Text style={styles.label}>{label}</Text>
          {sublabel && <Text style={styles.sublabel}>{sublabel}</Text>}
        </View>
      </View>
      <View style={styles.rightContent}>
        <ChevronRight color={colors.textSecondary} size={20} />
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
    backgroundColor: colors.primary + "1A", // Slight opacity
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
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 74, // Align with text
  },
  footerWrap: {
    backgroundColor: colors.background,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 8,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  footerLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  footerValue: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.textPrimary,
  },
});
