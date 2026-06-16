#!/bin/sh
set -e

if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL is not set. Link Railway Postgres to this service."
  exit 1
fi

echo "Applying Prisma schema..."
npx prisma db push --schema=../../prisma/schema.prisma --skip-generate

echo "Starting DCP API on port ${PORT:-4000}..."
exec node dist/api/src/main.js