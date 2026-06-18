import mongoose from "mongoose";
const { Schema } = mongoose;

const VerificationRequestSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        documentType: {
            type: String,
            required: true,
            enum: ['RERA', 'PAN', 'LICENSE', 'PASSPORT']
        },
        documentNumber: {
            type: String,
            required: true
        },
        documentUrl: {
            type: String,
            required: true
        },
        extractedData: {
            type: Schema.Types.Mixed,
            default: null
        },
        status: {
            type: String,
            required: true,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending',
            index: true
        },
        remarks: {
            type: String,
            default: null
        },
        verifiedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },
        verifiedAt: {
            type: Date,
            default: null
        }
    },
    { timestamps: true }
);

// Compound index for status filtering and fast queue retrievals
VerificationRequestSchema.index({ status: 1, createdAt: -1 });

export const VerificationRequest =
    mongoose.models.VerificationRequest || mongoose.model("VerificationRequest", VerificationRequestSchema);
