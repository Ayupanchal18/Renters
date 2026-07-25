import { Router } from "express";
import { z } from "zod";
import { LegalRequest } from "../models/LegalRequest.js";
import { requireAdmin } from "../src/middleware/adminAuth.js";
import { safeCreateAuditLog } from "../src/services/adminAuditService.js";

const router = Router();

// Validation Schemas
const submitLegalRequestSchema = z.object({
    type: z.enum([
        "dpdp_opt_out",
        "dpdp_erasure",
        "dpdp_access",
        "dpdp_correction",
        "dpdp_nomination",
        "dmca_takedown",
        "scam_report",
        "fair_housing_report",
        "contact_inquiry",
        "newsletter_subscriber",
        "campaign_subscriber"
    ]),
    applicantName: z.string().min(2, "Name must be at least 2 characters"),
    applicantEmail: z.string().email("Invalid email address"),
    applicantPhone: z.string().optional().default(""),
    targetUrl: z.string().optional().default(""),
    details: z.string().min(5, "Details must be at least 5 characters")
});

const updateLegalRequestSchema = z.object({
    status: z.enum(["pending", "under_review", "resolved", "rejected"]).optional(),
    resolutionNotes: z.string().optional()
});

/* ---------------------- PUBLIC SUBMISSION ENDPOINT ---------------------- */

/**
 * POST /api/legal/submit
 * Public endpoint to submit DPDP requests, DMCA notices, fraud reports, or inquiries.
 */
router.post("/submit", async (req, res) => {
    try {
        const parseResult = submitLegalRequestSchema.safeParse(req.body);
        if (!parseResult.success) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: parseResult.error.flatten().fieldErrors
            });
        }

        const data = parseResult.data;
        const ipAddress = req.ip || req.headers["x-forwarded-for"] || "";
        const userAgent = req.headers["user-agent"] || "";

        const legalRequest = new LegalRequest({
            ...data,
            ipAddress,
            userAgent
        });

        await legalRequest.save();

        // Audit log for security & DPDP compliance
        await safeCreateAuditLog({
            actorId: null,
            action: `LEGAL_REQUEST_SUBMITTED_${data.type.toUpperCase()}`,
            targetId: legalRequest._id.toString(),
            targetType: "LegalRequest",
            details: {
                type: data.type,
                email: data.applicantEmail,
                slaDeadline: legalRequest.slaDeadline
            },
            ipAddress
        });

        res.status(201).json({
            success: true,
            message: "Your statutory request has been submitted successfully.",
            data: {
                requestId: legalRequest._id,
                type: legalRequest.type,
                slaDeadline: legalRequest.slaDeadline,
                status: legalRequest.status
            }
        });
    } catch (error) {
        console.error("Legal request submission error:", error);
        res.status(500).json({
            success: false,
            message: "Server error processing legal request"
        });
    }
});

/* ---------------------- ADMIN ENDPOINTS ---------------------- */

/**
 * GET /api/legal/admin/requests
 * List & filter all legal requests in Admin Panel
 */
router.get("/admin/requests", requireAdmin, async (req, res) => {
    try {
        const { type, status, page = 1, limit = 20, search } = req.query;

        const query = {};

        if (type) {
            query.type = type;
        }

        if (status) {
            query.status = status;
        }

        if (search) {
            query.$or = [
                { applicantName: { $regex: search, $options: "i" } },
                { applicantEmail: { $regex: search, $options: "i" } },
                { targetUrl: { $regex: search, $options: "i" } },
                { details: { $regex: search, $options: "i" } }
            ];
        }

        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;

        const [requests, total] = await Promise.all([
            LegalRequest.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .populate("resolvedBy", "name email")
                .lean(),
            LegalRequest.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: {
                requests,
                pagination: {
                    total,
                    page: pageNum,
                    limit: limitNum,
                    totalPages: Math.ceil(total / limitNum)
                }
            }
        });
    } catch (error) {
        console.error("Admin list legal requests error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch legal requests"
        });
    }
});

/**
 * PATCH /api/legal/admin/requests/:id
 * Update status & resolution notes of a legal request
 */
router.patch("/admin/requests/:id", requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const parseResult = updateLegalRequestSchema.safeParse(req.body);
        if (!parseResult.success) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: parseResult.error.flatten().fieldErrors
            });
        }

        const { status, resolutionNotes } = parseResult.data;

        const legalRequest = await LegalRequest.findById(id);
        if (!legalRequest) {
            return res.status(404).json({
                success: false,
                message: "Legal request not found"
            });
        }

        if (status) legalRequest.status = status;
        if (resolutionNotes !== undefined) legalRequest.resolutionNotes = resolutionNotes;

        if (status === "resolved" || status === "rejected") {
            legalRequest.resolvedBy = req.user._id;
        }

        await legalRequest.save();

        await safeCreateAuditLog({
            actorId: req.user._id.toString(),
            action: `LEGAL_REQUEST_UPDATED_${legalRequest.status.toUpperCase()}`,
            targetId: legalRequest._id.toString(),
            targetType: "LegalRequest",
            details: {
                status: legalRequest.status,
                resolutionNotes: legalRequest.resolutionNotes
            },
            ipAddress: req.ip || ""
        });

        res.json({
            success: true,
            message: "Legal request updated successfully",
            data: legalRequest
        });
    } catch (error) {
        console.error("Update legal request error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update legal request"
        });
    }
});

export default router;
