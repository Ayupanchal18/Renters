import mongoose from "mongoose";
const { Schema } = mongoose;

const WishlistSchema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        property: {
            type: Schema.Types.ObjectId,
            ref: "Property",
            required: true,
            index: true,
        },
    },
    { timestamps: true }
);

// Prevent same user from adding same property twice
WishlistSchema.index({ user: 1, property: 1 }, { unique: true });

export const Wishlist =
    mongoose.models.Wishlist || mongoose.model("Wishlist", WishlistSchema);
