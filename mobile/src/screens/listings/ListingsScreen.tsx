import React, { useCallback, useState, useEffect, useMemo } from "react";
import {
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Text,
  View,
  RefreshControl,
  Pressable,
  TextInput,
  Modal,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import * as Location from 'expo-location';
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useInfiniteQuery } from "@tanstack/react-query";
import {
  SlidersHorizontal,
  LayoutGrid,
  Search,
  ChevronDown,
  Crosshair,
  Map as MapIcon,
  Filter,
} from "lucide-react-native";
import { fetchRentListings, fetchBuyListings } from "../../features/properties/services/propertyService";
import PropertyCard from "../../components/ui/PropertyCard";
import FilterDrawer from "./components/FilterDrawer";
import PropertyMapView from "./components/PropertyMapView";
import { useTheme } from "../../theme/useTheme";
import type { Property } from "../../types/types";
import type { RootStackParamList } from "../../navigation/types";

// Simulated wishlisted IDs (should be moved to an Auth/User context later)
const WISHLISTED_IDS = new Set<string>();

type NavProp = NativeStackNavigationProp<RootStackParamList>;

const PAGE_SIZE = 12;

export default function ListingsScreen() {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  
  const navigation = useNavigation<NavProp>();
  const route = useRoute<any>();
  
  const listingType = route.params?.type || (route.name.includes("Buy") ? "buy" : "rent");
  const accent = listingType === "buy" ? colors.success : colors.primary;
  
  const [filterVisible, setFilterVisible] = useState(false);
  
  // Initialize filters from route params, prioritizing searchData over initialFilters
  const initializeFilters = () => {
    const { searchData, initialFilters } = route.params || {};
    
    if (searchData) {
      // Convert searchData to filter format
      return {
        city: searchData.city || searchData.location || '',
        category: searchData.category || searchData.propertyType || '',
        q: searchData.q || searchData.keywords || '',
        ...initialFilters // Allow initialFilters to override if present
      };
    }
    
    return initialFilters || {};
  };
  
  const [filters, setFilters] = useState(initializeFilters());
  const [sortBy, setSortBy] = useState('newest');
  const [sortVisible, setSortVisible] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'map'>('grid');
  const [isLocating, setIsLocating] = useState(false);

  // Hero Section Local State
  const [heroCity, setHeroCity] = useState(filters.city || '');
  const [heroCategory, setHeroCategory] = useState(filters.category || '');
  const [heroQ, setHeroQ] = useState(filters.q || '');
  const [catPickerVisible, setCatPickerVisible] = useState(false);

  // Update filters when route params change (e.g., new search from home)
  useEffect(() => {
    const newFilters = initializeFilters();
    setFilters(newFilters);
    setHeroCity(newFilters.city || '');
    setHeroCategory(newFilters.category || '');
    setHeroQ(newFilters.q || '');
  }, [route.params]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isPending,
    refetch,
    isRefetching,
  } = useInfiniteQuery({
    queryKey: [listingType + "-listings", filters, sortBy],
    queryFn: ({ pageParam = 1 }) => {
      const fetchFn = listingType === 'buy' ? fetchBuyListings : fetchRentListings;
      return fetchFn(pageParam, PAGE_SIZE, { ...filters, sort: sortBy });
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      const fetched = lastPageParam * PAGE_SIZE;
      if (fetched >= lastPage.total) return undefined;
      return lastPageParam + 1;
    },
  });

  const allItems: Property[] = (data?.pages.flatMap((page) => page.items) ?? [])
    .filter(p => !listingType || p.listingType === listingType);
    
  const totalCount = data?.pages[0]?.total ?? 0;

  const handleApplyHeroSearch = () => {
    setFilters((prev: any) => ({
      ...prev,
      city: heroCity || undefined,
      category: heroCategory || undefined,
      q: heroQ || undefined
    }));
  };

  const handleGetLocation = async () => {
    try {
      setIsLocating(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please enable location permissions in your settings.');
        setIsLocating(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (reverseGeocode.length > 0) {
        const city = reverseGeocode[0].city || reverseGeocode[0].district || reverseGeocode[0].subregion;
        if (city) {
          setHeroCity(city);
          Alert.alert('Location Found', `Current city set to ${city}`);
        }
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Could not fetch your location.');
    } finally {
      setIsLocating(false);
    }
  };

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const toggleWishlist = (id: string) => {
    if (WISHLISTED_IDS.has(id)) WISHLISTED_IDS.delete(id);
    else WISHLISTED_IDS.add(id);
  };

  const renderItem = useCallback(
    ({ item }: { item: Property }) => (
      <View style={styles.cardWrapper}>
        <PropertyCard
          property={item}
          isWishlisted={WISHLISTED_IDS.has(item._id)}
          onWishlistToggle={() => toggleWishlist(item._id)}
          onPress={() =>
            navigation.navigate("PropertyDetail", {
              identifier: item.slug || item._id,
              type: listingType as "rent" | "buy"
            })
          }
        />
      </View>
    ),
    [navigation, listingType, styles]
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={{ flex: 1 }}>
        {viewMode === 'map' ? (
          <View style={{ flex: 1 }}>
            <PropertyMapView 
              properties={allItems}
              type={listingType as 'rent' | 'buy'}
              onPropertyPress={(p) => navigation.navigate("PropertyDetail", {
                identifier: p.slug || p._id,
                type: listingType as "rent" | "buy"
              })}
            />
            <View style={styles.floatingToggles}>
               <Pressable 
                 style={[styles.floatingModeBtn, { backgroundColor: accent }]}
                 onPress={() => setViewMode('grid')}
               >
                 <LayoutGrid size={20} color="#fff" strokeWidth={2.5} />
                 <Text style={styles.floatingModeText}>Show List</Text>
               </Pressable>
            </View>
          </View>
        ) : (
          <FlatList
            data={allItems}
            renderItem={renderItem}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.list}
            onEndReached={handleEndReached}
            onEndReachedThreshold={0.4}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <>
                <View style={styles.heroContainer}>
                  <View style={styles.pageTitleRow}>
                    <Text style={styles.pageTitle}>
                      {listingType === 'buy' ? 'Buy Properties' : 'Rent Properties'}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <View style={styles.statusBadge}>
                        <Text style={styles.statusBadgeText}>Live</Text>
                      </View>
                    </View>
                  </View>
                  <Text style={styles.heroSubtitle}>
                    Search by city, property type, and keywords. Save your favorites and compare quickly.
                  </Text>

                  <BlurView
                    intensity={95}
                    tint={isDark ? "dark" : "light"}
                    style={styles.heroCardBlur}
                  >
                    <View style={styles.heroCard}>
                      <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>LOCATION</Text>
                      <View style={styles.inputWrapper}>
                        <Search size={18} color={colors.textSecondary} />
                        <TextInput 
                          style={styles.heroInput}
                          placeholder="City (e.g., Delhi, Noida)"
                          placeholderTextColor={colors.textSecondary}
                          value={heroCity}
                          onChangeText={setHeroCity}
                        />
                        <Pressable onPress={handleGetLocation} disabled={isLocating}>
                          {isLocating ? (
                            <ActivityIndicator size="small" color={accent} />
                          ) : (
                            <Crosshair size={18} color={accent} />
                          )}
                        </Pressable>
                      </View>
                      </View>

                      <Pressable 
                        style={styles.inputGroup} 
                        onPress={() => setCatPickerVisible(true)}
                      >
                        <Text style={styles.inputLabel}>PROPERTY TYPE</Text>
                        <View style={styles.inputWrapper}>
                          <Text style={[styles.valueText, !heroCategory && { color: colors.textSecondary }]}>
                            {heroCategory ? heroCategory.charAt(0).toUpperCase() + heroCategory.slice(1) : 'All Types'}
                          </Text>
                          <ChevronDown size={18} color={colors.textSecondary} />
                        </View>
                      </Pressable>

                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>KEYWORDS</Text>
                        <View style={styles.inputWrapper}>
                          <TextInput 
                            style={styles.heroInput}
                            placeholder="3 BHK, furnished, parking..."
                            placeholderTextColor={colors.textSecondary}
                            value={heroQ}
                            onChangeText={setHeroQ}
                          />
                        </View>
                      </View>

                      <Pressable 
                        style={[styles.searchBtn, { backgroundColor: accent }]}
                        onPress={handleApplyHeroSearch}
                      >
                        <Search size={20} color="#fff" strokeWidth={2.5} />
                        <Text style={styles.searchBtnText}>Search</Text>
                      </Pressable>
                    </View>
                  </BlurView>
                </View>

                <View style={styles.resultsInfoRow}>
                  <Text style={styles.resultsTitle}>Showing results for {listingType} properties</Text>
                </View>

                <View style={styles.filterRow}>
                  <Pressable 
                    style={styles.filterBtn}
                    onPress={() => setFilterVisible(true)}
                  >
                    <Filter size={18} color={colors.textSecondary} />
                  </Pressable>

                  <View style={styles.countIndicator}>
                    <View style={[styles.dot, { backgroundColor: accent }]} />
                    <Text style={[styles.countLabel, { color: colors.textSecondary }]}>
                      <Text style={[styles.countValue, { color: colors.textPrimary }]}>{totalCount}</Text> found
                    </Text>
                  </View>

                  <Pressable 
                    style={styles.sortDropdown}
                    onPress={() => setSortVisible(true)}
                  >
                    <Text style={styles.sortText}>
                      {sortBy === 'newest' ? 'Newest' : 
                       sortBy === 'oldest' ? 'Oldest' :
                       sortBy === 'price_asc' ? 'Price: Low' :
                       sortBy === 'price_desc' ? 'Price: High' : 'Sort'}
                    </Text>
                    <ChevronDown size={16} color={colors.textSecondary} />
                  </Pressable>

                  <View style={styles.viewToggles}>
                    <Pressable 
                      style={[styles.modeBtn, viewMode === 'grid' && styles.modeBtnActive]}
                      onPress={() => setViewMode('grid')}
                    >
                      <LayoutGrid size={18} color={viewMode === 'grid' ? accent : colors.textSecondary} />
                    </Pressable>
                    <Pressable 
                      style={styles.modeBtn}
                      onPress={() => setViewMode('map')}
                    >
                      <MapIcon size={18} color={colors.textSecondary} />
                    </Pressable>
                  </View>
                </View>
              </>
            }
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={() => refetch()}
                colors={[accent]}
              />
            }
            ListEmptyComponent={
              !isPending ? (
                <View style={styles.center}>
                  <Text style={styles.emptyText}>No properties found matching your criteria.</Text>
                </View>
              ) : null
            }
            ListFooterComponent={
              isPending ? (
                <View style={styles.center}>
                  <ActivityIndicator size="large" color={accent} />
                  <Text style={styles.loadingText}>Loading properties…</Text>
                </View>
              ) : isFetchingNextPage ? (
                <ActivityIndicator
                  size="small"
                  color={accent}
                  style={{ paddingVertical: 20 }}
                />
              ) : null
            }
          />
        )}
      </View>

      <FilterDrawer 
        visible={filterVisible}
        type={listingType}
        onClose={() => setFilterVisible(false)}
        currentFilters={filters}
        onApply={(f) => setFilters(f)}
      />

      <Modal visible={sortVisible} transparent animationType="fade" onRequestClose={() => setSortVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setSortVisible(false)}>
          <View style={styles.sortContent}>
            <Text style={styles.sortTitle}>Sort Properties</Text>
            {[
              { label: 'Newest First', value: 'newest' },
              { label: 'Oldest First', value: 'oldest' },
              { label: 'Price: Low to High', value: 'price_asc' },
              { label: 'Price: High to Low', value: 'price_desc' },
            ].map((opt) => (
              <Pressable 
                key={opt.value} 
                style={[styles.sortOption, sortBy === opt.value && styles.sortOptionActive]}
                onPress={() => { setSortBy(opt.value); setSortVisible(false); }}
              >
                <Text style={[styles.sortOptionText, sortBy === opt.value && { color: listingType === 'buy' ? colors.success : colors.primary, fontWeight: '700' }]}>
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>

      <Modal visible={catPickerVisible} transparent animationType="slide">
        <Pressable style={styles.modalOverlayBottom} onPress={() => setCatPickerVisible(false)}>
          <Pressable style={styles.pickerSheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.pickerTitle}>Select Property Type</Text>
            <View style={styles.pickerGrid}>
              {['room', 'flat', 'house', 'pg', 'hostel', 'commercial'].map((cat) => (
                <Pressable 
                  key={cat} 
                  style={[styles.pickerItem, heroCategory === cat && { backgroundColor: (listingType === 'buy' ? colors.success : colors.primary) + '11', borderColor: listingType === 'buy' ? colors.success : colors.primary }]}
                  onPress={() => { setHeroCategory(cat); setCatPickerVisible(false); }}
                >
                  <Text style={[styles.pickerItemText, heroCategory === cat && { color: listingType === 'buy' ? colors.success : colors.primary, fontWeight: '700' }]}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </Text>
                </Pressable>
              ))}
              <Pressable 
                  style={[styles.pickerItem, !heroCategory && { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}
                  onPress={() => { setHeroCategory(''); setCatPickerVisible(false); }}
                >
                  <Text style={[styles.pickerItemText, { color: colors.textPrimary }]}>Clear / All</Text>
                </Pressable>
            </View>
            <View style={{ height: 40 }} />
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  heroContainer: {
    paddingHorizontal: 12,
    paddingTop: 20, // Reduced from 120 to 20 since SafeAreaView handles safe area
    paddingBottom: 8,
  },
  pageTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    marginTop: 4,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: -0.6,
  },
  statusBadge: {
    backgroundColor: isDark ? "rgba(255,255,255,0.08)" : colors.input,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusBadgeText: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  heroSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500",
    marginTop: -2,
    marginBottom: 8,
  },
  heroCard: {
    backgroundColor: 'transparent',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  heroCardBlur: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
    backgroundColor: isDark ? 'rgba(15,23,42,0.85)' : 'rgba(255,255,255,0.85)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  floatingToggles: {
    position: 'absolute',
    top: 60, // Increased from 20 to account for safe area
    alignSelf: 'center',
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 15,
  },
  floatingModeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
    gap: 8,
  },
  floatingModeText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },
  inputGroup: {
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textSecondary,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.input,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroInput: {
    flex: 1,
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: '500',
    padding: 0,
  },
  valueText: {
    flex: 1,
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  searchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 999,
    gap: 10,
    marginTop: 8,
  },
  searchBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  resultsInfoRow: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 16,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  countIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  countLabel: {
    fontSize: 14,
  },
  countValue: {
    fontWeight: '800',
  },
  sortDropdown: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  sortText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  viewToggles: {
    flexDirection: 'row',
    backgroundColor: colors.input,
    borderRadius: 10,
    padding: 3,
    gap: 2,
  },
  modeBtn: {
    padding: 8,
    borderRadius: 8,
  },
  modeBtnActive: {
    backgroundColor: colors.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  list: {
    paddingTop: 8,
    paddingBottom: 80, // Reduced from 100 to 80 to match map view spacing
  },
  cardWrapper: {
    alignItems: 'center',
    marginBottom: 16,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    marginTop: 40,
  },
  loadingText: {
    marginTop: 12,
    color: colors.textSecondary,
    fontSize: 14,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 15,
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalOverlayBottom: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sortContent: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    width: '100%',
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  sortTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 16,
    textAlign: 'center',
  },
  sortOption: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sortOptionActive: {
    backgroundColor: colors.input,
  },
  sortOptionText: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  pickerSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    width: '100%',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 20,
  },
  pickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  pickerItem: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: '30%',
    alignItems: 'center',
  },
  pickerItemText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});
