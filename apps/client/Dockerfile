# syntax=docker/dockerfile:1.7

# ============================================================================
# Production-optimized Dockerfile for Next.js Client (pnpm monorepo)
# ============================================================================
# Features:
# - Multi-stage build for minimal image size (~200MB final with standalone)
# - Next.js standalone output for optimal performance
# - BuildKit cache for faster rebuilds
# - Security: Non-root user, minimal base image
# - Health check for container orchestration
# ============================================================================

# ---------- Stage 1: Base (shared dependencies) ----------
FROM node:20-alpine AS base

# Install pnpm via corepack (official method)
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.25.0 --activate

# Install build dependencies
RUN apk add --no-cache \
    libc6-compat \
    && rm -rf /var/cache/apk/*

WORKDIR /usr/src/app

# ---------- Stage 2: Dependencies (cached layer) ----------
FROM base AS deps

# Copy workspace configuration files (best caching strategy)
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./

# Copy only client package.json (affects dependency resolution)
COPY apps/client/package.json apps/client/package.json

# Install dependencies with BuildKit cache mount
# This layer is cached unless lockfile or package.json changes
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile --filter=client

# ---------- Stage 3: Build Application ----------
FROM deps AS build

# Copy source code and configuration
COPY apps/client ./apps/client

# Set build-time environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Build arguments (can be passed from CI/CD)
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_ENV
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_ENV=${NEXT_PUBLIC_ENV}

# Build Next.js application with standalone output
# This creates .next/standalone/ directory with minimal runtime
RUN pnpm --filter=client run build

# Verify build output exists
RUN test -d apps/client/.next/standalone || (echo "Build failed: standalone output not found. Ensure output: 'standalone' is set in next.config.mjs" && exit 1)

# ---------- Stage 4: Production Runtime (minimal image) ----------
FROM node:20-alpine AS runner

# Security: Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Install runtime dependencies (minimal)
RUN apk add --no-cache \
    libc6-compat \
    curl \
    && rm -rf /var/cache/apk/*

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Copy standalone server files (minimal runtime)
COPY --from=build --chown=nextjs:nodejs /usr/src/app/apps/client/.next/standalone ./

# Copy static files (required for Next.js)
COPY --from=build --chown=nextjs:nodejs /usr/src/app/apps/client/.next/static ./apps/client/.next/static/

# Copy public assets (images, fonts, etc.)
COPY --from=build --chown=nextjs:nodejs /usr/src/app/apps/client/public ./apps/client/public/

# Expose port
EXPOSE 3000

# Health check (checks root endpoint)
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000/ || exit 1

# Switch to non-root user
USER nextjs

# Start the standalone Next.js server
# The standalone output includes a server.js in the apps/client directory
WORKDIR /app/apps/client
CMD ["node", "server.js"]
