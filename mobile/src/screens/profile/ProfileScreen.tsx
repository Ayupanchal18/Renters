import React, { useMemo, useState } from "react";
import { StyleSheet, Text, View, ScrollView, Pressable, Alert, TouchableOpacity, Image, ActivityIndicator } from "react-native";
import * as ImagePicker from 'expo-image-picker';
import AppScreen from "../../components/layout/AppScreen";
import AppButton from "../../components/ui/AppButton";
import { useAuth } from "../../features/auth/AuthContext";
import { useTheme } from "../../theme/useTheme";
import { MapPin, Heart, MessageSquare, ShieldCheck, Mail, Phone, Settings, ChevronRight, Activity, AlertCircle, CheckCircle, Moon, Sun, PlusCircle, Building2, Camera, Calendar } from "lucide-react-native";
import { getAccessToken } from "../../features/auth/services/tokenStorage";
import { env } from "../../config/env";
import { hslToHex, getOpacityColor } from "../../utils/colors";

import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/types";
import VerificationSection from "./components/VerificationSection";
import SettingsSecuritySection from "./components/SettingsSecuritySection";
import ImportantPagesSection from "./components/ImportantPagesSection";
import PersonalInfoSection from "./components/PersonalInfoSection";
import PropertiesSection from "./components/PropertiesSection";

export default function ProfileScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const { user, isGuest, logout, updateSessionUser } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Debug: Log user avatar state
  console.log('ProfileScreen - User avatar:', user?.avatar);
  console.log('ProfileScreen - User object:', JSON.stringify(user, null, 2));

  const handleLogout = async () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out? You'll need to log in again to access your account.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            await logout();
          }
        }
      ],
      { cancelable: true }
    );
  };

  const handleSignIn = async () => {
    await logout();
  };

  const handlePhotoUpload = async () => {
    try {
      // Request permission
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert("Permission Required", "Please allow access to your photo library to upload a profile picture.");
        return;
      }

      // Show options
      Alert.alert(
        "Profile Photo",
        "Choose an option",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Camera", onPress: () => openCamera() },
          { text: "Photo Library", onPress: () => openImagePicker() }
        ]
      );
    } catch (error) {
      console.error('Permission error:', error);
    }
  };

  const openCamera = async () => {
    try {
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      
      if (cameraPermission.granted === false) {
        Alert.alert("Permission Required", "Please allow camera access to take a photo.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadPhoto(result.assets[0]);
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert("Error", "Failed to open camera");
    }
  };

  const openImagePicker = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadPhoto(result.assets[0]);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert("Error", "Failed to open photo library");
    }
  };

  const uploadPhoto = async (asset: any) => {
    setUploadingPhoto(true);
    
    try {
      const token = await getAccessToken();
      
      if (!token) {
        throw new Error('Authentication required. Please log in again.');
      }

      const formData = new FormData();
      
      // Create proper file object for React Native
      const fileUri = asset.uri;
      const fileName = fileUri.split('/').pop() || 'profile.jpg';
      const fileType = asset.type || 'image/jpeg';
      
      formData.append('image', {
        uri: fileUri,
        type: fileType,
        name: fileName,
      } as any);

      const response = await fetch(`${env.apiBaseUrl}/api/upload/profile-photo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to upload photo');
      }

      // Get image URL from response (check multiple possible locations)
      const imageUrl = data.data?.url || data.url || data.secure_url;
      
      if (!imageUrl) {
        console.error('Upload response:', data);
        throw new Error('No image URL returned from server');
      }

      console.log('Photo uploaded successfully:', imageUrl);

      // Update user data with new avatar using updateSessionUser
      updateSessionUser({ avatar: imageUrl });
      
      // Also update local storage
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        const updatedUser = { ...user, avatar: imageUrl };
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      } catch (storageError) {
        console.warn('Failed to update user in storage:', storageError);
      }
      
      Alert.alert("Success", "Profile photo updated successfully!");
    } catch (error: any) {
      console.error('Upload error:', error);
      Alert.alert("Upload Failed", error.message || "Failed to upload photo. Please try again.");
    } finally {
      setUploadingPhoto(false);
    }
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
          {/* Theme Toggle */}
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

          {/* Hero Section */}
          <View style={styles.guestHeroSection}>
            <View style={styles.guestIconContainer}>
              <View style={styles.guestIconBg}>
                <Building2 size={28} color={colors.primary} strokeWidth={1.5} />
              </View>
            </View>
            
            <Text style={styles.guestTitle}>Welcome to Renters</Text>
            <Text style={styles.guestSubtitle}>
              You're browsing as a guest. Sign in to unlock personalized features and save your favorite properties.
            </Text>
          </View>

          {/* Features Grid */}
          <View style={styles.featuresGrid}>
            <View style={styles.featureCard}>
              <Heart size={20} color={colors.primary} strokeWidth={1.5} />
              <Text style={styles.featureTitle}>Save Favorites</Text>
              <Text style={styles.featureDesc}>Bookmark properties you love</Text>
            </View>
            
            <View style={styles.featureCard}>
              <MessageSquare size={20} color={colors.primary} strokeWidth={1.5} />
              <Text style={styles.featureTitle}>Contact Owners</Text>
              <Text style={styles.featureDesc}>Message property owners directly</Text>
            </View>
            
            <View style={styles.featureCard}>
              <ShieldCheck size={20} color={colors.primary} strokeWidth={1.5} />
              <Text style={styles.featureTitle}>Secure Profile</Text>
              <Text style={styles.featureDesc}>Manage your account safely</Text>
            </View>
            
            <View style={styles.featureCard}>
              <Activity size={20} color={colors.primary} strokeWidth={1.5} />
              <Text style={styles.featureTitle}>Track Activity</Text>
              <Text style={styles.featureDesc}>View your search history</Text>
            </View>
          </View>

          {/* CTA Section */}
          <View style={styles.ctaSection}>
            <AppButton onPress={handleSignIn} style={styles.primaryCta}>
              Sign In or Register
            </AppButton>
            
            <Text style={styles.ctaFooter}>
              Join thousands of users finding their perfect home
            </Text>
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
            <Pressable style={styles.avatarContainer} onPress={handlePhotoUpload}>
              <View style={[
                styles.avatar,
                !user?.avatar && { backgroundColor: colors.primary }
              ]}>
                {uploadingPhoto ? (
                  <ActivityIndicator size="large" color="#ffffff" />
                ) : user?.avatar ? (
                  <Image 
                    source={{ uri: user.avatar }} 
                    style={styles.avatarImage}
                    onError={(error) => {
                      console.error('Image load error:', error.nativeEvent.error);
                    }}
                    onLoad={() => {
                      console.log('Image loaded successfully:', user.avatar);
                    }}
                  />
                ) : (
                  <Text style={styles.avatarText}>
                    {user?.name?.charAt(0)?.toUpperCase() ?? "?"}
                  </Text>
                )}
              </View>
              <View style={styles.cameraOverlay}>
                <Camera size={16} color="#ffffff" />
              </View>
            </Pressable>
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

        <PropertiesSection user={user} />

        <SettingsSecuritySection user={user} />

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Pressable style={styles.quickAction} onPress={() => navigation.navigate("Messages" as any)}>
            <View style={[styles.quickActionIcon, { backgroundColor: hslToHex(getOpacityColor(colors.primary, 0.15)) }]}>
              <MessageSquare size={20} color="#ffffff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.quickActionTitle}>Messages</Text>
              <Text style={styles.quickActionSub}>View your conversations</Text>
            </View>
            <ChevronRight size={18} color={hslToHex(colors.textSecondary)} />
          </Pressable>
          <View style={[styles.divider]} />
          <Pressable style={styles.quickAction} onPress={() => navigation.navigate("Notifications" as any)}>
            <View style={[styles.quickActionIcon, { backgroundColor: hslToHex(getOpacityColor(colors.primary, 0.15)) }]}>
              <Activity size={20} color="#ffffff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.quickActionTitle}>Notifications</Text>
              <Text style={styles.quickActionSub}>Stay up to date</Text>
            </View>
            <ChevronRight size={18} color={hslToHex(colors.textSecondary)} />
          </Pressable>
          <View style={[styles.divider]} />
          <Pressable style={styles.quickAction} onPress={() => navigation.navigate("MyVisits" as any)}>
            <View style={[styles.quickActionIcon, { backgroundColor: hslToHex(getOpacityColor(colors.primary, 0.15)) }]}>
              <Calendar size={20} color={hslToHex(colors.primary)} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.quickActionTitle}>My Visits</Text>
              <Text style={styles.quickActionSub}>Track your viewing schedule</Text>
            </View>
            <ChevronRight size={18} color={hslToHex(colors.textSecondary)} />
          </Pressable>
          <View style={[styles.divider]} />
          <Pressable style={styles.quickAction} onPress={() => navigation.navigate("IncomingVisits" as any)}>
            <View style={[styles.quickActionIcon, { backgroundColor: hslToHex(getOpacityColor(colors.primary, 0.15)) }]}>
              <Calendar size={20} color={hslToHex(colors.primary)} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.quickActionTitle}>Incoming Visits</Text>
              <Text style={styles.quickActionSub}>Manage requests on your listings</Text>
            </View>
            <ChevronRight size={18} color={hslToHex(colors.textSecondary)} />
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
    borderRadius: 18,
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
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    resizeMode: 'cover',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: "800",
    color: "#ffffff",
  },
  cameraOverlay: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.surface,
  },
  userName: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.textPrimary,
    letterSpacing: -0.3,
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
  completionLabel: { fontSize: 13, fontWeight: "700", color: colors.textSecondary, letterSpacing: 0.2 },
  completionValue: { fontSize: 13, fontWeight: "800", color: colors.textPrimary },
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
    borderRadius: 16,
    gap: 8,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.25 : 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  postButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "900",
    color: colors.textPrimary,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    fontWeight: "600",
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
  guestHeroSection: {
    alignItems: 'center',
    paddingVertical: 20, // Reduced from 32 to 20
    paddingHorizontal: 20,
  },
  guestIconContainer: {
    marginBottom: 16, // Reduced from 24 to 16
  },
  guestIconBg: {
    width: 64, // Reduced from 80 to 64
    height: 64, // Reduced from 80 to 64
    borderRadius: 32, // Reduced from 40 to 32
    backgroundColor: isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.15)',
  },
  guestTitle: {
    fontSize: 24, // Reduced from 28 to 24
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8, // Reduced from 12 to 8
    letterSpacing: -0.5,
  },
  guestSubtitle: {
    fontSize: 15, // Reduced from 16 to 15
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22, // Reduced from 24 to 22
    paddingHorizontal: 8,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12, // Reduced from 16 to 12
    paddingHorizontal: 20,
    marginTop: 20, // Reduced from 32 to 20
  },
  featureCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.surface,
    padding: 16, // Reduced from 20 to 16
    borderRadius: 12, // Reduced from 16 to 12
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  featureTitle: {
    fontSize: 13, // Reduced from 14 to 13
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 8, // Reduced from 12 to 8
    marginBottom: 3, // Reduced from 4 to 3
    textAlign: 'center',
  },
  featureDesc: {
    fontSize: 11, // Reduced from 12 to 11
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 15, // Reduced from 16 to 15
  },
  ctaSection: {
    paddingHorizontal: 20,
    paddingVertical: 24, // Reduced from 32 to 24
    alignItems: 'center',
  },
  primaryCta: {
    width: '100%',
    marginBottom: 12, // Reduced from 16 to 12
  },
  ctaFooter: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
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
    borderRadius: 16,
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
    fontWeight: '800',
    color: colors.textPrimary,
  },
  quickActionSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
    fontWeight: "600",
  },
  logoutWrap: {
    marginTop: 16, // Reduced from 32 to 16 to remove extra space
    paddingBottom: 100, // Keep the bottom padding to clear the navbar
  },
});
