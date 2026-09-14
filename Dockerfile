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

# COPY server source (server.ts + server/ TS files are compiled into dist by
# vite build; runtime writes go to /app/server/data snapshot JSON)
# CYBERPOOL FIX (P1 #5 — persistence): trước đây runtime USER node chạy nhưng
# /app/server/data không tồn tại/không chown → snapshot mkdir/write lỗi quyền
# (EACCES), và không có volume nên recreate container là mất hết balance/orders.
RUN mkdir -p /app/server/data \
    && chown -R node:node /app \
    && chmod 750 /app/server/data
VOLUME ["/app/server/data"]

# Non-root security user
USER node

EXPOSE 3000

CMD ["node", "dist/server.cjs"]
