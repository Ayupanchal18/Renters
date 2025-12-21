/**
 * Image utilities for handling missing images and optimization
 * Validates: Requirements 5.2, 5.3
 */

// Default placeholder images for different property types
export const PLACEHOLDER_IMAGES = {
    room: '/property_image/placeholder.jpg',
    flat: '/property_image/placeholder.jpg',
    house: '/property_image/placeholder.jpg',
    pg: '/property_image/placeholder.jpg',
    hostel: '/property_image/placeholder.jpg',
    commercial: '/property_image/placeholder.jpg',
    default: '/property_image/placeholder.jpg'
};

// Owner placeholder images
export const OWNER_PLACEHOLDER = '/property_image/placeholder-user.jpg';

/**
 * Gets the appropriate placeholder image for a property type
 * @param {string} propertyType - Type of property
 * @returns {string} - Placeholder image URL
 */
export function getPlaceholderImage(propertyType) {
    return PLACEHOLDER_IMAGES[propertyType] || PLACEHOLDER_IMAGES.default;
}

/**
 * Validates and normalizes image URLs
 * @param {Array|string} images - Image URL(s) to validate
 * @param {string} propertyType - Property type for fallback
 * @returns {Array} - Array of valid image URLs with fallbacks
 */
export function normalizeImages(images, propertyType = 'default') {
    if (!images) {
        return [getPlaceholderImage(propertyType)];
    }

    // Convert single image to array
    const imageArray = Array.isArray(images) ? images : [images];

    // Filter out invalid images and normalize URLs
    const validImages = imageArray
        .filter(img => img && typeof img === 'string' && img.trim() !== '')
        .map(img => normalizeImageUrl(img.trim()));

    // If no valid images, return placeholder
    if (validImages.length === 0) {
        return [getPlaceholderImage(propertyType)];
    }

    return validImages;
}

/**
 * Normalizes image URL to ensure proper format
 * @param {string} imageUrl - Raw image URL
 * @returns {string} - Normalized image URL
 */
export function normalizeImageUrl(imageUrl) {
    if (!imageUrl || typeof imageUrl !== 'string') {
        return PLACEHOLDER_IMAGES.default;
    }

    const url = imageUrl.trim();

    // If it's already a full URL, return as is
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }

    // If it starts with /, it's a relative path from server root
    if (url.startsWith('/')) {
        return `http://localhost:8080${url}`;
    }

    // Otherwise, assume it's a path that needs server prefix
    return `http://localhost:8080/${url}`;
}

/**
 * Creates an image object with error handling
 * @param {string} src - Image source URL
 * @param {string} alt - Alt text
 * @param {string} fallback - Fallback image URL
 * @returns {Object} - Image configuration object
 */
export function createImageConfig(src, alt = '', fallback = null) {
    return {
        src: normalizeImageUrl(src),
        alt: alt || 'Property image',
        fallback: fallback || PLACEHOLDER_IMAGES.default,
        onError: (e) => {
            if (e.target.src !== (fallback || PLACEHOLDER_IMAGES.default)) {
                e.target.src = fallback || PLACEHOLDER_IMAGES.default;
            }
        }
    };
}

/**
 * Handles image loading errors by setting fallback
 * @param {Event} event - Image error event
 * @param {string} fallback - Fallback image URL
 */
export function handleImageError(event, fallback = null) {
    const img = event.target;
    const fallbackUrl = fallback || PLACEHOLDER_IMAGES.default;

    // Prevent infinite loop if fallback also fails
    if (img.src !== fallbackUrl) {
        img.src = fallbackUrl;
    }
}

/**
 * Preloads images to improve performance
 * @param {Array} imageUrls - Array of image URLs to preload
 * @returns {Promise} - Promise that resolves when all images are loaded
 */
export function preloadImages(imageUrls) {
    if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
        return Promise.resolve([]);
    }

    const promises = imageUrls.map(url => {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve({ url, loaded: true });
            img.onerror = () => resolve({ url, loaded: false });
            img.src = normalizeImageUrl(url);
        });
    });

    return Promise.all(promises);
}

/**
 * Gets optimized image URL based on container size
 * @param {string} originalUrl - Original image URL
 * @param {number} width - Target width
 * @param {number} height - Target height
 * @returns {string} - Optimized image URL
 */
export function getOptimizedImageUrl(originalUrl, width = null, height = null) {
    // For now, return original URL
    // In production, this could integrate with image optimization services
    return normalizeImageUrl(originalUrl);
}

/**
 * Validates if an image URL is accessible
 * @param {string} imageUrl - Image URL to validate
 * @returns {Promise<boolean>} - Promise that resolves to true if image is accessible
 */
export function validateImageUrl(imageUrl) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = normalizeImageUrl(imageUrl);
    });
}

/**
 * Creates a responsive image configuration
 * @param {string} src - Image source
 * @param {Object} options - Configuration options
 * @returns {Object} - Responsive image configuration
 */
export function createResponsiveImage(src, options = {}) {
    const {
        alt = 'Property image',
        fallback = null,
        lazy = true,
        className = '',
        sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
    } = options;

    return {
        src: normalizeImageUrl(src),
        alt,
        className,
        loading: lazy ? 'lazy' : 'eager',
        sizes,
        onError: (e) => handleImageError(e, fallback),
        style: { objectFit: 'cover' }
    };
}

/**
 * Compresses image quality for different use cases
 * @param {string} imageUrl - Original image URL
 * @param {string} quality - Quality level: 'low', 'medium', 'high'
 * @returns {string} - Optimized image URL
 */
export function getCompressedImageUrl(imageUrl, quality = 'medium') {
    // In production, this would integrate with image optimization services
    // For now, return the original URL
    const qualityMap = {
        low: 60,
        medium: 80,
        high: 95
    };

    // This could be extended to work with services like Cloudinary, ImageKit, etc.
    return normalizeImageUrl(imageUrl);
}

/**
 * Generates responsive image srcSet for different screen densities
 * @param {string} baseUrl - Base image URL
 * @param {Array} densities - Array of pixel densities (e.g., [1, 2, 3])
 * @returns {string} - srcSet string
 */
export function generateSrcSet(baseUrl, densities = [1, 2]) {
    const normalizedUrl = normalizeImageUrl(baseUrl);

    // In production, this would generate actual optimized versions
    return densities
        .map(density => `${normalizedUrl} ${density}x`)
        .join(', ');
}

/**
 * Creates optimized image dimensions based on container size
 * @param {number} containerWidth - Container width in pixels
 * @param {number} containerHeight - Container height in pixels
 * @param {number} devicePixelRatio - Device pixel ratio
 * @returns {Object} - Optimized dimensions
 */
export function getOptimizedDimensions(containerWidth, containerHeight, devicePixelRatio = 1) {
    const pixelRatio = Math.min(devicePixelRatio, 3); // Cap at 3x for performance

    return {
        width: Math.ceil(containerWidth * pixelRatio),
        height: Math.ceil(containerHeight * pixelRatio),
        displayWidth: containerWidth,
        displayHeight: containerHeight
    };
}

/**
 * Intersection Observer utility for lazy loading
 * @param {Function} callback - Callback function when element intersects
 * @param {Object} options - Intersection observer options
 * @returns {IntersectionObserver} - Observer instance
 */
export function createLazyLoadObserver(callback, options = {}) {
    const defaultOptions = {
        rootMargin: '50px',
        threshold: 0.1,
        ...options
    };

    return new IntersectionObserver(callback, defaultOptions);
}

/**
 * Preloads critical images for better performance
 * Uses Image() objects instead of <link rel="preload"> to avoid browser warnings
 * about preloaded resources not being used within a few seconds
 * @param {Array} imageUrls - Array of critical image URLs
 * @param {Object} options - Preload options
 * @returns {Promise} - Promise that resolves when images are preloaded
 */
export function preloadCriticalImages(imageUrls, options = {}) {
    const { crossOrigin = 'anonymous' } = options;

    if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
        return Promise.resolve([]);
    }

    const promises = imageUrls.map(url => {
        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = crossOrigin;
            img.onload = () => resolve({ url, loaded: true });
            img.onerror = () => resolve({ url, loaded: false });
            img.src = normalizeImageUrl(url);
        });
    });

    return Promise.all(promises);
}

/**
 * Calculates optimal image size based on viewport and container
 * @param {HTMLElement} container - Container element
 * @param {Object} viewport - Viewport dimensions
 * @returns {Object} - Optimal image dimensions
 */
export function calculateOptimalImageSize(container, viewport = {}) {
    if (!container) return { width: 400, height: 300 };

    const rect = container.getBoundingClientRect();
    const vw = viewport.width || window.innerWidth;
    const vh = viewport.height || window.innerHeight;

    // Calculate responsive dimensions
    let width = rect.width;
    let height = rect.height;

    // Adjust for mobile viewports
    if (vw < 768) {
        width = Math.min(width, vw * 0.9);
    }

    return {
        width: Math.ceil(width),
        height: Math.ceil(height),
        aspectRatio: width / height
    };
}