import { Conversation } from '../../models/Conversation.js';
import mongoose from 'mongoose';

/**
 * MessageService handles all messaging operations including
 * conversation management, message sending, and read status tracking.
 */
class MessageService {
    /**
     * Get or create a conversation between two users for a specific property.
     * Ensures idempotence - multiple calls with same params return same conversation.
     * 
     * @param {string} userId - The initiating user's ID
     * @param {string} recipientId - The recipient user's ID
     * @param {string} propertyId - The property ID this conversation is about
     * @returns {Promise<{success: boolean, conversation?: object, error?: string, code?: string}>}
     */
    async getOrCreateConversation(userId, recipientId, propertyId) {
        try {
            // Validate that sender and recipient are different users
            if (userId === recipientId || userId.toString() === recipientId.toString()) {
                return {
                    success: false,
                    error: 'Cannot create conversation with yourself',
                    code: 'INVALID_RECIPIENT'
                };
            }

            // Validate ObjectIds
            if (!mongoose.Types.ObjectId.isValid(userId) ||
                !mongoose.Types.ObjectId.isValid(recipientId) ||
                !mongoose.Types.ObjectId.isValid(propertyId)) {
                return {
                    success: false,
                    error: 'Invalid user or property ID',
                    code: 'INVALID_ID'
                };
            }

            const userObjectId = new mongoose.Types.ObjectId(userId);
            const recipientObjectId = new mongoose.Types.ObjectId(recipientId);
            const propertyObjectId = new mongoose.Types.ObjectId(propertyId);

            // Sort participant IDs to ensure consistent lookup regardless of who initiates
            const sortedParticipants = [userObjectId, recipientObjectId].sort((a, b) =>
                a.toString().localeCompare(b.toString())
            );

            // Try to find existing conversation
            let conversation = await Conversation.findOne({
                participants: { $all: sortedParticipants, $size: 2 },
                property: propertyObjectId,
                isActive: true
            }).populate('participants', 'name email avatar phone')
                .populate('property', 'title images');

            if (conversation) {
                return {
                    success: true,
                    conversation,
                    isExisting: true
                };
            }

            // Create new conversation
            conversation = new Conversation({
                participants: sortedParticipants,
                property: propertyObjectId,
                messages: [],
                lastActivityAt: new Date(),
                unreadCount: new Map([
                    [userObjectId.toString(), 0],
                    [recipientObjectId.toString(), 0]
                ]),
                isActive: true
            });

            await conversation.save();

            // Populate the newly created conversation
            conversation = await Conversation.findById(conversation._id)
                .populate('participants', 'name email avatar phone')
                .populate('property', 'title images');

            return {
                success: true,
                conversation,
                isExisting: false
            };

        } catch (error) {
            // Handle duplicate key error (race condition)
            if (error.code === 11000) {
                // Another request created the conversation, fetch it
                const userObjectId = new mongoose.Types.ObjectId(userId);
                const recipientObjectId = new mongoose.Types.ObjectId(recipientId);
                const propertyObjectId = new mongoose.Types.ObjectId(propertyId);

                const sortedParticipants = [userObjectId, recipientObjectId].sort((a, b) =>
                    a.toString().localeCompare(b.toString())
                );

                const conversation = await Conversation.findOne({
                    participants: { $all: sortedParticipants, $size: 2 },
                    property: propertyObjectId
                }).populate('participants', 'name email avatar phone')
                    .populate('property', 'title images');

                if (conversation) {
                    return {
                        success: true,
                        conversation,
                        isExisting: true
                    };
                }
            }

            console.error('Error in getOrCreateConversation:', error);
            return {
                success: false,
                error: error.message,
                code: 'INTERNAL_ERROR'
            };
        }
    }

    /**
     * Sanitize message text to prevent XSS attacks.
     * Escapes HTML special characters.
     * 
     * @param {string} text - The raw message text
     * @returns {string} Sanitized text
     */
    sanitizeMessageText(text) {
        if (typeof text !== 'string') {
            return '';
        }

        // Escape HTML special characters
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;');
    }

    /**
     * Validate message text - must not be empty or whitespace only.
     * 
     * @param {string} text - The message text to validate
     * @returns {{valid: boolean, error?: string}}
     */
    validateMessageText(text) {
        if (text === null || text === undefined) {
            return { valid: false, error: 'Message text is required' };
        }

        if (typeof text !== 'string') {
            return { valid: false, error: 'Message text must be a string' };
        }

        const trimmed = text.trim();
        if (trimmed.length === 0) {
            return { valid: false, error: 'Message cannot be empty' };
        }

        if (trimmed.length > 5000) {
            return { valid: false, error: 'Message exceeds maximum length of 5000 characters' };
        }

        return { valid: true };
    }

    /**
     * Send a message in a conversation.
     * Validates input, sanitizes content, and updates conversation state.
     * 
     * @param {string} conversationId - The conversation ID
     * @param {string} senderId - The sender's user ID
     * @param {string} text - The message text (optional if file is provided)
     * @param {object} fileData - Optional file attachment data
     * @returns {Promise<{success: boolean, message?: object, conversation?: object, error?: string, code?: string}>}
     */
    async sendMessage(conversationId, senderId, text = '', fileData = null) {
        try {
            // Validate that either text or file is provided
            const hasText = text && text.trim().length > 0;
            const hasFile = fileData && fileData.url;

            if (!hasText && !hasFile) {
                return {
                    success: false,
                    error: 'Message text or file attachment is required',
                    code: 'EMPTY_MESSAGE'
                };
            }

            // Validate text if provided
            if (hasText) {
                const validation = this.validateMessageText(text);
                if (!validation.valid) {
                    return {
                        success: false,
                        error: validation.error,
                        code: 'EMPTY_MESSAGE'
                    };
                }
            }

            // Validate ObjectIds
            if (!mongoose.Types.ObjectId.isValid(conversationId) ||
                !mongoose.Types.ObjectId.isValid(senderId)) {
                return {
                    success: false,
                    error: 'Invalid conversation or sender ID',
                    code: 'INVALID_ID'
                };
            }

            const conversationObjectId = new mongoose.Types.ObjectId(conversationId);
            const senderObjectId = new mongoose.Types.ObjectId(senderId);

            // Find the conversation and verify sender is a participant
            const conversation = await Conversation.findOne({
                _id: conversationObjectId,
                isActive: true
            });

            if (!conversation) {
                return {
                    success: false,
                    error: 'Conversation not found',
                    code: 'CONVERSATION_NOT_FOUND'
                };
            }

            // Check if sender is a participant
            const isParticipant = conversation.participants.some(
                p => p.toString() === senderId.toString()
            );

            if (!isParticipant) {
                return {
                    success: false,
                    error: 'User is not a participant in this conversation',
                    code: 'UNAUTHORIZED_ACCESS'
                };
            }

            // Sanitize message text for XSS prevention
            const sanitizedText = hasText ? this.sanitizeMessageText(text.trim()) : '';

            // Determine message type
            let messageType = 'text';
            if (hasFile) {
                if (fileData.mimetype?.startsWith('image/')) {
                    messageType = 'image';
                } else {
                    messageType = 'file';
                }
            }

            // Create the message
            const now = new Date();
            const message = {
                sender: senderObjectId,
                text: sanitizedText,
                type: messageType,
                read: false,
                isDeleted: false,
                createdAt: now,
                updatedAt: now
            };

            // Add file data if present
            if (hasFile) {
                message.file = {
                    originalName: fileData.originalName,
                    filename: fileData.filename,
                    mimetype: fileData.mimetype,
                    size: fileData.size,
                    url: fileData.url
                };

                // For images, also set the image field for backward compatibility
                if (messageType === 'image') {
                    message.image = fileData.url;
                }
            }

            // Add message to conversation
            conversation.messages.push(message);

            // Update lastMessage - create preview text
            let previewText = sanitizedText;
            if (hasFile && !previewText) {
                previewText = `📎 ${fileData.originalName}`;
            } else if (hasFile && previewText) {
                previewText = `📎 ${previewText}`;
            }

            conversation.lastMessage = {
                sender: senderObjectId,
                text: previewText.substring(0, 100), // Preview text
                createdAt: now
            };

            // Update lastActivityAt
            conversation.lastActivityAt = now;

            // Increment unread count for recipient(s)
            const unreadCount = conversation.unreadCount || new Map();
            for (const participantId of conversation.participants) {
                const participantIdStr = participantId.toString();
                if (participantIdStr !== senderId.toString()) {
                    const currentCount = unreadCount.get(participantIdStr) || 0;
                    unreadCount.set(participantIdStr, currentCount + 1);
                }
            }
            conversation.unreadCount = unreadCount;

            await conversation.save();

            // Get the saved message (last one in array)
            const savedMessage = conversation.messages[conversation.messages.length - 1];

            return {
                success: true,
                message: savedMessage,
                conversation: {
                    _id: conversation._id,
                    lastMessage: conversation.lastMessage,
                    lastActivityAt: conversation.lastActivityAt,
                    unreadCount: Object.fromEntries(conversation.unreadCount)
                }
            };

        } catch (error) {
            console.error('Error in sendMessage:', error);
            return {
                success: false,
                error: error.message,
                code: 'INTERNAL_ERROR'
            };
        }
    }

    /**
     * Get the recipient ID from a conversation for a given sender.
     * 
     * @param {object} conversation - The conversation object
     * @param {string} senderId - The sender's user ID
     * @returns {string|null} The recipient's user ID or null
     */
    getRecipientId(conversation, senderId) {
        if (!conversation || !conversation.participants) {
            return null;
        }

        const recipient = conversation.participants.find(
            p => p.toString() !== senderId.toString()
        );

        return recipient ? recipient.toString() : null;
    }

    /**
     * Get messages for a conversation with pagination and ordering.
     * Messages are sorted by createdAt ascending (chronological order).
     * Soft-deleted messages are excluded from the response.
     * 
     * @param {string} conversationId - The conversation ID
     * @param {string} userId - The requesting user's ID (must be a participant)
     * @param {number} page - Page number (1-based, default: 1)
     * @param {number} limit - Number of messages per page (default: 50)
     * @returns {Promise<{success: boolean, messages?: array, pagination?: object, error?: string, code?: string}>}
     */
    async getMessages(conversationId, userId, page = 1, limit = 50) {
        try {
            // Validate ObjectIds
            if (!mongoose.Types.ObjectId.isValid(conversationId) ||
                !mongoose.Types.ObjectId.isValid(userId)) {
                return {
                    success: false,
                    error: 'Invalid conversation or user ID',
                    code: 'INVALID_ID'
                };
            }

            const conversationObjectId = new mongoose.Types.ObjectId(conversationId);

            // Find the conversation
            const conversation = await Conversation.findOne({
                _id: conversationObjectId,
                isActive: true
            }).populate('messages.sender', 'name email avatar');

            if (!conversation) {
                return {
                    success: false,
                    error: 'Conversation not found',
                    code: 'CONVERSATION_NOT_FOUND'
                };
            }

            // Validate user is a participant
            const isParticipant = conversation.participants.some(
                p => p.toString() === userId.toString()
            );

            if (!isParticipant) {
                return {
                    success: false,
                    error: 'User is not a participant in this conversation',
                    code: 'UNAUTHORIZED_ACCESS'
                };
            }

            // Filter out soft-deleted messages and sort by createdAt ascending
            const allMessages = conversation.messages
                .filter(msg => !msg.isDeleted)
                .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

            // Calculate pagination
            const totalMessages = allMessages.length;
            const totalPages = Math.ceil(totalMessages / limit);
            const currentPage = Math.max(1, Math.min(page, totalPages || 1));
            const skip = (currentPage - 1) * limit;

            // Get paginated messages
            const messages = allMessages.slice(skip, skip + limit);

            return {
                success: true,
                messages,
                pagination: {
                    currentPage,
                    totalPages,
                    totalMessages,
                    limit,
                    hasNextPage: currentPage < totalPages,
                    hasPrevPage: currentPage > 1
                }
            };

        } catch (error) {
            console.error('Error in getMessages:', error);
            return {
                success: false,
                error: error.message,
                code: 'INTERNAL_ERROR'
            };
        }
    }

    /**
     * Get all conversations for a user, sorted by last activity.
     * Includes lastMessage preview, unread count, and participant info.
     * 
     * @param {string} userId - The user's ID
     * @param {number} page - Page number (1-based, default: 1)
     * @param {number} limit - Number of conversations per page (default: 20)
     * @returns {Promise<{success: boolean, conversations?: array, pagination?: object, error?: string, code?: string}>}
     */
    async getUserConversations(userId, page = 1, limit = 20) {
        try {
            // Validate ObjectId
            if (!mongoose.Types.ObjectId.isValid(userId)) {
                return {
                    success: false,
                    error: 'Invalid user ID',
                    code: 'INVALID_ID'
                };
            }

            const userObjectId = new mongoose.Types.ObjectId(userId);

            // Count total conversations for pagination
            const totalConversations = await Conversation.countDocuments({
                participants: userObjectId,
                isActive: true
            });

            const totalPages = Math.ceil(totalConversations / limit);
            const currentPage = Math.max(1, Math.min(page, totalPages || 1));
            const skip = (currentPage - 1) * limit;

            // Fetch conversations sorted by lastActivityAt descending
            const conversations = await Conversation.find({
                participants: userObjectId,
                isActive: true
            })
                .sort({ lastActivityAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('participants', 'name email avatar phone')
                .populate('property', 'title images price')
                .select('-messages'); // Exclude full messages array for performance

            // Transform conversations to include user-specific unread count
            const transformedConversations = conversations.map(conv => {
                const convObj = conv.toObject();

                // Get unread count for this specific user
                const unreadCount = conv.unreadCount?.get(userId.toString()) || 0;

                return {
                    _id: convObj._id,
                    participants: convObj.participants,
                    property: convObj.property,
                    lastMessage: convObj.lastMessage,
                    lastActivityAt: convObj.lastActivityAt,
                    unreadCount,
                    createdAt: convObj.createdAt,
                    updatedAt: convObj.updatedAt
                };
            });

            return {
                success: true,
                conversations: transformedConversations,
                pagination: {
                    currentPage,
                    totalPages,
                    totalConversations,
                    limit,
                    hasNextPage: currentPage < totalPages,
                    hasPrevPage: currentPage > 1
                }
            };

        } catch (error) {
            console.error('Error in getUserConversations:', error);
            return {
                success: false,
                error: error.message,
                code: 'INTERNAL_ERROR'
            };
        }
    }

    /**
     * Soft delete a message. Only the message owner can delete their own messages.
     * Sets isDeleted=true and deletedAt timestamp while retaining the record.
     * 
     * @param {string} messageId - The message ID to delete
     * @param {string} userId - The user attempting to delete the message
     * @returns {Promise<{success: boolean, message?: object, error?: string, code?: string}>}
     */
    async softDeleteMessage(messageId, userId) {
        try {
            // Validate ObjectIds
            if (!mongoose.Types.ObjectId.isValid(messageId) ||
                !mongoose.Types.ObjectId.isValid(userId)) {
                return {
                    success: false,
                    error: 'Invalid message or user ID',
                    code: 'INVALID_ID'
                };
            }

            // Find the conversation containing this message
            const conversation = await Conversation.findOne({
                'messages._id': new mongoose.Types.ObjectId(messageId),
                isActive: true
            });

            if (!conversation) {
                return {
                    success: false,
                    error: 'Message not found',
                    code: 'MESSAGE_NOT_FOUND'
                };
            }

            // Find the specific message
            const message = conversation.messages.id(messageId);

            if (!message) {
                return {
                    success: false,
                    error: 'Message not found',
                    code: 'MESSAGE_NOT_FOUND'
                };
            }

            // Check if message is already deleted
            if (message.isDeleted) {
                return {
                    success: false,
                    error: 'Message is already deleted',
                    code: 'MESSAGE_NOT_FOUND'
                };
            }

            // Validate user owns the message (authorization check)
            if (message.sender.toString() !== userId.toString()) {
                return {
                    success: false,
                    error: 'You can only delete your own messages',
                    code: 'UNAUTHORIZED_ACCESS'
                };
            }

            // Soft delete the message
            const now = new Date();
            message.isDeleted = true;
            message.deletedAt = now;

            await conversation.save();

            return {
                success: true,
                message: {
                    _id: message._id,
                    isDeleted: message.isDeleted,
                    deletedAt: message.deletedAt
                }
            };

        } catch (error) {
            console.error('Error in softDeleteMessage:', error);
            return {
                success: false,
                error: error.message,
                code: 'INTERNAL_ERROR'
            };
        }
    }

    /**
     * Get the total unread message count for a user across all conversations.
     * Sums unread counts from all active conversations where user is a participant.
     * 
     * @param {string} userId - The user's ID
     * @returns {Promise<{success: boolean, count?: number, error?: string, code?: string}>}
     */
    async getUnreadMessageCount(userId) {
        try {
            // Validate ObjectId
            if (!mongoose.Types.ObjectId.isValid(userId)) {
                return {
                    success: false,
                    error: 'Invalid user ID',
                    code: 'INVALID_ID'
                };
            }

            const userObjectId = new mongoose.Types.ObjectId(userId);

            // Find all active conversations where user is a participant
            const conversations = await Conversation.find({
                participants: userObjectId,
                isActive: true
            }).select('unreadCount');

            // Sum up unread counts for this user across all conversations
            let totalUnread = 0;
            for (const conversation of conversations) {
                const unreadCount = conversation.unreadCount?.get(userId.toString()) || 0;
                totalUnread += unreadCount;
            }

            return {
                success: true,
                count: totalUnread
            };

        } catch (error) {
            console.error('Error in getUnreadMessageCount:', error);
            return {
                success: false,
                error: error.message,
                code: 'INTERNAL_ERROR'
            };
        }
    }

    /**
     * Mark all messages in a conversation as read for a specific user.
     * Sets readAt timestamp on messages and resets unread count to zero.
     * 
     * @param {string} conversationId - The conversation ID
     * @param {string} userId - The user marking messages as read
     * @returns {Promise<{success: boolean, markedCount?: number, error?: string, code?: string}>}
     */
    async markAsRead(conversationId, userId) {
        try {
            // Validate ObjectIds
            if (!mongoose.Types.ObjectId.isValid(conversationId) ||
                !mongoose.Types.ObjectId.isValid(userId)) {
                return {
                    success: false,
                    error: 'Invalid conversation or user ID',
                    code: 'INVALID_ID'
                };
            }

            const conversationObjectId = new mongoose.Types.ObjectId(conversationId);

            // Find the conversation
            const conversation = await Conversation.findOne({
                _id: conversationObjectId,
                isActive: true
            });

            if (!conversation) {
                return {
                    success: false,
                    error: 'Conversation not found',
                    code: 'CONVERSATION_NOT_FOUND'
                };
            }

            // Validate user is a participant
            const isParticipant = conversation.participants.some(
                p => p.toString() === userId.toString()
            );

            if (!isParticipant) {
                return {
                    success: false,
                    error: 'User is not a participant in this conversation',
                    code: 'UNAUTHORIZED_ACCESS'
                };
            }

            const now = new Date();
            let markedCount = 0;

            // Mark all unread messages from other users as read
            for (const message of conversation.messages) {
                // Only mark messages from other users that are not already read
                if (message.sender.toString() !== userId.toString() &&
                    !message.read &&
                    !message.isDeleted) {
                    message.read = true;
                    message.readAt = now;
                    markedCount++;
                }
            }

            // Reset unread count for this user to zero
            if (!conversation.unreadCount) {
                conversation.unreadCount = new Map();
            }
            conversation.unreadCount.set(userId.toString(), 0);

            await conversation.save();

            return {
                success: true,
                markedCount,
                unreadCount: 0
            };

        } catch (error) {
            console.error('Error in markAsRead:', error);
            return {
                success: false,
                error: error.message,
                code: 'INTERNAL_ERROR'
            };
        }
    }

    /**
     * Delete a conversation (soft delete by setting isActive to false).
     * Only participants can delete their conversations.
     * 
     * @param {string} conversationId - The conversation ID to delete
     * @param {string} userId - The user attempting to delete the conversation
     * @returns {Promise<{success: boolean, error?: string, code?: string}>}
     */
    async deleteConversation(conversationId, userId) {
        try {
            // Validate ObjectIds
            if (!mongoose.Types.ObjectId.isValid(conversationId) ||
                !mongoose.Types.ObjectId.isValid(userId)) {
                return {
                    success: false,
                    error: 'Invalid conversation or user ID',
                    code: 'INVALID_ID'
                };
            }

            const conversationObjectId = new mongoose.Types.ObjectId(conversationId);

            // Find the conversation
            const conversation = await Conversation.findOne({
                _id: conversationObjectId,
                isActive: true
            });

            if (!conversation) {
                return {
                    success: false,
                    error: 'Conversation not found',
                    code: 'CONVERSATION_NOT_FOUND'
                };
            }

            // Validate user is a participant
            const isParticipant = conversation.participants.some(
                p => p.toString() === userId.toString()
            );

            if (!isParticipant) {
                return {
                    success: false,
                    error: 'User is not a participant in this conversation',
                    code: 'UNAUTHORIZED_ACCESS'
                };
            }

            // Soft delete by setting isActive to false
            conversation.isActive = false;
            conversation.deletedAt = new Date();
            conversation.deletedBy = new mongoose.Types.ObjectId(userId);

            await conversation.save();

            return {
                success: true
            };

        } catch (error) {
            console.error('Error in deleteConversation:', error);
            return {
                success: false,
                error: error.message,
                code: 'INTERNAL_ERROR'
            };
        }
    }
}

// Create and export a singleton instance
const messageService = new MessageService();
export default messageService;
