FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy all source files
COPY . .

# Build client
RUN npm run build

# Debug: verify build output exists
RUN ls -la dist/ && ls -la dist/assets/ || echo "Build output missing!"

# Expose port
EXPOSE 8080

# Start server
CMD ["node", "server/start.js"]
