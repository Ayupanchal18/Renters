import mongoose from "mongoose";

const legalRequestSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            required: true,
            enum: [
                "dpdp_opt_out",
                "dpdp_erasure",
                "dpdp_access",
                "dpdp_correction",
                "dpdp_nomination",
                "dmca_takedown",
                "scam_report",
                "fair_housing_report",
                "contact_inquiry",
                "newsletter_subscriber",
                "campaign_subscriber"
            ],
            index: true
        },
        applicantName: {
            type: String,
            required: true,
            trim: true
        },
        applicantEmail: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            index: true
        },
        applicantPhone: {
            type: String,
            trim: true,
            default: ""
        },
        targetUrl: {
            type: String,
            trim: true,
            default: ""
        },
        details: {
            type: String,
            required: true,
            trim: true
        },
        status: {
            type: String,
            enum: ["pending", "under_review", "resolved", "rejected"],
            default: "pending",
            index: true
        },
        slaDeadline: {
            type: Date,
            required: true,
            index: true
        },
        resolutionNotes: {
            type: String,
            default: ""
        },
        resolvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },
        ipAddress: {
            type: String,
            default: ""
        },
        userAgent: {
            type: String,
            default: ""
        }
    },
    {
        timestamps: true
    }
);

// Calculate SLA Deadline before validation (DMCA: 36 Hours, DPDP/Scam: 7 Days)
legalRequestSchema.pre("validate", function (next) {
    if (!this.slaDeadline) {
        const now = new Date();
        if (this.type === "dmca_takedown") {
            // 36-hour SLA under IT Intermediary Rules
            this.slaDeadline = new Date(now.getTime() + 36 * 60 * 60 * 1000);
        } else {
            // 7-day SLA under DPDP Act & Fraud guidelines
            this.slaDeadline = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        }
    }
    next();
});

export const LegalRequest = mongoose.models.LegalRequest || mongoose.model("LegalRequest", legalRequestSchema);
