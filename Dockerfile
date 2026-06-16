# DCP API — production image (monorepo)
# Debian slim avoids Prisma/OpenSSL issues common on Alpine.
FROM node:20-slim AS builder

RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json package-lock.json turbo.json tsconfig.json ./
COPY packages ./packages
COPY apps ./apps
COPY prisma ./prisma

RUN npm ci
RUN npx turbo run build --filter=@dcp/api
RUN npx prisma generate --schema=prisma/schema.prisma

FROM node:20-slim AS runner

RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/prisma ./prisma
COPY scripts/docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

WORKDIR /app/packages/api
EXPOSE 4000

ENTRYPOINT ["/app/docker-entrypoint.sh"]