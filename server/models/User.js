import mongoose from "mongoose";
const { Schema } = mongoose;

const UserSchema = new Schema(
    {
        name: { type: String, required: true },
        email: { type: String, index: true },
        phone: { type: String, index: true },
        address: { type: String },

        userType: {
            type: String,
            enum: ["buyer", "seller", "agent"],
            default: "buyer",
        },

        passwordHash: { type: String, required: true },

        role: {
            type: String,
            enum: ["user", "seller", "admin"],
            default: "user",
        },

        avatar: { type: String },
        verified: { type: Boolean, default: false },
    },
    { timestamps: true }
);

export const User =
    mongoose.models.User || mongoose.model("User", UserSchema);
