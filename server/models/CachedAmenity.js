/**
 * CachedAmenity Model
 * Stores pre-fetched amenity data for locations to reduce Overpass API calls
 */

import mongoose from "mongoose";
const { Schema } = mongoose;

const AmenityItemSchema = new Schema({
    name: { type: String, required: true },
    type: { type: String, required: true }, // Hospital, School, Bank, etc.
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    icon: { type: String },
    color: { type: String },
    iconColor: { type: String }
}, { _id: false });

const CachedAmenitySchema = new Schema({
    // Grid cell identifier: "lat_lng" with 2 decimal precision (e.g., "23.02_72.55")
    // Each cell covers roughly 1km x 1km area
    gridCell: {
        type: String,
        required: true,
        index: true
    },

    // City name for easier querying and bulk operations
    city: {
        type: String,
        index: true
    },

    // Center coordinates of this grid cell
    centerLat: { type: Number, required: true },
    centerLng: { type: Number, required: true },

    // Pre-fetched amenities within ~2km radius of center
    amenities: [AmenityItemSchema],

    // Metadata
    amenityCount: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now, index: true },
    fetchDurationMs: { type: Number }, // How long the Overpass query took
    source: { type: String, default: "overpass" }, // Where data came from

    // Error tracking
    lastFetchError: { type: String },
    consecutiveErrors: { type: Number, default: 0 }
}, {
    timestamps: true
});

// Compound index for efficient lookups
CachedAmenitySchema.index({ gridCell: 1, city: 1 });

// Index for finding stale cache entries
CachedAmenitySchema.index({ lastUpdated: 1 });

/**
 * Convert lat/lng to a grid cell identifier
 * Precision: 2 decimal places (~1km cells)
 */
CachedAmenitySchema.statics.getGridCell = function (lat, lng) {
    const roundedLat = Math.floor(lat * 100) / 100;
    const roundedLng = Math.floor(lng * 100) / 100;
    return `${roundedLat.toFixed(2)}_${roundedLng.toFixed(2)}`;
};

/**
 * Get cached amenities for a location
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {number} maxAgeMs - Maximum age of cache in milliseconds
 * @returns {Object|null} Cached data or null if not found/expired
 */
CachedAmenitySchema.statics.getCachedAmenities = async function (lat, lng, maxAgeMs = 24 * 60 * 60 * 1000) {
    const gridCell = this.getGridCell(lat, lng);
    const minDate = new Date(Date.now() - maxAgeMs);

    const cached = await this.findOne({
        gridCell,
        lastUpdated: { $gte: minDate }
    }).lean();

    return cached;
};

/**
 * Store/update cached amenities for a location
 */
CachedAmenitySchema.statics.setCachedAmenities = async function (lat, lng, amenities, city = null, fetchDurationMs = null) {
    const gridCell = this.getGridCell(lat, lng);
    const roundedLat = Math.floor(lat * 100) / 100;
    const roundedLng = Math.floor(lng * 100) / 100;

    return this.findOneAndUpdate(
        { gridCell },
        {
            $set: {
                city,
                centerLat: roundedLat,
                centerLng: roundedLng,
                amenities,
                amenityCount: amenities.length,
                lastUpdated: new Date(),
                fetchDurationMs,
                source: "overpass",
                lastFetchError: null,
                consecutiveErrors: 0
            }
        },
        { upsert: true, new: true }
    );
};

/**
 * Record a fetch error for a grid cell
 */
CachedAmenitySchema.statics.recordFetchError = async function (lat, lng, errorMessage) {
    const gridCell = this.getGridCell(lat, lng);

    return this.findOneAndUpdate(
        { gridCell },
        {
            $set: {
                lastFetchError: errorMessage,
                lastUpdated: new Date()
            },
            $inc: { consecutiveErrors: 1 }
        },
        { upsert: true }
    );
};

/**
 * Get stale cache entries that need refreshing
 * @param {number} maxAgeMs - Maximum age before considered stale
 * @param {number} limit - Max entries to return
 */
CachedAmenitySchema.statics.getStaleEntries = async function (maxAgeMs = 7 * 24 * 60 * 60 * 1000, limit = 50) {
    const minDate = new Date(Date.now() - maxAgeMs);

    return this.find({
        lastUpdated: { $lt: minDate },
        consecutiveErrors: { $lt: 3 } // Skip entries that keep failing
    })
        .sort({ lastUpdated: 1 })
        .limit(limit)
        .lean();
};

/**
 * Get cache statistics
 */
CachedAmenitySchema.statics.getStats = async function () {
    const now = new Date();
    const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

    const [total, fresh, stale, withErrors, byCityRaw] = await Promise.all([
        this.countDocuments(),
        this.countDocuments({ lastUpdated: { $gte: oneDayAgo } }),
        this.countDocuments({ lastUpdated: { $lt: oneWeekAgo } }),
        this.countDocuments({ consecutiveErrors: { $gte: 1 } }),
        this.aggregate([
            { $match: { city: { $ne: null } } },
            { $group: { _id: "$city", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ])
    ]);

    return {
        total,
        fresh,
        stale,
        withErrors,
        topCities: byCityRaw.map(c => ({ city: c._id, count: c.count }))
    };
};

export const CachedAmenity = mongoose.models.CachedAmenity || mongoose.model("CachedAmenity", CachedAmenitySchema);
