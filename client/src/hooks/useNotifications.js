/**
 * useNotifications Hook - Manages notification state and real-time updates
 * 
 * Provides:
 * - Notifications list state management
 * - Real-time notification updates via socket
 * - markAsRead, markAllAsRead functions
 * - Unread count tracking
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import notificationService from '../api/notificationService';
import { onNotification, onUnreadUpdate } from '../lib/socket';
import { getUser, isAuthenticated } from '../utils/auth';

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

/**
 * Utility function to retry an async operation
 */
const retryOperation = async (operation, maxRetries = MAX_RETRIES, delay = RETRY_DELAY) => {
    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error;

            if (attempt < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt)));
            }
        }
    }

    throw lastError;
};

/**
 * Hook for managing notifications functionality
 * @param {Object} options - Configuration options
 * @param {boolean} options.autoFetch - Auto-fetch notifications on mount (default: true)
 * @returns {Object} Notifications state and functions
 */
export function useNotifications(options = {}) {
    const { autoFetch = true } = options;

    // State
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [retrying, setRetrying] = useState(false);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        hasMore: false
    });

    // Refs
    const mountedRef = useRef(true);

    // Track mounted state
    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);

    /**
     * Fetch notifications for the current user
     * Requirement 6.1: Return notifications sorted by creation time
     * @param {Object} params - Query parameters
     * @param {number} params.page - Page number
     * @param {number} params.limit - Items per page
     * @param {boolean} params.unreadOnly - Filter for unread only
     * @param {boolean} params.append - Append to existing notifications (for pagination)
     */
    const fetchNotifications = useCallback(async (params = {}, append = false, withRetry = false) => {
        if (!isAuthenticated()) {
            return { success: false, error: { message: 'Not authenticated' } };
        }

        const { page = 1, limit = 20, unreadOnly = false } = params;

        setLoading(true);
        if (withRetry) setRetrying(true);
        setError(null);

        try {
            const operation = () => notificationService.getNotifications({ page, limit, unreadOnly });
            const response = withRetry
                ? await retryOperation(operation)
                : await operation();

            if (mountedRef.current) {
                if (response.success) {
                    const data = response.data;
                    const notificationsList = data.notifications || data || [];

                    if (append) {
                        setNotifications(prev => [...prev, ...notificationsList]);
                    } else {
                        setNotifications(notificationsList);
                    }

                    setPagination({
                        page: data.page || page,
                        limit: data.limit || limit,
                        total: data.total || notificationsList.length,
                        hasMore: data.hasMore || (notificationsList.length === limit)
                    });
                } else {
                    setError(response.error?.message || 'Failed to fetch notifications');
                }
            }

            return response;
        } catch (err) {
            const errorMessage = err.message || 'Failed to fetch notifications';
            if (mountedRef.current) {
                setError(errorMessage);
            }
            return { success: false, error: { message: errorMessage } };
        } finally {
            if (mountedRef.current) {
                setLoading(false);
                setRetrying(false);
            }
        }
    }, []);

    /**
     * Load more notifications (pagination)
     */
    const loadMore = useCallback(async () => {
        if (!pagination.hasMore || loading) return;

        return fetchNotifications({
            page: pagination.page + 1,
            limit: pagination.limit
        }, true);
    }, [pagination, loading, fetchNotifications]);

    /**
     * Fetch unread notification count
     * Requirement 7.2: Fetch and display current unread notification count
     */
    const fetchUnreadCount = useCallback(async () => {
        try {
            const response = await notificationService.getUnreadCount();

            if (response.success) {
                setUnreadCount(response.data.count || response.data || 0);
            }

            return response;
        } catch (err) {
            return { success: false, error: { message: err.message } };
        }
    }, []);

    /**
     * Mark a single notification as read
     * Requirement 6.2: Update notification's read status to true
     * @param {string} notificationId - Notification ID
     */
    const markAsRead = useCallback(async (notificationId) => {
        if (!notificationId) {
            return { success: false, error: { message: 'Notification ID required' } };
        }

        try {
            const response = await notificationService.markAsRead(notificationId);

            if (response.success && mountedRef.current) {
                // Update local state
                setNotifications(prev =>
                    prev.map(notif => {
                        if ((notif._id || notif.id) === notificationId) {
                            return { ...notif, read: true, readAt: new Date().toISOString() };
                        }
                        return notif;
                    })
                );

                // Decrement unread count
                setUnreadCount(prev => Math.max(0, prev - 1));
            }

            return response;
        } catch (err) {
            return { success: false, error: { message: err.message } };
        }
    }, []);

    /**
     * Mark all notifications as read
     * Requirement 6.3: Update all unread notifications for the user
     */
    const markAllAsRead = useCallback(async () => {
        try {
            const response = await notificationService.markAllAsRead();

            if (response.success && mountedRef.current) {
                // Update all notifications to read
                setNotifications(prev =>
                    prev.map(notif => ({
                        ...notif,
                        read: true,
                        readAt: notif.readAt || new Date().toISOString()
                    }))
                );

                // Reset unread count
                setUnreadCount(0);
            }

            return response;
        } catch (err) {
            return { success: false, error: { message: err.message } };
        }
    }, []);

    /**
     * Handle incoming notification from socket
     * Requirement 5.4: Broadcast notification via WebSocket in real-time
     */
    const handleNewNotification = useCallback((data) => {
        if (!mountedRef.current) return;

        const notification = data.notification || data;

        // Add to beginning of list
        setNotifications(prev => {
            // Avoid duplicates
            const exists = prev.some(n =>
                (n._id || n.id) === (notification._id || notification.id)
            );
            if (exists) return prev;
            return [notification, ...prev];
        });

        // Increment unread count
        if (!notification.read) {
            setUnreadCount(prev => prev + 1);
        }
    }, []);

    /**
     * Handle unread count update from socket
     */
    const handleUnreadUpdate = useCallback((data) => {
        if (!mountedRef.current) return;

        if (typeof data.notifications === 'number') {
            setUnreadCount(data.notifications);
        }
    }, []);

    /**
     * Clear a notification from the list (local only)
     * @param {string} notificationId - Notification ID
     */
    const clearNotification = useCallback((notificationId) => {
        setNotifications(prev =>
            prev.filter(notif => (notif._id || notif.id) !== notificationId)
        );
    }, []);

    /**
     * Clear all notifications (local only)
     */
    const clearAll = useCallback(() => {
        setNotifications([]);
    }, []);

    /**
     * Refresh notifications and unread count
     */
    const refresh = useCallback(async () => {
        await Promise.all([
            fetchNotifications({ page: 1, limit: pagination.limit }, false, true),
            fetchUnreadCount()
        ]);
    }, [fetchNotifications, fetchUnreadCount, pagination.limit]);

    // Setup socket listeners
    useEffect(() => {
        if (!isAuthenticated()) return;

        // Set up socket event listeners
        onNotification(handleNewNotification);
        onUnreadUpdate(handleUnreadUpdate);

        // Cleanup is handled by socket library
    }, [handleNewNotification, handleUnreadUpdate]);

    // Fetch notifications and unread count on mount
    useEffect(() => {
        if (isAuthenticated() && autoFetch) {
            fetchNotifications();
            fetchUnreadCount();
        }
    }, [autoFetch]); // eslint-disable-line react-hooks/exhaustive-deps

    // Clear error after timeout
    useEffect(() => {
        if (error) {
            const timeout = setTimeout(() => setError(null), 5000);
            return () => clearTimeout(timeout);
        }
    }, [error]);

    return {
        // State
        notifications,
        unreadCount,
        loading,
        error,
        retrying,
        pagination,

        // Actions
        fetchNotifications,
        fetchUnreadCount,
        loadMore,
        markAsRead,
        markAllAsRead,
        clearNotification,
        clearAll,
        refresh,

        // Setters for external updates
        setNotifications,
        setUnreadCount,
        setError
    };
}

export default useNotifications;
