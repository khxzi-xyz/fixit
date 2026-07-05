FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the NestJS app
RUN npm run build

# Expose the port
EXPOSE 3000

# Start the server
CMD ["npm", "run", "start:prod"]
