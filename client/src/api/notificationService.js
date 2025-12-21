/**
 * Notification Service - handles notification API operations
 * Requirements: 6.1, 6.2, 6.3
 */

import { getUser, getToken } from '../utils/auth';

/**
 * Get auth headers for API requests
 */
const getAuthHeaders = () => {
    const user = getUser();
    const token = getToken();
    return {
        'Content-Type': 'application/json',
        'x-user-id': user?._id || user?.id || '',
        ...(token && { 'Authorization': `Bearer ${token}` })
    };
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

const notificationService = {
    /**
     * Get user's notifications with pagination
     * Requirement 6.1: Return notifications sorted by creation time
     * @param {Object} params - Query parameters
     * @param {number} params.page - Page number (default: 1)
     * @param {number} params.limit - Items per page (default: 20)
     * @param {boolean} params.unreadOnly - Filter for unread only (default: false)
     * @returns {Promise<Object>} Response with notifications list
     */
    getNotifications: async (params = {}) => {
        try {
            const { page = 1, limit = 20, unreadOnly = false } = params;
            const queryParams = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                ...(unreadOnly && { unreadOnly: 'true' })
            });

            const response = await fetch(`/api/notifications?${queryParams}`, {
                method: 'GET',
                headers: getAuthHeaders()
            });

            return handleResponse(response);
        } catch (error) {
            console.error('Error fetching notifications:', error);
            return createResponse(false, null, {
                code: 'NETWORK_ERROR',
                message: error.message || 'Failed to fetch notifications'
            });
        }
    },

    /**
     * Get unread notification count
     * Requirement 7.2: Fetch and display current unread notification count
     * @returns {Promise<Object>} Response with unread count
     */
    getUnreadCount: async () => {
        try {
            const response = await fetch('/api/notifications/unread-count', {
                method: 'GET',
                headers: getAuthHeaders()
            });

            return handleResponse(response);
        } catch (error) {
            console.error('Error fetching unread notification count:', error);
            return createResponse(false, null, {
                code: 'NETWORK_ERROR',
                message: error.message || 'Failed to fetch unread notification count'
            });
        }
    },

    /**
     * Mark a single notification as read
     * Requirement 6.2: Update notification's read status to true
     * @param {string} notificationId - Notification ID
     * @returns {Promise<Object>} Response with updated notification
     */
    markAsRead: async (notificationId) => {
        try {
            if (!notificationId) {
                return createResponse(false, null, {
                    code: 'INVALID_INPUT',
                    message: 'Notification ID is required'
                });
            }

            const response = await fetch(`/api/notifications/${notificationId}/read`, {
                method: 'POST',
                headers: getAuthHeaders()
            });

            return handleResponse(response);
        } catch (error) {
            console.error('Error marking notification as read:', error);
            return createResponse(false, null, {
                code: 'NETWORK_ERROR',
                message: error.message || 'Failed to mark notification as read'
            });
        }
    },

    /**
     * Mark all notifications as read
     * Requirement 6.3: Update all unread notifications for the user
     * @returns {Promise<Object>} Response with success status
     */
    markAllAsRead: async () => {
        try {
            const response = await fetch('/api/notifications/read-all', {
                method: 'POST',
                headers: getAuthHeaders()
            });

            return handleResponse(response);
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            return createResponse(false, null, {
                code: 'NETWORK_ERROR',
                message: error.message || 'Failed to mark all notifications as read'
            });
        }
    }
};

export default notificationService;
