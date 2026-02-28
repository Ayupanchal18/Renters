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
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
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
  { key: "flat", label: "🏢 Flat" },
  { key: "house", label: "🏠 House" },
  { key: "room", label: "🚪 Room" },
  { key: "pg", label: "🛏️ PG" },
  { key: "hostel", label: "🏨 Hostel" },
  { key: "commercial", label: "🏪 Commercial" },
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
    // Navigate to the correct tab based on search type
    const targetTab = params.type === 'buy' ? 'BuyTab' : 'RentTab';
    navigation.navigate(targetTab as any, { 
      initialFilters: { city: params.location } 
    });
  };

  const handleCitySearch = (city: string) => {
    navigation.navigate("Listings", { type: 'rent', initialFilters: { city } });
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Dynamic Hero Section */}
      <ImageBackground 
        source={{ uri: 'https://images.unsplash.com/photo-1628191140046-646731671239?w=800&auto=format&fit=crop&q=60' }} // Changed image to look more like mockup building
        style={styles.heroBg}
        imageStyle={styles.heroImage}
      >
        <View style={styles.heroOverlay} />
      </ImageBackground>

      {/* Advanced Hero Search Form (Pulled up into the hero via negative margin) */}
      <View style={styles.searchWrapper}>
        <HeroSearch onSearch={handleSearchSubmit} />
      </View>

      {/* Categories / Property Types */}
      <View style={styles.sectionHeaderWrap}>
        <Text style={styles.sectionTitle}>Browse by Property Type</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryGrid}>
        {CATEGORIES.map((cat, index) => (
          <Pressable
            key={cat.key}
            style={[styles.categoryChip, index === 0 && styles.categoryChipActive]}
            onPress={() => navigation.navigate("RentTab" as any, { initialFilters: { category: cat.key } })}
          >
            <Text style={[styles.categoryText, index === 0 && styles.categoryTextActive]}>{cat.label}</Text>
          </Pressable>
        ))}
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
  content: { paddingBottom: 60 },
  heroBg: {
    height: 180, // Made explicit height so it behaves like the mockup purely as a banner
  },
  heroImage: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  heroOverlay: {
    backgroundColor: isDark ? 'rgba(15, 23, 42, 0.4)' : 'rgba(0,0,0,0.1)',
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
  },
  searchWrapper: {
    marginTop: -80, // Pulls the search card up significantly over the hero image
    paddingHorizontal: 16,
    zIndex: 10,
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 40,
  },
  sectionHeaderWrap: {
    paddingHorizontal: 20,
    marginTop: 32,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: isDark ? '#FFFFFF' : '#111827',
    letterSpacing: -0.5,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
    fontWeight: '500',
  },
  viewAllText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: "700",
  },
  categoryGrid: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: 'center',
  },
  categoryChip: {
    backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
    borderRadius: 24, // Pill shape
    borderWidth: 1.5,
    borderColor: isDark ? '#475569' : '#E5E7EB',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  categoryChipActive: {
    borderColor: '#0066FF',
    backgroundColor: isDark ? 'rgba(0, 102, 255, 0.1)' : '#F0F5FF',
  },
  categoryText: {
    fontSize: 14,
    color: isDark ? '#E2E8F0' : '#4B5563',
    fontWeight: "600",
  },
  categoryTextActive: {
    color: '#0066FF',
    fontWeight: '700',
  },
  cardWrap: {
    alignItems: "center",
    marginBottom: 20,
  },
  heroLogo: {
    width: 64,
    height: 64,
    marginBottom: 16,
  },
});
