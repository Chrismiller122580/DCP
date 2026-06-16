# DCP API — production image (monorepo)
FROM node:20-alpine AS builder

# Prisma engine requires OpenSSL on Alpine (missing by default)
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app
COPY package.json package-lock.json turbo.json tsconfig.json ./
COPY packages ./packages
COPY apps ./apps
COPY prisma ./prisma

RUN npm ci
RUN npx turbo run build --filter=@dcp/api
RUN npx prisma generate --schema=prisma/schema.prisma

FROM node:20-alpine AS runner

RUN apk add --no-cache openssl libc6-compat

WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/prisma ./prisma

WORKDIR /app/packages/api
EXPOSE 4000

CMD ["sh", "-c", "npx prisma db push --schema=../../prisma/schema.prisma && node dist/api/src/main.js"]