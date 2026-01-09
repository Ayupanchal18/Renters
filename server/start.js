import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import express from "express";
import createServer from "./index.js";
import { validateEnv, getSafeConfigForLogging, EnvValidationError } from "./src/config/envSchema.js";
import logger from "./src/services/loggerService.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
    // ========================
    // ENVIRONMENT VALIDATION
    // Fail fast if required environment variables are missing or invalid
    // Requirements: 6.1, 6.2, 6.6
    // ========================
    let envConfig;
    try {
        envConfig = validateEnv();

        // Log validated configuration (without secrets)
        const safeConfig = getSafeConfigForLogging(envConfig);
        logger.info('Environment validation successful', {
            config: {
                NODE_ENV: safeConfig.NODE_ENV,
                PORT: safeConfig.PORT,
                DB_NAME: safeConfig.DB_NAME,
                MONGO_URI: safeConfig.MONGO_URI,
                hasCloudinary: !!envConfig.CLOUDINARY_CLOUD_NAME,
                hasSmtp: !!envConfig.SMTP_HOST,
                hasTwilio: !!envConfig.TWILIO_ACCOUNT_SID,
                hasGoogleOAuth: !!envConfig.GOOGLE_CLIENT_ID,
                hasFacebookOAuth: !!envConfig.FACEBOOK_APP_ID
            }
        });
    } catch (error) {
        if (error instanceof EnvValidationError) {
            // Log detailed validation error and exit
            console.error('\n❌ ENVIRONMENT VALIDATION FAILED');
            console.error('━'.repeat(50));
            console.error(error.message);
            console.error('━'.repeat(50));
            console.error('\nPlease check your .env file and ensure all required variables are set correctly.');
            console.error('See .env.example for reference.\n');
            process.exit(1);
        }
        // Re-throw unexpected errors
        throw error;
    }

    const PORT = envConfig.PORT || 8080;

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