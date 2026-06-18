import cron from 'node-cron';
import { Content } from '../../models/Content.js';
import { connectDB } from '../config/db.js';

let isJobRunning = false;

/**
 * Scan database for scheduled content pages that are due for publication
 */
export async function checkAndPublishScheduledContent() {
    if (isJobRunning) return;
    isJobRunning = true;

    try {
        await connectDB();
        
        const now = new Date();
        const pendingContent = await Content.find({
            status: 'scheduled',
            scheduledFor: { $lte: now }
        });

        if (pendingContent.length > 0) {
            console.log(`[Scheduler] Found ${pendingContent.length} CMS page(s) due for publication.`);
            
            for (const item of pendingContent) {
                item.status = 'published';
                item.isPublished = true;
                item.publishedAt = now;
                // Clear the scheduled flag so it isn't scanned again
                item.scheduledFor = null;

                await item.save();
                console.log(`[Scheduler] Successfully published CMS Page: "${item.title}" (ID: ${item._id})`);
            }
        }
    } catch (error) {
        console.error('[Scheduler] Error publishing scheduled content:', error);
    } finally {
        isJobRunning = false;
    }
}

/**
 * Initialize the publication scheduler cron task
 */
export function startPublishScheduler() {
    // Run every minute
    cron.schedule('* * * * *', async () => {
        await checkAndPublishScheduledContent();
    });
    console.log('⏰ CMS publish scheduler cron job initialized successfully');
}
