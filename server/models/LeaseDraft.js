import mongoose from "mongoose";
const { Schema } = mongoose;

const LeaseDraftSchema = new Schema(
    {
        propertyId: { 
            type: Schema.Types.ObjectId, 
            ref: "Property", 
            required: true, 
            index: true 
        },
        ownerId: { 
            type: Schema.Types.ObjectId, 
            ref: "User", 
            required: true, 
            index: true 
        },
        tenantId: { 
            type: Schema.Types.ObjectId, 
            ref: "User", 
            required: true, 
            index: true 
        },
        status: {
            type: String,
            enum: ["draft", "sent", "signed_by_tenant", "signed_by_owner", "completed"],
            default: "draft",
            index: true
        },
        terms: {
            rentAmount: { type: Number, required: true },
            securityDeposit: { type: Number, default: 0 },
            leaseStartDate: { type: Date, required: true },
            leaseEndDate: { type: Date, required: true },
            noticePeriodDays: { type: Number, default: 30 },
            additionalClauses: { type: String, default: "" }
        },
        ownerSignature: { type: String }, // Stores base64 drawing data URI
        tenantSignature: { type: String }, // Stores base64 drawing data URI
        signedAtOwner: { type: Date },
        signedAtTenant: { type: Date },
        completedAt: { type: Date }
    },
    { timestamps: true }
);

// Performance indexes for lease participants
LeaseDraftSchema.index({ ownerId: 1, status: 1 });
LeaseDraftSchema.index({ tenantId: 1, status: 1 });
LeaseDraftSchema.index({ propertyId: 1 });

export const LeaseDraft = mongoose.models.LeaseDraft || mongoose.model("LeaseDraft", LeaseDraftSchema);
export default LeaseDraft;
