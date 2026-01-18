# 1. Base Stage: Setup Node.js and PNPM
FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# 2. Build Stage: Install deps and build source
FROM base AS build
WORKDIR /app

# Copy root workspace files for dependency resolution
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy backend2 specific config
COPY apps/backend2/package.json ./apps/backend2/package.json

# Copy shared packages config
COPY packages/shared-types/package.json ./packages/shared-types/package.json

# Install dependencies
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# Copy the rest of the backend2 source code
COPY apps/backend2 ./apps/backend2
COPY packages/shared-types ./packages/shared-types

# Build shared-types
WORKDIR /app/packages/shared-types
RUN pnpm run build

# Build the backend2
WORKDIR /app/apps/backend2
RUN pnpm run build

# Go back to root to deploy
WORKDIR /app
# Prepare production deployment (isolates only needed files)
RUN pnpm --filter backend2 deploy --prod /prod/backend2

# Copy built 'dist' folder to the deployment
# My tsconfig outputs to ./dist, so we copy from apps/backend2/dist to /prod/backend2/dist
RUN cp -r apps/backend2/dist /prod/backend2/dist
# Copy drizzle migrations folder
RUN cp -r apps/backend2/drizzle /prod/backend2/drizzle

# 3. Runner Stage: Final minimal image
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

# Security: Run as non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 backenduser

# Copy ready-to-run application from build stage
COPY --from=build --chown=backenduser:nodejs /prod/backend2 ./

USER backenduser

# Expose ports
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["sh", "-c", "node dist/migrate.js && node dist/index.js"]
