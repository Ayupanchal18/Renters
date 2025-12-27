
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
        // Listing type discriminator (rent vs buy) - immutable after creation
        listingType: {
            type: String,
            enum: ["rent", "buy"],
            required: true,
            index: true,
            immutable: true
        },

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

        // RENT-SPECIFIC FIELDS (validated only when listingType="rent")
        monthlyRent: { type: Number },
        securityDeposit: { type: Number, default: 0 },
        maintenanceCharge: { type: Number, default: 0 },
        rentNegotiable: { type: Boolean, default: false },
        preferredTenants: {
            type: String,
            enum: ["family", "bachelor", "any"],
            default: "any"
        },
        leaseDuration: { type: String, default: "" },

        // BUY-SPECIFIC FIELDS (validated only when listingType="buy")
        sellingPrice: { type: Number },
        pricePerSqft: { type: Number },
        possessionStatus: {
            type: String,
            enum: ["ready", "under_construction", "resale"],
            default: "ready"
        },
        bookingAmount: { type: Number, default: 0 },
        loanAvailable: { type: Boolean, default: true },

        // Legacy field - kept for backward compatibility, use rentNegotiable instead
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

// indexes for performance optimization
propertySchema.index({ location: "2dsphere" });
propertySchema.index({ title: "text", city: "text", address: "text", description: "text" }); // text search

// Compound indexes for common filter combinations
propertySchema.index({ city: 1, category: 1, status: 1, isDeleted: 1 }); // location + type filtering
propertySchema.index({ monthlyRent: 1, city: 1, status: 1, isDeleted: 1 }); // price range filtering
propertySchema.index({ bedrooms: 1, city: 1, status: 1, isDeleted: 1 }); // bedroom filtering
propertySchema.index({ category: 1, propertyType: 1, status: 1, isDeleted: 1 }); // property type filtering
propertySchema.index({ ownerId: 1, status: 1, isDeleted: 1, createdAt: -1 }); // user properties
propertySchema.index({ status: 1, isDeleted: 1, createdAt: -1 }); // general listing with date sort
propertySchema.index({ status: 1, isDeleted: 1, monthlyRent: 1 }); // price sorting
propertySchema.index({ status: 1, isDeleted: 1, views: -1 }); // popularity sorting
propertySchema.index({ status: 1, isDeleted: 1, featured: -1, createdAt: -1 }); // featured properties
propertySchema.index({ furnishing: 1, status: 1, isDeleted: 1 }); // furnishing filter
propertySchema.index({ amenities: 1, status: 1, isDeleted: 1 }); // amenities filtering
propertySchema.index({ availableFrom: 1, status: 1, isDeleted: 1 }); // availability filtering

// Performance monitoring indexes
propertySchema.index({ createdAt: -1 }); // date-based queries
propertySchema.index({ updatedAt: -1 }); // recently updated
propertySchema.index({ views: -1 }); // most viewed
propertySchema.index({ favoritesCount: -1 }); // most favorited

// Compound indexes for listingType queries (rent vs buy separation)
propertySchema.index({ listingType: 1, city: 1, status: 1, isDeleted: 1 }); // listing type + location
propertySchema.index({ listingType: 1, monthlyRent: 1, status: 1, isDeleted: 1 }); // rent price filtering
propertySchema.index({ listingType: 1, sellingPrice: 1, status: 1, isDeleted: 1 }); // buy price filtering
propertySchema.index({ listingType: 1, category: 1, status: 1, isDeleted: 1 }); // listing type + category
propertySchema.index({ listingType: 1, status: 1, isDeleted: 1, createdAt: -1 }); // listing type with date sort

export const Property = mongoose.models.Property || mongoose.model("Property", propertySchema);
