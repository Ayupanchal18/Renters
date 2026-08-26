import { Router } from "express";
import { Property } from "../models/Property.js";

const router = Router();

// In-memory cache for sitemap XML (1-hour TTL)
let cachedSitemapXml = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

function escapeXml(unsafe) {
    if (!unsafe) return "";
    return String(unsafe)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}

router.get("/sitemap.xml", async (req, res) => {
    try {
        const now = Date.now();
        if (cachedSitemapXml && now - lastCacheTime < CACHE_TTL_MS) {
            res.setHeader("Content-Type", "application/xml; charset=utf-8");
            res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=3600");
            return res.send(cachedSitemapXml);
        }

        // Determine base URL dynamically or from environment
        const host = req.get("host") || "localhost:8080";
        const protocol = req.secure || req.headers["x-forwarded-proto"] === "https" ? "https" : "http";
        const baseUrl = process.env.SITE_URL || `${protocol}://${host}`;

        // Fetch active, non-deleted properties
        const properties = await Property.find({
            status: "active",
            isDeleted: false,
        })
            .select("slug listingType updatedAt createdAt")
            .lean()
            .sort({ updatedAt: -1 })
            .limit(10000);

        // Core static routes with priorities and change frequencies
        const staticRoutes = [
            { loc: `${baseUrl}/`, priority: "1.0", changefreq: "daily" },
            { loc: `${baseUrl}/rent-listings`, priority: "0.9", changefreq: "hourly" },
            { loc: `${baseUrl}/buy-listings`, priority: "0.9", changefreq: "hourly" },
            { loc: `${baseUrl}/about`, priority: "0.5", changefreq: "monthly" },
            { loc: `${baseUrl}/contact`, priority: "0.5", changefreq: "monthly" },
            { loc: `${baseUrl}/faqs`, priority: "0.5", changefreq: "weekly" },
            { loc: `${baseUrl}/terms`, priority: "0.3", changefreq: "yearly" },
            { loc: `${baseUrl}/privacy`, priority: "0.3", changefreq: "yearly" },
        ];

        let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
        xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

        // Append static pages
        for (const route of staticRoutes) {
            xml += `  <url>\n`;
            xml += `    <loc>${escapeXml(route.loc)}</loc>\n`;
            xml += `    <changefreq>${route.changefreq}</changefreq>\n`;
            xml += `    <priority>${route.priority}</priority>\n`;
            xml += `  </url>\n`;
        }

        // Append dynamic property listing pages
        for (const prop of properties) {
            if (!prop.slug) continue;
            const listingType = prop.listingType === "buy" ? "buy" : "rent";
            const propUrl = `${baseUrl}/${listingType}/${prop.slug}`;
            const lastModDate = (prop.updatedAt || prop.createdAt || new Date()).toISOString();

            xml += `  <url>\n`;
            xml += `    <loc>${escapeXml(propUrl)}</loc>\n`;
            xml += `    <lastmod>${lastModDate}</lastmod>\n`;
            xml += `    <changefreq>daily</changefreq>\n`;
            xml += `    <priority>0.8</priority>\n`;
            xml += `  </url>\n`;
        }

        xml += `</urlset>`;

        // Cache the XML string
        cachedSitemapXml = xml;
        lastCacheTime = now;

        res.setHeader("Content-Type", "application/xml; charset=utf-8");
        res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=3600");
        return res.send(xml);
    } catch (error) {
        console.error("[Sitemap Error]", error);
        res.status(500).setHeader("Content-Type", "text/plain").send("Error generating sitemap");
    }
});

export default router;
