import { Router } from "express";
import { z } from "zod";
import { Category } from "../models/Category.js";
import { Amenity } from "../models/Amenity.js";
import { Property } from "../models/Property.js";
import { connectDB } from "../src/config/db.js";
import { requireAdmin } from "../src/middleware/adminAuth.js";
import { createAuditLog } from "../src/services/adminAuditService.js";

const router = Router();

/**
 * Admin Category and Amenity Management Routes
 * 
 * Requirements: 5.4, 5.5
 * - 5.4: Create property categories (Rent, Buy, Commercial, PG)
 * - 5.5: Allow add, edit, and delete operations for amenities
 */

/* ---------------------- VALIDATION SCHEMAS ---------------------- */

// Category schemas
const categoryListQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().optional(),
    isActive: z.coerce.boolean().optional(),
    sortBy: z.string().default('order'),
    sortOrder: z.enum(['asc', 'desc']).default('asc')
});

const categoryCreateSchema = z.object({
    name: z.string().min(1, "Name is required").trim(),
    slug: z.string().trim().optional(),
    description: z.string().optional().default(''),
    isActive: z.boolean().default(true),
    order: z.number().int().default(0),
    icon: z.string().nullable().optional()
});

const categoryUpdateSchema = z.object({
    name: z.string().min(1).trim().optional(),
    slug: z.string().trim().optional(),
    description: z.string().optional(),
    isActive: z.boolean().optional(),
    order: z.number().int().optional(),
    icon: z.string().nullable().optional()
});

// Amenity schemas
const amenityListQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(50),
    search: z.string().optional(),
    category: z.enum(['basic', 'comfort', 'security', 'recreation', 'utility', 'other']).optional(),
    isActive: z.coerce.boolean().optional(),
    sortBy: z.string().default('order'),
    sortOrder: z.enum(['asc', 'desc']).default('asc')
});

const amenityCreateSchema = z.object({
    name: z.string().min(1, "Name is required").trim(),
    icon: z.string().nullable().optional(),
    category: z.enum(['basic', 'comfort', 'security', 'recreation', 'utility', 'other']).default('other'),
    isActive: z.boolean().default(true),
    order: z.number().int().default(0)
});

const amenityUpdateSchema = z.object({
    name: z.string().min(1).trim().optional(),
    icon: z.string().nullable().optional(),
    category: z.enum(['basic', 'comfort', 'security', 'recreation', 'utility', 'other']).optional(),
    isActive: z.boolean().optional(),
    order: z.number().int().optional()
});

/* ---------------------- CATEGORY ROUTES ---------------------- */

/**
 * GET /api/admin/categories
 * List categories with pagination and filters
 */
router.get("/", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        const queryResult = categoryListQuerySchema.safeParse(req.query);
        if (!queryResult.success) {
            return res.status(400).json({
                success: false,
                error: "VALIDATION_ERROR",
                message: "Invalid query parameters",
                details: queryResult.error.errors
            });
        }

        const { page, limit, search, isActive, sortBy, sortOrder } = queryResult.data;

        const query = {};
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { slug: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }
        if (isActive !== undefined) {
            query.isActive = isActive;
        }

        const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
        const skip = (page - 1) * limit;

        const [categories, total] = await Promise.all([
            Category.find(query)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .lean(),
            Category.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: {
                categories,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            }
        });

    } catch (error) {
        console.error('Error listing categories:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to retrieve categories"
        });
    }
});

/**
 * POST /api/admin/categories
 * Create a new category
 * 
 * Requirements: 5.4 - Add property type (Rent, Buy, Commercial, PG)
 */
router.post("/", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        const bodyResult = categoryCreateSchema.safeParse(req.body);
        if (!bodyResult.success) {
            return res.status(400).json({
                success: false,
                error: "VALIDATION_ERROR",
                message: "Invalid category data",
                details: bodyResult.error.errors
            });
        }

        const { name, slug, description, isActive, order, icon } = bodyResult.data;

        // Generate slug if not provided
        const categorySlug = slug || name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');

        // Check for duplicate name or slug
        const existingCategory = await Category.findOne({
            $or: [
                { name: { $regex: new RegExp(`^${name}$`, 'i') } },
                { slug: categorySlug }
            ]
        });

        if (existingCategory) {
            return res.status(409).json({
                success: false,
                error: "CONFLICT",
                message: "A category with this name or slug already exists"
            });
        }

        const newCategory = new Category({
            name,
            slug: categorySlug,
            description,
            isActive,
            order,
            icon
        });

        await newCategory.save();

        // Create audit log
        await createAuditLog({
            adminId: req.user._id,
            action: 'CREATE',
            resourceType: 'category',
            resourceId: newCategory._id,
            changes: { name, slug: categorySlug, description, isActive, order },
            req
        });

        res.status(201).json({
            success: true,
            data: newCategory.toObject(),
            message: "Category created successfully"
        });

    } catch (error) {
        console.error('Error creating category:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to create category"
        });
    }
});

/**
 * GET /api/admin/categories/:id
 * Get category details by ID
 */
router.get("/:id", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        const category = await Category.findById(req.params.id).lean();

        if (!category) {
            return res.status(404).json({
                success: false,
                error: "NOT_FOUND",
                message: "Category not found"
            });
        }

        // Get property count for this category
        const propertyCount = await Property.countDocuments({
            category: { $regex: new RegExp(`^${category.slug}$`, 'i') },
            isDeleted: { $ne: true }
        });

        res.json({
            success: true,
            data: {
                ...category,
                actualPropertyCount: propertyCount
            }
        });

    } catch (error) {
        console.error('Error getting category:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to retrieve category"
        });
    }
});

/**
 * PUT /api/admin/categories/:id
 * Update category details
 */
router.put("/:id", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        const bodyResult = categoryUpdateSchema.safeParse(req.body);
        if (!bodyResult.success) {
            return res.status(400).json({
                success: false,
                error: "VALIDATION_ERROR",
                message: "Invalid category data",
                details: bodyResult.error.errors
            });
        }

        const currentCategory = await Category.findById(req.params.id).lean();
        if (!currentCategory) {
            return res.status(404).json({
                success: false,
                error: "NOT_FOUND",
                message: "Category not found"
            });
        }

        const updateData = bodyResult.data;

        // Check for duplicate name or slug if being changed
        if (updateData.name || updateData.slug) {
            const checkConditions = [];
            if (updateData.name && updateData.name !== currentCategory.name) {
                checkConditions.push({ name: { $regex: new RegExp(`^${updateData.name}$`, 'i') } });
            }
            if (updateData.slug && updateData.slug !== currentCategory.slug) {
                checkConditions.push({ slug: updateData.slug });
            }

            if (checkConditions.length > 0) {
                const existingCategory = await Category.findOne({
                    $or: checkConditions,
                    _id: { $ne: req.params.id }
                });

                if (existingCategory) {
                    return res.status(409).json({
                        success: false,
                        error: "CONFLICT",
                        message: "A category with this name or slug already exists"
                    });
                }
            }
        }

        const updatedCategory = await Category.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        ).lean();

        // Create audit log
        await createAuditLog({
            adminId: req.user._id,
            action: 'UPDATE',
            resourceType: 'category',
            resourceId: req.params.id,
            changes: updateData,
            previousValues: {
                name: currentCategory.name,
                slug: currentCategory.slug,
                description: currentCategory.description,
                isActive: currentCategory.isActive,
                order: currentCategory.order
            },
            req
        });

        res.json({
            success: true,
            data: updatedCategory,
            message: "Category updated successfully"
        });

    } catch (error) {
        console.error('Error updating category:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to update category"
        });
    }
});

/**
 * DELETE /api/admin/categories/:id
 * Delete a category
 */
router.delete("/:id", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        const category = await Category.findById(req.params.id).lean();
        if (!category) {
            return res.status(404).json({
                success: false,
                error: "NOT_FOUND",
                message: "Category not found"
            });
        }

        // Check if properties are using this category
        const propertyCount = await Property.countDocuments({
            category: { $regex: new RegExp(`^${category.slug}$`, 'i') },
            isDeleted: { $ne: true }
        });

        if (propertyCount > 0) {
            return res.status(400).json({
                success: false,
                error: "REFERENCE_ERROR",
                message: `Cannot delete category: ${propertyCount} properties are using this category`
            });
        }

        // DISABLED: Category deletion is disabled for data safety
        console.error('❌ Category deletion is DISABLED for data safety');
        return res.status(403).json({
            success: false,
            error: "OPERATION_DISABLED",
            message: "Category deletion is disabled to prevent accidental data loss"
        });

        // Create audit log
        await createAuditLog({
            adminId: req.user._id,
            action: 'DELETE',
            resourceType: 'category',
            resourceId: req.params.id,
            previousValues: {
                name: category.name,
                slug: category.slug
            },
            req
        });

        res.json({
            success: true,
            message: "Category deleted successfully"
        });

    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to delete category"
        });
    }
});

/* ---------------------- AMENITY ROUTES ---------------------- */

/**
 * GET /api/admin/categories/amenities
 * List amenities with pagination and filters
 * 
 * Requirements: 5.5 - Manage amenities
 */
router.get("/amenities/list", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        const queryResult = amenityListQuerySchema.safeParse(req.query);
        if (!queryResult.success) {
            return res.status(400).json({
                success: false,
                error: "VALIDATION_ERROR",
                message: "Invalid query parameters",
                details: queryResult.error.errors
            });
        }

        const { page, limit, search, category, isActive, sortBy, sortOrder } = queryResult.data;

        const query = {};
        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }
        if (category) {
            query.category = category;
        }
        if (isActive !== undefined) {
            query.isActive = isActive;
        }

        const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
        const skip = (page - 1) * limit;

        const [amenities, total] = await Promise.all([
            Amenity.find(query)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .lean(),
            Amenity.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: {
                amenities,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            }
        });

    } catch (error) {
        console.error('Error listing amenities:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to retrieve amenities"
        });
    }
});

/**
 * POST /api/admin/categories/amenities
 * Create a new amenity
 * 
 * Requirements: 5.5 - Add amenities
 */
router.post("/amenities", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        const bodyResult = amenityCreateSchema.safeParse(req.body);
        if (!bodyResult.success) {
            return res.status(400).json({
                success: false,
                error: "VALIDATION_ERROR",
                message: "Invalid amenity data",
                details: bodyResult.error.errors
            });
        }

        const { name, icon, category, isActive, order } = bodyResult.data;

        // Check for duplicate name
        const existingAmenity = await Amenity.findOne({
            name: { $regex: new RegExp(`^${name}$`, 'i') }
        });

        if (existingAmenity) {
            return res.status(409).json({
                success: false,
                error: "CONFLICT",
                message: "An amenity with this name already exists"
            });
        }

        const newAmenity = new Amenity({
            name,
            icon,
            category,
            isActive,
            order
        });

        await newAmenity.save();

        // Create audit log
        await createAuditLog({
            adminId: req.user._id,
            action: 'CREATE',
            resourceType: 'category', // Using 'category' as amenities are related
            resourceId: newAmenity._id,
            changes: { name, icon, category, isActive, order, type: 'amenity' },
            req
        });

        res.status(201).json({
            success: true,
            data: newAmenity.toObject(),
            message: "Amenity created successfully"
        });

    } catch (error) {
        console.error('Error creating amenity:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to create amenity"
        });
    }
});

/**
 * GET /api/admin/categories/amenities/:id
 * Get amenity details by ID
 */
router.get("/amenities/:id", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        const amenity = await Amenity.findById(req.params.id).lean();

        if (!amenity) {
            return res.status(404).json({
                success: false,
                error: "NOT_FOUND",
                message: "Amenity not found"
            });
        }

        // Get count of properties using this amenity
        const usageCount = await Property.countDocuments({
            amenities: amenity.name,
            isDeleted: { $ne: true }
        });

        res.json({
            success: true,
            data: {
                ...amenity,
                usageCount
            }
        });

    } catch (error) {
        console.error('Error getting amenity:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to retrieve amenity"
        });
    }
});

/**
 * PUT /api/admin/categories/amenities/:id
 * Update amenity details
 * 
 * Requirements: 5.5 - Edit amenities
 */
router.put("/amenities/:id", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        const bodyResult = amenityUpdateSchema.safeParse(req.body);
        if (!bodyResult.success) {
            return res.status(400).json({
                success: false,
                error: "VALIDATION_ERROR",
                message: "Invalid amenity data",
                details: bodyResult.error.errors
            });
        }

        const currentAmenity = await Amenity.findById(req.params.id).lean();
        if (!currentAmenity) {
            return res.status(404).json({
                success: false,
                error: "NOT_FOUND",
                message: "Amenity not found"
            });
        }

        const updateData = bodyResult.data;

        // Check for duplicate name if being changed
        if (updateData.name && updateData.name !== currentAmenity.name) {
            const existingAmenity = await Amenity.findOne({
                name: { $regex: new RegExp(`^${updateData.name}$`, 'i') },
                _id: { $ne: req.params.id }
            });

            if (existingAmenity) {
                return res.status(409).json({
                    success: false,
                    error: "CONFLICT",
                    message: "An amenity with this name already exists"
                });
            }
        }

        const updatedAmenity = await Amenity.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        ).lean();

        // Create audit log
        await createAuditLog({
            adminId: req.user._id,
            action: 'UPDATE',
            resourceType: 'category',
            resourceId: req.params.id,
            changes: { ...updateData, type: 'amenity' },
            previousValues: {
                name: currentAmenity.name,
                icon: currentAmenity.icon,
                category: currentAmenity.category,
                isActive: currentAmenity.isActive,
                order: currentAmenity.order
            },
            req
        });

        res.json({
            success: true,
            data: updatedAmenity,
            message: "Amenity updated successfully"
        });

    } catch (error) {
        console.error('Error updating amenity:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to update amenity"
        });
    }
});

/**
 * DELETE /api/admin/categories/amenities/:id
 * Delete an amenity
 * 
 * Requirements: 5.5 - Delete amenities
 */
router.delete("/amenities/:id", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        const amenity = await Amenity.findById(req.params.id).lean();
        if (!amenity) {
            return res.status(404).json({
                success: false,
                error: "NOT_FOUND",
                message: "Amenity not found"
            });
        }

        // DISABLED: Amenity deletion is disabled for data safety
        console.error('❌ Amenity deletion is DISABLED for data safety');
        return res.status(403).json({
            success: false,
            error: "OPERATION_DISABLED",
            message: "Amenity deletion is disabled to prevent accidental data loss"
        });

        // Create audit log
        await createAuditLog({
            adminId: req.user._id,
            action: 'DELETE',
            resourceType: 'category',
            resourceId: req.params.id,
            previousValues: {
                name: amenity.name,
                category: amenity.category,
                type: 'amenity'
            },
            req
        });

        res.json({
            success: true,
            message: "Amenity deleted successfully"
        });

    } catch (error) {
        console.error('Error deleting amenity:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to delete amenity"
        });
    }
});

/**
 * POST /api/admin/categories/amenities/bulk
 * Bulk create amenities
 */
router.post("/amenities/bulk", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        const { amenities } = req.body;

        if (!Array.isArray(amenities) || amenities.length === 0) {
            return res.status(400).json({
                success: false,
                error: "VALIDATION_ERROR",
                message: "Amenities array is required"
            });
        }

        const results = {
            created: [],
            skipped: [],
            errors: []
        };

        for (const amenityData of amenities) {
            try {
                const bodyResult = amenityCreateSchema.safeParse(amenityData);
                if (!bodyResult.success) {
                    results.errors.push({
                        name: amenityData.name,
                        error: bodyResult.error.errors
                    });
                    continue;
                }

                const { name, icon, category, isActive, order } = bodyResult.data;

                // Check for duplicate
                const existing = await Amenity.findOne({
                    name: { $regex: new RegExp(`^${name}$`, 'i') }
                });

                if (existing) {
                    results.skipped.push({ name, reason: 'Already exists' });
                    continue;
                }

                const newAmenity = new Amenity({
                    name,
                    icon,
                    category,
                    isActive,
                    order
                });

                await newAmenity.save();
                results.created.push(newAmenity.toObject());

            } catch (err) {
                results.errors.push({
                    name: amenityData.name,
                    error: err.message
                });
            }
        }

        // Create audit log for bulk operation
        if (results.created.length > 0) {
            await createAuditLog({
                adminId: req.user._id,
                action: 'CREATE',
                resourceType: 'category',
                changes: {
                    type: 'bulk_amenity_create',
                    count: results.created.length,
                    names: results.created.map(a => a.name)
                },
                req
            });
        }

        res.status(201).json({
            success: true,
            data: results,
            message: `Created ${results.created.length} amenities, skipped ${results.skipped.length}, errors ${results.errors.length}`
        });

    } catch (error) {
        console.error('Error bulk creating amenities:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to bulk create amenities"
        });
    }
});

export default router;
