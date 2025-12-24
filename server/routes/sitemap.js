import { Router } from "express";
import { Property } from "../models/Property.js";
import { connectDB } from "../src/config/db.js";

const router = Router();

/**
 * Sitemap Generator
 * Generates XML sitemap for SEO optimization
 * Requirements: 8.1, 8.2, 8.4
 */

// Site configuration
const SITE_URL = process.env.SITE_URL || 'https://renters.com';

// Static pages with their priorities and change frequencies
const STATIC_PAGES = [
    { path: '/', priority: 1.0, changefreq: 'daily' },
    { path: '/listings', priority: 0.9, changefreq: 'daily' },
    { path: '/about', priority: 0.5, changefreq: 'monthly' },
    { path: '/contact', priority: 0.5, changefreq: 'monthly' },
    { path: '/faqs', priority: 0.5, changefreq: 'monthly' },
    { path: '/privacy', priority: 0.3, changefreq: 'yearly' },
    { path: '/terms', priority: 0.3, changefreq: 'yearly' },
    { path: '/refund', priority: 0.3, changefreq: 'yearly' },
];

/**
 * Build XML sitemap string from URL entries
 * @param {Array} urls - Array of URL objects with loc, lastmod, priority, changefreq
 * @returns {string} XML sitemap string
 */
function buildSitemapXML(urls) {
    const urlEntries = urls.map(url => {
        let entry = `  <url>\n    <loc>${escapeXml(url.loc)}</loc>`;

        if (url.lastmod) {
            const lastmodDate = url.lastmod instanceof Date
                ? url.lastmod.toISOString().split('T')[0]
                : url.lastmod;
            entry += `\n    <lastmod>${lastmodDate}</lastmod>`;
        }

        if (url.changefreq) {
            entry += `\n    <changefreq>${url.changefreq}</changefreq>`;
        }

        if (url.priority !== undefined) {
            entry += `\n    <priority>${url.priority.toFixed(1)}</priority>`;
        }

        entry += '\n  </url>';
        return entry;
    }).join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;
}

/**
 * Escape special XML characters
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeXml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

/**
 * GET /sitemap.xml
 * Generate XML sitemap with static pages and all active property URLs
 * Requirements: 8.1, 8.2, 8.4
 */
router.get("/", async (req, res) => {
    try {
        await connectDB();

        // Build static page URLs
        const staticUrls = STATIC_PAGES.map(page => ({
            loc: `${SITE_URL}${page.path}`,
            lastmod: new Date(),
            priority: page.priority,
            changefreq: page.changefreq
        }));

        // Fetch all active properties
        const properties = await Property.find({
            status: 'active',
            isDeleted: false
        })
            .select('slug updatedAt createdAt')
            .lean();

        // Build property URLs
        const propertyUrls = properties.map(property => ({
            loc: `${SITE_URL}/properties/${property.slug || property._id}`,
            lastmod: property.updatedAt || property.createdAt,
            priority: 0.8,
            changefreq: 'weekly'
        }));

        // Combine all URLs
        const allUrls = [...staticUrls, ...propertyUrls];

        // Generate XML
        const sitemapXml = buildSitemapXML(allUrls);

        // Set response headers
        res.set('Content-Type', 'application/xml');
        res.set('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour

        res.send(sitemapXml);

    } catch (error) {
        console.error('Error generating sitemap:', error);

        // Return a minimal sitemap on error
        const fallbackXml = buildSitemapXML(STATIC_PAGES.map(page => ({
            loc: `${SITE_URL}${page.path}`,
            priority: page.priority,
            changefreq: page.changefreq
        })));

        res.set('Content-Type', 'application/xml');
        res.status(200).send(fallbackXml);
    }
});

export default router;
