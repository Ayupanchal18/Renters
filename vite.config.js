import { defineConfig } from "vite";
// Forced restart at 2026-05-02T14:55:00Z
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  root: "./client",
  publicDir: "public",
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    // Use esbuild for minification (built-in, faster)
    minify: 'esbuild',
    // Code splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks - split large dependencies
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'redux-vendor': ['react-redux', '@reduxjs/toolkit'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select', '@radix-ui/react-tabs', '@radix-ui/react-tooltip'],
        },
        // Optimize chunk file names
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 500,
    // Enable CSS code splitting
    cssCodeSplit: true,
    // No source maps in production
    sourcemap: false,
  },
  server: {
    host: true,
    port: 8080,
    // Disable HMR to fix React context issues - use full page reload instead
    hmr: false,
    watch: {
      usePolling: true,
    },
    // Disable browser caching to prevent stale module issues
    headers: {
      'Cache-Control': 'no-store',
    },
  },
  cacheDir: "node_modules/.vite",

  plugins: [
    react({
      include: /\.(js|jsx|ts|tsx)$/,
    }),
    expressPlugin(),
    {
      name: 'force-full-reload',
      handleHotUpdate({ file, server }) {
        if (file.includes('/pages/') || file.includes('/hooks/') || file.includes('/components/')) {
          server.ws.send({ type: 'full-reload' });
          return [];
        }
      }
    }
  ],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client/src"),
      "@shared": path.resolve(__dirname, "./shared"),
      // Force single React instance
      'react': path.resolve(__dirname, './node_modules/react'),
      'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
    },
    dedupe: ['react', 'react-dom', 'react-redux', '@reduxjs/toolkit', 'react-router-dom'],
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-redux', '@reduxjs/toolkit', 'react-router-dom'],
    // Force re-optimization to fix HMR issues
    force: true,
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
  },
  esbuild: {
    loader: "jsx",
    include: /src\/.*\.[jt]sx?$/,
    exclude: [],
  },

  define: {
    global: 'globalThis',
  },
});

function expressPlugin() {
  return {
    name: "express-plugin",
    apply: "serve",

    async configureServer(server) {
      const fs = await import("fs");
      const path = await import("path");
      const debugFile = path.join(process.cwd(), "debug.log");
      fs.appendFileSync(debugFile, `[VITE.CONFIG] configureServer running at ${new Date().toISOString()}\n`);
      try {
        // MUST be dynamic import
        const { default: createServer } = await import("./server/index.js");
        const { setupSocket } = await import("./server/socket.js");

        const app = await createServer(true);

        server.middlewares.use(app);
        
        // Attach Socket.IO to Vite's http server
        if (server.httpServer) {
          setupSocket(server.httpServer);
          console.log("✅ Socket.IO attached to Vite server");
        }
      } catch (err) {
        console.error("Express setup error:", err);
      }
    },
  };
}
