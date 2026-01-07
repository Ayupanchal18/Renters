import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { HeroSection } from "../components/all_listing/hero-section";
import { RentFilterSidebar } from "../components/all_listing/rent-filter-sidebar";
import { ListingsGrid } from "../components/all_listing/listings-grid";
import { ViewControls } from "../components/all_listing/view-controls";
import { BackToTop } from "../components/ui/back-to-top";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SEOHead from "../components/seo/SEOHead";
import propertyService from "../api/propertyService";
import wishlistService from "../api/wishlistService";
import { isAuthenticated } from "../utils/auth";
import { SlidersHorizontal, X, Sparkles, Home, Key } from "lucide-react";

/**
 * RentListings Page Component
 * Displays rental properties with rent-specific filters
 */
export default function RentListings() {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();

    // Filter state for rent properties
    const [filters, setFilters] = useState({
        propertyType: "",
        priceRange: { min: 0, max: 100000 },
        bedrooms: [],
        amenities: [],
        furnishing: [],
        preferredTenants: "",
        verifiedOnly: false,
        location: "",
    });

    // View and sort state - persist view mode to localStorage
    const [viewMode, setViewMode] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('propertyViewMode') || 'grid';
        }
        return 'grid';
    });
    const [sortBy, setSortBy] = useState("newest");

    // Data state
    const [properties, setProperties] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [pagination, setPagination] = useState({
        page: 1,
        pageSize: 12,
        total: 0,
        hasMore: false
    });
    const [loadingMore, setLoadingMore] = useState(false);
    const [wishlistIds, setWishlistIds] = useState(new Set());
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
    
    // Check for search params in URL on initial load
    const urlQuery = searchParams.get('q') || '';
    const urlLocation = searchParams.get('loc') || '';
    const hasUrlSearch = !!(urlQuery || urlLocation);
    
    const [isSearchMode, setIsSearchMode] = useState(!!location.state?.searchData || hasUrlSearch);
    
    const initialLoadDone = useRef(false);
    const initialSearchTriggered = useRef(false);
    
    // Capture initial search data on first render using a ref to prevent it from being lost
    const initialSearchDataRef = useRef(
        location.state?.searchData || (hasUrlSearch ? { q: urlQuery, location: urlLocation } : null)
    );
    const initialSearchData = initialSearchDataRef.current;

    // Fetch wishlist IDs
    const fetchWishlistIds = useCallback(async () => {
        if (!isAuthenticated()) return;
        try {
            const wishlist = await wishlistService.getWishlist();
            const ids = new Set(wishlist.map(item => item.property?._id || item.property));
            setWishlistIds(ids);
        } catch (error) {
            console.error('Failed to fetch wishlist:', error);
        }
    }, []);

    // Fetch rent properties from API
    const fetchRentProperties = useCallback(async (page = 1, append = false) => {
        try {
            if (!append) {
                setIsLoading(true);
            }

            const params = {
                page,
                limit: pagination.pageSize,
                sort: sortBy,
            };

            // Add filter params
            if (filters.propertyType) params.category = filters.propertyType;
            if (filters.priceRange.min > 0) params.minRent = filters.priceRange.min;
            if (filters.priceRange.max < 100000) params.maxRent = filters.priceRange.max;
            if (filters.bedrooms.length > 0) params.bedrooms = filters.bedrooms.join(',');
            if (filters.furnishing.length > 0) params.furnishing = filters.furnishing.join(',');
            if (filters.preferredTenants) params.preferredTenants = filters.preferredTenants;
            if (filters.verifiedOnly) params.verified = true;
            if (filters.location) params.city = filters.location;

            const response = await propertyService.getRentProperties(params);
            const data = response.data?.data || response.data;

            if (append) {
                setProperties(prev => [...prev, ...(data.items || data.properties || [])]);
            } else {
                setProperties(data.items || data.properties || []);
            }

            setPagination({
                page: data.page || page,
                pageSize: data.pageSize || pagination.pageSize,
                total: data.total || 0,
                hasMore: data.hasMore || (data.page < Math.ceil(data.total / data.pageSize))
            });
        } catch (error) {
            console.error('Error fetching rent properties:', error);
            setProperties([]);
        } finally {
            setIsLoading(false);
            setLoadingMore(false);
        }
    }, [filters, sortBy, pagination.pageSize]);

    // Search rent properties
    const searchRentProperties = useCallback(async (searchPayload, overrideSort = null, page = 1, append = false) => {
        try {
            if (!append) {
                setIsLoading(true);
            }
            setIsSearchMode(true);

            // Extract search parameters - handle both old and new payload formats
            const searchLocation = searchPayload.location || searchPayload.city || "";
            const searchQuery = searchPayload.q || searchPayload.query || "";
            const searchCategory = searchPayload.category || searchPayload.propertyType || searchPayload.type || "";
            const effectiveSort = overrideSort || sortBy;

            // If no search criteria, fall back to regular fetch
            if (!searchLocation && !searchQuery && !searchCategory) {
                setIsSearchMode(false);
                await fetchRentProperties(1);
                return;
            }

            const payload = {
                q: searchQuery,
                location: searchLocation,
                city: searchLocation,
                category: searchCategory,
                propertyType: searchCategory,
                sort: effectiveSort,
                page: page,
                limit: pagination.pageSize,
                filters: {
                    priceRange: {
                        min: filters.priceRange.min > 0 ? filters.priceRange.min : undefined,
                        max: filters.priceRange.max < 100000 ? filters.priceRange.max : undefined,
                    },
                    bedrooms: filters.bedrooms,
                    furnishing: filters.furnishing,
                    preferredTenants: filters.preferredTenants,
                    amenities: filters.amenities,
                }
            };

            // Update location filter state
            if (searchLocation && !append) {
                setFilters(prev => ({ ...prev, location: searchLocation }));
            }

            const response = await propertyService.searchRentProperties(payload);
            
            // Handle nested response structure
            const responseData = response.data?.data || response.data;
            const items = responseData.searchResultData || responseData.items || responseData.properties || responseData.results || [];

            if (append) {
                setProperties(prev => [...prev, ...items]);
            } else {
                setProperties(items);
            }
            
            // Calculate hasMore based on response pagination
            const paginationData = response.data?.pagination || {};
            const responseTotal = paginationData.total || responseData.total || items.length;
            const currentPage = paginationData.page || responseData.page || page;
            const pageSize = paginationData.pageSize || responseData.pageSize || pagination.pageSize;
            const totalPages = paginationData.totalPages || Math.ceil(responseTotal / pageSize);
            const calculatedHasMore = currentPage < totalPages;
            
            setPagination(prev => ({
                ...prev,
                page: currentPage,
                total: responseTotal,
                hasMore: calculatedHasMore
            }));
        } catch (error) {
            console.error('Error searching rent properties:', error);
            if (!append) {
                setProperties([]);
            }
        } finally {
            setIsLoading(false);
            setLoadingMore(false);
        }
    }, [filters, sortBy, fetchRentProperties, pagination.pageSize]);

    // Handle search from hero section
    const handleHeroSearch = useCallback((payload) => {
        if (!payload) return;
        
        const query = payload.q || payload.query || payload.searchQuery || "";
        const loc = payload.location || payload.city || "";
        const category = payload.category || payload.propertyType || "";
        
        if (query || loc || category) {
            // Update URL with search params for persistence
            const newParams = new URLSearchParams(searchParams);
            if (query) newParams.set('q', query);
            else newParams.delete('q');
            if (loc) newParams.set('loc', loc);
            else newParams.delete('loc');
            setSearchParams(newParams, { replace: true });
            
            setFilters(prev => ({ ...prev, location: loc }));
            searchRentProperties({ query, location: loc, category });
        } else {
            // Clear URL params when search is cleared
            const newParams = new URLSearchParams(searchParams);
            newParams.delete('q');
            newParams.delete('loc');
            setSearchParams(newParams, { replace: true });
            
            setIsSearchMode(false);
            fetchRentProperties(1);
        }
    }, [searchRentProperties, fetchRentProperties, searchParams, setSearchParams]);

    // Handle load more
    const handleLoadMore = useCallback(async () => {
        if (pagination.hasMore && !loadingMore) {
            setLoadingMore(true);
            if (isSearchMode) {
                // Load more in search mode
                await searchRentProperties(
                    { location: filters.location || "", query: urlQuery || "" },
                    null,
                    pagination.page + 1,
                    true
                );
            } else {
                await fetchRentProperties(pagination.page + 1, true);
            }
        }
    }, [pagination, loadingMore, fetchRentProperties, searchRentProperties, isSearchMode, filters.location, urlQuery]);

    // Get active filter count
    const activeFilterCount = (() => {
        let count = 0;
        if (filters.propertyType) count++;
        if (filters.priceRange?.min > 0 || filters.priceRange?.max < 100000) count++;
        if (filters.bedrooms?.length > 0) count++;
        if (filters.furnishing?.length > 0) count++;
        if (filters.amenities?.length > 0) count++;
        if (filters.preferredTenants) count++;
        if (filters.verifiedOnly) count++;
        return count;
    })();

    // Handle filter changes
    const handleFilterChange = useCallback((filterType, value) => {
        if (filterType === 'clearAll') {
            setFilters({
                propertyType: "",
                priceRange: { min: 0, max: 100000 },
                bedrooms: [],
                amenities: [],
                furnishing: [],
                preferredTenants: "",
                verifiedOnly: false,
                location: "",
            });
            // Exit search mode when clearing all filters
            setIsSearchMode(false);
            return;
        }

        setFilters(prev => ({ ...prev, [filterType]: value }));
    }, []);

    // Handle view mode change - persist to localStorage
    const handleViewModeChange = useCallback((newViewMode) => {
        setViewMode(newViewMode);
        if (typeof window !== 'undefined') {
            localStorage.setItem('propertyViewMode', newViewMode);
        }
    }, []);

    // Handle sort change - trigger re-fetch with new sort
    const handleSortChange = useCallback((newSortBy) => {
        setSortBy(newSortBy);
        // If in search mode or has location filter, re-search with new sort
        if (isSearchMode || filters.location) {
            searchRentProperties({ location: filters.location || "", query: "" }, newSortBy);
        }
    }, [isSearchMode, filters.location, searchRentProperties]);

    // Track if initial data load is complete
    const isInitialLoadComplete = useRef(false);
    
    // Store the current search payload for re-fetching when filters change
    const currentSearchPayload = useRef(initialSearchData);

    // Initial load - runs once on mount
    useEffect(() => {
        const doInitialLoad = async () => {
            if (initialLoadDone.current) return;
            initialLoadDone.current = true;
            
            fetchWishlistIds();
            
            if (initialSearchData && !initialSearchTriggered.current) {
                initialSearchTriggered.current = true;
                setIsSearchMode(true);
                
                // Pre-fill location filter from search data
                const searchLocation = initialSearchData.location || initialSearchData.city || "";
                if (searchLocation) {
                    setFilters(prev => ({ ...prev, location: searchLocation }));
                }
                
                await searchRentProperties(initialSearchData);
            } else if (!initialSearchData) {
                await fetchRentProperties(1);
            }
            
            // Mark initial load as complete after a small delay to ensure state is settled
            setTimeout(() => {
                isInitialLoadComplete.current = true;
            }, 100);
        };
        
        doInitialLoad();
    }, [fetchWishlistIds, fetchRentProperties, searchRentProperties, initialSearchData]);

    // Refetch when filters or sort changes (only after initial load is complete)
    const filterChangeCount = useRef(0);
    useEffect(() => {
        // Increment change count
        filterChangeCount.current += 1;
        
        // Skip the first 2 runs - initial render and state settling
        if (filterChangeCount.current <= 2) {
            return;
        }
        
        // Skip if initial load not complete
        if (!isInitialLoadComplete.current) return;
        
        // Build search payload from current state
        const searchPayload = {
            location: filters.location || "",
            query: urlQuery || currentSearchPayload.current?.q || "",
            category: filters.propertyType || ""
        };
        
        // Update stored payload
        currentSearchPayload.current = searchPayload;
        
        // If in search mode or has location filter, re-search with current filters
        if (isSearchMode || filters.location) {
            searchRentProperties(searchPayload);
        } else {
            fetchRentProperties(1);
        }
    }, [filters.propertyType, filters.priceRange, filters.bedrooms, filters.furnishing, filters.preferredTenants, filters.amenities, filters.verifiedOnly, sortBy]);

    return (
        <div className="min-h-screen flex flex-col">
            <SEOHead
                title="Properties for Rent | Find Your Perfect Rental Home"
                description="Browse verified rental properties including flats, houses, rooms, and PG accommodations. Find your ideal rental home with flexible filters for budget, BHK, and tenant preferences."
                url={typeof window !== 'undefined' ? `${window.location.origin}/rent-properties` : 'https://renters.com/rent-properties'}
                type="website"
            />
            <Navbar />
            <main className="flex-1 bg-background">
                <HeroSection onSearch={handleHeroSearch} />

                {/* Rent Properties Header - Simplified on mobile */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
                    <div className="flex items-center gap-3 mb-4 sm:mb-6">
                        <div className="hidden sm:flex w-12 h-12 rounded-2xl bg-primary/10 items-center justify-center">
                            <Key className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-lg sm:text-2xl font-bold text-foreground">
                                <span className="sm:hidden">Showing results for rent properties</span>
                                <span className="hidden sm:inline">Properties for Rent</span>
                            </h1>
                            <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                                Find your perfect rental home from {pagination.total} verified listings
                            </p>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">

                    {/* Mobile Filter Drawer */}
                    {mobileFiltersOpen && (
                        <>
                            {/* Backdrop */}
                            <div 
                                className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] transition-opacity"
                                onClick={() => setMobileFiltersOpen(false)}
                            />
                            
                            {/* Drawer */}
                            <div className="lg:hidden fixed top-0 bottom-0 left-0 z-[70] w-full max-w-sm bg-background shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-left duration-300">
                                {/* Drawer Header */}
                                <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card safe-area-top">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                            <SlidersHorizontal className="w-4 h-4 text-primary" />
                                        </div>
                                        <div>
                                            <h2 className="font-semibold text-foreground text-sm">Rent Filters</h2>
                                            {activeFilterCount > 0 && (
                                                <p className="text-[11px] text-muted-foreground">{activeFilterCount} active</p>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setMobileFiltersOpen(false)}
                                        className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center transition-colors"
                                    >
                                        <X className="w-5 h-5 text-muted-foreground" />
                                    </button>
                                </div>
                                
                                {/* Drawer Content */}
                                <div className="flex-1 overflow-y-auto overscroll-contain">
                                    <RentFilterSidebar 
                                        filters={filters} 
                                        onFilterChange={handleFilterChange}
                                        hideHeader={true}
                                        compact={true}
                                    />
                                </div>
                                
                                {/* Drawer Footer */}
                                <div className="px-4 py-3 border-t border-border bg-card safe-area-bottom">
                                    <button
                                        onClick={() => setMobileFiltersOpen(false)}
                                        className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Sparkles className="w-4 h-4" />
                                        Show {properties.length} Results
                                    </button>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Desktop Layout */}
                    <div className="flex gap-8">
                        {/* Desktop Sidebar */}
                        <div className="hidden lg:block w-80 flex-shrink-0">
                            <div className="sticky top-24">
                                <RentFilterSidebar 
                                    filters={filters} 
                                    onFilterChange={handleFilterChange} 
                                />
                            </div>
                        </div>

                        {/* Main Content */}
                        <div className="flex-1 min-w-0">
                            <ViewControls
                                viewMode={viewMode}
                                onViewChange={handleViewModeChange}
                                sortBy={sortBy}
                                onSortChange={handleSortChange}
                                properties={properties}
                                total={pagination.total}
                                listingType="rent"
                                activeFilterCount={activeFilterCount}
                                onFilterClick={() => setMobileFiltersOpen(true)}
                                onClearFilters={() => handleFilterChange('clearAll')}
                            />

                            <ListingsGrid
                                viewMode={viewMode}
                                properties={properties}
                                loading={isLoading}
                                onClearFilters={() => handleFilterChange('clearAll')}
                                onLoadMore={handleLoadMore}
                                hasMore={pagination.hasMore}
                                isLoadingMore={loadingMore}
                                total={pagination.total}
                                wishlistIds={wishlistIds}
                                onWishlistChange={(propertyId, isFavorited) => {
                                    setWishlistIds(prev => {
                                        const newSet = new Set(prev);
                                        if (isFavorited) {
                                            newSet.add(propertyId);
                                        } else {
                                            newSet.delete(propertyId);
                                        }
                                        return newSet;
                                    });
                                }}
                                emptyStateMessage="No rental properties found matching your criteria. Try adjusting your filters or search for a different location."
                            />
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
            <BackToTop />
        </div>
    );
}
