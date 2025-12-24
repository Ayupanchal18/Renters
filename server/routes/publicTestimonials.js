import { Router } from "express";
import { Testimonial } from "../models/Testimonial.js";
import { connectDB } from "../src/config/db.js";

const router = Router();

/**
 * GET /api/testimonials
 * Get active testimonials for homepage
 */
router.get("/", async (req, res) => {
    try {
        await connectDB();

        const limit = parseInt(req.query.limit) || 3;

        const testimonials = await Testimonial.find({ isActive: true })
            .sort({ order: 1, createdAt: -1 })
            .limit(limit)
            .select('name role location content rating image')
            .lean();

        res.json({
            success: true,
            data: testimonials
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

export default router;
