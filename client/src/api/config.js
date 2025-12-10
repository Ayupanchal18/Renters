import axios from "axios";

const API_BASE_URL = "http://localhost:8080";

const apiClient = axios.create({
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
apiClient.interceptors.request.use(
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


export default apiClient;