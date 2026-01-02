/**
 * useUnreadCounts Hook - Manages unread counts for messages and notifications
 * 
 * Provides:
 * - Fetch initial unread counts on mount
 * - Subscribe to unread.update socket events
 * - Message and notification counts
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import messageService from '../api/messageService';
import notificationService from '../api/notificationService';
import { getSocket, onUnreadUpdate, onMessageReceived, onNotification } from '../lib/socket';
import { getUser, isAuthenticated } from '../utils/auth';

/**
 * Hook for managing unread counts for messages and notifications
 * @param {Object} options - Configuration options
 * @param {boolean} options.autoFetch - Auto-fetch counts on mount (default: true)
 * @param {number} options.pollInterval - Polling interval in ms (0 to disable, default: 0)
 * @returns {Object} Unread counts state and functions
 */
export function useUnreadCounts(options = {}) {
    const { autoFetch = true, pollInterval = 0 } = options;

    // State
    const [messageCount, setMessageCount] = useState(0);
    const [notificationCount, setNotificationCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);

    // Refs
    const pollIntervalRef = useRef(null);
    const mountedRef = useRef(true);

    /**
     * Fetch unread message count
     * Requirement 7.1: Fetch and display current unread message count
     */
    const fetchMessageCount = useCallback(async () => {
        try {
            const response = await messageService.getUnreadCount();

            if (response.success && mountedRef.current) {
                const count = response.data?.count ?? response.data ?? 0;
                setMessageCount(count);
                setLastUpdated(new Date());
            }

            return response;
        } catch (err) {
            return { success: false, error: { message: err.message } };
        }
    }, []);

    /**
     * Fetch unread notification count
     * Requirement 7.2: Fetch and display current unread notification count
     */
    const fetchNotificationCount = useCallback(async () => {
        try {
            const response = await notificationService.getUnreadCount();

            if (response.success && mountedRef.current) {
                const count = response.data?.count ?? response.data ?? 0;
                setNotificationCount(count);
                setLastUpdated(new Date());
            }

            return response;
        } catch (err) {
            return { success: false, error: { message: err.message } };
        }
    }, []);

    /**
     * Fetch both unread counts
     */
    const fetchCounts = useCallback(async () => {
        if (!isAuthenticated()) return { success: false, error: { message: 'Not authenticated' } };

        setLoading(true);
        setError(null);

        try {
            const [messageResponse, notificationResponse] = await Promise.all([
                fetchMessageCount(),
                fetchNotificationCount()
            ]);

            if (!messageResponse.success || !notificationResponse.success) {
                if (mountedRef.current) {
                    setError('Failed to fetch some unread counts');
                }
            }

            return {
                success: messageResponse.success && notificationResponse.success,
                data: {
                    messages: messageCount,
                    notifications: notificationCount
                }
            };
        } catch (err) {
            const errorMessage = err.message || 'Failed to fetch unread counts';
            if (mountedRef.current) {
                setError(errorMessage);
            }
            return { success: false, error: { message: errorMessage } };
        } finally {
            if (mountedRef.current) {
                setLoading(false);
            }
        }
    }, [fetchMessageCount, fetchNotificationCount, messageCount, notificationCount]);

    /**
     * Handle unread count update from socket
     * Requirement 7.3: Update unread counts in real-time via WebSocket
     */
    const handleUnreadUpdate = useCallback((data) => {
        if (!mountedRef.current) return;

        if (typeof data.messages === 'number') {
            setMessageCount(data.messages);
        }
        if (typeof data.notifications === 'number') {
            setNotificationCount(data.notifications);
        }
        setLastUpdated(new Date());
    }, []);

    /**
     * Handle new message - increment message count
     */
    const handleNewMessage = useCallback((data) => {
        if (!mountedRef.current) return;

        // Only increment if the message is not from the current user
        const user = getUser();
        const userId = user?._id || user?.id;
        const senderId = data.message?.sender?._id || data.message?.sender;

        if (senderId !== userId) {
            setMessageCount(prev => prev + 1);
            setLastUpdated(new Date());
        }
    }, []);

    /**
     * Handle new notification - increment notification count
     */
    const handleNewNotification = useCallback((data) => {
        if (!mountedRef.current) return;

        const notification = data.notification || data;
        if (!notification.read) {
            setNotificationCount(prev => prev + 1);
            setLastUpdated(new Date());
        }
    }, []);

    /**
     * Manually update message count
     * @param {number|function} countOrUpdater - New count or updater function
     */
    const updateMessageCount = useCallback((countOrUpdater) => {
        if (typeof countOrUpdater === 'function') {
            setMessageCount(countOrUpdater);
        } else {
            setMessageCount(Math.max(0, countOrUpdater));
        }
        setLastUpdated(new Date());
    }, []);

    /**
     * Manually update notification count
     * @param {number|function} countOrUpdater - New count or updater function
     */
    const updateNotificationCount = useCallback((countOrUpdater) => {
        if (typeof countOrUpdater === 'function') {
            setNotificationCount(countOrUpdater);
        } else {
            setNotificationCount(Math.max(0, countOrUpdater));
        }
        setLastUpdated(new Date());
    }, []);

    /**
     * Decrement message count (e.g., when marking as read)
     * @param {number} amount - Amount to decrement (default: 1)
     */
    const decrementMessageCount = useCallback((amount = 1) => {
        setMessageCount(prev => Math.max(0, prev - amount));
        setLastUpdated(new Date());
    }, []);

    /**
     * Decrement notification count (e.g., when marking as read)
     * @param {number} amount - Amount to decrement (default: 1)
     */
    const decrementNotificationCount = useCallback((amount = 1) => {
        setNotificationCount(prev => Math.max(0, prev - amount));
        setLastUpdated(new Date());
    }, []);

    /**
     * Reset all counts to zero
     */
    const resetCounts = useCallback(() => {
        setMessageCount(0);
        setNotificationCount(0);
        setLastUpdated(new Date());
    }, []);

    /**
     * Get total unread count (messages + notifications)
     */
    const totalCount = messageCount + notificationCount;

    // Setup socket listeners
    useEffect(() => {
        mountedRef.current = true;

        if (!isAuthenticated()) return;

        // Set up socket event listeners
        // The socket is managed by SocketContext, we just subscribe to events
        onUnreadUpdate(handleUnreadUpdate);
        onMessageReceived(handleNewMessage);
        onNotification(handleNewNotification);

        // Cleanup
        return () => {
            mountedRef.current = false;
            // Socket cleanup is handled by SocketContext
        };
    }, [handleUnreadUpdate, handleNewMessage, handleNewNotification]);

    // Fetch counts on mount
    useEffect(() => {
        if (isAuthenticated() && autoFetch) {
            fetchCounts();
        }
    }, [autoFetch]); // eslint-disable-line react-hooks/exhaustive-deps

    // Setup polling if enabled
    useEffect(() => {
        if (pollInterval > 0 && isAuthenticated()) {
            pollIntervalRef.current = setInterval(() => {
                fetchCounts();
            }, pollInterval);

            return () => {
                if (pollIntervalRef.current) {
                    clearInterval(pollIntervalRef.current);
                }
            };
        }
    }, [pollInterval, fetchCounts]);

    // Clear error after timeout
    useEffect(() => {
        if (error) {
            const timeout = setTimeout(() => setError(null), 5000);
            return () => clearTimeout(timeout);
        }
    }, [error]);

    return {
        // State
        messageCount,
        notificationCount,
        totalCount,
        loading,
        error,
        lastUpdated,

        // Actions
        fetchCounts,
        fetchMessageCount,
        fetchNotificationCount,
        updateMessageCount,
        updateNotificationCount,
        decrementMessageCount,
        decrementNotificationCount,
        resetCounts,

        // Setters for external updates
        setMessageCount,
        setNotificationCount,
        setError
    };
}

export default useUnreadCounts;
