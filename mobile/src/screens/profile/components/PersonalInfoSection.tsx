import React from "react";
import { StyleSheet, Text, View, TouchableOpacity, Image } from "react-native";
import { Sparkles, Edit2, Mail, Phone, MapPin, Calendar } from "lucide-react-native";
import { useTheme } from "../../../theme/useTheme";
import { User } from "../../../types/types";

type Props = {
  user: User | null;
  onEditPress: () => void;
};

export default function PersonalInfoSection({ user, onEditPress }: Props) {
  const { colors } = useTheme();
  
  const styles = React.useMemo(() => getStyles(colors), [colors]);
  
  const info = [
    { icon: <Mail size={16} color="#ffffff" />, label: "Email", value: user?.email || "Not provided", bg: "#10b981" },
    { icon: <Phone size={16} color="#ffffff" />, label: "Phone", value: user?.phone || "Not provided", bg: "#f97316" },
    { icon: <MapPin size={16} color="#ffffff" />, label: "Address", value: user?.address || "Not provided", bg: "#3b82f6" },
  ];

  const memberSince = user?.createdAt 
    ? new Date(user.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) 
    : "—";

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={[styles.headerIconWrap, { backgroundColor: colors.primary }]}>
            <Sparkles size={18} color="#ffffff" />
          </View>
          <View>
            <Text style={styles.title}>Personal Information</Text>
            <Text style={styles.subtitle}>Your profile details</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.editBtn} onPress={onEditPress}>
          <Edit2 size={14} color={colors.primary} />
          <Text style={styles.editBtnText}>Edit</Text>
        </TouchableOpacity>
      </View>

      {/* Info Grid */}
      <View style={styles.infoWrapper}>
        <View style={styles.infoRow}>
          <View style={[styles.infoIconWrap, { backgroundColor: "#8b5cf6" }]}>
             <Calendar size={16} color="#ffffff" />
          </View>
          <View style={styles.infoTextWrap}>
             <Text style={styles.infoLabel}>MEMBER SINCE</Text>
             <Text style={styles.infoValue}>{memberSince}</Text>
          </View>
        </View>

        {info.map((item, idx) => (
          <View key={idx} style={styles.infoRow}>
            <View style={[styles.infoIconWrap, { backgroundColor: item.bg }]}>
              {item.icon}
            </View>
            <View style={styles.infoTextWrap}>
              <Text style={styles.infoLabel}>{item.label.toUpperCase()}</Text>
              <Text style={[styles.infoValue, (item.value === "Not provided" || item.value === "Not specified") && styles.infoValueEmpty]}>
                {item.value}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.input, // Use theme color instead of hardcoded
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primary + "1A", // primary/10
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary + "33",
  },
  editBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.primary,
  },
  infoWrapper: {
    padding: 16,
    gap: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.input, // Use theme color instead of hardcoded
  },
  infoIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  infoTextWrap: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textPrimary,
  },
  infoValueEmpty: {
    color: colors.textSecondary,
    fontStyle: "italic",
    opacity: 0.7,
  },
});
