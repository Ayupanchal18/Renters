import mongoose from "mongoose";
const { Schema } = mongoose;

const NotificationSchema = new Schema(
    {
        recipient: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        type: {
            type: String,
            enum: ["message", "property", "favorite", "offer", "system"],
            required: true,
        },
        title: { type: String, required: true },
        message: { type: String, required: true },
        read: { type: Boolean, default: false, index: true },
        readAt: { type: Date },
        data: {
            conversationId: { type: Schema.Types.ObjectId, ref: "Conversation" },
            propertyId: { type: Schema.Types.ObjectId, ref: "Property" },
            senderId: { type: Schema.Types.ObjectId, ref: "User" },
            messageId: { type: Schema.Types.ObjectId }
        },
        isDeleted: { type: Boolean, default: false }
    },
    { timestamps: true }
);

// Indexes for query optimization
NotificationSchema.index({ recipient: 1, read: 1 });
NotificationSchema.index({ recipient: 1, createdAt: -1 });
NotificationSchema.index({ recipient: 1, type: 1, "data.conversationId": 1 });

export const Notification =
    mongoose.models.Notification ||
    mongoose.model("Notification", NotificationSchema);
