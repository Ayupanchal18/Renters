import { Router } from "express";
import { z } from "zod";
import { Conversation } from "../models/Conversation.js";
import { connectDB } from "../src/config/db.js";
import { requireAdmin } from "../src/middleware/adminAuth.js";
import { createAuditLog } from "../src/services/adminAuditService.js";

const router = Router();

/**
 * Admin Message Management Routes
 * 
 * Provides read-only access to conversations and messages for moderation purposes.
 * All access is logged for audit purposes.
 * 
 * Requirements: 9.1, 9.2, 9.3, 9.4
 * - 9.1: Return conversations with full message history
 * - 9.2: Provide read-only access without ability to send messages
 * - 9.3: Log access for audit purposes
 * - 9.4: Reject non-admin users with 403 status
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
 * 
 * Requirements: 9.1 - Return conversations with full message history
 * Requirements: 9.2 - Read-only access (no send capability)
 * Requirements: 9.3 - Log access for audit purposes
 */
router.get("/conversations", requireAdmin, async (req, res) => {
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
        await createAuditLog({
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
 * 
 * Requirements: 9.1 - Return conversation with full message history
 * Requirements: 9.3 - Log access for audit purposes
 */
router.get("/conversations/:id", requireAdmin, async (req, res) => {
    try {
        await connectDB();

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
        await createAuditLog({
            adminId: req.user._id,
            action: 'VIEW',
            resourceType: 'conversation',
            resourceId: conversationId,
            changes: null,
            metadata: {
                action: 'view_conversation',
                participantIds: conversation.participants.map(p => p._id.toString()),
                messageCount: conversation.messages?.length || 0
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

export default router;
