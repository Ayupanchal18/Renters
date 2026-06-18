import { Router } from "express";
import { VisitBooking } from "../models/VisitBooking.js";
import { Property } from "../models/Property.js";
import { Conversation } from "../models/Conversation.js";
import { Notification } from "../models/Notification.js";
import { authenticateToken } from "../src/middleware/security.js";
import { connectDB } from "../src/config/db.js";
import messageService from "../src/services/messageService.js";
import messageNotificationService from "../src/services/messageNotificationService.js";
import { getIO } from "../socket.js";

const router = Router();

/**
 * GET /api/bookings/me
 * Retrieves user's bookings where they are either the tenant or the property owner
 */
router.get("/me", authenticateToken, async (req, res) => {
    try {
        await connectDB();
        const userId = req.user._id;

        const tenantBookings = await VisitBooking.find({ tenantId: userId })
            .populate("propertyId", "title photos monthlyRent city address listingType sellingPrice")
            .populate("ownerId", "name email phone avatar")
            .sort({ slotStart: 1 })
            .lean();

        const ownerBookings = await VisitBooking.find({ ownerId: userId })
            .populate("propertyId", "title photos monthlyRent city address listingType sellingPrice")
            .populate("tenantId", "name email phone avatar")
            .sort({ slotStart: 1 })
            .lean();

        res.json({
            success: true,
            tenant: tenantBookings,
            owner: ownerBookings
        });
    } catch (err) {
        console.error("GET /api/bookings/me error:", err);
        res.status(500).json({ success: false, error: "Server error", message: err.message });
    }
});

/**
 * PATCH /api/bookings/:id
 * Updates booking status (confirm, decline, cancel)
 */
router.patch("/:id", authenticateToken, async (req, res) => {
    try {
        await connectDB();
        const { id } = req.params;
        const { status } = req.body;

        if (!status || !["confirmed", "cancelled", "completed"].includes(status)) {
            return res.status(400).json({ success: false, error: "Invalid status. Must be confirmed, cancelled, or completed" });
        }

        const booking = await VisitBooking.findById(id);
        if (!booking) {
            return res.status(404).json({ success: false, error: "Booking not found" });
        }

        const isOwner = booking.ownerId.toString() === req.user._id.toString();
        const isTenant = booking.tenantId.toString() === req.user._id.toString();

        if (!isOwner && !isTenant) {
            return res.status(403).json({ success: false, error: "Unauthorized to update this booking" });
        }

        if (isTenant && status !== "cancelled") {
            return res.status(400).json({ success: false, error: "Tenants can only cancel their own bookings" });
        }

        booking.status = status;
        await booking.save();

        // Send follow-up update message to the chat conversation
        try {
            const conv = await Conversation.findOne({
                participants: { $all: [booking.tenantId, booking.ownerId] },
                property: booking.propertyId
            });

            if (conv) {
                const now = new Date();
                let statusText = "";
                if (status === "confirmed") {
                    statusText = `Visit confirmed for ${new Date(booking.slotStart).toLocaleString()}`;
                } else if (status === "cancelled") {
                    statusText = isTenant ? `Tenant cancelled the visit request` : `Owner declined the visit request`;
                } else if (status === "completed") {
                    statusText = `Visit marked as completed`;
                }

                // Update original booking_request message in the conversation if exists
                const originalMsg = conv.messages.find(
                    msg => msg.type === "booking_request" && 
                    msg.booking && 
                    msg.booking.bookingId &&
                    msg.booking.bookingId.toString() === booking._id.toString()
                );
                if (originalMsg) {
                    originalMsg.booking.status = status;
                }

                const property = await Property.findById(booking.propertyId).lean();
                const thumbnail = property?.photos && property.photos[0] ? property.photos[0] : "";

                const message = {
                    sender: req.user._id,
                    text: statusText,
                    type: "booking_update",
                    booking: {
                        bookingId: booking._id,
                        propertyTitle: property?.title || "",
                        propertyThumbnail: thumbnail,
                        slotStart: booking.slotStart,
                        slotEnd: booking.slotEnd,
                        status: status,
                        notes: booking.notes
                    },
                    read: false,
                    createdAt: now,
                    updatedAt: now
                };

                conv.messages.push(message);
                conv.lastMessage = {
                    sender: req.user._id,
                    text: `📅 Visit Update: ${status}`,
                    createdAt: now
                };
                conv.lastActivityAt = now;

                const recipientId = isOwner ? booking.tenantId : booking.ownerId;
                const recipientIdStr = recipientId.toString();
                const unreadCount = conv.unreadCount || new Map();
                const currentCount = unreadCount.get(recipientIdStr) || 0;
                unreadCount.set(recipientIdStr, currentCount + 1);
                conv.unreadCount = unreadCount;

                await conv.save();

                const io = getIO();
                if (io) {
                    const savedMsg = conv.messages[conv.messages.length - 1];
                    const messageWithSender = {
                        ...savedMsg.toObject(),
                        sender: {
                            _id: req.user._id,
                            name: req.user.name || "User",
                            avatar: req.user.avatar
                        }
                    };
                    io.to(`conv:${conv._id}`).emit("message.new", {
                        conversationId: conv._id,
                        message: messageWithSender
                    });

                    // Create in-app system notification
                    const notification = new Notification({
                        recipient: recipientId,
                        type: "system",
                        title: `Visit Request ${status.charAt(0).toUpperCase() + status.slice(1)}`,
                        message: `Your visit booking for ${property?.title || "property"} on ${new Date(booking.slotStart).toLocaleDateString()} has been ${status}`,
                        data: {
                            propertyId: booking.propertyId,
                            senderId: req.user._id,
                            conversationId: conv._id
                        }
                    });
                    await notification.save();

                    io.to(`user:${recipientId}`).emit("notification.new", {
                        notification
                    });

                    // Broadcast unread counts
                    const messageCountResult = await messageService.getUnreadMessageCount(recipientId);
                    const mCount = messageCountResult.success ? messageCountResult.count : 0;
                    const notificationCountResult = await messageNotificationService.getUnreadNotificationCount(recipientId);
                    const nCount = notificationCountResult.success ? notificationCountResult.count : 0;

                    io.to(`user:${recipientId}`).emit("unread.update", {
                        messages: mCount,
                        notifications: nCount
                    });
                }
            }
        } catch (chatErr) {
            console.error("Chat integration error for booking update:", chatErr);
        }

        res.json({
            success: true,
            message: `Booking status updated to ${status}`,
            booking
        });
    } catch (err) {
        console.error("PATCH /api/bookings/:id error:", err);
        res.status(500).json({ success: false, error: "Server error", message: err.message });
    }
});

export default router;
