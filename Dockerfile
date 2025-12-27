FROM node:22.16-alpine

WORKDIR /app

# Cache bust: v9 - Add rent debug endpoint
ARG CACHEBUST=9
RUN echo "Build version: ${CACHEBUST}"

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
