# syntax=docker/dockerfile:1.7

# ============================================================================
# Production-optimized Dockerfile for NestJS Server (pnpm monorepo)
# ============================================================================
# Features:
# - Multi-stage build for minimal image size (~150MB final)
# - BuildKit cache for faster rebuilds
# - Security: Non-root user, minimal base image
# - Prisma client generation with proper caching
# - Health check for container orchestration
# ============================================================================

# ---------- Stage 1: Base (shared dependencies) ----------
FROM node:20-alpine AS base

# Install pnpm via corepack (official method)
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.25.0 --activate

# Install build dependencies only when needed
RUN apk add --no-cache libc6-compat

WORKDIR /usr/src/app

# ---------- Stage 2: Dependencies (cached layer) ----------
FROM base AS deps

# Copy workspace configuration files (best caching strategy)
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./

# Copy only server package.json (affects dependency resolution)
COPY apps/server/package.json apps/server/package.json

# Install dependencies with BuildKit cache mount
# This layer is cached unless lockfile or package.json changes
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile --filter=server

# ---------- Stage 3: Prisma Client Generation ----------
FROM deps AS prisma

# Copy Prisma schema and config
COPY apps/server/prisma ./apps/server/prisma/
COPY apps/server/prisma.config.ts ./apps/server/

# Generate Prisma Client (cached unless schema changes)
# Output goes to apps/server/src/generated as per schema.prisma
RUN cd apps/server && \
    pnpm exec prisma generate

# ---------- Stage 4: Build Application ----------
FROM prisma AS build

# Copy source code (changes frequently, so placed after deps)
COPY apps/server ./apps/server

# Build the application
# NestJS compiles TypeScript to JavaScript in dist/
RUN pnpm --filter=server run build

# Verify build output exists
RUN test -f apps/server/dist/main.js || (echo "Build failed: main.js not found" && exit 1)

# ---------- Stage 5: Production Dependencies Only ----------
FROM base AS prod-deps

# Copy workspace files
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/server/package.json apps/server/package.json

# Install only production dependencies
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile --filter=server --prod

# Generate Prisma Client for production (needed at runtime)
COPY apps/server/prisma ./apps/server/prisma/
COPY apps/server/prisma.config.ts ./apps/server/
RUN cd apps/server && \
    pnpm exec prisma generate

# ---------- Stage 6: Runtime (final minimal image) ----------
FROM node:20-alpine AS runner

# Security: Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

# Install runtime dependencies
RUN apk add --no-cache \
    libc6-compat \
    openssl \
    && rm -rf /var/cache/apk/*

WORKDIR /app

# Copy production dependencies from prod-deps stage
COPY --from=prod-deps --chown=nestjs:nodejs /usr/src/app/node_modules ./node_modules
COPY --from=prod-deps --chown=nestjs:nodejs /usr/src/app/apps/server/node_modules ./apps/server/node_modules
COPY --from=prod-deps --chown=nestjs:nodejs /usr/src/app/apps/server/src/generated ./apps/server/src/generated

# Copy built application from build stage
COPY --from=build --chown=nestjs:nodejs /usr/src/app/apps/server/dist ./dist
COPY --from=build --chown=nestjs:nodejs /usr/src/app/apps/server/package.json ./package.json

# Copy Prisma schema (needed for migrations at runtime if needed)
COPY --from=build --chown=nestjs:nodejs /usr/src/app/apps/server/prisma ./prisma

# Set production environment
ENV NODE_ENV=production
ENV PORT=4000

# Expose port
EXPOSE 4000

# Health check (checks /api/health endpoint)
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:4000/api/health/liveness', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Switch to non-root user
USER nestjs

# Use node directly (faster than npm/pnpm for production)
CMD ["node", "dist/main.js"]
