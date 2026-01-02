import { Router } from "express";
import { z } from "zod";
import { Review } from "../models/Review.js";
import { User } from "../models/User.js";
import { connectDB } from "../src/config/db.js";
import { requireAdmin } from "../src/middleware/adminAuth.js";
import { createAuditLog } from "../src/services/adminAuditService.js";

const router = Router();

/**
 * Admin Review Moderation Routes
 */

/* ---------------------- VALIDATION SCHEMAS ---------------------- */

const reviewListQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    status: z.enum(['pending', 'approved', 'rejected']).optional(),
    propertyId: z.string().optional(),
    userId: z.string().optional(),
    minRating: z.coerce.number().int().min(1).max(5).optional(),
    maxRating: z.coerce.number().int().min(1).max(5).optional(),
    search: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    sortBy: z.string().default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc')
});

const rejectReviewSchema = z.object({
    reason: z.string().min(1, "Rejection reason is required"),
    notifyAuthor: z.boolean().default(true)
});

const blockUserSchema = z.object({
    reason: z.string().min(1, "Block reason is required")
});


/* ---------------------- HELPER FUNCTIONS ---------------------- */

/**
 * Build search query for reviews
 */
const buildReviewQuery = (filters) => {
    const query = {};

    if (filters.status) {
        query.status = filters.status;
    }

    if (filters.propertyId) {
        query.propertyId = filters.propertyId;
    }

    if (filters.userId) {
        query.userId = filters.userId;
    }

    if (filters.minRating || filters.maxRating) {
        query.rating = {};
        if (filters.minRating) {
            query.rating.$gte = filters.minRating;
        }
        if (filters.maxRating) {
            query.rating.$lte = filters.maxRating;
        }
    }

    if (filters.search) {
        query.comment = { $regex: filters.search, $options: 'i' };
    }

    if (filters.startDate || filters.endDate) {
        query.createdAt = {};
        if (filters.startDate) {
            query.createdAt.$gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
            const end = new Date(filters.endDate);
            end.setHours(23, 59, 59, 999);
            query.createdAt.$lte = end;
        }
    }

    return query;
};

/* ---------------------- ROUTES ---------------------- */

/**
 * GET /api/admin/reviews
 * List all reviews with pagination and filters
 */
router.get("/", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        const queryResult = reviewListQuerySchema.safeParse(req.query);
        if (!queryResult.success) {
            return res.status(400).json({
                success: false,
                error: "VALIDATION_ERROR",
                message: "Invalid query parameters",
                details: queryResult.error.errors
            });
        }

        const { page, limit, sortBy, sortOrder, ...filters } = queryResult.data;

        const query = buildReviewQuery(filters);
        const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
        const skip = (page - 1) * limit;

        const [reviews, total] = await Promise.all([
            Review.find(query)
                .populate('propertyId', 'title address')
                .populate('userId', 'name email')
                .populate('moderatedBy', 'name email')
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .lean(),
            Review.countDocuments(query)
        ]);

        // Get status counts for summary
        const statusCounts = await Review.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        res.json({
            success: true,
            data: {
                reviews,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                },
                summary: {
                    pending: statusCounts.find(s => s._id === 'pending')?.count || 0,
                    approved: statusCounts.find(s => s._id === 'approved')?.count || 0,
                    rejected: statusCounts.find(s => s._id === 'rejected')?.count || 0
                }
            }
        });

    } catch (error) {
        console.error('Error listing reviews:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to retrieve reviews"
        });
    }
});

/**
 * GET /api/admin/reviews/:id
 * Get a specific review
 */
router.get("/:id", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        const review = await Review.findById(req.params.id)
            .populate('propertyId', 'title address images')
            .populate('userId', 'name email phone avatar')
            .populate('moderatedBy', 'name email')
            .lean();

        if (!review) {
            return res.status(404).json({
                success: false,
                error: "NOT_FOUND",
                message: "Review not found"
            });
        }

        res.json({ success: true, data: review });

    } catch (error) {
        console.error('Error getting review:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to retrieve review"
        });
    }
});


/**
 * PATCH /api/admin/reviews/:id/approve
 * Approve a review to make it publicly visible
 */
router.patch("/:id/approve", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        const review = await Review.findById(req.params.id).lean();
        if (!review) {
            return res.status(404).json({
                success: false,
                error: "NOT_FOUND",
                message: "Review not found"
            });
        }

        if (review.status === 'approved') {
            return res.status(400).json({
                success: false,
                error: "VALIDATION_ERROR",
                message: "Review is already approved"
            });
        }

        const previousStatus = review.status;

        const updatedReview = await Review.findByIdAndUpdate(
            req.params.id,
            {
                status: 'approved',
                moderatedBy: req.user._id,
                moderatedAt: new Date(),
                rejectionReason: null
            },
            { new: true }
        )
            .populate('propertyId', 'title address')
            .populate('userId', 'name email')
            .populate('moderatedBy', 'name email')
            .lean();

        // Create audit log
        await createAuditLog({
            adminId: req.user._id,
            action: 'APPROVE',
            resourceType: 'review',
            resourceId: req.params.id,
            changes: { status: 'approved' },
            previousValues: { status: previousStatus },
            req
        });

        res.json({
            success: true,
            data: updatedReview,
            message: "Review approved successfully"
        });

    } catch (error) {
        console.error('Error approving review:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to approve review"
        });
    }
});

/**
 * PATCH /api/admin/reviews/:id/reject
 * Reject a review and optionally notify the author
 */
router.patch("/:id/reject", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        const bodyResult = rejectReviewSchema.safeParse(req.body);
        if (!bodyResult.success) {
            return res.status(400).json({
                success: false,
                error: "VALIDATION_ERROR",
                message: "Invalid rejection data",
                details: bodyResult.error.errors
            });
        }

        const { reason, notifyAuthor } = bodyResult.data;

        const review = await Review.findById(req.params.id)
            .populate('userId', 'name email')
            .lean();

        if (!review) {
            return res.status(404).json({
                success: false,
                error: "NOT_FOUND",
                message: "Review not found"
            });
        }

        if (review.status === 'rejected') {
            return res.status(400).json({
                success: false,
                error: "VALIDATION_ERROR",
                message: "Review is already rejected"
            });
        }

        const previousStatus = review.status;

        const updatedReview = await Review.findByIdAndUpdate(
            req.params.id,
            {
                status: 'rejected',
                moderatedBy: req.user._id,
                moderatedAt: new Date(),
                rejectionReason: reason
            },
            { new: true }
        )
            .populate('propertyId', 'title address')
            .populate('userId', 'name email')
            .populate('moderatedBy', 'name email')
            .lean();

        // Create audit log
        await createAuditLog({
            adminId: req.user._id,
            action: 'REJECT',
            resourceType: 'review',
            resourceId: req.params.id,
            changes: { status: 'rejected', rejectionReason: reason },
            previousValues: { status: previousStatus },
            metadata: { notifyAuthor },
            req
        });

        if (notifyAuthor && review.userId) {
            // Notification would be sent here
        }

        res.json({
            success: true,
            data: updatedReview,
            message: "Review rejected successfully"
        });

    } catch (error) {
        console.error('Error rejecting review:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to reject review"
        });
    }
});


/**
 * DELETE /api/admin/reviews/:id
 * Delete abusive content and log the action
 */
router.delete("/:id", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        const review = await Review.findById(req.params.id)
            .populate('userId', 'name email')
            .populate('propertyId', 'title')
            .lean();

        if (!review) {
            return res.status(404).json({
                success: false,
                error: "NOT_FOUND",
                message: "Review not found"
            });
        }

        // DISABLED: Review deletion is disabled for data safety
        console.error('❌ Review deletion is DISABLED for data safety');
        return res.status(403).json({
            success: false,
            error: "OPERATION_DISABLED",
            message: "Review deletion is disabled to prevent accidental data loss"
        });

        // Create audit log with full review details for accountability
        await createAuditLog({
            adminId: req.user._id,
            action: 'DELETE',
            resourceType: 'review',
            resourceId: req.params.id,
            previousValues: {
                rating: review.rating,
                comment: review.comment,
                status: review.status,
                userId: review.userId?._id,
                userName: review.userId?.name,
                propertyId: review.propertyId?._id,
                propertyTitle: review.propertyId?.title
            },
            req
        });

        res.json({
            success: true,
            message: "Review deleted successfully"
        });

    } catch (error) {
        console.error('Error deleting review:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to delete review"
        });
    }
});

/**
 * POST /api/admin/reviews/:id/block-user
 * Block user for violations to prevent further review submissions
 */
router.post("/:id/block-user", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        const bodyResult = blockUserSchema.safeParse(req.body);
        if (!bodyResult.success) {
            return res.status(400).json({
                success: false,
                error: "VALIDATION_ERROR",
                message: "Invalid block data",
                details: bodyResult.error.errors
            });
        }

        const { reason } = bodyResult.data;

        // Get the review to find the user
        const review = await Review.findById(req.params.id)
            .populate('userId', 'name email isBlocked')
            .lean();

        if (!review) {
            return res.status(404).json({
                success: false,
                error: "NOT_FOUND",
                message: "Review not found"
            });
        }

        if (!review.userId) {
            return res.status(400).json({
                success: false,
                error: "VALIDATION_ERROR",
                message: "Review has no associated user"
            });
        }

        if (review.userId.isBlocked) {
            return res.status(400).json({
                success: false,
                error: "VALIDATION_ERROR",
                message: "User is already blocked"
            });
        }

        // Block the user
        const updatedUser = await User.findByIdAndUpdate(
            review.userId._id,
            {
                isBlocked: true,
                blockedAt: new Date(),
                blockedReason: `Review violation: ${reason}`
            },
            { new: true }
        ).select('-passwordHash -passwordHistory').lean();

        // Also reject the review if it's not already rejected
        if (review.status !== 'rejected') {
            await Review.findByIdAndUpdate(req.params.id, {
                status: 'rejected',
                moderatedBy: req.user._id,
                moderatedAt: new Date(),
                rejectionReason: `User blocked for violation: ${reason}`
            });
        }

        // Create audit log for blocking user
        await createAuditLog({
            adminId: req.user._id,
            action: 'BLOCK',
            resourceType: 'user',
            resourceId: review.userId._id,
            changes: {
                isBlocked: true,
                blockedReason: `Review violation: ${reason}`
            },
            previousValues: { isBlocked: false },
            metadata: { reviewId: req.params.id, reason },
            req
        });

        res.json({
            success: true,
            data: {
                user: updatedUser,
                reviewId: req.params.id
            },
            message: `User ${review.userId.name} has been blocked for review violations`
        });

    } catch (error) {
        console.error('Error blocking user:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to block user"
        });
    }
});


/**
 * GET /api/admin/reviews/stats
 * Get review statistics
 */
router.get("/stats/summary", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        const { days = 30 } = req.query;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days, 10));

        // Get overall stats
        const overallStats = await Review.aggregate([
            {
                $facet: {
                    byStatus: [
                        { $group: { _id: '$status', count: { $sum: 1 } } }
                    ],
                    byRating: [
                        { $group: { _id: '$rating', count: { $sum: 1 } } },
                        { $sort: { _id: 1 } }
                    ],
                    averageRating: [
                        { $group: { _id: null, avg: { $avg: '$rating' } } }
                    ],
                    total: [
                        { $count: 'count' }
                    ]
                }
            }
        ]);

        // Get recent stats
        const recentStats = await Review.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
            {
                $facet: {
                    byStatus: [
                        { $group: { _id: '$status', count: { $sum: 1 } } }
                    ],
                    total: [
                        { $count: 'count' }
                    ]
                }
            }
        ]);

        const result = overallStats[0];
        const recent = recentStats[0];

        res.json({
            success: true,
            data: {
                overall: {
                    total: result.total[0]?.count || 0,
                    averageRating: result.averageRating[0]?.avg?.toFixed(2) || 0,
                    byStatus: result.byStatus.reduce((acc, item) => {
                        acc[item._id] = item.count;
                        return acc;
                    }, {}),
                    byRating: result.byRating.reduce((acc, item) => {
                        acc[item._id] = item.count;
                        return acc;
                    }, {})
                },
                recent: {
                    period: { days: parseInt(days, 10), startDate },
                    total: recent.total[0]?.count || 0,
                    byStatus: recent.byStatus.reduce((acc, item) => {
                        acc[item._id] = item.count;
                        return acc;
                    }, {})
                }
            }
        });

    } catch (error) {
        console.error('Error getting review stats:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to retrieve review statistics"
        });
    }
});

/**
 * PATCH /api/admin/reviews/bulk/approve
 * Bulk approve multiple reviews
 */
router.patch("/bulk/approve", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        const { reviewIds } = req.body;

        if (!Array.isArray(reviewIds) || reviewIds.length === 0) {
            return res.status(400).json({
                success: false,
                error: "VALIDATION_ERROR",
                message: "reviewIds must be a non-empty array"
            });
        }

        const result = await Review.updateMany(
            { _id: { $in: reviewIds }, status: { $ne: 'approved' } },
            {
                status: 'approved',
                moderatedBy: req.user._id,
                moderatedAt: new Date(),
                rejectionReason: null
            }
        );

        // Create audit log
        await createAuditLog({
            adminId: req.user._id,
            action: 'APPROVE',
            resourceType: 'review',
            changes: { status: 'approved', count: result.modifiedCount },
            metadata: { reviewIds, bulkOperation: true },
            req
        });

        res.json({
            success: true,
            data: {
                modifiedCount: result.modifiedCount,
                matchedCount: result.matchedCount
            },
            message: `${result.modifiedCount} reviews approved successfully`
        });

    } catch (error) {
        console.error('Error bulk approving reviews:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to bulk approve reviews"
        });
    }
});

/**
 * PATCH /api/admin/reviews/bulk/reject
 * Bulk reject multiple reviews
 */
router.patch("/bulk/reject", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        const { reviewIds, reason } = req.body;

        if (!Array.isArray(reviewIds) || reviewIds.length === 0) {
            return res.status(400).json({
                success: false,
                error: "VALIDATION_ERROR",
                message: "reviewIds must be a non-empty array"
            });
        }

        if (!reason) {
            return res.status(400).json({
                success: false,
                error: "VALIDATION_ERROR",
                message: "Rejection reason is required"
            });
        }

        const result = await Review.updateMany(
            { _id: { $in: reviewIds }, status: { $ne: 'rejected' } },
            {
                status: 'rejected',
                moderatedBy: req.user._id,
                moderatedAt: new Date(),
                rejectionReason: reason
            }
        );

        // Create audit log
        await createAuditLog({
            adminId: req.user._id,
            action: 'REJECT',
            resourceType: 'review',
            changes: { status: 'rejected', rejectionReason: reason, count: result.modifiedCount },
            metadata: { reviewIds, bulkOperation: true },
            req
        });

        res.json({
            success: true,
            data: {
                modifiedCount: result.modifiedCount,
                matchedCount: result.matchedCount
            },
            message: `${result.modifiedCount} reviews rejected successfully`
        });

    } catch (error) {
        console.error('Error bulk rejecting reviews:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to bulk reject reviews"
        });
    }
});

export default router;
