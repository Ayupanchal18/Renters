import mongoose from "mongoose";
const { Schema } = mongoose;

const ReviewSchema = new Schema(
    {
        propertyId: {
            type: Schema.Types.ObjectId,
            ref: 'Property',
            required: true,
            index: true
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        rating: {
            type: Number,
            min: 1,
            max: 5,
            required: true,
            index: true
        },
        comment: {
            type: String,
            default: '',
            trim: true
        },
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending',
            index: true
        },
        moderatedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },
        moderatedAt: {
            type: Date,
            default: null
        },
        rejectionReason: {
            type: String,
            default: null
        },
        // Additional helpful fields
        isVerifiedPurchase: {
            type: Boolean,
            default: false
        },
        helpfulCount: {
            type: Number,
            default: 0
        },
        reportCount: {
            type: Number,
            default: 0
        }
    },
    { timestamps: true }
);

// Compound indexes for efficient querying
ReviewSchema.index({ propertyId: 1, status: 1 });
ReviewSchema.index({ userId: 1, status: 1 });
ReviewSchema.index({ status: 1, createdAt: -1 });
ReviewSchema.index({ propertyId: 1, rating: 1 });
ReviewSchema.index({ moderatedBy: 1, moderatedAt: -1 });

// Ensure one review per user per property
ReviewSchema.index({ propertyId: 1, userId: 1 }, { unique: true });

// Text index for searching comments
ReviewSchema.index({ comment: 'text' });

export const Review =
    mongoose.models.Review || mongoose.model("Review", ReviewSchema);
