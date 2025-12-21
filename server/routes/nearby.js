import express from 'express';

const router = express.Router();

// Multiple Overpass API endpoints for fallback
const OVERPASS_ENDPOINTS = [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
    'https://maps.mail.ru/osm/tools/overpass/api/interpreter'
];

// Simple in-memory cache
const cache = new Map();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

// Amenity type configurations
const AMENITY_CONFIG = {
    hospital: { type: 'Hospital', icon: 'Stethoscope', color: 'from-red-100 to-orange-100', iconColor: 'text-red-700' },
    clinic: { type: 'Clinic', icon: 'Stethoscope', color: 'from-red-100 to-orange-100', iconColor: 'text-red-700' },
    pharmacy: { type: 'Pharmacy', icon: 'Cross', color: 'from-teal-100 to-cyan-100', iconColor: 'text-teal-700' },
    school: { type: 'School', icon: 'Building2', color: 'from-yellow-100 to-amber-100', iconColor: 'text-yellow-700' },
    college: { type: 'College', icon: 'Building2', color: 'from-yellow-100 to-amber-100', iconColor: 'text-yellow-700' },
    university: { type: 'University', icon: 'Building2', color: 'from-yellow-100 to-amber-100', iconColor: 'text-yellow-700' },
    bank: { type: 'Bank', icon: 'CreditCard', color: 'from-gray-100 to-slate-100', iconColor: 'text-gray-700' },
    atm: { type: 'ATM', icon: 'CreditCard', color: 'from-gray-100 to-slate-100', iconColor: 'text-gray-700' },
    restaurant: { type: 'Restaurant', icon: 'UtensilsCrossed', color: 'from-orange-100 to-red-100', iconColor: 'text-orange-700' },
    cafe: { type: 'Cafe', icon: 'UtensilsCrossed', color: 'from-orange-100 to-red-100', iconColor: 'text-orange-700' },
    fast_food: { type: 'Fast Food', icon: 'UtensilsCrossed', color: 'from-orange-100 to-red-100', iconColor: 'text-orange-700' },
    supermarket: { type: 'Supermarket', icon: 'ShoppingBag', color: 'from-pink-100 to-rose-100', iconColor: 'text-pink-700' },
    mall: { type: 'Mall', icon: 'ShoppingBag', color: 'from-pink-100 to-rose-100', iconColor: 'text-pink-700' },
    marketplace: { type: 'Market', icon: 'ShoppingBag', color: 'from-pink-100 to-rose-100', iconColor: 'text-pink-700' },
    bus_station: { type: 'Bus Station', icon: 'Bike', color: 'from-blue-100 to-cyan-100', iconColor: 'text-blue-700' },
    railway_station: { type: 'Railway Station', icon: 'Bike', color: 'from-blue-100 to-cyan-100', iconColor: 'text-blue-700' },
    metro_station: { type: 'Metro Station', icon: 'Bike', color: 'from-blue-100 to-cyan-100', iconColor: 'text-blue-700' },
    park: { type: 'Park', icon: 'Landmark', color: 'from-green-100 to-emerald-100', iconColor: 'text-green-700' },
    garden: { type: 'Garden', icon: 'Landmark', color: 'from-green-100 to-emerald-100', iconColor: 'text-green-700' },
    gym: { type: 'Gym', icon: 'Dumbbell', color: 'from-indigo-100 to-purple-100', iconColor: 'text-indigo-700' },
    fitness_centre: { type: 'Fitness Center', icon: 'Dumbbell', color: 'from-indigo-100 to-purple-100', iconColor: 'text-indigo-700' },
    place_of_worship: { type: 'Temple/Mosque', icon: 'Landmark', color: 'from-purple-100 to-indigo-100', iconColor: 'text-purple-700' },
    police: { type: 'Police Station', icon: 'Building2', color: 'from-blue-100 to-indigo-100', iconColor: 'text-blue-700' },
    post_office: { type: 'Post Office', icon: 'Building2', color: 'from-orange-100 to-amber-100', iconColor: 'text-orange-700' },
};

// Calculate distance using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function formatDistance(distanceKm) {
    return distanceKm < 1 ? `${Math.round(distanceKm * 1000)}m` : `${distanceKm.toFixed(1)} km`;
}

function buildOverpassQuery(lat, lng, radiusMeters) {
    // Simplified query with fewer amenity types to reduce load
    const amenityTypes = [
        'hospital', 'pharmacy', 'school', 'bank', 'restaurant',
        'supermarket', 'bus_station', 'park', 'gym', 'police'
    ];

    const amenityQuery = amenityTypes.map(type =>
        `node["amenity"="${type}"](around:${radiusMeters},${lat},${lng});`
    ).join('\n');

    const shopQuery = `node["shop"="supermarket"](around:${radiusMeters},${lat},${lng});`;

    const transportQuery = `node["railway"="station"](around:${radiusMeters},${lat},${lng});`;

    // Reduced timeout to 15 seconds
    return `[out:json][timeout:15];(${amenityQuery}${shopQuery}${transportQuery});out body center 50;`;
}

// Fetch with timeout helper
async function fetchWithTimeout(url, options, timeoutMs = 12000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        return response;
    } finally {
        clearTimeout(timeoutId);
    }
}

// Try multiple Overpass endpoints with retry
async function queryOverpassWithRetry(query, maxRetries = 2) {
    let lastError;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        for (const endpoint of OVERPASS_ENDPOINTS) {
            try {
                const response = await fetchWithTimeout(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: `data=${encodeURIComponent(query)}`
                }, 12000);

                if (response.ok) {
                    return await response.json();
                }

                // If rate limited (429) or server error, try next endpoint
                if (response.status === 429 || response.status >= 500) {
                    lastError = new Error(`${endpoint} returned ${response.status}`);
                    continue;
                }

                throw new Error(`Overpass API error: ${response.status}`);
            } catch (error) {
                lastError = error;
                // Continue to next endpoint on timeout or network error
                if (error.name === 'AbortError') {
                    lastError = new Error('Request timeout');
                }
            }
        }

        // Wait before retry
        if (attempt < maxRetries - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    throw lastError || new Error('All Overpass endpoints failed');
}

function getAmenityType(element) {
    const tags = element.tags || {};
    if (tags.amenity && AMENITY_CONFIG[tags.amenity]) return tags.amenity;
    if (tags.shop && AMENITY_CONFIG[tags.shop]) return tags.shop;
    if (tags.railway === 'station') return 'railway_station';
    if (tags.station === 'subway') return 'metro_station';
    if (tags.leisure === 'park') return 'park';
    if (tags.leisure === 'fitness_centre') return 'fitness_centre';
    return null;
}

// GET /api/nearby?lat=23.0271&lng=72.5586&radius=2
router.get('/', async (req, res) => {
    try {
        const { lat, lng, radius = 2 } = req.query;

        if (!lat || !lng) {
            return res.status(400).json({ success: false, error: 'lat and lng are required' });
        }

        const latitude = parseFloat(lat);
        const longitude = parseFloat(lng);
        const radiusKm = Math.min(parseFloat(radius), 3); // Cap radius at 3km

        if (isNaN(latitude) || isNaN(longitude)) {
            return res.status(400).json({ success: false, error: 'Invalid coordinates' });
        }

        // Check cache first (round coords to reduce cache misses)
        const cacheKey = `${latitude.toFixed(3)}_${longitude.toFixed(3)}_${radiusKm}`;
        const cached = cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
            return res.json(cached.data);
        }

        const radiusMeters = radiusKm * 1000;
        const query = buildOverpassQuery(latitude, longitude, radiusMeters);

        let data;
        try {
            data = await queryOverpassWithRetry(query);
        } catch (error) {
            console.error('Overpass API failed after retries:', error.message);
            // Return empty results instead of error
            return res.json({
                success: true,
                amenities: [],
                searchRadius: radiusKm,
                totalFound: 0,
                message: 'Nearby places temporarily unavailable'
            });
        }

        const elements = data.elements || [];

        // Process results
        const seenTypes = new Map();

        for (const element of elements) {
            const amenityType = getAmenityType(element);
            if (!amenityType) continue;

            const config = AMENITY_CONFIG[amenityType];
            if (!config) continue;

            const elemLat = element.lat || element.center?.lat;
            const elemLng = element.lon || element.center?.lon;
            if (!elemLat || !elemLng) continue;

            const distance = calculateDistance(latitude, longitude, elemLat, elemLng);
            const name = element.tags?.name || config.type;
            const typeKey = config.type;
            const existing = seenTypes.get(typeKey) || [];

            if (existing.length < 2) {
                existing.push({
                    name,
                    type: config.type,
                    distance: formatDistance(distance),
                    distanceValue: distance,
                    icon: config.icon,
                    color: config.color,
                    iconColor: config.iconColor
                });
                seenTypes.set(typeKey, existing);
            } else if (distance < existing[1].distanceValue) {
                existing[1] = {
                    name,
                    type: config.type,
                    distance: formatDistance(distance),
                    distanceValue: distance,
                    icon: config.icon,
                    color: config.color,
                    iconColor: config.iconColor
                };
                existing.sort((a, b) => a.distanceValue - b.distanceValue);
                seenTypes.set(typeKey, existing);
            }
        }

        const amenities = [];
        for (const typeAmenities of seenTypes.values()) {
            amenities.push(...typeAmenities);
        }
        amenities.sort((a, b) => a.distanceValue - b.distanceValue);

        const result = {
            success: true,
            amenities: amenities.slice(0, 10),
            searchRadius: radiusKm,
            totalFound: amenities.length
        };

        // Cache the result
        cache.set(cacheKey, { data: result, timestamp: Date.now() });

        res.json(result);
    } catch (error) {
        console.error('Nearby API error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
