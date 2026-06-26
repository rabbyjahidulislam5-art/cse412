# ── Backend Dockerfile ───────────────────────────────────────────
# Multi-stage build for Express.js production image

# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install

# Stage 2: Build TypeScript
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npx tsc --outDir ./dist

# Stage 3: Production
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 appgroup
RUN adduser --system --uid 1001 appuser

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./

USER appuser
EXPOSE 5000

CMD ["node", "dist/server.js"]
