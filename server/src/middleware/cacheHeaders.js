/**
 * API Response Caching Headers Middleware
 * Adds Cache-Control headers for GET endpoints with appropriate TTLs
 * 
 * Requirements: 4.4 - API response caching with appropriate TTLs
 */

import logger from '../services/loggerService.js';

/**
 * Cache TTL configurations by endpoint type (in seconds)
 */
const CACHE_TTLS = {
    // Static/rarely changing data - cache for 1 hour
    static: 3600,

    // Public listings data - cache for 5 minutes
    listings: 300,

    // Search results - cache for 2 minutes
    search: 120,

    // User-specific data - no cache (private)
    private: 0,

    // Categories, locations, testimonials - cache for 30 minutes
    reference: 1800,

    // Configuration/settings - cache for 10 minutes
    config: 600,

    // Real-time data (notifications, messages) - no cache
    realtime: 0,

    // Default TTL for unspecified endpoints - 1 minute
    default: 60
};

/**
 * Endpoint patterns and their cache configurations
 * Order matters - first match wins
 */
const ENDPOINT_CACHE_CONFIG = [
    // No cache for authenticated/private endpoints
    { pattern: /^\/api\/auth/, type: 'private', cache: false },
    { pattern: /^\/api\/users/, type: 'private', cache: false },
    { pattern: /^\/api\/wishlist/, type: 'private', cache: false },
    { pattern: /^\/api\/notifications/, type: 'realtime', cache: false },
    { pattern: /^\/api\/messages/, type: 'realtime', cache: false },
    { pattern: /^\/api\/conversations/, type: 'realtime', cache: false },
    { pattern: /^\/api\/alerts/, type: 'realtime', cache: false },
    { pattern: /^\/api\/admin/, type: 'private', cache: false },
    { pattern: /^\/api\/privacy/, type: 'private', cache: false },
    { pattern: /^\/api\/delivery-preferences/, type: 'private', cache: false },
    { pattern: /^\/api\/user-diagnostics/, type: 'private', cache: false },

    // Reference data - longer cache
    { pattern: /^\/api\/categories/, type: 'reference', cache: true },
    { pattern: /^\/api\/locations/, type: 'reference', cache: true },
    { pattern: /^\/api\/testimonials/, type: 'reference', cache: true },

    // Configuration endpoints
    { pattern: /^\/api\/config/, type: 'config', cache: true },

    // Search endpoints - shorter cache
    { pattern: /^\/api\/search/, type: 'search', cache: true },
    { pattern: /^\/api\/properties\/.*\/search/, type: 'search', cache: true },

    // Property listings - moderate cache
    { pattern: /^\/api\/properties\/rent\/[^/]+$/, type: 'listings', cache: true }, // Single property
    { pattern: /^\/api\/properties\/buy\/[^/]+$/, type: 'listings', cache: true },  // Single property
    { pattern: /^\/api\/properties\/rent/, type: 'listings', cache: true },
    { pattern: /^\/api\/properties\/buy/, type: 'listings', cache: true },
    { pattern: /^\/api\/properties/, type: 'listings', cache: true },

    // Nearby/geocode - moderate cache
    { pattern: /^\/api\/nearby/, type: 'listings', cache: true },
    { pattern: /^\/api\/geocode/, type: 'reference', cache: true },

    // Price trends - moderate cache
    { pattern: /^\/api\/price-trends/, type: 'listings', cache: true },

    // Health/ping endpoints - no cache
    { pattern: /^\/api\/ping/, type: 'realtime', cache: false },
    { pattern: /^\/health/, type: 'realtime', cache: false }
];

/**
 * Get cache configuration for a given path
 * @param {string} path - Request path
 * @returns {Object} - Cache configuration { type, cache, ttl }
 */
function getCacheConfig(path) {
    for (const config of ENDPOINT_CACHE_CONFIG) {
        if (config.pattern.test(path)) {
            return {
                type: config.type,
                cache: config.cache,
                ttl: config.cache ? CACHE_TTLS[config.type] : 0
            };
        }
    }

    // Default configuration
    return {
        type: 'default',
        cache: true,
        ttl: CACHE_TTLS.default
    };
}

/**
 * Generate Cache-Control header value
 * @param {Object} cacheConfig - Cache configuration
 * @param {boolean} isAuthenticated - Whether request is authenticated
 * @returns {string} - Cache-Control header value
 */
function generateCacheControlHeader(cacheConfig, isAuthenticated) {
    // Never cache private/authenticated data
    if (!cacheConfig.cache || isAuthenticated) {
        return 'no-store, no-cache, must-revalidate, private';
    }

    const ttl = cacheConfig.ttl;

    if (ttl === 0) {
        return 'no-store, no-cache, must-revalidate, private';
    }

    // Public cacheable response
    // max-age: browser cache TTL
    // s-maxage: CDN/proxy cache TTL (can be longer)
    // stale-while-revalidate: serve stale content while revalidating
    const sMaxAge = Math.min(ttl * 2, 7200); // CDN can cache up to 2x or 2 hours max
    const staleWhileRevalidate = Math.min(ttl, 300); // Up to 5 minutes stale

    return `public, max-age=${ttl}, s-maxage=${sMaxAge}, stale-while-revalidate=${staleWhileRevalidate}`;
}

/**
 * Create cache headers middleware
 * @param {Object} options - Configuration options
 * @param {boolean} options.enabled - Whether caching is enabled (default: true)
 * @param {Object} options.customTTLs - Custom TTL overrides
 * @param {string[]} options.excludePaths - Paths to exclude from caching
 * @returns {Function} Express middleware function
 */
export function createCacheHeadersMiddleware(options = {}) {
    const {
        enabled = process.env.ENABLE_CACHE_HEADERS !== 'false',
        customTTLs = {},
        excludePaths = []
    } = options;

    // Merge custom TTLs
    const ttls = { ...CACHE_TTLS, ...customTTLs };

    return (req, res, next) => {
        // Only apply to GET requests
        if (req.method !== 'GET') {
            return next();
        }

        // Skip if caching is disabled
        if (!enabled) {
            return next();
        }

        // Skip excluded paths
        if (excludePaths.some(path => req.path.startsWith(path))) {
            return next();
        }

        // Get cache configuration for this endpoint
        const cacheConfig = getCacheConfig(req.path);

        // Override TTL if custom TTLs provided
        if (customTTLs[cacheConfig.type]) {
            cacheConfig.ttl = customTTLs[cacheConfig.type];
        }

        // Check if request is authenticated
        const isAuthenticated = !!(req.user || req.headers.authorization);

        // Generate and set Cache-Control header
        const cacheControl = generateCacheControlHeader(cacheConfig, isAuthenticated);
        res.set('Cache-Control', cacheControl);

        // Add Vary header for proper cache key differentiation
        res.set('Vary', 'Accept, Accept-Encoding, Authorization');

        // Add ETag support hint (actual ETag generation is handled by Express)
        if (cacheConfig.cache && !isAuthenticated) {
            // Enable weak ETags for cacheable responses
            res.set('X-Cache-Type', cacheConfig.type);
        }

        // Log cache configuration in debug mode
        if (process.env.LOG_CACHE_HEADERS === 'true') {
            logger.debug('Cache headers applied', {
                path: req.path,
                cacheType: cacheConfig.type,
                ttl: cacheConfig.ttl,
                cacheControl,
                isAuthenticated
            });
        }

        next();
    };
}

/**
 * Middleware to set no-cache headers for specific responses
 * Use this for endpoints that should never be cached
 */
export function noCache(req, res, next) {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
}

/**
 * Middleware to set custom cache TTL for a specific route
 * @param {number} ttl - TTL in seconds
 * @param {boolean} isPublic - Whether the response is public (default: true)
 * @returns {Function} Express middleware function
 */
export function cacheFor(ttl, isPublic = true) {
    return (req, res, next) => {
        if (req.method !== 'GET') {
            return next();
        }

        const visibility = isPublic ? 'public' : 'private';
        res.set('Cache-Control', `${visibility}, max-age=${ttl}`);
        res.set('Vary', 'Accept, Accept-Encoding');
        next();
    };
}

/**
 * Get current cache configuration (for debugging/monitoring)
 * @returns {Object} - Current cache configuration
 */
export function getCacheConfiguration() {
    return {
        ttls: { ...CACHE_TTLS },
        endpoints: ENDPOINT_CACHE_CONFIG.map(config => ({
            pattern: config.pattern.toString(),
            type: config.type,
            cache: config.cache
        }))
    };
}

// Default middleware instance
export const cacheHeaders = createCacheHeadersMiddleware();

export default cacheHeaders;
