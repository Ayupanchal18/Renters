import apiClient from "./config";
import { PROPERTY_ENDPOINTS } from "./endpoints";

const propertyService = {
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
    }

};

export default propertyService;