import { Notification } from '../../models/Notification.js';
import mongoose from 'mongoose';

/**
 * MessageNotificationService handles notifications related to messaging.
 * This includes creating notifications when messages are received,
 * managing read status, and providing notification counts.
 */
class MessageNotificationService {
    /**
     * Deduplication window in minutes.
     * Notifications for the same conversation within this window will be updated
     * instead of creating duplicates.
     */
    static DEDUPLICATION_WINDOW_MINUTES = 5;

    /**
     * Create a notification for a message recipient.
     * Skips notification if sender equals recipient.
     * Implements deduplication - updates existing notification if one exists
     * for the same conversation within the deduplication window.
     * 
     * @param {string} recipientId - The recipient user's ID
     * @param {string} senderId - The sender user's ID
     * @param {string} conversationId - The conversation ID
     * @param {string} messagePreview - Preview text of the message
     * @param {string} propertyId - Optional property ID associated with the conversation
     * @param {string} messageId - Optional message ID
     * @param {string} senderName - Optional sender's name for the notification title
     * @returns {Promise<{success: boolean, notification?: object, isUpdate?: boolean, error?: string, code?: string}>}
     */
    async createMessageNotification(recipientId, senderId, conversationId, messagePreview, propertyId = null, messageId = null, senderName = 'Someone') {
        try {
            // Skip notification if sender equals recipient (Requirement 5.3)
            if (recipientId === senderId || recipientId.toString() === senderId.toString()) {
                return {
                    success: true,
                    skipped: true,
                    reason: 'Sender and recipient are the same user'
                };
            }

            // Validate ObjectIds
            if (!mongoose.Types.ObjectId.isValid(recipientId) ||
                !mongoose.Types.ObjectId.isValid(senderId) ||
                !mongoose.Types.ObjectId.isValid(conversationId)) {
                return {
                    success: false,
                    error: 'Invalid recipient, sender, or conversation ID',
                    code: 'INVALID_ID'
                };
            }

            const recipientObjectId = new mongoose.Types.ObjectId(recipientId);
            const senderObjectId = new mongoose.Types.ObjectId(senderId);
            const conversationObjectId = new mongoose.Types.ObjectId(conversationId);
            const propertyObjectId = propertyId && mongoose.Types.ObjectId.isValid(propertyId)
                ? new mongoose.Types.ObjectId(propertyId)
                : null;
            const messageObjectId = messageId && mongoose.Types.ObjectId.isValid(messageId)
                ? new mongoose.Types.ObjectId(messageId)
                : null;

            // Check for existing notification within deduplication window (Requirement 5.5)
            const existingNotification = await this.findRecentNotification(
                recipientId,
                conversationId,
                MessageNotificationService.DEDUPLICATION_WINDOW_MINUTES
            );

            if (existingNotification) {
                // Update existing notification instead of creating duplicate
                const truncatedPreview = this.truncatePreview(messagePreview);

                existingNotification.message = truncatedPreview;
                existingNotification.title = `New message from ${senderName}`;
                existingNotification.read = false; // Mark as unread again
                existingNotification.readAt = null;
                existingNotification.data.senderId = senderObjectId;
                if (messageObjectId) {
                    existingNotification.data.messageId = messageObjectId;
                }
                existingNotification.updatedAt = new Date();

                await existingNotification.save();

                return {
                    success: true,
                    notification: existingNotification,
                    isUpdate: true
                };
            }

            // Create new notification (Requirements 5.1, 5.2)
            const truncatedPreview = this.truncatePreview(messagePreview);

            const notification = new Notification({
                recipient: recipientObjectId,
                type: 'message',
                title: `New message from ${senderName}`,
                message: truncatedPreview,
                read: false,
                data: {
                    conversationId: conversationObjectId,
                    propertyId: propertyObjectId,
                    senderId: senderObjectId,
                    messageId: messageObjectId
                },
                isDeleted: false
            });

            await notification.save();

            return {
                success: true,
                notification,
                isUpdate: false
            };

        } catch (error) {
            console.error('Error in createMessageNotification:', error);
            return {
                success: false,
                error: error.message,
                code: 'INTERNAL_ERROR'
            };
        }
    }


    /**
     * Truncate message preview to a reasonable length.
     * 
     * @param {string} text - The message text
     * @param {number} maxLength - Maximum length (default: 100)
     * @returns {string} Truncated text
     */
    truncatePreview(text, maxLength = 100) {
        if (!text || typeof text !== 'string') {
            return '';
        }

        if (text.length <= maxLength) {
            return text;
        }

        return text.substring(0, maxLength - 3) + '...';
    }

    /**
     * Find a recent notification for the same conversation within the deduplication window.
     * Used to prevent notification spam by updating existing notifications.
     * 
     * @param {string} userId - The recipient user's ID
     * @param {string} conversationId - The conversation ID
     * @param {number} windowMinutes - Time window in minutes (default: 5)
     * @returns {Promise<object|null>} Existing notification or null
     */
    async findRecentNotification(userId, conversationId, windowMinutes = 5) {
        try {
            if (!mongoose.Types.ObjectId.isValid(userId) ||
                !mongoose.Types.ObjectId.isValid(conversationId)) {
                return null;
            }

            const windowStart = new Date();
            windowStart.setMinutes(windowStart.getMinutes() - windowMinutes);

            const notification = await Notification.findOne({
                recipient: new mongoose.Types.ObjectId(userId),
                type: 'message',
                'data.conversationId': new mongoose.Types.ObjectId(conversationId),
                isDeleted: false,
                createdAt: { $gte: windowStart }
            }).sort({ createdAt: -1 });

            return notification;

        } catch (error) {
            console.error('Error in findRecentNotification:', error);
            return null;
        }
    }

    /**
     * Get notifications for a user with pagination.
     * Sorted by createdAt descending (newest first).
     * Supports filtering for unread only.
     * 
     * @param {string} userId - The user's ID
     * @param {number} page - Page number (1-based, default: 1)
     * @param {number} limit - Number of notifications per page (default: 20)
     * @param {boolean} unreadOnly - If true, only return unread notifications (default: false)
     * @returns {Promise<{success: boolean, notifications?: array, pagination?: object, error?: string, code?: string}>}
     */
    async getUserNotifications(userId, page = 1, limit = 20, unreadOnly = false) {
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

            // Build query
            const query = {
                recipient: userObjectId,
                isDeleted: false
            };

            if (unreadOnly) {
                query.read = false;
            }

            // Count total notifications for pagination
            const totalNotifications = await Notification.countDocuments(query);

            const totalPages = Math.ceil(totalNotifications / limit);
            const currentPage = Math.max(1, Math.min(page, totalPages || 1));
            const skip = (currentPage - 1) * limit;

            // Fetch notifications sorted by createdAt descending (Requirement 6.1)
            const notifications = await Notification.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('data.senderId', 'name email avatar')
                .populate('data.propertyId', 'title images');

            return {
                success: true,
                notifications,
                pagination: {
                    currentPage,
                    totalPages,
                    totalNotifications,
                    limit,
                    hasNextPage: currentPage < totalPages,
                    hasPrevPage: currentPage > 1
                }
            };

        } catch (error) {
            console.error('Error in getUserNotifications:', error);
            return {
                success: false,
                error: error.message,
                code: 'INTERNAL_ERROR'
            };
        }
    }


    /**
     * Mark a single notification as read.
     * Updates read=true and sets readAt timestamp.
     * 
     * @param {string} notificationId - The notification ID
     * @param {string} userId - The user's ID (must be the recipient)
     * @returns {Promise<{success: boolean, notification?: object, error?: string, code?: string}>}
     */
    async markNotificationAsRead(notificationId, userId) {
        try {
            // Validate ObjectIds
            if (!mongoose.Types.ObjectId.isValid(notificationId) ||
                !mongoose.Types.ObjectId.isValid(userId)) {
                return {
                    success: false,
                    error: 'Invalid notification or user ID',
                    code: 'INVALID_ID'
                };
            }

            const notificationObjectId = new mongoose.Types.ObjectId(notificationId);
            const userObjectId = new mongoose.Types.ObjectId(userId);

            // Find the notification
            const notification = await Notification.findOne({
                _id: notificationObjectId,
                recipient: userObjectId,
                isDeleted: false
            });

            if (!notification) {
                return {
                    success: false,
                    error: 'Notification not found',
                    code: 'NOTIFICATION_NOT_FOUND'
                };
            }

            // If already read, return success without updating
            if (notification.read) {
                return {
                    success: true,
                    notification,
                    alreadyRead: true
                };
            }

            // Mark as read (Requirement 6.2)
            const now = new Date();
            notification.read = true;
            notification.readAt = now;

            await notification.save();

            return {
                success: true,
                notification
            };

        } catch (error) {
            console.error('Error in markNotificationAsRead:', error);
            return {
                success: false,
                error: error.message,
                code: 'INTERNAL_ERROR'
            };
        }
    }

    /**
     * Mark all unread notifications as read for a user.
     * Updates read=true and sets readAt timestamp on all unread notifications.
     * 
     * @param {string} userId - The user's ID
     * @returns {Promise<{success: boolean, modifiedCount?: number, error?: string, code?: string}>}
     */
    async markAllAsRead(userId) {
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
            const now = new Date();

            // Update all unread notifications for this user (Requirement 6.3)
            const result = await Notification.updateMany(
                {
                    recipient: userObjectId,
                    read: false,
                    isDeleted: false
                },
                {
                    $set: {
                        read: true,
                        readAt: now
                    }
                }
            );

            return {
                success: true,
                modifiedCount: result.modifiedCount
            };

        } catch (error) {
            console.error('Error in markAllAsRead:', error);
            return {
                success: false,
                error: error.message,
                code: 'INTERNAL_ERROR'
            };
        }
    }

    /**
     * Get the count of unread notifications for a user.
     * 
     * @param {string} userId - The user's ID
     * @returns {Promise<{success: boolean, count?: number, error?: string, code?: string}>}
     */
    async getUnreadNotificationCount(userId) {
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

            // Count unread notifications (Requirement 7.2)
            const count = await Notification.countDocuments({
                recipient: userObjectId,
                read: false,
                isDeleted: false
            });

            return {
                success: true,
                count
            };

        } catch (error) {
            console.error('Error in getUnreadNotificationCount:', error);
            return {
                success: false,
                error: error.message,
                code: 'INTERNAL_ERROR'
            };
        }
    }
}

// Create and export a singleton instance
const messageNotificationService = new MessageNotificationService();
export default messageNotificationService;
