import { Router } from "express";
import { Property } from "../models/Property.js";
import { User } from "../models/User.js";
import mongoose from "mongoose";
import fs from "fs";
import { connectDB } from "../src/config/db.js";
import { authenticateToken } from "../src/middleware/security.js";
import { propertyUpload, uploadPropertyPhotos, uploadPanoramaImages } from "../src/middleware/cloudinaryUpload.js";
import { LISTING_TYPES } from "../../shared/propertyTypes.js";
import listingLifecycleService from "../src/services/listingLifecycleService.js";
import { AvailabilitySlot } from "../models/AvailabilitySlot.js";
import { VisitBooking } from "../models/VisitBooking.js";
import { Conversation } from "../models/Conversation.js";
import { Notification } from "../models/Notification.js";
import messageService from "../src/services/messageService.js";
import messageNotificationService from "../src/services/messageNotificationService.js";
import { getIO } from "../socket.js";

const router = Router();

function slugify(text) {
    return String(text || "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
}

function randomSuffix(len = 4) {
    return Math.random().toString(36).substring(2, 2 + len).toUpperCase();
}

async function makeUniqueSlug(base) {
    let s = base;
    let tries = 0;
    while (tries < 6) {
        const exists = await Property.findOne({ slug: s }).lean();
        if (!exists) return s;
        s = `${base}-${randomSuffix(3)}`;
        tries++;
    }
    return `${base}-${mongoose.Types.ObjectId().toString().slice(-6)}`;
}

function makeListingNumber() {
    const dt = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const stamp = `${dt.getFullYear()}${pad(dt.getMonth() + 1)}${pad(dt.getDate())}${pad(dt.getHours())}${pad(dt.getMinutes())}${pad(dt.getSeconds())}`;
    return `LIST-${stamp}-${randomSuffix(4)}`;
}

/**
 * Generate property URL path based on listing type
 * @param {Object} property - Property object with listingType and slug
 * @returns {string} URL path in format /rent/{slug} or /buy/{slug}
 */
function generatePropertyUrlPath(property) {
    if (!property || !property.slug) return null;

    const listingType = property.listingType || LISTING_TYPES.RENT;
    return `/${listingType}/${property.slug}`;
}

/**
 * Add URL path to property object
 * @param {Object} property - Property object
 * @returns {Object} Property with urlPath added
 */
function addUrlPathToProperty(property) {
    if (!property) return property;
    return {
        ...property,
        urlPath: generatePropertyUrlPath(property)
    };
}

/* 
// Redundant routes moved to rentProperties.js and buyProperties.js
router.post("/rent", ...);
router.post("/buy", ...);
router.post("/", ...);
*/

/*
// Redundant POST /buy moved to buyProperties.js
router.post("/buy", ...);
*/

// Create property (backward compatible - defaults to rent)
router.post("/", propertyUpload.fields([
    { name: "photos", maxCount: 15 },
    { name: "panoramaImages", maxCount: 10 }
]), async (req, res) => {
    try {
        const userId = req.headers["x-user-id"];
        if (!userId) return res.status(401).json({ error: "Unauthorized - provide x-user-id header (dev)" });

        const user = await User.findById(userId).lean();
        if (!user) return res.status(401).json({ error: "Invalid user id in x-user-id header" });

        const body = req.body || {};

        // Default listingType to "rent" for backward compatibility
        if (!body.listingType) {
            body.listingType = LISTING_TYPES.RENT;
        }

        const required = ["category", "title", "propertyType", "furnishing", "availableFrom", "city", "address", "monthlyRent"];
        for (const r of required) {
            if (body[r] === undefined || body[r] === null || body[r] === "") {
                return res.status(400).json({ error: `Missing required field:${r}` });
            }
        }

        const ownerName = body.ownerName || user.name;
        const ownerPhone = body.ownerPhone || user.phone;
        if (!ownerPhone) return res.status(400).json({ error: "ownerPhone missing and user has no phone" });

        const baseSlug = slugify(`${body.title}-${body.city || ""}`.slice(0, 120));
        const slug = await makeUniqueSlug(baseSlug);
        const listingNumber = makeListingNumber();

        // Process standard photos
        const photos = req.files?.photos || [];
        const photoPaths = await uploadPropertyPhotos(photos);

        // Process panorama images
        const panoramaFiles = req.files?.panoramaImages || [];
        const panoramaPaths = await uploadPanoramaImages(panoramaFiles);

        let panoramaImages = [];
        if (panoramaFiles.length > 0) {
            let labels = [];
            if (body.panoramaLabels) {
                try {
                    labels = JSON.parse(body.panoramaLabels);
                } catch (e) {
                    labels = Array.isArray(body.panoramaLabels) ? body.panoramaLabels : [body.panoramaLabels];
                }
            }
            panoramaImages = panoramaPaths.map((url, idx) => ({
                url,
                label: labels[idx] || ""
            }));
        }

        // Validate URLs if present
        if (body.virtualTourType === "matterport" && body.matterportUrl) {
            try {
                new URL(body.matterportUrl);
            } catch (e) {
                return res.status(400).json({ error: "Invalid Matterport URL format" });
            }
        }
        if (body.virtualTourType === "video" && body.videoUrl) {
            try {
                new URL(body.videoUrl);
            } catch (e) {
                return res.status(400).json({ error: "Invalid Video URL format" });
            }
        }

        const virtualTour = {
            type: body.virtualTourType || "none",
            matterportUrl: body.matterportUrl || "",
            panoramaImages,
            videoUrl: body.videoUrl || ""
        };

        const doc = new Property({
            ...body,
            listingType: body.listingType || LISTING_TYPES.RENT,
            photos: photoPaths,
            virtualTour,
            ownerId: user._id,
            ownerName,
            ownerPhone,
            ownerEmail: body.ownerEmail || user.email || "",
            slug,
            listingNumber,
            location: body.location || (body.lat && body.lng ? { type: "Point", coordinates: [body.lng, body.lat] } : undefined),
            expiresAt: listingLifecycleService.calculateExpirationDate(), // Auto-expire in 30 days
        });

        await doc.save();
        res.status(201).json(doc);
    } catch (err) {
        if (err.name === "ValidationError") {
            const messages = Object.values(err.errors).map(e => e.message);
            return res.status(400).json({ error: "Property validation failed", details: messages });
        }
        console.error(err);
        res.status(500).json({ error: "Server error", message: err.message });
    }
});
/*
// Redundant GET /rent moved to rentProperties.js
router.get("/rent", ...);
*/

// POST search rent properties
router.post("/rent/search", async (req, res) => {
    try {
        const {
            q = "",
            query = "",
            searchQuery = "",
            location = "",
            city = "",
            category = "",
            propertyType = "",
            type = "",
            page = 1,
            limit = 12,
            sort = "newest",
            filters = {}
        } = req.body;

        const searchText = q || query || searchQuery || "";
        const searchPropertyType = propertyType || type || filters.propertyType || "";

        const safeFilters = filters || {};

        const extractCity = (str) => {
            if (!str) return "";
            return str.split(",")[0].trim();
        };

        const searchLocation = extractCity(location || city || safeFilters.city || "");

        const pageNum = Math.max(1, Number(page));
        const limitNum = Math.min(100, Number(limit));
        const skip = (pageNum - 1) * limitNum;

        const matchStage = {
            isDeleted: false,
            status: "active",
            // Include properties with listingType="rent" OR properties without listingType (backward compatibility)
            $or: [
                { listingType: "rent" },
                { listingType: { $exists: false } },
                { listingType: null }
            ]
        };

        const andConditions = [];

        if (searchText) {
            const escapedQuery = String(searchText).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            const regex = new RegExp(escapedQuery, "i");

            andConditions.push({
                $or: [
                    { title: regex },
                    { description: regex },
                    { category: regex },
                    { propertyType: regex },
                    { "address.city": regex },
                    { city: regex }
                ]
            });
        }

        if (searchLocation) {
            const locationRegex = new RegExp(searchLocation.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
            andConditions.push({
                $or: [
                    { city: locationRegex },
                    { "address.city": locationRegex },
                    { address: locationRegex }
                ]
            });
        }

        if (searchPropertyType) {
            const typeRegex = new RegExp(searchPropertyType.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
            matchStage.propertyType = typeRegex;
        }
        if (category) {
            const categoryRegex = new RegExp(category.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
            matchStage.category = categoryRegex;
        }

        if (filters.priceRange) {
            const priceFilter = {};
            if (filters.priceRange.min !== undefined) {
                priceFilter.$gte = Number(filters.priceRange.min);
            }
            if (filters.priceRange.max !== undefined && Number(filters.priceRange.max) > 0) {
                priceFilter.$lte = Number(filters.priceRange.max);
            }
            if (Object.keys(priceFilter).length > 0) {
                matchStage.monthlyRent = priceFilter;
            }
        }

        if (safeFilters.bedrooms && Array.isArray(safeFilters.bedrooms) && safeFilters.bedrooms.length > 0) {
            const bedroomConditions = safeFilters.bedrooms.map(bed => {
                if (bed === "5+" || bed === 5) {
                    return { bedrooms: { $gte: 5 } };
                }
                return { bedrooms: Number(bed) };
            });
            andConditions.push({ $or: bedroomConditions });
        }

        if (safeFilters.amenities && Array.isArray(safeFilters.amenities) && safeFilters.amenities.length > 0) {
            matchStage.amenities = { $all: safeFilters.amenities };
        }

        if (safeFilters.furnishing && Array.isArray(safeFilters.furnishing) && safeFilters.furnishing.length > 0) {
            matchStage.furnishing = { $in: safeFilters.furnishing };
        }

        if (safeFilters.preferredTenants) {
            matchStage.preferredTenants = safeFilters.preferredTenants;
        }

        if (andConditions.length > 0) {
            matchStage.$and = andConditions;
        }

        const pipeline = [];
        pipeline.push({ $match: matchStage });

        let sortStage = { createdAt: -1 };
        switch (sort) {
            case "rent_low_to_high":
                sortStage = { monthlyRent: 1, createdAt: -1 };
                break;
            case "rent_high_to_low":
                sortStage = { monthlyRent: -1, createdAt: -1 };
                break;
            case "oldest":
                sortStage = { createdAt: 1 };
                break;
            default:
                sortStage = { createdAt: -1 };
        }

        if (searchText) {
            pipeline.push({
                $addFields: {
                    relevanceScore: {
                        $add: [
                            { $cond: [{ $regexMatch: { input: "$title", regex: searchText, options: "i" } }, 10, 0] },
                            { $cond: [{ $regexMatch: { input: "$category", regex: searchText, options: "i" } }, 5, 0] },
                            { $cond: [{ $regexMatch: { input: "$propertyType", regex: searchText, options: "i" } }, 3, 0] }
                        ]
                    }
                }
            });
            if (sort === "newest" || sort === "relevance") {
                sortStage = { relevanceScore: -1, createdAt: -1 };
            }
        }

        pipeline.push({ $sort: sortStage });

        pipeline.push({
            $facet: {
                metadata: [{ $count: "total" }],
                data: [
                    { $skip: skip },
                    { $limit: limitNum }
                ]
            }
        });

        const result = await Property.aggregate(pipeline);

        const data = result[0].data;
        const total = result[0].metadata[0] ? result[0].metadata[0].total : 0;

        return res.json({
            success: true,
            data: {
                searchResultData: data,
                message: "Search completed successfully"
            },
            pagination: {
                total,
                page: pageNum,
                pageSize: limitNum,
                totalPages: Math.ceil(total / limitNum)
            }
        });

    } catch (err) {
        console.error("Rent Search API Error:", err);
        return res.status(500).json({
            success: false,
            error: "Internal Server Error",
            message: err.message
        });
    }
});

// GET rent property by slug
router.get("/rent/:slug", async (req, res) => {
    try {
        const { slug } = req.params;

        let property;

        // Include properties with listingType="rent" OR properties without listingType (backward compatibility)
        const listingTypeFilter = {
            $or: [
                { listingType: "rent" },
                { listingType: { $exists: false } },
                { listingType: null }
            ]
        };

        if (mongoose.Types.ObjectId.isValid(slug)) {
            property = await Property.findOne({
                _id: slug,
                isDeleted: false,
                status: "active",
                ...listingTypeFilter
            }).lean();
        }

        if (!property) {
            property = await Property.findOne({
                slug: slug,
                isDeleted: false,
                status: "active",
                ...listingTypeFilter
            }).lean();
        }

        if (!property) {
            return res.status(404).json({
                success: false,
                error: "Property not found",
                message: "The requested rent property could not be found"
            });
        }

        const propertyWithUrl = addUrlPathToProperty(property);

        res.json({
            success: true,
            data: propertyWithUrl
        });

    } catch (err) {
        console.error("GET /properties/rent/:slug error:", err);
        res.status(500).json({
            success: false,
            error: "Server error",
            message: err.message
        });
    }
});

// ==================== BUY PROPERTY ROUTES ====================

/*
// Redundant GET /buy moved to buyProperties.js
router.get("/buy", ...);
*/

// POST search buy properties
router.post("/buy/search", async (req, res) => {
    try {
        const {
            q = "",
            query = "",
            searchQuery = "",
            location = "",
            city = "",
            category = "",
            propertyType = "",
            type = "",
            page = 1,
            limit = 12,
            sort = "newest",
            filters = {}
        } = req.body;

        const searchText = q || query || searchQuery || "";
        const searchPropertyType = propertyType || type || filters.propertyType || "";

        const safeFilters = filters || {};

        const extractCity = (str) => {
            if (!str) return "";
            return str.split(",")[0].trim();
        };

        const searchLocation = extractCity(location || city || safeFilters.city || "");

        const pageNum = Math.max(1, Number(page));
        const limitNum = Math.min(100, Number(limit));
        const skip = (pageNum - 1) * limitNum;

        const matchStage = {
            isDeleted: false,
            status: "active",
            listingType: "buy"
        };

        const andConditions = [];

        if (searchText) {
            const escapedQuery = String(searchText).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            const regex = new RegExp(escapedQuery, "i");

            andConditions.push({
                $or: [
                    { title: regex },
                    { description: regex },
                    { category: regex },
                    { propertyType: regex },
                    { "address.city": regex },
                    { city: regex }
                ]
            });
        }

        if (searchLocation) {
            const locationRegex = new RegExp(searchLocation.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
            andConditions.push({
                $or: [
                    { city: locationRegex },
                    { "address.city": locationRegex },
                    { address: locationRegex }
                ]
            });
        }

        if (searchPropertyType) {
            const typeRegex = new RegExp(searchPropertyType.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
            matchStage.propertyType = typeRegex;
        }
        if (category) {
            const categoryRegex = new RegExp(category.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
            matchStage.category = categoryRegex;
        }

        if (filters.priceRange) {
            const priceFilter = {};
            if (filters.priceRange.min !== undefined) {
                priceFilter.$gte = Number(filters.priceRange.min);
            }
            if (filters.priceRange.max !== undefined && Number(filters.priceRange.max) > 0) {
                priceFilter.$lte = Number(filters.priceRange.max);
            }
            if (Object.keys(priceFilter).length > 0) {
                matchStage.sellingPrice = priceFilter;
            }
        }

        if (safeFilters.bedrooms && Array.isArray(safeFilters.bedrooms) && safeFilters.bedrooms.length > 0) {
            const bedroomConditions = safeFilters.bedrooms.map(bed => {
                if (bed === "5+" || bed === 5) {
                    return { bedrooms: { $gte: 5 } };
                }
                return { bedrooms: Number(bed) };
            });
            andConditions.push({ $or: bedroomConditions });
        }

        if (safeFilters.amenities && Array.isArray(safeFilters.amenities) && safeFilters.amenities.length > 0) {
            matchStage.amenities = { $all: safeFilters.amenities };
        }

        if (safeFilters.furnishing && Array.isArray(safeFilters.furnishing) && safeFilters.furnishing.length > 0) {
            matchStage.furnishing = { $in: safeFilters.furnishing };
        }

        if (safeFilters.possessionStatus) {
            matchStage.possessionStatus = safeFilters.possessionStatus;
        }

        if (safeFilters.loanAvailable !== undefined) {
            matchStage.loanAvailable = safeFilters.loanAvailable;
        }

        if (andConditions.length > 0) {
            matchStage.$and = andConditions;
        }

        const pipeline = [];
        pipeline.push({ $match: matchStage });

        let sortStage = { createdAt: -1 };
        switch (sort) {
            case "price_low_to_high":
                sortStage = { sellingPrice: 1, createdAt: -1 };
                break;
            case "price_high_to_low":
                sortStage = { sellingPrice: -1, createdAt: -1 };
                break;
            case "oldest":
                sortStage = { createdAt: 1 };
                break;
            default:
                sortStage = { createdAt: -1 };
        }

        if (searchText) {
            pipeline.push({
                $addFields: {
                    relevanceScore: {
                        $add: [
                            { $cond: [{ $regexMatch: { input: "$title", regex: searchText, options: "i" } }, 10, 0] },
                            { $cond: [{ $regexMatch: { input: "$category", regex: searchText, options: "i" } }, 5, 0] },
                            { $cond: [{ $regexMatch: { input: "$propertyType", regex: searchText, options: "i" } }, 3, 0] }
                        ]
                    }
                }
            });
            if (sort === "newest" || sort === "relevance") {
                sortStage = { relevanceScore: -1, createdAt: -1 };
            }
        }

        pipeline.push({ $sort: sortStage });

        pipeline.push({
            $facet: {
                metadata: [{ $count: "total" }],
                data: [
                    { $skip: skip },
                    { $limit: limitNum }
                ]
            }
        });

        const result = await Property.aggregate(pipeline);

        const data = result[0].data;
        const total = result[0].metadata[0] ? result[0].metadata[0].total : 0;

        return res.json({
            success: true,
            data: {
                searchResultData: data,
                message: "Search completed successfully"
            },
            pagination: {
                total,
                page: pageNum,
                pageSize: limitNum,
                totalPages: Math.ceil(total / limitNum)
            }
        });

    } catch (err) {
        console.error("Buy Search API Error:", err);
        return res.status(500).json({
            success: false,
            error: "Internal Server Error",
            message: err.message
        });
    }
});

// GET buy property by slug
router.get("/buy/:slug", async (req, res) => {
    try {
        const { slug } = req.params;

        let property;

        if (mongoose.Types.ObjectId.isValid(slug)) {
            property = await Property.findOne({
                _id: slug,
                isDeleted: false,
                status: "active",
                listingType: "buy"
            }).lean();
        }

        if (!property) {
            property = await Property.findOne({
                slug: slug,
                isDeleted: false,
                status: "active",
                listingType: "buy"
            }).lean();
        }

        if (!property) {
            return res.status(404).json({
                success: false,
                error: "Property not found",
                message: "The requested buy property could not be found"
            });
        }

        const propertyWithUrl = addUrlPathToProperty(property);

        res.json({
            success: true,
            data: propertyWithUrl
        });

    } catch (err) {
        console.error("GET /properties/buy/:slug error:", err);
        res.status(500).json({
            success: false,
            error: "Server error",
            message: err.message
        });
    }
});

// ==================== GENERAL PROPERTY ROUTES ====================

// GET all properties with basic filtering
router.get("/", async (req, res) => {
    fs.appendFileSync("d:/portfolio_Projects/Renters/debug.log", `HIT: properties.js GET / with ${req.originalUrl} at ${new Date().toISOString()}\n`);
    try {
        await connectDB();

        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(100, Number(req.query.limit) || 12);
        const skip = (page - 1) * limit;

        const filter = { isDeleted: false, status: "active" };

        if (req.query.city) filter.city = String(req.query.city);
        if (req.query.category) filter.category = String(req.query.category);
        if (req.query.propertyType) filter.propertyType = String(req.query.propertyType);
        if (req.query.ownerId && mongoose.Types.ObjectId.isValid(req.query.ownerId)) {
            filter.ownerId = req.query.ownerId;
        }

        if (req.query.minRent) filter.monthlyRent = { ...(filter.monthlyRent || {}), $gte: Number(req.query.minRent) };
        if (req.query.maxRent) filter.monthlyRent = { ...(filter.monthlyRent || {}), $lte: Number(req.query.maxRent) };

        if (req.query.verified === "true" || req.query.verified === true) {
            filter.verified = true;
        }

        // Handle multiple furnace values
        if (req.query.furnishing) {
            const furnishingValues = String(req.query.furnishing).split(',').filter(Boolean);
            if (furnishingValues.length > 1) {
                filter.furnishing = { $in: furnishingValues };
            } else if (furnishingValues.length === 1) {
                filter.furnishing = furnishingValues[0];
            }
        }

        // Handle multiple bedroom values
        if (req.query.bedrooms) {
            const bedroomValues = String(req.query.bedrooms).split(',').filter(Boolean);
            if (bedroomValues.length > 0) {
                const bedroomConditions = bedroomValues.map(bed => {
                    if (bed === "5+" || bed === "5") {
                        return { bedrooms: { $gte: 5 } };
                    }
                    return { bedrooms: Number(bed) };
                });

                if (bedroomConditions.length > 1) {
                    if (!filter.$and) filter.$and = [];
                    filter.$and.push({ $or: bedroomConditions });
                } else if (bedroomConditions.length === 1) {
                    Object.assign(filter, bedroomConditions[0]);
                }
            }
        }

        if (req.query.q) {
            filter.$text = { $search: String(req.query.q) };
        }

        const sortParam = String(req.query.sort || "newest");
        let mongoSort = { createdAt: -1 };
        if (sortParam === "rent_low_to_high") mongoSort = { monthlyRent: 1, createdAt: -1 };
        else if (sortParam === "rent_high_to_low") mongoSort = { monthlyRent: -1, createdAt: -1 };
        else if (sortParam === "oldest") mongoSort = { createdAt: 1 };
        else if (sortParam === "featured") mongoSort = { featured: -1, createdAt: -1 };

        let query = Property.find(filter).sort(mongoSort).skip(skip).limit(limit).lean();

        if (filter.$text) {
            query = Property.find(filter, { score: { $meta: "textScore" } })
                .sort({ score: { $meta: "textScore" }, ...mongoSort })
                .skip(skip)
                .limit(limit)
                .lean();
        }

        const [items, total] = await Promise.all([query.exec(), Property.countDocuments(filter)]);

        res.json({ items, total, page, pageSize: limit });

    } catch (err) {
        console.error("GET /properties error:", err);
        res.status(500).json({ error: "Server error", message: err.message });
    }
});

// Enhanced search endpoint that matches frontend expectations
router.post("/search", async (req, res) => {
    try {
        const {
            q = "",
            query = "",
            searchQuery = "",
            location = "",
            city = "",
            category = "",
            propertyType = "",
            type = "",
            page = 1,
            limit = 12,
            sort = "newest",
            filters = {} // Default to empty object
        } = req.body;

        // 1. Sanitize Inputs
        const searchText = q || query || searchQuery || "";
        const searchPropertyType = propertyType || type || filters.propertyType || "";

        // Ensure safe access to nested filter properties
        const safeFilters = filters || {};

        // Helper to extract city name
        const extractCity = (str) => {
            if (!str) return "";
            return str.split(",")[0].trim();
        };

        const searchLocation = extractCity(location || city || safeFilters.city || "");

        // Pagination setup
        const pageNum = Math.max(1, Number(page));
        const limitNum = Math.min(100, Number(limit));
        const skip = (pageNum - 1) * limitNum;

        // 2. Build Match Stage (Base Conditions)
        const matchStage = {
            isDeleted: false,
            status: "active"
            // NOTE: Ensure your DB documents actually have 'status: active' 
            // and 'isDeleted: false', otherwise this returns 0 results.
        };

        const andConditions = [];

        // 3. Text Search - Use MongoDB $text index for performance (O(log n) vs O(n) for regex)
        // Fallback to regex only for short queries or special characters where $text doesn't work well
        if (searchText) {
            const trimmedSearch = searchText.trim();

            // Use $text search for queries with 3+ characters (more efficient, uses index)
            if (trimmedSearch.length >= 3 && /^[a-zA-Z0-9\s]+$/.test(trimmedSearch)) {
                // MongoDB $text search - uses the text index defined on Property model
                matchStage.$text = { $search: trimmedSearch };
            } else {
                // Fallback to regex for short queries or special characters
                const escapedQuery = String(trimmedSearch).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                const regex = new RegExp(escapedQuery, "i");

                andConditions.push({
                    $or: [
                        { title: regex },
                        { description: regex },
                        { category: regex },
                        { propertyType: regex },
                        { "address.city": regex },
                        { city: regex }
                    ]
                });
            }
        }

        // 4. Location Search
        // if (searchLocation) {
        //     const locationRegex = new RegExp(searchLocation.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
        //     andConditions.push({
        //         $or: [
        //             { city: locationRegex },
        //             { address: locationRegex },
        //             // If address is an object in your schema (e.g. address.city), add that here:
        //             // { "address.city": locationRegex }
        //         ]
        //     });
        // }
        if (searchLocation) {
            const locationRegex = new RegExp(searchLocation.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
            andConditions.push({
                $or: [
                    { city: locationRegex },              // If city is at root
                    { "address.city": locationRegex },    // If city is inside address object
                    { address: locationRegex }            // If address is a simple string
                ]
            });
        }
        // 5. Category & Property Type Filters
        // if (searchPropertyType) {
        //     matchStage.propertyType = searchPropertyType;
        // }
        if (searchPropertyType) {
            // This allows "room" to match "Room", "ROOM", "Private Room", etc.
            const typeRegex = new RegExp(searchPropertyType.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
            matchStage.propertyType = typeRegex;
        }
        if (category) {
            const categoryRegex = new RegExp(category.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
            matchStage.category = categoryRegex;
        }

        // 6. Price Range Filter
        // Note: Ensure your DB stores monthlyRent as a Number, not a String
        // if (safeFilters.priceRange) {
        //     const priceFilter = {};
        //     // Check if min is a valid number
        //     if (safeFilters.priceRange.min !== undefined && Number(safeFilters.priceRange.min) >= 0) {
        //         priceFilter.$gte = Number(safeFilters.priceRange.min);
        //     }
        //     // Check if max is a valid number (Removed the < 100000 cap)
        //     if (safeFilters.priceRange.max !== undefined && Number(safeFilters.priceRange.max) > 0) {
        //         priceFilter.$lte = Number(safeFilters.priceRange.max);
        //     }

        //     if (Object.keys(priceFilter).length > 0) {
        //         matchStage.monthlyRent = priceFilter;
        //     }
        // }
        if (filters.priceRange) {
            const priceFilter = {};
            if (filters.priceRange.min !== undefined) {
                priceFilter.$gte = Number(filters.priceRange.min);
            }
            if (filters.priceRange.max !== undefined && Number(filters.priceRange.max) > 0) {
                priceFilter.$lte = Number(filters.priceRange.max);
            }
            if (Object.keys(priceFilter).length > 0) {
                matchStage.monthlyRent = priceFilter;
                // IMPORTANT: Check your DB schema. Is this field named 'monthlyRent', 'price', or 'rent'?
            }
        }

        // 7. Bedrooms Filter
        if (safeFilters.bedrooms && Array.isArray(safeFilters.bedrooms) && safeFilters.bedrooms.length > 0) {
            const bedroomConditions = safeFilters.bedrooms.map(bed => {
                if (bed === "5+" || bed === 5) {
                    return { bedrooms: { $gte: 5 } };
                }
                return { bedrooms: Number(bed) };
            });
            andConditions.push({ $or: bedroomConditions });
        }

        // 8. Amenities Filter
        if (safeFilters.amenities && Array.isArray(safeFilters.amenities) && safeFilters.amenities.length > 0) {
            matchStage.amenities = { $all: safeFilters.amenities };
        }

        // 9. Furnishing Filter
        if (safeFilters.furnishing && Array.isArray(safeFilters.furnishing) && safeFilters.furnishing.length > 0) {
            matchStage.furnishing = { $in: safeFilters.furnishing };
        }

        // 10. Apply AND Conditions
        if (andConditions.length > 0) {
            matchStage.$and = andConditions;
        }

        // Build Pipeline
        const pipeline = [];
        pipeline.push({ $match: matchStage });

        // Sorting
        let sortStage = { createdAt: -1 };
        switch (sort) {
            case "rent_low_to_high":
                sortStage = { monthlyRent: 1, createdAt: -1 };
                break;
            case "rent_high_to_low":
                sortStage = { monthlyRent: -1, createdAt: -1 };
                break;
            case "oldest":
                sortStage = { createdAt: 1 };
                break;
            default:
                sortStage = { createdAt: -1 };
        }

        // Relevance Scoring
        // When using $text search, MongoDB provides a textScore for relevance
        // When using regex fallback, calculate relevance manually
        if (searchText) {
            const trimmedSearch = searchText.trim();
            const isTextSearch = trimmedSearch.length >= 3 && /^[a-zA-Z0-9\s]+$/.test(trimmedSearch);

            if (isTextSearch) {
                // Use MongoDB's native textScore for $text searches (highly optimized)
                pipeline.push({
                    $addFields: {
                        relevanceScore: { $meta: "textScore" }
                    }
                });
            } else {
                // Fallback: manual relevance scoring for regex searches
                pipeline.push({
                    $addFields: {
                        relevanceScore: {
                            $add: [
                                { $cond: [{ $regexMatch: { input: "$title", regex: trimmedSearch, options: "i" } }, 10, 0] },
                                { $cond: [{ $regexMatch: { input: "$category", regex: trimmedSearch, options: "i" } }, 5, 0] },
                                { $cond: [{ $regexMatch: { input: "$propertyType", regex: trimmedSearch, options: "i" } }, 3, 0] }
                            ]
                        }
                    }
                });
            }

            if (sort === "newest" || sort === "relevance") {
                sortStage = { relevanceScore: -1, createdAt: -1 };
            }
        }

        pipeline.push({ $sort: sortStage });

        // Facet for Pagination
        pipeline.push({
            $facet: {
                metadata: [{ $count: "total" }],
                data: [
                    { $skip: skip },
                    { $limit: limitNum }
                ]
            }
        });

        const result = await Property.aggregate(pipeline);

        const data = result[0].data;
        const total = result[0].metadata[0] ? result[0].metadata[0].total : 0;

        return res.json({
            success: true,
            data: {
                searchResultData: data,
                message: "Search completed successfully"
            },
            pagination: {
                total,
                page: pageNum,
                pageSize: limitNum,
                totalPages: Math.ceil(total / limitNum)
            }
        });

    } catch (err) {
        console.error("Search API Error:", err);
        return res.status(500).json({
            success: false,
            error: "Internal Server Error",
            message: err.message
        });
    }
});

// GET user's own property listings (authenticated)
router.get("/my-listings", authenticateToken, async (req, res) => {
    try {
        await connectDB();

        const userId = req.user._id;

        // Query properties owned by the authenticated user that are not deleted
        const properties = await Property.find({
            ownerId: userId,
            isDeleted: false
        })
            .sort({ createdAt: -1 })
            .lean();

        const total = properties.length;

        res.json({
            success: true,
            data: {
                properties: properties.map(prop => ({
                    _id: prop._id,
                    title: prop.title,
                    city: prop.city,
                    monthlyRent: prop.monthlyRent,
                    status: prop.status,
                    views: prop.views || 0,
                    favoritesCount: prop.favoritesCount || 0,
                    photos: prop.photos || [],
                    propertyType: prop.propertyType,
                    bedrooms: prop.bedrooms,
                    furnishing: prop.furnishing,
                    createdAt: prop.createdAt
                })),
                total
            }
        });

    } catch (err) {
        console.error("GET /properties/my-listings error:", err);
        res.status(500).json({
            success: false,
            error: "Server error",
            message: err.message
        });
    }
});

// PATCH property status (toggle active/inactive)
router.patch("/:id/status", authenticateToken, async (req, res) => {
    try {
        await connectDB();

        const { id } = req.params;
        const { status } = req.body;
        const userId = req.user._id;

        // Validate the property ID
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                error: "Invalid property ID",
                message: "The provided property ID is not valid"
            });
        }

        // Validate the status value
        const validStatuses = ["active", "inactive"];
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                error: "Invalid status",
                message: "Status must be either 'active' or 'inactive'"
            });
        }

        // Find the property
        const property = await Property.findOne({
            _id: id,
            isDeleted: false
        });

        if (!property) {
            return res.status(404).json({
                success: false,
                error: "Property not found",
                message: "The requested property could not be found"
            });
        }

        // Verify ownership - compare ObjectIds as strings
        if (property.ownerId.toString() !== userId.toString()) {
            return res.status(403).json({
                success: false,
                error: "Forbidden",
                message: "You do not have permission to modify this property"
            });
        }

        // Check if property is blocked (cannot toggle blocked properties)
        if (property.status === "blocked") {
            return res.status(400).json({
                success: false,
                error: "Cannot modify blocked property",
                message: "This property has been blocked and cannot be modified"
            });
        }

        // Update the status
        property.status = status;
        await property.save();

        res.json({
            success: true,
            data: {
                property: {
                    _id: property._id,
                    title: property.title,
                    city: property.city,
                    monthlyRent: property.monthlyRent,
                    status: property.status,
                    views: property.views || 0,
                    favoritesCount: property.favoritesCount || 0,
                    photos: property.photos || [],
                    propertyType: property.propertyType,
                    bedrooms: property.bedrooms,
                    furnishing: property.furnishing,
                    createdAt: property.createdAt
                }
            }
        });

    } catch (err) {
        console.error("PATCH /properties/:id/status error:", err);
        res.status(500).json({
            success: false,
            error: "Server error",
            message: err.message
        });
    }
});

// POST renew property listing (extend expiration by 30 days)
router.post("/:id/renew", authenticateToken, async (req, res) => {
    try {
        await connectDB();

        const { id } = req.params;
        const userId = req.user._id;

        // Validate the property ID
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                error: "Invalid property ID",
                message: "The provided property ID is not valid"
            });
        }

        // Use the lifecycle service to renew
        const result = await listingLifecycleService.renewListing(id, userId);

        if (!result.success) {
            return res.status(400).json({
                success: false,
                error: result.error,
                message: result.error
            });
        }

        res.json({
            success: true,
            message: "Listing renewed successfully",
            data: result.property
        });

    } catch (err) {
        console.error("POST /properties/:id/renew error:", err);
        res.status(500).json({
            success: false,
            error: "Server error",
            message: err.message
        });
    }
});

// GET individual property by ID or slug
router.get("/:identifier", async (req, res) => {
    try {
        const { identifier } = req.params;

        // Try to find by slug first, then by ObjectId
        let property;

        if (mongoose.Types.ObjectId.isValid(identifier)) {
            // If it's a valid ObjectId, search by _id
            property = await Property.findOne({
                _id: identifier,
                isDeleted: false,
                status: "active"
            }).populate("ownerId", "name email phone isVerified").lean();
        }

        if (!property) {
            // If not found by ID or not a valid ObjectId, try by slug
            property = await Property.findOne({
                slug: identifier,
                isDeleted: false,
                status: "active"
            }).populate("ownerId", "name email phone isVerified").lean();
        }

        if (!property) {
            return res.status(404).json({
                success: false,
                error: "Property not found",
                message: "The requested property could not be found"
            });
        }

        // Add URL path based on listing type
        const propertyWithUrl = addUrlPathToProperty(property);

        res.json({
            success: true,
            data: propertyWithUrl
        });

    } catch (err) {
        console.error("GET /properties/:identifier error:", err);
        res.status(500).json({
            success: false,
            error: "Server error",
            message: err.message
        });
    }
});

// DELETE property (soft delete - sets isDeleted to true)
router.delete("/:id", authenticateToken, async (req, res) => {
    try {
        await connectDB();

        const { id } = req.params;
        const userId = req.user._id;

        // Validate the property ID
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                error: "Invalid property ID",
                message: "The provided property ID is not valid"
            });
        }

        // Find the property
        const property = await Property.findOne({
            _id: id,
            isDeleted: false
        });

        if (!property) {
            return res.status(404).json({
                success: false,
                error: "Property not found",
                message: "The requested property could not be found"
            });
        }

        // Verify ownership - compare ObjectIds as strings
        if (property.ownerId.toString() !== userId.toString()) {
            return res.status(403).json({
                success: false,
                error: "Forbidden",
                message: "You do not have permission to delete this property"
            });
        }

        // Soft delete - set isDeleted to true instead of removing document
        property.isDeleted = true;
        await property.save();

        res.json({
            success: true,
            message: "Property deleted successfully"
        });

    } catch (err) {
        console.error("DELETE /properties/:id error:", err);
        res.status(500).json({
            success: false,
            error: "Server error",
            message: err.message
        });
    }
});

// POST endpoint for backward compatibility with existing client code
router.post("/get-property", async (req, res) => {
    try {
        const { key } = req.body;

        if (!key) {
            return res.status(400).json({
                success: false,
                error: "Missing property identifier",
                message: "Property key is required"
            });
        }

        // Try to find by slug first, then by ObjectId
        let property;

        if (mongoose.Types.ObjectId.isValid(key)) {
            // If it's a valid ObjectId, search by _id
            property = await Property.findOne({
                _id: key,
                isDeleted: false,
                status: "active"
            }).lean();
        }

        if (!property) {
            // If not found by ID or not a valid ObjectId, try by slug
            property = await Property.findOne({
                slug: key,
                isDeleted: false,
                status: "active"
            }).lean();
        }

        if (!property) {
            return res.status(404).json({
                success: false,
                error: "Property not found",
                message: "The requested property could not be found"
            });
        }

        // Add URL path based on listing type
        const propertyWithUrl = addUrlPathToProperty(property);

        res.json({
            success: true,
            data: propertyWithUrl
        });

    } catch (err) {
        console.error("POST /properties/get-property error:", err);
        res.status(500).json({
            success: false,
            error: "Server error",
            message: err.message
        });
    }
});

// ==================== AVAILABILITY & BOOKING MANAGEMENT ====================

// Helper function to compute concrete slots from availability templates and overrides
const computeAvailability = async (propertyId, ownerId, startFromDate, daysCount = 14) => {
    const rules = await AvailabilitySlot.find({ propertyId, isActive: true }).lean();
    const bookings = await VisitBooking.find({
        propertyId,
        status: { $in: ["pending", "confirmed"] }
    }).lean();
    const bookedTimes = new Set(bookings.map(b => b.slotStart.getTime()));

    const computedSlots = [];
    const now = new Date();

    for (let i = 0; i < daysCount; i++) {
        const currentDate = new Date(startFromDate);
        currentDate.setDate(currentDate.getDate() + i);
        currentDate.setHours(0, 0, 0, 0);

        const overrides = rules.filter(r => 
            r.type === "override" && 
            new Date(r.specificDate).toDateString() === currentDate.toDateString()
        );

        let activeRules = [];
        if (overrides.length > 0) {
            activeRules = overrides.filter(o => o.isActive);
        } else {
            const dayOfWeek = currentDate.getDay();
            activeRules = rules.filter(r => 
                r.type === "recurring" && 
                r.dayOfWeek === dayOfWeek && 
                r.isActive
            );
        }

        for (const rule of activeRules) {
            const duration = rule.slotDurationMinutes || 30;
            const [startH, startM] = rule.startTime.split(":").map(Number);
            const [endH, endM] = rule.endTime.split(":").map(Number);

            let current = new Date(currentDate);
            current.setHours(startH, startM, 0, 0);

            const end = new Date(currentDate);
            end.setHours(endH, endM, 0, 0);

            while (current.getTime() + duration * 60 * 1000 <= end.getTime()) {
                const slotStart = new Date(current);
                const slotEnd = new Date(current.getTime() + duration * 60 * 1000);

                if (slotStart.getTime() > now.getTime()) {
                    if (!bookedTimes.has(slotStart.getTime())) {
                        computedSlots.push({
                            slotStart,
                            slotEnd,
                            duration
                        });
                    }
                }
                current = new Date(current.getTime() + duration * 60 * 1000);
            }
        }
    }

    computedSlots.sort((a, b) => a.slotStart - b.slotStart);
    return computedSlots;
};

// Get raw availability rules (owner only)
router.get("/:id/availability/rules", authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const property = await Property.findOne({ _id: id, isDeleted: false });
        if (!property) {
            return res.status(404).json({ success: false, error: "Property not found" });
        }
        if (property.ownerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, error: "Forbidden - only the owner can retrieve raw availability rules" });
        }
        const rules = await AvailabilitySlot.find({ propertyId: property._id }).lean();
        res.json({ success: true, rules });
    } catch (err) {
        console.error("GET /properties/:id/availability/rules error:", err);
        res.status(500).json({ success: false, error: "Server error", message: err.message });
    }
});

// Owner sets/updates availability rules
router.post("/:id/availability", authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { slots = [] } = req.body;

        const property = await Property.findOne({ _id: id, isDeleted: false });
        if (!property) {
            return res.status(404).json({ success: false, error: "Property not found" });
        }

        if (property.ownerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, error: "Forbidden - only the owner can configure availability" });
        }

        for (const slot of slots) {
            if (!slot.type || !["recurring", "override"].includes(slot.type)) {
                return res.status(400).json({ success: false, error: "Invalid slot type" });
            }
            if (slot.type === "recurring" && (slot.dayOfWeek === undefined || slot.dayOfWeek < 0 || slot.dayOfWeek > 6)) {
                return res.status(400).json({ success: false, error: "Recurring slots require a valid dayOfWeek (0-6)" });
            }
            if (slot.type === "override" && !slot.specificDate) {
                return res.status(400).json({ success: false, error: "Override slots require specificDate" });
            }
            if (!slot.startTime || !slot.endTime) {
                return res.status(400).json({ success: false, error: "startTime and endTime are required" });
            }
        }

        await AvailabilitySlot.deleteMany({ propertyId: property._id });

        const formattedSlots = slots.map(s => ({
            ownerId: req.user._id,
            propertyId: property._id,
            type: s.type,
            dayOfWeek: s.dayOfWeek,
            specificDate: s.specificDate ? new Date(s.specificDate) : undefined,
            startTime: s.startTime,
            endTime: s.endTime,
            slotDurationMinutes: s.slotDurationMinutes || 30,
            isActive: s.isActive !== undefined ? s.isActive : true
        }));

        const docs = await AvailabilitySlot.insertMany(formattedSlots);

        res.json({
            success: true,
            message: "Availability updated successfully",
            slots: docs
        });
    } catch (err) {
        console.error("POST /properties/:id/availability error:", err);
        res.status(500).json({ success: false, error: "Server error", message: err.message });
    }
});

// Get computed availability slots for next N days (default 14)
router.get("/:id/availability", async (req, res) => {
    try {
        const { id } = req.params;
        const days = Math.min(30, parseInt(req.query.days) || 14);

        const property = await Property.findOne({ _id: id, isDeleted: false });
        if (!property) {
            return res.status(404).json({ success: false, error: "Property not found" });
        }

        const startFrom = new Date();
        const computed = await computeAvailability(property._id, property.ownerId, startFrom, days);

        res.json({
            success: true,
            slots: computed
        });
    } catch (err) {
        console.error("GET /properties/:id/availability error:", err);
        res.status(500).json({ success: false, error: "Server error", message: err.message });
    }
});

// Tenant requests a visit booking slot
router.post("/:id/bookings", authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { slotStart, slotEnd, notes } = req.body;

        if (!slotStart || !slotEnd) {
            return res.status(400).json({ success: false, error: "slotStart and slotEnd are required" });
        }

        const property = await Property.findOne({ _id: id, isDeleted: false });
        if (!property) {
            return res.status(404).json({ success: false, error: "Property not found" });
        }

        if (property.ownerId.toString() === req.user._id.toString()) {
            return res.status(400).json({ success: false, error: "You cannot book a visit to your own property" });
        }

        const targetStart = new Date(slotStart);
        const targetEnd = new Date(slotEnd);

        if (targetStart.getTime() <= Date.now()) {
            return res.status(400).json({ success: false, error: "Slots must be in the future" });
        }

        if (targetEnd.getTime() <= targetStart.getTime()) {
            return res.status(400).json({ success: false, error: "slotEnd must be after slotStart" });
        }

        const existingBooking = await VisitBooking.findOne({
            propertyId: property._id,
            slotStart: targetStart,
            status: { $in: ["pending", "confirmed"] }
        });

        if (existingBooking) {
            return res.status(400).json({ success: false, error: "This slot is already booked" });
        }

        const computed = await computeAvailability(property._id, property.ownerId, targetStart, 1);
        const isValid = computed.some(s => 
            new Date(s.slotStart).getTime() === targetStart.getTime() && 
            new Date(s.slotEnd).getTime() === targetEnd.getTime()
        );

        if (!isValid) {
            return res.status(400).json({ success: false, error: "Requested slot does not align with owner availability" });
        }

        const booking = new VisitBooking({
            propertyId: property._id,
            ownerId: property.ownerId,
            tenantId: req.user._id,
            slotStart: targetStart,
            slotEnd: targetEnd,
            notes: notes || "",
            status: "pending"
        });

        await booking.save();

        let conversationId = null;
        try {
            const convResult = await messageService.getOrCreateConversation(
                req.user._id.toString(),
                property.ownerId.toString(),
                property._id.toString()
            );

            if (convResult.success && convResult.conversation) {
                conversationId = convResult.conversation._id;
                const now = new Date();
                const thumbnail = property.photos && property.photos[0] ? property.photos[0] : "";
                
                const bookingMsgText = `Visit request submitted for ${targetStart.toLocaleString()}`;

                const message = {
                    sender: req.user._id,
                    text: bookingMsgText,
                    type: "booking_request",
                    booking: {
                        bookingId: booking._id,
                        propertyTitle: property.title,
                        propertyThumbnail: thumbnail,
                        slotStart: targetStart,
                        slotEnd: targetEnd,
                        status: "pending",
                        notes: notes || ""
                    },
                    read: false,
                    createdAt: now,
                    updatedAt: now
                };

                const conv = await Conversation.findById(conversationId);
                if (conv) {
                    conv.messages.push(message);
                    conv.lastMessage = {
                        sender: req.user._id,
                        text: `📅 Visit Request: ${property.title}`,
                        createdAt: now
                    };
                    conv.lastActivityAt = now;

                    const unreadCount = conv.unreadCount || new Map();
                    const recipientIdStr = property.ownerId.toString();
                    const currentCount = unreadCount.get(recipientIdStr) || 0;
                    unreadCount.set(recipientIdStr, currentCount + 1);
                    conv.unreadCount = unreadCount;

                    await conv.save();

                    const io = getIO();
                    if (io) {
                        const savedMsg = conv.messages[conv.messages.length - 1];
                        const messageWithSender = {
                            ...savedMsg.toObject(),
                            sender: {
                                _id: req.user._id,
                                name: req.user.name || "Tenant",
                                avatar: req.user.avatar
                            }
                        };
                        io.to(`conv:${conv._id}`).emit("message.new", {
                            conversationId: conv._id,
                            message: messageWithSender
                        });

                        const notification = new Notification({
                            recipient: property.ownerId,
                            type: "system",
                            title: "New Visit Request",
                            message: `Tenant ${req.user.name || "someone"} requested a visit for ${property.title} on ${targetStart.toLocaleDateString()}`,
                            data: {
                                propertyId: property._id,
                                senderId: req.user._id,
                                conversationId: conv._id
                            }
                        });
                        await notification.save();

                        io.to(`user:${property.ownerId}`).emit("notification.new", {
                            notification
                        });

                        const messageCountResult = await messageService.getUnreadMessageCount(property.ownerId);
                        const mCount = messageCountResult.success ? messageCountResult.count : 0;
                        const notificationCountResult = await messageNotificationService.getUnreadNotificationCount(property.ownerId);
                        const nCount = notificationCountResult.success ? notificationCountResult.count : 0;

                        io.to(`user:${property.ownerId}`).emit("unread.update", {
                            messages: mCount,
                            notifications: nCount
                        });
                    }
                }
            }
        } catch (chatErr) {
            console.error("Chat integration error for booking:", chatErr);
        }

        res.status(201).json({
            success: true,
            booking
        });
    } catch (err) {
        console.error("POST /properties/:id/bookings error:", err);
        res.status(500).json({ success: false, error: "Server error", message: err.message });
    }
});

// In-memory cache for neighborhood details
const neighborhoodCache = new Map();
const NEIGHBORHOOD_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Helper to calculate distance using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth's radius in meters
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
        Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
        Math.cos(phi1) *
            Math.cos(phi2) *
            Math.sin(deltaLambda / 2) *
            Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // returns distance in meters
}

// GET /api/properties/:id/neighborhood
router.get("/:id/neighborhood", async (req, res) => {
    try {
        const { id } = req.params;
        const property = await Property.findById(id).lean();

        if (!property) {
            return res.status(404).json({ success: false, error: "Property not found" });
        }

        // Coordinates check: [lng, lat]
        const coords = property.location?.coordinates;
        if (!coords || coords.length < 2 || (coords[0] === 0 && coords[1] === 0)) {
            return res.json({
                success: true,
                available: false,
                walkScore: 0,
                transitScore: 0,
                categories: {
                    schools: [],
                    hospitals: [],
                    groceries: [],
                    restaurants: [],
                    parks: [],
                    transit: []
                }
            });
        }

        const lng = coords[0];
        const lat = coords[1];

        // Cache key based on property ID and rounded coordinates (3 decimal places)
        const cacheKey = `prop_${id}_${lat.toFixed(3)}_${lng.toFixed(3)}`;
        const cachedEntry = neighborhoodCache.get(cacheKey);

        if (cachedEntry && Date.now() - cachedEntry.timestamp < NEIGHBORHOOD_CACHE_TTL) {
            console.log(`[Neighborhood] Serving cached results for property: ${id}`);
            return res.json(cachedEntry.data);
        }

        // Multiple fallback Overpass endpoints
        const OVERPASS_ENDPOINTS = [
            "https://overpass-api.de/api/interpreter",
            "https://overpass.kumi.systems/api/interpreter",
            "https://maps.mail.ru/osm/tools/overpass/api/interpreter"
        ];

        const around = `(around:1500,${lat},${lng})`;
        // Construct query to request node elements for all desired categories
        const query = `[out:json][timeout:12];
        (
          node["amenity"~"school|college|university"]${around};
          node["amenity"~"hospital|clinic|pharmacy"]${around};
          node["amenity"="supermarket"]${around};
          node["shop"~"supermarket|convenience"]${around};
          node["amenity"~"restaurant|cafe|fast_food"]${around};
          node["leisure"~"park|garden"]${around};
          node["amenity"~"bus_station|bus_stop"]${around};
          node["railway"="station"]${around};
          node["station"="subway"]${around};
        );
        out body center 150;`;

        let data = null;
        let fetchError = null;

        // Fetch with timeout helper
        const fetchWithTimeout = async (url, options, timeoutMs = 10000) => {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
            try {
                return await fetch(url, { ...options, signal: controller.signal });
            } finally {
                clearTimeout(timeoutId);
            }
        };

        // Query endpoints sequentially until one succeeds
        for (const endpoint of OVERPASS_ENDPOINTS) {
            try {
                const response = await fetchWithTimeout(endpoint, {
                    method: "POST",
                    headers: { "Content-Type": "application/x-www-form-urlencoded" },
                    body: `data=${encodeURIComponent(query)}`
                }, 10000);

                if (response.ok) {
                    data = await response.json();
                    break;
                }
            } catch (err) {
                console.warn(`[Neighborhood] Failed querying Overpass endpoint: ${endpoint}`, err.message);
                fetchError = err;
            }
        }

        if (!data || !data.elements) {
            console.error("[Neighborhood] All Overpass API queries failed:", fetchError?.message);
            // Fallback gracefully
            return res.json({
                success: true,
                available: false,
                walkScore: 0,
                transitScore: 0,
                categories: {
                    schools: [],
                    hospitals: [],
                    groceries: [],
                    restaurants: [],
                    parks: [],
                    transit: []
                }
            });
        }

        const elements = data.elements;
        const categories = {
            schools: [],
            hospitals: [],
            groceries: [],
            restaurants: [],
            parks: [],
            transit: []
        };

        // Category mapping
        const getCategoryKey = (elem) => {
            const tags = elem.tags || {};
            if (tags.amenity) {
                if (["school", "college", "university"].includes(tags.amenity)) return "schools";
                if (["hospital", "clinic", "pharmacy"].includes(tags.amenity)) return "hospitals";
                if (["restaurant", "cafe", "fast_food"].includes(tags.amenity)) return "restaurants";
                if (["bus_station", "bus_stop"].includes(tags.amenity)) return "transit";
                if (tags.amenity === "supermarket") return "groceries";
            }
            if (tags.shop && ["supermarket", "convenience"].includes(tags.shop)) return "groceries";
            if (tags.leisure && ["park", "garden"].includes(tags.leisure)) return "parks";
            if (tags.railway === "station") return "transit";
            if (tags.station === "subway") return "transit";
            return null;
        };

        const getAmenityLabel = (elem) => {
            const tags = elem.tags || {};
            if (tags.amenity) {
                if (tags.amenity === "school") return "School";
                if (tags.amenity === "college") return "College";
                if (tags.amenity === "university") return "University";
                if (tags.amenity === "hospital") return "Hospital";
                if (tags.amenity === "clinic") return "Clinic";
                if (tags.amenity === "pharmacy") return "Pharmacy";
                if (tags.amenity === "restaurant") return "Restaurant";
                if (tags.amenity === "cafe") return "Cafe";
                if (tags.amenity === "fast_food") return "Fast Food";
                if (tags.amenity === "bus_station") return "Bus Station";
                if (tags.amenity === "bus_stop") return "Bus Stop";
                if (tags.amenity === "supermarket") return "Supermarket";
            }
            if (tags.shop === "supermarket") return "Supermarket";
            if (tags.shop === "convenience") return "Convenience Store";
            if (tags.leisure === "park") return "Park";
            if (tags.leisure === "garden") return "Garden";
            if (tags.railway === "station") return "Train Station";
            if (tags.station === "subway") return "Metro Station";
            return "Amenity";
        };

        elements.forEach((elem) => {
            const catKey = getCategoryKey(elem);
            if (!catKey) return;

            const elemLat = elem.lat || elem.center?.lat;
            const elemLng = elem.lon || elem.center?.lon;
            if (!elemLat || !elemLng) return;

            const distance = Math.round(calculateDistance(lat, lng, elemLat, elemLng));
            const tags = elem.tags || {};
            const name = tags.name || `${getAmenityLabel(elem)}`;

            categories[catKey].push({
                name,
                category: tags.amenity || tags.shop || tags.leisure || catKey,
                distance,
                lat: elemLat,
                lng: elemLng
            });
        });

        // Sort each category nearest first and limit to 5
        Object.keys(categories).forEach((key) => {
            categories[key].sort((a, b) => a.distance - b.distance);
            categories[key] = categories[key].slice(0, 5);
        });

        // Compute scores
        // Walkability Score (0-100) based on categories: schools, hospitals, groceries, restaurants, parks
        let walkScore = 0;
        let activeWalkCategoriesCount = 0;
        const walkCategories = ["schools", "hospitals", "groceries", "restaurants", "parks"];

        walkCategories.forEach((catKey) => {
            const items = categories[catKey];
            if (items.length > 0) {
                activeWalkCategoriesCount++;
                // Proximity calculations for first 3 items in the category
                items.slice(0, 3).forEach((item) => {
                    if (item.distance <= 500) walkScore += 8;
                    else if (item.distance <= 1000) walkScore += 4;
                    else if (item.distance <= 1500) walkScore += 1.5;
                });
            }
        });
        // Category diversity bonus: +8 points per unique category found (max 40)
        walkScore += activeWalkCategoriesCount * 8;
        walkScore = Math.min(Math.round(walkScore), 100);

        // Transit Score (0-100) using only the transit category
        let transitScore = 0;
        const transitItems = categories.transit;
        transitItems.forEach((item) => {
            if (item.distance <= 500) transitScore += 25;
            else if (item.distance <= 1000) transitScore += 12;
            else if (item.distance <= 1500) transitScore += 5;
        });
        transitScore = Math.min(Math.round(transitScore), 100);

        // Standard developer note: This OpenStreetMap/Overpass-based implementation can be swapped for Google Places/WalkScore APIs later
        const responseData = {
            success: true,
            available: true,
            walkScore,
            transitScore,
            categories,
            provider: "openstreetmap_overpass" // Swappable with paid endpoints in future
        };

        // Cache results
        neighborhoodCache.set(cacheKey, {
            data: responseData,
            timestamp: Date.now()
        });

        res.json(responseData);
    } catch (err) {
        console.error("GET /properties/:id/neighborhood error:", err);
        // Fallback gracefully
        res.json({
            success: true,
            available: false,
            walkScore: 0,
            transitScore: 0,
            categories: {
                schools: [],
                hospitals: [],
                groceries: [],
                restaurants: [],
                parks: [],
                transit: []
            }
        });
    }
});

export default router;