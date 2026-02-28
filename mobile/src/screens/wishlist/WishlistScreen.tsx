import React, { useCallback, useMemo } from "react";
import {
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Text,
  View,
  RefreshControl,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { fetchWishlist } from "../../features/wishlist/services/wishlistService";
import PropertyCard from "../../components/ui/PropertyCard";
import { useTheme } from "../../theme/useTheme";
import type { WishlistItem } from "../../types/types";
import type { RootStackParamList } from "../../navigation/types";

type NavProp = NativeStackNavigationProp<RootStackParamList>;

export default function WishlistScreen() {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const navigation = useNavigation<NavProp>();
  const { data, isPending, isError, refetch, isRefetching } = useQuery({
    queryKey: ["wishlist"],
    queryFn: fetchWishlist,
  });

  const renderItem = useCallback(
    ({ item }: { item: WishlistItem }) => {
      if (!item.property) return null;
      return (
        <PropertyCard
          property={item.property}
          onPress={() =>
            navigation.navigate("PropertyDetail", {
              identifier: item.property.slug || item.property._id,
              type: "rent"
            })
          }
        />
      );
    },
    [navigation]
  );

  if (isPending) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={styles.errorText}>Failed to load your wishlist.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={(item) => item._id}
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[
        styles.list,
        (!data || data.length === 0) && styles.emptyContainer,
      ]}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={() => refetch()}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
      ListEmptyComponent={
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>♡</Text>
          <Text style={styles.emptyTitle}>No saved properties yet</Text>
          <Text style={styles.emptyText}>
            Tap the heart on any property to save it here.
          </Text>
        </View>
      }
    />
  );
}

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  list: { padding: 20, paddingBottom: 40 },
  emptyContainer: { flexGrow: 1 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  errorText: { color: colors.error, fontSize: 14 },
  emptyEmoji: { fontSize: 48, marginBottom: 8, color: colors.textSecondary },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
  },
});
