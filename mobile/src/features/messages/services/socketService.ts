import { io, Socket } from "socket.io-client";
import { env } from "../../../config/env";

let socket: Socket | null = null;

export const socketService = {
  connect(token: string) {
    if (socket && socket.connected) {
      return socket;
    }

    if (socket) {
      socket.disconnect();
    }

    // Connect to the API base URL (e.g., http://172.20.10.3:8080)
    socket = io(env.apiBaseUrl, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      reconnectionAttempts: 10,
      timeout: 5000,
    });

    socket.on("connect", () => {
      console.log("WebSocket connected:", socket?.id);
    });

    socket.on("connect_error", (error) => {
      console.warn("WebSocket connection error:", error.message);
    });

    socket.on("disconnect", (reason) => {
      console.log("WebSocket disconnected:", reason);
    });

    return socket;
  },

  disconnect() {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  },

  getSocket() {
    return socket;
  },

  isConnected() {
    return socket?.connected || false;
  },

  joinConversation(conversationId: string) {
    if (socket && conversationId) {
      socket.emit("join_conversation", conversationId);
    }
  },

  leaveConversation(conversationId: string) {
    if (socket && conversationId) {
      socket.emit("leave_conversation", conversationId);
    }
  },

  sendTypingStart(conversationId: string) {
    if (socket && conversationId) {
      socket.emit("typing.start", { conversationId });
    }
  },

  sendTypingStop(conversationId: string) {
    if (socket && conversationId) {
      socket.emit("typing.stop", { conversationId });
    }
  },

  onMessageNew(callback: (data: { conversationId: string; message: any }) => void) {
    if (socket) {
      socket.on("message.new", callback);
    }
  },

  offMessageNew(callback?: (data: { conversationId: string; message: any }) => void) {
    if (socket) {
      if (callback) {
        socket.off("message.new", callback);
      } else {
        socket.off("message.new");
      }
    }
  },

  onMessageReadUpdate(callback: (data: { conversationId: string; userId: string; markedCount: number }) => void) {
    if (socket) {
      socket.on("message.read_update", callback);
    }
  },

  offMessageReadUpdate(callback?: (data: { conversationId: string; userId: string; markedCount: number }) => void) {
    if (socket) {
      if (callback) {
        socket.off("message.read_update", callback);
      } else {
        socket.off("message.read_update");
      }
    }
  },

  onUserTyping(callback: (data: { conversationId: string; userId: string; userName: string; isTyping: boolean }) => void) {
    if (socket) {
      socket.on("user.typing", callback);
    }
  },

  offUserTyping(callback?: (data: { conversationId: string; userId: string; userName: string; isTyping: boolean }) => void) {
    if (socket) {
      if (callback) {
        socket.off("user.typing", callback);
      } else {
        socket.off("user.typing");
      }
    }
  },

  onUnreadUpdate(callback: (data: { messages: number; notifications: number }) => void) {
    if (socket) {
      socket.on("unread.update", callback);
    }
  },

  offUnreadUpdate(callback?: (data: { messages: number; notifications: number }) => void) {
    if (socket) {
      if (callback) {
        socket.off("unread.update", callback);
      } else {
        socket.off("unread.update");
      }
    }
  },
};

export default socketService;
