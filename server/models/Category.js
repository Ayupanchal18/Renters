import mongoose from "mongoose";
const { Schema } = mongoose;

const CategorySchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        slug: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        description: {
            type: String,
            default: ''
        },
        isActive: {
            type: Boolean,
            default: true,
            index: true
        },
        order: {
            type: Number,
            default: 0,
            index: true
        },
        icon: {
            type: String,
            default: null
        },
        propertyCount: {
            type: Number,
            default: 0
        }
    },
    { timestamps: true }
);

// Compound indexes for efficient querying
CategorySchema.index({ isActive: 1, order: 1 });
CategorySchema.index({ name: 'text', description: 'text' });

// Pre-save hook to generate slug from name if not provided
CategorySchema.pre('save', function (next) {
    if (this.isModified('name') && !this.slug) {
        this.slug = this.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    }
    next();
});

export const Category =
    mongoose.models.Category || mongoose.model("Category", CategorySchema);
