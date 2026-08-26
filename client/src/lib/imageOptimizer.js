/**
 * Cloudinary & Image Performance Optimizer Utility
 * Automatically injects f_auto (WebP/AVIF) and q_auto:good to shrink images by ~60%
 */

const FALLBACK_PLACEHOLDER = "/property_image/placeholder.jpg";

/**
 * Returns an optimized image URL with Cloudinary transformations
 * @param {string} url - Original image URL
 * @param {Object} options - Transformation options
 * @param {number} [options.width] - Target width in pixels
 * @param {number} [options.height] - Target height in pixels
 * @param {string} [options.crop='limit'] - Crop mode ('limit', 'fill', 'scale')
 * @param {string} [options.quality='auto:good'] - Quality preset
 * @returns {string} Optimized URL
 */
export function getOptimizedImageUrl(url, options = {}) {
    if (!url || typeof url !== 'string') {
        return FALLBACK_PLACEHOLDER;
    }

    // Only transform Cloudinary URLs
    if (!url.includes('cloudinary.com') || !url.includes('/upload/')) {
        return url;
    }

    const {
        width,
        height,
        crop = 'limit',
        quality = 'auto:good',
    } = options;

    const transforms = ['f_auto', `q_${quality}`];

    if (width) {
        transforms.push(`w_${width}`);
        if (crop) transforms.push(`c_${crop}`);
    }

    if (height) {
        transforms.push(`h_${height}`);
    }

    const transformString = transforms.join(',');

    // Insert transformations right after '/upload/'
    // Avoid double-inserting if transformations already exist
    const parts = url.split('/upload/');
    if (parts.length !== 2) return url;

    // Check if URL already has transformation segment
    const afterUpload = parts[1];
    if (afterUpload.startsWith('f_auto') || afterUpload.startsWith('w_') || afterUpload.startsWith('q_')) {
        return url;
    }

    return `${parts[0]}/upload/${transformString}/${afterUpload}`;
}

/**
 * Generates responsive srcset string for <img> tags
 * @param {string} url - Cloudinary image URL
 * @param {number[]} widths - Array of widths e.g. [360, 640, 960, 1280]
 * @returns {string} srcSet string
 */
export function generateSrcSet(url, widths = [360, 640, 960, 1280]) {
    if (!url || !url.includes('cloudinary.com') || !url.includes('/upload/')) {
        return undefined;
    }

    return widths
        .map(w => `${getOptimizedImageUrl(url, { width: w })} ${w}w`)
        .join(', ');
}
