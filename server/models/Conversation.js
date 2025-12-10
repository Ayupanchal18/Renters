import mongoose from "mongoose";
const { Schema } = mongoose;

// Message Schema
const MessageSchema = new Schema(
    {
        sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
        text: { type: String, required: true },
        attachments: [String],
        read: { type: Boolean, default: false },
    },
    { timestamps: true }
);

// Conversation Schema
const ConversationSchema = new Schema(
    {
        participants: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
        messages: [MessageSchema],
        lastMessage: MessageSchema,
        unreadCount: { type: Map, of: Number, default: new Map() },
    },
    { timestamps: true }
);

ConversationSchema.index({ participants: 1 });

export const Conversation =
    mongoose.models.Conversation ||
    mongoose.model("Conversation", ConversationSchema);
