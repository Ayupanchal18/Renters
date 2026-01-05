/**
 * Price Trends API Routes
 * Provides neighborhood price statistics and trends
 */

import { Router } from "express";
import { Property } from "../models/Property.js";

const router = Router();

/**
 * GET /api/price-trends
 * Get price trends and statistics for a city/category combination
 * 
 * Query params:
 * - city (required): City name
 * - category: Property category (flat, house, etc.)
 * - listingType: rent or buy (default: rent)
 * - months: Number of months for trend data (default: 6, max: 12)
 */
router.get("/", async (req, res) => {
    try {
        const {
            city,
            category,
            listingType = "rent",
            months = 6
        } = req.query;

        if (!city) {
            return res.status(400).json({
                success: false,
                error: "City is required"
            });
        }

        const monthsNum = Math.min(Math.max(1, parseInt(months) || 6), 12);
        const priceField = listingType === "buy" ? "sellingPrice" : "monthlyRent";

        // Base match conditions
        const matchConditions = {
            city: { $regex: new RegExp(`^${city}$`, "i") },
            isDeleted: false,
            status: { $in: ["active", "expired"] }, // Include expired for historical data
            [priceField]: { $gt: 0, $exists: true }
        };

        // Add listingType filter
        if (listingType === "buy") {
            matchConditions.listingType = "buy";
        } else {
            matchConditions.$or = [
                { listingType: "rent" },
                { listingType: { $exists: false } },
                { listingType: null }
            ];
        }

        if (category) {
            matchConditions.category = { $regex: new RegExp(`^${category}$`, "i") };
        }

        // Get current statistics
        const statsAggregation = await Property.aggregate([
            { $match: matchConditions },
            {
                $group: {
                    _id: null,
                    count: { $sum: 1 },
                    avgPrice: { $avg: `$${priceField}` },
                    minPrice: { $min: `$${priceField}` },
                    maxPrice: { $max: `$${priceField}` },
                    prices: { $push: `$${priceField}` }
                }
            }
        ]);

        if (!statsAggregation.length || statsAggregation[0].count === 0) {
            return res.json({
                success: true,
                data: {
                    city,
                    category: category || "all",
                    listingType,
                    noData: true,
                    message: "No properties found for this location"
                }
            });
        }

        const stats = statsAggregation[0];
        const sortedPrices = stats.prices.sort((a, b) => a - b);

        // Calculate percentiles
        const getPercentile = (arr, p) => {
            const index = Math.ceil((p / 100) * arr.length) - 1;
            return arr[Math.max(0, index)];
        };

        const percentiles = {
            p10: getPercentile(sortedPrices, 10),
            p25: getPercentile(sortedPrices, 25),
            p50: getPercentile(sortedPrices, 50), // Median
            p75: getPercentile(sortedPrices, 75),
            p90: getPercentile(sortedPrices, 90)
        };

        // Get monthly trend data
        const monthsAgo = new Date();
        monthsAgo.setMonth(monthsAgo.getMonth() - monthsNum);

        const trendAggregation = await Property.aggregate([
            {
                $match: {
                    ...matchConditions,
                    createdAt: { $gte: monthsAgo }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" }
                    },
                    avgPrice: { $avg: `$${priceField}` },
                    count: { $sum: 1 },
                    minPrice: { $min: `$${priceField}` },
                    maxPrice: { $max: `$${priceField}` }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]);

        // Format trend data
        const trends = trendAggregation.map(t => ({
            month: `${t._id.year}-${String(t._id.month).padStart(2, "0")}`,
            avgPrice: Math.round(t.avgPrice),
            count: t.count,
            minPrice: t.minPrice,
            maxPrice: t.maxPrice
        }));

        // Get category breakdown if no specific category requested
        let categoryBreakdown = null;
        if (!category) {
            const categoryAgg = await Property.aggregate([
                { $match: matchConditions },
                {
                    $group: {
                        _id: "$category",
                        avgPrice: { $avg: `$${priceField}` },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { count: -1 } }
            ]);

            categoryBreakdown = categoryAgg.map(c => ({
                category: c._id || "unknown",
                avgPrice: Math.round(c.avgPrice),
                count: c.count
            }));
        }

        res.json({
            success: true,
            data: {
                city,
                category: category || "all",
                listingType,
                totalListings: stats.count,
                averagePrice: Math.round(stats.avgPrice),
                priceRange: {
                    min: stats.minPrice,
                    max: stats.maxPrice
                },
                percentiles,
                trends,
                categoryBreakdown,
                generatedAt: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error("Price trends API error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to get price trends",
            message: error.message
        });
    }
});

/**
 * GET /api/price-trends/compare
 * Compare a specific price against the market
 * 
 * Query params:
 * - city (required)
 * - price (required): The price to compare
 * - category: Property category
 * - listingType: rent or buy
 */
router.get("/compare", async (req, res) => {
    try {
        const { city, price, category, listingType = "rent" } = req.query;

        if (!city || !price) {
            return res.status(400).json({
                success: false,
                error: "City and price are required"
            });
        }

        const priceNum = parseFloat(price);
        if (isNaN(priceNum) || priceNum <= 0) {
            return res.status(400).json({
                success: false,
                error: "Invalid price value"
            });
        }

        const priceField = listingType === "buy" ? "sellingPrice" : "monthlyRent";

        const matchConditions = {
            city: { $regex: new RegExp(`^${city}$`, "i") },
            isDeleted: false,
            status: { $in: ["active", "expired"] },
            [priceField]: { $gt: 0, $exists: true }
        };

        if (listingType === "buy") {
            matchConditions.listingType = "buy";
        } else {
            matchConditions.$or = [
                { listingType: "rent" },
                { listingType: { $exists: false } },
                { listingType: null }
            ];
        }

        if (category) {
            matchConditions.category = { $regex: new RegExp(`^${category}$`, "i") };
        }

        const stats = await Property.aggregate([
            { $match: matchConditions },
            {
                $group: {
                    _id: null,
                    count: { $sum: 1 },
                    avgPrice: { $avg: `$${priceField}` },
                    belowCount: {
                        $sum: {
                            $cond: [{ $lt: [`$${priceField}`, priceNum] }, 1, 0]
                        }
                    }
                }
            }
        ]);

        if (!stats.length || stats[0].count === 0) {
            return res.json({
                success: true,
                data: {
                    noData: true,
                    message: "No comparable properties found"
                }
            });
        }

        const { count, avgPrice, belowCount } = stats[0];
        const percentile = Math.round((belowCount / count) * 100);
        const diffFromAvg = priceNum - avgPrice;
        const diffPercent = ((diffFromAvg / avgPrice) * 100).toFixed(1);

        let priceRating;
        if (percentile <= 25) {
            priceRating = "excellent"; // Below 25th percentile
        } else if (percentile <= 50) {
            priceRating = "good"; // 25th-50th percentile
        } else if (percentile <= 75) {
            priceRating = "fair"; // 50th-75th percentile
        } else {
            priceRating = "high"; // Above 75th percentile
        }

        res.json({
            success: true,
            data: {
                city,
                category: category || "all",
                listingType,
                inputPrice: priceNum,
                averagePrice: Math.round(avgPrice),
                percentile,
                diffFromAverage: Math.round(diffFromAvg),
                diffPercent: parseFloat(diffPercent),
                priceRating,
                comparedTo: count,
                summary: diffFromAvg >= 0
                    ? `This price is ${Math.abs(diffPercent)}% above the average (${priceRating} value)`
                    : `This price is ${Math.abs(diffPercent)}% below the average (${priceRating} value)`
            }
        });

    } catch (error) {
        console.error("Price compare API error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to compare price",
            message: error.message
        });
    }
});

export default router;
