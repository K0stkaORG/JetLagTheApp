# apps/backend/Dockerfile

# 1. Base Stage: Setup Node.js and PNPM
FROM node:22-alpine AS base
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

# Install dependencies (utilizing cache)
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# Copy the rest of the backend source code
COPY apps/backend ./apps/backend

# Build the backend
RUN pnpm --filter backend build

# Prepare production deployment (isolates only needed files)
RUN pnpm --filter backend deploy --prod --legacy /prod/backend
# Copy built 'dist' folder to the deployment
RUN cp -r apps/backend/dist /prod/backend/dist

# 3. Runner Stage: Final minimal image
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

# Security: Run as non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 backenduser

# Copy ready-to-run application from build stage
COPY --from=build --chown=backenduser:nodejs /prod/backend ./

USER backenduser

# Expose ports (Ensure these match your ENV variables)
EXPOSE 3000
EXPOSE 3001

CMD ["node", "dist/src/index.js"]
