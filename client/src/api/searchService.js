import apiClient from "./config";
import { SEARCH_ENDPOINTS } from "./endpoints";

const searchService = {
    searchResults: (payload) => {
        return apiClient.post(SEARCH_ENDPOINTS.GET_SEARCH_RESULTS, payload);
    }

};

export default searchService;