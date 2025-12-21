FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all source files
COPY . .

# Build client
RUN npm run build

# Expose port
EXPOSE 8080

# Start server
CMD ["node", "server/start.js"]
