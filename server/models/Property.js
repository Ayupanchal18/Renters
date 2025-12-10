
import mongoose from "mongoose";
const { Schema } = mongoose;

// Geo schema (no _id)
const GeoSchema = new Schema(
    {
        type: { type: String, enum: ["Point"], default: "Point" },
        coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
    },
    { _id: false }
);

const propertySchema = new mongoose.Schema(
    {
        // identity
        listingNumber: { type: String, unique: true, index: true }, // human-friendly
        slug: { type: String, unique: true, index: true }, // seo-friendly path

        // core fields
        category: {
            type: String,
            enum: ["room", "flat", "house", "pg", "hostel", "commercial"],
            required: true,
        },
        title: { type: String, required: true, trim: true },
        propertyType: { type: String, required: true }, // Single Room, 1BHK etc
        description: { type: String, default: "" },
        furnishing: {
            type: String,
            enum: ["unfurnished", "semi", "fully"],
            required: true,
        },
        availableFrom: { type: Date, required: true },
        city: { type: String, required: true, index: true },
        address: { type: String, required: true },

        mapLocation: { type: String, default: "" },

        monthlyRent: { type: Number, required: true },
        securityDeposit: { type: Number, default: 0 },
        maintenanceCharge: { type: Number, default: 0 },

        negotiable: { type: Boolean, default: false },

        // room specific
        roomType: { type: String, default: "" }, // single/double
        bathroomType: { type: String, default: "" }, // attached / common
        kitchenAvailable: { type: Boolean, default: false },

        // dims
        builtUpArea: { type: Number, default: null },
        carpetArea: { type: Number, default: null },

        bedrooms: { type: Number, default: null },
        bathrooms: { type: Number, default: null },
        balconies: { type: Number, default: null },

        floorNumber: { type: Number, default: null },
        totalFloors: { type: Number, default: null },

        facingDirection: { type: String, default: "" },
        parking: { type: String, default: "" },
        propertyAge: { type: String, default: "" },

        washroom: { type: String, default: "" },
        frontage: { type: String, default: "" },

        amenities: [{ type: String }], // array of strings
        photos: [{ type: String }], // cloud URLs

        // Owner info
        ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        ownerName: { type: String, required: true },
        ownerPhone: { type: String, required: true },
        ownerEmail: { type: String, default: "" },
        ownerType: { type: String, enum: ["owner", "agent", "builder"], default: "owner" },

        // admin / status
        status: { type: String, enum: ["active", "inactive", "blocked"], default: "active" },
        isDeleted: { type: Boolean, default: false },

        // metrics
        views: { type: Number, default: 0 },
        favoritesCount: { type: Number, default: 0 },
        featured: { type: Boolean, default: false },

        // geo
        location: GeoSchema,
    },
    { timestamps: true }
);

// indexes
propertySchema.index({ location: "2dsphere" });
propertySchema.index({ title: "text", city: "text", address: "text" }); // text search

export const Property = mongoose.models.Property || mongoose.model("Property", propertySchema);
