import mongoose from "mongoose";
const { Schema } = mongoose;

const NotificationPreferencesSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
            index: true,
        },

        // Security event notification preferences
        securityEvents: {
            passwordChange: {
                email: { type: Boolean, default: true },
                sms: { type: Boolean, default: false },
            },
            phoneUpdate: {
                email: { type: Boolean, default: true },
                sms: { type: Boolean, default: true },
            },
            accountDeletion: {
                email: { type: Boolean, default: true },
                sms: { type: Boolean, default: false },
            },
            loginFromNewDevice: {
                email: { type: Boolean, default: true },
                sms: { type: Boolean, default: false },
            },
            failedLoginAttempts: {
                email: { type: Boolean, default: true },
                sms: { type: Boolean, default: false },
            },
        },

        // General notification preferences
        general: {
            propertyUpdates: {
                email: { type: Boolean, default: true },
                sms: { type: Boolean, default: false },
            },
            messages: {
                email: { type: Boolean, default: true },
                sms: { type: Boolean, default: false },
            },
            marketing: {
                email: { type: Boolean, default: false },
                sms: { type: Boolean, default: false },
            },
        },

        // Global preferences
        globalSettings: {
            emailEnabled: { type: Boolean, default: true },
            smsEnabled: { type: Boolean, default: false },
            quietHours: {
                enabled: { type: Boolean, default: false },
                startTime: { type: String, default: "22:00" }, // 24-hour format
                endTime: { type: String, default: "08:00" },
                timezone: { type: String, default: "UTC" },
            },
        },
    },
    { timestamps: true }
);

// Create default preferences for a user
NotificationPreferencesSchema.statics.createDefault = async function (userId) {
    try {
        const defaultPreferences = new this({ userId });
        return await defaultPreferences.save();
    } catch (error) {
        if (error.code === 11000) {
            // Preferences already exist, return existing
            return await this.findOne({ userId });
        }
        throw error;
    }
};

// Get preferences for a user, create default if not exists
NotificationPreferencesSchema.statics.getOrCreate = async function (userId) {
    let preferences = await this.findOne({ userId });
    if (!preferences) {
        preferences = await this.createDefault(userId);
    }
    return preferences;
};

export const NotificationPreferences =
    mongoose.models.NotificationPreferences ||
    mongoose.model("NotificationPreferences", NotificationPreferencesSchema);