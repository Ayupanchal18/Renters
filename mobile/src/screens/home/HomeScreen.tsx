import React, { useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  FlatList,
  ActivityIndicator,
  ImageBackground,
  Image,
} from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { Building2, Home, DoorOpen, Bed, Hotel, Store } from "lucide-react-native";
import { fetchRentListings } from "../../features/properties/services/propertyService";
import PropertyCard from "../../components/ui/PropertyCard";
import { useAuth } from "../../features/auth/AuthContext";
import { useTheme } from "../../theme/useTheme";
import type { RootStackParamList } from "../../navigation/types";
import type { Property } from "../../types/types";

// Import modular Home components
import HeroSearch from "./components/HeroSearch";
import StatsGrid from "./components/StatsGrid";
import BrowseByCity from "./components/BrowseByCity";
import WhyChooseUs from "./components/WhyChooseUs";
import Testimonials from "./components/Testimonials";

type NavProp = NativeStackNavigationProp<RootStackParamList>;

// Simulated categories - can be fetched from API later
const CATEGORIES = [
  { key: "flat", label: "Flat", icon: Building2 },
  { key: "house", label: "House", icon: Home },
  { key: "room", label: "Room", icon: DoorOpen },
  { key: "pg", label: "PG", icon: Bed },
  { key: "hostel", label: "Hostel", icon: Hotel },
  { key: "commercial", label: "Commercial", icon: Store },
];

export default function HomeScreen() {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const navigation = useNavigation<NavProp>();
  const { user } = useAuth();

  // Featured / Recent listings
  const { data, isPending } = useQuery({
    queryKey: ["home-featured"],
    queryFn: () => fetchRentListings(1, 6),
  });

  const firstName = user?.name?.split(" ")[0] ?? "there";

  const renderPropertyItem = ({ item }: { item: Property }) => (
    <View style={styles.cardWrap}>
      <PropertyCard
        property={item}
        onPress={() =>
          navigation.navigate("PropertyDetail", {
            identifier: item.slug || item._id,
            type: "rent"
          })
        }
      />
    </View>
  );

  const handleSearchSubmit = (params: any) => {
    // Navigate to the appropriate tab with search data
    const targetTab = params.type === 'buy' ? 'BuyTab' : 'RentTab';
    
    if (params.searchData) {
      // Enhanced navigation with search data
      navigation.navigate(targetTab as any, { 
        searchData: params.searchData
      });
    } else {
      // Fallback to old behavior for backward compatibility
      navigation.navigate(targetTab as any, { 
        initialFilters: { city: params.location } 
      });
    }
  };

  const handleCitySearch = (city: string) => {
    navigation.navigate("Listings" as any, { type: 'rent', initialFilters: { city } });
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      contentInsetAdjustmentBehavior="automatic"
    >
      {/* Hero Section with Text Above Image */}
      <View style={styles.heroContainer}>
        {/* Image Section */}
        <ImageBackground 
          source={{ uri: 'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=800' }}
          style={styles.heroImageSection}
          imageStyle={styles.heroImageStyle}
        >
          {/* Gradient overlay from white to transparent */}
          <LinearGradient
            colors={[
              colors.background, // White/dark at top (solid)
              colors.background, // White/dark 
              'rgba(255, 255, 255, 0.7)', // Semi-transparent
              'rgba(255, 255, 255, 0.3)', // More transparent
              'transparent' // Fully transparent at bottom
            ]}
            locations={[0, 0.3, 0.5, 0.7, 1]}
            style={styles.heroGradientOverlay}
          />
          
          {/* Text Section on top of gradient */}
          <View style={styles.heroTextSection}>
            <Text style={styles.heroKicker}>FIND YOUR NEXT HOME</Text>
            <Text style={styles.heroHeadline}>Rent or buy verified properties</Text>
          </View>
        </ImageBackground>
      </View>

      {/* Advanced Hero Search Form (Pulled up into the hero via negative margin) */}
      <View style={styles.searchWrapper}>
        <HeroSearch onSearch={handleSearchSubmit} />
      </View>

      {/* Categories / Property Types */}
      <View style={styles.sectionHeaderWrap}>
        <Text style={styles.sectionTitle}>Browse by Property Type</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryGrid}>
        {CATEGORIES.map((cat, index) => {
          const IconComponent = cat.icon;
          const isActive = index === 0;
          return (
            <Pressable
              key={cat.key}
              style={[styles.categoryChip, isActive && styles.categoryChipActive]}
              onPress={() => navigation.navigate("RentTab" as any, { initialFilters: { category: cat.key } })}
            >
              <View style={styles.categoryContent}>
                <IconComponent 
                  size={18} 
                  color={isActive ? '#0066FF' : (isDark ? '#E2E8F0' : '#4B5563')} 
                />
                <Text style={[styles.categoryText, isActive && styles.categoryTextActive]}>
                  {cat.label}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Stats Grid */}
      <StatsGrid />

      {/* Featured / Recent Listings */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Featured Properties</Text>
            <Text style={styles.sectionSubtitle}>Handpicked properties just for you</Text>
          </View>
          <Pressable onPress={() => navigation.navigate("RentTab" as any)}>
            <Text style={styles.viewAllText}>View All</Text>
          </Pressable>
        </View>

        {isPending ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ paddingVertical: 40 }} />
        ) : (
          <FlatList
            data={data?.items ?? []}
            renderItem={renderPropertyItem}
            keyExtractor={(item) => item._id}
            scrollEnabled={false}
          />
        )}
      </View>

      {/* Browse By City */}
      <BrowseByCity onCityPress={handleCitySearch} />

      {/* Why Choose Us Grid */}
      <WhyChooseUs />

      {/* Testimonials Carousel */}
      <Testimonials />
      
    </ScrollView>
  );
}

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: 60, paddingTop: 110 }, // Increased top padding
  
  // New Hero Design
  heroContainer: {
    position: 'relative',
    marginTop: -90, // Reduced negative margin so hero doesn't pull up as much
  },
  heroImageSection: {
    height: 280,
    width: '100%',
  },
  heroImageStyle: {
    borderRadius: 0,
  },
  heroGradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '100%', // Cover full height for smooth gradient
  },
  heroTextSection: {
    position: 'absolute',
    top: 45, // Reduced by 10px from 55 to 45
    left: 20,
    right: 20,
    zIndex: 10,
  },
  heroKicker: {
    color: colors.textSecondary, // Gray text
    fontWeight: "600",
    fontSize: 12,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  heroHeadline: {
    color: colors.textPrimary, // Black/dark text
    fontWeight: "900",
    fontSize: 26,
    letterSpacing: -0.8,
    lineHeight: 32,
  },
  
  searchWrapper: {
    marginTop: -40,
    paddingHorizontal: 16,
    zIndex: 10,
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 32, // Reduced from 40 for less congestion
  },
  sectionHeaderWrap: {
    paddingHorizontal: 20,
    marginTop: 28, // Increased from 24 for breathing room
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 16, // Reduced from 20
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18, // Reduced from 22
    fontWeight: "800",
    color: isDark ? '#FFFFFF' : '#111827',
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 13, // Reduced from 14
    color: colors.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
  viewAllText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: "700",
  },
  categoryGrid: {
    flexDirection: "row",
    gap: 8, // Reduced from 12
    paddingHorizontal: 20,
    paddingBottom: 16, // Reduced from 20
    alignItems: 'center',
  },
  categoryChip: {
    backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
    borderRadius: 20, // Reduced from 24
    borderWidth: 1.5,
    borderColor: isDark ? '#475569' : '#E5E7EB',
    paddingHorizontal: 14, // Reduced from 20
    paddingVertical: 8, // Reduced from 12
  },
  categoryChipActive: {
    borderColor: '#0066FF',
    backgroundColor: isDark ? 'rgba(0, 102, 255, 0.1)' : '#F0F5FF',
  },
  categoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryText: {
    fontSize: 13, // Reduced from 14
    color: isDark ? '#E2E8F0' : '#4B5563',
    fontWeight: "600",
  },
  categoryTextActive: {
    color: '#0066FF',
    fontWeight: '700',
  },
  cardWrap: {
    alignItems: "center",
    marginBottom: 16, // Reduced from 20 for less spacing
  },
  heroLogo: {
    width: 64,
    height: 64,
    marginBottom: 16,
  },
});
