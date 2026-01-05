/**
 * Listing Lifecycle Service
 * Handles automatic expiration, renewal, and notifications for property listings
 */

import { Property } from "../../models/Property.js";
import { User } from "../../models/User.js";
import { Notification } from "../../models/Notification.js";

// Configuration
const LISTING_DURATION_DAYS = 30; // Default listing duration
const WARNING_DAYS_BEFORE_EXPIRY = 7; // Send warning X days before expiry

/**
 * Calculate expiration date from now
 * @param {number} days - Number of days until expiration
 * @returns {Date} Expiration date
 */
export function calculateExpirationDate(days = LISTING_DURATION_DAYS) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);
    return expiresAt;
}

/**
 * Process expired listings - mark them as expired
 * Should be run by a cron job (e.g., daily at midnight)
 * @returns {Object} Summary of processed listings
 */
export async function processExpiredListings() {
    const now = new Date();

    try {
        // Find all active listings that have expired
        const expiredListings = await Property.find({
            status: "active",
            isDeleted: false,
            expiresAt: { $lte: now }
        }).select("_id title ownerId ownerEmail city").lean();

        if (expiredListings.length === 0) {
            console.log("[Lifecycle] No expired listings found");
            return { processed: 0, errors: [] };
        }

        console.log(`[Lifecycle] Found ${expiredListings.length} expired listings`);

        // Bulk update to mark as expired
        const result = await Property.updateMany(
            {
                status: "active",
                isDeleted: false,
                expiresAt: { $lte: now }
            },
            {
                $set: { status: "expired" }
            }
        );

        // Create notifications for owners
        const notifications = expiredListings.map(listing => ({
            userId: listing.ownerId,
            type: "listing_expired",
            title: "Listing Expired",
            message: `Your listing "${listing.title}" in ${listing.city} has expired. Renew it to make it visible again.`,
            data: {
                propertyId: listing._id,
                action: "renew"
            },
            read: false,
            createdAt: now
        }));

        if (notifications.length > 0) {
            try {
                await Notification.insertMany(notifications, { ordered: false });
            } catch (notifError) {
                console.error("[Lifecycle] Error creating expiration notifications:", notifError.message);
            }
        }

        console.log(`[Lifecycle] Marked ${result.modifiedCount} listings as expired`);

        return {
            processed: result.modifiedCount,
            errors: []
        };

    } catch (error) {
        console.error("[Lifecycle] Error processing expired listings:", error);
        return { processed: 0, errors: [error.message] };
    }
}

/**
 * Send expiration warnings to owners whose listings will expire soon
 * Should be run by a cron job (e.g., daily)
 * @returns {Object} Summary of warnings sent
 */
export async function sendExpirationWarnings() {
    const now = new Date();
    const warningDate = new Date();
    warningDate.setDate(warningDate.getDate() + WARNING_DAYS_BEFORE_EXPIRY);

    try {
        // Find listings expiring within warning period that haven't been warned
        const expiringListings = await Property.find({
            status: "active",
            isDeleted: false,
            expirationWarned: { $ne: true },
            expiresAt: {
                $gt: now,
                $lte: warningDate
            }
        }).select("_id title ownerId ownerEmail city expiresAt").lean();

        if (expiringListings.length === 0) {
            console.log("[Lifecycle] No listings need expiration warnings");
            return { warned: 0, errors: [] };
        }

        console.log(`[Lifecycle] Sending warnings for ${expiringListings.length} expiring listings`);

        // Create notifications
        const notifications = expiringListings.map(listing => {
            const daysLeft = Math.ceil((listing.expiresAt - now) / (1000 * 60 * 60 * 24));
            return {
                userId: listing.ownerId,
                type: "listing_expiring",
                title: "Listing Expiring Soon",
                message: `Your listing "${listing.title}" will expire in ${daysLeft} day(s). Renew it to keep it visible.`,
                data: {
                    propertyId: listing._id,
                    expiresAt: listing.expiresAt,
                    action: "renew"
                },
                read: false,
                createdAt: now
            };
        });

        if (notifications.length > 0) {
            try {
                await Notification.insertMany(notifications, { ordered: false });
            } catch (notifError) {
                console.error("[Lifecycle] Error creating warning notifications:", notifError.message);
            }
        }

        // Mark listings as warned
        const listingIds = expiringListings.map(l => l._id);
        await Property.updateMany(
            { _id: { $in: listingIds } },
            { $set: { expirationWarned: true } }
        );

        console.log(`[Lifecycle] Sent ${expiringListings.length} expiration warnings`);

        return {
            warned: expiringListings.length,
            errors: []
        };

    } catch (error) {
        console.error("[Lifecycle] Error sending expiration warnings:", error);
        return { warned: 0, errors: [error.message] };
    }
}

/**
 * Renew a listing for another period
 * @param {string} propertyId - Property ID to renew
 * @param {string} userId - User requesting the renewal (must be owner)
 * @param {number} days - Number of days to extend (default: 30)
 * @returns {Object} Renewal result
 */
export async function renewListing(propertyId, userId, days = LISTING_DURATION_DAYS) {
    try {
        const property = await Property.findOne({
            _id: propertyId,
            isDeleted: false
        });

        if (!property) {
            return { success: false, error: "Property not found" };
        }

        // Verify ownership
        if (property.ownerId.toString() !== userId.toString()) {
            return { success: false, error: "You don't have permission to renew this listing" };
        }

        // Check if property is blocked
        if (property.status === "blocked") {
            return { success: false, error: "This listing has been blocked and cannot be renewed" };
        }

        const now = new Date();
        const newExpiresAt = new Date();
        newExpiresAt.setDate(newExpiresAt.getDate() + days);

        // Update the property
        property.expiresAt = newExpiresAt;
        property.lastRenewedAt = now;
        property.renewalCount = (property.renewalCount || 0) + 1;
        property.expirationWarned = false; // Reset warning flag

        // Reactivate if it was expired
        if (property.status === "expired") {
            property.status = "active";
        }

        await property.save();

        console.log(`[Lifecycle] Renewed property ${propertyId} until ${newExpiresAt.toISOString()}`);

        return {
            success: true,
            property: {
                _id: property._id,
                title: property.title,
                status: property.status,
                expiresAt: property.expiresAt,
                renewalCount: property.renewalCount
            }
        };

    } catch (error) {
        console.error("[Lifecycle] Error renewing listing:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Get listing lifecycle stats for admin dashboard
 * @returns {Object} Lifecycle statistics
 */
export async function getLifecycleStats() {
    try {
        const now = new Date();
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

        const [active, expired, expiringIn7Days, neverExpires] = await Promise.all([
            Property.countDocuments({ status: "active", isDeleted: false }),
            Property.countDocuments({ status: "expired", isDeleted: false }),
            Property.countDocuments({
                status: "active",
                isDeleted: false,
                expiresAt: { $gt: now, $lte: sevenDaysFromNow }
            }),
            Property.countDocuments({
                status: "active",
                isDeleted: false,
                expiresAt: null
            })
        ]);

        return {
            active,
            expired,
            expiringIn7Days,
            neverExpires,
            total: active + expired
        };

    } catch (error) {
        console.error("[Lifecycle] Error getting stats:", error);
        return null;
    }
}

export default {
    calculateExpirationDate,
    processExpiredListings,
    sendExpirationWarnings,
    renewListing,
    getLifecycleStats,
    LISTING_DURATION_DAYS,
    WARNING_DAYS_BEFORE_EXPIRY
};
