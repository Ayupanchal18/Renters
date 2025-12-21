import { preloadCriticalImages, normalizeImageUrl } from './imageUtils';

/**
 * Image preloader for critical property images
 * Validates: Requirements 6.2
 */

class ImagePreloader {
    constructor() {
        this.preloadedImages = new Set();
        this.preloadQueue = [];
        this.isProcessing = false;
    }

    /**
     * Preloads critical images for the first few properties
     * @param {Array} properties - Array of property objects
     * @param {number} count - Number of properties to preload images for
     */
    async preloadPropertyImages(properties, count = 3) {
        if (!Array.isArray(properties) || properties.length === 0) {
            return;
        }

        const criticalProperties = properties.slice(0, count);
        const imageUrls = [];

        criticalProperties.forEach(property => {
            if (property && property.photos && property.photos.length > 0) {
                // Preload the first image of each critical property
                const primaryImage = property.photos[0];
                if (primaryImage && !this.preloadedImages.has(primaryImage)) {
                    imageUrls.push(primaryImage);
                    this.preloadedImages.add(primaryImage);
                }
            }
        });

        if (imageUrls.length > 0) {
            try {
                await preloadCriticalImages(imageUrls, { priority: 'high' });
                console.log(`Preloaded ${imageUrls.length} critical property images`);
            } catch (error) {
                console.warn('Failed to preload some critical images:', error);
            }
        }
    }

    /**
     * Preloads images in the background with lower priority
     * @param {Array} imageUrls - Array of image URLs to preload
     */
    preloadInBackground(imageUrls) {
        if (!Array.isArray(imageUrls)) return;

        const newUrls = imageUrls.filter(url => !this.preloadedImages.has(url));

        if (newUrls.length === 0) return;

        // Add to queue
        this.preloadQueue.push(...newUrls);

        // Mark as added to prevent duplicates
        newUrls.forEach(url => this.preloadedImages.add(url));

        // Process queue if not already processing
        if (!this.isProcessing) {
            this.processPreloadQueue();
        }
    }

    /**
     * Processes the preload queue with throttling
     */
    async processPreloadQueue() {
        if (this.isProcessing || this.preloadQueue.length === 0) return;

        this.isProcessing = true;

        try {
            // Process in batches to avoid overwhelming the browser
            const batchSize = 3;

            while (this.preloadQueue.length > 0) {
                const batch = this.preloadQueue.splice(0, batchSize);

                // Use requestIdleCallback if available for better performance
                if (window.requestIdleCallback) {
                    await new Promise(resolve => {
                        window.requestIdleCallback(() => {
                            this.preloadBatch(batch);
                            resolve();
                        });
                    });
                } else {
                    await this.preloadBatch(batch);
                }

                // Small delay between batches
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Preloads a batch of images
     * @param {Array} imageUrls - Batch of image URLs
     */
    async preloadBatch(imageUrls) {
        const promises = imageUrls.map(url => {
            return new Promise(resolve => {
                const img = new Image();
                img.onload = () => resolve({ url, success: true });
                img.onerror = () => resolve({ url, success: false });
                img.src = normalizeImageUrl(url);
            });
        });

        try {
            await Promise.all(promises);
        } catch (error) {
            console.warn('Error preloading image batch:', error);
        }
    }

    /**
     * Preloads images for properties that are about to come into view
     * @param {Array} properties - Properties to preload
     * @param {number} startIndex - Starting index
     * @param {number} count - Number of properties to preload
     */
    preloadUpcomingProperties(properties, startIndex, count = 5) {
        if (!Array.isArray(properties)) return;

        const upcomingProperties = properties.slice(startIndex, startIndex + count);
        const imageUrls = [];

        upcomingProperties.forEach(property => {
            if (property.photos && property.photos.length > 0) {
                imageUrls.push(property.photos[0]);
            }
        });

        this.preloadInBackground(imageUrls);
    }

    /**
     * Clears the preload cache
     */
    clearCache() {
        this.preloadedImages.clear();
        this.preloadQueue = [];
    }

    /**
     * Gets cache statistics
     */
    getCacheStats() {
        return {
            preloadedCount: this.preloadedImages.size,
            queueLength: this.preloadQueue.length,
            isProcessing: this.isProcessing
        };
    }
}

// Create singleton instance
export const imagePreloader = new ImagePreloader();

export default imagePreloader;