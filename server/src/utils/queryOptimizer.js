/**
 * Query optimization utilities for property searches
 */

import { Property } from "../../models/Property.js";

/**
 * Optimize aggregation pipeline for better performance
 */
export function optimizeAggregationPipeline(pipeline) {
    const optimized = [...pipeline];

    // Move $match stages as early as possible
    const matchStages = [];
    const otherStages = [];

    optimized.forEach(stage => {
        if (stage.$match) {
            matchStages.push(stage);
        } else {
            otherStages.push(stage);
        }
    });

    // Combine multiple $match stages into one
    if (matchStages.length > 1) {
        const combinedMatch = { $match: { $and: [] } };
        matchStages.forEach(stage => {
            combinedMatch.$match.$and.push(stage.$match);
        });
        return [combinedMatch, ...otherStages];
    }

    return [...matchStages, ...otherStages];
}

/**
 * Build optimized filter query with proper index usage
 */
export function buildOptimizedFilter(filters) {
    const optimizedFilter = {
        isDeleted: false,
        status: "active"
    };

    // Order filters by selectivity (most selective first for better index usage)
    const filterOrder = [
        'ownerId',      // Most selective - specific user
        'city',         // Highly selective - specific location
        'category',     // Moderately selective - property type
        'propertyType', // Moderately selective
        'bedrooms',     // Moderately selective
        'monthlyRent',  // Range query - less selective
        'amenities',    // Array query - less selective
        'furnishing'    // Least selective
    ];

    filterOrder.forEach(key => {
        if (filters[key] !== undefined) {
            optimizedFilter[key] = filters[key];
        }
    });

    return optimizedFilter;
}

/**
 * Get query execution statistics
 */
export async function getQueryStats(pipeline) {
    try {
        const stats = await Property.aggregate([
            ...pipeline,
            {
                $group: {
                    _id: null,
                    executionTimeMs: { $sum: 1 }, // Placeholder - actual timing done externally
                    documentsExamined: { $sum: 1 },
                    documentsReturned: { $sum: 1 }
                }
            }
        ]).explain("executionStats");

        return stats;
    } catch (error) {
        console.error("Query stats error:", error);
        return null;
    }
}

/**
 * Suggest indexes for common query patterns
 */
export function suggestIndexes(queryPattern) {
    const suggestions = [];

    if (queryPattern.city && queryPattern.category) {
        suggestions.push({ city: 1, category: 1, status: 1, isDeleted: 1 });
    }

    if (queryPattern.monthlyRent) {
        suggestions.push({ monthlyRent: 1, status: 1, isDeleted: 1 });
    }

    if (queryPattern.ownerId) {
        suggestions.push({ ownerId: 1, status: 1, isDeleted: 1, createdAt: -1 });
    }

    if (queryPattern.bedrooms) {
        suggestions.push({ bedrooms: 1, city: 1, status: 1, isDeleted: 1 });
    }

    return suggestions;
}

/**
 * Performance monitoring for queries
 */
export class QueryPerformanceMonitor {
    constructor() {
        this.metrics = new Map();
        this.slowQueryThreshold = 1000; // 1 second
    }

    startTimer(queryId) {
        this.metrics.set(queryId, {
            startTime: Date.now(),
            endTime: null,
            duration: null
        });
    }

    endTimer(queryId) {
        const metric = this.metrics.get(queryId);
        if (metric) {
            metric.endTime = Date.now();
            metric.duration = metric.endTime - metric.startTime;

            // Log slow queries
            if (metric.duration > this.slowQueryThreshold) {
                console.warn(`Slow query detected: ${queryId} took ${metric.duration}ms`);
            }
        }

        return metric;
    }

    getMetrics() {
        const metrics = Array.from(this.metrics.values());
        return {
            totalQueries: metrics.length,
            averageDuration: metrics.reduce((sum, m) => sum + (m.duration || 0), 0) / metrics.length,
            slowQueries: metrics.filter(m => m.duration > this.slowQueryThreshold).length
        };
    }

    clearMetrics() {
        this.metrics.clear();
    }
}

// Create singleton instance
export const queryMonitor = new QueryPerformanceMonitor();