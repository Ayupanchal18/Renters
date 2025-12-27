const PROPERTY_ENDPOINTS = {
    // General property endpoints (backward compatible)
    POST_PROPERTY: "/api/properties",
    GET_ALL_PROPERTIES: "/api/properties",
    GET_PROPERTY_BY_ID: "/api/properties/get-property",

    // Rent-specific endpoints (Requirements: 3.1, 3.2, 3.3, 3.7)
    POST_RENT_PROPERTY: "/api/properties/rent",
    GET_RENT_PROPERTIES: "/api/properties/rent",
    GET_RENT_PROPERTY_BY_SLUG: "/api/properties/rent",
    SEARCH_RENT_PROPERTIES: "/api/properties/rent/search",

    // Buy-specific endpoints (Requirements: 3.4, 3.5, 3.6, 3.8)
    POST_BUY_PROPERTY: "/api/properties/buy",
    GET_BUY_PROPERTIES: "/api/properties/buy",
    GET_BUY_PROPERTY_BY_SLUG: "/api/properties/buy",
    SEARCH_BUY_PROPERTIES: "/api/properties/buy/search"
}


export default PROPERTY_ENDPOINTS