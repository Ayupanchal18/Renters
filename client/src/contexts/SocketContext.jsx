import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { 
    connectSocket, 
    disconnectSocket, 
    getSocket, 
    isSocketConnected,
    onUnreadUpdate,
    onNotification,
    onMessageReceived
} from '../lib/socket';
import { getToken, isAuthenticated } from '../utils/auth';

/**
 * Socket Context for managing real-time connections
 */

const SocketContext = createContext(null);

/**
 * Socket Provider Component
 * Manages socket connection lifecycle based on authentication state
 */
export function SocketProvider({ children }) {
    const [isConnected, setIsConnected] = useState(false);
    const [unreadCounts, setUnreadCounts] = useState({ messages: 0, notifications: 0 });
    const socketRef = useRef(null);
    const connectionAttemptRef = useRef(false);

    /**
     * Initialize socket connection
     * Called when user is authenticated
     */
    const initializeSocket = useCallback(() => {
        // Prevent multiple simultaneous connection attempts
        if (connectionAttemptRef.current) {
            return;
        }

        const token = getToken();
        if (!token || !isAuthenticated()) {
            console.log('SocketProvider: Not authenticated, skipping socket connection');
            return;
        }

        connectionAttemptRef.current = true;

        try {
            const socket = connectSocket(token);
            if (socket) {
                socketRef.current = socket;

                // Set up connection state listeners
                socket.on('connect', () => {
                    setIsConnected(true);
                    connectionAttemptRef.current = false;
                });

                socket.on('disconnect', () => {
                    setIsConnected(false);
                });

                // Set up unread count listener
                onUnreadUpdate((data) => {
                    setUnreadCounts({
                        messages: data.messages || 0,
                        notifications: data.notifications || 0
                    });
                });

                // Update connection state if already connected
                if (socket.connected) {
                    setIsConnected(true);
                    connectionAttemptRef.current = false;
                }
            }
        } catch (error) {
            console.error('SocketProvider: Error initializing socket:', error);
            connectionAttemptRef.current = false;
        }
    }, []);

    /**
     * Cleanup socket connection
     * Called on logout or component unmount
     */
    const cleanupSocket = useCallback(() => {
        disconnectSocket();
        socketRef.current = null;
        setIsConnected(false);
        setUnreadCounts({ messages: 0, notifications: 0 });
        connectionAttemptRef.current = false;
    }, []);

    /**
     * Reconnect socket with current token
     * Useful after token refresh
     */
    const reconnect = useCallback(() => {
        cleanupSocket();
        // Small delay to ensure cleanup is complete
        setTimeout(() => {
            initializeSocket();
        }, 100);
    }, [cleanupSocket, initializeSocket]);

    // Initialize socket on mount if authenticated
    useEffect(() => {
        if (isAuthenticated()) {
            initializeSocket();
        }

        // Cleanup on unmount
        return () => {
            cleanupSocket();
        };
    }, [initializeSocket, cleanupSocket]);

    // Listen for storage events (login/logout in other tabs)
    useEffect(() => {
        const handleStorageChange = (event) => {
            if (event.key === 'authToken') {
                if (event.newValue) {
                    // Token was added (login)
                    initializeSocket();
                } else {
                    // Token was removed (logout)
                    cleanupSocket();
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [initializeSocket, cleanupSocket]);

    // Context value
    const value = {
        socket: socketRef.current,
        isConnected,
        unreadCounts,
        initializeSocket,
        cleanupSocket,
        reconnect,
        getSocket: () => getSocket(),
        isSocketConnected: () => isSocketConnected()
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
}

/**
 * Hook to access socket context
 * @returns {Object} Socket context value
 */
export function useSocket() {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
}

/**
 * Hook to get socket connection status
 * @returns {boolean} True if socket is connected
 */
export function useSocketConnected() {
    const { isConnected } = useSocket();
    return isConnected;
}

/**
 * Hook to get unread counts from socket
 * @returns {Object} { messages: number, notifications: number }
 */
export function useSocketUnreadCounts() {
    const { unreadCounts } = useSocket();
    return unreadCounts;
}

export default SocketContext;
