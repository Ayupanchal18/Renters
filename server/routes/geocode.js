import { Router } from 'express';

const router = Router();

// Fetch with timeout helper
async function fetchWithTimeout(url, options = {}, timeoutMs = 8000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        return response;
    } finally {
        clearTimeout(timeoutId);
    }
}

// Try Nominatim geocoding
async function tryNominatim(searchQuery) {
    const url = `https://nominatim.openstreetmap.org/search?q=${searchQuery}&format=json&limit=1`;
    const response = await fetchWithTimeout(url, {
        headers: {
            'User-Agent': 'RentersApp/1.0 (contact@renters.app)',
            'Accept': 'application/json'
        }
    }, 8000);

    if (!response.ok) throw new Error(`Nominatim error: ${response.status}`);
    const data = await response.json();
    if (!data || data.length === 0) return null;

    return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        displayName: data[0].display_name
    };
}

// Fallback: Use Photon (Komoot's geocoder, based on OSM data)
async function tryPhoton(searchQuery) {
    const url = `https://photon.komoot.io/api/?q=${searchQuery}&limit=1`;
    const response = await fetchWithTimeout(url, {
        headers: { 'Accept': 'application/json' }
    }, 8000);

    if (!response.ok) throw new Error(`Photon error: ${response.status}`);
    const data = await response.json();
    if (!data.features || data.features.length === 0) return null;

    const coords = data.features[0].geometry.coordinates;
    return {
        lat: coords[1],
        lng: coords[0],
        displayName: data.features[0].properties.name || 'Unknown'
    };
}

/**
 * Geocode an address using multiple providers with fallback
 * GET /api/geocode?address=...&city=...
 */
router.get('/', async (req, res) => {
    try {
        const { address, city } = req.query;

        if (!address && !city) {
            return res.status(400).json({ success: false, error: 'Address or city required' });
        }

        const searchQuery = encodeURIComponent(
            address ? `${address}, ${city || ''}, India` : `${city}, India`
        );

        let result = null;

        // Try Nominatim first
        try {
            result = await tryNominatim(searchQuery);
        } catch (err) {
            console.warn('Nominatim failed:', err.message);
        }

        // Fallback to Photon if Nominatim fails
        if (!result) {
            try {
                result = await tryPhoton(searchQuery);
            } catch (err) {
                console.warn('Photon fallback failed:', err.message);
            }
        }

        if (!result) {
            return res.json({ success: false, coordinates: null, error: 'Address not found' });
        }

        res.json({
            success: true,
            coordinates: { lat: result.lat, lng: result.lng },
            displayName: result.displayName
        });
    } catch (error) {
        console.error('Geocoding error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
