import mongoose from "mongoose";
const { Schema } = mongoose;

const LocationSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        type: {
            type: String,
            enum: ['city', 'area', 'state'],
            required: true,
            index: true
        },
        parentId: {
            type: Schema.Types.ObjectId,
            ref: 'Location',
            default: null,
            index: true
        },
        isVisible: {
            type: Boolean,
            default: true,
            index: true
        },
        propertyCount: {
            type: Number,
            default: 0
        },
        slug: {
            type: String,
            unique: true,
            sparse: true
        },
        coordinates: {
            latitude: { type: Number },
            longitude: { type: Number }
        }
    },
    { timestamps: true }
);

// Compound indexes for efficient querying
LocationSchema.index({ type: 1, isVisible: 1 });
LocationSchema.index({ parentId: 1, isVisible: 1 });
LocationSchema.index({ name: 1, type: 1 });
LocationSchema.index({ name: 'text' });

// Pre-save hook to generate slug
LocationSchema.pre('save', function (next) {
    if (this.isModified('name') || !this.slug) {
        this.slug = this.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    }
    next();
});

export const Location =
    mongoose.models.Location || mongoose.model("Location", LocationSchema);
