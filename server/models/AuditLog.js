import mongoose from "mongoose";
const { Schema } = mongoose;

const AuditLogSchema = new Schema(
    {
        adminId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        action: {
            type: String,
            required: true,
            enum: ['CREATE', 'UPDATE', 'DELETE', 'BLOCK', 'UNBLOCK', 'ACTIVATE', 'DEACTIVATE', 'ROLE_CHANGE', 'PASSWORD_RESET', 'LOGIN', 'LOGOUT', 'APPROVE', 'REJECT', 'EXPORT', 'VIEW', 'GENERATE_REPORT', 'EXPORT_DATA'],
            index: true
        },
        resourceType: {
            type: String,
            required: true,
            enum: ['user', 'property', 'location', 'category', 'content', 'review', 'notification', 'settings', 'report', 'conversation', 'verification', 'user_report', 'property_report', 'user_export', 'property_export', 'activity_export'],
            index: true
        },
        resourceId: {
            type: Schema.Types.ObjectId,
            index: true
        },
        changes: {
            type: Schema.Types.Mixed,
            default: null
        },
        previousValues: {
            type: Schema.Types.Mixed,
            default: null
        },
        ipAddress: {
            type: String
        },
        userAgent: {
            type: String
        },
        timestamp: {
            type: Date,
            default: Date.now,
            index: true
        },
        metadata: {
            type: Schema.Types.Mixed,
            default: null
        }
    },
    { timestamps: true }
);

// Compound indexes for efficient querying
AuditLogSchema.index({ adminId: 1, timestamp: -1 });
AuditLogSchema.index({ resourceType: 1, resourceId: 1 });
AuditLogSchema.index({ action: 1, timestamp: -1 });
AuditLogSchema.index({ resourceType: 1, action: 1, timestamp: -1 });
AuditLogSchema.index({ timestamp: -1, action: 1 });
AuditLogSchema.index({ adminId: 1, action: 1, timestamp: -1 });

// Enforce application-layer immutability
AuditLogSchema.pre('save', function (next) {
    if (!this.isNew) {
        return next(new Error('Audit logs are immutable and cannot be modified'));
    }
    next();
});

const blockUpdate = function (next) {
    next(new Error('Audit logs are immutable and cannot be updated'));
};

AuditLogSchema.pre('updateOne', { document: true, query: true }, blockUpdate);
AuditLogSchema.pre('updateMany', blockUpdate);
AuditLogSchema.pre('findOneAndUpdate', blockUpdate);
AuditLogSchema.pre('findByIdAndUpdate', blockUpdate);

const blockDelete = function (next) {
    next(new Error('Audit logs are immutable and cannot be deleted'));
};

AuditLogSchema.pre('remove', blockDelete);
AuditLogSchema.pre('deleteOne', { document: true, query: true }, blockDelete);
AuditLogSchema.pre('deleteMany', blockDelete);
AuditLogSchema.pre('findOneAndDelete', blockDelete);
AuditLogSchema.pre('findByIdAndDelete', blockDelete);

export const AuditLog =
    mongoose.models.AuditLog || mongoose.model("AuditLog", AuditLogSchema);
