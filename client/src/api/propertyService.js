import apiClient from "./config";
import { PROPERTY_ENDPOINTS } from "./endpoints";

const propertyService = {
    // ==================== GENERAL PROPERTY METHODS (Backward Compatible) ====================

    postproperty: (payload) => {
        return apiClient.post(PROPERTY_ENDPOINTS.POST_PROPERTY, payload, {
            headers: { "Content-Type": "multipart/form-data" }
        });
    },

    getAllProperties: (params = {}) => {
        return apiClient.get(PROPERTY_ENDPOINTS.GET_ALL_PROPERTIES, { params });
    },

    getPropertyByID: (payload) => {
        return apiClient.post(PROPERTY_ENDPOINTS.GET_PROPERTY_BY_ID, payload);
    },

    // Enhanced endpoints for filtering and pagination
    getPropertiesWithPagination: (params) => {
        return apiClient.get(PROPERTY_ENDPOINTS.GET_ALL_PROPERTIES, { params });
    },

    getUserProperties: (userId, params = {}) => {
        return apiClient.get(`${PROPERTY_ENDPOINTS.GET_ALL_PROPERTIES}/user/${userId}`, { params });
    },

    getPropertyAnalytics: (propertyId) => {
        return apiClient.get(`${PROPERTY_ENDPOINTS.GET_ALL_PROPERTIES}/${propertyId}/analytics`);
    },

    // ==================== RENT PROPERTY METHODS ====================

    /**
     * Create a new rent property
     * @param {FormData|Object} payload - Property data with listingType="rent"
     * @returns {Promise} API response with created property
     */
    postRentProperty: (payload) => {
        return apiClient.post(PROPERTY_ENDPOINTS.POST_RENT_PROPERTY, payload, {
            headers: { "Content-Type": "multipart/form-data" }
        });
    },

    /**
     * Get all rent properties with optional filtering and pagination
     * @param {Object} params - Query parameters (page, limit, city, minRent, maxRent, etc.)
     * @returns {Promise} API response with rent properties list
     */
    getRentProperties: (params = {}) => {
        return apiClient.get(PROPERTY_ENDPOINTS.GET_RENT_PROPERTIES, { params });
    },

    /**
     * Get a single rent property by slug or ID
     * @param {string} slug - Property slug or ID
     * @returns {Promise} API response with property details
     */
    getRentPropertyBySlug: (slug) => {
        return apiClient.get(`${PROPERTY_ENDPOINTS.GET_RENT_PROPERTY_BY_SLUG}/${slug}`);
    },

    /**
     * Search rent properties with rent-specific filters
     * @param {Object} filters - Search filters (q, location, priceRange, preferredTenants, etc.)
     * @returns {Promise} API response with search results
     */
    searchRentProperties: (filters = {}) => {
        return apiClient.post(PROPERTY_ENDPOINTS.SEARCH_RENT_PROPERTIES, filters);
    },

    // ==================== BUY PROPERTY METHODS ====================

    /**
     * Create a new buy property
     * @param {FormData|Object} payload - Property data with listingType="buy"
     * @returns {Promise} API response with created property
     */
    postBuyProperty: (payload) => {
        return apiClient.post(PROPERTY_ENDPOINTS.POST_BUY_PROPERTY, payload, {
            headers: { "Content-Type": "multipart/form-data" }
        });
    },

    /**
     * Get all buy properties with optional filtering and pagination
     * @param {Object} params - Query parameters (page, limit, city, minPrice, maxPrice, etc.)
     * @returns {Promise} API response with buy properties list
     */
    getBuyProperties: (params = {}) => {
        return apiClient.get(PROPERTY_ENDPOINTS.GET_BUY_PROPERTIES, { params });
    },

    /**
     * Get a single buy property by slug or ID
     * @param {string} slug - Property slug or ID
     * @returns {Promise} API response with property details
     */
    getBuyPropertyBySlug: (slug) => {
        return apiClient.get(`${PROPERTY_ENDPOINTS.GET_BUY_PROPERTY_BY_SLUG}/${slug}`);
    },

    /**
     * Search buy properties with buy-specific filters
     * @param {Object} filters - Search filters (q, location, priceRange, possessionStatus, loanAvailable, etc.)
     * @returns {Promise} API response with search results
     */
    searchBuyProperties: (filters = {}) => {
        return apiClient.post(PROPERTY_ENDPOINTS.SEARCH_BUY_PROPERTIES, filters);
    }
};

export default propertyService;