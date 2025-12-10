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
            enum: ["message", "property", "favorite", "offer"],
            required: true,
        },
        title: { type: String, required: true },
        message: { type: String, required: true },
        read: { type: Boolean, default: false },
        data: Schema.Types.Mixed,
    },
    { timestamps: true }
);

export const Notification =
    mongoose.models.Notification ||
    mongoose.model("Notification", NotificationSchema);
