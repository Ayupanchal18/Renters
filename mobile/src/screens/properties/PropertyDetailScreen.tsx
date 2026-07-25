import React, { useMemo, useState, Suspense, lazy } from "react";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  ActivityIndicator,
  Share,
  Pressable,
  Alert,
  Linking,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Share2, Heart, MapPin, IndianRupee, Shield, CheckCircle, Clock, Bed, Bath, Sofa, Phone, MessageCircle, Wifi, Car, Dumbbell, Trees, Shield as Security, Camera, Gamepad2, Flame, Home, Users, Zap, Waves, Wind, Sparkles, Calendar } from "lucide-react-native";
import { fetchPropertyDetail, fetchRentListings, fetchBuyListings } from "../../features/properties/services/propertyService";
import { addToWishlist, removeFromWishlist } from "../../features/wishlist/services/wishlistService";
import { useAuth } from "../../features/auth/AuthContext";
import messageService from "../../features/messages/services/messageService";
import { useTheme } from "../../theme/useTheme";
import type { RootStackParamList } from "../../navigation/types";
import type { Property } from "../../types/types";

// Global UI Components
import AppButton from "../../components/ui/AppButton";
import ImageGallery from "../../components/ui/ImageGallery";
import MobileContactBar from "../../components/ui/MobileContactBar";
import CollapsibleSection from "../../components/ui/CollapsibleSection";
import Badge from "../../components/ui/Badge";
import PropertyCard from "../../components/ui/PropertyCard";
import VerifiedBadge from "../../components/ui/VerifiedBadge";

// Page Specific Components
import PropertyLocation from "./components/PropertyLocation";
import NearbyPlaces from "./components/NearbyPlaces";
import CommuteCalculator from "./components/CommuteCalculator";
import EmiCalculator from "../../components/EmiCalculator";
import BookingWidget from "../../components/properties/BookingWidget";
import { neighborhoodService } from "../../features/properties/services/neighborhoodService";
import type { NeighborhoodCategories, AmenityItem } from "../../features/properties/services/neighborhoodService";
import ScoreGauge from "./components/ScoreGauge";
import AmenitiesList from "./components/AmenitiesList";
import NeighborhoodMap from "./components/NeighborhoodMap";
import SkeletonLoader from "../../components/ui/SkeletonLoader";

// Lazy-loaded Virtual Tour Components
const MatterportEmbed = lazy(() => import("../../components/tour/MatterportEmbed"));
const PanoramaViewer = lazy(() => import("../../components/tour/PanoramaViewer"));
const VideoWalkthrough = lazy(() => import("../../components/tour/VideoWalkthrough"));

type Props = NativeStackScreenProps<RootStackParamList, "PropertyDetail">;

export default function PropertyDetailScreen({ route, navigation }: Props) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const insets = useSafeAreaInsets();
  const { identifier, type } = route.params;
  const queryClient = useQueryClient();
  const { user, logout, isGuest } = useAuth();
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const [activeCategory, setActiveCategory] = useState<keyof NeighborhoodCategories>("schools");
  const [selectedAmenity, setSelectedAmenity] = useState<AmenityItem | null>(null);

  // Function to get appropriate icon for amenity
  const getAmenityIcon = (amenity: string) => {
    const amenityLower = amenity.toLowerCase();
    const iconProps = { size: 16, color: colors.primary, strokeWidth: 2 };

    if (amenityLower.includes('wifi') || amenityLower.includes('internet')) {
      return <Wifi {...iconProps} />;
    }
    if (amenityLower.includes('parking') || amenityLower.includes('car')) {
      return <Car {...iconProps} />;
    }
    if (amenityLower.includes('gym') || amenityLower.includes('fitness') || amenityLower.includes('exercise')) {
      return <Dumbbell {...iconProps} />;
    }
    if (amenityLower.includes('garden') || amenityLower.includes('park') || amenityLower.includes('green')) {
      return <Trees {...iconProps} />;
    }
    if (amenityLower.includes('security') || amenityLower.includes('guard')) {
      return <Security {...iconProps} />;
    }
    if (amenityLower.includes('cctv') || amenityLower.includes('camera') || amenityLower.includes('surveillance')) {
      return <Camera {...iconProps} />;
    }
    if (amenityLower.includes('play') || amenityLower.includes('game') || amenityLower.includes('recreation')) {
      return <Gamepad2 {...iconProps} />;
    }
    if (amenityLower.includes('fire') || amenityLower.includes('safety') || amenityLower.includes('emergency')) {
      return <Flame {...iconProps} />;
    }
    if (amenityLower.includes('club') || amenityLower.includes('community') || amenityLower.includes('hall')) {
      return <Home {...iconProps} />;
    }
    if (amenityLower.includes('intercom') || amenityLower.includes('communication')) {
      return <Phone {...iconProps} />;
    }
    if (amenityLower.includes('servant') || amenityLower.includes('maid') || amenityLower.includes('staff')) {
      return <Users {...iconProps} />;
    }
    if (amenityLower.includes('power') || amenityLower.includes('backup') || amenityLower.includes('generator')) {
      return <Zap {...iconProps} />;
    }
    if (amenityLower.includes('pool') || amenityLower.includes('swimming')) {
      return <Waves {...iconProps} />;
    }
    if (amenityLower.includes('ac') || amenityLower.includes('air') || amenityLower.includes('conditioning')) {
      return <Wind {...iconProps} />;
    }
    if (amenityLower.includes('meditation') || amenityLower.includes('yoga')) {
      return <Users {...iconProps} />;
    }
    if (amenityLower.includes('tennis') || amenityLower.includes('court') || amenityLower.includes('sport')) {
      return <Gamepad2 {...iconProps} />;
    }
    if (amenityLower.includes('jogging') || amenityLower.includes('track') || amenityLower.includes('running')) {
      return <Dumbbell {...iconProps} />;
    }
    
    // Default icon for unmatched amenities
    return <Shield {...iconProps} />;
  };

  const { data: property, isPending, isError } = useQuery({
    queryKey: ["property-detail", identifier, type],
    queryFn: () => fetchPropertyDetail(identifier, type),
  });

  const {
    data: neighborhoodData,
    isPending: isNeighborhoodPending,
    isError: isNeighborhoodError,
    refetch: refetchNeighborhood,
  } = useQuery({
    queryKey: ["neighborhood-insights", property?._id],
    queryFn: () => neighborhoodService.getNeighborhoodInsights(property!._id),
    enabled: !!property?._id,
  });

  // Helper: server populates ownerId as an object {_id, name, ...}; extract the string ID safely
  const extractOwnerId = (rawOwnerId: any): string => {
    if (!rawOwnerId) return "";
    if (typeof rawOwnerId === "string") return rawOwnerId;
    return rawOwnerId?._id?.toString?.() ?? rawOwnerId?.id?.toString?.() ?? String(rawOwnerId);
  };

  const isOwner = useMemo(() => {
    if (!property || !user) return false;
    const propOwnerId = extractOwnerId(property.ownerId);
    const currentUserId = user.id || user._id;
    return propOwnerId === String(currentUserId);
  }, [property, user]);

  // Fetch wishlist to check if this property is wishlisted
  const { data: wishlistData } = useQuery({
    queryKey: ["wishlist"],
    queryFn: () => import("../../features/wishlist/services/wishlistService").then(m => m.fetchWishlist()),
    enabled: !!user && !isGuest, // Only fetch if user is authenticated
  });

  // Check if current property is in wishlist
  const isWishlisted = wishlistData?.some((item: any) => 
    item.property?._id === property?._id || item.property?.id === property?._id
  ) || false;

  // Fetch related/similar properties
  const { data: relatedData } = useQuery({
    queryKey: ["related-properties", property?.city, property?.category],
    queryFn: () => {
      const fetchFn = type === 'buy' ? fetchBuyListings : fetchRentListings;
      return fetchFn(1, 5, { city: property?.city, category: property?.category });
    },
    enabled: !!property,
  });

  const wishlistMutation = useMutation({
    mutationFn: (action: 'add' | 'remove') => {
      if (action === 'add') {
        return addToWishlist(property!._id);
      } else {
        return removeFromWishlist(property!._id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
    },
    onError: (error: any) => {
      Alert.alert(
        "Error", 
        error.response?.data?.message || "Failed to update wishlist. Please try again."
      );
    },
  });

  if (isPending) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (isError || !property) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Property not found.</Text>
        <View style={{ marginTop: 16 }}>
          <AppButton onPress={() => navigation.goBack()}>Go Back</AppButton>
        </View>
      </View>
    );
  }

  const isRent = property.listingType === "rent";
  const themeColor = isRent ? colors.primary : colors.success;
  const price = isRent ? property.monthlyRent : property.sellingPrice;
  
  const formatValue = (num: number) => {
    if (num >= 10000000) return `${(num / 10000000).toFixed(2)} Cr`;
    if (num >= 100000) return `${(num / 100000).toFixed(2)} L`;
    return num.toLocaleString("en-IN");
  };

  const formattedPrice = price ? `₹${formatValue(price)}${isRent ? '/mo' : ''}` : "Contact for price";

  const handleWishlistToggle = () => {
    if (!user || isGuest) {
      Alert.alert("Login Required", "You need to log in to save properties to your wishlist.", [
        { text: "Cancel", style: "cancel" },
        { text: "Login", onPress: async () => await logout() }
      ]);
      return;
    }

    const action = isWishlisted ? 'remove' : 'add';
    wishlistMutation.mutate(action);
  };

  const handleShare = async () => {
    try {
      const webUrl = property.slug 
        ? `https://renters.com/${isRent ? 'rent' : 'buy'}/${property.slug}`
        : "https://renters.com";
      await Share.share({
        title: property.title,
        message: `Check out this property on Renters: ${property.title} (${formattedPrice}) in ${property.city}.\n\nView details & PDF brochure: ${webUrl}`,
        url: webUrl
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleCall = () => {
    if (property.ownerPhone) {
      Linking.openURL(`tel:${property.ownerPhone}`);
    } else {
      Alert.alert("Contact Unavailable", "Phone number is not provided for this property.");
    }
  };

  const handleMessage = async () => {
    if (!user) {
      Alert.alert("Login Required", "You need to log in to message the owner.", [
        { text: "Cancel", style: "cancel" },
        { text: "Login", onPress: async () => await logout() }
      ]);
      return;
    }

    // Extract the actual string ID — server may populate ownerId as an object
    const rawOwner = property?.ownerId || (property as any)?.owner;
    const ownerIdStr = extractOwnerId(rawOwner);
    if (!ownerIdStr || !property?._id) return;

    if (user._id === ownerIdStr || user.id === ownerIdStr) {
      Alert.alert("Notice", "This is your own property.");
      return;
    }

    setIsCreatingConversation(true);
    try {
      const result = await messageService.createConversation(ownerIdStr, property._id);
      if (result.success) {
        const conversationId = result.data?.conversation?._id || result.data?.conversation?.id || result.data?._id || result.data?.id;
        navigation.navigate("Messages" as any, { conversationId });
      } else {
        Alert.alert("Error", result.message || "Failed to start conversation.");
      }
    } catch (error: any) {
      console.error("Error creating conversation:", error);
      Alert.alert("Error", error.response?.data?.message || "Could not start a conversation.");
    } finally {
      setIsCreatingConversation(false);
    }
  };

  const parseCoordsFromProp = () => {
    if (property.mapLocation) {
      const parts = property.mapLocation.split(',').map(p => parseFloat(p.trim()));
      if (parts.length === 2) return { lat: parts[0], lng: parts[1] };
    }
    if (property.location?.coordinates?.length === 2) {
      return { lat: property.location.coordinates[1], lng: property.location.coordinates[0] };
    }
    return null;
  };

  const relatedItems = relatedData?.items.filter(i => i._id !== property._id).slice(0, 4) || [];

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Image Section with Overlay */}
        <View style={styles.heroSection}>
          {/* Fixed Header Overlay on top of Image */}
          <View style={[styles.headerActions, { top: insets.top > 0 ? insets.top + 8 : 14 }]}>
            <Pressable onPress={() => navigation.goBack()} style={styles.iconBubble}>
              <ArrowLeft size={22} color="#FFFFFF" />
            </Pressable>
            <View style={styles.headerRightActions}>
              <Pressable onPress={handleShare} style={styles.iconBubble}>
                <Share2 size={22} color="#FFFFFF" />
              </Pressable>
              <Pressable 
                onPress={handleWishlistToggle} 
                style={styles.iconBubble}
                disabled={wishlistMutation.isPending}
              >
                <Heart 
                  size={22} 
                  color="#FFFFFF" 
                  fill={isWishlisted ? "#FFFFFF" : "transparent"} 
                />
              </Pressable>
            </View>
          </View>

          {/* Hero Image */}
          <View style={styles.imageWrapper}>
            <ImageGallery images={property.photos || []} title={property.title} />
          </View>

          {/* Overlay Content on Image */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.8)']}
            locations={[0, 0.5, 1]}
            style={styles.heroOverlay}
            pointerEvents="none"
          >
            {/* Badges */}
            <View style={styles.heroBadgesRow} pointerEvents="auto">
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeText}>For {isRent ? 'Rent' : 'Sale'}</Text>
              </View>
              {property.category && (
                <View style={[styles.heroBadge, styles.heroBadgeCategory]}>
                  <Text style={styles.heroBadgeText}>{property.category}</Text>
                </View>
              )}
            </View>

            {/* Title */}
            <Text style={styles.heroTitle}>{property.title}</Text>
            
            {/* Location */}
            <View style={styles.heroLocationRow}>
              <MapPin size={16} color="#FFFFFF" />
              <Text style={styles.heroLocationText}>
                {property.address ? `${property.address}, ` : ""}{property.city}
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* Price and Specs Row */}
        <View style={styles.priceSpecsSection}>
          <View style={styles.priceSpecsRow}>
            {/* Price */}
            <View style={styles.priceBox}>
              <View style={styles.priceRow}>
                <IndianRupee size={18} color={colors.textPrimary} strokeWidth={2.5} />
                <Text style={styles.priceValue}>{formattedPrice.replace('₹', '').replace('/mo', '')}</Text>
                {isRent && <Text style={styles.priceSuffix}>/mo</Text>}
              </View>
            </View>

            {/* Specs */}
            <View style={styles.specItem}>
              <View style={styles.specIconBox}>
                <Bed size={18} color={colors.textPrimary} strokeWidth={2.5} />
              </View>
              <Text style={styles.specValue}>{property.bedrooms ?? '-'}</Text>
              <Text style={styles.specLabelSmall}>Beds</Text>
            </View>

            <View style={styles.specItem}>
              <View style={styles.specIconBox}>
                <Bath size={18} color={colors.textPrimary} strokeWidth={2.5} />
              </View>
              <Text style={styles.specValue}>{property.bathrooms ?? '-'}</Text>
              <Text style={styles.specLabelSmall}>Baths</Text>
            </View>

            <View style={styles.specItem}>
              <View style={styles.specIconBox}>
                <Sofa size={18} color={colors.textPrimary} strokeWidth={2.5} />
              </View>
              <Text style={styles.specValue} numberOfLines={1}>
                {property.furnishing === 'fully' ? 'Full' : property.furnishing === 'semi' ? 'Semi' : 'None'}
              </Text>
              <Text style={styles.specLabelSmall}>Furnish</Text>
            </View>
          </View>
        </View>

        {/* About this property */}
        {property.description && (
          <View style={styles.aboutSection}>
            <Text style={styles.aboutHeading}>About this property</Text>
            <Text style={styles.aboutText} numberOfLines={3}>
              {property.description}
            </Text>
          </View>
        )}

        {/* Virtual Tour Section */}
        {property.virtualTour && property.virtualTour.type !== "none" && (
          <View style={styles.paddedSection}>
            <CollapsibleSection title="Virtual Tour" defaultOpen={true}>
              <Suspense fallback={<ActivityIndicator size="small" color={colors.primary} />}>
                {property.virtualTour.type === "matterport" && (
                  <MatterportEmbed url={property.virtualTour.matterportUrl} />
                )}
                {property.virtualTour.type === "panorama_360" && (
                  <PanoramaViewer panoramaImages={property.virtualTour.panoramaImages} />
                )}
                {property.virtualTour.type === "video" && (
                  <VideoWalkthrough 
                    videoUrl={property.virtualTour.videoUrl} 
                    posterImage={property.photos && property.photos[0] ? property.photos[0] : undefined}
                  />
                )}
              </Suspense>
            </CollapsibleSection>
          </View>
        )}

        {/* EMI Calculator (Buy properties only) */}
        {!isRent && (
          <View style={styles.paddedSection}>
            <EmiCalculator propertyPrice={price} />
          </View>
        )}

        {/* Additional Details - Collapsible */}
        {isRent && (property.securityDeposit || property.maintenanceCharge) && (
          <View style={styles.paddedSection}>
            <CollapsibleSection title="Additional Costs">
              <View style={styles.additionalCostsGrid}>
                {(property.securityDeposit ?? 0) > 0 && (
                  <View style={styles.costItemCard}>
                    <Text style={styles.costLabel}>Security Deposit</Text>
                    <Text style={styles.costVal}>₹{(property.securityDeposit ?? 0).toLocaleString("en-IN")}</Text>
                  </View>
                )}
                {(property.maintenanceCharge ?? 0) > 0 && (
                  <View style={styles.costItemCard}>
                    <Text style={styles.costLabel}>Maintenance</Text>
                    <Text style={styles.costVal}>₹{(property.maintenanceCharge ?? 0).toLocaleString("en-IN")}/mo</Text>
                  </View>
                )}
              </View>
            </CollapsibleSection>
          </View>
        )}

        {/* Detailed Grid Map Array (Age, Facing, Floor, Parking) */}
        <View style={styles.paddedSection}>
          <CollapsibleSection title="Property Details">
            <View style={styles.detailsGrid}>
              <DetailItem
                label="Floor"
                value={
                  property.floorNumber != null
                    ? `${property.floorNumber} ${property.totalFloors ? `of ${property.totalFloors}` : ""}`
                    : null
                }
                s={styles}
              />
              <DetailItem label="Facing" value={property.facingDirection} s={styles} />
              <DetailItem label="Property Age" value={property.propertyAge} s={styles} />
              <DetailItem label="Parking" value={property.parking} s={styles} />
              <DetailItem label="Balconies" value={String(property.balconies || 0)} s={styles} />
              <DetailItem label="Preferred Tenants" value={property.preferredTenants} s={styles} />
              <DetailItem
                label="Available From"
                value={property.availableFrom ? new Date(property.availableFrom).toLocaleDateString() : null}
                s={styles}
              />
            </View>
          </CollapsibleSection>
        </View>

        {/* Amenities Array */}
        {property.amenities && property.amenities.length > 0 && (
          <View style={styles.paddedSection}>
            <CollapsibleSection 
              title="Amenities" 
              icon={<Sparkles size={16} color={colors.primary} strokeWidth={2} />}
            >
              <View style={styles.amenitiesWrap}>
                {property.amenities.map((amenity, idx) => (
                  <View key={idx} style={styles.amenityBox}>
                    <View style={styles.amenityIconContainer}>
                      {getAmenityIcon(amenity)}
                    </View>
                    <Text style={styles.amenityText}>{amenity}</Text>
                  </View>
                ))}
              </View>
            </CollapsibleSection>
          </View>
        )}

        {/* Location Section */}
        <View style={styles.paddedSection}>
          <PropertyLocation property={property} />
        </View>

        {/* Neighborhood Insights Section (Collapsible, collapsed by default) */}
        <View style={styles.paddedSection}>
          <CollapsibleSection title="Neighborhood Insights" defaultOpen={false}>
            {isNeighborhoodPending ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={{ color: colors.textSecondary, marginTop: 8 }}>Loading neighborhood details...</Text>
              </View>
            ) : isNeighborhoodError ? (
              <View style={styles.errorContainer}>
                <Text style={{ color: colors.error }}>Failed to load neighborhood details.</Text>
                <AppButton style={{ marginTop: 8 }} onPress={() => refetchNeighborhood()}>Retry</AppButton>
              </View>
            ) : neighborhoodData && neighborhoodData.available === false ? (
              <View style={styles.emptyContainer}>
                <Text style={{ color: colors.textSecondary, textAlign: "center" }}>
                  Neighborhood insights aren't available for this location yet.
                </Text>
              </View>
            ) : neighborhoodData ? (
              <View>
                {/* Score Gauges */}
                <View style={styles.gaugesRow}>
                  <ScoreGauge score={neighborhoodData.walkScore} label="Walk Score" />
                  <ScoreGauge score={neighborhoodData.transitScore} label="Transit Score" />
                </View>

                {/* Amenities List */}
                <AmenitiesList
                  categories={neighborhoodData.categories}
                  activeCategory={activeCategory}
                  onCategoryChange={(cat: any) => {
                    setActiveCategory(cat);
                    setSelectedAmenity(null);
                  }}
                  onAmenitySelect={(item) => setSelectedAmenity(item)}
                />

                {/* Neighborhood Map */}
                <NeighborhoodMap
                  propertyLat={parseCoordsFromProp()?.lat || 0}
                  propertyLng={parseCoordsFromProp()?.lng || 0}
                  propertyTitle={property.title}
                  amenities={neighborhoodData.categories[activeCategory] || []}
                  selectedAmenity={selectedAmenity}
                />
              </View>
            ) : null}
          </CollapsibleSection>
        </View>

        {/* Nearby Places Section */}
        <View style={styles.paddedSection}>
          <NearbyPlaces property={property} />
        </View>

        {/* Commute Calculator Section */}
        <View style={styles.paddedSection}>
          <CommuteCalculator propertyCoords={parseCoordsFromProp()} />
        </View>

        {/* Owner Card Info */}
        <View style={styles.section}>
          <Text style={styles.subHeading}>Listed By</Text>
          <View style={styles.ownerCard}>
            <View style={styles.ownerAvatar}>
<Text style={styles.ownerAvatarText}>{property.ownerName?.charAt(0) || 'O'}</Text>
            </View>
            <View style={styles.ownerInfo}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={styles.ownerName}>{property.ownerName || 'Owner'}</Text>
                {((property.ownerId as any)?.isVerified || (property as any).owner?.isVerified || (property as any).ownerId?.verified || property.verified) ? (
                  <VerifiedBadge size={16} />
                ) : null}
              </View>
              {property.ownerType ? (
                <Text style={styles.ownerType}>{property.ownerType}</Text>
              ) : null}
            </View>
          </View>
        </View>

        {/* Visit Booking Scheduling section */}
        {isOwner ? (
          <View style={styles.paddedSection}>
            <View style={[styles.ownerAvailabilityCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Calendar size={20} color={colors.primary} style={{ marginBottom: 6 }} />
              <Text style={[styles.ownerAvailabilityTitle, { color: colors.textPrimary }]}>
                Listing Availability
              </Text>
              <Text style={[styles.ownerAvailabilityDesc, { color: colors.textSecondary }]}>
                Configure dates, time slots, and overrides for prospective viewings.
              </Text>
              <AppButton
                onPress={() =>
                  navigation.navigate("AvailabilityEditor", {
                    propertyId: property._id,
                    propertyTitle: property.title,
                  })
                }
                style={{ width: "100%", marginTop: 8 }}
              >
                Manage Availability
              </AppButton>
            </View>
          </View>
        ) : (
          <View style={styles.paddedSection}>
            <BookingWidget
              propertyId={property._id}
              ownerId={extractOwnerId(property.ownerId)}
              propertyTitle={property.title}
            />
          </View>
        )}

        {/* Similar Listings */}
        {relatedItems.length > 0 && (
          <View style={[styles.section, { paddingBottom: 20 }]}>
            <Text style={styles.subHeading}>Similar Properties in {property.city}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>
              {relatedItems.map(item => (
                <View key={item._id} style={{ width: 280 }}>
                  <PropertyCard 
                    property={item} 
                    onPress={() => navigation.push("PropertyDetail", {
              identifier: item.slug || item._id,
              type: item.listingType || type
            })} 
                  />
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Padding for sticky footer */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Sticky Mobile Contact Bar */}
      <MobileContactBar 
        property={property} 
        onCall={handleCall} 
        onMessage={handleMessage} 
        isCreatingConversation={isCreatingConversation}
      />
    </SafeAreaView>
  );
}

// Mini Detail Grid Item
function DetailItem({
  label,
  value,
  s,
}: {
  label: string;
  value?: string | null;
  s: ReturnType<typeof getStyles>;
}) {
  if (!value) return null;
  return (
    <View style={s.detailItem}>
      <Text style={s.detailLabel}>{label}</Text>
      <Text style={s.detailValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const getStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    screen: { flex: 1 },
    content: {},
    center: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
      backgroundColor: colors.background,
    },
    errorText: { color: colors.error, fontSize: 16, fontWeight: "600" },
    
    // Hero Section
    heroSection: {
      position: 'relative',
      height: 420,
    },
    imageWrapper: {
      width: '100%',
      height: '100%',
    },
    headerActions: {
      position: "absolute",
      top: 14,
      left: 16,
      right: 16,
      zIndex: 10,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    iconBubble: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(0, 0, 0, 0.4)",
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.2)",
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    headerRightActions: { 
      flexDirection: "row", 
      gap: 12 
    },
    heroOverlay: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      padding: 20,
      paddingBottom: 24,
    },
    heroBadgesRow: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 12,
    },
    heroBadge: {
      backgroundColor: 'rgba(255, 255, 255, 0.25)',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
    },
    heroBadgeCategory: {
      backgroundColor: 'rgba(34, 197, 94, 0.3)',
    },
    heroBadgeText: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '700',
      textTransform: 'capitalize',
    },
    heroTitle: {
      fontSize: 24,
      fontWeight: '900',
      color: '#FFFFFF',
      letterSpacing: -0.5,
      marginBottom: 8,
      textShadowColor: 'rgba(0, 0, 0, 0.5)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 4,
    },
    heroLocationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    heroLocationText: {
      fontSize: 14,
      color: '#FFFFFF',
      fontWeight: '600',
      textShadowColor: 'rgba(0, 0, 0, 0.5)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 4,
    },

    // Price and Specs Section
    priceSpecsSection: {
      backgroundColor: colors.surface,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    priceSpecsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    },
    priceBox: {
      flex: 0,
      minWidth: 100,
    },
    priceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
    },
    priceValue: {
      fontSize: 24,
      fontWeight: '900',
      color: colors.textPrimary,
      lineHeight: 26,
      letterSpacing: -0.5,
    },
    priceSuffix: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: '600',
      lineHeight: 26,
      marginLeft: 2,
    },
    specItem: {
      alignItems: 'center',
      gap: 2,
      minWidth: 55,
    },
    specIconBox: {
      width: 36,
      height: 36,
      borderRadius: 8,
      backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F3F4F6',
      alignItems: 'center',
      justifyContent: 'center',
    },
    specValue: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.textPrimary,
      textAlign: 'center',
      lineHeight: 18,
    },
    specLabelSmall: {
      fontSize: 10,
      color: colors.textSecondary,
      fontWeight: '600',
      textAlign: 'center',
    },

    // About Section
    aboutSection: {
      paddingHorizontal: 20,
      paddingVertical: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    aboutHeading: {
      fontSize: 18,
      fontWeight: '900',
      color: colors.textPrimary,
      marginBottom: 12,
      letterSpacing: -0.3,
    },
    aboutText: {
      fontSize: 15,
      color: colors.textSecondary,
      lineHeight: 24,
    },

    section: { paddingHorizontal: 20, paddingTop: 18 },
    paddedSection: { paddingHorizontal: 16, marginTop: 14 },
    badgesRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
    contentPadded: { paddingTop: 16 },
    topBadgesRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
    badgeOutline: {
      borderWidth: 1.5,
      borderRadius: 6,
      paddingHorizontal: 14,
      paddingVertical: 6,
      backgroundColor: isDark ? "rgba(255,255,255,0.03)" : colors.surface,
    },
    badgeText: { fontSize: 13, fontWeight: "700" },
    badgePrimary: {
      borderRadius: 6,
      paddingHorizontal: 14,
      paddingVertical: 6,
    },
    badgeTextWhite: { color: "#FFFFFF", fontSize: 13, fontWeight: "700", textTransform: "capitalize" },
    badgeSoft: {
      borderRadius: 6,
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderWidth: 1,
    },
    badgeSoftText: { fontSize: 13, fontWeight: "700" },
    title: { fontSize: 24, fontWeight: "900", color: colors.textPrimary, letterSpacing: -0.6 },
    locationRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10 },
    locationText: { fontSize: 14, color: colors.textSecondary, fontWeight: "600" },
    quickSpecsRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 16, gap: 10 },
    specBox: {
      flex: 1,
      backgroundColor: colors.surface,
      paddingVertical: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    specVal: { fontSize: 18, fontWeight: "900" },
    specLabel: { fontSize: 10, color: colors.textSecondary, marginTop: 4, fontWeight: "800", letterSpacing: 0.5, textTransform: "uppercase" },
    priceCard: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 18,
      borderWidth: 1,
      borderColor: colors.border,
    },
    priceHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
    priceLabel: { fontSize: 13, color: colors.textSecondary, fontWeight: "700" },
    negotiableBadge: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 9999,
      paddingHorizontal: 10,
      paddingVertical: 4,
      backgroundColor: isDark ? "rgba(255,255,255,0.04)" : colors.input,
    },
    negotiableText: { color: colors.textPrimary, fontSize: 11, fontWeight: "800" },
    additionalCostsGrid: {
      flexDirection: 'row',
      gap: 16,
      marginTop: 8,
    },
    costItemCard: {
      flex: 1,
      backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : colors.background,
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    extraCosts: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 24,
      marginTop: 16,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    costItem: {},
    costLabel: { fontSize: 13, color: colors.textSecondary, marginBottom: 6, fontWeight: "600" },
    costVal: { fontSize: 18, fontWeight: "900", color: colors.textPrimary },
    descriptionText: { fontSize: 15, color: colors.textSecondary, lineHeight: 24 },
    detailsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
    detailItem: {
      width: "48%",
      backgroundColor: isDark ? "rgba(255,255,255,0.02)" : colors.background,
      padding: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    detailLabel: { fontSize: 12, color: colors.textSecondary, marginBottom: 4, fontWeight: "600" },
    detailValue: { fontSize: 14, fontWeight: "800", color: colors.textPrimary, textTransform: "capitalize" },
    amenitiesWrap: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    amenityBox: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: isDark ? "rgba(255,255,255,0.02)" : colors.background,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 9999,
      borderWidth: 1,
      borderColor: colors.border,
    },
    amenityIconContainer: { 
      width: 20, 
      height: 20, 
      alignItems: 'center', 
      justifyContent: 'center',
      marginRight: 2,
    },
    amenityText: { fontSize: 13, fontWeight: "600", color: colors.textPrimary },
    subHeading: { fontSize: 18, fontWeight: "900", color: colors.textPrimary, marginBottom: 12, letterSpacing: -0.2 },
    ownerCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: colors.surface,
      padding: 16,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
    },
    ownerAvatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    ownerAvatarText: { color: "white", fontSize: 18, fontWeight: "800" },
    ownerInfo: { flex: 1 },
    ownerName: { fontSize: 16, fontWeight: "800", color: colors.textPrimary },
    ownerType: { fontSize: 13, color: colors.textSecondary, textTransform: "capitalize", marginTop: 2, fontWeight: "600" },
    ownerAvailabilityCard: {
      padding: 16,
      borderRadius: 16,
      borderWidth: 1.5,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 16,
    },
    ownerAvailabilityTitle: {
      fontSize: 14,
      fontWeight: "800",
      marginBottom: 4,
    },
    ownerAvailabilityDesc: {
      fontSize: 11,
      textAlign: "center",
      lineHeight: 16,
      marginBottom: 12,
    },
    gaugesRow: {
      flexDirection: "row",
      justifyContent: "space-around",
      alignItems: "center",
      marginVertical: 12,
    },
    loadingContainer: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 24,
    },
    errorContainer: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 24,
    },
    emptyContainer: {
      paddingVertical: 16,
      alignItems: "center",
      justifyContent: "center",
    },
  });
