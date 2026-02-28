import React from "react";
import { StyleSheet, Text, View, Image, Pressable, Dimensions } from "react-native";
import { Heart } from "lucide-react-native";
import { useTheme } from "../../theme/useTheme";
import type { Property } from "../../types/types";
import Badge from "./Badge";

const SCREEN_WIDTH = Dimensions.get("window").width;
const CARD_WIDTH = SCREEN_WIDTH - 40;

interface PropertyCardProps {
  property: Property;
  onPress: () => void;
  isWishlisted?: boolean;
  onWishlistToggle?: () => void;
}

export default function PropertyCard({ property, onPress, isWishlisted, onWishlistToggle }: PropertyCardProps) {
  const { colors, isDark } = useTheme();
  const isBuy = property.listingType === "buy";
  const price = isBuy ? property.sellingPrice : property.monthlyRent;
  const priceLabel = isBuy ? "" : "/mo";

  const formatValue = (num: number) => {
    if (num >= 10000000) return `${(num / 10000000).toFixed(1)} Cr`;
    if (num >= 100000) return `${(num / 100000).toFixed(1)} L`;
    return num.toLocaleString("en-IN");
  };

  const formattedPrice = price
    ? `₹${formatValue(price)}${priceLabel}`
    : "Price on request";

  const themeColor = isBuy ? colors.success : colors.primary;

  const photo =
    property.photos && property.photos.length > 0
      ? property.photos[0]
      : undefined;

  const isVerified = property.verificationStatus?.toLowerCase() === 'verified' || property.verified;

  return (
    <Pressable onPress={onPress} style={[styles.card, { backgroundColor: colors.card, shadowColor: isDark ? '#000' : '#000' }]}>
      {/* Image Container */}
      <View style={styles.imageWrap}>
        {photo ? (
          <Image source={{ uri: photo }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.image, styles.placeholder, { backgroundColor: colors.input }]}>
            <Text style={[styles.placeholderText, { color: colors.textSecondary }]}>No Photo</Text>
          </View>
        )}
        
        {/* Wishlist Button */}
        {onWishlistToggle && (
          <Pressable 
            style={styles.wishlistOverlay} 
            onPress={onWishlistToggle}
          >
            <Heart 
              size={22} 
              color={isWishlisted ? colors.error : "#fff"} 
              fill={isWishlisted ? colors.error : "rgba(0,0,0,0.3)"} 
            />
          </Pressable>
        )}

        {/* Price Badge Overlay */}
        <View style={[styles.priceBadgeOverlay, { backgroundColor: colors.surface }]}>
          <Text style={[styles.overlayPrice, { color: themeColor }]}>{formattedPrice}</Text>
        </View>

        {/* Status Badges */}
        <View style={styles.statusBadges}>
          {isVerified && (
            <Badge variant="success" textStyle={styles.badgeLabel}>
              Verified
            </Badge>
          )}
        </View>
      </View>

      {/* Info Container */}
      <View style={styles.info}>
        <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>{property.title}</Text>
        <Text style={[styles.location, { color: colors.textSecondary }]} numberOfLines={1}>
          {property.address || property.city}
        </Text>

        <View style={[styles.specsRow, { borderTopColor: colors.border }]}>
          {property.bedrooms != null && (
            <Text style={[styles.specItem, { color: colors.textPrimary }]}>{property.bedrooms} BHK</Text>
          )}
          <View style={[styles.specDivider, { backgroundColor: colors.border }]} />
          {property.bathrooms != null && (
            <Text style={[styles.specItem, { color: colors.textPrimary }]}>{property.bathrooms} Bath</Text>
          )}
          <View style={[styles.specDivider, { backgroundColor: colors.border }]} />
          {property.builtUpArea != null && (
            <Text style={[styles.specItem, { color: colors.textPrimary }]}>{property.builtUpArea} sqft</Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  imageWrap: {
    position: 'relative',
    height: 220,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 14,
  },
  wishlistOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
  },
  priceBadgeOverlay: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  overlayPrice: {
    fontSize: 16,
    fontWeight: '800',
  },
  statusBadges: {
    position: 'absolute',
    top: 12,
    left: 12,
  },
  badgeLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
  info: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  location: {
    fontSize: 14,
    marginBottom: 12,
  },
  specsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 12,
  },
  specItem: {
    fontSize: 13,
    fontWeight: '600',
  },
  specDivider: {
    width: 1,
    height: 14,
    marginHorizontal: 12,
  }
});
