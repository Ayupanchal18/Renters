import React from "react";
import { StyleSheet, Text, View, TouchableOpacity, Linking, Alert } from "react-native";
import { Info, HelpCircle, FileText, PhoneCall, ChevronRight } from "lucide-react-native";
import { colors } from "../../../theme/tokens";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../../navigation/types";

export default function HelpInfoSection() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handleSupportEmail = async () => {
    const email = "support@renters.com";
    const subject = "Renters App Support";
    const url = `mailto:${email}?subject=${encodeURIComponent(subject)}`;
    
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Error", "Could not open email client.");
      }
    } catch (error) {
      Alert.alert("Error", "Could not open email client.");
    }
  };

  return (
    <View>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Help & Information</Text>
      </View>
      <View style={styles.card}>
        <PressableRow 
          label="About Renters" 
          sublabel="Learn more about us"
          icon={<Info color={colors.secondary} size={22} />} 
          onPress={() => navigation.navigate("About")} 
        />
        <View style={styles.divider} />
        <PressableRow 
          label="FAQs & Help Center" 
          sublabel="Find answers quickly"
          icon={<HelpCircle color={colors.secondary} size={22} />} 
          onPress={() => navigation.navigate("FAQ")} 
        />
        <View style={styles.divider} />
        <PressableRow 
          label="Contact Support" 
          sublabel="Reach out to our team"
          icon={<PhoneCall color={colors.secondary} size={22} />} 
          onPress={handleSupportEmail} 
        />
        <View style={styles.divider} />
        <PressableRow 
          label="Legal & Privacy Policy" 
          sublabel="Terms and conditions"
          icon={<FileText color={colors.secondary} size={22} />} 
          onPress={() => navigation.navigate("Legal")} 
        />
      </View>
    </View>
  );
}

function PressableRow({ 
  label, 
  sublabel, 
  icon, 
  onPress 
}: { 
  label: string; 
  sublabel?: string; 
  icon?: React.ReactNode; 
  onPress: () => void 
}) {
  return (
    <TouchableOpacity style={styles.pressableRow} onPress={onPress}>
      <View style={styles.leftContent}>
        <View style={styles.iconContainer}>{icon}</View>
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

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  sectionHeader: {
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
    backgroundColor: colors.secondary + "1A", // Slight opacity
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
});
