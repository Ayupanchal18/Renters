import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import filterService from "../../api/filterService";
import { filterPropertiesByType } from "../../utils/propertyTypeStandardization";

// Async thunk for applying filters
export const applyFilters = createAsyncThunk(
    "filters/applyFilters",
    async (payload, { rejectWithValue }) => {
        try {
            const response = await filterService.applyFilters(payload);
            return response.data;
        } catch (error) {
            console.log("Apply filters catch === ", error);
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

// Async thunk for getting filter options
export const getFilterOptions = createAsyncThunk(
    "filters/getFilterOptions",
    async (_, { rejectWithValue }) => {
        try {
            const response = await filterService.getFilterOptions();
            return response.data;
        } catch (error) {
            console.log("Get filter options catch === ", error);
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

const initialState = {
    // Filter criteria
    propertyType: "",
    priceRange: { min: 0, max: 100000 },
    bedrooms: [],
    amenities: [],
    furnishing: [],
    verifiedOnly: false,
    location: "",
    availableFrom: null,
    searchQuery: "",

    // UI state
    sortBy: "relevance",
    viewMode: "grid",
    scrollPosition: 0,

    // Filter options from server
    availablePropertyTypes: [],
    availableAmenities: [],
    availableFurnishingTypes: [],
    priceRangeLimits: { min: 0, max: 100000 },

    // Applied filters and results
    appliedFilters: {},
    filteredProperties: [],
    totalCount: 0,

    // Loading and error states
    isLoading: false,
    isError: false,
    errorMessage: "",
    isSuccess: false,
    successMessage: ""
};

const filterSlice = createSlice({
    name: "filters",
    initialState,
    reducers: {
        // Filter setters
        setPropertyType: (state, action) => {
            state.propertyType = action.payload;
        },
        setPriceRange: (state, action) => {
            state.priceRange = action.payload;
        },
        setBedrooms: (state, action) => {
            state.bedrooms = action.payload;
        },
        setAmenities: (state, action) => {
            state.amenities = action.payload;
        },
        setFurnishing: (state, action) => {
            state.furnishing = action.payload;
        },
        setVerifiedOnly: (state, action) => {
            state.verifiedOnly = action.payload;
        },
        setLocation: (state, action) => {
            state.location = action.payload;
        },
        setAvailableFrom: (state, action) => {
            state.availableFrom = action.payload;
        },
        setSearchQuery: (state, action) => {
            state.searchQuery = action.payload;
        },
        setSortBy: (state, action) => {
            state.sortBy = action.payload;
        },
        setViewMode: (state, action) => {
            state.viewMode = action.payload;
        },

        // Filter operations
        clearAllFilters: (state) => {
            state.propertyType = "";
            state.priceRange = { min: 0, max: state.priceRangeLimits.max || 100000 };
            state.bedrooms = [];
            state.amenities = [];
            state.furnishing = [];
            state.verifiedOnly = false;
            state.location = "";
            state.availableFrom = null;
            state.searchQuery = "";
            state.appliedFilters = {};
            state.filteredProperties = [];
            state.totalCount = 0;
        },

        clearSpecificFilter: (state, action) => {
            const filterType = action.payload;
            switch (filterType) {
                case 'propertyType':
                    state.propertyType = "";
                    break;
                case 'priceRange':
                    state.priceRange = { min: 0, max: state.priceRangeLimits.max || 100000 };
                    break;
                case 'bedrooms':
                    state.bedrooms = [];
                    break;
                case 'amenities':
                    state.amenities = [];
                    break;
                case 'furnishing':
                    state.furnishing = [];
                    break;
                case 'verifiedOnly':
                    state.verifiedOnly = false;
                    break;
                case 'location':
                    state.location = "";
                    break;
                case 'availableFrom':
                    state.availableFrom = null;
                    break;
                case 'searchQuery':
                    state.searchQuery = "";
                    break;
                default:
                    break;
            }
            // Clear applied filters when individual filter is cleared
            delete state.appliedFilters[filterType];
        },

        // Filter combination logic (AND operations)
        combineFilters: (state, action) => {
            const { properties, filters, searchQuery, sortBy: passedSortBy } = action.payload;

            // Use passed sortBy or fall back to state
            if (passedSortBy) {
                state.sortBy = passedSortBy;
            }

            if (!properties || !Array.isArray(properties)) {
                state.filteredProperties = [];
                state.totalCount = 0;
                return;
            }

            let filteredResults = [...properties];

            // Apply search query filter (checks title and category for partial matches, case-insensitive)
            if (searchQuery && searchQuery.trim()) {
                const query = searchQuery.toLowerCase().trim();
                filteredResults = filteredResults.filter(property => {
                    const title = property.title?.toLowerCase() || '';
                    const category = property.category?.toLowerCase() || '';
                    const propertyType = property.propertyType?.toLowerCase() || '';
                    const description = property.description?.toLowerCase() || '';

                    return title.includes(query) ||
                        category.includes(query) ||
                        propertyType.includes(query) ||
                        description.includes(query);
                });
            }

            // Apply location filter (filters properties by their city field)
            if (filters.location && filters.location.trim()) {
                const locationQuery = filters.location.toLowerCase().trim();
                filteredResults = filteredResults.filter(property => {
                    const city = property.city?.toLowerCase() || '';
                    const address = property.address?.toLowerCase() || '';
                    const location = property.location?.toLowerCase() || '';

                    // Primary match on city field as requested
                    return city.includes(locationQuery) ||
                        address.includes(locationQuery) ||
                        location.includes(locationQuery);
                });
            }

            // Apply property type filter using standardized matching
            if (filters.propertyType && filters.propertyType.trim()) {
                filteredResults = filterPropertiesByType(filteredResults, filters.propertyType, 'filter');
            }

            // Apply price range filter
            if (filters.priceRange && (filters.priceRange.min > 0 || filters.priceRange.max < 100000)) {
                filteredResults = filteredResults.filter(property => {
                    const price = property.monthlyRent || property.price || 0;
                    const min = filters.priceRange.min || 0;
                    const max = filters.priceRange.max || 100000;
                    return price >= min && price <= max;
                });
            }

            // Apply bedrooms filter
            if (filters.bedrooms && filters.bedrooms.length > 0) {
                filteredResults = filteredResults.filter(property => {
                    const propertyBedrooms = property.bedrooms?.toString() || "1";
                    return filters.bedrooms.some(bed => {
                        if (bed === "5+") {
                            return parseInt(propertyBedrooms) >= 5;
                        }
                        return propertyBedrooms === bed;
                    });
                });
            }

            // Apply amenities filter (AND operation - property must have ALL selected amenities)
            if (filters.amenities && filters.amenities.length > 0) {
                filteredResults = filteredResults.filter(property => {
                    const propertyAmenities = property.amenities || [];
                    return filters.amenities.every(amenity =>
                        propertyAmenities.some(propAmenity =>
                            propAmenity.toLowerCase().includes(amenity.toLowerCase())
                        )
                    );
                });
            }

            // Apply furnishing filter
            if (filters.furnishing && filters.furnishing.length > 0) {
                filteredResults = filteredResults.filter(property => {
                    const propertyFurnishing = property.furnishing?.toLowerCase() || "";
                    return filters.furnishing.some(furn =>
                        propertyFurnishing.includes(furn.toLowerCase())
                    );
                });
            }

            // Apply verified only filter
            if (filters.verifiedOnly) {
                filteredResults = filteredResults.filter(property =>
                    property.verified === true || property.isVerified === true
                );
            }

            // Apply available from filter
            if (filters.availableFrom) {
                const filterDate = new Date(filters.availableFrom);
                filteredResults = filteredResults.filter(property => {
                    if (!property.availableFrom) return true; // If no date specified, include it
                    const propertyDate = new Date(property.availableFrom);
                    return propertyDate <= filterDate;
                });
            }

            // Apply sorting
            const sortBy = state.sortBy || 'newest';
            filteredResults.sort((a, b) => {
                switch (sortBy) {
                    case 'rent_low_to_high':
                        return (a.monthlyRent || 0) - (b.monthlyRent || 0);
                    case 'rent_high_to_low':
                        return (b.monthlyRent || 0) - (a.monthlyRent || 0);
                    case 'oldest':
                        return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
                    case 'featured':
                        if (a.featured === b.featured) {
                            return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
                        }
                        return b.featured ? 1 : -1;
                    case 'newest':
                    default:
                        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
                }
            });

            state.filteredProperties = filteredResults;
            state.totalCount = filteredResults.length;
            state.appliedFilters = { ...filters };
        },

        // Persist view state
        persistViewState: (state, action) => {
            const { viewMode, sortBy, scrollPosition } = action.payload;
            if (viewMode !== undefined) state.viewMode = viewMode;
            if (sortBy !== undefined) state.sortBy = sortBy;
            if (scrollPosition !== undefined) state.scrollPosition = scrollPosition;
        },

        // Restore view state
        restoreViewState: (state, action) => {
            const savedState = action.payload;
            if (savedState) {
                state.viewMode = savedState.viewMode || state.viewMode;
                state.sortBy = savedState.sortBy || state.sortBy;
                state.scrollPosition = savedState.scrollPosition || 0;
            }
        },

        // Bulk filter update
        updateFilters: (state, action) => {
            const filters = action.payload;
            Object.keys(filters).forEach(key => {
                if (state.hasOwnProperty(key)) {
                    state[key] = filters[key];
                }
            });
        },

        // Reset error state
        clearError: (state) => {
            state.isError = false;
            state.errorMessage = "";
        }
    },
    extraReducers: (builder) => {
        builder
            // Apply filters
            .addCase(applyFilters.pending, (state) => {
                state.isLoading = true;
                state.isSuccess = false;
                state.isError = false;
                state.errorMessage = "";
            })
            .addCase(applyFilters.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.isError = false;
                state.filteredProperties = action.payload.properties || [];
                state.totalCount = action.payload.totalCount || 0;
                state.appliedFilters = action.payload.appliedFilters || {};
                state.successMessage = action.payload.message || "Filters applied successfully";
                state.errorMessage = "";
            })
            .addCase(applyFilters.rejected, (state, action) => {
                state.isLoading = false;
                state.isSuccess = false;
                state.isError = true;
                state.errorMessage = action.payload || "Failed to apply filters";
                state.successMessage = "";
            })

            // Get filter options
            .addCase(getFilterOptions.pending, (state) => {
                state.isLoading = true;
                state.isError = false;
                state.errorMessage = "";
            })
            .addCase(getFilterOptions.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isError = false;
                state.availablePropertyTypes = action.payload.propertyTypes || [];
                state.availableAmenities = action.payload.amenities || [];
                state.availableFurnishingTypes = action.payload.furnishingTypes || [];
                state.priceRangeLimits = action.payload.priceRange || { min: 0, max: 100000 };
                state.errorMessage = "";
            })
            .addCase(getFilterOptions.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.errorMessage = action.payload || "Failed to load filter options";
            });
    },
});

export const {
    setPropertyType,
    setPriceRange,
    setBedrooms,
    setAmenities,
    setFurnishing,
    setVerifiedOnly,
    setLocation,
    setAvailableFrom,
    setSearchQuery,
    setSortBy,
    setViewMode,
    clearAllFilters,
    clearSpecificFilter,
    updateFilters,
    clearError,
    combineFilters,
    persistViewState,
    restoreViewState
} = filterSlice.actions;

export default filterSlice.reducer;