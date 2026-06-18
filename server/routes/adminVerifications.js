import { Router } from "express";
import { z } from "zod";
import { connectDB } from "../src/config/db.js";
import { requirePermission } from "../src/middleware/permissionGuard.js";
import { createAuditLog, safeCreateAuditLog } from "../src/services/adminAuditService.js";
import { VerificationRequest } from "../models/VerificationRequest.js";
import { User } from "../models/User.js";

const router = Router();

const querySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    status: z.enum(['pending', 'approved', 'rejected']).optional(),
    documentType: z.enum(['RERA', 'PAN', 'LICENSE', 'PASSPORT']).optional()
});

const rejectSchema = z.object({
    remarks: z.string().min(1, "Remarks are required for rejection")
});

/**
 * GET /api/admin/verifications
 * Get paginated list of verification requests
 */
router.get("/", requirePermission('verifications:read'), async (req, res) => {
    try {
        await connectDB();

        const queryResult = querySchema.safeParse(req.query);
        if (!queryResult.success) {
            return res.status(400).json({
                success: false,
                error: "VALIDATION_ERROR",
                message: "Invalid query parameters",
                details: queryResult.error.errors
            });
        }

        const { page, limit, status, documentType } = queryResult.data;
        const skip = (page - 1) * limit;

        const filters = {};
        if (status) filters.status = status;
        if (documentType) filters.documentType = documentType;

        const [requests, total] = await Promise.all([
            VerificationRequest.find(filters)
                .populate('userId', 'name email phone role')
                .populate('verifiedBy', 'name email role')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            VerificationRequest.countDocuments(filters)
        ]);

        res.json({
            success: true,
            data: {
                requests,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        console.error("Error fetching verification requests:", error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to retrieve verification requests"
        });
    }
});

/**
 * GET /api/admin/verifications/:id
 * Get single verification request details
 */
router.get("/:id", requirePermission('verifications:read'), async (req, res) => {
    try {
        await connectDB();

        const request = await VerificationRequest.findById(req.params.id)
            .populate('userId', 'name email phone role verified')
            .populate('verifiedBy', 'name email role')
            .lean();

        if (!request) {
            return res.status(404).json({
                success: false,
                error: "NOT_FOUND",
                message: "Verification request not found"
            });
        }

        res.json({
            success: true,
            data: request
        });
    } catch (error) {
        console.error("Error fetching verification request:", error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to retrieve verification request"
        });
    }
});

/**
 * POST /api/admin/verifications/:id/ocr
 * Run simulated OCR extraction on the verification document
 */
router.post("/:id/ocr", requirePermission('verifications:write'), async (req, res) => {
    try {
        await connectDB();

        const request = await VerificationRequest.findById(req.params.id);
        if (!request) {
            return res.status(404).json({
                success: false,
                error: "NOT_FOUND",
                message: "Verification request not found"
            });
        }

        if (request.status !== 'pending') {
            return res.status(400).json({
                success: false,
                error: "INVALID_STATE",
                message: "OCR can only be run on pending requests"
            });
        }

        const user = await User.findById(request.userId).lean();
        const userName = user ? user.name : "Unknown User";

        // Simulated OCR parsing logic
        const confidence = 0.85 + Math.random() * 0.14; // 85% to 99% confidence
        let parsedName = userName;
        if (Math.random() < 0.1) {
            // Simulate a slight OCR spelling error/confidence issue 10% of the time
            parsedName = userName + " (OCR mismatch)";
        }

        const ocrData = {
            extractedName: parsedName,
            extractedNumber: request.documentNumber,
            confidenceScore: parseFloat(confidence.toFixed(4)),
            state: "Karnataka",
            expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            isNumberMatch: true
        };

        request.extractedData = ocrData;
        await request.save();

        // Log OCR triggering action in audit log
        await safeCreateAuditLog({
            adminId: req.user._id,
            action: 'UPDATE',
            resourceType: 'verification',
            resourceId: request._id,
            changes: { extractedData: ocrData },
            req
        });

        res.json({
            success: true,
            message: "OCR extraction completed successfully",
            data: request
        });
    } catch (error) {
        console.error("Error performing OCR on request:", error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to run OCR text extraction"
        });
    }
});

/**
 * POST /api/admin/verifications/:id/approve
 * Approve the verification request
 */
router.post("/:id/approve", requirePermission('verifications:write'), async (req, res) => {
    try {
        await connectDB();

        const request = await VerificationRequest.findById(req.params.id);
        if (!request) {
            return res.status(404).json({
                success: false,
                error: "NOT_FOUND",
                message: "Verification request not found"
            });
        }

        if (request.status !== 'pending') {
            return res.status(400).json({
                success: false,
                error: "INVALID_STATE",
                message: "Only pending requests can be approved"
            });
        }

        // Apply transaction
        request.status = 'approved';
        request.verifiedBy = req.user._id;
        request.verifiedAt = new Date();
        await request.save();

        // Update corresponding user verified flag
        await User.findByIdAndUpdate(request.userId, { verified: true });

        // Log audit action
        await safeCreateAuditLog({
            adminId: req.user._id,
            action: 'APPROVE',
            resourceType: 'verification',
            resourceId: request._id,
            changes: { status: 'approved' },
            req
        });

        res.json({
            success: true,
            message: "Verification request approved successfully",
            data: request
        });
    } catch (error) {
        console.error("Error approving verification request:", error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to approve verification request"
        });
    }
});

/**
 * POST /api/admin/verifications/:id/reject
 * Reject the verification request
 */
router.post("/:id/reject", requirePermission('verifications:write'), async (req, res) => {
    try {
        await connectDB();

        const bodyResult = rejectSchema.safeParse(req.body);
        if (!bodyResult.success) {
            return res.status(400).json({
                success: false,
                error: "VALIDATION_ERROR",
                message: "Remarks are required for rejection",
                details: bodyResult.error.errors
            });
        }

        const { remarks } = bodyResult.data;

        const request = await VerificationRequest.findById(req.params.id);
        if (!request) {
            return res.status(404).json({
                success: false,
                error: "NOT_FOUND",
                message: "Verification request not found"
            });
        }

        if (request.status !== 'pending') {
            return res.status(400).json({
                success: false,
                error: "INVALID_STATE",
                message: "Only pending requests can be rejected"
            });
        }

        // Apply transaction
        request.status = 'rejected';
        request.remarks = remarks;
        request.verifiedBy = req.user._id;
        request.verifiedAt = new Date();
        await request.save();

        // Update corresponding user verified flag to false
        await User.findByIdAndUpdate(request.userId, { verified: false });

        // Log audit action
        await safeCreateAuditLog({
            adminId: req.user._id,
            action: 'REJECT',
            resourceType: 'verification',
            resourceId: request._id,
            changes: { status: 'rejected', remarks },
            req
        });

        res.json({
            success: true,
            message: "Verification request rejected successfully",
            data: request
        });
    } catch (error) {
        console.error("Error rejecting verification request:", error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to reject verification request"
        });
    }
});

export default router;
