import { io } from "socket.io-client";
import { getToken, isAuthenticated } from "../utils/auth";

let socket = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;

/**
 * Connect to Socket.IO server with JWT authentication
 * Requirements: 4.2, 4.5 - Authenticate connection and handle reconnection
 * @param {string} token - Optional JWT token (will use stored token if not provided)
 * @returns {Socket|null} Socket instance or null if not authenticated
 */
export function connectSocket(token = null) {
    // Use provided token or get from storage
    const authToken = token || getToken();

    // Don't connect if no token available
    if (!authToken) {
        console.log("Socket: No auth token available, skipping connection");
        return null;
    }

    // Return existing connected socket
    if (socket && socket.connected) {
        return socket;
    }

    // Disconnect existing socket if any
    if (socket) {
        socket.disconnect();
        socket = null;
    }

    // Create new socket connection with JWT authentication
    socket = io("", {
        auth: { token: authToken },
        reconnection: true,
        reconnectionDelay: 2000,
        reconnectionDelayMax: 10000, // Max 10 seconds between attempts
        reconnectionAttempts: 3, // Reduced attempts for faster failure
        timeout: 5000, // Reduced timeout
    });

    // Connection established
    socket.on("connect", () => {
        console.log("Socket connected:", socket?.id);
        reconnectAttempts = 0; // Reset reconnect counter on successful connection
        socket?.emit("user.online");
    });

    // Connection error handling
    socket.on("connect_error", (error) => {
        console.warn("Socket connection error:", error.message);
        reconnectAttempts++;

        // If authentication failed, don't keep trying
        if (error.message.includes("Authentication")) {
            console.log("Socket: Authentication failed, stopping reconnection");
            socket?.disconnect();
            return;
        }

        // If server error (like no Socket.IO server), stop trying after a few attempts
        if (error.message.includes("server error") || error.message.includes("xhr poll error")) {
            console.log("Socket: Server not available, stopping reconnection attempts");
            socket?.disconnect();
            return;
        }

        // If max attempts reached, stop trying
        if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
            console.log("Socket: Max reconnection attempts reached");
            socket?.disconnect();
        }
    });

    // Disconnection handling
    socket.on("disconnect", (reason) => {
        console.log("Socket disconnected:", reason);

        // If server disconnected us, try to reconnect
        if (reason === "io server disconnect") {
            // Check if still authenticated before reconnecting
            if (isAuthenticated()) {
                socket?.connect();
            }
        }
    });

    // Error event handling
    socket.on("error", (err) => {
        console.error("Socket error:", err);
    });

    // Reconnection events for debugging
    socket.on("reconnect", (attemptNumber) => {
        console.log("Socket reconnected after", attemptNumber, "attempts");
        reconnectAttempts = 0;
    });

    socket.on("reconnect_attempt", (attemptNumber) => {
        console.log("Socket reconnection attempt:", attemptNumber);
    });

    socket.on("reconnect_failed", () => {
        console.log("Socket reconnection failed after max attempts");
    });

    return socket;
}

/**
 * Get the current socket instance
 * @returns {Socket|null} Socket instance or null
 */
export function getSocket() {
    return socket;
}

/**
 * Disconnect socket and cleanup
 * Called on logout or when user is no longer authenticated
 */
export function disconnectSocket() {
    if (socket) {
        console.log("Socket: Disconnecting...");
        socket.removeAllListeners();
        socket.disconnect();
        socket = null;
        reconnectAttempts = 0;
    }
}

/**
 * Check if socket is currently connected
 * @returns {boolean} True if connected
 */
export function isSocketConnected() {
    return socket?.connected || false;
}

/**
 * Reconnect socket with new token (e.g., after token refresh)
 * @param {string} newToken - New JWT token
 * @returns {Socket|null} Socket instance or null
 */
export function reconnectWithToken(newToken) {
    disconnectSocket();
    return connectSocket(newToken);
}

// =====================================================
// EVENT LISTENERS
// =====================================================

/**
 * Subscribe to new message events
 * @param {Function} callback - Callback function
 */
export function onMessageReceived(callback) {
    if (socket) {
        socket.off("message.new"); // Remove existing listener
        socket.on("message.new", callback);
    }
}

/**
 * Subscribe to notification events
 * @param {Function} callback - Callback function
 */
export function onNotification(callback) {
    if (socket) {
        socket.off("notification.new");
        socket.on("notification.new", callback);
    }
}

/**
 * Subscribe to typing indicator events
 * @param {Function} callback - Callback function
 */
export function onUserTyping(callback) {
    if (socket) {
        socket.off("user.typing");
        socket.on("user.typing", callback);
    }
}

/**
 * Subscribe to user online events
 * @param {Function} callback - Callback function
 */
export function onUserOnline(callback) {
    if (socket) {
        socket.off("user.online");
        socket.on("user.online", callback);
    }
}

/**
 * Subscribe to user offline events
 * @param {Function} callback - Callback function
 */
export function onUserOffline(callback) {
    if (socket) {
        socket.off("user.offline");
        socket.on("user.offline", callback);
    }
}

/**
 * Subscribe to unread count updates
 * @param {Function} callback - Callback function receiving { messages, notifications }
 */
export function onUnreadUpdate(callback) {
    if (socket) {
        socket.off("unread.update");
        socket.on("unread.update", callback);
    }
}

/**
 * Subscribe to message read updates
 * @param {Function} callback - Callback function
 */
export function onMessageReadUpdate(callback) {
    if (socket) {
        socket.off("message.read_update");
        socket.on("message.read_update", callback);
    }
}

// =====================================================
// SOCKET EMITTERS
// =====================================================

/**
 * Join a conversation room
 * @param {string} conversationId - Conversation ID to join
 */
export function joinConversation(conversationId) {
    if (socket && conversationId) {
        socket.emit("join_conversation", { conversationId });
    }
}

/**
 * Leave a conversation room
 * @param {string} conversationId - Conversation ID to leave
 */
export function leaveConversation(conversationId) {
    if (socket && conversationId) {
        socket.emit("leave_conversation", { conversationId });
    }
}

/**
 * Send a message via socket
 * @param {string} conversationId - Conversation ID
 * @param {string} text - Message text
 */
export function sendMessageSocket(conversationId, text) {
    if (socket && conversationId && text) {
        socket.emit("message.send", { conversationId, text });
    }
}

/**
 * Mark messages as read via socket
 * @param {string} conversationId - Conversation ID
 */
export function markAsReadSocket(conversationId) {
    if (socket && conversationId) {
        socket.emit("message.read", { conversationId });
    }
}

/**
 * Send typing start indicator
 * @param {string} conversationId - Conversation ID
 */
export function sendTypingStart(conversationId) {
    if (socket && conversationId) {
        socket.emit("typing.start", { conversationId });
    }
}

/**
 * Send typing stop indicator
 * @param {string} conversationId - Conversation ID
 */
export function sendTypingStop(conversationId) {
    if (socket && conversationId) {
        socket.emit("typing.stop", { conversationId });
    }
}
