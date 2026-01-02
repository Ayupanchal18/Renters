const PROPERTY_ENDPOINTS = {
    // General property endpoints (backward compatible)
    POST_PROPERTY: "/api/properties",
    GET_ALL_PROPERTIES: "/api/properties",
    GET_PROPERTY_BY_ID: "/api/properties/get-property",

    // Rent-specific endpoints
    POST_RENT_PROPERTY: "/api/properties/rent",
    GET_RENT_PROPERTIES: "/api/properties/rent",
    GET_RENT_PROPERTY_BY_SLUG: "/api/properties/rent",
    SEARCH_RENT_PROPERTIES: "/api/properties/rent/search",

    // Buy-specific endpoints
    POST_BUY_PROPERTY: "/api/properties/buy",
    GET_BUY_PROPERTIES: "/api/properties/buy",
    GET_BUY_PROPERTY_BY_SLUG: "/api/properties/buy",
    SEARCH_BUY_PROPERTIES: "/api/properties/buy/search"
}


export default PROPERTY_ENDPOINTS