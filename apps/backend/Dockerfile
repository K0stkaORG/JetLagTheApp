# syntax=docker/dockerfile:1.7
FROM node:20-bookworm-slim AS base

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

RUN corepack enable

FROM base AS deps
WORKDIR /app

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/backend/package.json apps/backend/package.json
COPY packages/shared-types/package.json packages/shared-types/package.json
COPY apps/admin-panel/package.json apps/admin-panel/package.json

RUN pnpm install --frozen-lockfile

FROM deps AS build
COPY apps/backend apps/backend
COPY packages/shared-types packages/shared-types
COPY apps/admin-panel apps/admin-panel

RUN pnpm -w --filter @jetlag/shared-types build
RUN pnpm -w --filter backend build
RUN pnpm -w --filter admin-panel build

FROM base AS runtime
WORKDIR /app

ENV NODE_ENV=production

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/backend/package.json apps/backend/package.json
COPY packages/shared-types/package.json packages/shared-types/package.json
COPY apps/admin-panel/package.json apps/admin-panel/package.json

RUN pnpm install --frozen-lockfile --prod --filter backend...

COPY --from=build /app/apps/backend/dist apps/backend/dist
COPY --from=build /app/apps/backend/drizzle apps/backend/drizzle
COPY --from=build /app/apps/backend/.env.example apps/backend/.env.example
COPY --from=build /app/apps/admin-panel/dist apps/admin-panel/dist

WORKDIR /app/apps/backend
EXPOSE 3000

CMD ["/bin/sh", "-c", "node dist/migrate.js && node dist/index.js"]
