import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import createServer from "./index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 8080;

async function startServer() {
    try {
        const { app, httpServer } = await createServer(false);

        // Serve built client files in production
        const distPath = path.join(__dirname, "../client/dist");
        app.use(express.static(distPath));

        // Handle React Router - serve index.html for all non-API routes
        app.get("/{*splat}", (req, res) => {
            if (req.path.startsWith("/api/") || req.path.startsWith("/health") || req.path.startsWith("/socket.io")) {
                return res.status(404).json({ error: "API endpoint not found" });
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