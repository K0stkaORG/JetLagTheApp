# syntax=docker/dockerfile:1.7
FROM node:24-bookworm-slim AS base

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

RUN corepack enable

# ── deps: install all workspace dependencies ──────────────────────────────────
# This layer only rebuilds when package.json files or the lockfile change.
FROM base AS deps
WORKDIR /app

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/backend/package.json apps/backend/package.json
COPY packages/shared-types/package.json packages/shared-types/package.json
COPY apps/admin-panel/package.json apps/admin-panel/package.json

RUN pnpm install --frozen-lockfile

# ── shared-types build ────────────────────────────────────────────────────────
# This layer only rebuilds when packages/shared-types source changes.
FROM deps AS build-shared
COPY packages/shared-types packages/shared-types
RUN pnpm -w --filter @jetlag/shared-types build

# ── backend build ─────────────────────────────────────────────────────────────
# This layer only rebuilds when backend source OR shared-types changes.
FROM build-shared AS build-backend
COPY apps/backend apps/backend
RUN pnpm -w --filter backend build

# ── admin-panel build ─────────────────────────────────────────────────────────
# This layer only rebuilds when admin-panel source OR shared-types changes.
FROM build-shared AS build-admin
COPY apps/admin-panel apps/admin-panel
RUN pnpm -w --filter admin-panel build

# ── runtime ───────────────────────────────────────────────────────────────────
FROM base AS runtime
WORKDIR /app

ENV NODE_ENV=production

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/backend/package.json apps/backend/package.json
COPY packages/shared-types/package.json packages/shared-types/package.json
COPY apps/admin-panel/package.json apps/admin-panel/package.json

RUN pnpm install --frozen-lockfile --prod --filter backend...

COPY --from=build-backend /app/apps/backend/dist apps/backend/dist
COPY --from=build-backend /app/apps/backend/drizzle apps/backend/drizzle
COPY --from=build-backend /app/apps/backend/.env.example apps/backend/.env.example
COPY --from=build-admin /app/apps/admin-panel/dist apps/admin-panel/dist

WORKDIR /app/apps/backend
EXPOSE 3000

CMD ["/bin/sh", "-c", "node dist/migrate.js && node dist/index.js"]

