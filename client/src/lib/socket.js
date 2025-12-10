import { io } from "socket.io-client";
let socket = null;
export function connectSocket(userId) {
    if (socket && socket.connected)
        return socket;
    socket = io("", {
        auth: { userId },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
    });
    socket.on("connect", () => {
        console.log("Socket connected:", socket?.id);
        socket?.emit("user.online");
    });
    socket.on("disconnect", () => {
        console.log("Socket disconnected");
    });
    socket.on("error", (err) => {
        console.error("Socket error:", err);
    });
    return socket;
}
export function getSocket() {
    return socket;
}
export function disconnectSocket() {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
}
// Event listeners
export function onMessageReceived(callback) {
    if (socket)
        socket.on("message.new", callback);
}
export function onNotification(callback) {
    if (socket)
        socket.on("notification.new", callback);
}
export function onUserTyping(callback) {
    if (socket)
        socket.on("user.typing", callback);
}
export function onUserOnline(callback) {
    if (socket)
        socket.on("user.online", callback);
}
export function onUserOffline(callback) {
    if (socket)
        socket.on("user.offline", callback);
}
