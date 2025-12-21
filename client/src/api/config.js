import axios from "axios";
import { enhanceApiClient } from "../utils/errorHandling";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const baseApiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    transformResponse: [(data) => {
        if (typeof data === 'string') {
            try {
                return JSON.parse(data);
            } catch (e) {
                return data;
            }
        }
        return data;
    }],
});

// Add interceptor to include token + x-user-id
baseApiClient.interceptors.request.use(
    (config) => {
        const rawUserId = localStorage.getItem("userId");

        if (rawUserId) {
            // 2. Check if it's a JSON object or just a raw string
            // If it starts with '{', it's likely a JSON object we need to parse
            if (rawUserId.startsWith('{')) {
                try {
                    const userObj = JSON.parse(rawUserId);
                    if (userObj.id) {
                        config.headers["x-user-id"] = userObj.id;
                    }
                } catch (e) {
                    console.warn("Failed to parse user object:", e);
                }
            } else {
                // 3. Otherwise, it's just the ID string (matches your screenshot!)
                // Remove any surrounding quotes if they exist
                const cleanId = rawUserId.replace(/^"|"$/g, '');
                config.headers["x-user-id"] = cleanId;
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Enhance the API client with error handling and retry logic
const apiClient = enhanceApiClient(baseApiClient);

export default apiClient;