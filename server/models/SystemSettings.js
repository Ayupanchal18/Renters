import mongoose from "mongoose";
const { Schema } = mongoose;

const SystemSettingsSchema = new Schema(
    {
        key: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            index: true
        },
        value: {
            type: Schema.Types.Mixed,
            required: true
        },
        type: {
            type: String,
            enum: ['string', 'number', 'boolean', 'json'],
            default: 'string'
        },
        description: {
            type: String,
            default: ''
        },
        isPublic: {
            type: Boolean,
            default: false,
            index: true
        },
        category: {
            type: String,
            enum: ['general', 'features', 'maintenance', 'security', 'notifications', 'api'],
            default: 'general',
            index: true
        },
        updatedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        }
    },
    { timestamps: true }
);

// Compound indexes for efficient querying
SystemSettingsSchema.index({ category: 1, isPublic: 1 });
SystemSettingsSchema.index({ isPublic: 1, key: 1 });

// Static method to get a setting by key
SystemSettingsSchema.statics.getSetting = async function (key, defaultValue = null) {
    const setting = await this.findOne({ key });
    return setting ? setting.value : defaultValue;
};

// Static method to set a setting
SystemSettingsSchema.statics.setSetting = async function (key, value, options = {}) {
    const { type = 'string', description = '', isPublic = false, category = 'general', updatedBy = null } = options;

    return this.findOneAndUpdate(
        { key },
        {
            value,
            type,
            description,
            isPublic,
            category,
            updatedBy
        },
        { upsert: true, new: true }
    );
};

// Static method to get all public settings
SystemSettingsSchema.statics.getPublicSettings = async function () {
    const settings = await this.find({ isPublic: true });
    return settings.reduce((acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
    }, {});
};

export const SystemSettings =
    mongoose.models.SystemSettings || mongoose.model("SystemSettings", SystemSettingsSchema);
