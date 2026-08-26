import { Router } from "express";
import multer from "multer";
import { uploadToCloudinary, deleteFromCloudinary } from "../src/config/cloudinary.js";
import { authenticateToken } from "../src/middleware/security.js";
import { VaultDocument } from "../models/VaultDocument.js";
import { connectDB } from "../src/config/db.js";
import { updateUserVerificationStatus } from "../src/utils/userVerification.js";
import fetch from "node-fetch";

const router = Router();

// Multer memory storage configuration
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const allowedMimeTypes = [
            "image/jpeg",
            "image/jpg",
            "image/png",
            "application/pdf"
        ];
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("File type not supported. Please upload JPEG, PNG, or PDF files."), false);
        }
    }
});

/**
 * POST /api/vault/documents
 * Upload a document to the vault
 */
router.post("/documents", authenticateToken, upload.single("file"), async (req, res) => {
    try {
        await connectDB();

        const { type } = req.body;
        const userId = req.user._id;

        if (!type || !["id_proof", "address_proof", "income_proof", "reference_letter", "other"].includes(type)) {
            return res.status(400).json({
                success: false,
                error: "VALIDATION_FAILED",
                message: "Invalid or missing document type"
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: "VALIDATION_FAILED",
                message: "No document file provided"
            });
        }

        // Upload to Cloudinary under the vault-documents subfolder for privacy segregation
        const isImage = req.file.mimetype.startsWith("image/");
        const cloudinaryOptions = {
            folder: `vault-documents/${userId}`,
            resource_type: isImage ? "image" : "raw"
        };

        const uploadResult = await uploadToCloudinary(req.file.buffer, cloudinaryOptions);

        const newDoc = new VaultDocument({
            userId,
            type,
            filename: req.file.originalname,
            mimetype: req.file.mimetype,
            publicId: uploadResult.public_id,
            storageUrl: uploadResult.secure_url,
            status: "pending"
        });

        await newDoc.save();

        res.status(201).json({
            success: true,
            data: newDoc,
            message: "Document uploaded successfully and pending review."
        });
    } catch (error) {
        console.error("[Vault Upload Error]:", error);
        res.status(500).json({
            success: false,
            error: "UPLOAD_FAILED",
            message: error.message || "Failed to upload document"
        });
    }
});

/**
 * GET /api/vault/documents
 * Retrieve the logged-in user's documents
 */
router.get("/documents", authenticateToken, async (req, res) => {
    try {
        await connectDB();
        
        const docs = await VaultDocument.find({ userId: req.user._id })
            .sort({ createdAt: -1 })
            .lean();

        res.json({
            success: true,
            data: docs
        });
    } catch (error) {
        console.error("[Vault List Error]:", error);
        res.status(500).json({
            success: false,
            error: "RETRIEVAL_FAILED",
            message: "Failed to load documents"
        });
    }
});

/**
 * DELETE /api/vault/documents/:id
 * Delete a user's own document (only if pending or rejected)
 */
router.delete("/documents/:id", authenticateToken, async (req, res) => {
    try {
        await connectDB();

        const doc = await VaultDocument.findById(req.params.id);
        if (!doc) {
            return res.status(404).json({
                success: false,
                error: "NOT_FOUND",
                message: "Document not found"
            });
        }

        // Access Control check
        if (doc.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                error: "ACCESS_DENIED",
                message: "You can only delete your own documents"
            });
        }

        // Verified documents should not be silently deleted
        if (doc.status === "verified") {
            return res.status(403).json({
                success: false,
                error: "DELETE_FORBIDDEN",
                message: "Verified documents cannot be deleted. Contact support for re-verification."
            });
        }

        // Clean up from Cloudinary
        const isImage = doc.mimetype.startsWith("image/");
        try {
            await deleteFromCloudinary(doc.publicId, isImage ? "image" : "raw");
        } catch (cloudinaryErr) {
            console.warn("[Vault Cloudinary Cleanup Warning]:", cloudinaryErr.message);
        }

        // Remove from DB
        await VaultDocument.findByIdAndDelete(req.params.id);

        // Recalculate user verification status
        await updateUserVerificationStatus(req.user._id);

        res.json({
            success: true,
            message: "Document deleted successfully."
        });
    } catch (error) {
        console.error("[Vault Delete Error]:", error);
        res.status(500).json({
            success: false,
            error: "DELETE_FAILED",
            message: "Failed to delete document"
        });
    }
});

/**
 * GET /api/vault/documents/:id/file
 * Proxy/view a vault file after checking permissions
 */
router.get("/documents/:id/file", authenticateToken, async (req, res) => {
    try {
        await connectDB();

        const doc = await VaultDocument.findById(req.params.id);
        if (!doc) {
            return res.status(404).json({
                success: false,
                error: "NOT_FOUND",
                message: "Document not found"
            });
        }

        // Requester must be document owner OR admin/ops_admin/super_admin
        const isAdmin = ["admin", "super_admin", "ops_admin"].includes(req.user.role);
        const isOwner = doc.userId.toString() === req.user._id.toString();

        if (!isOwner && !isAdmin) {
            return res.status(403).json({
                success: false,
                error: "ACCESS_DENIED",
                message: "Unauthorized access to this document"
            });
        }

        // Proxy the file buffer from Cloudinary for security
        const response = await fetch(doc.storageUrl);
        if (!response.ok) {
            return res.status(500).json({
                success: false,
                error: "STORAGE_ERROR",
                message: "Failed to retrieve document from secure storage"
            });
        }

        res.setHeader("Content-Type", doc.mimetype || response.headers.get("content-type") || "application/octet-stream");
        res.setHeader("Content-Disposition", `inline; filename="${doc.filename}"`);
        res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");
        res.setHeader("X-Content-Type-Options", "nosniff");
        res.setHeader("X-Download-Options", "noopen");
        
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        res.send(buffer);
    } catch (error) {
        console.error("[Vault View Error]:", error);
        res.status(500).json({
            success: false,
            error: "VIEW_FAILED",
            message: "Failed to load document file"
        });
    }
});

export default router;
