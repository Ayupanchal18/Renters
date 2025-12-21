import { Router } from "express";
import { Category } from "../models/Category.js";
import { Amenity } from "../models/Amenity.js";
import { connectDB } from "../src/config/db.js";

const router = Router();

/**
 * Public Category and Amenity Routes
 * These endpoints are used by property forms and listings
 */

/**
 * GET /api/categories
 * Get all active categories for property forms
 */
router.get("/", async (req, res) => {
    try {
        await connectDB();

        const categories = await Category.find({ isActive: true })
            .sort({ order: 1, name: 1 })
            .select('name slug description icon')
            .lean();

        res.json({
            success: true,
            data: categories
        });

    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to retrieve categories"
        });
    }
});

/**
 * GET /api/categories/amenities
 * Get all active amenities for property forms
 */
router.get("/amenities", async (req, res) => {
    try {
        await connectDB();

        const { category } = req.query;

        const query = { isActive: true };
        if (category) {
            query.category = category;
        }

        const amenities = await Amenity.find(query)
            .sort({ category: 1, order: 1, name: 1 })
            .select('name slug icon category')
            .lean();

        // Group by category for easier frontend use
        const grouped = amenities.reduce((acc, amenity) => {
            const cat = amenity.category || 'other';
            if (!acc[cat]) acc[cat] = [];
            acc[cat].push(amenity);
            return acc;
        }, {});

        res.json({
            success: true,
            data: {
                amenities,
                grouped
            }
        });

    } catch (error) {
        console.error('Error fetching amenities:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to retrieve amenities"
        });
    }
});

export default router;
