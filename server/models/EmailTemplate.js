import mongoose from "mongoose";

const emailTemplateSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },
        category: {
            type: String,
            required: true,
            enum: ["promotional", "newsletter", "property_alert", "onboarding", "system"],
            default: "promotional",
            index: true
        },
        subject: {
            type: String,
            required: true,
            trim: true
        },
        htmlCode: {
            type: String,
            required: true
        },
        description: {
            type: String,
            trim: true,
            default: ""
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        }
    },
    {
        timestamps: true
    }
);

export const EmailTemplate = mongoose.models.EmailTemplate || mongoose.model("EmailTemplate", emailTemplateSchema);
