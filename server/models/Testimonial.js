import mongoose from "mongoose";
const { Schema } = mongoose;

/**
 * Testimonial Model
 * Stores testimonials/reviews displayed on the homepage
 */
const TestimonialSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        role: {
            type: String,
            required: true,
            trim: true
        },
        location: {
            type: String,
            required: true,
            trim: true
        },
        content: {
            type: String,
            required: true,
            trim: true
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
            default: 5
        },
        image: {
            type: String,
            default: null
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

// Index for efficient querying
TestimonialSchema.index({ isActive: 1, order: 1 });

export const Testimonial =
    mongoose.models.Testimonial || mongoose.model("Testimonial", TestimonialSchema);
