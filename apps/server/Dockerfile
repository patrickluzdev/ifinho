FROM node:22-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
COPY packages/config/package.json ./packages/config/package.json
COPY packages/db/package.json ./packages/db/package.json
COPY packages/env/package.json ./packages/env/package.json
COPY apps/server/package.json ./apps/server/package.json
RUN npm ci

FROM deps AS builder
COPY packages/ ./packages/
COPY apps/server/ ./apps/server/
COPY tsconfig.json ./tsconfig.json
RUN npm run build --workspace=server

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/apps/server/dist ./apps/server/dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/server/node_modules ./apps/server/node_modules
COPY --from=builder /app/packages/db/src/migrations ./packages/db/src/migrations

EXPOSE 3000
CMD ["node", "apps/server/dist/index.mjs"]
