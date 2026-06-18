import { Router } from 'express';
import mongoose from 'mongoose';
import { connectDB } from '../src/config/db.js';
import { requireAdmin } from '../src/middleware/adminAuth.js';

const router = Router();

/* ---- Inline Schema ---- */
const adminNotificationSchema = new mongoose.Schema({
  type: { type: String, enum: ['system', 'user', 'property', 'review', 'report', 'security'], default: 'system' },
  severity: { type: String, enum: ['info', 'warning', 'critical'], default: 'info' },
  title: { type: String, required: true },
  body: String,
  actionUrl: String,
  relatedId: mongoose.Schema.Types.ObjectId,
  relatedType: String,
  recipients: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: false });

let AdminNotification;
try {
  AdminNotification = mongoose.model('AdminNotification');
} catch {
  AdminNotification = mongoose.model('AdminNotification', adminNotificationSchema);
}

/**
 * GET /api/admin/notification-center
 * Get paginated admin notifications
 */
router.get('/', requireAdmin, async (req, res) => {
  try {
    await connectDB();
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Ensure req.user exists
    if (!req.user || !req.user._id) {
      console.error('Notification center: req.user is missing');
      return res.status(401).json({ success: false, error: 'AUTH_REQUIRED', message: 'Authentication required' });
    }

    const adminId = req.user._id;

    // Simplified query - just get all notifications for now to debug
    const notifications = await AdminNotification.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await AdminNotification.countDocuments({});
    const unreadCount = 0; // Simplified for debugging

    // Map notifications with read status
    const mappedNotifications = notifications.map(n => ({
      ...n,
      isRead: n.readBy?.some(id => id.toString() === adminId.toString()) ?? n.isRead
    }));

    res.json({
      success: true,
      data: {
        notifications: mappedNotifications,
        unreadCount,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
      }
    });
  } catch (error) {
    console.error('Notification center error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      code: error.code
    });
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR', message: 'Failed to fetch notifications', details: error.message });
  }
});

/**
 * PATCH /api/admin/notification-center/read-all
 * Mark all as read for current admin
 */
router.patch('/read-all', requireAdmin, async (req, res) => {
  try {
    await connectDB();
    const adminId = req.user._id;
    await AdminNotification.updateMany(
      { readBy: { $ne: adminId } },
      { $addToSet: { readBy: adminId }, $set: { isRead: true } }
    );
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR', message: 'Failed to mark notifications as read' });
  }
});

/**
 * PATCH /api/admin/notification-center/:id/read
 * Mark a single notification as read
 */
router.patch('/:id/read', requireAdmin, async (req, res) => {
  try {
    await connectDB();
    const adminId = req.user._id;
    const notif = await AdminNotification.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { readBy: adminId }, $set: { isRead: true } },
      { new: true }
    ).lean();
    if (!notif) return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Notification not found' });
    res.json({ success: true, data: { notification: notif } });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR', message: 'Failed to mark as read' });
  }
});

/**
 * DELETE /api/admin/notification-center/:id
 * Dismiss a notification (delete for this user)
 */
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await connectDB();
    // Soft dismiss: just mark as read, don't hard delete shared notifications
    await AdminNotification.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { readBy: req.user._id } }
    );
    res.json({ success: true, message: 'Notification dismissed' });
  } catch (error) {
    console.error('Dismiss notification error:', error);
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR', message: 'Failed to dismiss notification' });
  }
});

/**
 * GET /api/admin/notification-center/unread-count
 * Get unread count for bell badge (lightweight polling endpoint)
 */
router.get('/unread-count', requireAdmin, async (req, res) => {
  try {
    await connectDB();
    const adminId = req.user._id;
    const count = await AdminNotification.countDocuments({
      $or: [{ recipients: { $size: 0 } }, { recipients: adminId }],
      readBy: { $ne: adminId }
    });
    res.json({ success: true, data: { count } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR', message: 'Failed to get count' });
  }
});

export default router;

/**
 * Utility to create a notification from other routes/services
 * Usage: await createAdminNotification({ type, severity, title, body, actionUrl, relatedId, relatedType, recipients })
 */
export async function createAdminNotification({ type = 'system', severity = 'info', title, body, actionUrl, relatedId, relatedType, recipients = [] }) {
  try {
    await connectDB();
    return AdminNotification.create({ type, severity, title, body, actionUrl, relatedId, relatedType, recipients });
  } catch (e) {
    console.error('createAdminNotification error:', e);
  }
}
