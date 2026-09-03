# Multi-stage build for production
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency configs
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build Vite frontend & compile TypeScript backend
RUN npm run build

# Production runtime stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install production dependencies only
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# Copy build artifacts
COPY --from=builder /app/dist ./dist

# Non-root security user
USER node

EXPOSE 3000

CMD ["node", "dist/server.cjs"]
