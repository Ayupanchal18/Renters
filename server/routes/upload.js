import { Router } from "express";
import { z } from "zod";
import multer from "multer";
import { uploadToCloudinary, deleteFromCloudinary } from "../src/config/cloudinary.js";
import { authenticateToken } from "../src/middleware/security.js";

const router = Router();

// Use memory storage for Cloudinary uploads
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
            'application/pdf'
        ];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('File type not supported'), false);
        }
    }
});

/**
 * POST /api/upload/profile-photo
 * Upload a profile photo to Cloudinary (requires authentication)
 */
router.post("/profile-photo", authenticateToken, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: "No file provided"
            });
        }

        const result = await uploadToCloudinary(req.file.buffer, {
            folder: 'profile-photos',
            resource_type: 'image',
            transformation: [
                { width: 400, height: 400, crop: 'fill', gravity: 'face' },
                { quality: 'auto:good' },
                { fetch_format: 'auto' }
            ]
        });

        res.json({
            success: true,
            data: {
                url: result.secure_url,
                publicId: result.public_id
            },
            url: result.secure_url,
            publicId: result.public_id,
            format: result.format,
            width: result.width,
            height: result.height,
            size: result.bytes,
            uploadedAt: new Date()
        });
    } catch (error) {
        console.error('Profile photo upload error:', error);

        if (error.message === 'File type not supported') {
            return res.status(400).json({
                success: false,
                error: "File type not supported. Please use JPEG, PNG, GIF, or WebP."
            });
        }
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                error: "File size exceeds 10MB limit"
            });
        }

        res.status(500).json({
            success: false,
            error: "Upload failed",
            message: error.message
        });
    }
});

/**
 * POST /api/upload
 * Upload a single file to Cloudinary
 */
router.post("/", upload.single('file'), async (req, res) => {
    try {
        const userId = req.headers["x-user-id"];
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        if (!req.file) {
            return res.status(400).json({ error: "No file provided" });
        }

        const folder = req.body.folder || 'uploads';
        const isImage = req.file.mimetype.startsWith('image/');

        const result = await uploadToCloudinary(req.file.buffer, {
            folder,
            resource_type: isImage ? 'image' : 'raw',
            ...(isImage && {
                transformation: [
                    { width: 1200, height: 1200, crop: 'limit' },
                    { quality: 'auto:good' },
                    { fetch_format: 'auto' }
                ]
            })
        });

        res.json({
            url: result.secure_url,
            publicId: result.public_id,
            format: result.format,
            width: result.width,
            height: result.height,
            size: result.bytes,
            uploadedAt: new Date()
        });
    } catch (error) {
        console.error('Upload error:', error);

        if (error.message === 'File type not supported') {
            return res.status(400).json({ error: "File type not supported" });
        }
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: "File size exceeds 10MB limit" });
        }

        res.status(500).json({ error: "Upload failed", message: error.message });
    }
});

/**
 * DELETE /api/upload
 * Delete a file from Cloudinary
 */
router.delete("/", async (req, res) => {
    try {
        const userId = req.headers["x-user-id"];
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const { publicId, resourceType = 'image' } = req.body;
        if (!publicId) {
            return res.status(400).json({ error: "Missing publicId" });
        }

        const result = await deleteFromCloudinary(publicId, resourceType);
        res.json({ success: true, result });
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ error: "Delete failed", message: error.message });
    }
});

export default router;
