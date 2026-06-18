import React from "react";
import { StyleSheet, View, Text, ScrollView, Pressable } from "react-native";
import {
  GraduationCap,
  HeartPulse,
  ShoppingBag,
  Utensils,
  Trees,
  Train,
  MapPin,
  ChevronRight,
} from "lucide-react-native";
import { useTheme } from "../../../theme/useTheme";
import { AmenityItem, NeighborhoodCategories } from "../../../features/properties/services/neighborhoodService";

interface AmenitiesListProps {
  categories: NeighborhoodCategories;
  activeCategory: keyof NeighborhoodCategories;
  onCategoryChange: (category: keyof NeighborhoodCategories) => void;
  onAmenitySelect?: (item: AmenityItem) => void;
}

export default function AmenitiesList({
  categories,
  activeCategory,
  onCategoryChange,
  onAmenitySelect,
}: AmenitiesListProps) {
  const { colors } = useTheme();

  const tabList: Array<{ key: keyof NeighborhoodCategories; label: string; icon: React.ReactNode }> = [
    {
      key: "schools",
      label: "Schools",
      icon: <GraduationCap size={16} color={activeCategory === "schools" ? "#ffffff" : colors.textSecondary} />,
    },
    {
      key: "hospitals",
      label: "Hospitals",
      icon: <HeartPulse size={16} color={activeCategory === "hospitals" ? "#ffffff" : colors.textSecondary} />,
    },
    {
      key: "groceries",
      label: "Groceries",
      icon: <ShoppingBag size={16} color={activeCategory === "groceries" ? "#ffffff" : colors.textSecondary} />,
    },
    {
      key: "restaurants",
      label: "Food",
      icon: <Utensils size={16} color={activeCategory === "restaurants" ? "#ffffff" : colors.textSecondary} />,
    },
    {
      key: "parks",
      label: "Parks",
      icon: <Trees size={16} color={activeCategory === "parks" ? "#ffffff" : colors.textSecondary} />,
    },
    {
      key: "transit",
      label: "Transit",
      icon: <Train size={16} color={activeCategory === "transit" ? "#ffffff" : colors.textSecondary} />,
    },
  ];

  const formatDistance = (meters: number) => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} km`;
    }
    return `${meters} m`;
  };

  const activeItems = categories[activeCategory] || [];

  return (
    <View style={styles.container}>
      {/* Horizontal Scrollable Categories */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsContainer}
      >
        {tabList.map((tab) => {
          const isActive = activeCategory === tab.key;
          const count = categories[tab.key]?.length || 0;
          return (
            <Pressable
              key={tab.key as string}
              style={[
                styles.tab,
                {
                  backgroundColor: isActive ? colors.primary : colors.input,
                  borderColor: isActive ? colors.primary : colors.border,
                },
              ]}
              onPress={() => onCategoryChange(tab.key)}
            >
              {tab.icon}
              <Text
                style={[
                  styles.tabText,
                  {
                    color: isActive ? "#ffffff" : colors.textPrimary,
                    fontWeight: isActive ? "800" : "600",
                  },
                ]}
              >
                {tab.label}
              </Text>
              <Text
                style={[
                  styles.badgeText,
                  {
                    color: isActive ? "rgba(255,255,255,0.8)" : colors.textSecondary,
                    backgroundColor: isActive ? "rgba(255,255,255,0.2)" : colors.border,
                  },
                ]}
              >
                {count}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Amenity Rows */}
      <View style={styles.listContainer}>
        {activeItems.length === 0 ? (
          <View style={styles.emptyState}>
            <MapPin size={24} color={colors.textSecondary} style={{ opacity: 0.5, marginBottom: 6 }} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No items found nearby in this category.
            </Text>
          </View>
        ) : (
          activeItems.map((item: AmenityItem, idx: number) => (
            <Pressable
              key={`${item.name}-${idx}`}
              style={[
                styles.row,
                {
                  borderBottomColor: idx === activeItems.length - 1 ? "transparent" : colors.border,
                },
              ]}
              onPress={() => onAmenitySelect?.(item)}
            >
              <View style={styles.leftInfo}>
                <View style={[styles.bullet, { backgroundColor: colors.primary + "15" }]}>
                  <MapPin size={14} color={colors.primary} />
                </View>
                <View style={styles.textContainer}>
                  <Text style={[styles.itemName, { color: colors.textPrimary }]} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={[styles.itemSub, { color: colors.textSecondary }]}>
                    {item.category.replace("_", " ")}
                  </Text>
                </View>
              </View>
              <View style={styles.rightInfo}>
                <Text style={[styles.distanceText, { color: colors.textPrimary }]}>
                  {formatDistance(item.distance)}
                </Text>
                <ChevronRight size={14} color={colors.textSecondary} />
              </View>
            </Pressable>
          ))
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
  },
  tabsContainer: {
    paddingHorizontal: 4,
    gap: 8,
    paddingBottom: 12,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    gap: 6,
  },
  tabText: {
    fontSize: 13,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "800",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
    overflow: "hidden",
  },
  listContainer: {
    marginTop: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  leftInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  bullet: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  textContainer: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "700",
  },
  itemSub: {
    fontSize: 11,
    textTransform: "capitalize",
    marginTop: 2,
  },
  rightInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  distanceText: {
    fontSize: 13,
    fontWeight: "800",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
  },
  emptyText: {
    fontSize: 12,
    fontWeight: "600",
  },
});
