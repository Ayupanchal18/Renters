import React from "react";
import { StyleSheet, Text, View, Image, Pressable, Dimensions, Share, Animated, AccessibilityInfo } from "react-native";
import { Heart, Share2, Bed, Bath, Home, Sofa } from "lucide-react-native";
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
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const [reduceMotion, setReduceMotion] = React.useState(false);

  React.useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      setReduceMotion(enabled);
    });
  }, []);

  const handlePressIn = () => {
    if (reduceMotion) return;
    Animated.spring(scaleAnim, {
      toValue: 1.02,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();
  };

  const handlePressOut = () => {
    if (reduceMotion) return;
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

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

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this property: ${property.title} in ${property.city || "your area"}. ${property.shortUrl || ""}`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={[styles.card, { backgroundColor: colors.card, shadowColor: isDark ? '#000' : '#000', transform: [{ scale: scaleAnim }] }]}>
        {/* Image Container */}
        <View style={styles.imageWrap}>
          {photo ? (
            <Image source={{ uri: photo }} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={[styles.image, styles.placeholder, { backgroundColor: colors.input }]}>
              <Text style={[styles.placeholderText, { color: colors.textSecondary }]}>No Photo</Text>
            </View>
          )}
          
          {/* Action Buttons Overlay */}
          <View style={styles.actionButtonsOverlay}>
            <Pressable 
              style={styles.actionButton} 
              onPress={handleShare}
            >
              <Share2 
                size={20} 
                color="#fff" 
              />
            </Pressable>
            
            {onWishlistToggle && (
              <Pressable 
                style={styles.actionButton} 
                onPress={onWishlistToggle}
              >
                <Heart 
                  size={20} 
                  color={isWishlisted ? colors.error : "#fff"} 
                  fill={isWishlisted ? colors.error : "rgba(0,0,0,0.3)"} 
                />
              </Pressable>
            )}
          </View>

          {/* Price Badge Overlay */}
          <View style={[styles.priceBadgeOverlay, { backgroundColor: colors.surface }]}>
            <Text style={[styles.overlayPrice, { color: themeColor }]}>{formattedPrice}</Text>
          </View>

          {/* Status Badges */}
          <View style={styles.statusBadges}>
            <View style={{ flexDirection: "row", gap: 6 }}>
              {isVerified && (
                <Badge variant="success" textStyle={styles.badgeLabel}>
                  Verified
                </Badge>
              )}
              {property.virtualTour && property.virtualTour.type !== "none" && (
                <Badge 
                  variant={property.virtualTour.type === "video" ? "warning" : "default"}
                  textStyle={styles.badgeLabel}
                >
                  {property.virtualTour.type === "video" ? "Video" : "3D Tour"}
                </Badge>
              )}
            </View>
          </View>
        </View>

        {/* Info Container */}
        <View style={styles.info}>
          <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>{property.title}</Text>
          <Text style={[styles.location, { color: colors.textSecondary }]} numberOfLines={1}>
            {property.address || property.city}
          </Text>

          {(() => {
            const capitalizeFirst = (str?: string) => {
              if (!str) return "";
              return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
            };

            const specItems = [];

            // 1. Bed / Room / Property Type spec
            const bedText = property.bedrooms != null
              ? `${property.bedrooms} BHK`
              : (property.propertyType ? capitalizeFirst(property.propertyType) : (property.roomType ? capitalizeFirst(property.roomType) : 'Room'));
            
            specItems.push(
              <View key="beds" style={styles.specItemContainer}>
                <Bed size={14} color={colors.textSecondary} style={styles.specIcon} />
                <Text style={[styles.specItem, { color: colors.textPrimary }]} numberOfLines={1}>
                  {bedText}
                </Text>
              </View>
            );

            // 2. Bath spec
            const bathText = property.bathrooms != null
              ? `${property.bathrooms} Bath`
              : (property.bathroomType ? `${capitalizeFirst(property.bathroomType)}` : 'Bath');
            
            specItems.push(
              <View key="baths" style={styles.specItemContainer}>
                <Bath size={14} color={colors.textSecondary} style={styles.specIcon} />
                <Text style={[styles.specItem, { color: colors.textPrimary }]} numberOfLines={1}>
                  {bathText}
                </Text>
              </View>
            );

            // 3. Area / Furnishing spec
            const areaText = property.builtUpArea != null
              ? `${property.builtUpArea} sqft`
              : (property.furnishing ? capitalizeFirst(property.furnishing) : 'Furnished');
            const AreaIcon = property.builtUpArea != null ? Home : Sofa;
            
            specItems.push(
              <View key="area" style={styles.specItemContainer}>
                <AreaIcon size={14} color={colors.textSecondary} style={styles.specIcon} />
                <Text style={[styles.specItem, { color: colors.textPrimary }]} numberOfLines={1}>
                  {areaText}
                </Text>
              </View>
            );

            return (
              <View style={[styles.specsRow, { borderTopColor: colors.border }]}>
                {specItems.reduce((acc, curr, idx) => {
                  if (idx === 0) return [curr];
                  return [
                    ...acc,
                    <View key={`divider-${idx}`} style={[styles.specDivider, { backgroundColor: colors.border }]} />,
                    curr
                  ];
                }, [] as React.ReactNode[])}
              </View>
            );
          })()}
        </View>
      </Animated.View>
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
  actionButtonsOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
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
    flexShrink: 1,
  },
  specDivider: {
    width: 1,
    height: 14,
    marginHorizontal: 12,
  },
  specItemContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  specIcon: {
    marginRight: 6,
  }
});
