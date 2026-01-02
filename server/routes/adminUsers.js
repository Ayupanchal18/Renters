import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { connectDB } from "../src/config/db.js";
import { requireAdmin } from "../src/middleware/adminAuth.js";
import { createAuditLog } from "../src/services/adminAuditService.js";

const router = Router();

/**
 * Admin User Management Routes
 */

/* ---------------------- VALIDATION SCHEMAS ---------------------- */

const userListQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().optional(),
    role: z.enum(['user', 'seller', 'admin', 'owner', 'agent']).optional(),
    status: z.enum(['active', 'inactive', 'blocked']).optional(),
    sortBy: z.string().default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc')
});

const userCreateSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email format"),
    phone: z.string().optional(),
    role: z.enum(['user', 'seller', 'admin', 'owner', 'agent']).default('user'),
    password: z.string().min(8, "Password must be at least 8 characters"),
    address: z.string().optional()
});

const userUpdateSchema = z.object({
    name: z.string().min(1).optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    avatar: z.string().optional()
});

const roleChangeSchema = z.object({
    role: z.enum(['user', 'seller', 'admin', 'owner', 'agent'])
});

const statusChangeSchema = z.object({
    action: z.enum(['activate', 'deactivate', 'block', 'unblock']),
    reason: z.string().optional()
});

const passwordResetSchema = z.object({
    sendEmail: z.boolean().default(true)
});

/* ---------------------- HELPER FUNCTIONS ---------------------- */

/**
 * Build search query for users
 */
const buildSearchQuery = (search, role, status) => {
    const query = { isDeleted: { $ne: true } };

    // Search by name, email, or phone
    if (search) {
        query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { phone: { $regex: search, $options: 'i' } }
        ];
    }

    // Filter by role
    if (role) {
        query.role = role;
    }

    // Filter by status
    if (status) {
        switch (status) {
            case 'active':
                query.isActive = true;
                query.isBlocked = { $ne: true };
                break;
            case 'inactive':
                query.isActive = false;
                break;
            case 'blocked':
                query.isBlocked = true;
                break;
        }
    }

    return query;
};

/**
 * Generate a secure temporary password
 */
const generateTemporaryPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
};

/**
 * Remove sensitive fields from user object
 */
const sanitizeUser = (user) => {
    const { passwordHash, passwordHistory, ...safeUser } = user;
    return safeUser;
};

/* ---------------------- ROUTES ---------------------- */

/**
 * GET /api/admin/users
 * List users with pagination, search, and filters
 */
router.get("/", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        // Validate and parse query parameters
        const queryResult = userListQuerySchema.safeParse(req.query);
        if (!queryResult.success) {
            return res.status(400).json({
                success: false,
                error: "VALIDATION_ERROR",
                message: "Invalid query parameters",
                details: queryResult.error.errors
            });
        }

        const { page, limit, search, role, status, sortBy, sortOrder } = queryResult.data;

        // Build query
        const query = buildSearchQuery(search, role, status);

        // Build sort object
        const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

        // Calculate skip
        const skip = (page - 1) * limit;

        // Execute query with pagination
        const [users, total] = await Promise.all([
            User.find(query)
                .select('-passwordHash -passwordHistory')
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .lean(),
            User.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: {
                users,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            }
        });

    } catch (error) {
        console.error('Error listing users:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to retrieve users"
        });
    }
});

/**
 * POST /api/admin/users
 * Create a new user
 */
router.post("/", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        // Validate request body
        const bodyResult = userCreateSchema.safeParse(req.body);
        if (!bodyResult.success) {
            return res.status(400).json({
                success: false,
                error: "VALIDATION_ERROR",
                message: "Invalid user data",
                details: bodyResult.error.errors
            });
        }

        const { name, email, phone, role, password, address } = bodyResult.data;

        // Check if email already exists
        const existingUser = await User.findOne({
            email,
            isDeleted: { $ne: true }
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                error: "CONFLICT",
                message: "A user with this email already exists"
            });
        }

        // Hash password
        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Create user
        const newUser = new User({
            name,
            email,
            phone,
            role,
            passwordHash,
            address,
            isActive: true,
            isBlocked: false
        });

        await newUser.save();

        // Create audit log
        await createAuditLog({
            adminId: req.user._id,
            action: 'CREATE',
            resourceType: 'user',
            resourceId: newUser._id,
            changes: { name, email, phone, role },
            req
        });

        // Return sanitized user
        const userObj = newUser.toObject();
        res.status(201).json({
            success: true,
            data: sanitizeUser(userObj),
            message: "User created successfully"
        });

    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to create user"
        });
    }
});

/**
 * GET /api/admin/users/:id
 * Get user details by ID
 */
router.get("/:id", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        const user = await User.findOne({
            _id: req.params.id,
            isDeleted: { $ne: true }
        })
            .select('-passwordHash -passwordHistory')
            .lean();

        if (!user) {
            return res.status(404).json({
                success: false,
                error: "NOT_FOUND",
                message: "User not found"
            });
        }

        res.json({
            success: true,
            data: user
        });

    } catch (error) {
        console.error('Error getting user:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to retrieve user"
        });
    }
});

/**
 * PUT /api/admin/users/:id
 * Update user details
 */
router.put("/:id", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        // Validate request body
        const bodyResult = userUpdateSchema.safeParse(req.body);
        if (!bodyResult.success) {
            return res.status(400).json({
                success: false,
                error: "VALIDATION_ERROR",
                message: "Invalid user data",
                details: bodyResult.error.errors
            });
        }

        // Get current user for audit log
        const currentUser = await User.findOne({
            _id: req.params.id,
            isDeleted: { $ne: true }
        }).lean();

        if (!currentUser) {
            return res.status(404).json({
                success: false,
                error: "NOT_FOUND",
                message: "User not found"
            });
        }

        // Check email uniqueness if being changed
        if (bodyResult.data.email && bodyResult.data.email !== currentUser.email) {
            const existingUser = await User.findOne({
                email: bodyResult.data.email,
                isDeleted: { $ne: true },
                _id: { $ne: req.params.id }
            });

            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    error: "CONFLICT",
                    message: "A user with this email already exists"
                });
            }
        }

        // Update user
        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            bodyResult.data,
            { new: true }
        )
            .select('-passwordHash -passwordHistory')
            .lean();

        // Create audit log
        await createAuditLog({
            adminId: req.user._id,
            action: 'UPDATE',
            resourceType: 'user',
            resourceId: req.params.id,
            changes: bodyResult.data,
            previousValues: {
                name: currentUser.name,
                email: currentUser.email,
                phone: currentUser.phone,
                address: currentUser.address
            },
            req
        });

        res.json({
            success: true,
            data: updatedUser,
            message: "User updated successfully"
        });

    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to update user"
        });
    }
});

/**
 * DELETE /api/admin/users/:id
 * Soft-delete a user
 */
router.delete("/:id", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        // Get current user for audit log
        const currentUser = await User.findOne({
            _id: req.params.id,
            isDeleted: { $ne: true }
        }).lean();

        if (!currentUser) {
            return res.status(404).json({
                success: false,
                error: "NOT_FOUND",
                message: "User not found"
            });
        }

        // Prevent deleting self
        if (currentUser._id.toString() === req.user._id.toString()) {
            return res.status(400).json({
                success: false,
                error: "VALIDATION_ERROR",
                message: "Cannot delete your own account"
            });
        }

        // Soft-delete user
        await User.findByIdAndUpdate(req.params.id, {
            isDeleted: true,
            deletedAt: new Date(),
            isActive: false
        });

        // Create audit log
        await createAuditLog({
            adminId: req.user._id,
            action: 'DELETE',
            resourceType: 'user',
            resourceId: req.params.id,
            previousValues: {
                name: currentUser.name,
                email: currentUser.email,
                role: currentUser.role
            },
            req
        });

        res.json({
            success: true,
            message: "User deleted successfully"
        });

    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to delete user"
        });
    }
});


/**
 * PATCH /api/admin/users/:id/role
 * Change user role
 */
router.patch("/:id/role", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        // Validate request body
        const bodyResult = roleChangeSchema.safeParse(req.body);
        if (!bodyResult.success) {
            return res.status(400).json({
                success: false,
                error: "VALIDATION_ERROR",
                message: "Invalid role data",
                details: bodyResult.error.errors
            });
        }

        const { role } = bodyResult.data;

        // Get current user
        const currentUser = await User.findOne({
            _id: req.params.id,
            isDeleted: { $ne: true }
        }).lean();

        if (!currentUser) {
            return res.status(404).json({
                success: false,
                error: "NOT_FOUND",
                message: "User not found"
            });
        }

        // Prevent changing own role
        if (currentUser._id.toString() === req.user._id.toString()) {
            return res.status(400).json({
                success: false,
                error: "VALIDATION_ERROR",
                message: "Cannot change your own role"
            });
        }

        const previousRole = currentUser.role;

        // Update role
        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            { role },
            { new: true }
        )
            .select('-passwordHash -passwordHistory')
            .lean();

        // Create audit log for role change
        await createAuditLog({
            adminId: req.user._id,
            action: 'ROLE_CHANGE',
            resourceType: 'user',
            resourceId: req.params.id,
            changes: { role },
            previousValues: { role: previousRole },
            req
        });

        res.json({
            success: true,
            data: updatedUser,
            message: `User role changed from ${previousRole} to ${role}`
        });

    } catch (error) {
        console.error('Error changing user role:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to change user role"
        });
    }
});

/**
 * PATCH /api/admin/users/:id/status
 * Activate, deactivate, or block a user
 */
router.patch("/:id/status", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        // Validate request body
        const bodyResult = statusChangeSchema.safeParse(req.body);
        if (!bodyResult.success) {
            return res.status(400).json({
                success: false,
                error: "VALIDATION_ERROR",
                message: "Invalid status data",
                details: bodyResult.error.errors
            });
        }

        const { action, reason } = bodyResult.data;

        // Get current user
        const currentUser = await User.findOne({
            _id: req.params.id,
            isDeleted: { $ne: true }
        }).lean();

        if (!currentUser) {
            return res.status(404).json({
                success: false,
                error: "NOT_FOUND",
                message: "User not found"
            });
        }

        // Prevent changing own status
        if (currentUser._id.toString() === req.user._id.toString()) {
            return res.status(400).json({
                success: false,
                error: "VALIDATION_ERROR",
                message: "Cannot change your own status"
            });
        }

        // Build update object based on action
        let updateData = {};
        let auditAction = '';
        let statusMessage = '';

        switch (action) {
            case 'activate':
                updateData = { isActive: true };
                auditAction = 'ACTIVATE';
                statusMessage = 'User account activated';
                break;
            case 'deactivate':
                updateData = { isActive: false };
                auditAction = 'DEACTIVATE';
                statusMessage = 'User account deactivated';
                break;
            case 'block':
                updateData = {
                    isBlocked: true,
                    blockedAt: new Date(),
                    blockedReason: reason || 'Blocked by administrator'
                };
                auditAction = 'BLOCK';
                statusMessage = 'User account blocked';
                break;
            case 'unblock':
                updateData = {
                    isBlocked: false,
                    blockedAt: null,
                    blockedReason: null
                };
                auditAction = 'UNBLOCK';
                statusMessage = 'User account unblocked';
                break;
        }

        // Update user status
        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        )
            .select('-passwordHash -passwordHistory')
            .lean();

        // Create audit log
        await createAuditLog({
            adminId: req.user._id,
            action: auditAction,
            resourceType: 'user',
            resourceId: req.params.id,
            changes: updateData,
            previousValues: {
                isActive: currentUser.isActive,
                isBlocked: currentUser.isBlocked,
                blockedReason: currentUser.blockedReason
            },
            metadata: { reason },
            req
        });

        // Notification would be sent here via notification service

        res.json({
            success: true,
            data: updatedUser,
            message: statusMessage
        });

    } catch (error) {
        console.error('Error changing user status:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to change user status"
        });
    }
});

/**
 * POST /api/admin/users/:id/reset-password
 * Force password reset for a user
 */
router.post("/:id/reset-password", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        // Validate request body (optional)
        const bodyResult = passwordResetSchema.safeParse(req.body || {});
        const { sendEmail } = bodyResult.success ? bodyResult.data : { sendEmail: true };

        // Get current user
        const currentUser = await User.findOne({
            _id: req.params.id,
            isDeleted: { $ne: true }
        }).lean();

        if (!currentUser) {
            return res.status(404).json({
                success: false,
                error: "NOT_FOUND",
                message: "User not found"
            });
        }

        // Generate temporary password
        const temporaryPassword = generateTemporaryPassword();

        // Hash the temporary password
        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(temporaryPassword, saltRounds);

        // Update user with new password and flag to require change
        await User.findByIdAndUpdate(req.params.id, {
            passwordHash,
            mustChangePassword: true,
            lastPasswordChange: new Date()
        });

        // Create audit log
        await createAuditLog({
            adminId: req.user._id,
            action: 'PASSWORD_RESET',
            resourceType: 'user',
            resourceId: req.params.id,
            changes: { mustChangePassword: true },
            metadata: { sendEmail },
            req
        });

        // Email would be sent here via email service

        res.json({
            success: true,
            data: {
                temporaryPassword: temporaryPassword, // In production, this should only be sent via email
                mustChangePassword: true
            },
            message: "Password reset successfully. User must change password on next login."
        });

    } catch (error) {
        console.error('Error resetting password:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to reset password"
        });
    }
});

export default router;
