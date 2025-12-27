import { Router } from "express";
import { z } from "zod";
import mongoose from "mongoose";
import multer from "multer";
import path from "path";
import { Property } from "../models/Property.js";
import { User } from "../models/User.js";
import { connectDB } from "../src/config/db.js";
import { requireAdmin } from "../src/middleware/adminAuth.js";
import { createAuditLog } from "../src/services/adminAuditService.js";

const router = Router();

/**
 * Admin Property Management Routes
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8
 */

/* ---------------------- FILE UPLOAD CONFIG ---------------------- */

const storage = multer.diskStorage({
    destination: "uploads/properties",
    filename: (req, file, cb) => {
        const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, unique + ext);
    }
});

const fileFilter = (req, file, cb) => {
    // Requirement 4.8: Validate file types
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed.'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

/* ---------------------- VALIDATION SCHEMAS ---------------------- */

const propertyListQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().optional(),
    city: z.string().optional(),
    category: z.enum(['room', 'flat', 'house', 'pg', 'hostel', 'commercial']).optional(),
    status: z.enum(['active', 'inactive', 'blocked', 'rented', 'sold', 'expired']).optional(),
    featured: z.coerce.boolean().optional(),
    listingType: z.enum(['rent', 'buy']).optional(),
    priceMin: z.coerce.number().min(0).optional(),
    priceMax: z.coerce.number().min(0).optional(),
    ownerId: z.string().optional(),
    sortBy: z.string().default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc')
});

const propertyCreateSchema = z.object({
    category: z.enum(['room', 'flat', 'house', 'pg', 'hostel', 'commercial']),
    title: z.string().min(1, "Title is required"),
    propertyType: z.string().min(1, "Property type is required"),
    description: z.string().optional().default(""),
    furnishing: z.enum(['unfurnished', 'semi', 'fully']),
    availableFrom: z.string().or(z.date()),
    city: z.string().min(1, "City is required"),
    address: z.string().min(1, "Address is required"),
    mapLocation: z.string().optional().default(""),
    monthlyRent: z.coerce.number().min(0, "Monthly rent must be positive"),
    securityDeposit: z.coerce.number().min(0).optional().default(0),
    maintenanceCharge: z.coerce.number().min(0).optional().default(0),
    negotiable: z.coerce.boolean().optional().default(false),
    roomType: z.string().optional().default(""),
    bathroomType: z.string().optional().default(""),
    kitchenAvailable: z.coerce.boolean().optional().default(false),
    builtUpArea: z.coerce.number().nullable().optional(),
    carpetArea: z.coerce.number().nullable().optional(),
    bedrooms: z.coerce.number().nullable().optional(),
    bathrooms: z.coerce.number().nullable().optional(),
    balconies: z.coerce.number().nullable().optional(),
    floorNumber: z.coerce.number().nullable().optional(),
    totalFloors: z.coerce.number().nullable().optional(),
    facingDirection: z.string().optional().default(""),
    parking: z.string().optional().default(""),
    propertyAge: z.string().optional().default(""),
    washroom: z.string().optional().default(""),
    frontage: z.string().optional().default(""),
    amenities: z.array(z.string()).optional().default([]),
    ownerId: z.string().min(1, "Owner ID is required"),
    ownerName: z.string().min(1, "Owner name is required"),
    ownerPhone: z.string().min(1, "Owner phone is required"),
    ownerEmail: z.string().email().optional().default(""),
    ownerType: z.enum(['owner', 'agent', 'builder']).optional().default('owner'),
    status: z.enum(['active', 'inactive', 'blocked']).optional().default('active'),
    featured: z.coerce.boolean().optional().default(false),
    lat: z.coerce.number().optional(),
    lng: z.coerce.number().optional()
});

const propertyUpdateSchema = propertyCreateSchema.partial().omit({ ownerId: true });

const statusChangeSchema = z.object({
    status: z.enum(['active', 'inactive', 'blocked', 'rented', 'sold', 'expired']),
    reason: z.string().optional()
});

const featuredChangeSchema = z.object({
    featured: z.coerce.boolean(),
    premium: z.coerce.boolean().optional()
});

/* ---------------------- HELPER FUNCTIONS ---------------------- */

/**
 * Build search query for properties
 */
const buildSearchQuery = (params) => {
    const query = { isDeleted: { $ne: true } };

    // Search by title, city, or address
    if (params.search) {
        query.$or = [
            { title: { $regex: params.search, $options: 'i' } },
            { city: { $regex: params.search, $options: 'i' } },
            { address: { $regex: params.search, $options: 'i' } },
            { description: { $regex: params.search, $options: 'i' } }
        ];
    }

    // Filter by city
    if (params.city) {
        query.city = { $regex: params.city, $options: 'i' };
    }

    // Filter by category
    if (params.category) {
        query.category = params.category;
    }

    // Filter by status
    if (params.status) {
        query.status = params.status;
    }

    // Filter by featured
    if (params.featured !== undefined) {
        query.featured = params.featured;
    }

    // Filter by listingType (rent/buy)
    if (params.listingType) {
        query.listingType = params.listingType;
    }

    // Filter by price range - use appropriate field based on listingType
    if (params.priceMin !== undefined || params.priceMax !== undefined) {
        // If listingType is specified, use the appropriate price field
        const priceField = params.listingType === 'buy' ? 'sellingPrice' : 'monthlyRent';
        query[priceField] = {};
        if (params.priceMin !== undefined) {
            query[priceField].$gte = params.priceMin;
        }
        if (params.priceMax !== undefined) {
            query[priceField].$lte = params.priceMax;
        }
    }

    // Filter by owner
    if (params.ownerId && mongoose.Types.ObjectId.isValid(params.ownerId)) {
        query.ownerId = params.ownerId;
    }

    return query;
};

/**
 * Generate URL-friendly slug
 */
function slugify(text) {
    return String(text || "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
}

/**
 * Generate random suffix for unique slugs
 */
function randomSuffix(len = 4) {
    return Math.random().toString(36).substring(2, 2 + len).toUpperCase();
}

/**
 * Create unique slug for property
 */
async function makeUniqueSlug(base) {
    let s = base;
    let tries = 0;
    while (tries < 6) {
        const exists = await Property.findOne({ slug: s }).lean();
        if (!exists) return s;
        s = `${base}-${randomSuffix(3)}`;
        tries++;
    }
    return `${base}-${new mongoose.Types.ObjectId().toString().slice(-6)}`;
}

/**
 * Generate listing number
 */
function makeListingNumber() {
    const dt = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const stamp = `${dt.getFullYear()}${pad(dt.getMonth() + 1)}${pad(dt.getDate())}${pad(dt.getHours())}${pad(dt.getMinutes())}${pad(dt.getSeconds())}`;
    return `LIST-${stamp}-${randomSuffix(4)}`;
}

/**
 * Validate location coordinates
 * Requirement 4.9: Verify location coordinates
 */
function validateCoordinates(lat, lng) {
    if (lat !== undefined && lng !== undefined) {
        const latNum = parseFloat(lat);
        const lngNum = parseFloat(lng);
        if (isNaN(latNum) || isNaN(lngNum)) {
            return { valid: false, error: "Invalid coordinate format" };
        }
        if (latNum < -90 || latNum > 90) {
            return { valid: false, error: "Latitude must be between -90 and 90" };
        }
        if (lngNum < -180 || lngNum > 180) {
            return { valid: false, error: "Longitude must be between -180 and 180" };
        }
        return { valid: true, lat: latNum, lng: lngNum };
    }
    return { valid: true };
}

/* ---------------------- ROUTES ---------------------- */

/**
 * GET /api/admin/properties
 * List all properties with pagination, search, and filters
 * 
 * Requirements: 4.1 - Return all properties regardless of owner with pagination
 */
router.get("/", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        // Validate and parse query parameters
        const queryResult = propertyListQuerySchema.safeParse(req.query);
        if (!queryResult.success) {
            return res.status(400).json({
                success: false,
                error: "VALIDATION_ERROR",
                message: "Invalid query parameters",
                details: queryResult.error.errors
            });
        }

        const { page, limit, sortBy, sortOrder, ...filterParams } = queryResult.data;

        // Build query - global access, not filtered by owner
        const query = buildSearchQuery(filterParams);

        // Build sort object
        const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

        // Calculate skip
        const skip = (page - 1) * limit;

        // Execute query with pagination
        const [properties, total] = await Promise.all([
            Property.find(query)
                .populate('ownerId', 'name email phone role')
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .lean(),
            Property.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: {
                properties,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            }
        });

    } catch (error) {
        console.error('Error listing properties:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to retrieve properties"
        });
    }
});

/**
 * POST /api/admin/properties
 * Create a new property
 * 
 * Requirements: 4.2 - Validate required fields and create the listing
 */
router.post("/", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        // Validate request body
        const bodyResult = propertyCreateSchema.safeParse(req.body);
        if (!bodyResult.success) {
            return res.status(400).json({
                success: false,
                error: "VALIDATION_ERROR",
                message: "Invalid property data",
                details: bodyResult.error.errors
            });
        }

        const data = bodyResult.data;

        // Verify owner exists
        const owner = await User.findOne({
            _id: data.ownerId,
            isDeleted: { $ne: true }
        }).lean();

        if (!owner) {
            return res.status(400).json({
                success: false,
                error: "VALIDATION_ERROR",
                message: "Owner not found"
            });
        }

        // Validate coordinates if provided
        if (data.lat !== undefined || data.lng !== undefined) {
            const coordResult = validateCoordinates(data.lat, data.lng);
            if (!coordResult.valid) {
                return res.status(400).json({
                    success: false,
                    error: "VALIDATION_ERROR",
                    message: coordResult.error
                });
            }
        }

        // Generate slug and listing number
        const baseSlug = slugify(`${data.title}-${data.city}`.slice(0, 120));
        const slug = await makeUniqueSlug(baseSlug);
        const listingNumber = makeListingNumber();

        // Build location object if coordinates provided
        let location = undefined;
        if (data.lat !== undefined && data.lng !== undefined) {
            location = {
                type: "Point",
                coordinates: [parseFloat(data.lng), parseFloat(data.lat)]
            };
        }

        // Create property
        const newProperty = new Property({
            ...data,
            slug,
            listingNumber,
            location,
            photos: [] // Photos added separately via image upload endpoint
        });

        await newProperty.save();

        // Create audit log
        await createAuditLog({
            adminId: req.user._id,
            action: 'CREATE',
            resourceType: 'property',
            resourceId: newProperty._id,
            changes: {
                title: data.title,
                city: data.city,
                category: data.category,
                monthlyRent: data.monthlyRent,
                ownerId: data.ownerId
            },
            req
        });

        res.status(201).json({
            success: true,
            data: newProperty.toObject(),
            message: "Property created successfully"
        });

    } catch (error) {
        console.error('Error creating property:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to create property"
        });
    }
});

/**
 * GET /api/admin/properties/:id
 * Get property details by ID
 */
router.get("/:id", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                success: false,
                error: "VALIDATION_ERROR",
                message: "Invalid property ID"
            });
        }

        const property = await Property.findOne({
            _id: req.params.id,
            isDeleted: { $ne: true }
        })
            .populate('ownerId', 'name email phone role')
            .lean();

        if (!property) {
            return res.status(404).json({
                success: false,
                error: "NOT_FOUND",
                message: "Property not found"
            });
        }

        res.json({
            success: true,
            data: property
        });

    } catch (error) {
        console.error('Error getting property:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to retrieve property"
        });
    }
});

/**
 * PUT /api/admin/properties/:id
 * Update property details
 * 
 * Requirements: 4.3 - Update the record and log the modification
 */
router.put("/:id", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                success: false,
                error: "VALIDATION_ERROR",
                message: "Invalid property ID"
            });
        }

        // Validate request body
        const bodyResult = propertyUpdateSchema.safeParse(req.body);
        if (!bodyResult.success) {
            return res.status(400).json({
                success: false,
                error: "VALIDATION_ERROR",
                message: "Invalid property data",
                details: bodyResult.error.errors
            });
        }

        // Get current property for audit log
        const currentProperty = await Property.findOne({
            _id: req.params.id,
            isDeleted: { $ne: true }
        }).lean();

        if (!currentProperty) {
            return res.status(404).json({
                success: false,
                error: "NOT_FOUND",
                message: "Property not found"
            });
        }

        const data = bodyResult.data;

        // Validate coordinates if provided
        if (data.lat !== undefined || data.lng !== undefined) {
            const coordResult = validateCoordinates(data.lat, data.lng);
            if (!coordResult.valid) {
                return res.status(400).json({
                    success: false,
                    error: "VALIDATION_ERROR",
                    message: coordResult.error
                });
            }
        }

        // Build update object
        const updateData = { ...data };

        // Update location if coordinates provided
        if (data.lat !== undefined && data.lng !== undefined) {
            updateData.location = {
                type: "Point",
                coordinates: [parseFloat(data.lng), parseFloat(data.lat)]
            };
        }

        // Remove lat/lng from update data (they're not direct fields)
        delete updateData.lat;
        delete updateData.lng;

        // Update property
        const updatedProperty = await Property.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        )
            .populate('ownerId', 'name email phone role')
            .lean();

        // Create audit log
        await createAuditLog({
            adminId: req.user._id,
            action: 'UPDATE',
            resourceType: 'property',
            resourceId: req.params.id,
            changes: data,
            previousValues: {
                title: currentProperty.title,
                city: currentProperty.city,
                status: currentProperty.status,
                monthlyRent: currentProperty.monthlyRent
            },
            req
        });

        res.json({
            success: true,
            data: updatedProperty,
            message: "Property updated successfully"
        });

    } catch (error) {
        console.error('Error updating property:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to update property"
        });
    }
});

/**
 * DELETE /api/admin/properties/:id
 * Soft-delete a property
 * 
 * Requirements: 4.4 - Soft-delete the listing and preserve history
 */
router.delete("/:id", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                success: false,
                error: "VALIDATION_ERROR",
                message: "Invalid property ID"
            });
        }

        // Get current property for audit log
        const currentProperty = await Property.findOne({
            _id: req.params.id,
            isDeleted: { $ne: true }
        }).lean();

        if (!currentProperty) {
            return res.status(404).json({
                success: false,
                error: "NOT_FOUND",
                message: "Property not found"
            });
        }

        // Soft-delete property
        await Property.findByIdAndUpdate(req.params.id, {
            isDeleted: true,
            deletedAt: new Date(),
            status: 'inactive'
        });

        // Create audit log
        await createAuditLog({
            adminId: req.user._id,
            action: 'DELETE',
            resourceType: 'property',
            resourceId: req.params.id,
            previousValues: {
                title: currentProperty.title,
                city: currentProperty.city,
                status: currentProperty.status,
                ownerId: currentProperty.ownerId
            },
            req
        });

        res.json({
            success: true,
            message: "Property deleted successfully"
        });

    } catch (error) {
        console.error('Error deleting property:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to delete property"
        });
    }
});


/**
 * PATCH /api/admin/properties/:id/status
 * Change property status
 * 
 * Requirements: 4.5 - Update status and notify the owner
 * Requirements: 4.7 - Update to Available, Rented, Sold, or Expired
 */
router.patch("/:id/status", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                success: false,
                error: "VALIDATION_ERROR",
                message: "Invalid property ID"
            });
        }

        // Validate request body
        const bodyResult = statusChangeSchema.safeParse(req.body);
        if (!bodyResult.success) {
            return res.status(400).json({
                success: false,
                error: "VALIDATION_ERROR",
                message: "Invalid status data",
                details: bodyResult.error.errors
            });
        }

        const { status, reason } = bodyResult.data;

        // Get current property
        const currentProperty = await Property.findOne({
            _id: req.params.id,
            isDeleted: { $ne: true }
        }).lean();

        if (!currentProperty) {
            return res.status(404).json({
                success: false,
                error: "NOT_FOUND",
                message: "Property not found"
            });
        }

        const previousStatus = currentProperty.status;

        // Update status
        const updatedProperty = await Property.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        )
            .populate('ownerId', 'name email phone role')
            .lean();

        // Create audit log
        await createAuditLog({
            adminId: req.user._id,
            action: 'UPDATE',
            resourceType: 'property',
            resourceId: req.params.id,
            changes: { status },
            previousValues: { status: previousStatus },
            metadata: { reason },
            req
        });

        // TODO: Send notification to owner about status change
        // This would integrate with the notification service

        res.json({
            success: true,
            data: updatedProperty,
            message: `Property status changed from ${previousStatus} to ${status}`
        });

    } catch (error) {
        console.error('Error changing property status:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to change property status"
        });
    }
});

/**
 * PATCH /api/admin/properties/:id/featured
 * Toggle featured/premium flags
 * 
 * Requirements: 4.6 - Update the property flags
 */
router.patch("/:id/featured", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                success: false,
                error: "VALIDATION_ERROR",
                message: "Invalid property ID"
            });
        }

        // Validate request body
        const bodyResult = featuredChangeSchema.safeParse(req.body);
        if (!bodyResult.success) {
            return res.status(400).json({
                success: false,
                error: "VALIDATION_ERROR",
                message: "Invalid featured data",
                details: bodyResult.error.errors
            });
        }

        const { featured, premium } = bodyResult.data;

        // Get current property
        const currentProperty = await Property.findOne({
            _id: req.params.id,
            isDeleted: { $ne: true }
        }).lean();

        if (!currentProperty) {
            return res.status(404).json({
                success: false,
                error: "NOT_FOUND",
                message: "Property not found"
            });
        }

        // Build update object
        const updateData = { featured };
        if (premium !== undefined) {
            updateData.premium = premium;
        }

        // Update property
        const updatedProperty = await Property.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        )
            .populate('ownerId', 'name email phone role')
            .lean();

        // Create audit log
        await createAuditLog({
            adminId: req.user._id,
            action: 'UPDATE',
            resourceType: 'property',
            resourceId: req.params.id,
            changes: updateData,
            previousValues: {
                featured: currentProperty.featured,
                premium: currentProperty.premium
            },
            req
        });

        res.json({
            success: true,
            data: updatedProperty,
            message: `Property featured status updated`
        });

    } catch (error) {
        console.error('Error updating featured status:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to update featured status"
        });
    }
});

/**
 * POST /api/admin/properties/:id/images
 * Upload property images
 * 
 * Requirements: 4.8 - Validate file types and store securely
 */
router.post("/:id/images", requireAdmin, upload.array("images", 10), async (req, res) => {
    try {
        await connectDB();

        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                success: false,
                error: "VALIDATION_ERROR",
                message: "Invalid property ID"
            });
        }

        // Get current property
        const currentProperty = await Property.findOne({
            _id: req.params.id,
            isDeleted: { $ne: true }
        }).lean();

        if (!currentProperty) {
            return res.status(404).json({
                success: false,
                error: "NOT_FOUND",
                message: "Property not found"
            });
        }

        // Check if files were uploaded
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                error: "VALIDATION_ERROR",
                message: "No images provided"
            });
        }

        // Generate image paths
        const newPhotoPaths = req.files.map(f => `/uploads/properties/${f.filename}`);

        // Combine with existing photos
        const existingPhotos = currentProperty.photos || [];
        const allPhotos = [...existingPhotos, ...newPhotoPaths];

        // Update property with new photos
        const updatedProperty = await Property.findByIdAndUpdate(
            req.params.id,
            { photos: allPhotos },
            { new: true }
        )
            .populate('ownerId', 'name email phone role')
            .lean();

        // Create audit log
        await createAuditLog({
            adminId: req.user._id,
            action: 'UPDATE',
            resourceType: 'property',
            resourceId: req.params.id,
            changes: { photosAdded: newPhotoPaths },
            previousValues: { photoCount: existingPhotos.length },
            req
        });

        res.json({
            success: true,
            data: {
                property: updatedProperty,
                uploadedImages: newPhotoPaths
            },
            message: `${newPhotoPaths.length} image(s) uploaded successfully`
        });

    } catch (error) {
        console.error('Error uploading images:', error);

        // Handle multer errors
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                error: "VALIDATION_ERROR",
                message: "File size exceeds 10MB limit"
            });
        }

        if (error.message && error.message.includes('Invalid file type')) {
            return res.status(400).json({
                success: false,
                error: "VALIDATION_ERROR",
                message: error.message
            });
        }

        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to upload images"
        });
    }
});

/**
 * DELETE /api/admin/properties/:id/images
 * Remove specific images from a property
 */
router.delete("/:id/images", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                success: false,
                error: "VALIDATION_ERROR",
                message: "Invalid property ID"
            });
        }

        const { imagePaths } = req.body;

        if (!imagePaths || !Array.isArray(imagePaths) || imagePaths.length === 0) {
            return res.status(400).json({
                success: false,
                error: "VALIDATION_ERROR",
                message: "imagePaths array is required"
            });
        }

        // Get current property
        const currentProperty = await Property.findOne({
            _id: req.params.id,
            isDeleted: { $ne: true }
        }).lean();

        if (!currentProperty) {
            return res.status(404).json({
                success: false,
                error: "NOT_FOUND",
                message: "Property not found"
            });
        }

        // Filter out the images to be removed
        const existingPhotos = currentProperty.photos || [];
        const remainingPhotos = existingPhotos.filter(photo => !imagePaths.includes(photo));

        // Update property
        const updatedProperty = await Property.findByIdAndUpdate(
            req.params.id,
            { photos: remainingPhotos },
            { new: true }
        )
            .populate('ownerId', 'name email phone role')
            .lean();

        // Create audit log
        await createAuditLog({
            adminId: req.user._id,
            action: 'UPDATE',
            resourceType: 'property',
            resourceId: req.params.id,
            changes: { photosRemoved: imagePaths },
            previousValues: { photoCount: existingPhotos.length },
            req
        });

        res.json({
            success: true,
            data: updatedProperty,
            message: `${imagePaths.length} image(s) removed successfully`
        });

    } catch (error) {
        console.error('Error removing images:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to remove images"
        });
    }
});

export default router;
