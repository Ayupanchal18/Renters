import { useState, useEffect, useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { HeroSection } from "../components/all_listing/hero-section";
import { FilterSidebar } from "../components/all_listing/filter-sidebar";
import { ListingsGrid } from "../components/all_listing/listings-grid";
import { ViewControls } from "../components/all_listing/view-controls";
import Navbar from "./../components/Navbar";
import Footer from "./../components/Footer";
import { getAllProperties, appendProperties } from "../redux/slices/propertySlice";
import { searchResults } from "../redux/slices/searchSlice";
import propertyService from "../api/propertyService";
import wishlistService from "../api/wishlistService";
import { isAuthenticated } from "../utils/auth";
import { 
    updateFilters, 
    setViewMode, 
    setSortBy,
    setSearchQuery,
    clearAllFilters
} from "../redux/slices/filterSlice";
import { 
    convertLegacySearchParams, 
    convertToApiPayload 
} from "../utils/searchParameterStandardization";
import { 
    normalizeFilterState, 
    filterStateToUrlParams, 
    urlParamsToFilterState 
} from "../utils/filterStateSynchronization";
import { SlidersHorizontal, X, Sparkles } from "lucide-react";

export default function ListingsPage() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();

    // Redux state
    const filters = useSelector(state => state.filters);
    const { allProperties, isLoading: propertyLoading, pagination } = useSelector(state => state.postproperty);
    const { searchResultData, isLoading: searchLoading } = useSelector(state => state.searchResults);

    // Local state
    const [currentDataSource, setCurrentDataSource] = useState('all');
    const [hasInitialized, setHasInitialized] = useState(false);
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [wishlistIds, setWishlistIds] = useState(new Set());
    const initialLoadDone = useRef(false);

    const initialSearchData = location.state?.searchData || null;

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

    // Get current properties
    const getCurrentProperties = useCallback(() => {
        switch (currentDataSource) {
            case 'filtered':
                return filters.filteredProperties || [];
            case 'search':
                return searchResultData || [];
            case 'all':
            default:
                return allProperties || [];
        }
    }, [currentDataSource, filters.filteredProperties, searchResultData, allProperties]);

    const isLoading = propertyLoading || searchLoading || filters.isLoading;

    // Fetch all properties
    const fetchAll = useCallback(() => {
        dispatch(getAllProperties({ page: 1, limit: 12 }));
        setCurrentDataSource('all');
    }, [dispatch]);

    // Load more properties
    const handleLoadMore = useCallback(async () => {
        if (currentDataSource === 'all' && pagination.hasMore && !loadingMore) {
            setLoadingMore(true);
            try {
                const response = await propertyService.getAllProperties({
                    page: pagination.page + 1,
                    limit: pagination.pageSize
                });
                const data = response.data;
                dispatch(appendProperties(data));
            } catch (error) {
                console.error('Load more error:', error);
            } finally {
                setLoadingMore(false);
            }
        }
    }, [dispatch, currentDataSource, pagination, loadingMore]);

    // Handle search
    const handleHeroSearch = useCallback((payload) => {
        if (!payload) return;
        
        const query = payload.query || payload.searchQuery || "";
        const loc = payload.location || "";
        
        dispatch(setSearchQuery(query));
        
        if (query || loc) {
            dispatch(searchResults(payload));
            setCurrentDataSource('search');
        } else {
            fetchAll();
        }
    }, [dispatch, fetchAll]);

    // Get active filter count
    const activeFilterCount = (() => {
        let count = 0;
        if (filters.propertyType) count++;
        if (filters.priceRange?.min > 0 || filters.priceRange?.max < 100000) count++;
        if (filters.bedrooms?.length > 0) count++;
        if (filters.amenities?.length > 0) count++;
        if (filters.verifiedOnly) count++;
        return count;
    })();

    // Handle filter changes
    const handleFilterChange = useCallback((filterType, value) => {
        if (filterType === 'clearAll') {
            dispatch(clearAllFilters());
            fetchAll();
            return;
        }

        const updatedFilters = { ...filters, [filterType]: value };
        const normalizedState = normalizeFilterState(updatedFilters);
        dispatch(updateFilters(normalizedState));
        
        const hasActiveFilters = 
            normalizedState.propertyType ||
            (normalizedState.priceRange?.min > 0 || normalizedState.priceRange?.max < 100000) ||
            normalizedState.bedrooms?.length > 0 ||
            normalizedState.amenities?.length > 0 ||
            normalizedState.furnishing?.length > 0 ||
            normalizedState.verifiedOnly;
        
        if (hasActiveFilters) {
            const searchPayload = {
                query: filters.searchQuery || '',
                location: normalizedState.location || '',
                sort: filters.sortBy || 'newest',
                filters: {
                    propertyType: normalizedState.propertyType || '',
                    category: normalizedState.propertyType || '',
                    priceRange: normalizedState.priceRange,
                    bedrooms: normalizedState.bedrooms || [],
                    amenities: normalizedState.amenities || [],
                    furnishing: normalizedState.furnishing || []
                }
            };
            
            dispatch(searchResults(searchPayload));
            setCurrentDataSource('search');
        } else {
            fetchAll();
        }
    }, [dispatch, filters, fetchAll]);

    // Handle view mode change
    const handleViewModeChange = useCallback((newViewMode) => {
        dispatch(setViewMode(newViewMode));
    }, [dispatch]);

    // Handle sort change
    const handleSortChange = useCallback((newSortBy) => {
        dispatch(setSortBy(newSortBy));
        
        const searchPayload = {
            query: filters.searchQuery || '',
            location: filters.location || '',
            sort: newSortBy,
            filters: {
                propertyType: filters.propertyType || '',
                category: filters.propertyType || '',
                priceRange: filters.priceRange,
                bedrooms: filters.bedrooms || [],
                amenities: filters.amenities || [],
                furnishing: filters.furnishing || []
            }
        };
        
        dispatch(searchResults(searchPayload));
        setCurrentDataSource('search');
    }, [dispatch, filters]);

    // Initialize
    useEffect(() => {
        if (!hasInitialized) {
            const urlParams = new URLSearchParams(window.location.search);
            const urlFilterState = urlParamsToFilterState(urlParams.toString());
            
            if (Object.keys(urlFilterState).length > 0) {
                dispatch(updateFilters(urlFilterState));
            }
            
            setHasInitialized(true);
            fetchWishlistIds();
        }
    }, [dispatch, hasInitialized, fetchWishlistIds]);

    // Initial load
    useEffect(() => {
        if (hasInitialized && !initialLoadDone.current) {
            initialLoadDone.current = true;
            
            if (initialSearchData) {
                const standardParams = convertLegacySearchParams(initialSearchData);
                const apiPayload = convertToApiPayload(standardParams);
                dispatch(searchResults(apiPayload));
                setCurrentDataSource('search');
            } else {
                fetchAll();
            }
        }
    }, [hasInitialized, initialSearchData, dispatch, fetchAll]);

    // Sync URL
    useEffect(() => {
        if (hasInitialized) {
            const urlParams = filterStateToUrlParams(filters);
            const newUrl = urlParams ? `${window.location.pathname}?${urlParams}` : window.location.pathname;
            navigate(newUrl, { replace: true });
        }
    }, [filters, hasInitialized, navigate]);

    return (
        <>
            <Navbar />
            <main className="min-h-screen bg-background">
                <HeroSection onSearch={handleHeroSearch} />

                {/* Main Content Area */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    
                    {/* Mobile Filter Toggle Bar */}
                    <div className="lg:hidden mb-6">
                        <div className="flex items-center justify-between gap-3 p-4 bg-card border border-border rounded-2xl">
                            <button
                                onClick={() => setMobileFiltersOpen(true)}
                                className="flex items-center gap-3 flex-1"
                            >
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <SlidersHorizontal className="w-5 h-5 text-primary" />
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-semibold text-foreground">Filters</p>
                                    <p className="text-xs text-muted-foreground">
                                        {activeFilterCount > 0 ? `${activeFilterCount} active` : 'Refine results'}
                                    </p>
                                </div>
                            </button>
                            
                            {activeFilterCount > 0 && (
                                <>
                                    <div className="w-px h-8 bg-border" />
                                    <button
                                        onClick={() => handleFilterChange('clearAll')}
                                        className="px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-xl transition-colors"
                                    >
                                        Clear all
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Mobile Filter Drawer */}
                    {mobileFiltersOpen && (
                        <>
                            {/* Backdrop */}
                            <div 
                                className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
                                onClick={() => setMobileFiltersOpen(false)}
                            />
                            
                            {/* Drawer */}
                            <div className="lg:hidden fixed inset-y-0 left-0 z-50 w-full max-w-sm bg-background shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-left duration-300">
                                {/* Drawer Header */}
                                <div className="flex items-center justify-between p-4 border-b border-border bg-card">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                                            <SlidersHorizontal className="w-4 h-4 text-primary" />
                                        </div>
                                        <div>
                                            <h2 className="font-semibold text-foreground">Filters</h2>
                                            {activeFilterCount > 0 && (
                                                <p className="text-xs text-muted-foreground">{activeFilterCount} active</p>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setMobileFiltersOpen(false)}
                                        className="w-9 h-9 rounded-xl hover:bg-muted flex items-center justify-center transition-colors"
                                    >
                                        <X className="w-5 h-5 text-muted-foreground" />
                                    </button>
                                </div>
                                
                                {/* Drawer Content */}
                                <div className="flex-1 overflow-y-auto">
                                    <FilterSidebar 
                                        filters={{
                                            propertyType: filters.propertyType,
                                            priceRange: filters.priceRange,
                                            bedrooms: filters.bedrooms,
                                            amenities: filters.amenities,
                                            furnishing: filters.furnishing,
                                            verifiedOnly: filters.verifiedOnly,
                                            location: filters.location,
                                            availableFrom: filters.availableFrom
                                        }} 
                                        onFilterChange={handleFilterChange} 
                                    />
                                </div>
                                
                                {/* Drawer Footer */}
                                <div className="p-4 border-t border-border bg-card">
                                    <button
                                        onClick={() => setMobileFiltersOpen(false)}
                                        className="w-full py-3.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Sparkles className="w-4 h-4" />
                                        Show {getCurrentProperties().length} Results
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
                                <FilterSidebar 
                                    filters={{
                                        propertyType: filters.propertyType,
                                        priceRange: filters.priceRange,
                                        bedrooms: filters.bedrooms,
                                        amenities: filters.amenities,
                                        furnishing: filters.furnishing,
                                        verifiedOnly: filters.verifiedOnly,
                                        location: filters.location,
                                        availableFrom: filters.availableFrom
                                    }} 
                                    onFilterChange={handleFilterChange} 
                                />
                            </div>
                        </div>

                        {/* Main Content */}
                        <div className="flex-1 min-w-0">
                            <ViewControls
                                viewMode={filters.viewMode}
                                onViewChange={handleViewModeChange}
                                sortBy={filters.sortBy}
                                onSortChange={handleSortChange}
                                properties={getCurrentProperties()}
                            />

                            <ListingsGrid
                                viewMode={filters.viewMode}
                                properties={getCurrentProperties()}
                                loading={isLoading}
                                onClearFilters={() => dispatch(clearAllFilters())}
                                onLoadMore={currentDataSource === 'all' ? handleLoadMore : null}
                                hasMore={currentDataSource === 'all' && pagination.hasMore}
                                isLoadingMore={loadingMore}
                                total={currentDataSource === 'all' ? pagination.total : 0}
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
                            />
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </>
    );
}
