import { Router } from "express";
import { z } from "zod";
import { Location } from "../models/Location.js";
import { Property } from "../models/Property.js";
import { connectDB } from "../src/config/db.js";
import { requireAdmin } from "../src/middleware/adminAuth.js";
import { createAuditLog } from "../src/services/adminAuditService.js";

const router = Router();

/**
 * Admin Location Management Routes
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.6
 * - 5.1: Create locations (city, area, state)
 * - 5.2: Edit locations
 * - 5.3: Delete locations only if no properties reference them
 * - 5.6: Toggle location visibility
 */

/* ---------------------- VALIDATION SCHEMAS ---------------------- */

const locationListQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().optional(),
    type: z.enum(['city', 'area', 'state']).optional(),
    parentId: z.string().optional(),
    isVisible: z.coerce.boolean().optional(),
    sortBy: z.string().default('name'),
    sortOrder: z.enum(['asc', 'desc']).default('asc')
});

const locationCreateSchema = z.object({
    name: z.string().min(1, "Name is required").trim(),
    type: z.enum(['city', 'area', 'state'], { required_error: "Type is required" }),
    parentId: z.string().nullable().optional(),
    isVisible: z.boolean().default(true),
    coordinates: z.object({
        latitude: z.number().optional(),
        longitude: z.number().optional()
    }).optional()
});

const locationUpdateSchema = z.object({
    name: z.string().min(1).trim().optional(),
    type: z.enum(['city', 'area', 'state']).optional(),
    parentId: z.string().nullable().optional(),
    isVisible: z.boolean().optional(),
    coordinates: z.object({
        latitude: z.number().optional(),
        longitude: z.number().optional()
    }).optional()
});

const visibilityToggleSchema = z.object({
    isVisible: z.boolean()
});

/* ---------------------- HELPER FUNCTIONS ---------------------- */

/**
 * Build search query for locations
 */
const buildSearchQuery = (search, type, parentId, isVisible) => {
    const query = {};

    if (search) {
        query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { slug: { $regex: search, $options: 'i' } }
        ];
    }

    if (type) {
        query.type = type;
    }

    if (parentId !== undefined) {
        query.parentId = parentId === 'null' || parentId === '' ? null : parentId;
    }

    if (isVisible !== undefined) {
        query.isVisible = isVisible;
    }

    return query;
};

/**
 * Check if location has properties referencing it
 * Requirements: 5.3 - Referential integrity check
 */
const hasReferencingProperties = async (locationName) => {
    const count = await Property.countDocuments({
        city: { $regex: new RegExp(`^${locationName}$`, 'i') },
        isDeleted: { $ne: true }
    });
    return count > 0;
};

/**
 * Check if location has child locations
 */
const hasChildLocations = async (locationId) => {
    const count = await Location.countDocuments({ parentId: locationId });
    return count > 0;
};

/* ---------------------- ROUTES ---------------------- */

/**
 * GET /api/admin/locations
 * List locations with pagination, search, and filters
 */
router.get("/", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        const queryResult = locationListQuerySchema.safeParse(req.query);
        if (!queryResult.success) {
            return res.status(400).json({
                success: false,
                error: "VALIDATION_ERROR",
                message: "Invalid query parameters",
                details: queryResult.error.errors
            });
        }

        const { page, limit, search, type, parentId, isVisible, sortBy, sortOrder } = queryResult.data;

        const query = buildSearchQuery(search, type, parentId, isVisible);
        const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
        const skip = (page - 1) * limit;

        const [locations, total] = await Promise.all([
            Location.find(query)
                .populate('parentId', 'name type')
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .lean(),
            Location.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: {
                locations,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            }
        });

    } catch (error) {
        console.error('Error listing locations:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to retrieve locations"
        });
    }
});

/**
 * GET /api/admin/locations/tree
 * Get locations in hierarchical tree structure
 */
router.get("/tree", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        // Get all locations
        const locations = await Location.find()
            .sort({ type: 1, name: 1 })
            .lean();

        // Build tree structure
        const locationMap = new Map();
        const tree = [];

        // First pass: create map
        locations.forEach(loc => {
            locationMap.set(loc._id.toString(), { ...loc, children: [] });
        });

        // Second pass: build tree
        locations.forEach(loc => {
            const node = locationMap.get(loc._id.toString());
            if (loc.parentId) {
                const parent = locationMap.get(loc.parentId.toString());
                if (parent) {
                    parent.children.push(node);
                } else {
                    tree.push(node);
                }
            } else {
                tree.push(node);
            }
        });

        res.json({
            success: true,
            data: tree
        });

    } catch (error) {
        console.error('Error getting location tree:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to retrieve location tree"
        });
    }
});

/**
 * POST /api/admin/locations
 * Create a new location
 * 
 * Requirements: 5.1 - Add city, area, or state to the system
 */
router.post("/", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        const bodyResult = locationCreateSchema.safeParse(req.body);
        if (!bodyResult.success) {
            return res.status(400).json({
                success: false,
                error: "VALIDATION_ERROR",
                message: "Invalid location data",
                details: bodyResult.error.errors
            });
        }

        const { name, type, parentId, isVisible, coordinates } = bodyResult.data;

        // Check for duplicate name within same type
        const existingLocation = await Location.findOne({
            name: { $regex: new RegExp(`^${name}$`, 'i') },
            type
        });

        if (existingLocation) {
            return res.status(409).json({
                success: false,
                error: "CONFLICT",
                message: `A ${type} with this name already exists`
            });
        }

        // Validate parent exists if provided
        if (parentId) {
            const parent = await Location.findById(parentId);
            if (!parent) {
                return res.status(400).json({
                    success: false,
                    error: "VALIDATION_ERROR",
                    message: "Parent location not found"
                });
            }
        }

        const newLocation = new Location({
            name,
            type,
            parentId: parentId || null,
            isVisible: isVisible !== undefined ? isVisible : true,
            coordinates: coordinates || {},
            propertyCount: 0
        });

        await newLocation.save();

        // Create audit log
        await createAuditLog({
            adminId: req.user._id,
            action: 'CREATE',
            resourceType: 'location',
            resourceId: newLocation._id,
            changes: { name, type, parentId, isVisible },
            req
        });

        res.status(201).json({
            success: true,
            data: newLocation.toObject(),
            message: "Location created successfully"
        });

    } catch (error) {
        console.error('Error creating location:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to create location"
        });
    }
});

/**
 * GET /api/admin/locations/:id
 * Get location details by ID
 */
router.get("/:id", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        const location = await Location.findById(req.params.id)
            .populate('parentId', 'name type')
            .lean();

        if (!location) {
            return res.status(404).json({
                success: false,
                error: "NOT_FOUND",
                message: "Location not found"
            });
        }

        // Get child locations count
        const childCount = await Location.countDocuments({ parentId: req.params.id });

        // Get property count for this location
        const propertyCount = await Property.countDocuments({
            city: { $regex: new RegExp(`^${location.name}$`, 'i') },
            isDeleted: { $ne: true }
        });

        res.json({
            success: true,
            data: {
                ...location,
                childCount,
                actualPropertyCount: propertyCount
            }
        });

    } catch (error) {
        console.error('Error getting location:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to retrieve location"
        });
    }
});

/**
 * PUT /api/admin/locations/:id
 * Update location details
 * 
 * Requirements: 5.2 - Update the location record
 */
router.put("/:id", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        const bodyResult = locationUpdateSchema.safeParse(req.body);
        if (!bodyResult.success) {
            return res.status(400).json({
                success: false,
                error: "VALIDATION_ERROR",
                message: "Invalid location data",
                details: bodyResult.error.errors
            });
        }

        const currentLocation = await Location.findById(req.params.id).lean();
        if (!currentLocation) {
            return res.status(404).json({
                success: false,
                error: "NOT_FOUND",
                message: "Location not found"
            });
        }

        const updateData = bodyResult.data;

        // Check for duplicate name if name is being changed
        if (updateData.name && updateData.name !== currentLocation.name) {
            const type = updateData.type || currentLocation.type;
            const existingLocation = await Location.findOne({
                name: { $regex: new RegExp(`^${updateData.name}$`, 'i') },
                type,
                _id: { $ne: req.params.id }
            });

            if (existingLocation) {
                return res.status(409).json({
                    success: false,
                    error: "CONFLICT",
                    message: `A ${type} with this name already exists`
                });
            }
        }

        // Validate parent if being changed
        if (updateData.parentId !== undefined && updateData.parentId !== null) {
            // Prevent setting self as parent
            if (updateData.parentId === req.params.id) {
                return res.status(400).json({
                    success: false,
                    error: "VALIDATION_ERROR",
                    message: "Location cannot be its own parent"
                });
            }

            const parent = await Location.findById(updateData.parentId);
            if (!parent) {
                return res.status(400).json({
                    success: false,
                    error: "VALIDATION_ERROR",
                    message: "Parent location not found"
                });
            }
        }

        const updatedLocation = await Location.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        ).lean();

        // Create audit log
        await createAuditLog({
            adminId: req.user._id,
            action: 'UPDATE',
            resourceType: 'location',
            resourceId: req.params.id,
            changes: updateData,
            previousValues: {
                name: currentLocation.name,
                type: currentLocation.type,
                parentId: currentLocation.parentId,
                isVisible: currentLocation.isVisible
            },
            req
        });

        res.json({
            success: true,
            data: updatedLocation,
            message: "Location updated successfully"
        });

    } catch (error) {
        console.error('Error updating location:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to update location"
        });
    }
});

/**
 * DELETE /api/admin/locations/:id
 * Delete a location
 * 
 * Requirements: 5.3 - Remove location only if no properties reference it
 */
router.delete("/:id", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        const location = await Location.findById(req.params.id).lean();
        if (!location) {
            return res.status(404).json({
                success: false,
                error: "NOT_FOUND",
                message: "Location not found"
            });
        }

        // Check for referencing properties (Requirement 5.3 - Referential Integrity)
        const hasProperties = await hasReferencingProperties(location.name);
        if (hasProperties) {
            return res.status(400).json({
                success: false,
                error: "REFERENCE_ERROR",
                message: "Cannot delete location: properties are referencing this location"
            });
        }

        // Check for child locations
        const hasChildren = await hasChildLocations(req.params.id);
        if (hasChildren) {
            return res.status(400).json({
                success: false,
                error: "REFERENCE_ERROR",
                message: "Cannot delete location: child locations exist. Delete children first."
            });
        }

        // DISABLED: Location deletion is disabled for data safety
        console.error('❌ Location deletion is DISABLED for data safety');
        return res.status(403).json({
            success: false,
            error: "OPERATION_DISABLED",
            message: "Location deletion is disabled to prevent accidental data loss"
        });

        // Create audit log
        await createAuditLog({
            adminId: req.user._id,
            action: 'DELETE',
            resourceType: 'location',
            resourceId: req.params.id,
            previousValues: {
                name: location.name,
                type: location.type,
                parentId: location.parentId
            },
            req
        });

        res.json({
            success: true,
            message: "Location deleted successfully"
        });

    } catch (error) {
        console.error('Error deleting location:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to delete location"
        });
    }
});

/**
 * PATCH /api/admin/locations/:id/visibility
 * Toggle location visibility
 * 
 * Requirements: 5.6 - Show or hide location in user-facing interfaces
 */
router.patch("/:id/visibility", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        const bodyResult = visibilityToggleSchema.safeParse(req.body);
        if (!bodyResult.success) {
            return res.status(400).json({
                success: false,
                error: "VALIDATION_ERROR",
                message: "Invalid visibility data",
                details: bodyResult.error.errors
            });
        }

        const { isVisible } = bodyResult.data;

        const currentLocation = await Location.findById(req.params.id).lean();
        if (!currentLocation) {
            return res.status(404).json({
                success: false,
                error: "NOT_FOUND",
                message: "Location not found"
            });
        }

        const updatedLocation = await Location.findByIdAndUpdate(
            req.params.id,
            { isVisible },
            { new: true }
        ).lean();

        // Create audit log
        await createAuditLog({
            adminId: req.user._id,
            action: 'UPDATE',
            resourceType: 'location',
            resourceId: req.params.id,
            changes: { isVisible },
            previousValues: { isVisible: currentLocation.isVisible },
            req
        });

        res.json({
            success: true,
            data: updatedLocation,
            message: `Location ${isVisible ? 'shown' : 'hidden'} successfully`
        });

    } catch (error) {
        console.error('Error toggling location visibility:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to update location visibility"
        });
    }
});

export default router;
