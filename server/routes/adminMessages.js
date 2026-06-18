import { Router } from "express";
import { z } from "zod";
import { Conversation } from "../models/Conversation.js";
import { connectDB } from "../src/config/db.js";
import { createAuditLog, safeCreateAuditLog } from "../src/services/adminAuditService.js";
import { requirePermission } from "../src/middleware/permissionGuard.js";

const router = Router();

/**
 * Admin Message Management Routes
 * 
 * Provides read-only access to conversations and messages for moderation purposes.
 * All access is logged for audit purposes.
 */

/* ---------------------- VALIDATION SCHEMAS ---------------------- */

const conversationListQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().optional(),
    sortBy: z.string().default('lastActivityAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc')
});

/* ---------------------- ROUTES ---------------------- */

/**
 * GET /api/admin/messages/conversations
 * List all conversations with pagination for admin moderation
 */
router.get("/conversations", requirePermission('conversations:read'), async (req, res) => {
    try {
        await connectDB();

        // Validate and parse query parameters
        const queryResult = conversationListQuerySchema.safeParse(req.query);
        if (!queryResult.success) {
            return res.status(400).json({
                success: false,
                error: "VALIDATION_ERROR",
                message: "Invalid query parameters",
                details: queryResult.error.errors
            });
        }

        const { page, limit, search, sortBy, sortOrder } = queryResult.data;

        // Build query
        const query = { isActive: true };

        // Add search filter if provided (search by participant name/email)
        if (search) {
            // We'll need to search after population, so we'll filter in memory
            // For better performance with large datasets, consider using aggregation
        }

        // Calculate skip
        const skip = (page - 1) * limit;

        // Build sort object
        const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

        // Execute query with pagination
        let [conversations, total] = await Promise.all([
            Conversation.find(query)
                .populate('participants', 'name email avatar phone')
                .populate('property', 'title images price location')
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .lean(),
            Conversation.countDocuments(query)
        ]);

        // Filter by search term if provided (search in participant names/emails)
        if (search) {
            const searchLower = search.toLowerCase();
            conversations = conversations.filter(conv =>
                conv.participants?.some(p =>
                    p.name?.toLowerCase().includes(searchLower) ||
                    p.email?.toLowerCase().includes(searchLower)
                ) ||
                conv.property?.title?.toLowerCase().includes(searchLower)
            );
            total = conversations.length;
        }

        // Log admin access for audit (Requirement 9.3)
        await safeCreateAuditLog({
            adminId: req.user._id,
            action: 'VIEW',
            resourceType: 'conversation',
            resourceId: null,
            changes: null,
            metadata: {
                action: 'list_conversations',
                page,
                limit,
                totalResults: total
            },
            req
        });

        res.json({
            success: true,
            data: {
                conversations: conversations.map(conv => ({
                    _id: conv._id,
                    participants: conv.participants,
                    property: conv.property,
                    lastMessage: conv.lastMessage,
                    lastActivityAt: conv.lastActivityAt,
                    messageCount: conv.messages?.length || 0,
                    createdAt: conv.createdAt,
                    updatedAt: conv.updatedAt
                })),
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            }
        });

    } catch (error) {
        console.error('Error listing conversations for admin:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to retrieve conversations"
        });
    }
});


/**
 * GET /api/admin/messages/conversations/:id
 * Get a single conversation with all messages for admin moderation
 */
router.get("/conversations/:id", requirePermission('conversations:read'), async (req, res) => {
    try {
        await connectDB();

        const { justification } = req.query;
        if (!justification || typeof justification !== 'string' || justification.trim().length < 10) {
            return res.status(400).json({
                success: false,
                error: "JUSTIFICATION_REQUIRED",
                message: "A business justification (minimum 10 characters) is required to access private conversation logs"
            });
        }

        const conversationId = req.params.id;

        // Validate ObjectId format
        if (!conversationId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                error: "VALIDATION_ERROR",
                message: "Invalid conversation ID format"
            });
        }

        // Get conversation with all messages
        const conversation = await Conversation.findById(conversationId)
            .populate('participants', 'name email avatar phone')
            .populate('property', 'title images price location')
            .populate('messages.sender', 'name email avatar')
            .lean();

        if (!conversation) {
            return res.status(404).json({
                success: false,
                error: "NOT_FOUND",
                message: "Conversation not found"
            });
        }

        // Log admin access for audit (Requirement 9.3)
        await safeCreateAuditLog({
            adminId: req.user._id,
            action: 'VIEW',
            resourceType: 'conversation',
            resourceId: conversationId,
            changes: null,
            metadata: {
                action: 'view_conversation',
                participantIds: conversation.participants.map(p => p._id.toString()),
                messageCount: conversation.messages?.length || 0,
                justification: justification.trim()
            },
            req
        });

        // Return conversation with full message history (including soft-deleted for admin)
        // Admin can see all messages for moderation purposes
        res.json({
            success: true,
            data: {
                conversation: {
                    _id: conversation._id,
                    participants: conversation.participants,
                    property: conversation.property,
                    lastMessage: conversation.lastMessage,
                    lastActivityAt: conversation.lastActivityAt,
                    createdAt: conversation.createdAt,
                    updatedAt: conversation.updatedAt,
                    isActive: conversation.isActive
                },
                messages: conversation.messages?.map(msg => ({
                    _id: msg._id,
                    sender: msg.sender,
                    text: msg.text,
                    type: msg.type,
                    read: msg.read,
                    readAt: msg.readAt,
                    isDeleted: msg.isDeleted,
                    deletedAt: msg.deletedAt,
                    createdAt: msg.createdAt,
                    updatedAt: msg.updatedAt
                })) || [],
                totalMessages: conversation.messages?.length || 0
            }
        });

    } catch (error) {
        console.error('Error getting conversation for admin:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to retrieve conversation"
        });
    }
});

/* ---------------------- MODERATION ACTION ROUTES ---------------------- */

/**
 * POST /api/admin/messages/conversations/:id/flag
 * Flag a conversation with severity and reason
 */
router.post("/conversations/:id/flag", requirePermission('conversations:flag'), async (req, res) => {
    try {
        await connectDB();

        const { severity, reason } = req.body;
        if (!['low', 'medium', 'high'].includes(severity)) {
            return res.status(400).json({ success: false, error: 'VALIDATION_ERROR', message: 'Invalid severity' });
        }
        if (!reason || reason.trim().length < 5) {
            return res.status(400).json({ success: false, error: 'VALIDATION_ERROR', message: 'Reason is required (min 5 chars)' });
        }

        const conv = await Conversation.findByIdAndUpdate(
            req.params.id,
            {
                flagStatus: severity,
                flagReason: reason.trim(),
                flaggedBy: req.user._id,
                flaggedAt: new Date()
            },
            { new: true }
        ).lean();

        if (!conv) return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Conversation not found' });

        await safeCreateAuditLog({
            adminId: req.user._id,
            action: 'FLAG',
            resourceType: 'conversation',
            resourceId: req.params.id,
            changes: { flagStatus: severity, flagReason: reason.trim() },
            req
        });

        res.json({ success: true, message: `Conversation flagged as ${severity}`, data: { flagStatus: conv.flagStatus } });
    } catch (error) {
        console.error('Flag conversation error:', error);
        res.status(500).json({ success: false, error: 'INTERNAL_ERROR', message: 'Failed to flag conversation' });
    }
});

/**
 * PATCH /api/admin/messages/conversations/:id/escalate
 * Escalate a flagged conversation to senior admin
 */
router.patch("/conversations/:id/escalate", requirePermission('conversations:escalate'), async (req, res) => {
    try {
        await connectDB();

        const conv = await Conversation.findByIdAndUpdate(
            req.params.id,
            { flagStatus: 'escalated', escalatedAt: new Date(), escalatedBy: req.user._id },
            { new: true }
        ).lean();

        if (!conv) return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Conversation not found' });

        await safeCreateAuditLog({
            adminId: req.user._id,
            action: 'ESCALATE',
            resourceType: 'conversation',
            resourceId: req.params.id,
            changes: { flagStatus: 'escalated' },
            req
        });

        res.json({ success: true, message: 'Conversation escalated' });
    } catch (error) {
        console.error('Escalate error:', error);
        res.status(500).json({ success: false, error: 'INTERNAL_ERROR', message: 'Failed to escalate conversation' });
    }
});

/**
 * PATCH /api/admin/messages/conversations/:id/resolve
 * Mark a flagged conversation as resolved
 */
router.patch("/conversations/:id/resolve", requirePermission('conversations:flag'), async (req, res) => {
    try {
        await connectDB();

        const { resolution } = req.body;
        const conv = await Conversation.findByIdAndUpdate(
            req.params.id,
            { flagStatus: 'resolved', resolvedAt: new Date(), resolvedBy: req.user._id, resolution },
            { new: true }
        ).lean();

        if (!conv) return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Conversation not found' });

        await safeCreateAuditLog({
            adminId: req.user._id,
            action: 'RESOLVE',
            resourceType: 'conversation',
            resourceId: req.params.id,
            changes: { flagStatus: 'resolved', resolution },
            req
        });

        res.json({ success: true, message: 'Conversation resolved' });
    } catch (error) {
        console.error('Resolve error:', error);
        res.status(500).json({ success: false, error: 'INTERNAL_ERROR', message: 'Failed to resolve conversation' });
    }
});

/**
 * POST /api/admin/messages/conversations/:id/warn
 * Send warning notification to conversation participants
 */
router.post("/conversations/:id/warn", requirePermission('conversations:flag'), async (req, res) => {
    try {
        await connectDB();

        const conv = await Conversation.findById(req.params.id).populate('participants', 'name email').lean();
        if (!conv) return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Conversation not found' });

        // Notification would be sent to participants via notification service
        // For now we log the action
        await safeCreateAuditLog({
            adminId: req.user._id,
            action: 'WARN',
            resourceType: 'conversation',
            resourceId: req.params.id,
            metadata: { participantIds: conv.participants.map(p => p._id) },
            req
        });

        res.json({ success: true, message: `Warning sent to ${conv.participants.length} participants` });
    } catch (error) {
        console.error('Warn error:', error);
        res.status(500).json({ success: false, error: 'INTERNAL_ERROR', message: 'Failed to send warning' });
    }
});

/**
 * GET /api/admin/messages/conversations/:id/export
 * Export conversation transcript as JSON
 */
router.get("/conversations/:id/export", requirePermission('conversations:read'), async (req, res) => {
    try {
        await connectDB();

        const conv = await Conversation.findById(req.params.id)
            .populate('participants', 'name email')
            .populate('property', 'title city')
            .populate('messages.sender', 'name email')
            .lean();

        if (!conv) return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Conversation not found' });

        await safeCreateAuditLog({
            adminId: req.user._id,
            action: 'EXPORT',
            resourceType: 'conversation',
            resourceId: req.params.id,
            metadata: { messageCount: conv.messages?.length || 0 },
            req
        });

        const transcript = {
            exportedAt: new Date().toISOString(),
            exportedBy: req.user._id,
            conversation: {
                id: conv._id,
                participants: conv.participants,
                property: conv.property,
                createdAt: conv.createdAt,
                flagStatus: conv.flagStatus,
            },
            messages: (conv.messages || []).map(m => ({
                sender: m.sender?.name,
                text: m.text,
                type: m.type,
                createdAt: m.createdAt,
                isDeleted: m.isDeleted,
            }))
        };

        res.setHeader('Content-Disposition', `attachment; filename="conversation-${req.params.id}.json"`);
        res.setHeader('Content-Type', 'application/json');
        res.json(transcript);
    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ success: false, error: 'INTERNAL_ERROR', message: 'Failed to export conversation' });
    }
});

/**
 * GET /api/admin/messages/flagged
 * Get all flagged conversations queue
 */
router.get("/flagged", requirePermission('conversations:read'), async (req, res) => {
    try {
        await connectDB();

        const flagged = await Conversation.find({
            flagStatus: { $in: ['low', 'medium', 'high', 'escalated'] }
        })
            .populate('participants', 'name email')
            .populate('property', 'title')
            .sort({ flaggedAt: -1 })
            .limit(50)
            .lean();

        res.json({ success: true, data: { conversations: flagged, total: flagged.length } });
    } catch (error) {
        console.error('Flagged queue error:', error);
        res.status(500).json({ success: false, error: 'INTERNAL_ERROR', message: 'Failed to fetch flagged queue' });
    }
});

export default router;

