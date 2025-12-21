/**
 * Message Service - handles messaging API operations
 * Requirements: 2.1, 3.1, 3.3, 8.1
 */

import { getUser, getToken } from '../utils/auth';

/**
 * Get auth headers for API requests
 */
const getAuthHeaders = (includeContentType = true) => {
    const user = getUser();
    const token = getToken();
    const headers = {
        'x-user-id': user?._id || user?.id || '',
        ...(token && { 'Authorization': `Bearer ${token}` })
    };

    if (includeContentType) {
        headers['Content-Type'] = 'application/json';
    }

    return headers;
};

/**
 * Standard response format for consistent error handling
 */
const createResponse = (success, data = null, error = null) => ({
    success,
    data,
    error
});

/**
 * Handle API response and return consistent format
 */
const handleResponse = async (response) => {
    const data = await response.json();

    if (!response.ok) {
        return createResponse(false, null, {
            code: data.error || 'UNKNOWN_ERROR',
            message: data.message || 'An error occurred',
            status: response.status
        });
    }

    return createResponse(true, data.data || data, null);
};

const messageService = {
    /**
     * Get all conversations for the authenticated user
     * Requirement 3.1: Return conversations sorted by last activity
     * @param {Object} params - Pagination parameters
     * @param {number} params.page - Page number (default: 1)
     * @param {number} params.limit - Items per page (default: 20)
     * @returns {Promise<Object>} Response with conversations list
     */
    getConversations: async (params = {}) => {
        try {
            const { page = 1, limit = 20 } = params;
            const queryParams = new URLSearchParams({ page, limit });

            const response = await fetch(`/api/messages/conversations?${queryParams}`, {
                method: 'GET',
                headers: getAuthHeaders()
            });

            return handleResponse(response);
        } catch (error) {
            console.error('Error fetching conversations:', error);
            return createResponse(false, null, {
                code: 'NETWORK_ERROR',
                message: error.message || 'Failed to fetch conversations'
            });
        }
    },

    /**
     * Get a specific conversation with messages
     * Requirement 3.1: Get conversation details with messages
     * @param {string} conversationId - Conversation ID
     * @returns {Promise<Object>} Response with conversation and messages
     */
    getConversation: async (conversationId) => {
        try {
            if (!conversationId) {
                return createResponse(false, null, {
                    code: 'INVALID_INPUT',
                    message: 'Conversation ID is required'
                });
            }

            const response = await fetch(`/api/messages/conversations/${conversationId}`, {
                method: 'GET',
                headers: getAuthHeaders()
            });

            const result = await handleResponse(response);

            return result;
        } catch (error) {
            console.error('Error fetching conversation:', error);
            return createResponse(false, null, {
                code: 'NETWORK_ERROR',
                message: error.message || 'Failed to fetch conversation'
            });
        }
    },

    /**
     * Send a message in a conversation
     * Requirement 2.1: Persist message with sender ID, text, timestamp, and read status
     * @param {string} conversationId - Conversation ID
     * @param {string} text - Message text
     * @param {File} file - Optional file attachment
     * @returns {Promise<Object>} Response with created message
     */
    sendMessage: async (conversationId, text, file = null) => {
        try {
            if (!conversationId) {
                return createResponse(false, null, {
                    code: 'INVALID_INPUT',
                    message: 'Conversation ID is required'
                });
            }

            if (!text?.trim() && !file) {
                return createResponse(false, null, {
                    code: 'EMPTY_MESSAGE',
                    message: 'Message text or file is required'
                });
            }

            let response;

            if (file) {
                // Send message with file using FormData
                const formData = new FormData();
                if (text?.trim()) {
                    formData.append('text', text.trim());
                }
                formData.append('file', file);

                response = await fetch(`/api/messages/conversations/${conversationId}/messages`, {
                    method: 'POST',
                    headers: getAuthHeaders(false), // Don't include Content-Type for FormData
                    body: formData
                });
            } else {
                // Send text-only message
                response = await fetch(`/api/messages/conversations/${conversationId}/messages`, {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify({ text: text.trim() })
                });
            }

            return handleResponse(response);
        } catch (error) {
            console.error('Error sending message:', error);
            return createResponse(false, null, {
                code: 'NETWORK_ERROR',
                message: error.message || 'Failed to send message'
            });
        }
    },

    /**
     * Create or get an existing conversation
     * Requirement 2.1: Create conversation linked to property and participants
     * @param {string} recipientId - Recipient user ID
     * @param {string} propertyId - Property ID
     * @returns {Promise<Object>} Response with conversation
     */
    createConversation: async (recipientId, propertyId) => {
        try {
            if (!recipientId) {
                return createResponse(false, null, {
                    code: 'INVALID_INPUT',
                    message: 'Recipient ID is required'
                });
            }

            if (!propertyId) {
                return createResponse(false, null, {
                    code: 'INVALID_INPUT',
                    message: 'Property ID is required'
                });
            }

            const response = await fetch('/api/messages/conversations', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ recipientId, propertyId })
            });

            return handleResponse(response);
        } catch (error) {
            console.error('Error creating conversation:', error);
            return createResponse(false, null, {
                code: 'NETWORK_ERROR',
                message: error.message || 'Failed to create conversation'
            });
        }
    },

    /**
     * Mark all messages in a conversation as read
     * Requirement 3.3: Mark messages as read and reset unread count
     * @param {string} conversationId - Conversation ID
     * @returns {Promise<Object>} Response with updated read status
     */
    markAsRead: async (conversationId) => {
        try {
            if (!conversationId) {
                return createResponse(false, null, {
                    code: 'INVALID_INPUT',
                    message: 'Conversation ID is required'
                });
            }

            const response = await fetch(`/api/messages/conversations/${conversationId}/read`, {
                method: 'POST',
                headers: getAuthHeaders()
            });

            return handleResponse(response);
        } catch (error) {
            console.error('Error marking messages as read:', error);
            return createResponse(false, null, {
                code: 'NETWORK_ERROR',
                message: error.message || 'Failed to mark messages as read'
            });
        }
    },

    /**
     * Soft delete a message
     * Requirement 8.1: Soft-delete message by setting deleted flag
     * @param {string} messageId - Message ID
     * @returns {Promise<Object>} Response with deletion status
     */
    deleteMessage: async (messageId) => {
        try {
            if (!messageId) {
                return createResponse(false, null, {
                    code: 'INVALID_INPUT',
                    message: 'Message ID is required'
                });
            }

            const response = await fetch(`/api/messages/messages/${messageId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            return handleResponse(response);
        } catch (error) {
            console.error('Error deleting message:', error);
            return createResponse(false, null, {
                code: 'NETWORK_ERROR',
                message: error.message || 'Failed to delete message'
            });
        }
    },

    /**
     * Get total unread message count for the user
     * Requirement 7.1: Fetch and display current unread message count
     * @returns {Promise<Object>} Response with unread count
     */
    getUnreadCount: async () => {
        try {
            const response = await fetch('/api/messages/unread-count', {
                method: 'GET',
                headers: getAuthHeaders()
            });

            return handleResponse(response);
        } catch (error) {
            console.error('Error fetching unread count:', error);
            return createResponse(false, null, {
                code: 'NETWORK_ERROR',
                message: error.message || 'Failed to fetch unread count'
            });
        }
    }
};

export default messageService;
