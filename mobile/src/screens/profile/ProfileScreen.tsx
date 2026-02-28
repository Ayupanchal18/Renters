import React, { useMemo } from "react";
import { StyleSheet, Text, View, ScrollView, Pressable, Alert, TouchableOpacity } from "react-native";
import AppScreen from "../../components/layout/AppScreen";
import AppButton from "../../components/ui/AppButton";
import { useAuth } from "../../features/auth/AuthContext";
import { useTheme } from "../../theme/useTheme";
import { MapPin, Heart, MessageSquare, ShieldCheck, Mail, Phone, Settings, ChevronRight, Activity, AlertCircle, CheckCircle, Moon, Sun, PlusCircle, Building2 } from "lucide-react-native";

import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/types";
import VerificationSection from "./components/VerificationSection";
import SettingsSecuritySection from "./components/SettingsSecuritySection";
import ImportantPagesSection from "./components/ImportantPagesSection";
import PersonalInfoSection from "./components/PersonalInfoSection";

export default function ProfileScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const { user, isGuest, logout } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handleLogout = async () => {
    await logout();
  };

  const handleSignIn = async () => {
    await logout();
  };

  const calculateProfileCompletion = () => {
    if (!user) return 0;
    let score = 0;
    if (user.name) score += 25;
    if (user.email) score += 25;
    if (user.phone) score += 25;
    if (user.address) score += 25;
    return score;
  };

  const profileScore = calculateProfileCompletion();

  if (isGuest) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <AppScreen title="Profile" subtitle="Guest Mode">
          <View style={[styles.card, styles.guestCard]}>
            <Pressable 
              onPress={toggleTheme} 
              style={styles.themeToggleBtn}
            >
              {isDark ? (
                <Sun color={colors.primary} size={20} />
              ) : (
                <Moon color={colors.primary} size={20} />
              )}
            </Pressable>
            <Text style={styles.guestText}>You are continuing as a guest.</Text>
            <Text style={styles.guestTextSecondary}>Sign in to view your profile and manage settings.</Text>
            <AppButton onPress={handleSignIn}>Sign In or Register</AppButton>
          </View>
        </AppScreen>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <AppScreen title="Profile" subtitle="Your account details">
        {/* Profile Card & Avatar */}
        <View style={styles.profileHeader}>
          <Pressable 
            onPress={toggleTheme} 
            style={styles.themeToggleBtn}
          >
            {isDark ? (
              <Sun color={colors.primary} size={20} />
            ) : (
              <Moon color={colors.primary} size={20} />
            )}
          </Pressable>
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.name?.charAt(0)?.toUpperCase() ?? "?"}
              </Text>
            </View>
            <View>
              <Text style={styles.userName}>{user?.name ?? "Guest"}</Text>
              {user?.userType ? (
                <Text style={styles.userType}>{user.userType}</Text>
              ) : null}
            </View>
          </View>
          
          {/* Profile Completion */}
          <View style={styles.completionWrap}>
            <View style={styles.completionTextWrap}>
              <Text style={styles.completionLabel}>Profile Completion</Text>
              <Text style={styles.completionValue}>{profileScore}%</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${profileScore}%` }]} />
            </View>
            {profileScore < 100 && (
               <Text style={styles.completionHint}>Complete your profile to unlock all features.</Text>
            )}
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsContainer}>
          <Pressable style={styles.statBox} onPress={() => navigation.navigate("RentTab" as any)}>
            <Building2 color={colors.primary} size={24} />
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Listings</Text>
          </Pressable>
          <Pressable style={styles.statBox} onPress={() => navigation.navigate("WishlistTab" as any)}>
            <Heart color={colors.error} size={24} />
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Wishlist</Text>
          </Pressable>
          <Pressable style={styles.statBox} onPress={() => navigation.navigate("Messages" as any)}>
            <MessageSquare color={colors.secondary} size={24} />
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Messages</Text>
          </Pressable>
        </View>

        {/* Post Property Prominent Button */}
        <TouchableOpacity 
          style={[styles.postButton, { backgroundColor: colors.success }]} 
          onPress={() => navigation.navigate("PostProperty")}
          activeOpacity={0.8}
        >
          <PlusCircle color="#ffffff" size={22} />
          <Text style={styles.postButtonText}>Post a New Property</Text>
        </TouchableOpacity>

        {/* Personal Info */}
        <PersonalInfoSection user={user} onEditPress={() => navigation.navigate("EditProfile" as any)} />

        <VerificationSection user={user} />

        <SettingsSecuritySection user={user} />

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Pressable style={styles.quickAction} onPress={() => navigation.navigate("Messages" as any)}>
            <View style={[styles.quickActionIcon, { backgroundColor: `${colors.primary}20` }]}>
              <MessageSquare size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.quickActionTitle}>Messages</Text>
              <Text style={styles.quickActionSub}>View your conversations</Text>
            </View>
            <ChevronRight size={18} color={colors.textSecondary} />
          </Pressable>
          <View style={[styles.divider]} />
          <Pressable style={styles.quickAction} onPress={() => navigation.navigate("Notifications" as any)}>
            <View style={[styles.quickActionIcon, { backgroundColor: `${colors.primary}20` }]}>
              <Activity size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.quickActionTitle}>Notifications</Text>
              <Text style={styles.quickActionSub}>Stay up to date</Text>
            </View>
            <ChevronRight size={18} color={colors.textSecondary} />
          </Pressable>

        </View>

        <ImportantPagesSection isDark={isDark} />

        <View style={styles.logoutWrap}>
          <AppButton onPress={handleLogout} variant="secondary">
            Sign Out
          </AppButton>
        </View>
      </AppScreen>
    </ScrollView>
  );
}

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1 },
  
  profileHeader: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
    position: 'relative',
  },
  themeToggleBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.input,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    zIndex: 10,
  },
  avatarWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 20,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 28,
    fontWeight: "800",
    color: "#ffffff",
  },
  userName: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  userType: {
    fontSize: 14,
    color: colors.textSecondary,
    textTransform: "capitalize",
    marginTop: 4,
  },
  
  completionWrap: {},
  completionTextWrap: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  completionLabel: { fontSize: 14, fontWeight: "500", color: colors.textPrimary },
  completionValue: { fontSize: 14, fontWeight: "600", color: colors.primary },
  progressBarBg: {
    height: 8,
    backgroundColor: colors.input,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  completionHint: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 8,
  },

  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 20,
  },
  postButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  postButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textPrimary,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },

  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  guestCard: {
    paddingVertical: 24,
    gap: 16,
    position: 'relative',
  },
  guestText: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textPrimary,
    textAlign: "center",
  },
  guestTextSecondary: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: 8,
  },
  sectionHeader: {
    marginTop: 20,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  quickActions: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 20,
    overflow: 'hidden',
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  quickActionSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  logoutWrap: {
    marginTop: 32,
    paddingBottom: 24,
  },
});
