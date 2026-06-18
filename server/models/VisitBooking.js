import mongoose from "mongoose";
const { Schema } = mongoose;

const visitBookingSchema = new Schema(
    {
        propertyId: {
            type: Schema.Types.ObjectId,
            ref: "Property",
            required: true,
            index: true
        },
        ownerId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        tenantId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        slotStart: {
            type: Date,
            required: true
        },
        slotEnd: {
            type: Date,
            required: true
        },
        status: {
            type: String,
            enum: ["pending", "confirmed", "cancelled", "completed"],
            default: "pending",
            index: true
        },
        notes: {
            type: String,
            default: ""
        }
    },
    { timestamps: true }
);

// Indexes for fast querying of bookings by properties, owner, or tenant
visitBookingSchema.index({ propertyId: 1, slotStart: 1, status: 1 });
visitBookingSchema.index({ ownerId: 1, status: 1, slotStart: 1 });
visitBookingSchema.index({ tenantId: 1, status: 1, slotStart: 1 });

export const VisitBooking =
    mongoose.models.VisitBooking ||
    mongoose.model("VisitBooking", visitBookingSchema);
