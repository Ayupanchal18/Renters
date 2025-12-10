const API_BASE = "/api";

// Helper: add JSON, auth token, and user ID (for local dev)
function getHeaders(authToken) {
    const headers = { "Content-Type": "application/json" };

    if (authToken) headers["Authorization"] = `Bearer${authToken}`;

    if (typeof window !== "undefined") {
        const userId = localStorage.getItem("userId");
        if (userId) headers["x-user-id"] = userId;
    }

    return headers;
}

/* -------------------------
   AUTH API
------------------------- */
export const authAPI = {
    register: async (data) =>
        fetch(`${API_BASE}/auth/register`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify(data),
        }).then((r) => r.json()),

    login: async (data) =>
        fetch(`${API_BASE}/auth/login`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify(data),
        }).then((r) => r.json()),
};

/* -------------------------
   PROPERTIES API
------------------------- */
export const propertiesAPI = {
    list: async (params) => {
        const q = new URLSearchParams(params);
        return fetch(`${API_BASE}/properties?${q}`, {
            headers: getHeaders(),
        }).then((r) => r.json());
    },

    get: async (id) =>
        fetch(`${API_BASE}/properties/${id}`, {
            headers: getHeaders(),
        }).then((r) => r.json()),

    create: async (data) =>
        fetch(`${API_BASE}/properties`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify(data),
        }).then((r) => r.json()),

    update: async (id, data) =>
        fetch(`${API_BASE}/properties/${id}`, {
            method: "PATCH",
            headers: getHeaders(),
            body: JSON.stringify(data),
        }).then((r) => r.json()),

    delete: async (id) =>
        fetch(`${API_BASE}/properties/${id}`, {
            method: "DELETE",
            headers: getHeaders(),
        }).then((r) => r.json()),
};

/* -------------------------
   USERS API
------------------------- */
export const usersAPI = {
    getMe: async () =>
        fetch(`${API_BASE}/users/me`, {
            headers: getHeaders(),
        }).then((r) => r.json()),

    update: async (data) =>
        fetch(`${API_BASE}/users/me`, {
            method: "PATCH",
            headers: getHeaders(),
            body: JSON.stringify(data),
        }).then((r) => r.json()),
};

/* -------------------------
   WISHLIST API
------------------------- */
export const wishlistAPI = {
    list: async () =>
        fetch(`${API_BASE}/wishlist`, {
            headers: getHeaders(),
        }).then((r) => r.json()),

    add: async (propertyId) =>
        fetch(`${API_BASE}/wishlist/${propertyId}`, {
            method: "POST",
            headers: getHeaders(),
        }).then((r) => r.json()),

    remove: async (propertyId) =>
        fetch(`${API_BASE}/wishlist/${propertyId}`, {
            method: "DELETE",
            headers: getHeaders(),
        }).then((r) => r.json()),
};

/* -------------------------
   CONVERSATIONS API
------------------------- */
export const conversationsAPI = {
    list: async () =>
        fetch(`${API_BASE}/conversations`, {
            headers: getHeaders(),
        }).then((r) => r.json()),

    get: async (id) =>
        fetch(`${API_BASE}/conversations/${id}`, {
            headers: getHeaders(),
        }).then((r) => r.json()),

    create: async (data) =>
        fetch(`${API_BASE}/conversations`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify(data),
        }).then((r) => r.json()),

    sendMessage: async (id, text) =>
        fetch(`${API_BASE}/conversations/${id}/messages`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify({ text }),
        }).then((r) => r.json()),
};

/* -------------------------
   NOTIFICATIONS API
------------------------- */
export const notificationsAPI = {
    list: async (params) => {
        const q = new URLSearchParams(params);
        return fetch(`${API_BASE}/notifications?${q}`, {
            headers: getHeaders(),
        }).then((r) => r.json());
    },

    markAsRead: async (id) =>
        fetch(`${API_BASE}/notifications/${id}/read`, {
            method: "PATCH",
            headers: getHeaders(),
        }).then((r) => r.json()),

    markAllAsRead: async () =>
        fetch(`${API_BASE}/notifications/read-all`, {
            method: "PATCH",
            headers: getHeaders(),
        }).then((r) => r.json()),
};

/* -------------------------
   SEARCH API
------------------------- */
export const searchAPI = {
    suggest: async (params) => {
        const q = new URLSearchParams(params);
        return fetch(`${API_BASE}/search/suggest?${q}`, {
            headers: getHeaders(),
        }).then((r) => r.json());
    },
};

/* -------------------------
   UPLOAD API
------------------------- */
export const uploadAPI = {
    sign: async (filename, contentType) =>
        fetch(`${API_BASE}/upload/sign`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify({ filename, contentType }),
        }).then((r) => r.json()),

    upload: async (url) =>
        fetch(`${API_BASE}/upload`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify({ url }),
        }).then((r) => r.json()),
};
