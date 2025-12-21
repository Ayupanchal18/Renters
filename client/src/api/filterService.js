import apiClient from "./config";
import { FILTER_ENDPOINTS } from "./endpoints";

const filterService = {
    // Apply filters to property search
    applyFilters: (payload) => {
        return apiClient.post(FILTER_ENDPOINTS.APPLY_FILTERS, payload);
    },

    // Get available filter options
    getFilterOptions: () => {
        return apiClient.get(FILTER_ENDPOINTS.GET_FILTER_OPTIONS);
    },

    // Advanced search with filters combined
    advancedSearch: (payload) => {
        return apiClient.post(FILTER_ENDPOINTS.ADVANCED_SEARCH, payload);
    },

    // Get user-specific properties with filters
    getUserPropertiesFiltered: (payload) => {
        return apiClient.post(FILTER_ENDPOINTS.USER_PROPERTIES_FILTERED, payload);
    }
};

export default filterService;