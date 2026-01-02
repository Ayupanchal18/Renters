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

        const distPath = path.join(__dirname, "../dist");

        if (!fs.existsSync(distPath)) {
            console.error(`Dist folder NOT FOUND at: ${distPath}`);
        }

        app.use(express.static(distPath, {
            setHeaders: (res, filePath) => {
                if (filePath.endsWith('.css')) {
                    res.setHeader('Content-Type', 'text/css');
                } else if (filePath.endsWith('.js')) {
                    res.setHeader('Content-Type', 'application/javascript');
                }
            }
        }));

        // Explicitly serve assets folder with higher priority
        app.use('/assets', express.static(path.join(distPath, 'assets'), {
            setHeaders: (res, filePath) => {
                if (filePath.endsWith('.css')) {
                    res.setHeader('Content-Type', 'text/css');
                } else if (filePath.endsWith('.js')) {
                    res.setHeader('Content-Type', 'application/javascript');
                }
            }
        }));

        // Explicitly serve property_image folder for placeholder images
        app.use('/property_image', express.static(path.join(distPath, 'property_image')));

        // Handle React Router - serve index.html for all non-API routes
        // This MUST be after static file middleware
        app.get("/{*path}", (req, res, next) => {
            // Let static files pass through
            if (req.path.includes('.')) {
                return next();
            }
            // Skip API routes and other special paths
            if (req.path.startsWith("/api/") ||
                req.path.startsWith("/health") ||
                req.path.startsWith("/socket.io") ||
                req.path.startsWith("/uploads")) {
                return next();
            }
            res.sendFile(path.join(distPath, "index.html"));
        });

        httpServer.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
}

startServer();