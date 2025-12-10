import { Router } from "express";
import { Property } from "../models/Property.js";
import { User } from "../models/User.js";
import mongoose from "mongoose";
import multer from "multer";


const storage = multer.diskStorage({
    destination: "uploads/properties",
    filename: (req, file, cb) => {
        const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, unique + "-" + file.originalname);
    }
});
const upload = multer({ storage });


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
    // fallback - append ObjectId like string
    return `${base}-${mongoose.Types.ObjectId().toString().slice(-6)}`;
}

function makeListingNumber() {
    const dt = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const stamp = `${dt.getFullYear()}${pad(dt.getMonth() + 1)}${pad(dt.getDate())}${pad(dt.getHours())}${pad(dt.getMinutes())}${pad(dt.getSeconds())}`;
    return `LIST-${stamp}-${randomSuffix(4)}`;
}

// Create property
router.post("/", upload.array("photos", 10), async (req, res) => {
    try {
        const userId = req.headers["x-user-id"];
        if (!userId) return res.status(401).json({ error: "Unauthorized - provide x-user-id header (dev)" });

        const user = await User.findById(userId).lean();
        if (!user) return res.status(401).json({ error: "Invalid user id in x-user-id header" });

        // Required fields check (quick)
        const body = req.body || {};
        const required = ["category", "title", "propertyType", "furnishing", "availableFrom", "city", "address", "monthlyRent"];
        for (const r of required) {
            if (body[r] === undefined || body[r] === null || body[r] === "") {
                return res.status(400).json({ error: `Missing required field:${r}` });
            }
        }

        // owner info: prefer body if user explicitly passed ownerName/Phone (but keep ownerId for identity)
        const ownerName = body.ownerName || user.name;
        const ownerPhone = body.ownerPhone || user.phone;
        if (!ownerPhone) return res.status(400).json({ error: "ownerPhone missing and user has no phone" });

        // make slug/listingNumber
        const baseSlug = slugify(`${body.title}-${body.city || ""}`.slice(0, 120));
        const slug = await makeUniqueSlug(baseSlug);
        const listingNumber = makeListingNumber();
        const photoPaths = req.files?.map(f => `/uploads/properties/${f.filename}`) || [];

        const doc = new Property({
            ...body,
            photos: photoPaths,
            ownerId: user._id,
            ownerName,
            ownerPhone,
            ownerEmail: body.ownerEmail || user.email || "",
            slug,
            listingNumber,
            // Optionally set location if body provides lat/lng:
            location: body.location || (body.lat && body.lng ? { type: "Point", coordinates: [body.lng, body.lat] } : undefined),
        });

        await doc.save();
        res.status(201).json(doc);
    } catch (err) {
        // Mongoose validation errors:
        if (err.name === "ValidationError") {
            const messages = Object.values(err.errors).map(e => e.message);
            return res.status(400).json({ error: "Property validation failed", details: messages });
        }
        console.error(err);
        res.status(500).json({ error: "Server error", message: err.message });
    }
});

/* ---------------- LIST + FILTER + PAGINATION ---------------- */
// routes/properties.js


/* ----------------- small dev admin middleware ----------------- */
const isAdmin = (req, res, next) => {
    const role = req.headers["x-user-role"];
    if (role !== "admin") return res.status(403).json({ error: "Forbidden - admin only" });
    next();
};

/* ----------------- helpers ----------------- */
function parseCSV(q) {
    if (!q) return [];
    return String(q)
        .split(",")
        .map(s => s.trim())
        .filter(Boolean);
}

function buildRangeFilter(fieldName, minVal, maxVal) {
    const f = {};
    if (minVal !== undefined && minVal !== null && minVal !== "") f.$gte = Number(minVal);
    if (maxVal !== undefined && maxVal !== null && maxVal !== "") f.$lte = Number(maxVal);
    return Object.keys(f).length ? { [fieldName]: f } : null;
}

/* ----------------- Single powerful GET /properties ----------------- */
/**
 * Supported query params:
 * page, limit
 * city, category, propertyType, ownerId
 * minRent, maxRent
 * bedrooms, bathrooms
 * furnishing
 * amenities (comma separated) -> requires property to contain ALL those amenities
 * areaMin, areaMax -> will test against builtUpArea then carpetArea fallback
 * sort: rent_low_to_high | rent_high_to_low | newest | oldest | featured | nearest
 * lat, lng (required for nearest)
 */
// router.get("/", async (req, res) => {
//     try {
//         const page = Math.max(1, Number(req.query.page) || 1);
//         const limit = Math.min(100, Number(req.query.limit) || 12);
//         const skip = (page - 1) * limit;

//         // base filter: visible only
//         const filter = { isDeleted: false, status: "active" };

//         // simple equality filters
//         if (req.query.city) filter.city = String(req.query.city);
//         if (req.query.category) filter.category = String(req.query.category);
//         if (req.query.propertyType) filter.propertyType = String(req.query.propertyType);
//         if (req.query.ownerId) {
//             if (mongoose.Types.ObjectId.isValid(req.query.ownerId)) filter.ownerId = req.query.ownerId;
//         }

//         // numeric range filters
//         if (req.query.minRent) filter.monthlyRent = { ...(filter.monthlyRent || {}), $gte: Number(req.query.minRent) };
//         if (req.query.maxRent) filter.monthlyRent = { ...(filter.monthlyRent || {}), $lte: Number(req.query.maxRent) };

//         if (req.query.bedrooms) filter.bedrooms = Number(req.query.bedrooms);
//         if (req.query.bathrooms) filter.bathrooms = Number(req.query.bathrooms);

//         if (req.query.furnishing) filter.furnishing = String(req.query.furnishing);

//         // amenities: require EVERY amenity in the list
//         if (req.query.amenities) {
//             const amenities = parseCSV(req.query.amenities);
//             if (amenities.length) filter.amenities = { $all: amenities };
//         }

//         // area filtering (check builtUpArea OR carpetArea)
//         const areaMin = req.query.areaMin, areaMax = req.query.areaMax;
//         if (areaMin || areaMax) {
//             const areaFilter = {};
//             if (areaMin) areaFilter.$gte = Number(areaMin);
//             if (areaMax) areaFilter.$lte = Number(areaMax);
//             // we'll use $or to accept if either builtUpArea or carpetArea falls in range
//             filter.$or = [
//                 { builtUpArea: areaFilter },
//                 { carpetArea: areaFilter }
//             ];
//         }

//         // search text (q)
//         if (req.query.q) {
//             // use text search if possible
//             filter.$text = { $search: String(req.query.q) };
//         }

//         // Sorting
//         const sortParam = String(req.query.sort || "newest");
//         let mongoSort = { createdAt: -1 }; // newest by default
//         let geoNear = null;

//         if (sortParam === "rent_low_to_high") mongoSort = { monthlyRent: 1, createdAt: -1 };
//         else if (sortParam === "rent_high_to_low") mongoSort = { monthlyRent: -1, createdAt: -1 };
//         else if (sortParam === "oldest") mongoSort = { createdAt: 1 };
//         else if (sortParam === "featured") mongoSort = { featured: -1, createdAt: -1 };
//         else if (sortParam === "nearest") {
//             const lat = Number(req.query.lat);
//             const lng = Number(req.query.lng);
//             if (!isFinite(lat) || !isFinite(lng)) {
//                 return res.status(400).json({ error: "nearest sort requires lat & lng query params" });
//             }
//             // for nearest, we'll use aggregate $geoNear
//             geoNear = {
//                 near: { type: "Point", coordinates: [lng, lat] },
//                 distanceField: "dist.calculated",
//                 spherical: true,
//                 query: filter,
//             };
//             // if using geoNear, we won't use find+skip+limit directly
//         }

//         if (geoNear) {
//             // Aggregation pipeline for nearest
//             const agg = [
//                 { $geoNear: geoNear },
//                 { $sort: { "dist.calculated": 1, createdAt: -1 } },
//                 { $skip: skip },
//                 { $limit: limit },
//                 {
//                     $project: {
//                         title: 1, slug: 1, city: 1, monthlyRent: 1, photos: 1, listingNumber: 1, location: 1, dist: 1
//                     }
//                 }
//             ];

//             const items = await Property.aggregate(agg);
//             // countDocuments for geoNear using the same query
//             const total = await Property.countDocuments(filter);
//             return res.json({ items, total, page, pageSize: limit });
//         }

//         // Non-geo flow
//         // If text search was added, score sort is useful
//         let query = Property.find(filter).sort(mongoSort).skip(skip).limit(limit).lean();

//         if (filter.$text) {
//             // project text score and sort by it first
//             query = Property.find(filter, { score: { $meta: "textScore" } })
//                 .sort({ score: { $meta: "textScore" }, ...mongoSort })
//                 .skip(skip)
//                 .limit(limit)
//                 .lean();
//         }

//         const [items, total] = await Promise.all([query.exec(), Property.countDocuments(filter)]);
//         res.json({ items, total, page, pageSize: limit });

//     } catch (err) {
//         console.error("GET /properties error:", err);
//         res.status(500).json({ error: "Server error", message: err.message });
//     }
// });

// router.post("/search", async (req, res) => {
//     try {
//         const {
//             // Pagination
//             page = 1,
//             limit = 12,

//             // Basic filters
//             category,
//             propertyType,
//             furnishing,
//             city,
//             ownerType,
//             status = "active",

//             // Numeric range filters
//             monthlyRent,
//             securityDeposit,
//             maintenanceCharge,
//             builtUpArea,
//             carpetArea,
//             bedrooms,
//             bathrooms,
//             balconies,
//             floorNumber,
//             totalFloors,
//             views,

//             // Boolean filters
//             negotiable,
//             kitchenAvailable,
//             featured,

//             // Room specific
//             roomType,
//             bathroomType,

//             // String filters
//             facingDirection,
//             parking,
//             propertyAge,
//             washroom,
//             frontage,

//             // Array filters
//             amenities,

//             // Date filters
//             availableFrom,

//             // Owner filters
//             ownerId,

//             // Search
//             searchText,

//             // Sorting
//             sort = "newest",
//         } = req.body;

//         // Validate pagination
//         const pageNum = Math.max(1, Number(page));
//         const limitNum = Math.min(100, Number(limit));
//         const skip = (pageNum - 1) * limitNum;

//         // Base filter: only active and not deleted
//         const filter = {
//             isDeleted: false,
//             status: status || "active"
//         };

//         // === EXACT MATCH FILTERS ===
//         if (category) filter.category = category;
//         if (propertyType) filter.propertyType = propertyType;
//         if (furnishing) filter.furnishing = furnishing;
//         if (city) filter.city = city;
//         if (ownerType) filter.ownerType = ownerType;
//         if (roomType) filter.roomType = roomType;
//         if (bathroomType) filter.bathroomType = bathroomType;
//         if (facingDirection) filter.facingDirection = facingDirection;
//         if (parking) filter.parking = parking;
//         if (propertyAge) filter.propertyAge = propertyAge;
//         if (washroom) filter.washroom = washroom;
//         if (frontage) filter.frontage = frontage;

//         // Owner ID validation
//         if (ownerId) {
//             if (mongoose.Types.ObjectId.isValid(ownerId)) {
//                 filter.ownerId = ownerId;
//             }
//         }

//         // === BOOLEAN FILTERS ===
//         if (typeof negotiable === "boolean") filter.negotiable = negotiable;
//         if (typeof kitchenAvailable === "boolean") filter.kitchenAvailable = kitchenAvailable;
//         if (typeof featured === "boolean") filter.featured = featured;

//         // === NUMERIC RANGE FILTERS ===
//         // Monthly Rent
//         if (monthlyRent) {
//             if (monthlyRent.min !== undefined || monthlyRent.max !== undefined) {
//                 filter.monthlyRent = {};
//                 if (monthlyRent.min !== undefined) filter.monthlyRent.$gte = Number(monthlyRent.min);
//                 if (monthlyRent.max !== undefined) filter.monthlyRent.$lte = Number(monthlyRent.max);
//             }
//         }

//         // Security Deposit
//         if (securityDeposit) {
//             if (securityDeposit.min !== undefined || securityDeposit.max !== undefined) {
//                 filter.securityDeposit = {};
//                 if (securityDeposit.min !== undefined) filter.securityDeposit.$gte = Number(securityDeposit.min);
//                 if (securityDeposit.max !== undefined) filter.securityDeposit.$lte = Number(securityDeposit.max);
//             }
//         }

//         // Maintenance Charge
//         if (maintenanceCharge) {
//             if (maintenanceCharge.min !== undefined || maintenanceCharge.max !== undefined) {
//                 filter.maintenanceCharge = {};
//                 if (maintenanceCharge.min !== undefined) filter.maintenanceCharge.$gte = Number(maintenanceCharge.min);
//                 if (maintenanceCharge.max !== undefined) filter.maintenanceCharge.$lte = Number(maintenanceCharge.max);
//             }
//         }

//         // Built Up Area
//         if (builtUpArea) {
//             if (builtUpArea.min !== undefined || builtUpArea.max !== undefined) {
//                 filter.builtUpArea = {};
//                 if (builtUpArea.min !== undefined) filter.builtUpArea.$gte = Number(builtUpArea.min);
//                 if (builtUpArea.max !== undefined) filter.builtUpArea.$lte = Number(builtUpArea.max);
//             }
//         }

//         // Carpet Area
//         if (carpetArea) {
//             if (carpetArea.min !== undefined || carpetArea.max !== undefined) {
//                 filter.carpetArea = {};
//                 if (carpetArea.min !== undefined) filter.carpetArea.$gte = Number(carpetArea.min);
//                 if (carpetArea.max !== undefined) filter.carpetArea.$lte = Number(carpetArea.max);
//             }
//         }

//         // Bedrooms
//         if (bedrooms) {
//             if (typeof bedrooms === "number") {
//                 filter.bedrooms = bedrooms;
//             } else if (bedrooms.min !== undefined || bedrooms.max !== undefined) {
//                 filter.bedrooms = {};
//                 if (bedrooms.min !== undefined) filter.bedrooms.$gte = Number(bedrooms.min);
//                 if (bedrooms.max !== undefined) filter.bedrooms.$lte = Number(bedrooms.max);
//             }
//         }

//         // Bathrooms
//         if (bathrooms) {
//             if (typeof bathrooms === "number") {
//                 filter.bathrooms = bathrooms;
//             } else if (bathrooms.min !== undefined || bathrooms.max !== undefined) {
//                 filter.bathrooms = {};
//                 if (bathrooms.min !== undefined) filter.bathrooms.$gte = Number(bathrooms.min);
//                 if (bathrooms.max !== undefined) filter.bathrooms.$lte = Number(bathrooms.max);
//             }
//         }

//         // Balconies
//         if (balconies) {
//             if (typeof balconies === "number") {
//                 filter.balconies = balconies;
//             } else if (balconies.min !== undefined || balconies.max !== undefined) {
//                 filter.balconies = {};
//                 if (balconies.min !== undefined) filter.balconies.$gte = Number(balconies.min);
//                 if (balconies.max !== undefined) filter.balconies.$lte = Number(balconies.max);
//             }
//         }

//         // Floor Number
//         if (floorNumber) {
//             if (typeof floorNumber === "number") {
//                 filter.floorNumber = floorNumber;
//             } else if (floorNumber.min !== undefined || floorNumber.max !== undefined) {
//                 filter.floorNumber = {};
//                 if (floorNumber.min !== undefined) filter.floorNumber.$gte = Number(floorNumber.min);
//                 if (floorNumber.max !== undefined) filter.floorNumber.$lte = Number(floorNumber.max);
//             }
//         }

//         // Total Floors
//         if (totalFloors) {
//             if (typeof totalFloors === "number") {
//                 filter.totalFloors = totalFloors;
//             } else if (totalFloors.min !== undefined || totalFloors.max !== undefined) {
//                 filter.totalFloors = {};
//                 if (totalFloors.min !== undefined) filter.totalFloors.$gte = Number(totalFloors.min);
//                 if (totalFloors.max !== undefined) filter.totalFloors.$lte = Number(totalFloors.max);
//             }
//         }

//         // Views
//         if (views) {
//             if (views.min !== undefined || views.max !== undefined) {
//                 filter.views = {};
//                 if (views.min !== undefined) filter.views.$gte = Number(views.min);
//                 if (views.max !== undefined) filter.views.$lte = Number(views.max);
//             }
//         }

//         // === AMENITIES FILTER ===
//         // Supports multiple modes: 'all' (requires all), 'any' (requires at least one)
//         if (amenities && Array.isArray(amenities) && amenities.length > 0) {
//             // Default: require ALL amenities
//             filter.amenities = { $all: amenities };
//         }

//         // === DATE FILTERS ===
//         if (availableFrom) {
//             if (availableFrom.from || availableFrom.to) {
//                 filter.availableFrom = {};
//                 if (availableFrom.from) filter.availableFrom.$gte = new Date(availableFrom.from);
//                 if (availableFrom.to) filter.availableFrom.$lte = new Date(availableFrom.to);
//             }
//         }

//         // === TEXT SEARCH ===
//         if (searchText) {
//             filter.$text = { $search: searchText };
//         }

//         // === SORTING ===
//         let mongoSort = { createdAt: -1 }; // newest by default
//         let useGeoNear = false;
//         let geoNearPipeline = null;

//         switch (sort) {
//             case "rent_low_to_high":
//                 mongoSort = { monthlyRent: 1, createdAt: -1 };
//                 break;
//             case "rent_high_to_low":
//                 mongoSort = { monthlyRent: -1, createdAt: -1 };
//                 break;
//             case "oldest":
//                 mongoSort = { createdAt: 1 };
//                 break;
//             case "featured":
//                 mongoSort = { featured: -1, createdAt: -1 };
//                 break;
//             case "most_viewed":
//                 mongoSort = { views: -1, createdAt: -1 };
//                 break;
//             case "nearest":
//                 const lat = Number(latitude);
//                 const lng = Number(longitude);
//                 if (!isFinite(lat) || !isFinite(lng)) {
//                     return res.status(400).json({
//                         success: false,
//                         error: "For 'nearest' sort, latitude and longitude are required"
//                     });
//                 }
//                 useGeoNear = true;
//                 geoNearPipeline = {
//                     near: { type: "Point", coordinates: [lng, lat] },
//                     distanceField: "distance",
//                     spherical: true,
//                     query: filter,
//                 };
//                 if (maxDistance) {
//                     geoNearPipeline.maxDistance = Number(maxDistance);
//                 }
//                 break;
//             case "newest":
//             default:
//                 mongoSort = { createdAt: -1 };
//         }

//         // === EXECUTE QUERY ===
//         if (useGeoNear) {
//             // Use aggregation for geo-based sorting
//             const aggregation = [
//                 { $geoNear: geoNearPipeline },
//                 { $sort: { distance: 1, createdAt: -1 } },
//                 { $skip: skip },
//                 { $limit: limitNum }
//             ];

//             const items = await Property.aggregate(aggregation);
//             const total = await Property.countDocuments(filter);

//             return res.json({
//                 success: true,
//                 data: items,
//                 pagination: {
//                     total,
//                     page: pageNum,
//                     pageSize: limitNum,
//                     totalPages: Math.ceil(total / limitNum)
//                 }
//             });
//         }

//         // Normal query
//         let query = Property.find(filter)
//             .sort(mongoSort)
//             .skip(skip)
//             .limit(limitNum)
//             .lean();

//         // If text search is used, include text score
//         if (filter.$text) {
//             query = Property.find(filter, { score: { $meta: "textScore" } })
//                 .sort({ score: { $meta: "textScore" }, ...mongoSort })
//                 .skip(skip)
//                 .limit(limitNum)
//                 .lean();
//         }

//         const [items, total] = await Promise.all([
//             query.exec(),
//             Property.countDocuments(filter)
//         ]);

//         res.json({
//             success: true,
//             data: items,
//             pagination: {
//                 total,
//                 page: pageNum,
//                 pageSize: limitNum,
//                 totalPages: Math.ceil(total / limitNum)
//             }
//         });

//     } catch (err) {
//         console.error("POST /properties/search error:", err);
//         res.status(500).json({
//             success: false,
//             error: "Server error",
//             message: err.message
//         });
//     }
// });

// /* -------------- Search (autocomplete) -------------- */
// router.get("/search", async (req, res) => {
//     try {
//         const q = String(req.query.q || "").trim();
//         if (!q) return res.json({ items: [] });

//         // text search first
//         const textResults = await Property.find(
//             { $text: { $search: q }, isDeleted: false, status: "active" },
//             { score: { $meta: "textScore" } }
//         )
//             .sort({ score: { $meta: "textScore" } })
//             .limit(10)
//             .select("title slug city monthlyRent photos listingNumber")
//             .lean();

//         if (textResults.length) return res.json({ items: textResults });

//         // fallback: prefix regex search
//         const regex = new RegExp("^" + q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
//         const fallback = await Property.find(
//             { $or: [{ title: regex }, { city: regex }], isDeleted: false, status: "active" }
//         )
//             .limit(10)
//             .select("title slug city monthlyRent photos listingNumber")
//             .lean();

//         res.json({ items: fallback });
//     } catch (err) {
//         console.error("GET /properties/search error:", err);
//         res.status(500).json({ error: "Server error" });
//     }
// });


router.post("/properties/search", async (req, res) => {
    try {
        const {
            // 1. Search Query (Text)
            q = "",

            // 2. Pagination
            page = 1,
            limit = 12,

            // 3. Sorting
            // Options: "newest", "oldest", "rent_low", "rent_high", "nearest", "featured"
            sort = "newest",

            // Required only if sort === "nearest"
            userLocation = null, // { lat: number, lng: number }

            // 4. Filters Object
            filters = {}
        } = req.body;

        // --- A. Setup Pagination ---
        const pageNum = Math.max(1, Number(page));
        const limitNum = Math.min(100, Number(limit));
        const skip = (pageNum - 1) * limitNum;

        // --- B. Build the 'Match' Object (The Filter Criteria) ---
        const matchStage = {
            isDeleted: false,
            status: "active" // Default to showing only active
        };

        const andConditions = [];

        // 1. Global Text Search ("q")
        // Matches: Title, City, Address, Description, ListingNumber, Slug
        if (q) {
            const escapedQ = String(q).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            const regex = new RegExp(escapedQ, "i"); // Case-insensitive regex

            const textConditions = [
                { title: regex },
                { city: regex },
                { address: regex },
                { description: regex },
                { listingNumber: regex }, // Schema defines this as String, so regex works
                { slug: regex },
                { propertyType: regex },
                { category: regex }
            ];

            // Search inside amenities array
            textConditions.push({ amenities: regex });

            andConditions.push({ $or: textConditions });
        }

        // 2. Exact Match / Enum Filters
        // We map these directly from the schema
        const exactFields = [
            "category",         // room, flat, house...
            "propertyType",     // 1BHK, 2BHK...
            "furnishing",       // unfurnished, semi...
            "city",
            "ownerType",        // owner, agent...
            "roomType",         // single, double
            "bathroomType",     // attached, common
            "facingDirection",
            "parking",
            "propertyAge",
            "washroom",
            "frontage",
            "status"            // if you want to override default 'active'
        ];

        exactFields.forEach((field) => {
            if (filters[field]) {
                matchStage[field] = filters[field];
            }
        });

        // 3. ID Checks
        if (filters.ownerId && mongoose.Types.ObjectId.isValid(filters.ownerId)) {
            matchStage.ownerId = new mongoose.Types.ObjectId(filters.ownerId);
        }

        // 4. Boolean Filters
        // Handles true/false checks
        if (typeof filters.negotiable === "boolean") matchStage.negotiable = filters.negotiable;
        if (typeof filters.kitchenAvailable === "boolean") matchStage.kitchenAvailable = filters.kitchenAvailable;
        if (typeof filters.featured === "boolean") matchStage.featured = filters.featured;

        // 5. Numeric Range Filters
        // Helper to handle { min: 100, max: 500 }
        const addRange = (field, rangeObj) => {
            if (!rangeObj) return;
            const query = {};
            if (rangeObj.min !== undefined && rangeObj.min !== "") query.$gte = Number(rangeObj.min);
            if (rangeObj.max !== undefined && rangeObj.max !== "") query.$lte = Number(rangeObj.max);

            if (Object.keys(query).length > 0) {
                matchStage[field] = query;
            }
        };

        addRange("monthlyRent", filters.monthlyRent);
        addRange("securityDeposit", filters.securityDeposit);
        addRange("maintenanceCharge", filters.maintenanceCharge);
        addRange("bedrooms", filters.bedrooms);
        addRange("bathrooms", filters.bathrooms);
        addRange("balconies", filters.balconies);
        addRange("floorNumber", filters.floorNumber);
        addRange("totalFloors", filters.totalFloors);
        addRange("views", filters.views); // metrics

        // *Special Handling: Bedrooms/Bathrooms (Direct Number vs Range)*
        // Sometimes frontend sends "bedrooms": 2 (exact) instead of { min: 2 }
        if (typeof filters.bedrooms === 'number') matchStage.bedrooms = filters.bedrooms;
        if (typeof filters.bathrooms === 'number') matchStage.bathrooms = filters.bathrooms;

        // 6. Area Logic (BuiltUp OR Carpet)
        // If user says "Min 1000 sqft", we check if EITHER builtUp OR carpet meets criteria
        if (filters.area) { // expects { min: X, max: Y }
            const areaQ = {};
            if (filters.area.min) areaQ.$gte = Number(filters.area.min);
            if (filters.area.max) areaQ.$lte = Number(filters.area.max);

            if (Object.keys(areaQ).length > 0) {
                andConditions.push({
                    $or: [
                        { builtUpArea: areaQ },
                        { carpetArea: areaQ }
                    ]
                });
            }
        }

        // 7. Amenities (Must have ALL listed)
        if (filters.amenities && Array.isArray(filters.amenities) && filters.amenities.length > 0) {
            matchStage.amenities = { $all: filters.amenities };
        }

        // 8. Date Logic (Available From)
        if (filters.availableFrom) {
            // "I need a place available by this date" usually means property.availableFrom <= userDate
            // OR "I need a place available AFTER this date"
            const dateQ = {};
            if (filters.availableFrom.gte) dateQ.$gte = new Date(filters.availableFrom.gte);
            if (filters.availableFrom.lte) dateQ.$lte = new Date(filters.availableFrom.lte);

            if (Object.keys(dateQ).length > 0) {
                matchStage.availableFrom = dateQ;
            }
        }

        // Apply $and conditions
        if (andConditions.length > 0) {
            matchStage.$and = andConditions;
        }

        // --- C. Build Aggregation Pipeline ---
        const pipeline = [];

        // 1. Geo Handling (MUST be first if used)
        if (sort === "nearest") {
            if (!userLocation || !userLocation.lat || !userLocation.lng) {
                return res.status(400).json({
                    success: false,
                    error: "Location (lat, lng) is required for 'nearest' sort."
                });
            }

            pipeline.push({
                $geoNear: {
                    near: {
                        type: "Point",
                        coordinates: [Number(userLocation.lng), Number(userLocation.lat)]
                    },
                    distanceField: "distance", // Output field for distance in meters
                    spherical: true,
                    query: matchStage, // **Optimization**: Filter inside geoNear
                }
            });
        } else {
            // Standard Match if not using Geo Search
            pipeline.push({ $match: matchStage });
        }

        // 2. Sorting
        let sortStage = { createdAt: -1 }; // Default: Newest

        switch (sort) {
            case "rent_low":
                sortStage = { monthlyRent: 1, createdAt: -1 };
                break;
            case "rent_high":
                sortStage = { monthlyRent: -1, createdAt: -1 };
                break;
            case "oldest":
                sortStage = { createdAt: 1 };
                break;
            case "featured":
                sortStage = { featured: -1, createdAt: -1 };
                break;
            case "popular":
                sortStage = { views: -1, createdAt: -1 };
                break;
            case "nearest":
                // $geoNear already sorts by distance, but we can add secondary sort
                sortStage = { distance: 1 };
                break;
            case "newest":
            default:
                sortStage = { createdAt: -1 };
        }

        pipeline.push({ $sort: sortStage });

        // 3. Facet (Data + Total Count)
        pipeline.push({
            $facet: {
                metadata: [{ $count: "total" }],
                data: [
                    { $skip: skip },
                    { $limit: limitNum },
                    // Project fields if you want to exclude heavy data like descriptions
                    // { $project: { description: 0, ... } }
                ]
            }
        });

        // --- D. Execute ---
        const result = await Property.aggregate(pipeline);

        // --- E. Format Response ---
        const data = result[0].data;
        const total = result[0].metadata[0] ? result[0].metadata[0].total : 0;

        return res.json({
            success: true,
            data: data,
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



/* -------------- Single property by slug OR id -------------- */
// router.get("/:slugOrId", async (req, res) => {
//     try {
//         const key = req.params.slugOrId;
//         let prop = await Property.findOne({ slug: key, isDeleted: false })
//             .populate("ownerId", "name email phone")
//             .lean();

//         if (!prop && mongoose.Types.ObjectId.isValid(key)) {
//             prop = await Property.findOne({ _id: key, isDeleted: false })
//                 .populate("ownerId", "name email phone")
//                 .lean();
//         }
//         if (!prop) return res.status(404).json({ error: "Not found" });

//         // increment views asynchronously (no await)
//         Property.findByIdAndUpdate(prop._id, { $inc: { views: 1 } }).catch(() => { });

//         res.json(prop);
//     } catch (err) {
//         console.error("GET /properties/:slugOrId error:", err);
//         res.status(500).json({ error: "Server error" });
//     }
// });
router.post("/get-property", async (req, res) => {
    try {
        const { key } = req.body;
        if (!key) return res.status(400).json({ error: "Key is required" });

        let prop = await Property.findOne({ slug: key, isDeleted: false })
            .populate("ownerId", "name email phone")
            .lean();

        if (!prop && mongoose.Types.ObjectId.isValid(key)) {
            prop = await Property.findOne({ _id: key, isDeleted: false })
                .populate("ownerId", "name email phone")
                .lean();
        }

        if (!prop) return res.status(404).json({ error: "Not found" });

        Property.findByIdAndUpdate(prop._id, { $inc: { views: 1 } }).catch(() => { });

        res.json(prop);
    } catch (err) {
        console.error("GET property (payload) error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

/* -------------- Related properties -------------- */
/**
 * GET /properties/related/:slugOrId
 * - finds listings in same city, same category and/or similar rent range
 */
router.get("/related/:slugOrId", async (req, res) => {
    try {
        const key = req.params.slugOrId;
        let base = await Property.findOne({ slug: key, isDeleted: false }).lean();
        if (!base && mongoose.Types.ObjectId.isValid(key)) {
            base = await Property.findById(key).lean();
        }
        if (!base) return res.status(404).json({ error: "Base property not found" });

        const rent = Number(base.monthlyRent || 0);
        const delta = Math.max(1000, Math.floor(rent * 0.25)); // 25% range or at least 1000
        const minRent = Math.max(0, rent - delta);
        const maxRent = rent + delta;

        const q = {
            _id: { $ne: base._id },
            isDeleted: false,
            status: "active",
            city: base.city,
            category: base.category,
            monthlyRent: { $gte: minRent, $lte: maxRent },
        };

        // prioritize same propertyType too
        const items = await Property.find(q)
            .sort({ featured: -1, createdAt: -1 })
            .limit(8)
            .select("title slug city monthlyRent photos listingNumber builtUpArea carpetArea bedrooms")
            .lean();

        res.json({ items });
    } catch (err) {
        console.error("GET /properties/related error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

/* ---------------- Admin: update status (approve/reject/block) ---------------- */
router.patch("/admin/:id/status", isAdmin, async (req, res) => {
    try {
        const id = req.params.id;
        const action = req.body.action || req.query.action; // 'approve' | 'reject' | 'block' | 'unblock'
        if (!["approve", "reject", "block", "unblock"].includes(action)) {
            return res.status(400).json({ error: "Invalid action" });
        }

        const prop = await Property.findById(id);
        if (!prop) return res.status(404).json({ error: "Not found" });

        if (action === "approve") {
            prop.status = "active";
        } else if (action === "reject" || action === "block") {
            prop.status = "inactive";
            if (action === "block") prop.status = "blocked";
        } else if (action === "unblock") {
            prop.status = "active";
        }

        await prop.save();
        res.json({ success: true, status: prop.status });
    } catch (err) {
        console.error("PATCH /admin/:id/status error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

/* ---------------- Favorites / Wishlist APIs ---------------- */
/**
 * POST /favorites/:propertyId  -> add to favorites (creates Favorite)
 * DELETE /favorites/:propertyId -> remove from favorites
 * GET /favorites -> list favorites for current user (x-user-id header)
 */

// add favorite
router.post("/favorites/:propertyId", async (req, res) => {
    try {
        const userId = req.headers["x-user-id"];
        if (!userId) return res.status(401).json({ error: "Unauthorized - x-user-id header required" });

        const propertyId = req.params.propertyId;
        if (!mongoose.Types.ObjectId.isValid(propertyId)) return res.status(400).json({ error: "Invalid property id" });

        // create favorite (idempotent)
        try {
            const fav = new Favorite({ userId, propertyId });
            await fav.save();
            // increment property's favoritesCount
            await Property.findByIdAndUpdate(propertyId, { $inc: { favoritesCount: 1 } }).catch(() => { });
            return res.status(201).json({ success: true });
        } catch (err) {
            // if duplicate key means already favorited
            if (err.code === 11000) return res.status(200).json({ success: true, message: "Already favorited" });
            throw err;
        }
    } catch (err) {
        console.error("POST /favorites error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// remove favorite
router.delete("/favorites/:propertyId", async (req, res) => {
    try {
        const userId = req.headers["x-user-id"];
        if (!userId) return res.status(401).json({ error: "Unauthorized - x-user-id header required" });

        const propertyId = req.params.propertyId;
        await Favorite.findOneAndDelete({ userId, propertyId });
        // decrement favoritesCount (min 0)
        await Property.findByIdAndUpdate(propertyId, { $inc: { favoritesCount: -1 } }).catch(() => { });
        // optional: ensure non-negative
        await Property.updateOne({ _id: propertyId, favoritesCount: { $lt: 0 } }, { $set: { favoritesCount: 0 } }).catch(() => { });
        res.json({ success: true });
    } catch (err) {
        console.error("DELETE /favorites error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// list favorites for user
router.get("/favorites", async (req, res) => {
    try {
        const userId = req.headers["x-user-id"];
        if (!userId) return res.status(401).json({ error: "Unauthorized - x-user-id header required" });

        const favs = await Favorite.find({ userId }).sort({ createdAt: -1 }).lean();
        const propertyIds = favs.map(f => f.propertyId);
        const items = await Property.find({ _id: { $in: propertyIds }, isDeleted: false }).lean();

        // keep original order as favorites
        const itemsById = new Map(items.map(it => [String(it._id), it]));
        const ordered = propertyIds.map(id => itemsById.get(String(id))).filter(Boolean);

        res.json({ items: ordered });
    } catch (err) {
        console.error("GET /favorites error:", err);
        res.status(500).json({ error: "Server error" });
    }
});



/* --------------------------- UPDATE PROPERTY --------------------------- */
// router.patch("/:id", async (req, res) => {
//     try {
//         const ownerId = req.headers["x-user-id"];
//         if (!ownerId)
//             return res
//                 .status(401)
//                 .json({ error: "Unauthorized (provide x-user-id header for dev)" });

//         const prop = await Property.findById(req.params.id);
//         if (!prop) return res.status(404).json({ error: "Not found" });

//         if (prop.ownerId.toString() !== ownerId) {
//             return res.status(403).json({ error: "Forbidden (not your listing)" });
//         }

//         Object.assign(prop, req.body);
//         await prop.save();

//         res.json(prop);
//     } catch (err) {
//         res.status(400).json({ error: err.message });
//     }
// });

router.patch("/:id", async (req, res) => {
    try {
        const ownerId = req.headers["x-user-id"];
        const userRole = req.headers["x-user-role"]; // Optional: admin support
        if (!ownerId)
            return res.status(401).json({ error: "Unauthorized" });

        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ error: "Invalid property ID" });
        }

        const prop = await Property.findById(req.params.id);
        if (!prop) return res.status(404).json({ error: "Property not found" });

        // Allow owner or admin
        if (prop.ownerId.toString() !== ownerId && userRole !== "admin") {
            return res.status(403).json({ error: "Forbidden" });
        }

        /* SAFE UPDATE FIELDS ONLY (recommended security) */
        const allowedFields = [
            "title",
            "description",
            "address",
            "rent",
            "deposit",
            "amenities",
            "images",
            "type",
            "city",
            "state",
            "availableFrom",
            "geo",
        ];

        Object.keys(req.body).forEach((key) => {
            if (allowedFields.includes(key)) {
                prop[key] = req.body[key];
            }
        });

        await prop.save();

        res.json({ success: true, updated: prop });
    } catch (err) {
        res.status(500).json({ error: "Server error", details: err.message });
    }
});


/* --------------------------- DELETE PROPERTY --------------------------- */
// router.delete("/:id", async (req, res) => {
//     try {
//         const ownerId = req.headers["x-user-id"];
//         if (!ownerId)
//             return res
//                 .status(401)
//                 .json({ error: "Unauthorized (provide x-user-id header for dev)" });

//         const prop = await Property.findById(req.params.id);
//         if (!prop) return res.status(404).json({ error: "Not found" });

//         if (prop.ownerId.toString() !== ownerId) {
//             return res.status(403).json({ error: "Forbidden (not your listing)" });
//         }

//         await prop.deleteOne();
//         res.json({ success: true });
//     } catch (err) {
//         res.status(503).json({ error: "Database connection failed" });
//     }
// });
router.delete("/:id", async (req, res) => {
    try {
        const ownerId = req.headers["x-user-id"];
        const userRole = req.headers["x-user-role"];
        if (!ownerId)
            return res.status(401).json({ error: "Unauthorized" });

        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ error: "Invalid property ID" });
        }

        const prop = await Property.findById(req.params.id);
        if (!prop) return res.status(404).json({ error: "Property not found" });

        // Allow owner or admin
        if (prop.ownerId.toString() !== ownerId && userRole !== "admin") {
            return res.status(403).json({ error: "Forbidden" });
        }

        await prop.deleteOne();

        res.json({ success: true, message: "Property deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: "Server error", details: err.message });
    }
});


export default router;
