import mongoose from "mongoose";
const { Schema } = mongoose;

const UserSchema = new Schema(
    {
        name: { type: String, required: true },
        email: { type: String, index: true },
        phone: { type: String, index: true },
        address: { type: String },

        userType: {
            type: String,
            enum: ["buyer", "seller", "agent"],
            default: "buyer",
        },

        passwordHash: {
            type: String,
            required: function () {
                return this.authProvider === 'local' || !this.authProvider;
            }
        },

        // OAuth provider fields
        authProvider: {
            type: String,
            enum: ["local", "google", "facebook"],
            default: "local"
        },
        authProviderId: { type: String },
        authProviderData: { type: Object },

        role: {
            type: String,
            enum: ["user", "seller", "admin"],
            default: "user",
        },

        avatar: { type: String },
        verified: { type: Boolean, default: false },

        // New verification fields
        emailVerified: { type: Boolean, default: false },
        phoneVerified: { type: Boolean, default: false },
        emailVerifiedAt: { type: Date },
        phoneVerifiedAt: { type: Date },

        // Security tracking
        lastPasswordChange: { type: Date },
        lastLoginAt: { type: Date },

        // Password history for preventing reuse (store hashed passwords)
        passwordHistory: [{
            hash: { type: String, required: true },
            createdAt: { type: Date, default: Date.now }
        }],

        // Privacy and compliance fields
        privacySettings: {
            dataProcessing: {
                analytics: { type: Boolean, default: true },
                marketing: { type: Boolean, default: false },
                personalization: { type: Boolean, default: true },
                thirdPartySharing: { type: Boolean, default: false }
            },
            visibility: {
                profilePublic: { type: Boolean, default: false },
                showEmail: { type: Boolean, default: false },
                showPhone: { type: Boolean, default: false },
                showProperties: { type: Boolean, default: true }
            },
            communications: {
                emailMarketing: { type: Boolean, default: false },
                smsMarketing: { type: Boolean, default: false },
                pushNotifications: { type: Boolean, default: true },
                securityAlerts: { type: Boolean, default: true }
            },
            dataRetention: {
                keepSearchHistory: { type: Boolean, default: true },
                keepViewHistory: { type: Boolean, default: true },
                autoDeleteInactive: { type: Boolean, default: false },
                inactiveThresholdDays: { type: Number, default: 365 }
            }
        },

        // GDPR compliance tracking
        privacyPolicyAcceptedAt: { type: Date },
        privacyPolicyVersion: { type: String },
        termsAcceptedAt: { type: Date },
        termsVersion: { type: String },
        consentGivenAt: { type: Date },
        lastDataExportRequest: { type: Date },

        // Soft delete support
        isDeleted: { type: Boolean, default: false },
        deletedAt: { type: Date },

        // Admin management fields
        isActive: { type: Boolean, default: true },
        isBlocked: { type: Boolean, default: false },
        blockedAt: { type: Date },
        blockedReason: { type: String },
        mustChangePassword: { type: Boolean, default: false },
        lastActivityAt: { type: Date },
    },
    { timestamps: true }
);

// Additional indexes for performance optimization
UserSchema.index({ emailVerified: 1 });
UserSchema.index({ phoneVerified: 1 });
UserSchema.index({ emailVerified: 1, phoneVerified: 1 });
UserSchema.index({ userType: 1, role: 1 });
UserSchema.index({ createdAt: -1 });
UserSchema.index({ lastLoginAt: -1 });

// Admin management indexes
UserSchema.index({ isActive: 1 });
UserSchema.index({ isBlocked: 1 });
UserSchema.index({ lastActivityAt: -1 });
UserSchema.index({ isActive: 1, isBlocked: 1 });
UserSchema.index({ role: 1, isActive: 1, isBlocked: 1 });

export const User =
    mongoose.models.User || mongoose.model("User", UserSchema);
