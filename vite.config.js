import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  server: {
    host: "::",
    port: 8080,
  },

  plugins: [
    react(),
    expressPlugin()  // ⬅️ fixed
  ],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
});

function expressPlugin() {
  return {
    name: "express-plugin",
    apply: "serve",

    async configureServer(server) {
      try {
        // MUST be dynamic import
        const { default: createServer } = await import("./server/index.js");

        const app = await createServer(true);

        server.middlewares.use(app);
      } catch (err) {
        console.error("Express setup error:", err);
      }
    },
  };
}
