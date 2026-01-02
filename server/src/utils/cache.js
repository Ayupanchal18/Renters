/**
 * Simple in-memory cache for search results and property data
 */

class PropertyCache {
    constructor() {
        this.cache = new Map();
        this.maxSize = 1000; // Maximum number of cached items
        this.ttl = 5 * 60 * 1000; // 5 minutes TTL

        // Clean up expired entries every minute
        setInterval(() => {
            this.cleanup();
        }, 60 * 1000);
    }

    /**
     * Generate cache key from search parameters
     */
    generateKey(params) {
        const sortedParams = Object.keys(params)
            .sort()
            .reduce((result, key) => {
                result[key] = params[key];
                return result;
            }, {});

        return JSON.stringify(sortedParams);
    }

    /**
     * Get cached result
     */
    get(key) {
        const item = this.cache.get(key);

        if (!item) {
            return null;
        }

        // Check if expired
        if (Date.now() > item.expiry) {
            this.cache.delete(key);
            return null;
        }

        // Update access time for LRU
        item.lastAccessed = Date.now();
        return item.data;
    }

    /**
     * Set cache item
     */
    set(key, data) {
        // Remove oldest items if cache is full
        if (this.cache.size >= this.maxSize) {
            this.evictOldest();
        }

        this.cache.set(key, {
            data,
            expiry: Date.now() + this.ttl,
            lastAccessed: Date.now()
        });
    }

    /**
     * Clear cache for specific patterns (e.g., when properties are updated)
     */
    invalidate(pattern) {
        const keysToDelete = [];

        for (const key of this.cache.keys()) {
            if (key.includes(pattern)) {
                keysToDelete.push(key);
            }
        }

        keysToDelete.forEach(key => this.cache.delete(key));
    }

    /**
     * Clean up expired entries
     */
    cleanup() {
        const now = Date.now();
        const keysToDelete = [];

        for (const [key, item] of this.cache.entries()) {
            if (now > item.expiry) {
                keysToDelete.push(key);
            }
        }

        keysToDelete.forEach(key => this.cache.delete(key));
    }

    /**
     * Evict oldest accessed items when cache is full
     */
    evictOldest() {
        let oldestKey = null;
        let oldestTime = Date.now();

        for (const [key, item] of this.cache.entries()) {
            if (item.lastAccessed < oldestTime) {
                oldestTime = item.lastAccessed;
                oldestKey = key;
            }
        }

        if (oldestKey) {
            this.cache.delete(oldestKey);
        }
    }

    /**
     * Get cache statistics
     */
    getStats() {
        return {
            size: this.cache.size,
            maxSize: this.maxSize,
            ttl: this.ttl
        };
    }

    /**
     * Clear all cache
     */
    clear() {
        this.cache.clear();
    }
}

// Create singleton instance
const propertyCache = new PropertyCache();

export default propertyCache;