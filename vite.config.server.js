import { defineConfig } from "vite";
import path from "path";

// Server build configuration (JavaScript version)
export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, "server/node-build.js"), // JS entry
      name: "server",
      fileName: "production",
      formats: ["es"],          // output as .mjs
    },

    outDir: "dist/server",
    target: "node22",
    ssr: true,

    rollupOptions: {
      external: [
        // Built-in Node modules
        "fs", "path", "url", "http", "https",
        "os", "crypto", "stream", "util", "events",
        "buffer", "querystring", "child_process",

        // External libs (kept as imports)
        "express",
        "cors",
      ],

      output: {
        format: "es",
        entryFileNames: "[name].mjs",
        chunkFileNames: "[name].mjs",
      },
    },

    minify: false,   // easier to debug
    sourcemap: true, // includes .map files
  },

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client/src"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },

  define: {
    "process.env.NODE_ENV": '"production"',
  },
});
