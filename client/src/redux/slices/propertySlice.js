import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import propertyService from "../../api/propertyService";


export const postProperty = createAsyncThunk(
    "properties/postProperty",
    async (payload, { rejectWithValue }) => {
        try {
            const response = await propertyService.postproperty(payload)
            return response.data;
        } catch (error) {
            console.log("Post Property data catch === ", error);
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);
export const getAllProperties = createAsyncThunk(
    "properties/getAllProperties",
    async (params = {}, { rejectWithValue }) => {
        try {
            const response = await propertyService.getAllProperties(params)
            return response.data;
        } catch (error) {
            console.log("Get all Property data catch === ", error);
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const loadMoreProperties = createAsyncThunk(
    "properties/loadMoreProperties",
    async (params = {}, { rejectWithValue }) => {
        try {
            const response = await propertyService.getAllProperties(params)
            return response.data;
        } catch (error) {
            console.log("Load more properties catch === ", error);
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);
export const getPropertyByID = createAsyncThunk(
    "properties/:slug",
    async (payload, { rejectWithValue }) => {
        try {
            const response = await propertyService.getPropertyByID(payload)
            return response.data;
        } catch (error) {
            console.log("Get property data catch === ", error);
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);


const initialState = {
    propertyData: {},
    allProperties: [],
    propertyDataId: {},
    isLoading: false,
    isLoadingMore: false,
    isError: false,
    errorMessage: "",
    // Pagination state
    pagination: {
        page: 1,
        pageSize: 12,
        total: 0,
        hasMore: true
    },
    // Enhanced state for cross-view consistency
    propertyCache: {}, // Cache properties by ID for quick access
    lastUpdated: null,
    optimisticUpdates: {}, // Track optimistic updates
};

const propertySlice = createSlice({
    name: "propertyData",
    initialState,
    reducers: {
        // Optimistic update for property changes
        updatePropertyOptimistic: (state, action) => {
            const { propertyId, updates } = action.payload;

            // Update in cache
            if (state.propertyCache[propertyId]) {
                state.propertyCache[propertyId] = {
                    ...state.propertyCache[propertyId],
                    ...updates
                };
            }

            // Update in allProperties array
            const propertyIndex = state.allProperties.findIndex(p => p._id === propertyId);
            if (propertyIndex !== -1) {
                state.allProperties[propertyIndex] = {
                    ...state.allProperties[propertyIndex],
                    ...updates
                };
            }

            // Update single property if it matches
            if (state.propertyDataId._id === propertyId) {
                state.propertyDataId = { ...state.propertyDataId, ...updates };
            }

            // Track optimistic update
            state.optimisticUpdates[propertyId] = {
                ...state.optimisticUpdates[propertyId],
                ...updates,
                timestamp: Date.now()
            };
        },

        // Confirm optimistic update (remove from pending)
        confirmOptimisticUpdate: (state, action) => {
            const { propertyId } = action.payload;
            delete state.optimisticUpdates[propertyId];
        },

        // Revert optimistic update on error
        revertOptimisticUpdate: (state, action) => {
            const { propertyId, originalData } = action.payload;

            // Revert in cache
            if (state.propertyCache[propertyId]) {
                state.propertyCache[propertyId] = originalData;
            }

            // Revert in allProperties array
            const propertyIndex = state.allProperties.findIndex(p => p._id === propertyId);
            if (propertyIndex !== -1) {
                state.allProperties[propertyIndex] = originalData;
            }

            // Revert single property if it matches
            if (state.propertyDataId._id === propertyId) {
                state.propertyDataId = originalData;
            }

            // Remove from optimistic updates
            delete state.optimisticUpdates[propertyId];
        },

        // Sync property data across all views
        syncPropertyData: (state, action) => {
            const { property } = action.payload;
            const propertyId = property._id;

            // Update cache
            state.propertyCache[propertyId] = property;

            // Update in allProperties array
            const propertyIndex = state.allProperties.findIndex(p => p._id === propertyId);
            if (propertyIndex !== -1) {
                state.allProperties[propertyIndex] = property;
            }

            // Update single property if it matches
            if (state.propertyDataId._id === propertyId) {
                state.propertyDataId = property;
            }

            state.lastUpdated = Date.now();
        },

        // Remove property from all views
        removePropertyFromViews: (state, action) => {
            const { propertyId } = action.payload;

            // Remove from cache
            delete state.propertyCache[propertyId];

            // Remove from allProperties array
            state.allProperties = state.allProperties.filter(p => p._id !== propertyId);

            // Clear single property if it matches
            if (state.propertyDataId._id === propertyId) {
                state.propertyDataId = {};
            }

            // Remove any optimistic updates
            delete state.optimisticUpdates[propertyId];
        },

        // Clear all data (for logout, etc.)
        clearPropertyData: (state) => {
            return { ...initialState };
        },

        // Append more properties (for load more)
        appendProperties: (state, action) => {
            const newItems = action.payload.items || [];
            state.allProperties = [...state.allProperties, ...newItems];
            state.pagination = {
                page: action.payload.page || state.pagination.page + 1,
                pageSize: action.payload.pageSize || 12,
                total: action.payload.total || 0,
                hasMore: newItems.length >= (action.payload.pageSize || 12)
            };
            newItems.forEach(property => {
                state.propertyCache[property._id] = property;
            });
            state.lastUpdated = Date.now();
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(postProperty.pending, (state) => {
                state.isLoading = true;
                state.isSuccess = false;
                state.isError = false
                state.errorMessage = ""
            })
            .addCase(postProperty.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.isError = false;
                state.propertyData = action.payload.propertyData || {};
                state.successMessage = action.payload.message || "Successfully posted property Data";
                state.errorMessage = ""
            })
            .addCase(postProperty.rejected, (state, action) => {
                state.isLoading = false;
                state.isSuccess = false;
                state.isError = true;
                state.errorMessage = action.payload
                state.successMessage = ""
            })
            .addCase(getAllProperties.pending, (state) => {
                state.isLoading = true;
                state.isSuccess = false;
                state.isError = false
                state.errorMessage = ""
            })
            .addCase(getAllProperties.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.isError = false;
                state.allProperties = action.payload.items || [];

                // Update pagination state
                state.pagination = {
                    page: action.payload.page || 1,
                    pageSize: action.payload.pageSize || 12,
                    total: action.payload.total || 0,
                    hasMore: (action.payload.items || []).length >= (action.payload.pageSize || 12)
                };

                // Update property cache
                (action.payload.items || []).forEach(property => {
                    state.propertyCache[property._id] = property;
                });

                state.successMessage = action.payload.message || "Successfully fetched all property Data";
                state.errorMessage = "";
                state.lastUpdated = Date.now();
            })
            .addCase(getAllProperties.rejected, (state, action) => {
                state.isLoading = false;
                state.isSuccess = false;
                state.isError = true;
                state.errorMessage = action.payload
                state.successMessage = ""
            })
            .addCase(getPropertyByID.pending, (state) => {
                state.isLoading = true;
                state.isSuccess = false;
                state.isError = false
                state.errorMessage = ""
            })
            .addCase(getPropertyByID.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.isError = false;
                // Update property cache
                if (action.payload.data?._id) {
                    state.propertyCache[action.payload.data._id] = action.payload.data;
                }

                // Also update propertyDataId with the actual property object
                state.propertyDataId = action.payload.data || {};

                state.successMessage = action.payload.message || "Successfully fetched property Data";
                state.errorMessage = "";
                state.lastUpdated = Date.now();
            })
            .addCase(getPropertyByID.rejected, (state, action) => {
                state.isLoading = false;
                state.isSuccess = false;
                state.isError = true;
                state.errorMessage = action.payload
                state.successMessage = ""
            })
            // Load more properties
            .addCase(loadMoreProperties.pending, (state) => {
                state.isLoadingMore = true;
                state.isError = false;
                state.errorMessage = "";
            })
            .addCase(loadMoreProperties.fulfilled, (state, action) => {
                state.isLoadingMore = false;
                state.isError = false;

                const newItems = action.payload.items || [];
                // Append new items to existing properties
                state.allProperties = [...state.allProperties, ...newItems];

                // Update pagination state
                state.pagination = {
                    page: action.payload.page || state.pagination.page + 1,
                    pageSize: action.payload.pageSize || 12,
                    total: action.payload.total || 0,
                    hasMore: newItems.length >= (action.payload.pageSize || 12)
                };

                // Update property cache
                newItems.forEach(property => {
                    state.propertyCache[property._id] = property;
                });

                state.lastUpdated = Date.now();
            })
            .addCase(loadMoreProperties.rejected, (state, action) => {
                state.isLoadingMore = false;
                state.isError = true;
                state.errorMessage = action.payload;
            })
    },
});


export const {
    updatePropertyOptimistic,
    confirmOptimisticUpdate,
    revertOptimisticUpdate,
    syncPropertyData,
    removePropertyFromViews,
    clearPropertyData,
    appendProperties
} = propertySlice.actions;

export default propertySlice.reducer;