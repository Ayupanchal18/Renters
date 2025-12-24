import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import express from "express";
import createServer from "./index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 8080;

async function startServer() {
    try {
        const { app, httpServer } = await createServer(false);

        // Serve built client files in production
        const distPath = path.join(__dirname, "../dist");
        console.log(`📁 Serving static files from: ${distPath}`);

        // Debug: Check if dist folder exists
        if (fs.existsSync(distPath)) {
            const files = fs.readdirSync(distPath);
            console.log(`📂 Dist folder contents: ${files.join(", ")}`);

            // Check assets folder
            const assetsPath = path.join(distPath, 'assets');
            if (fs.existsSync(assetsPath)) {
                const assetFiles = fs.readdirSync(assetsPath);
                console.log(`📂 Assets folder contents: ${assetFiles.join(", ")}`);
            } else {
                console.error(`❌ Assets folder NOT FOUND at: ${assetsPath}`);
            }
        } else {
            console.error(`❌ Dist folder NOT FOUND at: ${distPath}`);
        }

        // Serve static files with proper MIME types
        app.use(express.static(distPath, {
            setHeaders: (res, filePath) => {
                if (filePath.endsWith('.css')) {
                    res.setHeader('Content-Type', 'text/css');
                } else if (filePath.endsWith('.js')) {
                    res.setHeader('Content-Type', 'application/javascript');
                }
            }
        }));

        // Explicitly serve assets folder
        app.use('/assets', express.static(path.join(distPath, 'assets'), {
            setHeaders: (res, filePath) => {
                if (filePath.endsWith('.css')) {
                    res.setHeader('Content-Type', 'text/css');
                } else if (filePath.endsWith('.js')) {
                    res.setHeader('Content-Type', 'application/javascript');
                }
            }
        }));

        // Handle React Router - serve index.html for all non-API routes
        app.get("/{*splat}", (req, res) => {
            // Skip static assets, API routes, and other special paths
            if (req.path.startsWith("/assets/") ||
                req.path.startsWith("/api/") ||
                req.path.startsWith("/health") ||
                req.path.startsWith("/socket.io")) {
                return res.status(404).json({ error: "Not found" });
            }
            res.sendFile(path.join(distPath, "index.html"));
        });

        httpServer.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
            console.log(`📡 API available at http://localhost:${PORT}/api`);
        });
    } catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
}

startServer();