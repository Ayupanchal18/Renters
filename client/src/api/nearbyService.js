/**
 * Service for fetching nearby amenities via backend API
 */

/**
 * Parse mapLocation string to coordinates
 * @param {string} mapLocation - Format: "lat, lng" e.g., "23.0271681, 72.5586122"
 */
function parseMapLocation(mapLocation) {
    if (!mapLocation || typeof mapLocation !== 'string') return null;

    const parts = mapLocation.split(',').map(p => parseFloat(p.trim()));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        return { lat: parts[0], lng: parts[1] };
    }
    return null;
}

const nearbyService = {
    /**
     * Get nearby amenities based on coordinates
     * @param {Object} coordinates - {lat, lng}
     * @param {number} radius - Search radius in kilometers (default: 2)
     */
    getNearbyAmenities: async (coordinates, radius = 2) => {
        try {
            if (!coordinates || !coordinates.lat || !coordinates.lng) {
                return { success: false, amenities: [], error: 'Invalid coordinates' };
            }

            const { lat, lng } = coordinates;
            const response = await fetch(`/api/nearby?lat=${lat}&lng=${lng}&radius=${radius}`);

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching nearby amenities:', error);
            return { success: false, amenities: [], error: error.message };
        }
    },

    /**
     * Get nearby amenities by address (geocodes first via backend proxy)
     * @param {string} address - Property address
     * @param {string} city - Property city
     */
    getNearbyAmenitiesByAddress: async (address, city) => {
        try {
            // Use backend proxy to geocode the address (avoids CORS/CSP issues with Nominatim)
            const params = new URLSearchParams();
            if (address) params.append('address', address);
            if (city) params.append('city', city);

            const geocodeResponse = await fetch(`/api/geocode?${params.toString()}`);

            if (!geocodeResponse.ok) {
                throw new Error('Geocoding failed');
            }

            const geocodeData = await geocodeResponse.json();

            if (!geocodeData.success || !geocodeData.coordinates) {
                // Fallback: try with just city
                if (city && address) {
                    const cityResponse = await fetch(`/api/geocode?city=${encodeURIComponent(city)}`);
                    const cityData = await cityResponse.json();

                    if (!cityData.success || !cityData.coordinates) {
                        return { success: false, amenities: [], error: 'Could not geocode address' };
                    }
                    return nearbyService.getNearbyAmenities(cityData.coordinates, 2);
                }
                return { success: false, amenities: [], error: 'Could not geocode address' };
            }

            return nearbyService.getNearbyAmenities(geocodeData.coordinates, 2);
        } catch (error) {
            console.error('Error fetching nearby amenities by address:', error);
            return { success: false, amenities: [], error: error.message };
        }
    },

    /**
     * Parse mapLocation string and get nearby amenities
     * @param {string} mapLocation - Format: "lat, lng"
     */
    getNearbyAmenitiesByMapLocation: async (mapLocation, radius = 2) => {
        const coords = parseMapLocation(mapLocation);
        if (!coords) {
            return { success: false, amenities: [], error: 'Invalid map location format' };
        }
        return nearbyService.getNearbyAmenities(coords, radius);
    }
};

export default nearbyService;
