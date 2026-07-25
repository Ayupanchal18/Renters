import { Router } from "express";
import { z } from "zod";
import { EmailTemplate } from "../models/EmailTemplate.js";
import { requireAdmin } from "../src/middleware/adminAuth.js";
import { safeCreateAuditLog } from "../src/services/adminAuditService.js";

const router = Router();

const emailTemplateSchema = z.object({
    title: z.string().min(2, "Title is required"),
    category: z.enum(["promotional", "newsletter", "property_alert", "onboarding", "system"]),
    subject: z.string().min(2, "Subject is required"),
    htmlCode: z.string().min(5, "HTML code is required"),
    description: z.string().optional().default("")
});

/**
 * GET /api/admin/email-templates
 * List all email templates with category filter
 */
router.get("/", requireAdmin, async (req, res) => {
    try {
        const { category, search } = req.query;
        const query = {};

        if (category && category !== "all") {
            query.category = category;
        }

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: "i" } },
                { subject: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } }
            ];
        }

        const templates = await EmailTemplate.find(query)
            .sort({ createdAt: -1 })
            .populate("createdBy", "name email")
            .lean();

        res.json({
            success: true,
            data: templates
        });
    } catch (error) {
        console.error("List email templates error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch email templates"
        });
    }
});

/**
 * POST /api/admin/email-templates
 * Create a new HTML email template
 */
router.post("/", requireAdmin, async (req, res) => {
    try {
        const parseResult = emailTemplateSchema.safeParse(req.body);
        if (!parseResult.success) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: parseResult.error.flatten().fieldErrors
            });
        }

        const template = new EmailTemplate({
            ...parseResult.data,
            createdBy: req.user._id
        });

        await template.save();

        await safeCreateAuditLog({
            actorId: req.user._id.toString(),
            action: "EMAIL_TEMPLATE_CREATED",
            targetId: template._id.toString(),
            targetType: "EmailTemplate",
            details: { title: template.title, category: template.category },
            ipAddress: req.ip || ""
        });

        res.status(201).json({
            success: true,
            message: "Email template created successfully",
            data: template
        });
    } catch (error) {
        console.error("Create email template error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to create email template"
        });
    }
});

/**
 * PUT /api/admin/email-templates/:id
 * Update an existing HTML email template
 */
router.put("/:id", requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const parseResult = emailTemplateSchema.safeParse(req.body);
        if (!parseResult.success) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: parseResult.error.flatten().fieldErrors
            });
        }

        const template = await EmailTemplate.findByIdAndUpdate(
            id,
            { ...parseResult.data },
            { new: true }
        );

        if (!template) {
            return res.status(404).json({
                success: false,
                message: "Email template not found"
            });
        }

        await safeCreateAuditLog({
            actorId: req.user._id.toString(),
            action: "EMAIL_TEMPLATE_UPDATED",
            targetId: template._id.toString(),
            targetType: "EmailTemplate",
            details: { title: template.title, category: template.category },
            ipAddress: req.ip || ""
        });

        res.json({
            success: true,
            message: "Email template updated successfully",
            data: template
        });
    } catch (error) {
        console.error("Update email template error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update email template"
        });
    }
});

/**
 * DELETE /api/admin/email-templates/:id
 * Delete an email template
 */
router.delete("/:id", requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const template = await EmailTemplate.findByIdAndDelete(id);
        if (!template) {
            return res.status(404).json({
                success: false,
                message: "Email template not found"
            });
        }

        await safeCreateAuditLog({
            actorId: req.user._id.toString(),
            action: "EMAIL_TEMPLATE_DELETED",
            targetId: id,
            targetType: "EmailTemplate",
            details: { title: template.title },
            ipAddress: req.ip || ""
        });

        res.json({
            success: true,
            message: "Email template deleted successfully"
        });
    } catch (error) {
        console.error("Delete email template error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete email template"
        });
    }
});

export default router;
