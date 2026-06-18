import mongoose from "mongoose";
const { Schema } = mongoose;

const availabilitySlotSchema = new Schema(
    {
        ownerId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        propertyId: {
            type: Schema.Types.ObjectId,
            ref: "Property",
            required: true,
            index: true
        },
        type: {
            type: String,
            enum: ["recurring", "override"],
            required: true
        },
        dayOfWeek: {
            type: Number,
            min: 0,
            max: 6
        }, // 0 = Sunday, 6 = Saturday (used for recurring weekly template)
        specificDate: {
            type: Date
        }, // Date overrides
        startTime: {
            type: String,
            required: true
        }, // "HH:MM" format (e.g. "10:00")
        endTime: {
            type: String,
            required: true
        }, // "HH:MM" format (e.g. "18:00")
        slotDurationMinutes: {
            type: Number,
            default: 30
        },
        isActive: {
            type: Boolean,
            default: true
        }
    },
    { timestamps: true }
);

// Compound indexes for fast lookup during availability matching
availabilitySlotSchema.index({ propertyId: 1, type: 1, isActive: 1 });
availabilitySlotSchema.index({ ownerId: 1 });

export const AvailabilitySlot =
    mongoose.models.AvailabilitySlot ||
    mongoose.model("AvailabilitySlot", availabilitySlotSchema);
