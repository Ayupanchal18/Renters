// models/Favorite.js
import mongoose from "mongoose";
const { Schema } = mongoose;

const favoriteSchema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
        propertyId: { type: Schema.Types.ObjectId, ref: "Property", required: true, index: true },
    },
    { timestamps: true }
);

// ensure unique per user-property
favoriteSchema.index({ userId: 1, propertyId: 1 }, { unique: true });

export const Favorite = mongoose.models.Favorite || mongoose.model("Favorite", favoriteSchema);
