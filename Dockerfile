FROM node:22.16-alpine

WORKDIR /app

# Cache bust: v2 - Force fresh Tailwind build
RUN echo "Build version: 2"

# Verify Node version
RUN node --version && npm --version

# Copy package files
COPY package*.json ./

# Install dependencies (no cache)
RUN npm install --legacy-peer-deps

# Copy all source files
COPY . .

# Clean any previous build and rebuild
RUN rm -rf dist && npm run build

# Debug: verify build output exists
RUN ls -la dist/ && ls -la dist/assets/ || echo "Build output missing!"

# Expose port
EXPOSE 8080

# Start server
CMD ["node", "server/start.js"]
