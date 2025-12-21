import { Server as HTTPServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import jwt from "jsonwebtoken";
import { Conversation } from "./models/Conversation.js";
import { User } from "./models/User.js";
import { connectDB } from "./src/config/db.js";
import messageService from "./src/services/messageService.js";
import messageNotificationService from "./src/services/messageNotificationService.js";

/**
 * Socket.IO server instance - exported for use in other modules
 */
let ioInstance = null;

/**
 * Verify JWT token and return decoded payload
 * @param {string} token - JWT token to verify
 * @returns {object|null} Decoded token payload or null if invalid
 */
const verifyToken = (token) => {
    try {
        const secret = process.env.JWT_SECRET || 'fallback-secret';
        return jwt.verify(token, secret);
    } catch (error) {
        console.error('Socket JWT verification error:', error.message);
        return null;
    }
};

/**
 * Setup Socket.IO server with JWT authentication and real-time messaging
 * @param {HTTPServer} httpServer - HTTP server instance
 * @returns {SocketIOServer} Socket.IO server instance
 */
export function setupSocket(httpServer) {
    const io = new SocketIOServer(httpServer, {
        cors: { origin: "*", methods: ["GET", "POST"] },
    });

    // Store io instance for external access
    ioInstance = io;

    // JWT Authentication middleware (Requirements 4.2, 10.4)
    io.use(async (socket, next) => {
        try {
            // Extract token from handshake auth
            const token = socket.handshake.auth.token;

            // For development mode, allow userId fallback
            if (!token && process.env.NODE_ENV === 'development') {
                const userId = socket.handshake.auth.userId;
                if (userId) {
                    await connectDB();
                    const user = await User.findById(userId).lean();
                    if (user) {
                        socket.userId = user._id.toString();
                        socket.user = user;
                        socket.join(`user:${socket.userId}`);
                        return next();
                    }
                }
            }

            // Reject unauthenticated connections
            if (!token) {
                return next(new Error("Authentication required: Missing token"));
            }

            // Verify token and attach user to socket
            const decoded = verifyToken(token);
            if (!decoded || !decoded.sub) {
                return next(new Error("Authentication failed: Invalid token"));
            }

            // Get user from database
            await connectDB();
            const user = await User.findById(decoded.sub).lean();

            if (!user) {
                return next(new Error("Authentication failed: User not found"));
            }

            // Check if user is blocked (Requirement 10.5)
            if (user.isBlocked) {
                return next(new Error("Authentication failed: User is blocked"));
            }

            // Attach user info to socket
            socket.userId = user._id.toString();
            socket.user = user;

            // Join user's personal room for direct notifications
            socket.join(`user:${socket.userId}`);

            next();
        } catch (error) {
            console.error('Socket authentication error:', error);
            next(new Error("Authentication error"));
        }
    });


    // On connection
    io.on("connection", (socket) => {
        console.log(`User ${socket.userId} connected via Socket.IO`);

        // Join conversation room
        socket.on("join_conversation", (conversationId) => {
            if (conversationId) {
                socket.join(`conv:${conversationId}`);
                console.log(`User ${socket.userId} joined conversation ${conversationId}`);
            }
        });

        // Leave conversation room
        socket.on("leave_conversation", (conversationId) => {
            if (conversationId) {
                socket.leave(`conv:${conversationId}`);
                console.log(`User ${socket.userId} left conversation ${conversationId}`);
            }
        });

        // Send message handler (Requirements 4.1, 5.4)
        socket.on("message.send", async (data) => {
            try {
                const { conversationId, text } = data;

                if (!conversationId || !text) {
                    socket.emit("error", {
                        code: "INVALID_DATA",
                        message: "Conversation ID and text are required"
                    });
                    return;
                }

                // Check if user is blocked before sending
                if (socket.user?.isBlocked) {
                    socket.emit("error", {
                        code: "USER_BLOCKED",
                        message: "You are blocked from sending messages"
                    });
                    return;
                }

                // Send message via MessageService
                const result = await messageService.sendMessage(
                    conversationId,
                    socket.userId,
                    text
                );

                if (!result.success) {
                    socket.emit("error", {
                        code: result.code || "SEND_FAILED",
                        message: result.error
                    });
                    return;
                }

                // Get conversation to find recipient
                const conversation = await Conversation.findById(conversationId)
                    .populate('participants', 'name email avatar')
                    .populate('property', 'title');

                if (!conversation) {
                    socket.emit("error", {
                        code: "CONVERSATION_NOT_FOUND",
                        message: "Conversation not found"
                    });
                    return;
                }

                // Find recipient (the other participant)
                const recipientId = messageService.getRecipientId(conversation, socket.userId);

                // Populate sender info for the message
                const messageWithSender = {
                    ...result.message.toObject ? result.message.toObject() : result.message,
                    sender: {
                        _id: socket.userId,
                        name: socket.user?.name || 'Unknown',
                        avatar: socket.user?.avatar
                    }
                };

                // Broadcast message.new to conversation room (Requirement 4.1 - within 500ms)
                io.to(`conv:${conversationId}`).emit("message.new", {
                    conversationId,
                    message: messageWithSender
                });

                // Create notification for recipient (Requirement 5.4)
                if (recipientId && recipientId !== socket.userId) {
                    const notificationResult = await messageNotificationService.createMessageNotification(
                        recipientId,
                        socket.userId,
                        conversationId,
                        text,
                        conversation.property?._id?.toString(),
                        result.message._id?.toString(),
                        socket.user?.name || 'Someone'
                    );

                    // Broadcast notification.new to recipient
                    if (notificationResult.success && notificationResult.notification) {
                        io.to(`user:${recipientId}`).emit("notification.new", {
                            notification: notificationResult.notification
                        });
                    }

                    // Broadcast unread count update to recipient
                    await broadcastUnreadCounts(io, recipientId);
                }

            } catch (err) {
                console.error('Socket message.send error:', err);
                socket.emit("error", {
                    code: "INTERNAL_ERROR",
                    message: "Failed to send message"
                });
            }
        });


        // Mark messages as read handler (Requirement 4.4)
        socket.on("message.read", async (data) => {
            try {
                const { conversationId } = data;

                if (!conversationId) {
                    socket.emit("error", {
                        code: "INVALID_DATA",
                        message: "Conversation ID is required"
                    });
                    return;
                }

                // Mark messages as read via MessageService
                const result = await messageService.markAsRead(conversationId, socket.userId);

                if (!result.success) {
                    socket.emit("error", {
                        code: result.code || "MARK_READ_FAILED",
                        message: result.error
                    });
                    return;
                }

                // Broadcast message.read_update to conversation room
                io.to(`conv:${conversationId}`).emit("message.read_update", {
                    conversationId,
                    userId: socket.userId,
                    markedCount: result.markedCount
                });

                // Broadcast unread.update to the user who marked as read
                await broadcastUnreadCounts(io, socket.userId);

            } catch (err) {
                console.error('Socket message.read error:', err);
                socket.emit("error", {
                    code: "INTERNAL_ERROR",
                    message: "Failed to mark messages as read"
                });
            }
        });

        // Typing indicator - start (Requirement 4.3)
        socket.on("typing.start", (data) => {
            const { conversationId } = data;
            if (conversationId) {
                socket.to(`conv:${conversationId}`).emit("user.typing", {
                    conversationId,
                    userId: socket.userId,
                    userName: socket.user?.name || 'Someone',
                    isTyping: true
                });
            }
        });

        // Typing indicator - stop (Requirement 4.3)
        socket.on("typing.stop", (data) => {
            const { conversationId } = data;
            if (conversationId) {
                socket.to(`conv:${conversationId}`).emit("user.typing", {
                    conversationId,
                    userId: socket.userId,
                    userName: socket.user?.name || 'Someone',
                    isTyping: false
                });
            }
        });

        // Legacy typing event support
        socket.on("typing", (data) => {
            if (data.convId) {
                socket.to(`conv:${data.convId}`).emit("user.typing", {
                    conversationId: data.convId,
                    userId: socket.userId,
                    isTyping: true
                });
            }
        });

        // User online broadcast
        socket.on("user.online", () => {
            io.emit("user.online", {
                userId: socket.userId,
                timestamp: Date.now(),
            });
        });

        // Disconnect handler
        socket.on("disconnect", () => {
            console.log(`User ${socket.userId} disconnected`);
            io.emit("user.offline", {
                userId: socket.userId,
                timestamp: Date.now(),
            });
        });
    });

    return io;
}


/**
 * Broadcast unread counts to a specific user (Requirement 7.3)
 * Emits unread.update event with both message and notification counts
 * @param {SocketIOServer} io - Socket.IO server instance
 * @param {string} userId - User ID to broadcast to
 */
async function broadcastUnreadCounts(io, userId) {
    try {
        // Get unread message count
        const messageCountResult = await messageService.getUnreadMessageCount(userId);
        const messageCount = messageCountResult.success ? messageCountResult.count : 0;

        // Get unread notification count
        const notificationCountResult = await messageNotificationService.getUnreadNotificationCount(userId);
        const notificationCount = notificationCountResult.success ? notificationCountResult.count : 0;

        // Emit unread.update to user's room
        io.to(`user:${userId}`).emit("unread.update", {
            messages: messageCount,
            notifications: notificationCount
        });
    } catch (error) {
        console.error('Error broadcasting unread counts:', error);
    }
}

/**
 * Get the Socket.IO server instance
 * @returns {SocketIOServer|null} Socket.IO server instance or null if not initialized
 */
export function getIO() {
    return ioInstance;
}

/**
 * Emit notification to a specific user
 * @param {SocketIOServer} io - Socket.IO server instance
 * @param {string} userId - User ID to emit to
 * @param {object} notification - Notification object to emit
 */
export async function emitNotification(io, userId, notification) {
    io.to(`user:${userId}`).emit("notification.new", notification);

    // Also broadcast updated unread counts
    await broadcastUnreadCounts(io, userId);
}

/**
 * Emit message to a conversation room
 * @param {SocketIOServer} io - Socket.IO server instance
 * @param {string} conversationId - Conversation ID
 * @param {object} message - Message object to emit
 */
export function emitMessage(io, conversationId, message) {
    io.to(`conv:${conversationId}`).emit("message.new", {
        conversationId,
        message
    });
}

/**
 * Emit unread count update to a specific user
 * @param {SocketIOServer} io - Socket.IO server instance
 * @param {string} userId - User ID to emit to
 */
export async function emitUnreadUpdate(io, userId) {
    await broadcastUnreadCounts(io, userId);
}
