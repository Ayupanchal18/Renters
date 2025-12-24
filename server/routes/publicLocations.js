import { Router } from "express";
import { Location } from "../models/Location.js";
import { connectDB } from "../src/config/db.js";

const router = Router();

/**
 * Public Location Routes
 * 
 * Provides public access to visible locations for property forms
 */

/**
 * GET /api/locations/cities
 * Get all visible cities for property posting dropdown
 */
router.get("/cities", async (req, res) => {
    try {
        await connectDB();

        const cities = await Location.find({
            type: 'city',
            isVisible: true
        })
            .select('name slug')
            .sort({ name: 1 })
            .lean();

        res.json({
            success: true,
            data: cities
        });

    } catch (error) {
        console.error('Error fetching cities:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to retrieve cities"
        });
    }
});

/**
 * GET /api/locations/states
 * Get all visible states
 */
router.get("/states", async (req, res) => {
    try {
        await connectDB();

        const states = await Location.find({
            type: 'state',
            isVisible: true
        })
            .select('name slug')
            .sort({ name: 1 })
            .lean();

        res.json({
            success: true,
            data: states
        });

    } catch (error) {
        console.error('Error fetching states:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to retrieve states"
        });
    }
});

/**
 * GET /api/locations/areas
 * Get all visible areas, optionally filtered by city
 */
router.get("/areas", async (req, res) => {
    try {
        await connectDB();

        const { cityId } = req.query;

        const query = {
            type: 'area',
            isVisible: true
        };

        if (cityId) {
            query.parentId = cityId;
        }

        const areas = await Location.find(query)
            .select('name slug parentId')
            .populate('parentId', 'name')
            .sort({ name: 1 })
            .lean();

        res.json({
            success: true,
            data: areas
        });

    } catch (error) {
        console.error('Error fetching areas:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to retrieve areas"
        });
    }
});

export default router;
