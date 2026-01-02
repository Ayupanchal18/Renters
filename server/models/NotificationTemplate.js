import mongoose from "mongoose";
const { Schema } = mongoose;

/**
 * NotificationTemplate Model
 * Stores reusable notification templates for admin-sent notifications
 */
const NotificationTemplateSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            index: true
        },
        slug: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
            index: true
        },
        subject: {
            type: String,
            required: true,
            trim: true
        },
        body: {
            type: String,
            required: true
        },
        // Supported channels for this template
        channels: {
            email: { type: Boolean, default: true },
            sms: { type: Boolean, default: false },
            push: { type: Boolean, default: false }
        },
        // Template variables that can be substituted
        variables: [{
            name: { type: String, required: true },
            description: { type: String },
            required: { type: Boolean, default: false },
            defaultValue: { type: String }
        }],
        // Category for organization
        category: {
            type: String,
            enum: ['system', 'marketing', 'transactional', 'security', 'custom'],
            default: 'custom',
            index: true
        },
        isActive: {
            type: Boolean,
            default: true,
            index: true
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        updatedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        }
    },
    { timestamps: true }
);

// Indexes
NotificationTemplateSchema.index({ category: 1, isActive: 1 });
NotificationTemplateSchema.index({ name: 'text', subject: 'text' });

export const NotificationTemplate =
    mongoose.models.NotificationTemplate ||
    mongoose.model("NotificationTemplate", NotificationTemplateSchema);
