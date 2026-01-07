/**
 * Location Handling Standardization Utilities
 * 
 * This module provides consistent location handling across all search interfaces.
 * It standardizes geolocation detection, autocomplete, and location formatting.
 */

// Standard location object structure
export const STANDARD_LOCATION_STRUCTURE = {
    city: '',
    state: '',
    country: '',
    formatted: '', // "City, State" format
    coordinates: {
        lat: null,
        lng: null
    }
};

// Geolocation service configuration
export const GEOLOCATION_CONFIG = {
    // Primary service: BigDataCloud (free, no API key required)
    primaryService: 'bigdatacloud',
    // Fallback service: Nominatim (OpenStreetMap)
    fallbackService: 'nominatim',
    // Geolocation options - first attempt uses faster network-based location
    options: {
        enableHighAccuracy: false, // Use network location first (faster)
        timeout: 8000,
        maximumAge: 300000 // 5 minutes cache
    },
    // High accuracy options for retry
    highAccuracyOptions: {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 300000
    }
};

// API endpoints
const API_ENDPOINTS = {
    bigdatacloud: (lat, lng) =>
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
    nominatim: (lat, lng) =>
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
};

// Location suggestions - will be populated from API
export let LOCATION_SUGGESTIONS = [];

// Fallback suggestions if API fails
const FALLBACK_SUGGESTIONS = [
    { city: 'Mumbai', state: 'Maharashtra', country: 'India' },
    { city: 'Delhi', state: 'Delhi', country: 'India' },
    { city: 'Bangalore', state: 'Karnataka', country: 'India' },
    { city: 'Hyderabad', state: 'Telangana', country: 'India' },
    { city: 'Chennai', state: 'Tamil Nadu', country: 'India' },
    { city: 'Pune', state: 'Maharashtra', country: 'India' },
    { city: 'Kolkata', state: 'West Bengal', country: 'India' },
    { city: 'Ahmedabad', state: 'Gujarat', country: 'India' }
];

// Flag to track if locations have been fetched
let locationsFetched = false;

/**
 * Fetches cities from the API and updates LOCATION_SUGGESTIONS
 * @returns {Promise<Array>} - Array of location objects
 */
export async function fetchLocationSuggestions() {
    if (locationsFetched && LOCATION_SUGGESTIONS.length > 0) {
        return LOCATION_SUGGESTIONS;
    }

    try {
        const response = await fetch('/api/locations/cities');
        const data = await response.json();

        if (data.success && data.data?.length > 0) {
            LOCATION_SUGGESTIONS = data.data.map(city => ({
                city: city.name,
                state: '',
                country: 'India',
                slug: city.slug
            }));
            locationsFetched = true;
        } else {
            LOCATION_SUGGESTIONS = FALLBACK_SUGGESTIONS;
        }
    } catch (error) {
        console.error('Failed to fetch location suggestions:', error);
        LOCATION_SUGGESTIONS = FALLBACK_SUGGESTIONS;
    }

    return LOCATION_SUGGESTIONS;
}

/**
 * Standardizes location data from different API responses
 * @param {Object} apiResponse - Raw API response
 * @param {string} service - Service name ('bigdatacloud' or 'nominatim')
 * @param {Object} coordinates - Original coordinates {lat, lng}
 * @returns {Object} - Standardized location object
 */
export function standardizeLocationData(apiResponse, service, coordinates = {}) {
    if (!apiResponse) {
        return null;
    }

    let city = '';
    let state = '';
    let country = '';

    try {
        switch (service) {
            case 'bigdatacloud':
                city = apiResponse.city || apiResponse.locality || apiResponse.principalSubdivision || '';
                state = apiResponse.principalSubdivision || apiResponse.principalSubdivisionCode || '';
                country = apiResponse.countryName || apiResponse.countryCode || '';
                break;

            case 'nominatim':
                const address = apiResponse.address || {};
                city = address.city || address.town || address.village || address.county || '';
                state = address.state || address.principalSubdivision || '';
                country = address.country || '';
                break;

            default:
                // Try to extract from generic response
                city = apiResponse.city || apiResponse.locality || '';
                state = apiResponse.state || apiResponse.region || '';
                country = apiResponse.country || '';
        }

        // Clean up the values
        city = city.trim();
        state = state.trim();
        country = country.trim();

        // If no city was found, return null
        if (!city) {
            return null;
        }

        // Create formatted string
        const formatted = state ? `${city}, ${state}` : city;

        return {
            city,
            state,
            country,
            formatted,
            coordinates: {
                lat: coordinates.lat || null,
                lng: coordinates.lng || null
            }
        };
    } catch (error) {
        console.error('Error standardizing location data:', error);
        return null;
    }
}

/**
 * Validates if geolocation is supported and available
 * @returns {Object} - Validation result with support status and error message
 */
export function validateGeolocationSupport() {
    if (!navigator) {
        return {
            isSupported: false,
            error: 'Navigator not available'
        };
    }

    if (!('geolocation' in navigator)) {
        return {
            isSupported: false,
            error: 'Geolocation is not supported by your browser'
        };
    }

    return {
        isSupported: true,
        error: null
    };
}

/**
 * Internal function to get position with specific options
 * @param {Object} geoOptions - Geolocation options
 * @returns {Promise<GeolocationPosition>} - Promise resolving to position
 */
function getPositionWithOptions(geoOptions) {
    return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, geoOptions);
    });
}

/**
 * Gets current location using standardized geolocation service
 * Uses a two-phase approach: fast network location first, then high accuracy retry on timeout
 * @param {Object} options - Geolocation options (optional)
 * @returns {Promise<Object>} - Promise resolving to standardized location object
 */
export async function getCurrentLocation(options = {}) {
    const validation = validateGeolocationSupport();
    if (!validation.isSupported) {
        throw new Error(validation.error);
    }

    const geoOptions = { ...GEOLOCATION_CONFIG.options, ...options };
    let position;
    let lastError;

    // First attempt: fast network-based location
    try {
        position = await getPositionWithOptions(geoOptions);
    } catch (error) {
        lastError = error;

        // On timeout, retry with high accuracy and longer timeout
        if (error.code === error.TIMEOUT) {
            console.log('First location attempt timed out, retrying with high accuracy...');
            try {
                const highAccuracyOptions = { ...GEOLOCATION_CONFIG.highAccuracyOptions, ...options };
                position = await getPositionWithOptions(highAccuracyOptions);
            } catch (retryError) {
                lastError = retryError;
            }
        }
    }

    // If we got a position, do reverse geocoding
    if (position) {
        const { latitude, longitude } = position.coords;

        try {
            // Try primary service first
            const location = await reverseGeocode(latitude, longitude, GEOLOCATION_CONFIG.primaryService);
            if (location) {
                return location;
            }

            // Fallback to secondary service
            const fallbackLocation = await reverseGeocode(latitude, longitude, GEOLOCATION_CONFIG.fallbackService);
            if (fallbackLocation) {
                return fallbackLocation;
            }

            // If both services fail, reject with error
            throw new Error('Unable to determine your city. Please enter your location manually.');
        } catch (error) {
            console.error('Reverse geocoding failed:', error);
            throw new Error('Unable to determine your city. Please enter your location manually.');
        }
    }

    // Handle the geolocation error
    let errorMessage = 'Unable to retrieve your location';

    if (lastError) {
        switch (lastError.code) {
            case 1: // PERMISSION_DENIED
                errorMessage = 'Location permission denied. Please enable location access in your browser settings.';
                break;
            case 2: // POSITION_UNAVAILABLE
                errorMessage = 'Location unavailable. Please check your device settings.';
                break;
            case 3: // TIMEOUT
                errorMessage = 'Location request timeout. Please try again.';
                break;
            default:
                errorMessage = 'An unknown error occurred while retrieving location.';
        }
    }

    throw new Error(errorMessage);
}

/**
 * Performs reverse geocoding using specified service
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude  
 * @param {string} service - Service to use ('bigdatacloud' or 'nominatim')
 * @returns {Promise<Object>} - Promise resolving to standardized location object
 */
export async function reverseGeocode(lat, lng, service = 'bigdatacloud') {
    if (!lat || !lng || !API_ENDPOINTS[service]) {
        throw new Error('Invalid coordinates or service');
    }

    try {
        const url = API_ENDPOINTS[service](lat, lng);
        const headers = {};

        // Add User-Agent for Nominatim (required by their policy)
        if (service === 'nominatim') {
            headers['User-Agent'] = 'PropertySearch/1.0';
        }

        const response = await fetch(url, { headers });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return standardizeLocationData(data, service, { lat, lng });
    } catch (error) {
        console.error(`Reverse geocoding failed for ${service}:`, error);
        throw error;
    }
}

/**
 * Validates and normalizes location input string
 * @param {string} locationInput - User input location string
 * @returns {Object} - Validation result and normalized location
 */
export function validateLocationInput(locationInput) {
    if (!locationInput || typeof locationInput !== 'string') {
        return {
            isValid: false,
            error: 'Location is required',
            normalized: null
        };
    }

    const trimmed = locationInput.trim();

    if (trimmed.length < 2) {
        return {
            isValid: false,
            error: 'Location must be at least 2 characters',
            normalized: null
        };
    }

    if (trimmed.length > 100) {
        return {
            isValid: false,
            error: 'Location must be less than 100 characters',
            normalized: null
        };
    }

    // Check for potentially harmful patterns
    const harmfulPatterns = [/<script/i, /javascript:/i, /on\w+=/i];
    if (harmfulPatterns.some(pattern => pattern.test(trimmed))) {
        return {
            isValid: false,
            error: 'Location contains invalid characters',
            normalized: null
        };
    }

    // Try to parse city, state format
    const parts = trimmed.split(',').map(part => part.trim());
    let city = parts[0] || '';
    let state = parts[1] || '';

    return {
        isValid: true,
        error: null,
        normalized: {
            city,
            state,
            country: '',
            formatted: state ? `${city}, ${state}` : city,
            coordinates: { lat: null, lng: null }
        }
    };
}

/**
 * Gets location suggestions based on user input
 * @param {string} query - User input query
 * @param {number} limit - Maximum number of suggestions (default: 8)
 * @returns {Array} - Array of location suggestions
 */
export function getLocationSuggestions(query, limit = 8) {
    // Use current LOCATION_SUGGESTIONS (may be from API or fallback)
    const suggestions = LOCATION_SUGGESTIONS.length > 0 ? LOCATION_SUGGESTIONS : FALLBACK_SUGGESTIONS;

    if (!query || typeof query !== 'string' || query.trim().length < 1) {
        return suggestions.slice(0, limit).map(loc => ({
            ...loc,
            formatted: loc.state ? `${loc.city}, ${loc.state}` : loc.city
        }));
    }

    const queryLower = query.toLowerCase().trim();

    const filtered = suggestions.filter(location => {
        const cityMatch = location.city.toLowerCase().includes(queryLower);
        const stateMatch = location.state?.toLowerCase().includes(queryLower);
        const formatted = location.state ? `${location.city}, ${location.state}` : location.city;
        const formattedMatch = formatted.toLowerCase().includes(queryLower);

        return cityMatch || stateMatch || formattedMatch;
    });

    return filtered.slice(0, limit).map(loc => ({
        ...loc,
        formatted: loc.state ? `${loc.city}, ${loc.state}` : loc.city
    }));
}

/**
 * Formats location object for display
 * @param {Object} location - Location object (any format)
 * @returns {string} - Formatted location string
 */
export function formatLocationForDisplay(location) {
    if (!location) return '';

    if (typeof location === 'string') {
        return location.trim();
    }

    if (typeof location === 'object') {
        // If it's already formatted
        if (location.formatted) {
            return location.formatted;
        }

        // Try to construct from parts
        const city = location.city || '';
        const state = location.state || '';

        if (city && state) {
            return `${city}, ${state}`;
        }

        return city || state || '';
    }

    return '';
}

/**
 * Compares two location objects for equality
 * @param {Object} location1 - First location
 * @param {Object} location2 - Second location
 * @returns {boolean} - Whether locations are equal
 */
export function areLocationsEqual(location1, location2) {
    if (!location1 && !location2) return true;
    if (!location1 || !location2) return false;

    const formatted1 = formatLocationForDisplay(location1).toLowerCase();
    const formatted2 = formatLocationForDisplay(location2).toLowerCase();

    return formatted1 === formatted2;
}

/**
 * Normalizes location data from different sources to standard format
 * @param {Object|string} locationData - Location data in any format
 * @returns {Object} - Standardized location object
 */
export function normalizeLocationData(locationData) {
    if (!locationData) {
        return { ...STANDARD_LOCATION_STRUCTURE };
    }

    if (typeof locationData === 'string') {
        const validation = validateLocationInput(locationData);
        return validation.normalized || { ...STANDARD_LOCATION_STRUCTURE };
    }

    if (typeof locationData === 'object') {
        return {
            city: locationData.city || '',
            state: locationData.state || '',
            country: locationData.country || '',
            formatted: locationData.formatted || formatLocationForDisplay(locationData),
            coordinates: {
                lat: locationData.coordinates?.lat || locationData.lat || null,
                lng: locationData.coordinates?.lng || locationData.lng || null
            }
        };
    }

    return { ...STANDARD_LOCATION_STRUCTURE };
}

// Export all functions and constants
export default {
    STANDARD_LOCATION_STRUCTURE,
    GEOLOCATION_CONFIG,
    LOCATION_SUGGESTIONS,
    standardizeLocationData,
    validateGeolocationSupport,
    getCurrentLocation,
    reverseGeocode,
    validateLocationInput,
    getLocationSuggestions,
    fetchLocationSuggestions,
    formatLocationForDisplay,
    areLocationsEqual,
    normalizeLocationData
};