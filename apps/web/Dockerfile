FROM node:22-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
COPY packages/config/package.json ./packages/config/package.json
COPY packages/env/package.json ./packages/env/package.json
COPY apps/web/package.json ./apps/web/package.json
RUN npm ci

FROM deps AS builder
COPY packages/ ./packages/
COPY apps/web/ ./apps/web/
COPY tsconfig.json ./tsconfig.json
ARG VITE_SERVER_URL=http://localhost:3000
ENV VITE_SERVER_URL=$VITE_SERVER_URL
RUN npm run build --workspace=web

FROM nginx:alpine AS runner
COPY --from=builder /app/apps/web/build/client /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
