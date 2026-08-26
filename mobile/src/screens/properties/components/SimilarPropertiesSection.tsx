import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, MapPin, Tag } from "lucide-react-native";
import { useTheme } from "../../../theme/useTheme";
import PropertyCard from "../../../components/ui/PropertyCard";
import { fetchSimilarProperties } from "../../../features/properties/services/propertyService";
import type { Property } from "../../../types/types";

interface Props {
  property: Property;
  type: "rent" | "buy";
  navigation: any;
}

export default function SimilarPropertiesSection({ property, type, navigation }: Props) {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);
  const [activeFilter, setActiveFilter] = useState<"all" | "locality" | "budget">("all");

  const identifier = property.slug || property._id;
  const locality = property.locality || "";
  const city = property.city || "";

  const { data: properties = [], isPending } = useQuery({
    queryKey: ["similar-properties", identifier],
    queryFn: () => fetchSimilarProperties(identifier, 8),
    enabled: !!identifier,
  });

  if (!isPending && properties.length === 0) {
    return null;
  }

  const getCityBase = (str?: string) => (str ? str.split(",")[0].toLowerCase().trim() : "");

  // Filter items based on active tab
  const filteredProperties = properties.filter((item: any) => {
    if (activeFilter === "locality") {
      if (item.isSameCity) return true;
      const targetCityBase = getCityBase(city);
      const candCityBase = getCityBase(item.city);
      const sameLocality =
        item.locality &&
        locality &&
        (item.locality.toLowerCase().trim().includes(locality.toLowerCase().trim()) ||
          locality.toLowerCase().trim().includes(item.locality.toLowerCase().trim()));
      const sameCity =
        candCityBase &&
        targetCityBase &&
        (candCityBase.includes(targetCityBase) ||
          targetCityBase.includes(candCityBase) ||
          (item.address && item.address.toLowerCase().includes(targetCityBase)));
      return sameLocality || sameCity;
    }
    if (activeFilter === "budget") {
      return (
        item.matchReasons?.includes("Similar Price") ||
        item.matchReasons?.includes("Similar Budget") ||
        item.matchReason === "Similar Price" ||
        item.matchReason === "Similar Budget"
      );
    }
    return true;
  });

  return (
    <View style={styles.container}>
      {/* Title Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={styles.iconContainer}>
            <Sparkles size={16} color={colors.primary} />
          </View>
          <Text style={styles.title}>Similar Properties</Text>
        </View>
        <Text style={styles.subtitle}>
          Recommended listings in {city || "your area"}
        </Text>
      </View>

      {/* Filter Chips */}
      {properties.length > 2 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterBar}
        >
          <Pressable
            onPress={() => setActiveFilter("all")}
            style={[
              styles.chip,
              activeFilter === "all" && styles.chipActive,
            ]}
          >
            <Text
              style={[
                styles.chipText,
                activeFilter === "all" && styles.chipTextActive,
              ]}
            >
              All ({properties.length})
            </Text>
          </Pressable>

          {locality ? (
            <Pressable
              onPress={() => setActiveFilter("locality")}
              style={[
                styles.chip,
                activeFilter === "locality" && styles.chipActive,
              ]}
            >
              <MapPin
                size={12}
                color={activeFilter === "locality" ? colors.surface : colors.textSecondary}
              />
              <Text
                style={[
                  styles.chipText,
                  activeFilter === "locality" && styles.chipTextActive,
                ]}
              >
                Same Locality ({locality})
              </Text>
            </Pressable>
          ) : null}

          <Pressable
            onPress={() => setActiveFilter("budget")}
            style={[
              styles.chip,
              activeFilter === "budget" && styles.chipActive,
            ]}
          >
            <Tag
              size={12}
              color={activeFilter === "budget" ? colors.surface : colors.textSecondary}
            />
            <Text
              style={[
                styles.chipText,
                activeFilter === "budget" && styles.chipTextActive,
              ]}
            >
              Similar Budget
            </Text>
          </Pressable>
        </ScrollView>
      )}

      {/* Content Carousel */}
      {isPending ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingText}>Finding recommendations...</Text>
        </View>
      ) : filteredProperties.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>
            No properties found for this filter. Try selecting "All".
          </Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.carouselList}
        >
          {filteredProperties.map((item) => {
            const matchTag = (item as any).matchReason;
            return (
              <View key={item._id} style={styles.cardWrapper}>
                {matchTag ? (
                  <View style={styles.matchBadge}>
                    <Text style={styles.matchBadgeText}>{matchTag}</Text>
                  </View>
                ) : null}

                <PropertyCard
                  property={item}
                  onPress={() =>
                    navigation.push("PropertyDetail", {
                      identifier: item.slug || item._id,
                      type: item.listingType || type,
                    })
                  }
                />
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const getStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    container: {
      marginVertical: 12,
      paddingVertical: 16,
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
    },
    header: {
      paddingHorizontal: 16,
      marginBottom: 12,
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    iconContainer: {
      padding: 6,
      borderRadius: 8,
      backgroundColor: `${colors.primary}15`,
    },
    title: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.textPrimary,
    },
    subtitle: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    filterBar: {
      paddingHorizontal: 16,
      gap: 8,
      marginBottom: 12,
    },
    chip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
    },
    chipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    chipText: {
      fontSize: 12,
      fontWeight: "500",
      color: colors.textSecondary,
    },
    chipTextActive: {
      color: "#FFFFFF",
      fontWeight: "600",
    },
    loadingBox: {
      padding: 24,
      alignItems: "center",
      justifyContent: "center",
    },
    loadingText: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 8,
    },
    emptyBox: {
      padding: 20,
      alignItems: "center",
    },
    emptyText: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    carouselList: {
      paddingHorizontal: 16,
      gap: 14,
    },
    cardWrapper: {
      width: 280,
      position: "relative",
    },
    matchBadge: {
      position: "absolute",
      top: 12,
      left: 12,
      zIndex: 10,
      backgroundColor: "rgba(0, 0, 0, 0.75)",
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    matchBadgeText: {
      color: "#FFFFFF",
      fontSize: 10,
      fontWeight: "600",
    },
  });
