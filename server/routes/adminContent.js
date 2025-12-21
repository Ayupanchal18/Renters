import { Router } from "express";
import { z } from "zod";
import { Content } from "../models/Content.js";
import { connectDB } from "../src/config/db.js";
import { requireAdmin } from "../src/middleware/adminAuth.js";
import { createAuditLog } from "../src/services/adminAuditService.js";

const router = Router();

/**
 * Admin Content Management Routes (CMS)
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 * - 6.1: Update homepage banners
 * - 6.2: Edit hero sections
 * - 6.3: Manage static pages (About, Terms, Privacy)
 * - 6.4: Create blog content
 * - 6.5: Update SEO metadata
 */

/* ---------------------- VALIDATION SCHEMAS ---------------------- */

const contentListQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    type: z.enum(['banner', 'hero', 'page', 'blog']).optional(),
    isPublished: z.enum(['true', 'false']).optional(),
    search: z.string().optional(),
    sortBy: z.string().default('order'),
    sortOrder: z.enum(['asc', 'desc']).default('asc')
});

const bannerCreateSchema = z.object({
    slug: z.string().min(1, "Slug is required"),
    title: z.string().min(1, "Title is required"),
    content: z.string().optional(),
    imageUrl: z.string().url().optional().nullable(),
    linkUrl: z.string().url().optional().nullable(),
    linkText: z.string().optional().nullable(),
    startDate: z.string().datetime().optional().nullable(),
    endDate: z.string().datetime().optional().nullable(),
    order: z.number().int().default(0),
    isPublished: z.boolean().default(false)
});


const bannerUpdateSchema = bannerCreateSchema.partial();

const heroCreateSchema = z.object({
    slug: z.string().min(1, "Slug is required"),
    title: z.string().min(1, "Title is required"),
    content: z.string().optional(),
    imageUrl: z.string().url().optional().nullable(),
    metadata: z.object({
        seoTitle: z.string().optional(),
        seoDescription: z.string().optional(),
        seoKeywords: z.array(z.string()).optional()
    }).optional(),
    order: z.number().int().default(0),
    isPublished: z.boolean().default(false)
});

const heroUpdateSchema = heroCreateSchema.partial();

const pageCreateSchema = z.object({
    slug: z.string().min(1, "Slug is required"),
    title: z.string().min(1, "Title is required"),
    content: z.string().min(1, "Content is required"),
    metadata: z.object({
        seoTitle: z.string().optional(),
        seoDescription: z.string().optional(),
        seoKeywords: z.array(z.string()).optional(),
        author: z.string().optional()
    }).optional(),
    isPublished: z.boolean().default(false)
});

const pageUpdateSchema = pageCreateSchema.partial();

const blogCreateSchema = z.object({
    slug: z.string().min(1, "Slug is required"),
    title: z.string().min(1, "Title is required"),
    content: z.string().min(1, "Content is required"),
    imageUrl: z.string().url().optional().nullable(),
    metadata: z.object({
        seoTitle: z.string().optional(),
        seoDescription: z.string().optional(),
        seoKeywords: z.array(z.string()).optional(),
        author: z.string().optional(),
        excerpt: z.string().optional()
    }).optional(),
    isPublished: z.boolean().default(false)
});

const blogUpdateSchema = blogCreateSchema.partial();

const seoUpdateSchema = z.object({
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional(),
    seoKeywords: z.array(z.string()).optional()
});


/* ---------------------- HELPER FUNCTIONS ---------------------- */

/**
 * Build search query for content
 */
const buildContentQuery = (type, isPublished, search) => {
    const query = {};

    if (type) {
        query.type = type;
    }

    if (isPublished !== undefined) {
        query.isPublished = isPublished === 'true';
    }

    if (search) {
        query.$or = [
            { title: { $regex: search, $options: 'i' } },
            { slug: { $regex: search, $options: 'i' } },
            { content: { $regex: search, $options: 'i' } }
        ];
    }

    return query;
};

/* ---------------------- GENERIC CONTENT ROUTES ---------------------- */

/**
 * GET /api/admin/content
 * List all content with pagination and filters
 */
router.get("/", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        const queryResult = contentListQuerySchema.safeParse(req.query);
        if (!queryResult.success) {
            return res.status(400).json({
                success: false,
                error: "VALIDATION_ERROR",
                message: "Invalid query parameters",
                details: queryResult.error.errors
            });
        }

        const { page, limit, type, isPublished, search, sortBy, sortOrder } = queryResult.data;
        const query = buildContentQuery(type, isPublished, search);
        const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
        const skip = (page - 1) * limit;

        const [content, total] = await Promise.all([
            Content.find(query)
                .populate('createdBy', 'name email')
                .populate('updatedBy', 'name email')
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .lean(),
            Content.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: {
                content,
                pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
            }
        });
    } catch (error) {
        console.error('Error listing content:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to retrieve content"
        });
    }
});


/* ---------------------- BANNER ROUTES ---------------------- */

/**
 * GET /api/admin/content/banners
 * List all banners
 * Requirements: 6.1 - Update homepage banners
 */
router.get("/banners", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        const queryResult = contentListQuerySchema.safeParse(req.query);
        if (!queryResult.success) {
            return res.status(400).json({
                success: false,
                error: "VALIDATION_ERROR",
                message: "Invalid query parameters",
                details: queryResult.error.errors
            });
        }

        const { page, limit, isPublished, search, sortBy, sortOrder } = queryResult.data;
        const query = buildContentQuery('banner', isPublished, search);
        query.type = 'banner';
        const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
        const skip = (page - 1) * limit;

        const [banners, total] = await Promise.all([
            Content.find(query)
                .populate('createdBy', 'name email')
                .populate('updatedBy', 'name email')
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .lean(),
            Content.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: {
                banners,
                pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
            }
        });
    } catch (error) {
        console.error('Error listing banners:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to retrieve banners"
        });
    }
});

/**
 * POST /api/admin/content/banners
 * Create a new banner
 * Requirements: 6.1 - Update homepage banners
 */
router.post("/banners", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        const bodyResult = bannerCreateSchema.safeParse(req.body);
        if (!bodyResult.success) {
            return res.status(400).json({
                success: false,
                error: "VALIDATION_ERROR",
                message: "Invalid banner data",
                details: bodyResult.error.errors
            });
        }

        // Check for duplicate slug
        const existing = await Content.findOne({ type: 'banner', slug: bodyResult.data.slug });
        if (existing) {
            return res.status(409).json({
                success: false,
                error: "CONFLICT",
                message: "A banner with this slug already exists"
            });
        }

        const banner = new Content({
            ...bodyResult.data,
            type: 'banner',
            createdBy: req.user._id,
            updatedBy: req.user._id
        });

        await banner.save();

        await createAuditLog({
            adminId: req.user._id,
            action: 'CREATE',
            resourceType: 'content',
            resourceId: banner._id,
            changes: { type: 'banner', ...bodyResult.data },
            req
        });

        res.status(201).json({
            success: true,
            data: banner.toObject(),
            message: "Banner created successfully"
        });
    } catch (error) {
        console.error('Error creating banner:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to create banner"
        });
    }
});


/**
 * GET /api/admin/content/banners/:id
 * Get a specific banner
 */
router.get("/banners/:id", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        const banner = await Content.findOne({ _id: req.params.id, type: 'banner' })
            .populate('createdBy', 'name email')
            .populate('updatedBy', 'name email')
            .lean();

        if (!banner) {
            return res.status(404).json({
                success: false,
                error: "NOT_FOUND",
                message: "Banner not found"
            });
        }

        res.json({ success: true, data: banner });
    } catch (error) {
        console.error('Error getting banner:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to retrieve banner"
        });
    }
});

/**
 * PUT /api/admin/content/banners/:id
 * Update a banner
 * Requirements: 6.1 - Update homepage banners
 */
router.put("/banners/:id", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        const bodyResult = bannerUpdateSchema.safeParse(req.body);
        if (!bodyResult.success) {
            return res.status(400).json({
                success: false,
                error: "VALIDATION_ERROR",
                message: "Invalid banner data",
                details: bodyResult.error.errors
            });
        }

        const currentBanner = await Content.findOne({ _id: req.params.id, type: 'banner' }).lean();
        if (!currentBanner) {
            return res.status(404).json({
                success: false,
                error: "NOT_FOUND",
                message: "Banner not found"
            });
        }

        // Check slug uniqueness if being changed
        if (bodyResult.data.slug && bodyResult.data.slug !== currentBanner.slug) {
            const existing = await Content.findOne({
                type: 'banner',
                slug: bodyResult.data.slug,
                _id: { $ne: req.params.id }
            });
            if (existing) {
                return res.status(409).json({
                    success: false,
                    error: "CONFLICT",
                    message: "A banner with this slug already exists"
                });
            }
        }

        const updatedBanner = await Content.findByIdAndUpdate(
            req.params.id,
            { ...bodyResult.data, updatedBy: req.user._id },
            { new: true }
        ).lean();

        await createAuditLog({
            adminId: req.user._id,
            action: 'UPDATE',
            resourceType: 'content',
            resourceId: req.params.id,
            changes: bodyResult.data,
            previousValues: { title: currentBanner.title, slug: currentBanner.slug },
            req
        });

        res.json({
            success: true,
            data: updatedBanner,
            message: "Banner updated successfully"
        });
    } catch (error) {
        console.error('Error updating banner:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to update banner"
        });
    }
});

/**
 * DELETE /api/admin/content/banners/:id
 * Delete a banner
 */
router.delete("/banners/:id", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        const banner = await Content.findOne({ _id: req.params.id, type: 'banner' }).lean();
        if (!banner) {
            return res.status(404).json({
                success: false,
                error: "NOT_FOUND",
                message: "Banner not found"
            });
        }

        // DISABLED: Banner deletion is disabled for data safety
        console.error('❌ Banner deletion is DISABLED for data safety');
        return res.status(403).json({
            success: false,
            error: "OPERATION_DISABLED",
            message: "Banner deletion is disabled to prevent accidental data loss"
        });

        await createAuditLog({
            adminId: req.user._id,
            action: 'DELETE_DISABLED',
            resourceType: 'content',
            resourceId: req.params.id,
            previousValues: { type: 'banner', title: banner.title, slug: banner.slug },
            req
        });

        res.json({ success: true, message: "Banner deleted successfully" });
    } catch (error) {
        console.error('Error deleting banner:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to delete banner"
        });
    }
});


/* ---------------------- HERO SECTION ROUTES ---------------------- */

/**
 * GET /api/admin/content/hero
 * List all hero sections
 * Requirements: 6.2 - Edit hero sections
 */
router.get("/hero", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        const queryResult = contentListQuerySchema.safeParse(req.query);
        if (!queryResult.success) {
            return res.status(400).json({
                success: false,
                error: "VALIDATION_ERROR",
                message: "Invalid query parameters",
                details: queryResult.error.errors
            });
        }

        const { page, limit, isPublished, search, sortBy, sortOrder } = queryResult.data;
        const query = buildContentQuery('hero', isPublished, search);
        query.type = 'hero';
        const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
        const skip = (page - 1) * limit;

        const [heroSections, total] = await Promise.all([
            Content.find(query)
                .populate('createdBy', 'name email')
                .populate('updatedBy', 'name email')
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .lean(),
            Content.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: {
                heroSections,
                pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
            }
        });
    } catch (error) {
        console.error('Error listing hero sections:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to retrieve hero sections"
        });
    }
});

/**
 * POST /api/admin/content/hero
 * Create a new hero section
 * Requirements: 6.2 - Edit hero sections
 */
router.post("/hero", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        const bodyResult = heroCreateSchema.safeParse(req.body);
        if (!bodyResult.success) {
            return res.status(400).json({
                success: false,
                error: "VALIDATION_ERROR",
                message: "Invalid hero section data",
                details: bodyResult.error.errors
            });
        }

        const existing = await Content.findOne({ type: 'hero', slug: bodyResult.data.slug });
        if (existing) {
            return res.status(409).json({
                success: false,
                error: "CONFLICT",
                message: "A hero section with this slug already exists"
            });
        }

        const hero = new Content({
            ...bodyResult.data,
            type: 'hero',
            createdBy: req.user._id,
            updatedBy: req.user._id
        });

        await hero.save();

        await createAuditLog({
            adminId: req.user._id,
            action: 'CREATE',
            resourceType: 'content',
            resourceId: hero._id,
            changes: { type: 'hero', ...bodyResult.data },
            req
        });

        res.status(201).json({
            success: true,
            data: hero.toObject(),
            message: "Hero section created successfully"
        });
    } catch (error) {
        console.error('Error creating hero section:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to create hero section"
        });
    }
});


/**
 * GET /api/admin/content/hero/:id
 * Get a specific hero section
 */
router.get("/hero/:id", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        const hero = await Content.findOne({ _id: req.params.id, type: 'hero' })
            .populate('createdBy', 'name email')
            .populate('updatedBy', 'name email')
            .lean();

        if (!hero) {
            return res.status(404).json({
                success: false,
                error: "NOT_FOUND",
                message: "Hero section not found"
            });
        }

        res.json({ success: true, data: hero });
    } catch (error) {
        console.error('Error getting hero section:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to retrieve hero section"
        });
    }
});

/**
 * PUT /api/admin/content/hero/:id
 * Update a hero section
 * Requirements: 6.2 - Edit hero sections (update immediately)
 */
router.put("/hero/:id", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        const bodyResult = heroUpdateSchema.safeParse(req.body);
        if (!bodyResult.success) {
            return res.status(400).json({
                success: false,
                error: "VALIDATION_ERROR",
                message: "Invalid hero section data",
                details: bodyResult.error.errors
            });
        }

        const currentHero = await Content.findOne({ _id: req.params.id, type: 'hero' }).lean();
        if (!currentHero) {
            return res.status(404).json({
                success: false,
                error: "NOT_FOUND",
                message: "Hero section not found"
            });
        }

        if (bodyResult.data.slug && bodyResult.data.slug !== currentHero.slug) {
            const existing = await Content.findOne({
                type: 'hero',
                slug: bodyResult.data.slug,
                _id: { $ne: req.params.id }
            });
            if (existing) {
                return res.status(409).json({
                    success: false,
                    error: "CONFLICT",
                    message: "A hero section with this slug already exists"
                });
            }
        }

        const updatedHero = await Content.findByIdAndUpdate(
            req.params.id,
            { ...bodyResult.data, updatedBy: req.user._id },
            { new: true }
        ).lean();

        await createAuditLog({
            adminId: req.user._id,
            action: 'UPDATE',
            resourceType: 'content',
            resourceId: req.params.id,
            changes: bodyResult.data,
            previousValues: { title: currentHero.title, slug: currentHero.slug },
            req
        });

        res.json({
            success: true,
            data: updatedHero,
            message: "Hero section updated successfully"
        });
    } catch (error) {
        console.error('Error updating hero section:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to update hero section"
        });
    }
});

/**
 * DELETE /api/admin/content/hero/:id
 * Delete a hero section
 */
router.delete("/hero/:id", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        const hero = await Content.findOne({ _id: req.params.id, type: 'hero' }).lean();
        if (!hero) {
            return res.status(404).json({
                success: false,
                error: "NOT_FOUND",
                message: "Hero section not found"
            });
        }

        // DISABLED: Hero section deletion is disabled for data safety
        console.error('❌ Hero section deletion is DISABLED for data safety');
        return res.status(403).json({
            success: false,
            error: "OPERATION_DISABLED",
            message: "Hero section deletion is disabled to prevent accidental data loss"
        });

        await createAuditLog({
            adminId: req.user._id,
            action: 'DELETE',
            resourceType: 'content',
            resourceId: req.params.id,
            previousValues: { type: 'hero', title: hero.title, slug: hero.slug },
            req
        });

        res.json({ success: true, message: "Hero section deleted successfully" });
    } catch (error) {
        console.error('Error deleting hero section:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to delete hero section"
        });
    }
});


/* ---------------------- STATIC PAGES ROUTES ---------------------- */

/**
 * GET /api/admin/content/pages
 * List all static pages
 * Requirements: 6.3 - Manage static pages (About, Terms, Privacy)
 */
router.get("/pages", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        const queryResult = contentListQuerySchema.safeParse(req.query);
        if (!queryResult.success) {
            return res.status(400).json({
                success: false,
                error: "VALIDATION_ERROR",
                message: "Invalid query parameters",
                details: queryResult.error.errors
            });
        }

        const { page, limit, isPublished, search, sortBy, sortOrder } = queryResult.data;
        const query = buildContentQuery('page', isPublished, search);
        query.type = 'page';
        const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
        const skip = (page - 1) * limit;

        const [pages, total] = await Promise.all([
            Content.find(query)
                .populate('createdBy', 'name email')
                .populate('updatedBy', 'name email')
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .lean(),
            Content.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: {
                pages,
                pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
            }
        });
    } catch (error) {
        console.error('Error listing pages:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to retrieve pages"
        });
    }
});

/**
 * POST /api/admin/content/pages
 * Create a new static page
 * Requirements: 6.3 - Manage static pages
 */
router.post("/pages", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        const bodyResult = pageCreateSchema.safeParse(req.body);
        if (!bodyResult.success) {
            return res.status(400).json({
                success: false,
                error: "VALIDATION_ERROR",
                message: "Invalid page data",
                details: bodyResult.error.errors
            });
        }

        const existing = await Content.findOne({ type: 'page', slug: bodyResult.data.slug });
        if (existing) {
            return res.status(409).json({
                success: false,
                error: "CONFLICT",
                message: "A page with this slug already exists"
            });
        }

        const pageContent = new Content({
            ...bodyResult.data,
            type: 'page',
            createdBy: req.user._id,
            updatedBy: req.user._id
        });

        await pageContent.save();

        await createAuditLog({
            adminId: req.user._id,
            action: 'CREATE',
            resourceType: 'content',
            resourceId: pageContent._id,
            changes: { type: 'page', ...bodyResult.data },
            req
        });

        res.status(201).json({
            success: true,
            data: pageContent.toObject(),
            message: "Page created successfully"
        });
    } catch (error) {
        console.error('Error creating page:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to create page"
        });
    }
});


/**
 * GET /api/admin/content/pages/:slug
 * Get a specific static page by slug
 */
router.get("/pages/:slug", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        const pageContent = await Content.findOne({ slug: req.params.slug, type: 'page' })
            .populate('createdBy', 'name email')
            .populate('updatedBy', 'name email')
            .lean();

        if (!pageContent) {
            return res.status(404).json({
                success: false,
                error: "NOT_FOUND",
                message: "Page not found"
            });
        }

        res.json({ success: true, data: pageContent });
    } catch (error) {
        console.error('Error getting page:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to retrieve page"
        });
    }
});

/**
 * PUT /api/admin/content/pages/:slug
 * Update a static page by slug
 * Requirements: 6.3 - Manage static pages (CRUD operations)
 */
router.put("/pages/:slug", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        const bodyResult = pageUpdateSchema.safeParse(req.body);
        if (!bodyResult.success) {
            return res.status(400).json({
                success: false,
                error: "VALIDATION_ERROR",
                message: "Invalid page data",
                details: bodyResult.error.errors
            });
        }

        const currentPage = await Content.findOne({ slug: req.params.slug, type: 'page' }).lean();
        if (!currentPage) {
            return res.status(404).json({
                success: false,
                error: "NOT_FOUND",
                message: "Page not found"
            });
        }

        if (bodyResult.data.slug && bodyResult.data.slug !== currentPage.slug) {
            const existing = await Content.findOne({
                type: 'page',
                slug: bodyResult.data.slug,
                _id: { $ne: currentPage._id }
            });
            if (existing) {
                return res.status(409).json({
                    success: false,
                    error: "CONFLICT",
                    message: "A page with this slug already exists"
                });
            }
        }

        const updatedPage = await Content.findByIdAndUpdate(
            currentPage._id,
            { ...bodyResult.data, updatedBy: req.user._id },
            { new: true }
        ).lean();

        await createAuditLog({
            adminId: req.user._id,
            action: 'UPDATE',
            resourceType: 'content',
            resourceId: currentPage._id,
            changes: bodyResult.data,
            previousValues: { title: currentPage.title, slug: currentPage.slug },
            req
        });

        res.json({
            success: true,
            data: updatedPage,
            message: "Page updated successfully"
        });
    } catch (error) {
        console.error('Error updating page:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to update page"
        });
    }
});

/**
 * DELETE /api/admin/content/pages/:slug
 * Delete a static page by slug
 */
router.delete("/pages/:slug", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        const pageContent = await Content.findOne({ slug: req.params.slug, type: 'page' }).lean();
        if (!pageContent) {
            return res.status(404).json({
                success: false,
                error: "NOT_FOUND",
                message: "Page not found"
            });
        }

        // DISABLED: Page deletion is disabled for data safety
        console.error('❌ Page deletion is DISABLED for data safety');
        return res.status(403).json({
            success: false,
            error: "OPERATION_DISABLED",
            message: "Page deletion is disabled to prevent accidental data loss"
        });

        await createAuditLog({
            adminId: req.user._id,
            action: 'DELETE',
            resourceType: 'content',
            resourceId: pageContent._id,
            previousValues: { type: 'page', title: pageContent.title, slug: pageContent.slug },
            req
        });

        res.json({ success: true, message: "Page deleted successfully" });
    } catch (error) {
        console.error('Error deleting page:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to delete page"
        });
    }
});


/* ---------------------- BLOG ROUTES ---------------------- */

/**
 * GET /api/admin/content/blog
 * List all blog posts
 * Requirements: 6.4 - Create blog content
 */
router.get("/blog", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        const queryResult = contentListQuerySchema.safeParse(req.query);
        if (!queryResult.success) {
            return res.status(400).json({
                success: false,
                error: "VALIDATION_ERROR",
                message: "Invalid query parameters",
                details: queryResult.error.errors
            });
        }

        const { page, limit, isPublished, search, sortBy, sortOrder } = queryResult.data;
        const query = buildContentQuery('blog', isPublished, search);
        query.type = 'blog';
        const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
        const skip = (page - 1) * limit;

        const [posts, total] = await Promise.all([
            Content.find(query)
                .populate('createdBy', 'name email')
                .populate('updatedBy', 'name email')
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .lean(),
            Content.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: {
                posts,
                pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
            }
        });
    } catch (error) {
        console.error('Error listing blog posts:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to retrieve blog posts"
        });
    }
});

/**
 * POST /api/admin/content/blog
 * Create a new blog post
 * Requirements: 6.4 - Create blog content with title, body, and metadata
 */
router.post("/blog", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        const bodyResult = blogCreateSchema.safeParse(req.body);
        if (!bodyResult.success) {
            return res.status(400).json({
                success: false,
                error: "VALIDATION_ERROR",
                message: "Invalid blog post data",
                details: bodyResult.error.errors
            });
        }

        const existing = await Content.findOne({ type: 'blog', slug: bodyResult.data.slug });
        if (existing) {
            return res.status(409).json({
                success: false,
                error: "CONFLICT",
                message: "A blog post with this slug already exists"
            });
        }

        const blogPost = new Content({
            ...bodyResult.data,
            type: 'blog',
            createdBy: req.user._id,
            updatedBy: req.user._id
        });

        await blogPost.save();

        await createAuditLog({
            adminId: req.user._id,
            action: 'CREATE',
            resourceType: 'content',
            resourceId: blogPost._id,
            changes: { type: 'blog', ...bodyResult.data },
            req
        });

        res.status(201).json({
            success: true,
            data: blogPost.toObject(),
            message: "Blog post created successfully"
        });
    } catch (error) {
        console.error('Error creating blog post:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to create blog post"
        });
    }
});


/**
 * GET /api/admin/content/blog/:id
 * Get a specific blog post
 */
router.get("/blog/:id", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        const blogPost = await Content.findOne({ _id: req.params.id, type: 'blog' })
            .populate('createdBy', 'name email')
            .populate('updatedBy', 'name email')
            .lean();

        if (!blogPost) {
            return res.status(404).json({
                success: false,
                error: "NOT_FOUND",
                message: "Blog post not found"
            });
        }

        res.json({ success: true, data: blogPost });
    } catch (error) {
        console.error('Error getting blog post:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to retrieve blog post"
        });
    }
});

/**
 * PUT /api/admin/content/blog/:id
 * Update a blog post
 * Requirements: 6.4 - Create blog content
 */
router.put("/blog/:id", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        const bodyResult = blogUpdateSchema.safeParse(req.body);
        if (!bodyResult.success) {
            return res.status(400).json({
                success: false,
                error: "VALIDATION_ERROR",
                message: "Invalid blog post data",
                details: bodyResult.error.errors
            });
        }

        const currentPost = await Content.findOne({ _id: req.params.id, type: 'blog' }).lean();
        if (!currentPost) {
            return res.status(404).json({
                success: false,
                error: "NOT_FOUND",
                message: "Blog post not found"
            });
        }

        if (bodyResult.data.slug && bodyResult.data.slug !== currentPost.slug) {
            const existing = await Content.findOne({
                type: 'blog',
                slug: bodyResult.data.slug,
                _id: { $ne: req.params.id }
            });
            if (existing) {
                return res.status(409).json({
                    success: false,
                    error: "CONFLICT",
                    message: "A blog post with this slug already exists"
                });
            }
        }

        const updatedPost = await Content.findByIdAndUpdate(
            req.params.id,
            { ...bodyResult.data, updatedBy: req.user._id },
            { new: true }
        ).lean();

        await createAuditLog({
            adminId: req.user._id,
            action: 'UPDATE',
            resourceType: 'content',
            resourceId: req.params.id,
            changes: bodyResult.data,
            previousValues: { title: currentPost.title, slug: currentPost.slug },
            req
        });

        res.json({
            success: true,
            data: updatedPost,
            message: "Blog post updated successfully"
        });
    } catch (error) {
        console.error('Error updating blog post:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to update blog post"
        });
    }
});

/**
 * DELETE /api/admin/content/blog/:id
 * Delete a blog post
 */
router.delete("/blog/:id", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        const blogPost = await Content.findOne({ _id: req.params.id, type: 'blog' }).lean();
        if (!blogPost) {
            return res.status(404).json({
                success: false,
                error: "NOT_FOUND",
                message: "Blog post not found"
            });
        }

        // DISABLED: Blog post deletion is disabled for data safety
        console.error('❌ Blog post deletion is DISABLED for data safety');
        return res.status(403).json({
            success: false,
            error: "OPERATION_DISABLED",
            message: "Blog post deletion is disabled to prevent accidental data loss"
        });

        await createAuditLog({
            adminId: req.user._id,
            action: 'DELETE',
            resourceType: 'content',
            resourceId: req.params.id,
            previousValues: { type: 'blog', title: blogPost.title, slug: blogPost.slug },
            req
        });

        res.json({ success: true, message: "Blog post deleted successfully" });
    } catch (error) {
        console.error('Error deleting blog post:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to delete blog post"
        });
    }
});


/* ---------------------- SEO METADATA ROUTES ---------------------- */

/**
 * GET /api/admin/content/seo/:contentId
 * Get SEO metadata for a specific content item
 * Requirements: 6.5 - Update SEO metadata
 */
router.get("/seo/:contentId", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        const content = await Content.findById(req.params.contentId)
            .select('slug title type metadata')
            .lean();

        if (!content) {
            return res.status(404).json({
                success: false,
                error: "NOT_FOUND",
                message: "Content not found"
            });
        }

        res.json({
            success: true,
            data: {
                contentId: content._id,
                slug: content.slug,
                title: content.title,
                type: content.type,
                seo: {
                    seoTitle: content.metadata?.seoTitle || '',
                    seoDescription: content.metadata?.seoDescription || '',
                    seoKeywords: content.metadata?.seoKeywords || []
                }
            }
        });
    } catch (error) {
        console.error('Error getting SEO metadata:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to retrieve SEO metadata"
        });
    }
});

/**
 * PUT /api/admin/content/seo/:contentId
 * Update SEO metadata for a specific content item
 * Requirements: 6.5 - Update SEO metadata (title, description, keywords)
 */
router.put("/seo/:contentId", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        const bodyResult = seoUpdateSchema.safeParse(req.body);
        if (!bodyResult.success) {
            return res.status(400).json({
                success: false,
                error: "VALIDATION_ERROR",
                message: "Invalid SEO data",
                details: bodyResult.error.errors
            });
        }

        const currentContent = await Content.findById(req.params.contentId).lean();
        if (!currentContent) {
            return res.status(404).json({
                success: false,
                error: "NOT_FOUND",
                message: "Content not found"
            });
        }

        const { seoTitle, seoDescription, seoKeywords } = bodyResult.data;
        const metadataUpdate = {};

        if (seoTitle !== undefined) metadataUpdate['metadata.seoTitle'] = seoTitle;
        if (seoDescription !== undefined) metadataUpdate['metadata.seoDescription'] = seoDescription;
        if (seoKeywords !== undefined) metadataUpdate['metadata.seoKeywords'] = seoKeywords;

        const updatedContent = await Content.findByIdAndUpdate(
            req.params.contentId,
            { $set: { ...metadataUpdate, updatedBy: req.user._id } },
            { new: true }
        )
            .select('slug title type metadata')
            .lean();

        await createAuditLog({
            adminId: req.user._id,
            action: 'UPDATE',
            resourceType: 'content',
            resourceId: req.params.contentId,
            changes: { seo: bodyResult.data },
            previousValues: {
                seo: {
                    seoTitle: currentContent.metadata?.seoTitle,
                    seoDescription: currentContent.metadata?.seoDescription,
                    seoKeywords: currentContent.metadata?.seoKeywords
                }
            },
            req
        });

        res.json({
            success: true,
            data: {
                contentId: updatedContent._id,
                slug: updatedContent.slug,
                title: updatedContent.title,
                type: updatedContent.type,
                seo: {
                    seoTitle: updatedContent.metadata?.seoTitle || '',
                    seoDescription: updatedContent.metadata?.seoDescription || '',
                    seoKeywords: updatedContent.metadata?.seoKeywords || []
                }
            },
            message: "SEO metadata updated successfully"
        });
    } catch (error) {
        console.error('Error updating SEO metadata:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to update SEO metadata"
        });
    }
});

export default router;
