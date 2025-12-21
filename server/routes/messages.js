import { Router } from "express";
import { z } from "zod";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { Conversation } from "../models/Conversation.js";
import messageService from "../src/services/messageService.js";
import messageNotificationService from "../src/services/messageNotificationService.js";
import { connectDB } from "../src/config/db.js";
import {
    authenticateToken,
    validateInput,
    sendSuccess
} from "../src/middleware/security.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

// =====================================================
// FILE UPLOAD CONFIGURATION
// =====================================================

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads/messages');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        // Generate unique filename: timestamp-userId-originalname
        const userId = req.user?._id || 'anonymous';
        const timestamp = Date.now();
        const ext = path.extname(file.originalname);
        const name = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_');
        cb(null, `${timestamp}-${userId}-${name}${ext}`);
    }
});

// File filter for allowed types
const fileFilter = (req, file, cb) => {
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

// Configure multer
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
        files: 1 // Only one file per message
    }
});

// =====================================================
// VALIDATION SCHEMAS
// =====================================================

const createConversationSchema = z.object({
    recipientId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid recipient ID format"),
    propertyId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid property ID format")
});

const sendMessageSchema = z.object({
    text: z.string().max(5000, "Message exceeds maximum length").optional()
});

// Updated schema to make text optional when file is present
const validateMessageInput = (req, res, next) => {
    const { text } = req.body;
    const hasFile = req.file;

    // Either text or file must be present
    if (!text?.trim() && !hasFile) {
        return res.status(400).json({
            success: false,
            error: "VALIDATION_FAILED",
            message: "Message text or file is required"
        });
    }

    // If text is provided, validate it
    if (text && text.length > 5000) {
        return res.status(400).json({
            success: false,
            error: "VALIDATION_FAILED",
            message: "Message exceeds maximum length"
        });
    }

    next();
};

const paginationSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20)
});

// =====================================================
// MIDDLEWARE: Check if user is blocked
// Requirement 10.5: Blocked users cannot send messages
// =====================================================

const checkBlockedUser = async (req, res, next) => {
    try {
        if (req.user && req.user.isBlocked) {
            return res.status(403).json({
                success: false,
                error: "USER_BLOCKED",
                message: "Your account is blocked. You cannot send messages."
            });
        }
        next();
    } catch (error) {
        console.error('Check blocked user error:', error);
        next(error);
    }
};

// =====================================================
// ROUTES
// =====================================================


/**
 * POST /conversations
 * Create or get an existing conversation between two users for a property
 * Requirements: 1.1, 1.2
 */
router.post("/conversations",
    authenticateToken,
    checkBlockedUser,
    validateInput({ body: createConversationSchema }),
    async (req, res) => {
        try {
            await connectDB();

            const { recipientId, propertyId } = req.body;
            const userId = req.user._id.toString();

            const result = await messageService.getOrCreateConversation(
                userId,
                recipientId,
                propertyId
            );

            if (!result.success) {
                const statusCode = result.code === 'INVALID_RECIPIENT' ? 400 : 500;
                return res.status(statusCode).json({
                    success: false,
                    error: result.code,
                    message: result.error
                });
            }

            sendSuccess(
                res,
                {
                    conversation: result.conversation,
                    isExisting: result.isExisting
                },
                result.isExisting ? "Existing conversation retrieved" : "Conversation created",
                result.isExisting ? 200 : 201
            );
        } catch (error) {
            console.error('Create conversation error:', error);
            res.status(500).json({
                success: false,
                error: "INTERNAL_ERROR",
                message: "Failed to create conversation"
            });
        }
    }
);

/**
 * GET /conversations
 * Get all conversations for the authenticated user
 * Requirements: 3.1, 3.2
 */
router.get("/conversations",
    authenticateToken,
    validateInput({ query: paginationSchema }),
    async (req, res) => {
        try {
            await connectDB();

            const userId = req.user._id.toString();
            const { page, limit } = req.query;

            const result = await messageService.getUserConversations(userId, page, limit);

            if (!result.success) {
                return res.status(500).json({
                    success: false,
                    error: result.code,
                    message: result.error
                });
            }

            sendSuccess(res, {
                conversations: result.conversations,
                pagination: result.pagination
            }, "Conversations retrieved successfully");
        } catch (error) {
            console.error('Get conversations error:', error);
            res.status(500).json({
                success: false,
                error: "INTERNAL_ERROR",
                message: "Failed to retrieve conversations"
            });
        }
    }
);

/**
 * GET /conversations/:id
 * Get a specific conversation with messages
 * Requirements: 3.2
 */
router.get("/conversations/:id",
    authenticateToken,
    async (req, res) => {
        try {
            await connectDB();

            const conversationId = req.params.id;
            const userId = req.user._id.toString();

            // Get conversation with messages
            const messagesResult = await messageService.getMessages(
                conversationId,
                userId,
                1,
                100 // Get first 100 messages
            );

            if (!messagesResult.success) {
                const statusCode = messagesResult.code === 'CONVERSATION_NOT_FOUND' ? 404 :
                    messagesResult.code === 'UNAUTHORIZED_ACCESS' ? 403 : 500;
                return res.status(statusCode).json({
                    success: false,
                    error: messagesResult.code,
                    message: messagesResult.error
                });
            }

            // Get conversation details
            const conversation = await Conversation.findById(conversationId)
                .populate('participants', 'name email avatar')
                .populate('property', 'title images price')
                .select('-messages');

            if (!conversation) {
                return res.status(404).json({
                    success: false,
                    error: "CONVERSATION_NOT_FOUND",
                    message: "Conversation not found"
                });
            }

            // Get unread count for this user
            const unreadCount = conversation.unreadCount?.get(userId) || 0;

            sendSuccess(res, {
                conversation: {
                    _id: conversation._id,
                    participants: conversation.participants,
                    property: conversation.property,
                    lastMessage: conversation.lastMessage,
                    lastActivityAt: conversation.lastActivityAt,
                    unreadCount,
                    createdAt: conversation.createdAt,
                    updatedAt: conversation.updatedAt
                },
                messages: messagesResult.messages,
                pagination: messagesResult.pagination
            }, "Conversation retrieved successfully");
        } catch (error) {
            console.error('Get conversation error:', error);
            res.status(500).json({
                success: false,
                error: "INTERNAL_ERROR",
                message: "Failed to retrieve conversation"
            });
        }
    }
);


/**
 * POST /conversations/:id/messages
 * Send a message in a conversation (with optional file attachment)
 * Requirements: 2.1, 5.1
 */
router.post("/conversations/:id/messages",
    authenticateToken,
    checkBlockedUser,
    upload.single('file'), // Handle file upload
    validateMessageInput, // Custom validation for text/file
    async (req, res) => {
        try {
            await connectDB();

            const conversationId = req.params.id;
            const userId = req.user._id.toString();
            const { text } = req.body;
            const file = req.file;

            // Prepare file data if file was uploaded
            let fileData = null;
            if (file) {
                // Generate public URL for the file
                const fileUrl = `/uploads/messages/${file.filename}`;

                fileData = {
                    originalName: file.originalname,
                    filename: file.filename,
                    mimetype: file.mimetype,
                    size: file.size,
                    url: fileUrl
                };
            }

            // Send the message with optional file
            const result = await messageService.sendMessage(
                conversationId,
                userId,
                text?.trim() || '',
                fileData
            );

            if (!result.success) {
                // If message failed and we uploaded a file, clean it up
                if (file) {
                    try {
                        fs.unlinkSync(file.path);
                    } catch (cleanupError) {
                        console.error('Failed to cleanup uploaded file:', cleanupError);
                    }
                }

                const statusCode = result.code === 'CONVERSATION_NOT_FOUND' ? 404 :
                    result.code === 'UNAUTHORIZED_ACCESS' ? 403 :
                        result.code === 'EMPTY_MESSAGE' ? 400 : 500;
                return res.status(statusCode).json({
                    success: false,
                    error: result.code,
                    message: result.error
                });
            }

            // Get conversation to find recipient and create notification
            const conversation = await Conversation.findById(conversationId)
                .populate('participants', 'name')
                .populate('property', 'title');

            if (conversation) {
                // Find recipient (the other participant)
                const recipientId = messageService.getRecipientId(conversation, userId);

                if (recipientId) {
                    // Create notification for recipient (Requirement 5.1)
                    const senderName = req.user.name || 'Someone';
                    const propertyId = conversation.property?._id?.toString();
                    const messageId = result.message?._id?.toString();

                    // Create preview text
                    let previewText = text?.substring(0, 100) || '';
                    if (file && !previewText) {
                        previewText = `📎 ${file.originalname}`;
                    } else if (file && previewText) {
                        previewText = `📎 ${previewText}`;
                    }

                    await messageNotificationService.createMessageNotification(
                        recipientId,
                        userId,
                        conversationId,
                        previewText,
                        propertyId,
                        messageId,
                        senderName
                    );
                }
            }

            sendSuccess(res, {
                message: result.message,
                conversation: result.conversation
            }, "Message sent successfully", 201);
        } catch (error) {
            console.error('Send message error:', error);

            // Clean up uploaded file if there was an error
            if (req.file) {
                try {
                    fs.unlinkSync(req.file.path);
                } catch (cleanupError) {
                    console.error('Failed to cleanup uploaded file:', cleanupError);
                }
            }

            // Handle multer errors
            if (error.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({
                    success: false,
                    error: "FILE_TOO_LARGE",
                    message: "File size exceeds 10MB limit"
                });
            }

            if (error.message === 'File type not supported') {
                return res.status(400).json({
                    success: false,
                    error: "INVALID_FILE_TYPE",
                    message: "File type not supported"
                });
            }

            res.status(500).json({
                success: false,
                error: "INTERNAL_ERROR",
                message: "Failed to send message"
            });
        }
    }
);

/**
 * POST /conversations/:id/read
 * Mark all messages in a conversation as read
 * Requirements: 3.3, 3.4
 */
router.post("/conversations/:id/read",
    authenticateToken,
    async (req, res) => {
        try {
            await connectDB();

            const conversationId = req.params.id;
            const userId = req.user._id.toString();

            const result = await messageService.markAsRead(conversationId, userId);

            if (!result.success) {
                const statusCode = result.code === 'CONVERSATION_NOT_FOUND' ? 404 :
                    result.code === 'UNAUTHORIZED_ACCESS' ? 403 : 500;
                return res.status(statusCode).json({
                    success: false,
                    error: result.code,
                    message: result.error
                });
            }

            sendSuccess(res, {
                markedCount: result.markedCount,
                unreadCount: result.unreadCount
            }, "Messages marked as read");
        } catch (error) {
            console.error('Mark as read error:', error);
            res.status(500).json({
                success: false,
                error: "INTERNAL_ERROR",
                message: "Failed to mark messages as read"
            });
        }
    }
);

/**
 * DELETE /messages/:id
 * Soft delete a message (only owner can delete)
 * Requirements: 8.1, 8.3
 */
router.delete("/messages/:id",
    authenticateToken,
    async (req, res) => {
        try {
            await connectDB();

            const messageId = req.params.id;
            const userId = req.user._id.toString();

            const result = await messageService.softDeleteMessage(messageId, userId);

            if (!result.success) {
                const statusCode = result.code === 'MESSAGE_NOT_FOUND' ? 404 :
                    result.code === 'UNAUTHORIZED_ACCESS' ? 403 : 500;
                return res.status(statusCode).json({
                    success: false,
                    error: result.code,
                    message: result.error
                });
            }

            sendSuccess(res, {
                message: result.message
            }, "Message deleted successfully");
        } catch (error) {
            console.error('Delete message error:', error);
            res.status(500).json({
                success: false,
                error: "INTERNAL_ERROR",
                message: "Failed to delete message"
            });
        }
    }
);

/**
 * GET /unread-count
 * Get total unread message count for the authenticated user
 * Requirements: 7.1
 */
router.get("/unread-count",
    authenticateToken,
    async (req, res) => {
        try {
            await connectDB();

            const userId = req.user._id.toString();

            const result = await messageService.getUnreadMessageCount(userId);

            if (!result.success) {
                return res.status(500).json({
                    success: false,
                    error: result.code,
                    message: result.error
                });
            }

            sendSuccess(res, {
                count: result.count
            }, "Unread count retrieved successfully");
        } catch (error) {
            console.error('Get unread count error:', error);
            res.status(500).json({
                success: false,
                error: "INTERNAL_ERROR",
                message: "Failed to retrieve unread count"
            });
        }
    }
);

export default router;
