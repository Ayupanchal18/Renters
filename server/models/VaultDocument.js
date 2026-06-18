import mongoose from "mongoose";
const { Schema } = mongoose;

const VaultDocumentSchema = new Schema(
    {
        userId: { 
            type: Schema.Types.ObjectId, 
            ref: "User", 
            required: true, 
            index: true 
        },
        type: {
            type: String,
            enum: ["id_proof", "address_proof", "income_proof", "reference_letter", "other"],
            required: true
        },
        filename: { type: String, required: true },
        mimetype: { type: String, required: true },
        publicId: { type: String, required: true },
        storageUrl: { type: String, required: true },
        status: {
            type: String,
            enum: ["pending", "verified", "rejected"],
            default: "pending",
            index: true
        },
        uploadedAt: { type: Date, default: Date.now },
        reviewedAt: { type: Date },
        reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
        rejectionReason: { type: String }
    },
    { timestamps: true }
);

// Optimize searches for a user's specific document status
VaultDocumentSchema.index({ userId: 1, type: 1, status: 1 });

export const VaultDocument = mongoose.models.VaultDocument || mongoose.model("VaultDocument", VaultDocumentSchema);
export default VaultDocument;
