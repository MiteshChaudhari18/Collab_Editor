FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Create persistence directory
RUN mkdir -p persistence

# Expose port
EXPOSE 1234

# Start server
CMD ["npm", "start"]

