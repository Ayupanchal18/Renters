import { Router } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import { connectDB } from '../src/config/db.js';
import { requireAdmin } from '../src/middleware/adminAuth.js';
import { createAuditLog, safeCreateAuditLog } from '../src/services/adminAuditService.js';
import { requirePermission } from '../src/middleware/permissionGuard.js';

const router = Router();

/* ---- Inline Schema (no separate model file needed yet) ---- */
const roleSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  description: String,
  isSystem: { type: Boolean, default: false },
  permissions: { type: mongoose.Schema.Types.Mixed, default: {} },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

let Role;
try {
  Role = mongoose.model('Role');
} catch {
  Role = mongoose.model('Role', roleSchema);
}

/* ---- Validation ---- */
const createRoleSchema = z.object({
  name: z.string().min(2).max(50).trim(),
  description: z.string().max(200).optional(),
  permissions: z.record(z.record(z.boolean())).optional().default({}),
});

const updateRoleSchema = z.object({
  permissions: z.record(z.record(z.boolean())),
});

/**
 * GET /api/admin/roles
 * List all roles (system + custom)
 */
router.get('/', requirePermission('roles:view'), async (req, res) => {
  try {
    await connectDB();
    const roles = await Role.find({ isSystem: false }).sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: { roles } });
  } catch (error) {
    console.error('List roles error:', error);
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR', message: 'Failed to fetch roles' });
  }
});

/**
 * POST /api/admin/roles
 * Create a custom role
 */
router.post('/', requirePermission('roles:edit'), async (req, res) => {
  try {
    await connectDB();

    console.log('Create role - received body:', JSON.stringify(req.body, null, 2));

    const result = createRoleSchema.safeParse(req.body);
    if (!result.success) {
      console.log('Validation failed:', result.error.errors);
      return res.status(400).json({ success: false, error: 'VALIDATION_ERROR', details: result.error.errors });
    }

    const { name, description, permissions } = result.data;

    // Check uniqueness
    const existing = await Role.findOne({ name });
    if (existing) {
      console.log('Role already exists:', name);
      return res.status(409).json({ success: false, error: 'DUPLICATE', message: `Role '${name}' already exists` });
    }

    console.log('Creating role:', { name, description, permissionKeys: Object.keys(permissions || {}) });

    const role = await Role.create({ name, description, permissions, createdBy: req.user._id });

    console.log('Role created successfully:', role._id);

    // Create audit log (non-blocking)
    try {
      await safeCreateAuditLog({
        adminId: req.user._id,
        action: 'CREATE',
        resourceType: 'role',
        resourceId: role._id,
        changes: { name, permissions },
        req
      });
      console.log('Audit log created successfully');
    } catch (auditError) {
      console.error('Failed to create audit log (non-fatal):', auditError.message);
      // Continue anyway - audit log failure shouldn't break the response
    }

    console.log('Sending response');

    const response = { success: true, data: { role } };
    console.log('Response object:', JSON.stringify(response, null, 2));

    return res.status(201).json(response);
  } catch (error) {
    console.error('Create role error:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({ success: false, error: 'INTERNAL_ERROR', message: 'Failed to create role', details: error.message });
  }
});

/**
 * PUT /api/admin/roles/:id
 * Update role permissions
 */
router.put('/:id', requirePermission('roles:edit'), async (req, res) => {
  try {
    await connectDB();

    console.log('Update role - ID:', req.params.id, 'Body:', JSON.stringify(req.body, null, 2));

    const result = updateRoleSchema.safeParse(req.body);
    if (!result.success) {
      console.log('Validation failed:', result.error.errors);
      return res.status(400).json({ success: false, error: 'VALIDATION_ERROR', details: result.error.errors });
    }

    console.log('Updating role with permissions');

    const role = await Role.findOneAndUpdate(
      { _id: req.params.id, isSystem: false },
      { permissions: result.data.permissions, updatedAt: new Date() },
      { new: true }
    ).lean();

    if (!role) {
      console.log('Role not found or is system role');
      return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Role not found or is a system role' });
    }

    console.log('Role updated successfully');

    // Create audit log (non-blocking)
    try {
      await safeCreateAuditLog({
        adminId: req.user._id,
        action: 'UPDATE',
        resourceType: 'role',
        resourceId: req.params.id,
        changes: { permissions: result.data.permissions },
        req
      });
      console.log('Audit log created successfully');
    } catch (auditError) {
      console.error('Failed to create audit log (non-fatal):', auditError.message);
    }

    console.log('Sending update response');
    return res.json({ success: true, data: { role } });
  } catch (error) {
    console.error('Update role error:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({ success: false, error: 'INTERNAL_ERROR', message: 'Failed to update role', details: error.message });
  }
});

/**
 * DELETE /api/admin/roles/:id
 * Delete a custom role (system roles protected)
 */
router.delete('/:id', requirePermission('roles:edit'), async (req, res) => {
  try {
    await connectDB();

    console.log('Delete role - ID:', req.params.id);

    const role = await Role.findOneAndDelete({ _id: req.params.id, isSystem: false }).lean();

    if (!role) {
      console.log('Role not found or is system role');
      return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Role not found or is a system role' });
    }

    console.log('Role deleted successfully:', role.name);

    // Create audit log (non-blocking)
    try {
      await safeCreateAuditLog({
        adminId: req.user._id,
        action: 'DELETE',
        resourceType: 'role',
        resourceId: req.params.id,
        changes: { name: role.name },
        req
      });
      console.log('Audit log created successfully');
    } catch (auditError) {
      console.error('Failed to create audit log (non-fatal):', auditError.message);
    }

    console.log('Sending delete response');
    return res.json({ success: true, message: 'Role deleted' });
  } catch (error) {
    console.error('Delete role error:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({ success: false, error: 'INTERNAL_ERROR', message: 'Failed to delete role', details: error.message });
  }
});

export default router;
