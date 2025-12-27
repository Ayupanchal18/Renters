import { Router } from "express";
import { Property } from "../models/Property.js";
import { User } from "../models/User.js";
import { Favorite } from "../models/Favorite.js";
import mongoose from "mongoose";
import { connectDB } from "../src/config/db.js";
import { authenticateToken } from "../src/middleware/security.js";
import { propertyUpload, uploadPropertyPhotos } from "../src/middleware/cloudinaryUpload.js";
import { validatePropertyByListingType } from "../src/middleware/propertyValidation.js";
import { LISTING_TYPES } from "../../shared/propertyTypes.js";

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
 * Requirements: 9.1, 9.2
 * 
 * @param {Object} property - Property object with listingType and slug
 * @returns {string} URL path in format /rent/{slug} or /buy/{slug}
 */
function generatePropertyUrlPath(property) {
    if (!property || !property.slug) return null;

    const listingType = property.listingType || LISTING_TYPES.RENT;
    // Generate /rent/{slug} for rent properties (Requirement 9.1)
    // Generate /buy/{slug} for buy properties (Requirement 9.2)
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

// Create property (backward compatible - defaults to rent)
// Requirements: 10.1 - Default listingType to "rent" for backward compatibility
router.post("/", propertyUpload.array("photos", 10), async (req, res) => {
    try {
        const userId = req.headers["x-user-id"];
        if (!userId) return res.status(401).json({ error: "Unauthorized - provide x-user-id header (dev)" });

        const user = await User.findById(userId).lean();
        if (!user) return res.status(401).json({ error: "Invalid user id in x-user-id header" });

        const body = req.body || {};

        // Default listingType to "rent" for backward compatibility (Requirement 10.1)
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

        // Upload photos to Cloudinary instead of local storage
        const photoPaths = await uploadPropertyPhotos(req.files);

        const doc = new Property({
            ...body,
            listingType: body.listingType || LISTING_TYPES.RENT,
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
// GET all properties with basic filtering
router.get("/", async (req, res) => {
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

        if (req.query.bedrooms) filter.bedrooms = Number(req.query.bedrooms);
        if (req.query.furnishing) filter.furnishing = String(req.query.furnishing);

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

        console.log(`GET /properties: Found ${total} properties (filter: ${JSON.stringify(filter)})`);

        res.json({ items, total, page, pageSize: limit });

    } catch (err) {
        console.error("GET /properties error:", err);
        res.status(500).json({ error: "Server error", message: err.message });
    }
});

// Debug endpoint to check database status
router.get("/debug/status", async (req, res) => {
    try {
        await connectDB();

        const totalProperties = await Property.countDocuments({});
        const activeProperties = await Property.countDocuments({ isDeleted: false, status: "active" });
        const deletedProperties = await Property.countDocuments({ isDeleted: true });
        const inactiveProperties = await Property.countDocuments({ status: { $ne: "active" } });

        // Get sample of statuses
        const statusSample = await Property.aggregate([
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);

        // Get database name being used
        const dbName = mongoose.connection.db?.databaseName || 'unknown';

        res.json({
            success: true,
            database: {
                connected: true,
                name: dbName,
                totalProperties,
                activeProperties,
                deletedProperties,
                inactiveProperties,
                statusBreakdown: statusSample
            }
        });
    } catch (err) {
        console.error("Debug status error:", err);
        res.status(500).json({
            success: false,
            error: err.message,
            database: { connected: false }
        });
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
        const searchCategory = category || filters.category || "";

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

        // 3. Text Search (Title, Description, etc.)
        if (searchText) {
            const escapedQuery = String(searchText).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            const regex = new RegExp(escapedQuery, "i");

            andConditions.push({
                $or: [
                    { title: regex },
                    { description: regex },
                    { category: regex },
                    { propertyType: regex },
                    { "address.city": regex }, // adjust field path based on your Schema
                    { city: regex }
                ]
            });
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

        // Relevance Scoring (Only if searching text)
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

        // --- DEBUG LOGGING ---
        // Uncomment the line below to see the exact query being sent to Mongo
        console.log("Search Pipeline:", JSON.stringify(pipeline, null, 2));

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
            }).lean();
        }

        if (!property) {
            // If not found by ID or not a valid ObjectId, try by slug
            property = await Property.findOne({
                slug: identifier,
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

        // Add URL path based on listing type (Requirements 9.1, 9.2)
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

        // Add URL path based on listing type (Requirements 9.1, 9.2)
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

export default router;