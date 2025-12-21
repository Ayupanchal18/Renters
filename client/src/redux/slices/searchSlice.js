import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import searchService from "../../api/searchService";

// Enhanced search with advanced query processing
export const searchResults = createAsyncThunk(
    "properties/search",
    async (payload, { rejectWithValue }) => {
        try {
            const response = await searchService.searchResults(payload);
            console.log(response);
            return response.data;
        } catch (error) {
            console.log("Search Results data catch === ", error);
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

// Advanced search with relevance scoring and suggestions
export const advancedSearch = createAsyncThunk(
    "properties/advancedSearch",
    async (payload, { rejectWithValue }) => {
        try {
            const response = await searchService.advancedSearch(payload);
            return response.data;
        } catch (error) {
            console.log("Advanced Search error === ", error);
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

// Get search suggestions
export const getSearchSuggestions = createAsyncThunk(
    "properties/searchSuggestions",
    async (query, { rejectWithValue }) => {
        try {
            const response = await searchService.getSearchSuggestions(query);
            return response.data;
        } catch (error) {
            console.log("Search Suggestions error === ", error);
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

// Get recent searches
export const getRecentSearches = createAsyncThunk(
    "properties/recentSearches",
    async (_, { rejectWithValue }) => {
        try {
            const response = await searchService.getRecentSearches();
            return response.data;
        } catch (error) {
            console.log("Recent Searches error === ", error);
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

const initialState = {
    // Search results
    searchResultData: [],
    isLoading: false,
    isError: false,
    errorMessage: "",
    isSuccess: false,
    successMessage: "",

    // Advanced search
    advancedSearchResults: [],
    isAdvancedSearchLoading: false,
    advancedSearchError: false,
    advancedSearchErrorMessage: "",
    noResultsFound: false,
    suggestions: [],

    // Search suggestions
    searchSuggestions: [],
    isSuggestionsLoading: false,
    suggestionsError: false,

    // Recent searches
    recentSearches: [],
    isRecentSearchesLoading: false,
    recentSearchesError: false,

    // Current search query and metadata
    currentQuery: "",
    currentLocation: "",
    lastSearchTimestamp: null,
    searchHistory: []
};

const searchSlice = createSlice({
    name: "searchResults",
    initialState,
    reducers: {
        // Clear search results
        clearSearchResults: (state) => {
            state.searchResultData = [];
            state.advancedSearchResults = [];
            state.isError = false;
            state.errorMessage = "";
            state.noResultsFound = false;
            state.suggestions = [];
        },

        // Clear suggestions
        clearSuggestions: (state) => {
            state.searchSuggestions = [];
            state.suggestions = [];
        },

        // Set current search query
        setCurrentQuery: (state, action) => {
            state.currentQuery = action.payload.query || "";
            state.currentLocation = action.payload.location || "";
        },

        // Add to search history
        addToSearchHistory: (state, action) => {
            const searchEntry = {
                query: action.payload.query,
                location: action.payload.location,
                timestamp: new Date().toISOString(),
                resultsCount: action.payload.resultsCount || 0
            };

            // Remove duplicate entries
            state.searchHistory = state.searchHistory.filter(
                entry => !(entry.query === searchEntry.query && entry.location === searchEntry.location)
            );

            // Add to beginning and limit to 10 entries
            state.searchHistory.unshift(searchEntry);
            state.searchHistory = state.searchHistory.slice(0, 10);
        },

        // Clear search history
        clearSearchHistory: (state) => {
            state.searchHistory = [];
        }
    },
    extraReducers: (builder) => {
        builder
            // Basic search results
            .addCase(searchResults.pending, (state) => {
                state.isLoading = true;
                state.isSuccess = false;
                state.isError = false;
                state.errorMessage = "";
            })
            .addCase(searchResults.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.isError = false;
                state.searchResultData = action.payload.searchResultData || [];
                state.successMessage = action.payload.message || "Successfully retrieved search results";
                state.errorMessage = "";
                state.lastSearchTimestamp = new Date().toISOString();
            })
            .addCase(searchResults.rejected, (state, action) => {
                state.isLoading = false;
                state.isSuccess = false;
                state.isError = true;
                state.errorMessage = action.payload;
                state.successMessage = "";
            })

            // Advanced search results
            .addCase(advancedSearch.pending, (state) => {
                state.isAdvancedSearchLoading = true;
                state.advancedSearchError = false;
                state.advancedSearchErrorMessage = "";
                state.noResultsFound = false;
                state.suggestions = [];
            })
            .addCase(advancedSearch.fulfilled, (state, action) => {
                state.isAdvancedSearchLoading = false;
                state.advancedSearchError = false;
                state.advancedSearchResults = action.payload.searchResultData || [];
                state.noResultsFound = action.payload.noResultsFound || false;
                state.suggestions = action.payload.suggestions || [];
                state.advancedSearchErrorMessage = "";
                state.lastSearchTimestamp = new Date().toISOString();

                // Handle validation or network errors gracefully
                if (action.payload.hasError) {
                    state.advancedSearchError = true;
                    state.advancedSearchErrorMessage = action.payload.errorMessage || "Search failed";
                }
            })
            .addCase(advancedSearch.rejected, (state, action) => {
                state.isAdvancedSearchLoading = false;
                state.advancedSearchError = true;
                state.advancedSearchErrorMessage = action.payload;
                state.advancedSearchResults = [];
            })

            // Search suggestions
            .addCase(getSearchSuggestions.pending, (state) => {
                state.isSuggestionsLoading = true;
                state.suggestionsError = false;
            })
            .addCase(getSearchSuggestions.fulfilled, (state, action) => {
                state.isSuggestionsLoading = false;
                state.suggestionsError = false;
                state.searchSuggestions = action.payload.suggestions || [];
            })
            .addCase(getSearchSuggestions.rejected, (state, action) => {
                state.isSuggestionsLoading = false;
                state.suggestionsError = true;
                state.searchSuggestions = [];
            })

            // Recent searches
            .addCase(getRecentSearches.pending, (state) => {
                state.isRecentSearchesLoading = true;
                state.recentSearchesError = false;
            })
            .addCase(getRecentSearches.fulfilled, (state, action) => {
                state.isRecentSearchesLoading = false;
                state.recentSearchesError = false;
                state.recentSearches = action.payload.recentSearches || [];
            })
            .addCase(getRecentSearches.rejected, (state, action) => {
                state.isRecentSearchesLoading = false;
                state.recentSearchesError = true;
                state.recentSearches = [];
            });
    },
});

export const {
    clearSearchResults,
    clearSuggestions,
    setCurrentQuery,
    addToSearchHistory,
    clearSearchHistory
} = searchSlice.actions;


export default searchSlice.reducer;