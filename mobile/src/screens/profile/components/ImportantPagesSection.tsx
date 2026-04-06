import React, { useState } from "react";
import { StyleSheet, Text, View, TouchableOpacity, LayoutAnimation, Platform, UIManager } from "react-native";
import { 
  ChevronDown, 
  ChevronUp, 
  Building2, 
  PlusCircle, 
  Heart, 
  Info, 
  PhoneCall, 
  HelpCircle, 
  Shield, 
  FileText,
  ChevronRight
} from "lucide-react-native";
import { useTheme } from "../../../theme/useTheme";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../../navigation/types";

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function ImportantPagesSection({ isDark }: { isDark: boolean }) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [isExpanded, setIsExpanded] = useState(false);
  const { colors } = useTheme();
  
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(!isExpanded);
  };

  const appPages = [
    { label: "Browse All Listings", icon: <Building2 color="#ffffff" size={20} />, bg: `${colors.primary}`, onPress: () => navigation.navigate("RentTab" as any) },
    { label: "My Wishlist", icon: <Heart color="#ffffff" size={20} />, bg: `${colors.error}`, onPress: () => navigation.navigate("WishlistTab" as any) },
  ];

  const infoPages = [
    { label: "About Us", icon: <Info color="#ffffff" size={20} />, bg: `${colors.secondary}`, onPress: () => navigation.navigate("About") },
    { label: "Contact", icon: <PhoneCall color="#ffffff" size={20} />, bg: `${colors.secondary}`, onPress: () => navigation.navigate("Contact") },
    { label: "FAQs", icon: <HelpCircle color="#ffffff" size={20} />, bg: `${colors.secondary}`, onPress: () => navigation.navigate("FAQ") },
    { label: "Privacy Policy", icon: <Shield color="#ffffff" size={20} />, bg: `${colors.secondary}`, onPress: () => navigation.navigate("Legal") },
    { label: "Terms of Service", icon: <FileText color="#ffffff" size={20} />, bg: `${colors.secondary}`, onPress: () => navigation.navigate("Legal") },
  ];

  return (
    <View style={styles.container}>

      {/* Extracted App Pages (Not collapsed) */}
      <View style={[styles.card, { backgroundColor: isDark ? colors.surface : colors.surface, borderColor: colors.border }]}>
        {appPages.map((p, index) => (
          <React.Fragment key={p.label}>
            <TouchableOpacity style={styles.pageItem} onPress={p.onPress}>
              <View style={styles.pageItemLeft}>
                <View style={[styles.pageIconContainer, { backgroundColor: p.bg }]}>
                  {p.icon}
                </View>
                <Text style={[styles.pageLabel, { color: colors.textPrimary }]}>{p.label}</Text>
              </View>
              <ChevronRight color={colors.textSecondary} size={18} />
            </TouchableOpacity>
            {index < appPages.length - 1 && (
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
            )}
          </React.Fragment>
        ))}
      </View>

      {/* Info Pages (Collapsible) */}
      <View style={{ marginTop: 16 }}>
        <TouchableOpacity 
          style={[styles.header, { backgroundColor: isDark ? colors.surface : colors.surface, borderColor: colors.border }]} 
          onPress={toggleExpand}
          activeOpacity={0.7}
        >
          <View style={styles.headerLeft}>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Information & Help</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              {isExpanded ? "Collapse info pages" : "About, Contact, FAQs, Privacy..."}
            </Text>
          </View>
          <View style={[styles.iconWrap, { backgroundColor: `${colors.secondary}` }]}>
            {isExpanded ? <ChevronUp color="#ffffff" size={24} /> : <ChevronDown color="#ffffff" size={24} />}
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={[styles.card, { marginTop: 8, backgroundColor: isDark ? colors.surface : colors.surface, borderColor: colors.border }]}>
            {infoPages.map((p, index) => (
              <React.Fragment key={p.label}>
                <TouchableOpacity style={styles.pageItem} onPress={p.onPress}>
                  <View style={styles.pageItemLeft}>
                    <View style={[styles.pageIconContainer, { backgroundColor: p.bg }]}>
                      {p.icon}
                    </View>
                    <Text style={[styles.pageLabel, { color: colors.textPrimary }]}>{p.label}</Text>
                  </View>
                  <ChevronRight color={colors.textSecondary} size={18} />
                </TouchableOpacity>
                {index < infoPages.length - 1 && (
                  <View style={[styles.divider, { backgroundColor: colors.border }]} />
                )}
              </React.Fragment>
            ))}
          </View>
        )}
      </View>

    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    marginTop: 20,
    marginBottom: 8,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  pageItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  pageItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  pageIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  pageLabel: {
    fontSize: 15,
    fontWeight: "500",
  },
  divider: {
    height: 1,
    marginLeft: 66, // Aligns with text
  },
});
