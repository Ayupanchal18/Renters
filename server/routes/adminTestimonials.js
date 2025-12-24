import { Router } from "express";
import { Testimonial } from "../models/Testimonial.js";
import { connectDB } from "../src/config/db.js";
import { requireAdmin } from "../src/middleware/adminAuth.js";

const router = Router();

// Apply auth middleware to all routes
router.use(requireAdmin);

/**
 * GET /api/admin/testimonials
 * Get all testimonials with pagination
 */
router.get("/", async (req, res) => {
    try {
        await connectDB();

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const query = {};

        if (req.query.isActive !== undefined) {
            query.isActive = req.query.isActive === 'true';
        }

        const [testimonials, total] = await Promise.all([
            Testimonial.find(query)
                .sort({ order: 1, createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Testimonial.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: {
                testimonials,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            }
        });

    } catch (error) {
        console.error('Error fetching testimonials:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to retrieve testimonials"
        });
    }
});

/**
 * GET /api/admin/testimonials/:id
 * Get single testimonial
 */
router.get("/:id", async (req, res) => {
    try {
        await connectDB();

        const testimonial = await Testimonial.findById(req.params.id).lean();

        if (!testimonial) {
            return res.status(404).json({
                success: false,
                error: "NOT_FOUND",
                message: "Testimonial not found"
            });
        }

        res.json({
            success: true,
            data: testimonial
        });

    } catch (error) {
        console.error('Error fetching testimonial:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to retrieve testimonial"
        });
    }
});

/**
 * POST /api/admin/testimonials
 * Create new testimonial
 */
router.post("/", async (req, res) => {
    try {
        await connectDB();

        const { name, role, location, content, rating, image, isActive, order } = req.body;

        if (!name || !role || !location || !content) {
            return res.status(400).json({
                success: false,
                error: "VALIDATION_ERROR",
                message: "Name, role, location, and content are required"
            });
        }

        const testimonial = new Testimonial({
            name,
            role,
            location,
            content,
            rating: rating || 5,
            image: image || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff&size=100`,
            isActive: isActive !== false,
            order: order || 0
        });

        await testimonial.save();

        res.status(201).json({
            success: true,
            data: testimonial,
            message: "Testimonial created successfully"
        });

    } catch (error) {
        console.error('Error creating testimonial:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to create testimonial"
        });
    }
});

/**
 * PUT /api/admin/testimonials/:id
 * Update testimonial
 */
router.put("/:id", async (req, res) => {
    try {
        await connectDB();

        const { name, role, location, content, rating, image, isActive, order } = req.body;

        const testimonial = await Testimonial.findById(req.params.id);

        if (!testimonial) {
            return res.status(404).json({
                success: false,
                error: "NOT_FOUND",
                message: "Testimonial not found"
            });
        }

        if (name) testimonial.name = name;
        if (role) testimonial.role = role;
        if (location) testimonial.location = location;
        if (content) testimonial.content = content;
        if (rating !== undefined) testimonial.rating = rating;
        if (image !== undefined) testimonial.image = image;
        if (isActive !== undefined) testimonial.isActive = isActive;
        if (order !== undefined) testimonial.order = order;

        await testimonial.save();

        res.json({
            success: true,
            data: testimonial,
            message: "Testimonial updated successfully"
        });

    } catch (error) {
        console.error('Error updating testimonial:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to update testimonial"
        });
    }
});

/**
 * PATCH /api/admin/testimonials/:id/visibility
 * Toggle testimonial visibility
 */
router.patch("/:id/visibility", async (req, res) => {
    try {
        await connectDB();

        const { isActive } = req.body;

        const testimonial = await Testimonial.findByIdAndUpdate(
            req.params.id,
            { isActive },
            { new: true }
        );

        if (!testimonial) {
            return res.status(404).json({
                success: false,
                error: "NOT_FOUND",
                message: "Testimonial not found"
            });
        }

        res.json({
            success: true,
            data: testimonial,
            message: `Testimonial ${isActive ? 'activated' : 'deactivated'} successfully`
        });

    } catch (error) {
        console.error('Error updating visibility:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to update visibility"
        });
    }
});

/**
 * DELETE /api/admin/testimonials/:id
 * Delete testimonial
 */
router.delete("/:id", async (req, res) => {
    try {
        await connectDB();

        const testimonial = await Testimonial.findByIdAndDelete(req.params.id);

        if (!testimonial) {
            return res.status(404).json({
                success: false,
                error: "NOT_FOUND",
                message: "Testimonial not found"
            });
        }

        res.json({
            success: true,
            message: "Testimonial deleted successfully"
        });

    } catch (error) {
        console.error('Error deleting testimonial:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to delete testimonial"
        });
    }
});

export default router;
