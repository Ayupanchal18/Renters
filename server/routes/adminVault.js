import { Router } from "express";
import { VaultDocument } from "../models/VaultDocument.js";
import { User } from "../models/User.js";
import { requireAdmin } from "../src/middleware/adminAuth.js";
import { connectDB } from "../src/config/db.js";
import { updateUserVerificationStatus } from "../src/utils/userVerification.js";
import { safeCreateAuditLog } from "../src/services/adminAuditService.js";

const router = Router();

/**
 * GET /api/admin/vault/pending
 * Retrieve all pending vault documents across all users for review
 */
router.get("/pending", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        const pendingDocs = await VaultDocument.find({ status: "pending" })
            .populate("userId", "name email phone role")
            .sort({ createdAt: 1 }) // First in, first out
            .lean();

        res.json({
            success: true,
            data: pendingDocs
        });
    } catch (error) {
        console.error("[Admin Vault Pending List Error]:", error);
        res.status(500).json({
            success: false,
            error: "RETRIEVAL_FAILED",
            message: "Failed to load pending documents"
        });
    }
});

/**
 * PATCH /api/admin/vault/documents/:id
 * Verify or Reject a vault document
 */
router.patch("/documents/:id", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        const { status, rejectionReason } = req.body;
        
        if (!status || !["verified", "rejected"].includes(status)) {
            return res.status(400).json({
                success: false,
                error: "VALIDATION_FAILED",
                message: "Status must be 'verified' or 'rejected'"
            });
        }

        if (status === "rejected" && (!rejectionReason || !rejectionReason.trim())) {
            return res.status(400).json({
                success: false,
                error: "VALIDATION_FAILED",
                message: "Rejection reason is required when rejecting a document"
            });
        }

        const doc = await VaultDocument.findById(req.params.id);
        if (!doc) {
            return res.status(404).json({
                success: false,
                error: "NOT_FOUND",
                message: "Document not found"
            });
        }

        // Apply changes
        doc.status = status;
        doc.reviewedAt = new Date();
        doc.reviewedBy = req.user._id;
        if (status === "rejected") {
            doc.rejectionReason = rejectionReason;
        } else {
            doc.rejectionReason = undefined; // Clear reason if verified
        }

        await doc.save();

        // Recalculate user verification status
        const isUserNowVerified = await updateUserVerificationStatus(doc.userId);

        // Create audit log for administrative tracking
        try {
            await safeCreateAuditLog({
                adminId: req.user._id,
                action: 'UPDATE',
                resourceType: 'user_document',
                resourceId: doc._id,
                changes: {
                    status,
                    rejectionReason: status === "rejected" ? rejectionReason : undefined,
                    isUserVerified: isUserNowVerified
                },
                req
            });
        } catch (auditErr) {
            console.warn("[Admin Vault Audit Warning]:", auditErr.message);
        }

        res.json({
            success: true,
            data: doc,
            message: `Document successfully ${status}. User verification status recalculated.`
        });
    } catch (error) {
        console.error("[Admin Vault Status Patch Error]:", error);
        res.status(500).json({
            success: false,
            error: "UPDATE_FAILED",
            message: "Failed to update document status"
        });
    }
});

export default router;
