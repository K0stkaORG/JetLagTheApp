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

# Copy backend specific config
COPY apps/backend/package.json ./apps/backend/package.json

# Copy admin-panel specific config
COPY apps/admin-panel/package.json ./apps/admin-panel/package.json

# Copy shared packages config
COPY packages/shared-types/package.json ./packages/shared-types/package.json

# Install dependencies
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# Copy the rest of the backend source code
COPY apps/backend ./apps/backend
COPY apps/admin-panel ./apps/admin-panel
COPY packages/shared-types ./packages/shared-types

# Build shared-types
WORKDIR /app/packages/shared-types
RUN pnpm run build

# Build admin-panel
WORKDIR /app/apps/admin-panel
RUN pnpm run build

# Build the backend
WORKDIR /app/apps/backend
RUN pnpm run build

# Go back to root to deploy
WORKDIR /app
# Prepare production deployment (isolates only needed files)
RUN pnpm --filter backend deploy --prod /prod/backend

# Copy built 'dist' folder to the deployment
# My tsconfig outputs to ./dist, so we copy from apps/backend/dist to /prod/backend/dist
RUN cp -r apps/backend/dist /prod/backend/dist
# Copy drizzle migrations folder
RUN cp -r apps/backend/drizzle /prod/backend/drizzle

# Copy built admin-panel to a structure backend expects
RUN mkdir -p /prod/admin-panel
RUN cp -r apps/admin-panel/dist /prod/admin-panel/dist

# 3. Runner Stage: Final minimal image
FROM base AS runner
WORKDIR /app/backend
ENV NODE_ENV=production


# Security: Run as non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 backenduser

# Copy ready-to-run application from build stage
COPY --from=build --chown=backenduser:nodejs /prod/backend ./
COPY --from=build --chown=backenduser:nodejs /prod/admin-panel ../admin-panel

USER backenduser

# Expose ports
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["sh", "-c", "node dist/migrate.js && node dist/index.js"]
