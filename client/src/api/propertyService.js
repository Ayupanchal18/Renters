import apiClient from "./config";
import { PROPERTY_ENDPOINTS } from "./endpoints";

const propertyService = {
    postproperty: (payload) => {
        return apiClient.post(PROPERTY_ENDPOINTS.POST_PROPERTY, payload, {
            headers: { "Content-Type": "multipart/form-data" }
        });
    },

    getAllProperties: () => {
        return apiClient.get(PROPERTY_ENDPOINTS.GET_ALL_PROPERTIES)
    },

    getPropertyByID: (payload) => {
        return apiClient.post(PROPERTY_ENDPOINTS.GET_PROPERTY_BY_ID, payload)
    }

};

export default propertyService;