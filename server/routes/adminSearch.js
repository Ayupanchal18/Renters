import { Router } from 'express';
import { z } from 'zod';
import { User } from '../models/User.js';
import { Property } from '../models/Property.js';
import { AuditLog } from '../models/AuditLog.js';
import { connectDB } from '../src/config/db.js';
import { requireAdmin } from '../src/middleware/adminAuth.js';

const router = Router();

/**
 * GET /api/admin/search
 * Global cross-entity command palette search
 * ?q=<query>&limit=5&entities=users,properties,audit
 */

const searchSchema = z.object({
    q: z.string().min(1).max(200),
    limit: z.coerce.number().int().min(1).max(20).default(5),
    entities: z.string().default('users,properties,audit')
});

router.get('/', requireAdmin, async (req, res) => {
    try {
        await connectDB();

        const parseResult = searchSchema.safeParse(req.query);
        if (!parseResult.success) {
            return res.status(400).json({ success: false, error: 'VALIDATION_ERROR', details: parseResult.error.errors });
        }

        const { q, limit, entities } = parseResult.data;
        const entitySet = new Set(entities.split(',').map(e => e.trim()));

        const results = {};
        const regex = { $regex: q, $options: 'i' };

        const queries = [];

        if (entitySet.has('users')) {
            queries.push(
                User.find({
                    isDeleted: { $ne: true },
                    $or: [{ name: regex }, { email: regex }, { phone: regex }]
                })
                    .select('name email role')
                    .limit(limit)
                    .lean()
                    .then(docs => {
                        results.users = docs.map(u => ({ id: u._id, name: u.name, email: u.email, role: u.role }));
                    })
            );
        }

        if (entitySet.has('properties')) {
            queries.push(
                Property.find({
                    isDeleted: { $ne: true },
                    $or: [{ title: regex }, { city: regex }, { address: regex }]
                })
                    .select('title city status')
                    .limit(limit)
                    .lean()
                    .then(docs => {
                        results.properties = docs.map(p => ({ id: p._id, title: p.title, city: p.city, status: p.status }));
                    })
            );
        }

        if (entitySet.has('audit')) {
            queries.push(
                AuditLog.find({
                    $or: [{ action: regex }, { resourceType: regex }]
                })
                    .select('action resourceType timestamp')
                    .sort({ timestamp: -1 })
                    .limit(limit)
                    .lean()
                    .then(docs => {
                        results.auditLogs = docs.map(a => ({ id: a._id, action: a.action, resourceType: a.resourceType, timestamp: a.timestamp }));
                    })
            );
        }

        await Promise.all(queries);

        res.json({ success: true, data: results });

    } catch (error) {
        console.error('Global search error:', error);
        res.status(500).json({ success: false, error: 'INTERNAL_ERROR', message: 'Search failed' });
    }
});

export default router;
