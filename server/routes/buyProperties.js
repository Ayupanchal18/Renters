/**
 * Buy Properties Routes
 * Handles all buy-specific property endpoints
 */

import { Router } from "express";
import { Property } from "../models/Property.js";
import { User } from "../models/User.js";
import mongoose from "mongoose";
import { validatePropertyByListingType } from "../src/middleware/propertyValidation.js";
import { propertyUpload, uploadPropertyPhotos } from "../src/middleware/cloudinaryUpload.js";
import { LISTING_TYPES } from "../../shared/propertyTypes.js";

const router = Router();

/* ---------------------- HELPER FUNCTIONS ---------------------- */

/**
 * Escape special regex characters in a string
 */
function escapeRegex(str) {
    if (!str) return "";
    const specialChars = ['\\', '.', '*', '+', '?', '^', '$', '{', '}', '(', ')', '|', '[', ']'];
    let result = String(str);
    for (const char of specialChars) {
        result = result.split(char).join('\\' + char);
    }
    return result;
}

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

function generateBuyPropertyUrlPath(property) {
    if (!property || !property.slug) return null;
    return `/buy/${property.slug}`;
}

function addUrlPathToProperty(property) {
    if (!property) return property;
    return {
        ...property,
        urlPath: generateBuyPropertyUrlPath(property)
    };
}

/* ---------------------- BUY ROUTES ---------------------- */

/**
 * POST /api/properties/buy
 * Create a new buy property
 */
router.post("/", propertyUpload.array("photos", 10), validatePropertyByListingType, async (req, res) => {
    try {
        const userId = req.headers["x-user-id"];
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: "Unauthorized",
                message: "Provide x-user-id header"
            });
        }

        const user = await User.findById(userId).lean();
        if (!user) {
            return res.status(401).json({
                success: false,
                error: "Unauthorized",
                message: "Invalid user id"
            });
        }

        const body = req.body || {};

        if (body.listingType && body.listingType !== LISTING_TYPES.BUY) {
            return res.status(400).json({
                success: false,
                error: "Invalid listing type",
                message: "This endpoint only accepts buy properties"
            });
        }
        body.listingType = LISTING_TYPES.BUY;

        const required = ["category", "title", "propertyType", "furnishing", "availableFrom", "city", "address", "sellingPrice"];
        for (const r of required) {
            if (body[r] === undefined || body[r] === null || body[r] === "") {
                return res.status(400).json({
                    success: false,
                    error: "Validation failed",
                    message: `Missing required field: ${r}`,
                    field: r
                });
            }
        }

        const ownerName = body.ownerName || user.name;
        const ownerPhone = body.ownerPhone || user.phone;
        if (!ownerPhone) {
            return res.status(400).json({
                success: false,
                error: "Validation failed",
                message: "ownerPhone is required"
            });
        }

        const baseSlug = slugify(`${body.title}-${body.city || ""}`.slice(0, 120));
        const slug = await makeUniqueSlug(baseSlug);
        const listingNumber = makeListingNumber();
        const photoPaths = await uploadPropertyPhotos(req.files);

        const doc = new Property({
            ...body,
            listingType: LISTING_TYPES.BUY,
            photos: photoPaths,
            ownerId: user._id,
            ownerName,
            ownerPhone,
            ownerEmail: body.ownerEmail || user.email || "",
            slug,
            listingNumber,
            location: body.location || (body.lat && body.lng ? { type: "Point", coordinates: [body.lng, body.lat] } : undefined),
        });

        await doc.save();
        res.status(201).json({ success: true, data: doc });
    } catch (err) {
        if (err.name === "ValidationError") {
            const messages = Object.values(err.errors).map(e => e.message);
            return res.status(400).json({ success: false, error: "Validation failed", details: messages });
        }
        console.error("POST /properties/buy error:", err);
        res.status(500).json({ success: false, error: "Server error", message: err.message });
    }
});


/**
 * GET /api/properties/buy
 * Get all buy properties with filtering
 */
router.get("/", async (req, res) => {
    try {
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(100, Number(req.query.limit) || 12);
        const skip = (page - 1) * limit;

        const filter = {
            listingType: LISTING_TYPES.BUY,
            isDeleted: false,
            status: "active"
        };

        if (req.query.city) filter.city = String(req.query.city);
        if (req.query.category) filter.category = String(req.query.category);
        if (req.query.propertyType) filter.propertyType = String(req.query.propertyType);
        if (req.query.ownerId && mongoose.Types.ObjectId.isValid(req.query.ownerId)) {
            filter.ownerId = req.query.ownerId;
        }

        if (req.query.minPrice) filter.sellingPrice = { ...(filter.sellingPrice || {}), $gte: Number(req.query.minPrice) };
        if (req.query.maxPrice) filter.sellingPrice = { ...(filter.sellingPrice || {}), $lte: Number(req.query.maxPrice) };
        if (req.query.possessionStatus) filter.possessionStatus = String(req.query.possessionStatus);
        if (req.query.loanAvailable !== undefined) filter.loanAvailable = req.query.loanAvailable === "true";
        if (req.query.bedrooms) filter.bedrooms = Number(req.query.bedrooms);
        if (req.query.furnishing) filter.furnishing = String(req.query.furnishing);
        if (req.query.q) filter.$text = { $search: String(req.query.q) };

        const sortParam = String(req.query.sort || "newest");
        let mongoSort = { createdAt: -1 };
        if (sortParam === "price_low_to_high") mongoSort = { sellingPrice: 1, createdAt: -1 };
        else if (sortParam === "price_high_to_low") mongoSort = { sellingPrice: -1, createdAt: -1 };
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

        res.json({
            success: true,
            data: { items, total, page, pageSize: limit }
        });

    } catch (err) {
        console.error("GET /properties/buy error:", err);
        res.status(500).json({ success: false, error: "Server error", message: err.message });
    }
});

/**
 * GET /api/properties/buy/:identifier
 * Get a single buy property by ID or slug
 */
router.get("/:identifier", async (req, res) => {
    try {
        const { identifier } = req.params;
        let property;

        if (mongoose.Types.ObjectId.isValid(identifier)) {
            property = await Property.findOne({
                _id: identifier,
                listingType: LISTING_TYPES.BUY,
                isDeleted: false,
                status: "active"
            }).lean();
        }

        if (!property) {
            property = await Property.findOne({
                slug: identifier,
                listingType: LISTING_TYPES.BUY,
                isDeleted: false,
                status: "active"
            }).lean();
        }

        if (!property) {
            const rentProperty = await Property.findOne({
                $or: [
                    { _id: mongoose.Types.ObjectId.isValid(identifier) ? identifier : null },
                    { slug: identifier }
                ],
                listingType: LISTING_TYPES.RENT,
                isDeleted: false
            }).lean();

            if (rentProperty) {
                return res.status(404).json({
                    success: false,
                    error: "Property not found",
                    message: "This property is listed for rent, not sale"
                });
            }

            return res.status(404).json({
                success: false,
                error: "Property not found",
                message: "The requested buy property could not be found"
            });
        }

        const propertyWithUrl = addUrlPathToProperty(property);
        res.json({ success: true, data: propertyWithUrl });

    } catch (err) {
        console.error("GET /properties/buy/:identifier error:", err);
        res.status(500).json({ success: false, error: "Server error", message: err.message });
    }
});


/**
 * POST /api/properties/buy/search
 * Search buy properties with buy-specific filters
 */
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

        // Base match: only buy properties
        const matchStage = {
            listingType: LISTING_TYPES.BUY,
            isDeleted: false,
            status: "active"
        };

        const andConditions = [];

        // Text search
        if (searchText) {
            const escapedQuery = escapeRegex(searchText);
            const regex = new RegExp(escapedQuery, "i");

            andConditions.push({
                $or: [
                    { title: regex },
                    { description: regex },
                    { category: regex },
                    { propertyType: regex },
                    { city: regex }
                ]
            });
        }

        // Location search
        if (searchLocation) {
            const locationRegex = new RegExp(escapeRegex(searchLocation), "i");
            andConditions.push({
                $or: [
                    { city: locationRegex },
                    { address: locationRegex }
                ]
            });
        }

        // Property type filter
        if (searchPropertyType) {
            const typeRegex = new RegExp(escapeRegex(searchPropertyType), "i");
            matchStage.propertyType = typeRegex;
        }

        // Category filter
        if (category) {
            const categoryRegex = new RegExp(escapeRegex(category), "i");
            matchStage.category = categoryRegex;
        }

        // Buy-specific price range filter (sellingPrice)
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

        // Buy-specific: possession status filter
        if (safeFilters.possessionStatus) {
            matchStage.possessionStatus = safeFilters.possessionStatus;
        }

        // Buy-specific: loan available filter
        if (safeFilters.loanAvailable !== undefined && safeFilters.loanAvailable !== null) {
            matchStage.loanAvailable = safeFilters.loanAvailable;
        }

        // Bedrooms filter
        if (safeFilters.bedrooms && Array.isArray(safeFilters.bedrooms) && safeFilters.bedrooms.length > 0) {
            const bedroomConditions = safeFilters.bedrooms.map(bed => {
                if (bed === "5+" || bed === 5) {
                    return { bedrooms: { $gte: 5 } };
                }
                return { bedrooms: Number(bed) };
            });
            andConditions.push({ $or: bedroomConditions });
        }

        // Amenities filter
        if (safeFilters.amenities && Array.isArray(safeFilters.amenities) && safeFilters.amenities.length > 0) {
            matchStage.amenities = { $all: safeFilters.amenities };
        }

        // Furnishing filter
        if (safeFilters.furnishing && Array.isArray(safeFilters.furnishing) && safeFilters.furnishing.length > 0) {
            matchStage.furnishing = { $in: safeFilters.furnishing };
        }

        if (andConditions.length > 0) {
            matchStage.$and = andConditions;
        }

        const pipeline = [];
        pipeline.push({ $match: matchStage });

        // Sorting
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

        // Relevance scoring for text search
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
                message: "Buy properties search completed successfully"
            },
            pagination: {
                total,
                page: pageNum,
                pageSize: limitNum,
                totalPages: Math.ceil(total / limitNum)
            }
        });

    } catch (err) {
        console.error("POST /properties/buy/search error:", err);
        return res.status(500).json({
            success: false,
            error: "Server error",
            message: err.message
        });
    }
});

export default router;
