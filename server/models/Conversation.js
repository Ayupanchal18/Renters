import mongoose from "mongoose";
const { Schema } = mongoose;

// Message Schema (Enhanced)
const MessageSchema = new Schema(
    {
        sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
        text: { type: String, maxlength: 5000, default: '' },
        attachments: [String], // Legacy field - kept for backward compatibility
        file: {
            originalName: String,
            filename: String,
            mimetype: String,
            size: Number,
            url: String
        },
        image: String, // For backward compatibility with existing image messages
        type: {
            type: String,
            enum: ["text", "image", "file", "system"],
            default: "text"
        },
        read: { type: Boolean, default: false },
        readAt: { type: Date },
        isDeleted: { type: Boolean, default: false },
        deletedAt: { type: Date }
    },
    { timestamps: true }
);

// Conversation Schema (Enhanced)
const ConversationSchema = new Schema(
    {
        participants: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
        property: {
            type: Schema.Types.ObjectId,
            ref: "Property",
            required: true
        },
        messages: [MessageSchema],
        lastMessage: {
            sender: { type: Schema.Types.ObjectId, ref: "User" },
            text: String,
            createdAt: Date
        },
        lastActivityAt: { type: Date, default: Date.now },
        unreadCount: { type: Map, of: Number, default: new Map() },
        isActive: { type: Boolean, default: true }
    },
    { timestamps: true }
);

// Indexes for query optimization
ConversationSchema.index({ participants: 1 });
ConversationSchema.index({ property: 1 });
// Note: Unique constraint on participants + property is enforced at application level
// because MongoDB array indexes don't work well with unique constraints for this use case
ConversationSchema.index({ participants: 1, property: 1 });
ConversationSchema.index({ lastActivityAt: -1 });

export const Conversation =
    mongoose.models.Conversation ||
    mongoose.model("Conversation", ConversationSchema);

export { MessageSchema };
