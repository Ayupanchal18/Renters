import React, { useState, useCallback } from "react";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  ActivityIndicator,
  Share,
  Pressable,
  FlatList,
  Alert,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Share2, Heart, MapPin, IndianRupee, Shield, CheckCircle, Clock } from "lucide-react-native";
import { fetchPropertyDetail, fetchRentListings, fetchBuyListings } from "../../features/properties/services/propertyService";
import { addToWishlist } from "../../features/wishlist/services/wishlistService";
import { colors } from "../../theme/tokens";
import { useAuth } from "../../features/auth/AuthContext";
import messageService from "../../features/messages/services/messageService";
import type { RootStackParamList } from "../../navigation/types";
import type { Property } from "../../types/types";

// Global UI Components
import AppButton from "../../components/ui/AppButton";
import ImageGallery from "../../components/ui/ImageGallery";
import MobileContactBar from "../../components/ui/MobileContactBar";
import CollapsibleSection from "../../components/ui/CollapsibleSection";
import Badge from "../../components/ui/Badge";
import PropertyCard from "../../components/ui/PropertyCard";

// Page Specific Components
import PropertyLocation from "./components/PropertyLocation";
import NearbyPlaces from "./components/NearbyPlaces";
import CommuteCalculator from "./components/CommuteCalculator";

type Props = NativeStackScreenProps<RootStackParamList, "PropertyDetail">;

export default function PropertyDetailScreen({ route, navigation }: Props) {
  const { identifier, type } = route.params;
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);

  const { data: property, isPending, isError } = useQuery({
    queryKey: ["property-detail", identifier, type],
    queryFn: () => fetchPropertyDetail(identifier, type),
  });

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
    mutationFn: () => addToWishlist(property!._id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
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
  const themeColor = isRent ? colors.primary : '#10b981';
  const price = isRent ? property.monthlyRent : property.sellingPrice;
  
  const formatValue = (num: number) => {
    if (num >= 10000000) return `${(num / 10000000).toFixed(2)} Cr`;
    if (num >= 100000) return `${(num / 100000).toFixed(2)} L`;
    return num.toLocaleString("en-IN");
  };

  const formattedPrice = price ? `₹${formatValue(price)}${isRent ? '/mo' : ''}` : "Contact for price";
  const isWishlisted = false; // TODO: Connect to explicit local state

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this property: ${property.title} in ${property.city}. ${property.shortUrl || "Link available on app"}`,
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
        { text: "Login", onPress: () => navigation.navigate("Login" as any) }
      ]);
      return;
    }

    const ownerId = property?.ownerId || (property as any)?.owner;    if (!ownerId || !property?._id) return;

    if (user._id === ownerId || user.id === ownerId) {
      Alert.alert("Notice", "This is your own property.");
      return;
    }

    setIsCreatingConversation(true);
    try {
      const result = await messageService.createConversation(ownerId, property._id);
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

  const verificationStatusText = property.verificationStatus?.toLowerCase();
  const getVerificationIcon = () => {
    if (verificationStatusText === 'verified') return <CheckCircle size={14} color={colors.success} />;
    if (verificationStatusText === 'pending') return <Clock size={14} color={colors.warning} />;
    return <Shield size={14} color={colors.textSecondary} />;
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
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Fixed Header Overlay on top of Gallery */}
        <View style={styles.headerActions}>
          <Pressable onPress={() => navigation.goBack()} style={styles.iconBtn}>
            <ArrowLeft size={20} color={colors.textPrimary} />
          </Pressable>
          <View style={styles.headerRightActions}>
            <Pressable onPress={handleShare} style={styles.iconBtn}>
              <Share2 size={20} color={colors.textPrimary} />
            </Pressable>
            <Pressable onPress={() => wishlistMutation.mutate()} style={styles.iconBtn}>
              <Heart 
                size={20} 
                color={isWishlisted ? colors.error : colors.textPrimary} 
                fill={isWishlisted ? colors.error : "transparent"} 
              />
            </Pressable>
          </View>
        </View>

        {/* Gallery Carousel */}
        <ImageGallery images={property.photos || []} title={property.title} />

        {/* Main Info Section */}
        <View style={styles.section}>
          <View style={styles.contentPadded}>
            <View style={styles.topBadgesRow}>
              <View style={styles.badgeOutline}>
                <Text style={styles.badgeText}>For {isRent ? 'Rent' : 'Sale'}</Text>
              </View>
              {property.verificationStatus?.toLowerCase() === 'verified' && (
                <View style={styles.badgePrimary}>
                  <Text style={styles.badgeTextWhite}>Verified</Text>
                </View>
              )}
              {property.category && (
                <View style={styles.badgeSuccess}>
                  <Text style={styles.badgeTextSuccess}>{property.category}</Text>
                </View>
              )}
            </View>

            <Text style={styles.title}>{property.title}</Text>
            
            <View style={styles.locationRow}>
              <MapPin size={16} color="#4F46E5" />
              <Text style={styles.locationText}>{property.address ? `${property.address}, ` : ""}{property.city}</Text>
            </View>

            {/* Quick Specs Row */}
            <View style={styles.quickSpecsRow}>
              <View style={styles.specBox}>
                <Text style={styles.specVal}>{property.bedrooms ?? '-'}</Text>
                <Text style={styles.specLabel}>BEDS</Text>
              </View>
              <View style={styles.specBox}>
                <Text style={styles.specVal}>{property.bathrooms ?? '-'}</Text>
                <Text style={styles.specLabel}>BATHS</Text>
              </View>
              <View style={styles.specBox}>
                <Text style={styles.specVal} numberOfLines={1}>
                  {property.furnishing === 'fully' ? 'Fully' : property.furnishing === 'semi' ? 'Semi' : 'Unfurnished'}
                </Text>
                <Text style={styles.specLabel}>FURNISHING</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Price Breakdown Card */}
        <View style={styles.section}>
          <View style={styles.priceCard}>
            <View style={styles.priceHeader}>
              <Text style={styles.priceLabel}>{isRent ? 'Monthly Rent' : 'Selling Price'}</Text>
              {(property.rentNegotiable || property.negotiable) && (
                <View style={styles.negotiableBadge}>
                  <Text style={styles.negotiableText}>Negotiable</Text>
                </View>
              )}
            </View>
            <View style={styles.priceValueRow}>
              <IndianRupee size={22} color="#0066FF" />
              <Text style={styles.priceValue}>{formattedPrice.replace('₹', '').replace('/mo', '')}</Text>
              {isRent && <Text style={styles.priceSuffix}>/mo</Text>}
            </View>

            {isRent && (property.securityDeposit || property.maintenanceCharge) && (
              <View style={styles.extraCosts}>
                {(property.securityDeposit ?? 0) > 0 && (
                  <View style={styles.costItem}>
                    <Text style={styles.costLabel}>Security Deposit</Text>
                    <Text style={styles.costVal}>₹{(property.securityDeposit ?? 0).toLocaleString("en-IN")}</Text>
                  </View>
                )}
                {(property.maintenanceCharge ?? 0) > 0 && (
                  <View style={styles.costItem}>
                    <Text style={styles.costLabel}>Maintenance</Text>
                    <Text style={styles.costVal}>₹{(property.maintenanceCharge ?? 0).toLocaleString("en-IN")}/mo</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>

        {/* Description Accordion */}
        {property.description && (
          <View style={styles.paddedSection}>
            <CollapsibleSection title="About this property">
              <Text style={styles.descriptionText}>{property.description}</Text>
            </CollapsibleSection>
          </View>
        )}

        {/* Detailed Grid Map Array (Age, Facing, Floor, Parking) */}
        <View style={styles.paddedSection}>
          <CollapsibleSection title="Property Details">
            <View style={styles.detailsGrid}>
              <DetailItem label="Floor" value={property.floorNumber != null ? `${property.floorNumber} ${property.totalFloors ? `of ${property.totalFloors}` : ""}` : null} />
              <DetailItem label="Facing" value={property.facingDirection} />
              <DetailItem label="Property Age" value={property.propertyAge} />
              <DetailItem label="Parking" value={property.parking} />
              <DetailItem label="Balconies" value={String(property.balconies || 0)} />
              <DetailItem label="Preferred Tenants" value={property.preferredTenants} />
              <DetailItem label="Available From" value={property.availableFrom ? new Date(property.availableFrom).toLocaleDateString() : null} />
            </View>
          </CollapsibleSection>
        </View>

        {/* Amenities Array */}
        {property.amenities && property.amenities.length > 0 && (
          <View style={styles.paddedSection}>
            <CollapsibleSection title="Amenities" count={property.amenities.length}>
              <View style={styles.amenitiesWrap}>
                {property.amenities.map((amenity, idx) => (
                  <View key={idx} style={styles.amenityBox}>
                    <Text style={styles.amenityIcon}>✨</Text>
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
              <Text style={styles.ownerName}>{property.ownerName || 'Owner'}</Text>
              {property.ownerType ? (
                <Text style={styles.ownerType}>{property.ownerType}</Text>
              ) : null}
            </View>
          </View>
        </View>

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
function DetailItem({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <View style={styles.detailItem}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  screen: { flex: 1 },
  content: {},
  center: {
    flex: 1, justifyContent: "center", alignItems: "center", padding: 24,
  },
  errorText: { color: colors.error, fontSize: 16, fontWeight: '600' },
  headerActions: {
    position: 'absolute',
    top: 40, left: 16, right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  headerRightActions: { flexDirection: 'row', gap: 12 },
  section: { paddingHorizontal: 20, paddingTop: 20 },
  paddedSection: { paddingHorizontal: 16, marginTop: 16 },
  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  contentPadded: { paddingTop: 20 },
  topBadgesRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  badgeOutline: {
    borderWidth: 1, borderColor: '#0066FF', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 4,
  },
  badgeText: { color: '#0066FF', fontSize: 12, fontWeight: '600' },
  badgePrimary: {
    backgroundColor: '#0066FF', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 4,
  },
  badgeTextWhite: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
  badgeSuccess: {
    backgroundColor: '#ECFDF5', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 4,
  },
  badgeTextSuccess: { color: '#10B981', fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  title: { fontSize: 26, fontWeight: '900', color: '#111827', letterSpacing: -0.5 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
  locationText: { fontSize: 15, color: '#6B7280', fontWeight: '500' },
  quickSpecsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 24, gap: 12 },
  specBox: {
    flex: 1,
    backgroundColor: '#FFFFFF', paddingVertical: 14,
    borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB',
    alignItems: 'center', justifyContent: 'center',
  },
  specVal: { fontSize: 16, fontWeight: '800', color: '#0066FF' },
  specLabel: { fontSize: 11, color: '#6B7280', marginTop: 6, fontWeight: '700' },
  priceCard: {
    backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  priceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  priceLabel: { fontSize: 13, color: '#4B5563', fontWeight: '600' },
  negotiableBadge: {
    borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 16,
    paddingHorizontal: 12, paddingVertical: 4, backgroundColor: '#F9FAFB'
  },
  negotiableText: { color: '#374151', fontSize: 11, fontWeight: '700' },
  priceValueRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  priceValue: { fontSize: 32, fontWeight: '900', color: '#0066FF' },
  priceSuffix: { fontSize: 13, color: '#0066FF', marginLeft: 4, fontWeight: '600' },
  extraCosts: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 24,
    marginTop: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: '#E5E7EB',
  },
  costItem: {},
  costLabel: { fontSize: 12, color: '#6B7280', marginBottom: 2, fontWeight: '500' },
  costVal: { fontSize: 15, fontWeight: '800', color: '#111827' },
  descriptionText: { fontSize: 15, color: colors.textSecondary, lineHeight: 24 },
  detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  detailItem: {
    width: '48%', backgroundColor: colors.background,
    padding: 12, borderRadius: 10, borderWidth: 1, borderColor: colors.border,
  },
  detailLabel: { fontSize: 12, color: colors.textSecondary, marginBottom: 4 },
  detailValue: { fontSize: 14, fontWeight: '600', color: colors.textPrimary, textTransform: 'capitalize' },
  amenitiesWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  amenityBox: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.background, paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 9999, borderWidth: 1, borderColor: colors.border,
  },
  amenityIcon: { fontSize: 14 },
  amenityText: { fontSize: 13, fontWeight: '500', color: colors.textPrimary },
  subHeading: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginBottom: 12 },
  ownerCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.surface, padding: 16, borderRadius: 16,
    borderWidth: 1, borderColor: colors.border,
  },
  ownerAvatar: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  ownerAvatarText: { color: 'white', fontSize: 18, fontWeight: '700' },
  ownerInfo: { flex: 1 },
  ownerName: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  ownerType: { fontSize: 13, color: colors.textSecondary, textTransform: 'capitalize', marginTop: 2 },
});
