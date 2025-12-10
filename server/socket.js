import { Server as HTTPServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { Conversation } from "./models/Conversation.js";
import { Notification } from "./models/Notification.js";

export function setupSocket(httpServer) {
    const io = new SocketIOServer(httpServer, {
        cors: { origin: "*", methods: ["GET", "POST"] },
    });

    // Authentication middleware
    io.use((socket, next) => {
        const userId = socket.handshake.auth.userId;
        if (!userId) return next(new Error("Missing userId"));

        socket.userId = userId;
        socket.join(`user:${userId}`);
        next();
    });

    // On connection
    io.on("connection", (socket) => {
        console.log(`User${socket.userId} connected`);

        // Join conversation room
        socket.on("join_conversation", (convId) => {
            socket.join(`conv:${convId}`);
        });

        // Send message
        socket.on("message.send", async (data) => {
            try {
                const conv = await Conversation.findByIdAndUpdate(
                    data.convId,
                    {
                        $push: {
                            messages: {
                                sender: socket.userId,
                                text: data.text,
                                read: false,
                            },
                        },
                        lastMessage: {
                            sender: socket.userId,
                            text: data.text,
                            read: false,
                        },
                    },
                    { new: true }
                ).populate("messages.sender", "name avatar");

                if (conv) {
                    io.to(`conv:${data.convId}`).emit("message.new", {
                        convId: data.convId,
                        message: conv.messages[conv.messages.length - 1],
                    });
                }
            } catch (err) {
                socket.emit("error", "Failed to send message");
            }
        });

        // Mark messages as read
        socket.on("message.read", async (data) => {
            await Conversation.findByIdAndUpdate(
                data.convId,
                { $set: { "messages.$[].read": true } }
            );

            io.to(`conv:${data.convId}`).emit("message.read_all");
        });

        // User online broadcast
        socket.on("user.online", () => {
            io.emit("user.online", {
                userId: socket.userId,
                timestamp: Date.now(),
            });
        });

        // Typing indicator
        socket.on("typing", (data) => {
            socket.to(`conv:${data.convId}`).emit("user.typing", {
                userId: socket.userId,
            });
        });

        // Disconnect
        socket.on("disconnect", () => {
            console.log(`User${socket.userId} disconnected`);
            io.emit("user.offline", {
                userId: socket.userId,
                timestamp: Date.now(),
            });
        });
    });

    return io;
}

// Emit notification to a specific user
export async function emitNotification(io, userId, notif) {
    io.to(`user:${userId}`).emit("notification.new", notif);
}
