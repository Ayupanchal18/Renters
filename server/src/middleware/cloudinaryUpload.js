import multer from 'multer';
import { uploadToCloudinary } from '../config/cloudinary.js';

// Use memory storage instead of disk storage for Cloudinary
const storage = multer.memoryStorage();

// File filter for images
const imageFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'), false);
    }
};

// File filter for messages (images + documents)
const messageFileFilter = (req, file, cb) => {
    const allowedTypes = [
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf', 'text/plain',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('File type not supported'), false);
    }
};

// Multer instance for property photos
export const propertyUpload = multer({
    storage,
    fileFilter: imageFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
        files: 10 // Max 10 files
    }
});

// Multer instance for message attachments
export const messageUpload = multer({
    storage,
    fileFilter: messageFileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
        files: 1 // Only one file per message
    }
});

/**
 * Upload property photos to Cloudinary
 * @param {Array} files - Array of multer file objects
 * @returns {Promise<Array>} Array of Cloudinary URLs
 */
export async function uploadPropertyPhotos(files) {
    if (!files || files.length === 0) return [];

    const uploadPromises = files.map(file =>
        uploadToCloudinary(file.buffer, {
            folder: 'properties',
            transformation: [
                { width: 1200, height: 800, crop: 'limit' },
                { quality: 'auto:good' },
                { fetch_format: 'auto' }
            ]
        })
    );

    const results = await Promise.all(uploadPromises);
    return results.map(result => result.secure_url);
}

/**
 * Upload message attachment to Cloudinary
 * @param {Object} file - Multer file object
 * @returns {Promise<Object>} Upload result with URL and metadata
 */
export async function uploadMessageFile(file) {
    if (!file) return null;

    const isImage = file.mimetype.startsWith('image/');

    const options = {
        folder: 'messages',
        resource_type: isImage ? 'image' : 'raw'
    };

    // Add image optimizations for images
    if (isImage) {
        options.transformation = [
            { width: 1200, height: 1200, crop: 'limit' },
            { quality: 'auto:good' }
        ];
    }

    const result = await uploadToCloudinary(file.buffer, options);

    return {
        originalName: file.originalname,
        filename: result.public_id,
        mimetype: file.mimetype,
        size: file.size,
        url: result.secure_url,
        publicId: result.public_id
    };
}
