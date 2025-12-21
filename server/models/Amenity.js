import mongoose from "mongoose";
const { Schema } = mongoose;

/**
 * Amenity Model
 * Stores the list of available amenities that can be selected for properties
 * 
 * Requirements: 5.5 - Allow add, edit, and delete operations for amenities
 */
const AmenitySchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        slug: {
            type: String,
            unique: true,
            lowercase: true,
            trim: true
        },
        icon: {
            type: String,
            default: null
        },
        category: {
            type: String,
            enum: ['basic', 'comfort', 'security', 'recreation', 'utility', 'other'],
            default: 'other'
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
        }
    },
    { timestamps: true }
);

// Compound indexes for efficient querying
AmenitySchema.index({ isActive: 1, order: 1 });
AmenitySchema.index({ category: 1, isActive: 1 });
AmenitySchema.index({ name: 'text' });

// Pre-save hook to generate slug from name
AmenitySchema.pre('save', function (next) {
    if (this.isModified('name') || !this.slug) {
        this.slug = this.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    }
    next();
});

export const Amenity =
    mongoose.models.Amenity || mongoose.model("Amenity", AmenitySchema);
