import "dotenv/config";
import express from "express";
import cors from "cors";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import propertiesRouter from "./routes/properties.js";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async function createServer(devMode = false) {
    const app = express();

    // Create http server only for production
    const httpServer = !devMode ? http.createServer(app) : null;

    // Middleware
    app.use(cors());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Basic route
    app.get("/api/ping", (_req, res) => {
        res.json({ message: process.env.PING_MESSAGE ?? "ping" });
    });

    // -------------------------
    //   CONNECT DATABASE
    // -------------------------
    try {
        const { connectDB } = await import(
            `file://${path.join(__dirname, "src/config/db.js")}`
        );
        await connectDB();
    } catch (err) {
        console.warn("DB connection failed:", err);
    }

    // -------------------------
    //   REGISTER ROUTES
    // -------------------------
    const safeImport = async (relativePath) =>
        import(`file://${path.join(__dirname, relativePath)}`);

    try {
        app.use("/api/auth", (await safeImport("routes/auth.js")).default);
        app.use("/api/properties", (await safeImport("routes/properties.js")).default);
        app.use("/api/users", (await safeImport("routes/users.js")).default);
        app.use("/api/wishlist", (await safeImport("routes/wishlist.js")).default);
        app.use("/api/conversations", (await safeImport("routes/conversations.js")).default);
        app.use("/api/notifications", (await safeImport("routes/notifications.js")).default);
        app.use("/api/search", (await safeImport("routes/search.js")).default);
        app.use("/api/admin", (await safeImport("routes/admin.js")).default);
        app.use("/api/upload", (await safeImport("routes/upload.js")).default);
        app.use("/properties", propertiesRouter);

    } catch (err) {
        console.warn("Failed to load routes:", err);
    }

    // Return only the express app for Vite
    return app;
}
