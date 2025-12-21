import apiClient from "./config";
import { SEARCH_ENDPOINTS } from "./endpoints";

// --- HELPER 1: Search Query Validation ---
const validateSearchQuery = (query) => {
    const errors = [];
    if (!query) {
        errors.push("Search query is required");
        return { isValid: false, errors };
    }
    if (typeof query !== 'string') errors.push("Search query must be a string");
    if (query.trim().length < 2) errors.push("Search query must be at least 2 characters long");
    if (query.length > 200) errors.push("Search query must be less than 200 characters");

    // Check for potentially harmful patterns
    const harmfulPatterns = [/<script/i, /javascript:/i, /on\w+=/i];
    if (harmfulPatterns.some(pattern => pattern.test(query))) {
        errors.push("Search query contains invalid characters");
    }

    return {
        isValid: errors.length === 0,
        errors,
        sanitizedQuery: query.trim()
    };
};

// --- HELPER 2: Search Suggestions (Client-side Fallback) ---
const generateSearchSuggestions = (query, noResultsFound = false) => {
    const suggestions = [];
    if (noResultsFound) {
        suggestions.push(
            "Try searching with different keywords",
            "Check your spelling",
            "Use more general terms"
        );
        const popularTerms = ["apartment", "house", "studio", "2 bedroom", "furnished", "pet friendly"];
        suggestions.push(...popularTerms.map(term => `Try "${term}"`));
    } else {
        const commonTerms = [
            "apartment", "house", "villa", "studio", "condo",
            "furnished", "unfurnished", "pet friendly", "parking",
            "gym", "pool", "balcony", "garden", "security"
        ];
        const matchingTerms = commonTerms.filter(term =>
            term.toLowerCase().includes(query.toLowerCase()) &&
            term.toLowerCase() !== query.toLowerCase()
        );
        suggestions.push(...matchingTerms);
    }
    return suggestions.slice(0, 8);
};

// --- MAIN SERVICE OBJECT ---
const searchService = {
    // 1. Basic Search Results
    searchResults: async (payload) => {
        try {
            // Validate only if a query string is provided
            if (payload.query) {
                const validation = validateSearchQuery(payload.query);
                if (!validation.isValid) throw new Error(validation.errors.join(', '));
                payload.query = validation.sanitizedQuery;
            }

            // Map Frontend Inputs -> Backend Payload
            const backendPayload = {
                q: payload.query || payload.searchQuery || "",
                page: payload.page || 1,
                limit: payload.limit || 12,
                sort: payload.sort || "newest",
                filters: {
                    city: payload.location || "",
                    category: payload.category || "",
                    // Backend handles regex, so simple string is fine
                    propertyType: payload.propertyType || payload.type || "",
                    ...payload.filters
                }
            };

            const response = await apiClient.post(SEARCH_ENDPOINTS.GET_SEARCH_RESULTS, backendPayload);

            // Transform Response
            // We rely on the Backend for sorting and relevance.
            return {
                ...response,
                data: {
                    searchResultData: response.data.data?.searchResultData || response.data.searchResultData || [],
                    message: response.data.data?.message || "Search completed successfully",
                    pagination: response.data.data?.pagination || response.data.pagination
                }
            };

        } catch (error) {
            if (error.message && error.message.includes('validation')) {
                throw new Error(`Search validation failed: ${error.message}`);
            }
            throw error;
        }
    },

    // 2. Advanced Search (Reuses logic but handles response differently)
    advancedSearch: async (payload) => {
        try {
            if (payload.query) {
                const validation = validateSearchQuery(payload.query);
                if (!validation.isValid) {
                    return {
                        data: {
                            searchResultData: [],
                            suggestions: validation.errors,
                            hasError: true,
                            errorMessage: validation.errors[0]
                        }
                    };
                }
                payload.query = validation.sanitizedQuery;
            }

            const backendPayload = {
                q: payload.query || "",
                page: payload.page || 1,
                limit: payload.limit || 12,
                sort: payload.sort || "relevance",
                filters: {
                    city: payload.location || "",
                    category: payload.category || "",
                    propertyType: payload.propertyType || "",
                    ...payload.filters
                }
            };

            const response = await apiClient.post(SEARCH_ENDPOINTS.GET_SEARCH_RESULTS, backendPayload);
            const searchResultData = response.data.data?.searchResultData || [];

            // Handle "No Results" scenario
            if (searchResultData.length === 0) {
                if (!response.data) response.data = {};

                response.data.suggestions = generateSearchSuggestions(payload.query || '', true);
                response.data.noResultsFound = true;
                response.data.searchResultData = [];
            } else {
                response.data.searchResultData = searchResultData;
            }

            return response;

        } catch (error) {
            return {
                data: {
                    searchResultData: [],
                    suggestions: ["Please try again later"],
                    hasError: true,
                    errorType: 'network',
                    errorMessage: error.message
                }
            };
        }
    },

    // 3. Get Search Suggestions
    getSearchSuggestions: async (query) => {
        try {
            if (!query || query.trim().length < 1) {
                return { data: { suggestions: generateSearchSuggestions('', false) } };
            }
            return { data: { suggestions: generateSearchSuggestions(query, false) } };
        } catch (error) {
            return { data: { suggestions: [] } };
        }
    },

    // 4. Get Recent Searches
    getRecentSearches: async () => {
        try {
            const recentSearches = JSON.parse(localStorage.getItem('recentSearches') || '[]');
            return { data: { recentSearches: recentSearches.slice(0, 10) } };
        } catch (error) {
            return { data: { recentSearches: [] } };
        }
    },

    // Utilities
    validateQuery: validateSearchQuery
};

export default searchService;