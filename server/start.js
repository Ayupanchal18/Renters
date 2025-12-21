import createServer from "./index.js";

const PORT = process.env.PORT || 8080;

async function startServer() {
    try {
        const { app } = await createServer(false);

        app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
            console.log(`📡 API available at http://localhost:${PORT}/api`);
        });
    } catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
}

startServer();