import { Router } from "express";
import { z } from "zod";
import multer from "multer";
import mongoose from "mongoose";
import { MediaAsset } from "../models/MediaAsset.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../src/config/cloudinary.js";
import { requireAdmin } from "../src/middleware/adminAuth.js";
import { connectDB } from "../src/config/db.js";
import { safeCreateAuditLog } from "../src/services/adminAuditService.js";

const router = Router();

// Memory storage for multer to stream files directly to Cloudinary
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
            'application/pdf', 'text/csv'
        ];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('File type not supported by Media Library'), false);
        }
    }
});

const mediaListSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    module: z.enum(['property', 'banner', 'content', 'testimonial', 'misc']).optional(),
    search: z.string().optional(),
    sort: z.enum(['newest', 'oldest', 'largest', 'smallest']).default('newest'),
    isOrphaned: z.coerce.boolean().optional()
});

/**
 * GET /api/admin/media
 * List all media assets with filters & pagination
 */
router.get("/", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        const parseResult = mediaListSchema.safeParse(req.query);
        if (!parseResult.success) {
            return res.status(400).json({ success: false, error: 'VALIDATION_ERROR', details: parseResult.error.errors });
        }

        const { page, limit, module, search, sort, isOrphaned } = parseResult.data;
        const query = {};

        if (module) {
            query.module = module;
        }

        if (isOrphaned !== undefined) {
            query.isOrphaned = isOrphaned;
        }

        if (search) {
            query.$or = [
                { filename: { $regex: search, $options: 'i' } },
                { originalName: { $regex: search, $options: 'i' } },
                { mimeType: { $regex: search, $options: 'i' } }
            ];
        }

        let sortOption = { createdAt: -1 };
        if (sort === 'oldest') sortOption = { createdAt: 1 };
        if (sort === 'largest') sortOption = { sizeBytes: -1 };
        if (sort === 'smallest') sortOption = { sizeBytes: 1 };

        const skip = (page - 1) * limit;

        const [assets, total] = await Promise.all([
            MediaAsset.find(query)
                .populate('uploadedBy', 'name email role')
                .sort(sortOption)
                .skip(skip)
                .limit(limit)
                .lean(),
            MediaAsset.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: {
                assets,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        console.error('Error fetching media library:', error);
        res.status(500).json({ success: false, error: 'INTERNAL_ERROR', message: 'Failed to retrieve media library' });
    }
});

/**
 * GET /api/admin/media/storage/stats
 * Retrieve storage stats size breakdown
 */
router.get("/storage/stats", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        const stats = await MediaAsset.aggregate([
            {
                $group: {
                    _id: "$module",
                    totalSizeBytes: { $sum: "$sizeBytes" },
                    count: { $sum: 1 }
                }
            }
        ]);

        const totalUsed = stats.reduce((acc, curr) => acc + curr.totalSizeBytes, 0);
        // Let's assume a dummy soft limit of 10GB for display purposes
        const maxLimit = 10 * 1024 * 1024 * 1024; // 10 GB

        res.json({
            success: true,
            data: {
                totalUsedBytes: totalUsed,
                maxLimitBytes: maxLimit,
                percentUsed: ((totalUsed / maxLimit) * 100).toFixed(2),
                modules: stats.map(s => ({
                    module: s._id || 'misc',
                    sizeBytes: s.totalSizeBytes,
                    count: s.count
                }))
            }
        });
    } catch (error) {
        console.error('Error fetching storage stats:', error);
        res.status(500).json({ success: false, error: 'INTERNAL_ERROR', message: 'Failed to retrieve storage stats' });
    }
});

/**
 * POST /api/admin/media/upload
 * Upload media assets (supports up to 20 files in parallel)
 */
router.post("/upload", requireAdmin, upload.array("files", 20), async (req, res) => {
    try {
        await connectDB();

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ success: false, error: 'VALIDATION_ERROR', message: 'No files provided' });
        }

        const folder = req.body.module || 'misc';
        const uploadedAssets = [];

        for (const file of req.files) {
            const isImage = file.mimetype.startsWith('image/');
            const result = await uploadToCloudinary(file.buffer, {
                folder: `media-library/${folder}`,
                resource_type: isImage ? 'image' : 'raw'
            });

            // Extract publicId as filename or keep original
            const filename = result.public_id.split('/').pop() || file.originalname;

            const newAsset = new MediaAsset({
                filename,
                originalName: file.originalname,
                mimeType: file.mimetype,
                sizeBytes: file.size,
                dimensions: isImage ? { width: result.width, height: result.height } : undefined,
                cdnUrl: result.secure_url,
                thumbnailUrl: isImage ? result.secure_url.replace('/upload/', '/upload/c_fill,w_150,h_150/') : undefined,
                module: folder,
                uploadedBy: req.user._id,
                isOrphaned: true // Default to true until linked to a resource
            });

            await newAsset.save();
            uploadedAssets.push(newAsset);
        }

        await safeCreateAuditLog({
            adminId: req.user._id,
            action: 'CREATE',
            resourceType: 'media',
            changes: { uploadedCount: req.files.length },
            req
        });

        res.status(201).json({
            success: true,
            data: uploadedAssets,
            message: `${req.files.length} asset(s) uploaded successfully`
        });
    } catch (error) {
        console.error('Error uploading media library files:', error);
        res.status(500).json({ success: false, error: 'INTERNAL_ERROR', message: 'Upload failed: ' + error.message });
    }
});

/**
 * DELETE /api/admin/media/:id
 * Delete media asset
 */
router.delete("/:id", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        const asset = await MediaAsset.findById(req.params.id);
        if (!asset) {
            return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Asset not found' });
        }

        // Prevent deletion if the asset is actively linked to another document
        if (asset.usedIn && asset.usedIn.length > 0 && req.query.force !== 'true') {
            return res.status(400).json({
                success: false,
                error: 'RESOURCE_LINKED',
                message: `Cannot delete asset; it is linked to ${asset.usedIn.length} resource(s). Use ?force=true if you want to bypass this check.`
            });
        }

        // Delete from Cloudinary
        const isImage = asset.mimeType.startsWith('image/');
        // Reconstruct public_id of cloudinary
        const cdnUrlParts = asset.cdnUrl.split('/');
        const uploadIndex = cdnUrlParts.indexOf('upload');
        let publicIdWithFolders = cdnUrlParts.slice(uploadIndex + 2).join('/'); // Skip upload/v12345/
        // Strip extension
        const dotIndex = publicIdWithFolders.lastIndexOf('.');
        if (dotIndex !== -1) {
            publicIdWithFolders = publicIdWithFolders.substring(0, dotIndex);
        }

        await deleteFromCloudinary(publicIdWithFolders, isImage ? 'image' : 'raw');

        // Delete from DB
        await MediaAsset.findByIdAndDelete(req.params.id);

        await safeCreateAuditLog({
            adminId: req.user._id,
            action: 'DELETE',
            resourceType: 'media',
            resourceId: req.params.id,
            changes: { filename: asset.filename },
            req
        });

        res.json({ success: true, message: 'Asset deleted successfully' });
    } catch (error) {
        console.error('Error deleting media asset:', error);
        res.status(500).json({ success: false, error: 'INTERNAL_ERROR', message: 'Deletion failed' });
    }
});

/**
 * DELETE /api/admin/media/bulk/orphaned
 * Bulk delete orphaned assets
 */
router.delete("/bulk/orphaned", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        const orphanedAssets = await MediaAsset.find({ isOrphaned: true });
        if (orphanedAssets.length === 0) {
            return res.json({ success: true, message: 'No orphaned assets to delete', deletedCount: 0 });
        }

        for (const asset of orphanedAssets) {
            const isImage = asset.mimeType.startsWith('image/');
            const cdnUrlParts = asset.cdnUrl.split('/');
            const uploadIndex = cdnUrlParts.indexOf('upload');
            let publicIdWithFolders = cdnUrlParts.slice(uploadIndex + 2).join('/');
            const dotIndex = publicIdWithFolders.lastIndexOf('.');
            if (dotIndex !== -1) {
                publicIdWithFolders = publicIdWithFolders.substring(0, dotIndex);
            }
            try {
                await deleteFromCloudinary(publicIdWithFolders, isImage ? 'image' : 'raw');
            } catch (err) {
                console.warn(`Failed to delete asset ${asset._id} from Cloudinary:`, err.message);
            }
            await MediaAsset.findByIdAndDelete(asset._id);
        }

        await safeCreateAuditLog({
            adminId: req.user._id,
            action: 'BULK_DELETE',
            resourceType: 'media',
            changes: { count: orphanedAssets.length },
            req
        });

        res.json({
            success: true,
            deletedCount: orphanedAssets.length,
            message: `Successfully deleted ${orphanedAssets.length} orphaned asset(s)`
        });
    } catch (error) {
        console.error('Error bulk deleting orphaned assets:', error);
        res.status(500).json({ success: false, error: 'INTERNAL_ERROR', message: 'Bulk deletion failed' });
    }
});

/**
 * PATCH /api/admin/media/:id/replace
 * Upload replacement file, keeping same reference
 */
router.patch("/:id/replace", requireAdmin, upload.single("file"), async (req, res) => {
    try {
        await connectDB();

        if (!req.file) {
            return res.status(400).json({ success: false, error: 'VALIDATION_ERROR', message: 'No replacement file provided' });
        }

        const asset = await MediaAsset.findById(req.params.id);
        if (!asset) {
            return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Asset not found' });
        }

        // Delete old one from Cloudinary
        const isImage = asset.mimeType.startsWith('image/');
        const cdnUrlParts = asset.cdnUrl.split('/');
        const uploadIndex = cdnUrlParts.indexOf('upload');
        let publicIdWithFolders = cdnUrlParts.slice(uploadIndex + 2).join('/');
        const dotIndex = publicIdWithFolders.lastIndexOf('.');
        if (dotIndex !== -1) {
            publicIdWithFolders = publicIdWithFolders.substring(0, dotIndex);
        }
        await deleteFromCloudinary(publicIdWithFolders, isImage ? 'image' : 'raw');

        // Upload new one
        const isNewImage = req.file.mimetype.startsWith('image/');
        const result = await uploadToCloudinary(req.file.buffer, {
            folder: `media-library/${asset.module}`,
            resource_type: isNewImage ? 'image' : 'raw'
        });

        // Update database doc
        const updatedAsset = await MediaAsset.findByIdAndUpdate(req.params.id, {
            originalName: req.file.originalname,
            mimeType: req.file.mimetype,
            sizeBytes: req.file.size,
            dimensions: isNewImage ? { width: result.width, height: result.height } : undefined,
            cdnUrl: result.secure_url,
            thumbnailUrl: isNewImage ? result.secure_url.replace('/upload/', '/upload/c_fill,w_150,h_150/') : undefined
        }, { new: true });

        await safeCreateAuditLog({
            adminId: req.user._id,
            action: 'UPDATE',
            resourceType: 'media',
            resourceId: req.params.id,
            changes: { action: 'REPLACE', newName: req.file.originalname },
            req
        });

        res.json({
            success: true,
            data: updatedAsset,
            message: 'Asset replaced successfully'
        });
    } catch (error) {
        console.error('Error replacing media asset:', error);
        res.status(500).json({ success: false, error: 'INTERNAL_ERROR', message: 'Replacement failed: ' + error.message });
    }
});

export default router;
