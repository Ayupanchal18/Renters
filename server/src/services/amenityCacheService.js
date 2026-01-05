/**
 * Amenity Cache Service
 * Manages pre-cached amenity data to reduce runtime Overpass API calls
 */

import { CachedAmenity } from "../../models/CachedAmenity.js";
import { Property } from "../../models/Property.js";

// Configuration
const CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const STALE_CACHE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days for stale fallback

// Top cities to pre-cache (add more as needed)
const TOP_CITIES = [
    "Ahmedabad", "Mumbai", "Delhi", "Bangalore", "Chennai",
    "Kolkata", "Hyderabad", "Pune", "Jaipur", "Lucknow",
    "Surat", "Chandigarh", "Indore", "Nagpur", "Vadodara",
    "Gandhinagar", "Rajkot", "Noida", "Gurgaon", "Thane"
];

/**
 * Get cached amenities for a location
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Object|null} Cached amenity data or null
 */
export async function getCachedAmenities(lat, lng) {
    try {
        // Try fresh cache first
        let cached = await CachedAmenity.getCachedAmenities(lat, lng, CACHE_MAX_AGE_MS);

        if (cached && cached.amenities && cached.amenities.length > 0) {
            return {
                success: true,
                amenities: cached.amenities,
                fromCache: true,
                cacheAge: Date.now() - new Date(cached.lastUpdated).getTime()
            };
        }

        // Try stale cache as fallback
        cached = await CachedAmenity.getCachedAmenities(lat, lng, STALE_CACHE_MAX_AGE_MS);

        if (cached && cached.amenities && cached.amenities.length > 0) {
            return {
                success: true,
                amenities: cached.amenities,
                fromCache: true,
                stale: true,
                cacheAge: Date.now() - new Date(cached.lastUpdated).getTime()
            };
        }

        return null;
    } catch (error) {
        console.error("[AmenityCache] Error getting cached amenities:", error);
        return null;
    }
}

/**
 * Store amenities in cache
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {Array} amenities - Amenity data to cache
 * @param {string} city - City name (optional)
 * @param {number} fetchDurationMs - How long the fetch took
 */
export async function setCachedAmenities(lat, lng, amenities, city = null, fetchDurationMs = null) {
    try {
        await CachedAmenity.setCachedAmenities(lat, lng, amenities, city, fetchDurationMs);
        console.log(`[AmenityCache] Cached ${amenities.length} amenities for ${lat.toFixed(2)},${lng.toFixed(2)}`);
    } catch (error) {
        console.error("[AmenityCache] Error caching amenities:", error);
    }
}

/**
 * Record a fetch error for a location
 */
export async function recordFetchError(lat, lng, errorMessage) {
    try {
        await CachedAmenity.recordFetchError(lat, lng, errorMessage);
    } catch (error) {
        console.error("[AmenityCache] Error recording fetch error:", error);
    }
}

/**
 * Get popular locations from property data to pre-cache
 * @param {number} limit - Maximum locations to return
 * @returns {Array} Array of {lat, lng, city} objects
 */
export async function getPopularLocations(limit = 100) {
    try {
        // Get unique locations from properties
        const properties = await Property.aggregate([
            {
                $match: {
                    status: "active",
                    isDeleted: false,
                    "location.coordinates": { $exists: true }
                }
            },
            {
                $project: {
                    city: 1,
                    lat: { $arrayElemAt: ["$location.coordinates", 1] },
                    lng: { $arrayElemAt: ["$location.coordinates", 0] }
                }
            },
            {
                $match: {
                    lat: { $ne: 0 },
                    lng: { $ne: 0 }
                }
            },
            {
                $group: {
                    _id: {
                        gridCell: {
                            $concat: [
                                { $toString: { $floor: { $multiply: ["$lat", 100] } } },
                                "_",
                                { $toString: { $floor: { $multiply: ["$lng", 100] } } }
                            ]
                        },
                        city: "$city"
                    },
                    lat: { $first: "$lat" },
                    lng: { $first: "$lng" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } },
            { $limit: limit }
        ]);

        return properties.map(p => ({
            lat: p.lat,
            lng: p.lng,
            city: p._id.city,
            propertyCount: p.count
        }));
    } catch (error) {
        console.error("[AmenityCache] Error getting popular locations:", error);
        return [];
    }
}

/**
 * Get cache statistics
 * @returns {Object} Cache stats
 */
export async function getCacheStats() {
    try {
        return await CachedAmenity.getStats();
    } catch (error) {
        console.error("[AmenityCache] Error getting cache stats:", error);
        return null;
    }
}

/**
 * Get stale cache entries that need refreshing
 * @param {number} limit - Maximum entries to return
 * @returns {Array} Stale entries
 */
export async function getStaleEntries(limit = 50) {
    try {
        return await CachedAmenity.getStaleEntries(CACHE_MAX_AGE_MS, limit);
    } catch (error) {
        console.error("[AmenityCache] Error getting stale entries:", error);
        return [];
    }
}

/**
 * Get grid cell ID for coordinates
 */
export function getGridCell(lat, lng) {
    return CachedAmenity.getGridCell(lat, lng);
}

export default {
    getCachedAmenities,
    setCachedAmenities,
    recordFetchError,
    getPopularLocations,
    getCacheStats,
    getStaleEntries,
    getGridCell,
    TOP_CITIES,
    CACHE_MAX_AGE_MS,
    STALE_CACHE_MAX_AGE_MS
};
