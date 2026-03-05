FROM node:22-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package*.json ./
COPY packages/config/package.json packages/config/
COPY packages/db/package.json packages/db/
COPY packages/env/package.json packages/env/
COPY packages/queue/package.json packages/queue/
COPY packages/scraper/package.json packages/scraper/
COPY apps/worker/package.json apps/worker/
RUN npm install

FROM base AS runner
COPY --from=deps /app/node_modules ./node_modules
COPY . .
CMD ["node", "--import=tsx/esm", "apps/worker/src/index.ts"]
