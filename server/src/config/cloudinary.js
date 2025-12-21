import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary with environment variables
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Upload a file buffer to Cloudinary
 * @param {Buffer} buffer - File buffer
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} Cloudinary upload result
 */
export async function uploadToCloudinary(buffer, options = {}) {
    return new Promise((resolve, reject) => {
        const uploadOptions = {
            resource_type: 'auto',
            ...options
        };

        const uploadStream = cloudinary.uploader.upload_stream(
            uploadOptions,
            (error, result) => {
                if (error) reject(error);
                else resolve(result);
            }
        );

        uploadStream.end(buffer);
    });
}

/**
 * Delete a file from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @param {string} resourceType - Resource type (image, video, raw)
 * @returns {Promise<Object>} Deletion result
 */
export async function deleteFromCloudinary(publicId, resourceType = 'image') {
    return cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
}

/**
 * Get optimized URL for an image
 * @param {string} publicId - Cloudinary public ID
 * @param {Object} transformations - Transformation options
 * @returns {string} Optimized URL
 */
export function getOptimizedUrl(publicId, transformations = {}) {
    return cloudinary.url(publicId, {
        fetch_format: 'auto',
        quality: 'auto',
        ...transformations
    });
}

export default cloudinary;
