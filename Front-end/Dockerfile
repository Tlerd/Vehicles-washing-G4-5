FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies using legacy-peer-deps to avoid ERESOLVE conflicts
RUN npm install --legacy-peer-deps

# Copy application source
COPY . .

# Expose Vite dev server port
EXPOSE 3000

# Run development server
CMD ["npm", "run", "dev"]
